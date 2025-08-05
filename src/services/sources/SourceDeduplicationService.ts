/**
 * Source Deduplication Service
 * 
 * Handles deduplication and quality assessment of sources.
 * Single responsibility: deduplication only.
 */

import { Source, RuleSource, CardSource } from './SourceConversionService';

export class SourceDeduplicationService {
  /**
   * Performs comprehensive deduplication with quality checks.
   */
  static deduplicateSources(sources: Source[], enableQualityChecks = true): Source[] {
    if (!sources || sources.length <= 1) {
      return sources;
    }
    
    if (enableQualityChecks) {
      return this.deduplicateWithQuality(sources);
    } else {
      return this.simpleDeduplication(sources);
    }
  }

  /**
   * Performs deduplication with quality assessment.
   */
  private static deduplicateWithQuality(sources: Source[]): Source[] {
    const uniqueRuleSources = new Map<string, RuleSource>();
    const uniqueCardSources = new Map<string, CardSource>();
    const otherSources: Source[] = [];
    
    // Process each source
    sources.forEach(source => {
      if (source.contentType === 'rule') {
        const ruleSource = source as RuleSource;
        const key = `${ruleSource.sourceHeading}-${ruleSource.pageNumber || 'unknown'}-${ruleSource.bookName}`;
        
        if (!uniqueRuleSources.has(key) || this.isHigherQualityRuleSource(ruleSource, uniqueRuleSources.get(key)!)) {
          uniqueRuleSources.set(key, ruleSource);
        }
      } else if (source.contentType === 'card') {
        const cardSource = source as CardSource;
        const key = cardSource.cardId ? `${cardSource.cardName}-${cardSource.cardId}` : cardSource.cardName;
        
        if (!uniqueCardSources.has(key) || this.isHigherQualityCardSource(cardSource, uniqueCardSources.get(key)!)) {
          uniqueCardSources.set(key, cardSource);
        }
      } else {
        otherSources.push(source);
      }
    });
    
    // Group similar rule sources
    const groupedRuleSources = this.groupSimilarRuleSources(Array.from(uniqueRuleSources.values()));
    
    // Combine all sources
    return [...groupedRuleSources, ...Array.from(uniqueCardSources.values()), ...otherSources];
  }

  /**
   * Performs simple deduplication without quality checks.
   */
  private static simpleDeduplication(sources: Source[]): Source[] {
    const seen = new Set<string>();
    return sources.filter(source => {
      const key = `${source.contentType}-${source.id}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Groups similar rule sources by heading.
   */
  private static groupSimilarRuleSources(ruleSources: RuleSource[]): RuleSource[] {
    const grouped = new Map<string, RuleSource[]>();
    
    ruleSources.forEach(source => {
      const normalizedHeading = source.sourceHeading.toUpperCase().trim();
      const originalHeading = source.sourceHeading.trim();
      
      if (!grouped.has(normalizedHeading)) {
        grouped.set(normalizedHeading, []);
      }
      
      // Improve heading formatting
      if (source.sourceHeading === source.sourceHeading.toUpperCase() && originalHeading.length > 2) {
        source.sourceHeading = originalHeading
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
      }
      
      grouped.get(normalizedHeading)!.push(source);
    });
    
    // Keep only the best source from each group
    const bestSources: RuleSource[] = [];
    
    grouped.forEach(sourceGroup => {
      if (sourceGroup.length === 1) {
        bestSources.push(sourceGroup[0]);
      } else {
        const bestSource = sourceGroup.reduce((best, current) => {
          return this.isHigherQualityRuleSource(current, best) ? current : best;
        }, sourceGroup[0]);
        
        bestSources.push(bestSource);
      }
    });
    
    return bestSources;
  }

  /**
   * Determines if a rule source has higher quality information.
   */
  static isHigherQualityRuleSource(newSource: RuleSource, existingSource: RuleSource): boolean {
    // If the new source has a page number and the existing one doesn't, prefer the new one
    if (newSource.pageNumber && !existingSource.pageNumber) {
      return true;
    }
    
    // If the new source has a more specific heading, prefer it
    if (newSource.sourceHeading && newSource.sourceHeading !== 'General Rules' && 
        existingSource.sourceHeading === 'General Rules') {
      return true;
    }
    
    // If the new source has a more detailed title, prefer it
    if (newSource.title && newSource.title.length > 5 && 
        (!existingSource.title || existingSource.title.length <= 5)) {
      return true;
    }
    
    return false;
  }

  /**
   * Determines if a card source has higher quality information.
   */
  static isHigherQualityCardSource(newSource: CardSource, existingSource: CardSource): boolean {
    // If the new source has an ID and the existing one doesn't, prefer the new one
    if (newSource.cardId && !existingSource.cardId) {
      return true;
    }
    
    // If the new source has a longer (more detailed) name, prefer it
    if (newSource.cardName && existingSource.cardName && 
        newSource.cardName.length > existingSource.cardName.length) {
      return true;
    }
    
    return false;
  }

  /**
   * Checks if two content blocks are similar.
   */
  static isSimilarContent(content1: string, content2: string, threshold: number): boolean {
    const preview1 = content1.substring(0, 200).toLowerCase();
    const preview2 = content2.substring(0, 200).toLowerCase();
    
    // If one completely contains the other, they're similar
    if (preview1.includes(preview2) || preview2.includes(preview1)) {
      return true;
    }
    
    // Count matching words as a similarity measure
    const words1 = new Set(preview1.split(/\s+/).filter(w => w.length > 3));
    const words2 = new Set(preview2.split(/\s+/).filter(w => w.length > 3));
    
    // Find intersection
    const commonWords = [...words1].filter(word => words2.has(word));
    
    // Calculate Jaccard similarity
    const similarity = commonWords.length / (words1.size + words2.size - commonWords.length);
    
    return similarity >= threshold;
  }
} 