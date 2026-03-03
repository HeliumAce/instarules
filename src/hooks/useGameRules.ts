import { useQuery, useMutation, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import { getLLMCompletion } from '@/services/LLMService';
import { fetchGameRules, loadFullRulebookContent } from '@/services/RulesService';
// Vector-search imports — commented out, preserved for future use.
// Uncomment these (and the vector-search block below) to re-enable.
// import { fetchRelevantSectionsFromVectorDb, findRelevantSections } from '@/services/RulesService';
// import { QueryProcessingService } from '@/services/query';
// import { SourceFormattingService, FullContextSourceService } from '@/services/sources';
// import { extractEntitiesFromHistory, rankEntitiesByRelevance } from '@/services/EntityExtractionService';
// import { useSupabase } from '@/context/SupabaseContext';
// import { VectorSearchResult } from '@/types/search';
import { FullContextSourceService } from '@/services/sources';
import { gameResponses, getGameConfig } from '@/data/games';
import { PromptService } from '@/services/PromptService';

// Define the structure for the data returned by the rules query
interface GameRulesData {
  game: string;
  rules: any;
}

// VectorSearchResult type now imported from centralized types

// Define the structure for the variables passed to the mutation
interface AskQuestionVariables {
  question: string;
  chatHistory?: { content: string; isUser: boolean }[];
  skipFollowUpHandling?: boolean;
}

// Define the structure for the returned value of the hook
interface UseGameRulesReturn {
  rulesQuery: UseQueryResult<GameRulesData, Error>;
  askMutation: UseMutationResult<string, Error, AskQuestionVariables, unknown>;
  getFallbackResponse: (question: string) => string;
}



export function useGameRules(gameId: string): UseGameRulesReturn {
  // Supabase client — only needed for vector-search strategy (currently disabled).
  // const { supabase } = useSupabase();

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
    mutationFn: async ({ question, chatHistory, skipFollowUpHandling }: AskQuestionVariables) => {
      // Ensure game name is available
      const gameName = rulesQuery.data?.game;
      if (!gameName) {
        throw new Error('Game information not loaded yet.');
      }

      const gameConfig = getGameConfig(gameId);

      // ── Full-context strategy ──────────────────────────────────
      if (gameConfig.strategy === 'full-context') {
        console.log(`[Full-Context] Loading full rulebook for ${gameName}`);
        const rulebookContent = await loadFullRulebookContent(gameId);

        const prompt = PromptService.buildPrompt({
          gameName,
          question,
          rawContext: rulebookContent,
          chatHistory,
        });
        const response = await getLLMCompletion({ prompt });

        // Extract sources from the rulebook based on question relevance
        const sourcesData = FullContextSourceService.findRelevantSources(
          rulebookContent,
          question,
          gameName
        );

        const enhancedResponse = Object.assign(String(response), { sources: sourcesData });
        return enhancedResponse;
      }

      // ── No data available ──────────────────────────────────────
      if (gameConfig.strategy === 'none') {
        return getFallbackResponse(question);
      }

      // ── Vector-search strategy (commented out — preserved for future use) ────
      // Previously used for Arcs. To re-enable:
      //   1. Change the Arcs strategy back to 'vector-search' in src/data/games.ts
      //   2. Uncomment the vector-search imports at the top of this file
      //   3. Uncomment the useSupabase() call above
      //   4. Uncomment the entire block below
      /*
      // Get query classifications right at the beginning
      const queryTypes = QueryProcessingService.classifyQuery(question);
      const isEnumerationQuestion = queryTypes.includes('ENUMERATION_QUESTION');
      const isCardEnumerationQuestion =
        (isEnumerationQuestion || question.toLowerCase().match(/how many|different|types of|all|count/i) !== null) &&
        question.toLowerCase().match(/cards?|types?/i) !== null;

      // Preprocess the query with chat history for follow-up detection
      // Skip follow-up handling if skipFollowUpHandling is true
      const expandedQueries = skipFollowUpHandling
        ? QueryProcessingService.expandQueryByType(question, queryTypes)
        : QueryProcessingService.preprocessQuery(question, chatHistory);

      console.log(`[Hybrid Search] Using ${expandedQueries.length} query variations ${skipFollowUpHandling ? 'without' : 'including'} follow-up handling`);

      // Step 1: Perform vector search with all query variations
      console.log(`[Hybrid Search] Starting vector searches`);
      let allVectorResults: VectorSearchResult[] = [];

      for (const expandedQuery of expandedQueries) {
        console.log(`[Hybrid Search] Vector search for: "${expandedQuery}"`);
        const results = await fetchRelevantSectionsFromVectorDb(supabase, expandedQuery);
        console.log(`[Hybrid Search] Found ${results.length} results for variation`);
        allVectorResults = [...allVectorResults, ...results];
      }

      const vectorResults = allVectorResults.filter((result, index, self) =>
        index === self.findIndex(r => r.id === result.id)
      );

      let dedupThreshold = queryTypes.some(type =>
        ['REASONING_QUESTION', 'COMPARISON_QUESTION', 'INTERACTION_QUESTION'].includes(type)
      ) ? 0.3 : 0.8;

      const isDedupByName = isCardEnumerationQuestion;

      let allResults = [...vectorResults];

      if ((queryTypes.some(type =>
        ['REASONING_QUESTION', 'COMPARISON_QUESTION', 'INTERACTION_QUESTION'].includes(type)
      ) && vectorResults.length < 5) || vectorResults.length < 2) {
        const broaderQueries: string[] = [];

        if (isEnumerationQuestion) {
          const match = question.toLowerCase().match(/how many (.+?)(\s|are|\?|$)/i) ||
                       question.toLowerCase().match(/what are (?:all|the) (.+?)(\s|\?|$)/i);
          if (match && match[1]) {
            broaderQueries.push(`${match[1].trim()} types list all`);
          }
        } else if (queryTypes.some(type =>
          ['REASONING_QUESTION', 'COMPARISON_QUESTION', 'INTERACTION_QUESTION'].includes(type)
        )) {
          const keyTerms = PromptService.extractKeyTerms(question);
          keyTerms.forEach(term => {
            broaderQueries.push(`${term} rules mechanics interactions`);
          });
        }

        for (const broadQuery of broaderQueries) {
          const additionalSections = await fetchRelevantSectionsFromVectorDb(supabase, broadQuery);
          allResults.push(...additionalSections);
        }
      }

      if (allResults.length < 3 ||
          allResults.every(result => result.similarity < 0.55)) {
        console.log(`[Hybrid Search] Initial results insufficient, attempting refinement`);

        const reformulatedQuery = PromptService.reformulateQuery(question);
        if (reformulatedQuery !== question) {
          console.log(`[Hybrid Search] Trying reformulated query: "${reformulatedQuery}"`);
          const refinedResults = await fetchRelevantSectionsFromVectorDb(supabase, reformulatedQuery);
          allResults = [...allResults, ...refinedResults];
        }

        if (isEnumerationQuestion) {
          const subject = PromptService.extractSubject(question);
          if (subject) {
            console.log(`[Hybrid Search] Running focused search on subject: "${subject}"`);
            const subjectResults = await fetchRelevantSectionsFromVectorDb(
              supabase,
              `${subject} list all types complete`
            );
            allResults.unshift(...subjectResults);
          }
        }
      }

      const resultLimit = isCardEnumerationQuestion ? 15 :
        (isEnumerationQuestion ? 12 : 8);

      const finalResults = allResults
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, resultLimit);

      console.log(`[Hybrid Search] Final combined results: ${finalResults.length}`);
      finalResults.forEach((result, i) => {
        const source = result.id.toString().startsWith('text') ? 'text search' : 'vector search';
        console.log(`Result #${i+1}: similarity=${result.similarity.toFixed(2)}, source=${source}`);
        console.log(`Content preview: ${result.content.substring(0, 100).replace(/\n/g, ' ')}...`);
      });

      if (!skipFollowUpHandling &&
          (finalResults.length < 2 || finalResults.every(result => result.similarity < 0.45)) &&
          chatHistory && chatHistory.length >= 2 &&
          QueryProcessingService.detectFollowUp(question)) {

        console.log('[Follow-up Recovery] Detected potential follow-up with poor results, attempting recovery');

        const entityResult = extractEntitiesFromHistory({ chatHistory });
        const entities = entityResult.entities;

        if (entities.length > 0) {
          const rankingResult = rankEntitiesByRelevance({ entities, query: question });
          const sortedEntities = rankingResult.entities;

          const recoveryTerms = sortedEntities.slice(0, 2).map(e => e.text);

          console.log(`[Follow-up Recovery] Using terms: ${recoveryTerms.join(', ')}`);

          const recoveryQueries = recoveryTerms.map(term =>
            `${question} ${term}`
          );

          const recoveryResults: VectorSearchResult[] = [];
          for (const recoveryQuery of recoveryQueries) {
            console.log(`[Follow-up Recovery] Trying recovery query: "${recoveryQuery}"`);
            const results = await fetchRelevantSectionsFromVectorDb(supabase, recoveryQuery);
            recoveryResults.push(...results);
          }

          if (recoveryResults.length > 0) {
            const uniqueRecoveryResults = recoveryResults.filter(
              recovery => !finalResults.some(final => final.id === recovery.id)
            );

            const goodRecoveryResults = uniqueRecoveryResults
              .filter(result => result.similarity > 0.5)
              .sort((a, b) => b.similarity - a.similarity)
              .slice(0, 3);

            if (goodRecoveryResults.length > 0) {
              console.log(`[Follow-up Recovery] Found ${goodRecoveryResults.length} additional relevant sections`);
              finalResults.push(...goodRecoveryResults);
              finalResults.sort((a, b) => b.similarity - a.similarity);
            }
          }
        }
      }

      if (finalResults.length > 0) {
        const prompt = PromptService.buildPrompt({
          gameName,
          question,
          sections: finalResults,
          chatHistory: skipFollowUpHandling ? undefined : chatHistory
        });
        const response = await getLLMCompletion({ prompt });

        const sourcesData = SourceFormattingService.convertToMessageSources(finalResults);
        const enhancedResponse = Object.assign(String(response), { sources: sourcesData });

        return enhancedResponse;
      } else {
        return getFallbackResponse(question);
      }
      */

      // All games should now be handled by full-context or none strategies above.
      // If we reach here, it means a game has an unhandled strategy.
      return getFallbackResponse(question);
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