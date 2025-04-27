import { useQuery, useMutation, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import { getLLMCompletion } from '@/services/LLMService';
import { fetchGameRules, fetchRelevantSectionsFromVectorDb, findRelevantSections } from '@/services/RulesService';
import { preprocessQuery } from '@/services/QueryPreprocessorService';
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

**CRITICAL: NEVER INVENT OR HALLUCINATE INFORMATION. If information is truly missing and cannot be reasonably deduced from the provided content, state that it isn't provided.**

**Reasoning and Problem-Solving Approach:**

1. **Systematic Analysis:** First identify ALL relevant rules and information pieces from the provided context.
   
2. **Connect Related Concepts:** Consider how these rules interact with each other and form logical connections.
   
3. **Step-by-Step Reasoning:** When appropriate, use step-by-step reasoning to reach conclusions:
   - For counting questions (e.g., "How many X are there?"), list all instances found and then count them
   - For rules interactions, explain how different rules work together
   - For complex scenarios, break down into component parts

4. **Logical Deduction:** Make reasonable deductions based on rule combinations. Be confident in conclusions that logically follow from the rules, even if not explicitly stated.

5. **Enumerate When Appropriate:** For questions about quantities or lists, explicitly enumerate all relevant items before drawing conclusions.

**Original Instructions (Still Apply):**

1. **Evaluate Information Completeness:** Before answering, determine if the provided information contains a clear answer to the question, either explicit or through logical deduction.

2. **Answer Directly:** Get straight to the answer without mentioning sources or where information comes from.

3. **Answer Succinctly:** Answer the question as succinctly as possible. Do not attempt to answer related questions.

4. **Prioritize Official Information:** If information from errata or FAQs is included, prioritize that over other information.

**Handling Uncertain or Missing Information:**

5. **For Partial Information:** If you only have part of what's needed, clearly state what you know and what you don't:
   "[Direct answer for what is known]. This doesn't specifically address [what's missing]."

6. **For Tangential Information:** If your information is related but doesn't directly answer:
   "While not explicitly stated, I can determine that [reasoned answer] because [explanation of reasoning]."

7. **For No Relevant Information:** Only if no relevant information is available AND no reasonable deduction can be made:
   "The available information doesn't provide sufficient basis to answer [question], even through deduction."

8. **Confidence Indicator:** End your response with:
   "Confidence: [Level]" where Level is:
   - High: Information explicitly answers OR clear logical deduction is possible
   - Medium: Information addresses the question but requires interpretation or inference
   - Low: Limited information or significant parts of the answer require substantial reasoning

9. **Formatting:**
    * Use bullet points for lists or step-by-step processes.
    * **Bold** key game terms, card names, or action names.

10. **Exclusions:**
    * Do NOT include phrases like "Based on the information..." or refer to any sources.
    * Do NOT refer to page numbers or document names.
    * Never apologize for lack of information.

**Examples of Good Reasoning:**

Example 1: "How many Union cards are there?"
Good Answer: "There are 5 Union cards in the game: [Card 1], [Card 2], [Card 3], [Card 4], and [Card 5]. This can be determined by identifying all unique Union cards mentioned in the rules.

Confidence: High"

Example 2: "Can multiple Admin Union cards be played on the same Administration action card?
Good Answer: "No, since an action card can only be claimed by one player,you cannot play multiple Admin Union cards on the same Administration action card."

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

      // Preprocess the query to get improved search terms
      const expandedQueries = preprocessQuery(question);
      console.log(`[Hybrid Search] Using ${expandedQueries.length} query variations`);
      
      // Step 1: Perform vector search with all query variations
      console.log(`[Hybrid Search] Starting vector searches`);
      let allVectorResults: VectorSearchResult[] = [];
      
      // Sequential search using all expanded queries
      for (const expandedQuery of expandedQueries) {
        console.log(`[Hybrid Search] Vector search for: "${expandedQuery}"`);
        const results = await fetchRelevantSectionsFromVectorDb(supabase, expandedQuery);
        console.log(`[Hybrid Search] Found ${results.length} results for variation`);
        
        // Add results to combined set
        allVectorResults = [...allVectorResults, ...results];
      }
      
      // Deduplicate vector results
      const vectorResults = allVectorResults.filter((result, index, self) => 
        index === self.findIndex((r) => r.id === result.id)
      );
      
      console.log(`[Hybrid Search] Total unique vector results: ${vectorResults.length}`);
      
      // For conceptual questions like "how to win", do a second search with broader terms
      if (vectorResults.length < 2) {
        const broadQuery = question.toLowerCase().includes("win") ? 
          "victory conditions win game objective" : question;
        
        if (broadQuery !== question) {
          console.log(`[Hybrid Search] Broadening vector search with: "${broadQuery}"`);
          const additionalSections = await fetchRelevantSectionsFromVectorDb(supabase, broadQuery);
          console.log(`[Hybrid Search] Broadened search returned ${additionalSections.length} results`);
          
          // Add additional results
          const combinedVectorResults = [...vectorResults, ...additionalSections];
          
          // Deduplicate again
          vectorResults.splice(0, vectorResults.length, ...combinedVectorResults.filter((result, index, self) => 
            index === self.findIndex((r) => r.id === result.id)
          ));
          
          console.log(`[Hybrid Search] Total unique vector results after broadening: ${vectorResults.length}`);
        }
      }
      
      // Step 2: Perform text search using existing functionality
      console.log(`[Hybrid Search] Performing text search for original and expanded queries`);
      // Get the rules data (using either from rulesQuery or fetch it if needed)
      const rulesData = rulesQuery.data?.rules || await fetchGameRules(gameId);
      
      // Try text search with both original and expanded queries
      let allTextResults: any[] = [];
      for (const expandedQuery of expandedQueries) {
        const results = findRelevantSections(rulesData, expandedQuery);
        allTextResults = [...allTextResults, ...results];
      }
      
      // Deduplicate text results by title
      const textResults = allTextResults.filter((result, index, self) => 
        index === self.findIndex((r) => r.title === result.title)
      );
      
      console.log(`[Hybrid Search] Text search returned ${textResults.length} unique results`);
      
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