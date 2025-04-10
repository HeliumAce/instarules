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
      const title = section.metadata?.heading_path?.join(' > ') || section.metadata?.card || 'Relevant Rule Snippet';
      return `## ${title}\n${section.content}`;
    })
    .join('\n\n');
    
  return `
You are a helpful assistant for the board game "${gameName}".

The user asked: "${question}"

Here are the most relevant rules snippets found for that question:

${context}

**Your Role:** You are an expert rules assistant for the board game Arcs. Your goal is to provide accurate, concise answers based *only* on the provided text snippets.

**Instructions:**

1.  **Answer Directly:** Get straight to the answer using the provided context.
2.  **Answer Succintly:** Answer the question as succintly as possible. Do not attempt to answer related questions.
2.  **Prioritize Sources:** If context includes errata or official FAQ snippets (check metadata if available), prioritize their information over rulebook snippets if they address the same point. State if errata overrides a rule.
3.  **Synthesize Information:** If multiple snippets are relevant, combine them into a coherent answer.
4.  **Handle Ambiguity/Conflict:** If the provided snippets are contradictory (and not resolved by errata/FAQ priority) or insufficient to fully answer the question, clearly state that the rules are unclear or the information isn't present in the provided context. Do not guess or infer rules.
5.  **Formatting:**
    * Use bullet points for lists or step-by-step processes.
    * **Bold** key game terms, card names, or action names mentioned in the rules.
6.  **Exclusions:**
    * Do NOT include preamble phrases like "Based on the rules..." or "The context states...". or any other preamble.
    * Do NOT refer to rulebook page numbers or document names unless quoting a specific named source like an FAQ.
    * Avoid unnecessary explanations or flavor text.

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
      const relevantSections = await fetchRelevantSectionsFromVectorDb(supabase, question);

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
    return gameSpecificResponses.default || "I couldn't find specific information for that question.";
  };

  return {
    rulesQuery,     
    askMutation,    
    getFallbackResponse 
  };
} 