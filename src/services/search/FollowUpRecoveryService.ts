import { SupabaseClient } from '@supabase/supabase-js';
import { VectorSearchResult } from '@/types/search';
import { fetchRelevantSectionsFromVectorDb } from '@/services/RulesService';
import { detectFollowUp, extractEntitiesFromHistory, rankEntitiesByRelevance } from '@/services/EntityExtractionService';

export interface FollowUpRecoveryOptions {
  question: string;
  finalResults: VectorSearchResult[];
  chatHistory: { content: string; isUser: boolean }[];
  skipFollowUpHandling?: boolean;
}

export class FollowUpRecoveryService {
  /**
   * Attempts follow-up recovery when results are poor and a follow-up question is detected.
   */
  static async attemptFollowUpRecovery(
    supabase: SupabaseClient,
    options: FollowUpRecoveryOptions
  ): Promise<VectorSearchResult[]> {
    const { question, finalResults, chatHistory, skipFollowUpHandling = false } = options;
    
    // Skip if follow-up handling is disabled
    if (skipFollowUpHandling) {
      return finalResults;
    }
    
    // Follow-up recovery mechanism:
    // If we have poor results (few or low similarity) and detected a likely follow-up question,
    // try searching using the most recent entities from the conversation as context
    if (!this.shouldAttemptRecovery(finalResults, chatHistory, question)) {
      return finalResults;
    }
    
    console.log('[Follow-up Recovery] Detected potential follow-up with poor results, attempting recovery');
    
    // Get entities from recent conversation history
    const entities = extractEntitiesFromHistory(chatHistory);
    
    if (entities.length === 0) {
      return finalResults;
    }
    
    // Sort entities by recency and salience
    const sortedEntities = rankEntitiesByRelevance(entities, question);
    
    // Take the top 2 entities and use them for recovery search
    const recoveryTerms = sortedEntities.slice(0, 2).map(e => e.text);
    
    console.log(`[Follow-up Recovery] Using terms: ${recoveryTerms.join(', ')}`);
    
    // Run a recovery search with these terms and the original question
    const recoveryQueries = recoveryTerms.map(term => 
      `${question} ${term}`
    );
    
    // Perform recovery searches
    const recoveryResults: VectorSearchResult[] = [];
    for (const recoveryQuery of recoveryQueries) {
      console.log(`[Follow-up Recovery] Trying recovery query: "${recoveryQuery}"`);
      const results = await fetchRelevantSectionsFromVectorDb(supabase, recoveryQuery);
      recoveryResults.push(...results);
    }
    
    // Add recovery results to final results if they're better
    if (recoveryResults.length === 0) {
      return finalResults;
    }
    
    const uniqueRecoveryResults = recoveryResults.filter(
      recovery => !finalResults.some(final => final.id === recovery.id)
    );
    
    // If we have new good results, add them
    const goodRecoveryResults = uniqueRecoveryResults
      .filter(result => result.similarity > 0.5)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3);
    
    if (goodRecoveryResults.length > 0) {
      console.log(`[Follow-up Recovery] Found ${goodRecoveryResults.length} additional relevant sections`);
      const updatedResults = [...finalResults, ...goodRecoveryResults];
      
      // Re-sort by similarity
      updatedResults.sort((a, b) => b.similarity - a.similarity);
      return updatedResults;
    }
    
    return finalResults;
  }

  /**
   * Determines if follow-up recovery should be attempted based on result quality and conversation context.
   */
  private static shouldAttemptRecovery(
    finalResults: VectorSearchResult[],
    chatHistory: { content: string; isUser: boolean }[],
    question: string
  ): boolean {
    // Check if results are poor
    const hasPoorResults = finalResults.length < 2 || 
                          finalResults.every(result => result.similarity < 0.45);
    
    // Check if we have sufficient chat history
    const hasSufficientHistory = chatHistory && chatHistory.length >= 2;
    
    // Check if this is likely a follow-up question
    const isLikelyFollowUp = detectFollowUp(question);
    
    return hasPoorResults && hasSufficientHistory && isLikelyFollowUp;
  }

  /**
   * Determines if the current results indicate poor search performance.
   */
  static hasPoorResults(results: VectorSearchResult[]): boolean {
    return results.length < 2 || results.every(result => result.similarity < 0.45);
  }
} 