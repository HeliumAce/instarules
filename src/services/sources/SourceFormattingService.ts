/**
 * Source Formatting Service
 * 
 * Main orchestrator for source formatting operations.
 * Uses focused services to handle conversion, deduplication, and sorting.
 * Single responsibility: orchestration only.
 */

import { VectorSearchResult } from '@/types/search';
import { 
  SourceConversionService, 
  SourceDeduplicationService, 
  SourceSortingService,
  Source
} from './';

export interface MessageSources {
  count: number;
  sources: Source[];
}

export class SourceFormattingService {
  /**
   * Main entry point for source formatting with comprehensive deduplication and quality assessment.
   */
  static formatSources(results: VectorSearchResult[], enableQualityChecks = true, sortBy: 'pageNumber' | 'alphabetical' | 'quality' = 'pageNumber'): Source[] {
    if (!results || results.length === 0) {
      return [];
    }
    
    // Step 1: Convert vector results to sources
    const sources = SourceConversionService.convertToSources(results);
    
    // Step 2: Deduplicate sources with quality checks
    const deduplicatedSources = SourceDeduplicationService.deduplicateSources(sources, enableQualityChecks);
    
    // Step 3: Sort sources for optimal display
    const sortedSources = SourceSortingService.sortSources(deduplicatedSources, sortBy);
    
    return sortedSources;
  }

  /**
   * Legacy method for backward compatibility.
   */
  static convertToMessageSources(results: VectorSearchResult[]): MessageSources {
    const sources = this.formatSources(results);
    
    return {
      count: sources.length,
      sources
    };
  }

  /**
   * Legacy method for backward compatibility.
   */
  static deduplicateSources(sources: Source[]): Source[] {
    return SourceDeduplicationService.deduplicateSources(sources);
  }

  /**
   * Legacy method for backward compatibility.
   */
  static isSimilarContent(content1: string, content2: string, threshold: number): boolean {
    return SourceDeduplicationService.isSimilarContent(content1, content2, threshold);
  }

  /**
   * Legacy method for backward compatibility.
   */
  static isHigherQualityRuleSource(newSource: any, existingSource: any): boolean {
    return SourceDeduplicationService.isHigherQualityRuleSource(newSource, existingSource);
  }

  /**
   * Legacy method for backward compatibility.
   */
  static isHigherQualityCardSource(newSource: any, existingSource: any): boolean {
    return SourceDeduplicationService.isHigherQualityCardSource(newSource, existingSource);
  }
} 