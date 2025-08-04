import { SupabaseClient } from '@supabase/supabase-js';
import { VectorSearchResult } from '@/types/search';
import { fetchRelevantSectionsFromVectorDb } from '@/services/RulesService';
import { SearchRefinementService } from '@/services/SearchRefinementService';
import { FollowUpRecoveryService } from '@/services/FollowUpRecoveryService';

export interface SearchOrchestrationOptions {
  gameName: string;
  question: string;
  queryTypes: string[];
  expandedQueries: string[];
  skipFollowUpHandling?: boolean;
  chatHistory?: { content: string; isUser: boolean }[];
}

export interface SearchOrchestrationResult {
  finalResults: VectorSearchResult[];
  searchMetadata: {
    totalQueriesExecuted: number;
    initialResultsCount: number;
    finalResultsCount: number;
    deduplicationStrategy: string;
    refinementAttempted: boolean;
  };
}

export class SearchOrchestrationService {
  /**
   * Orchestrates complex vector search operations including query variations,
   * deduplication, and result refinement based on question type.
   */
  static async orchestrateVectorSearch(
    supabase: SupabaseClient,
    options: SearchOrchestrationOptions
  ): Promise<SearchOrchestrationResult> {
    const {
      question,
      queryTypes,
      expandedQueries,
      skipFollowUpHandling = false,
      chatHistory
    } = options;

    console.log(`[Hybrid Search] Using ${expandedQueries.length} query variations ${skipFollowUpHandling ? 'without' : 'including'} follow-up handling`);
    
    // Step 1: Execute basic vector searches
    const vectorResults = await this.executeBasicVectorSearches(supabase, expandedQueries);
    
    // Step 2: Determine question characteristics
    const questionAnalysis = this.analyzeQuestion(question, queryTypes);
    
    // Step 3: Apply refinement strategies if needed
    let allResults = [...vectorResults];
    
    if (SearchRefinementService.needsBroaderContext(queryTypes, vectorResults)) {
      allResults = await SearchRefinementService.addBroaderContext(supabase, {
        question,
        queryTypes,
        isEnumerationQuestion: questionAnalysis.isEnumerationQuestion,
        currentResults: allResults
      });
    }
    
    if (SearchRefinementService.needsRefinement(allResults)) {
      console.log(`[Hybrid Search] Initial results insufficient, attempting refinement`);
      allResults = await SearchRefinementService.refineSearchResults(supabase, {
        question,
        queryTypes,
        isEnumerationQuestion: questionAnalysis.isEnumerationQuestion,
        currentResults: allResults
      });
    }
    
    // Step 4: Apply result limits and sorting
    const resultLimit = this.determineResultLimit(questionAnalysis);
    let finalResults = allResults
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, resultLimit);
    
    // Step 5: Attempt follow-up recovery if needed
    if (chatHistory) {
      finalResults = await FollowUpRecoveryService.attemptFollowUpRecovery(supabase, {
        question,
        finalResults,
        chatHistory,
        skipFollowUpHandling
      });
    }
    
    // Step 6: Log results for debugging
    this.logSearchResults(finalResults);

    return {
      finalResults,
      searchMetadata: {
        totalQueriesExecuted: expandedQueries.length,
        initialResultsCount: vectorResults.length,
        finalResultsCount: finalResults.length,
        deduplicationStrategy: questionAnalysis.isDedupByName ? 'name-based' : 'similarity-based',
        refinementAttempted: allResults.length > vectorResults.length
      }
    };
  }

  /**
   * Executes basic vector searches with query variations and deduplication.
   */
  private static async executeBasicVectorSearches(
    supabase: SupabaseClient,
    expandedQueries: string[]
  ): Promise<VectorSearchResult[]> {
    console.log(`[Hybrid Search] Starting vector searches`);
    let allVectorResults: VectorSearchResult[] = [];
    
    // Execute searches
    for (const expandedQuery of expandedQueries) {
      console.log(`[Hybrid Search] Vector search for: "${expandedQuery}"`);
      const results = await fetchRelevantSectionsFromVectorDb(supabase, expandedQuery);
      console.log(`[Hybrid Search] Found ${results.length} results for variation`);
      allVectorResults = [...allVectorResults, ...results];
    }
    
    // Simple deduplication by ID
    const vectorResults = allVectorResults.filter((result, index, self) => 
      index === self.findIndex(r => r.id === result.id)
    );
    
    return vectorResults;
  }

  /**
   * Analyzes question characteristics to determine search strategies.
   */
  private static analyzeQuestion(question: string, queryTypes: string[]) {
    const isEnumerationQuestion = queryTypes.includes('ENUMERATION_QUESTION');
    const isCardEnumerationQuestion = 
      (isEnumerationQuestion || question.toLowerCase().match(/how many|different|types of|all|count/i) !== null) && 
      question.toLowerCase().match(/cards?|types?/i) !== null;
    
    // Different deduplication strategies based on question type
    const isDedupByName = isCardEnumerationQuestion;
    
    return {
      isEnumerationQuestion,
      isCardEnumerationQuestion,
      isDedupByName
    };
  }

  /**
   * Determines the appropriate result limit based on question characteristics.
   */
  private static determineResultLimit(questionAnalysis: {
    isEnumerationQuestion: boolean;
    isCardEnumerationQuestion: boolean;
  }): number {
    return questionAnalysis.isCardEnumerationQuestion ? 15 : 
      (questionAnalysis.isEnumerationQuestion ? 12 : 8);
  }

  /**
   * Logs search results for debugging purposes.
   */
  private static logSearchResults(finalResults: VectorSearchResult[]): void {
    console.log(`[Hybrid Search] Final combined results: ${finalResults.length}`);
    finalResults.forEach((result, i) => {
      const source = result.id.toString().startsWith('text') ? 'text search' : 'vector search';
      console.log(`Result #${i+1}: similarity=${result.similarity.toFixed(2)}, source=${source}`);
      console.log(`Content preview: ${result.content.substring(0, 100).replace(/\n/g, ' ')}...`);
    });
  }
} 