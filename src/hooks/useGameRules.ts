import { useQuery, useMutation, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import { getLLMCompletion } from '@/services/LLMService';
import { fetchGameRules, fetchRelevantSectionsFromVectorDb } from '@/services/RulesService';
import { gameResponses } from '@/data/games';
import { useSupabase } from '@/context/SupabaseContext';

// Define the structure for the data returned by the rules query
interface GameRulesData {
  game: string;
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

**Instructions:**

1. **First, Evaluate Relevance:** Begin by silently assessing how relevant each piece of information is to the question. Don't write this out - it's to help you form a better answer.

2. **Answer Directly:** Get straight to the answer without mentioning sources or where information comes from.

3. **Answer Succinctly:** Answer the question as succinctly as possible. Do not attempt to answer related questions.

4. **Prioritize Official Information:** If information from errata or FAQs is included, prioritize that over other information.

5. **Synthesize Information:** If multiple pieces of information are relevant, combine them into a coherent answer.

**Handling Uncertain or Missing Information:**

6. **For Partial Information:** If you only have part of what's needed, clearly state what you know and what you don't:
   "[Direct answer for what is known]. This doesn't specifically address [what's missing]."

7. **For Tangential Information:** If your information is related but doesn't directly answer:
   "This doesn't explicitly address [specific question]. However, related concepts indicate that [tangential information]."

8. **For No Relevant Information:** If nothing relevant is available, be straightforward:
   "This question isn't covered in the available information. You might want to check about [suggest related area]."

9. **Confidence Indicator:** End your response with:
   "Confidence: [Level]" where Level is:
   - High: Clear, explicit information directly answers the question
   - Medium: Information addresses the question but requires interpretation
   - Low: Limited information or significant inference required

10. **Formatting:**
    * Use bullet points for lists or step-by-step processes.
    * **Bold** key game terms, card names, or action names.

11. **Exclusions:**
    * Do NOT include phrases like "Based on the information..." or refer to any sources.
    * Do NOT refer to page numbers or document names.
    * Avoid unnecessary explanations or flavor text.
    * Never apologize for lack of information.

**Example of Good "I Don't Know Enough" Response:**

Question: "What types of resources are in the game?"
Answer: "The game includes resources that players can collect and use, but the specific resource types aren't detailed in the available information.

Confidence: Low"

Remember that the user is in the middle of a game and needs clear, direct answers.
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
        return { game: rules?.game || 'Unknown Game' }; // Return only needed info
    },
    enabled: !!gameId, 
    staleTime: Infinity, 
    gcTime: Infinity,    
  });

  // Mutation to ask question using vector search for context
  const askMutation = useMutation<string, Error, AskQuestionVariables>({
    mutationFn: async ({ question }: AskQuestionVariables) => {
      // Ensure game name is available (needed for prompt)
      const gameName = rulesQuery.data?.game;
      if (!gameName) {
        throw new Error('Game information not loaded yet.'); 
      }

      // Pass the supabase client instance to the service function
      let relevantSections = await fetchRelevantSectionsFromVectorDb(supabase, question);

      // For conceptual questions like "how to win", do a second search with broader terms
      if (relevantSections.length < 2) {
        const broadQuery = question.toLowerCase().includes("win") ? 
          "victory conditions win game objective" : question;
        
        if (broadQuery !== question) {
          const additionalSections = await fetchRelevantSectionsFromVectorDb(supabase, broadQuery);
          relevantSections = [...relevantSections, ...additionalSections];
          // Deduplicate if needed by ID
          relevantSections = relevantSections.filter((section, index, self) => 
            index === self.findIndex((s) => s.id === section.id)
          );

          // After getting relevantSections
          console.log(`Initial vector search results: ${relevantSections.length}`);

          // After broadening search
          if (broadQuery !== question) {
            console.log(`Broadened search with: "${broadQuery}"`);
            console.log(`Additional results: ${additionalSections.length}`);
            console.log(`Total unique results: ${relevantSections.length}`);
          }
        }
      }

      // Before checking if we got results
      console.log(`Final relevant sections: ${relevantSections.length}`);

      if (relevantSections && relevantSections.length > 0) {
        // Use vector search results to build prompt
        const prompt = buildPrompt(gameName, question, relevantSections);
        const response = await getLLMCompletion({ prompt }); 
        return response;
      } else {
        // Fallback if vector search returns no results
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