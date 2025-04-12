import { useQuery, useMutation, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import { getLLMCompletion } from '@/services/LLMService';
import { fetchGameRules, fetchRelevantSectionsFromVectorDb, findRelevantSections } from '@/services/RulesService';
import { gameResponses } from '@/data/games';
import { useSupabase } from '@/context/SupabaseContext';

// Define the structure for the data returned by the rules query
interface GameRulesData {
  game: string;
  rules: any;
  // We might not need sections loaded by default anymore if using vector search only
  // sections: any[]; 
}

// Define the structure for vector search results (matches the service function)
interface VectorSearchResult {
  id: string;
  content: string;
  metadata: Record<string, any>;
  similarity: number;
}

// Define the structure for the variables passed to the mutation
interface AskQuestionVariables {
  question: string;
}

// Define the structure for the returned value of the hook
interface UseGameRulesReturn {
  rulesQuery: UseQueryResult<GameRulesData, Error>;
  askMutation: UseMutationResult<string, Error, AskQuestionVariables, unknown>;
  getFallbackResponse: (question: string) => string;
}

const buildPrompt = (gameName: string, question: string, sections: VectorSearchResult[]): string => {
  // Format the context from vector search results
  const context = sections
    .map(section => {
      // Attempt to create a title from metadata, fallback if needed
      const title = section.metadata?.heading_path?.join(' > ') || section.metadata?.card || 'Relevant Section';
      return `## ${title}\n${section.content}`;
    })
    .join('\n\n');
  
  // Calculate average similarity to help the LLM understand context quality
  const avgSimilarity = sections.reduce((sum, section) => sum + section.similarity, 0) / sections.length;
  const contextQualityNote = avgSimilarity < 0.6 
    ? "\n\nNOTE: The provided information may have low relevance to the question. Be cautious in your response."
    : "";
    
  return `
You are a helpful assistant for the board game "${gameName}".

The user asked: "${question}"

Here is the relevant information:${contextQualityNote}

${context}

**Your Role:** You are an expert assistant for the board game Arcs. Your goal is to provide accurate, concise answers.

**CRITICAL: NEVER INVENT OR HALLUCINATE INFORMATION. If the provided content doesn't explicitly mention something (like specific resource types, actions, etc.), DO NOT make it up. Instead, clearly state that this information isn't provided in the available content.**

**Instructions:**

1. **First, Evaluate Information Completeness:** Before answering, determine if the provided information contains a clear, explicit answer to the question. If it doesn't, you must say so rather than guessing.

2. **Answer Directly:** Get straight to the answer without mentioning sources or where information comes from.

3. **Answer Succinctly:** Answer the question as succinctly as possible. Do not attempt to answer related questions.

4. **Prioritize Official Information:** If information from errata or FAQs is included, prioritize that over other information.

5. **Specificity Check:** For questions asking about specific game elements (like "what are the 5 resource types?"), ONLY provide the answer if it's explicitly stated in the information provided. Do not try to deduce or guess these details.

**Handling Uncertain or Missing Information:**

6. **For Partial Information:** If you only have part of what's needed, clearly state what you know and what you don't:
   "[Direct answer for what is known]. This doesn't specifically address [what's missing]."

7. **For Tangential Information:** If your information is related but doesn't directly answer:
   "This doesn't explicitly address [specific question]. However, related concepts indicate that [tangential information]."

8. **For No Relevant Information:** If nothing relevant is available, be straightforward:
   "The available information doesn't specifically address [question]. I cannot provide details about [specific topic] without risking inaccuracy."

9. **Confidence Indicator:** End your response with:
   "Confidence: [Level]" where Level is:
   - High: ONLY use when the information explicitly and completely answers the question
   - Medium: Information addresses the question but requires some interpretation
   - Low: Limited information or significant parts of the answer aren't covered

10. **Formatting:**
    * Use bullet points for lists or step-by-step processes.
    * **Bold** key game terms, card names, or action names.

11. **Exclusions:**
    * Do NOT include phrases like "Based on the information..." or refer to any sources.
    * Do NOT refer to page numbers or document names.
    * Never apologize for lack of information.

**Example of Correct "I Don't Know" Response:**

Question: "What are the 5 resource types in the game?"
Good Answer: "The available information doesn't specifically list all 5 resource types. I cannot provide a complete list without risking inaccuracy.

Confidence: Low"

Bad Answer (NEVER DO THIS): "The 5 resource types are Gold, Wood, Stone, Iron, and Crystal.

Confidence: High"

Remember that the user is in the middle of a game and needs clear, direct answers, but accuracy is more important than completeness.
`;
};

export function useGameRules(gameId: string): UseGameRulesReturn {
  // Get Supabase client via hook - this is safe here
  const { supabase } = useSupabase(); 

  // Query to fetch basic game info (e.g., game name). 
  // We might not need the full rules sections if only using vector search.
  // Consider creating a lighter fetch function if fetchGameRules loads too much.
  const rulesQuery = useQuery<GameRulesData, Error>({
    queryKey: ['gameBaseInfo', gameId], // Adjusted key if only loading base info
    queryFn: async () => { 
        // If fetchGameRules loads everything, extract just the game name?
        // Or create a new service function fetchGameBaseInfo(gameId)
        const rules = await fetchGameRules(gameId); 
        return { game: rules?.game || 'Unknown Game', rules }; // Return full rules for text search
    },
    enabled: !!gameId, 
    staleTime: Infinity, 
    gcTime: Infinity,    
  });

  // Mutation to ask question using hybrid search for context
  const askMutation = useMutation<string, Error, AskQuestionVariables>({
    mutationFn: async ({ question }: AskQuestionVariables) => {
      // Ensure game name is available (needed for prompt)
      const gameName = rulesQuery.data?.game;
      if (!gameName) {
        throw new Error('Game information not loaded yet.'); 
      }

      // Step 1: Perform vector search
      console.log(`[Hybrid Search] Vector search for: "${question}"`);
      let vectorResults = await fetchRelevantSectionsFromVectorDb(supabase, question);
      console.log(`[Hybrid Search] Vector search returned ${vectorResults.length} results`);
      
      // For conceptual questions like "how to win", do a second search with broader terms
      if (vectorResults.length < 2) {
        const broadQuery = question.toLowerCase().includes("win") ? 
          "victory conditions win game objective" : question;
        
        if (broadQuery !== question) {
          console.log(`[Hybrid Search] Broadening vector search with: "${broadQuery}"`);
          const additionalSections = await fetchRelevantSectionsFromVectorDb(supabase, broadQuery);
          console.log(`[Hybrid Search] Broadened search returned ${additionalSections.length} results`);
          
          vectorResults = [...vectorResults, ...additionalSections];
          // Deduplicate if needed by ID
          vectorResults = vectorResults.filter((section, index, self) => 
            index === self.findIndex((s) => s.id === section.id)
          );
          console.log(`[Hybrid Search] Total unique vector results: ${vectorResults.length}`);
        }
      }
      
      // Step 2: Perform text search using existing functionality
      console.log(`[Hybrid Search] Performing text search for: "${question}"`);
      // Get the rules data (using either from rulesQuery or fetch it if needed)
      const rulesData = rulesQuery.data?.rules || await fetchGameRules(gameId);
      const textResults = findRelevantSections(rulesData, question);
      console.log(`[Hybrid Search] Text search returned ${textResults.length} results`);
      
      // Step 3: Convert text results to match vector result format
      const formattedTextResults: VectorSearchResult[] = textResults.map((item, index) => ({
        id: `text-${index}`,
        content: typeof item.content === 'string' ? item.content : JSON.stringify(item.content),
        metadata: {
          source_heading: item.title,
          headings: [item.title],
          content_type: item.sourceType?.toLowerCase() || 'other',
          source: 'text_search'
        },
        similarity: 0.7 - (index * 0.05) // Assign decreasing similarity scores
      }));
      
      // Step 4: Combine and deduplicate results
      const allResults = [...vectorResults];
      
      // Add text results, avoiding duplicates
      for (const textResult of formattedTextResults) {
        // Simple deduplication check based on content
        const isDuplicate = vectorResults.some(vr => {
          const vrPreview = vr.content.substring(0, 100).toLowerCase();
          const trPreview = textResult.content.substring(0, 100).toLowerCase();
          return vrPreview.includes(trPreview) || trPreview.includes(vrPreview);
        });
        
        if (!isDuplicate) {
          allResults.push(textResult);
        }
      }
      
      // Sort by similarity and take top results
      const finalResults = allResults
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 8);
      
      // Log combined results for debugging
      console.log(`[Hybrid Search] Final combined results: ${finalResults.length}`);
      finalResults.forEach((result, i) => {
        const source = result.id.toString().startsWith('text') ? 'text search' : 'vector search';
        console.log(`Result #${i+1}: similarity=${result.similarity.toFixed(2)}, source=${source}`);
        console.log(`Content preview: ${result.content.substring(0, 100).replace(/\n/g, ' ')}...`);
      });

      if (finalResults.length > 0) {
        // Use combined results to build prompt
        const prompt = buildPrompt(gameName, question, finalResults);
        const response = await getLLMCompletion({ prompt }); 
        return response;
      } else {
        // Fallback if no results found
        return getFallbackResponse(question); 
      }
    },
  });

  // Function to get the static fallback response
  const getFallbackResponse = (question: string): string => {
    const gameSpecificResponses = gameResponses[gameId] || gameResponses.default;
    const normalizedQuery = question.toLowerCase();
    
    for (const [keyword, response] of Object.entries(gameSpecificResponses)) {
      if (keyword !== 'default' && normalizedQuery.includes(keyword)) {
        return response;
      }
    }
    
    // Override default response with our custom message
    return "I'm not able to answer your question.";
  };

  return {
    rulesQuery,     
    askMutation,    
    getFallbackResponse 
  };
} 