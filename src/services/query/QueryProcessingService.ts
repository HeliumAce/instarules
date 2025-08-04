/**
 * Query Processing Service
 * 
 * Orchestrates the complete query processing pipeline by coordinating
 * classification, expansion, and follow-up processing services.
 */

import { QueryClassificationService, QueryType, QueryAnalysis } from './QueryClassificationService';
import { QueryExpansionService, QueryExpansionResult } from './QueryExpansionService';
import { FollowUpProcessingService, FollowUpProcessingResult } from './FollowUpProcessingService';

export interface QueryProcessingOptions {
  query: string;
  chatHistory?: { content: string; isUser: boolean }[];
  skipFollowUpHandling?: boolean;
}

export interface QueryProcessingResult {
  originalQuery: string;
  queryTypes: QueryType[];
  expandedQueries: string[];
  isFollowUp: boolean;
  reformulatedQuery?: string;
  analysis: QueryAnalysis;
  expansion: QueryExpansionResult;
  followUp?: FollowUpProcessingResult;
}

export class QueryProcessingService {
  /**
   * Main entry point for query processing with comprehensive analysis and expansion.
   * Orchestrates the complete pipeline using focused services.
   */
  static processQuery(options: QueryProcessingOptions): QueryProcessingResult {
    const { query, chatHistory, skipFollowUpHandling = false } = options;
    
    // Step 1: Analyze and classify the query
    const analysis = QueryClassificationService.analyzeQuery(query);
    
    // Step 2: Generate search expansions
    const expansion = QueryExpansionService.generateSearchVariations({
      query,
      queryTypes: analysis.queryTypes
    });
    
    // Step 3: Handle follow-up processing if needed
    let followUp: FollowUpProcessingResult | undefined;
    let finalExpandedQueries = [...expansion.expandedQueries];
    
    if (!skipFollowUpHandling && chatHistory && chatHistory.length >= 2) {
      followUp = FollowUpProcessingService.processFollowUp({ query, chatHistory });
      
      if (followUp.isFollowUp && followUp.reformulatedQuery && followUp.reformulatedQuery !== query) {
        // Add reformulated query as the primary query
        finalExpandedQueries.unshift(followUp.reformulatedQuery);
      }
    }
    
    return {
      originalQuery: query,
      queryTypes: analysis.queryTypes,
      expandedQueries: finalExpandedQueries,
      isFollowUp: followUp?.isFollowUp || false,
      reformulatedQuery: followUp?.reformulatedQuery,
      analysis,
      expansion,
      followUp
    };
  }

  // Delegation methods for backward compatibility
  static classifyQuery(query: string): QueryType[] {
    return QueryClassificationService.classifyQuery(query);
  }

  static expandQueryByType(query: string, types: QueryType[]): string[] {
    return QueryExpansionService.expandQueryByType(query, types);
  }

  static detectFollowUp(query: string): boolean {
    return FollowUpProcessingService.detectFollowUp(query);
  }

  // Convenience methods for backward compatibility and specific use cases
  static isResourceQuestion(query: string): boolean {
    return QueryClassificationService.isResourceQuestion(query);
  }

  static isEnumerationQuestion(query: string): boolean {
    return QueryClassificationService.isEnumerationQuestion(query);
  }

  /**
   * Legacy method for backward compatibility - processes query and returns expanded queries.
   */
  static preprocessQuery(
    query: string, 
    chatHistory?: { content: string; isUser: boolean }[]
  ): string[] {
    const result = this.processQuery({ query, chatHistory });
    return result.expandedQueries;
  }
} 