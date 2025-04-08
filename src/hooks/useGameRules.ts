import { useQuery, useMutation, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import { getLLMCompletion } from '@/services/LLMService';
import { fetchGameRules, findRelevantSections } from '@/services/RulesService';
import { gameResponses } from '@/data/games';

// Define the structure for the data returned by the rules query
interface GameRulesData {
  game: string;
  sections: any[]; // Keeping sections flexible for now
  // Add other potential top-level keys like cards, faq, errata if needed
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

const buildPrompt = (gameName: string, question: string, sections: any[]): string => {
  return `
You are a helpful assistant for the board game "${gameName}".

The user asked: "${question}"

Here are the relevant rules from the game rulebook:

${sections.map(section => {
  let content = `## ${section.title}\n${section.content}`;
  
  if (section.subsections && section.subsections.length > 0) {
    content += '\n\n' + section.subsections.map((sub: any) => 
      `### ${sub.title}\n${sub.content}`
    ).join('\n\n');
  }
  
  return content;
}).join('\n\n')}

**Your Role:** You are an expert rules assistant for the board game Arcs. Your goal is to provide accurate, concise answers based *only* on the provided text snippets.

**Instructions:**

1.  **Answer Directly:** Get straight to the answer using the provided context.
2.  **Answer Succintly:** Answer the question as succintly as possible. Do not attempt to answer related questions.
2.  **Prioritize Sources:** If context includes errata or official FAQ snippets, prioritize their information over rulebook snippets if they address the same point. State if errata overrides a rule.
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

  // Query to fetch the game rules data
  const rulesQuery = useQuery<GameRulesData, Error>({
    queryKey: ['gameRules', gameId], // Unique key for caching
    queryFn: () => fetchGameRules(gameId),
    enabled: !!gameId, // Only run query if gameId is provided
    staleTime: Infinity, // Rules data is static, cache indefinitely
    gcTime: Infinity,    // Keep in cache indefinitely
  });

  // Mutation to handle asking a question and getting an LLM response
  const askMutation = useMutation<string, Error, AskQuestionVariables>({
    mutationFn: async ({ question }: AskQuestionVariables) => {
      // Ensure rules data is loaded before proceeding
      if (!rulesQuery.data || !rulesQuery.data.sections) {
        // This case should ideally be handled by disabling the ask button 
        // if rulesQuery.isLoading or rulesQuery.isError, but throw just in case.
        throw new Error('Rules not loaded yet.'); 
      }

      const rules = rulesQuery.data;
      const relevantSections = findRelevantSections(rules, question);

      if (relevantSections.length > 0) {
        const prompt = buildPrompt(rules.game, question, relevantSections);
        // Call the refactored service function
        const response = await getLLMCompletion({ prompt }); 
        return response;
      } else {
        // If no relevant sections found, return a specific message or fallback
        return getFallbackResponse(question); // Use fallback logic
      }
    },
    // Optional: onSuccess, onError, onSettled callbacks for side-effects
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
    rulesQuery,     // Expose the full query state
    askMutation,    // Expose the full mutation state and trigger
    getFallbackResponse // Expose fallback logic for use when mutation fails or finds no sections
  };
} 