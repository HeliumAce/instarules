/**
 * Source Sorting Service
 * 
 * Handles sorting and grouping of sources for optimal display order.
 * Single responsibility: sorting and organization only.
 */

import { Source, RuleSource, CardSource } from './SourceConversionService';
import { SourceDeduplicationService } from './SourceDeduplicationService';

export interface SortingOptions {
  sources: Source[];
  sortBy?: 'pageNumber' | 'alphabetical' | 'quality';
}

export interface SortingResult {
  sources: Source[];
  stats: {
    ruleSources: number;
    cardSources: number;
    otherSources: number;
    sortedBy: string;
  };
}

export interface GroupingOptions {
  ruleSources: RuleSource[];
}

export type SortMethod = 'pageNumber' | 'alphabetical' | 'quality';

export class SourceSortingService {
  /**
   * Sorts sources for optimal display order.
   */
  static sortSources(options: SortingOptions): SortingResult {
    const { sources, sortBy = 'pageNumber' } = options;
    
    if (!sources || sources.length <= 1) {
      return {
        sources,
        stats: {
          ruleSources: 0,
          cardSources: 0,
          otherSources: 0,
          sortedBy: sortBy
        }
      };
    }
    
    const ruleSources: RuleSource[] = [];
    const cardSources: CardSource[] = [];
    const otherSources: Source[] = [];
    
    // Separate sources by type
    sources.forEach(source => {
      if (source.contentType === 'rule') {
        ruleSources.push(source as RuleSource);
      } else if (source.contentType === 'card') {
        cardSources.push(source as CardSource);
      } else {
        otherSources.push(source);
      }
    });
    
    // Sort each type according to the specified method
    const sortedRuleSources = this.sortRuleSources(ruleSources, sortBy);
    const sortedCardSources = this.sortCardSources(cardSources, sortBy);
    
    // Combine all sources - rules first, then cards, then others
    const sortedSources = [...sortedRuleSources, ...sortedCardSources, ...otherSources];
    
    return {
      sources: sortedSources,
      stats: {
        ruleSources: sortedRuleSources.length,
        cardSources: sortedCardSources.length,
        otherSources: otherSources.length,
        sortedBy: sortBy
      }
    };
  }

  /**
   * Sorts rule sources by the specified method.
   */
  private static sortRuleSources(ruleSources: RuleSource[], sortBy: SortMethod): RuleSource[] {
    if (sortBy === 'pageNumber') {
      return this.sortRuleSourcesByPage(ruleSources);
    } else if (sortBy === 'alphabetical') {
      return this.sortRuleSourcesAlphabetically(ruleSources);
    } else if (sortBy === 'quality') {
      return this.sortRuleSourcesByQuality(ruleSources);
    }
    
    // Default to page number sorting
    return this.sortRuleSourcesByPage(ruleSources);
  }

  /**
   * Sorts rule sources by page number and heading.
   */
  private static sortRuleSourcesByPage(ruleSources: RuleSource[]): RuleSource[] {
    return ruleSources.sort((a, b) => {
      // First sort by page number if available
      if (a.pageNumber && b.pageNumber) {
        return a.pageNumber - b.pageNumber;
      }
      
      // If one has page number and other doesn't, prioritize the one with page number
      if (a.pageNumber && !b.pageNumber) return -1;
      if (!a.pageNumber && b.pageNumber) return 1;
      
      // Otherwise sort by heading
      return a.sourceHeading.localeCompare(b.sourceHeading);
    });
  }

  /**
   * Sorts rule sources alphabetically by heading.
   */
  private static sortRuleSourcesAlphabetically(ruleSources: RuleSource[]): RuleSource[] {
    return ruleSources.sort((a, b) => a.sourceHeading.localeCompare(b.sourceHeading));
  }

  /**
   * Sorts rule sources by quality (more specific headings first).
   */
  private static sortRuleSourcesByQuality(ruleSources: RuleSource[]): RuleSource[] {
    return ruleSources.sort((a, b) => {
      // Prefer sources with page numbers
      if (a.pageNumber && !b.pageNumber) return -1;
      if (!a.pageNumber && b.pageNumber) return 1;
      
      // Prefer more specific headings over "General Rules"
      if (a.sourceHeading !== 'General Rules' && b.sourceHeading === 'General Rules') return -1;
      if (a.sourceHeading === 'General Rules' && b.sourceHeading !== 'General Rules') return 1;
      
      // Otherwise sort alphabetically
      return a.sourceHeading.localeCompare(b.sourceHeading);
    });
  }

  /**
   * Sorts card sources by the specified method.
   */
  private static sortCardSources(cardSources: CardSource[], sortBy: SortMethod): CardSource[] {
    if (sortBy === 'alphabetical') {
      return this.sortCardSourcesAlphabetically(cardSources);
    } else if (sortBy === 'quality') {
      return this.sortCardSourcesByQuality(cardSources);
    }
    
    // Default to alphabetical sorting
    return this.sortCardSourcesAlphabetically(cardSources);
  }

  /**
   * Sorts card sources alphabetically by name.
   */
  private static sortCardSourcesAlphabetically(cardSources: CardSource[]): CardSource[] {
    return cardSources.sort((a, b) => a.cardName.localeCompare(b.cardName));
  }

  /**
   * Sorts card sources by quality (sources with IDs first).
   */
  private static sortCardSourcesByQuality(cardSources: CardSource[]): CardSource[] {
    return cardSources.sort((a, b) => {
      // Prefer sources with IDs
      if (a.cardId && !b.cardId) return -1;
      if (!a.cardId && b.cardId) return 1;
      
      // Otherwise sort alphabetically
      return a.cardName.localeCompare(b.cardName);
    });
  }

  /**
   * Groups similar rule sources by heading for consolidation.
   */
  static groupSimilarRuleSources(options: GroupingOptions): RuleSource[] {
    const { ruleSources } = options;
    const grouped = new Map<string, RuleSource[]>();
    
    ruleSources.forEach(source => {
      const normalizedHeading = source.sourceHeading.toUpperCase().trim();
      
      if (!grouped.has(normalizedHeading)) {
        grouped.set(normalizedHeading, []);
      }
      
      grouped.get(normalizedHeading)!.push(source);
    });
    
    // Keep only the best source from each group
    const bestSources: RuleSource[] = [];
    
    grouped.forEach(sourceGroup => {
      if (sourceGroup.length === 1) {
        bestSources.push(sourceGroup[0]);
      } else {
        // Select the best source based on quality criteria
        const bestSource = sourceGroup.reduce((best, current) => {
          return SourceDeduplicationService.isHigherQualityRuleSource(current, best) ? current : best;
        }, sourceGroup[0]);
        
        bestSources.push(bestSource);
      }
    });
    
    return bestSources;
  }
} 