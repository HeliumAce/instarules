/**
 * Source Conversion Service
 * 
 * Handles conversion of VectorSearchResult objects to formatted Source objects.
 * Single responsibility: data transformation only.
 */

import { VectorSearchResult } from '@/types/search';

export interface RuleSource {
  id: string;
  contentType: 'rule';
  title: string;
  sourceHeading: string;
  bookName: string;
  pageNumber?: number;
  content: string;
}

export interface CardSource {
  id: string;
  contentType: 'card';
  title: string;
  cardId: string;
  cardName: string;
  content: string;
}

export type Source = RuleSource | CardSource;

export class SourceConversionService {
  /**
   * Converts vector search results to formatted sources.
   */
  static convertToSources(results: VectorSearchResult[]): Source[] {
    if (!results || results.length === 0) {
      return [];
    }
    
    return results.map((result): Source => {
      const metadata = result.metadata || {};
      
      // Check if it's a card source
      if (metadata.card_id || metadata.card_name || (metadata.content_type === 'card')) {
        return this.createCardSource(result, metadata);
      } else {
        return this.createRuleSource(result, metadata);
      }
    });
  }

  /**
   * Creates a card source from vector search result.
   */
  private static createCardSource(result: VectorSearchResult, metadata: any): CardSource {
    let cardName = metadata.card_name;
    let cardId = metadata.card_id;
    
    if (!cardName || !cardId) {
      const content = result.content || '';
      
      // Extract card name from first line
      if (!cardName) {
        const firstLine = content.split('\n')[0];
        if (firstLine && firstLine.length < 50) {
          cardName = firstLine.replace(/\(ID:.*?\)/i, '').trim();
        }
      }
      
      // Extract card ID from content
      if (!cardId) {
        const idMatch = content.match(/\(ID:\s*([\w\-]+)\)/i) || 
                        content.match(/ID:\s*([\w\-]+)/i) ||
                        content.match(/(ARCS-[\w\-]+)/i);
        if (idMatch && idMatch[1]) {
          cardId = idMatch[1].trim();
        }
      }
    }
    
    return {
      id: result.id,
      contentType: 'card',
      title: cardName || 'Card',
      cardId: cardId || '',
      cardName: cardName || 'Card',
      content: result.content
    };
  }

  /**
   * Creates a rule source from vector search result.
   */
  private static createRuleSource(result: VectorSearchResult, metadata: any): RuleSource {
    const content = result.content || '';
    
    // Extract book name from enhanced metadata
    const h1Heading = (result as any).h1_heading || metadata.h1_heading;
    let bookName = h1Heading || "Rulebook";
    
    // Clean up book name for display
    if (bookName && bookName !== "Rulebook") {
      bookName = this.cleanBookName(bookName);
    }
    
    // Extract heading and page information
    const heading = metadata.source_heading || metadata.heading || 'General Rules';
    const pageNumber = metadata.page_number || metadata.page || undefined;
    
    return {
      id: result.id,
      contentType: 'rule',
      title: heading,
      sourceHeading: heading,
      bookName,
      pageNumber,
      content: result.content
    };
  }

  /**
   * Cleans up book name for display.
   */
  private static cleanBookName(bookName: string): string {
    let cleaned = bookName
      .replace(/^arcs_/i, '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
    
    // Map specific patterns to cleaner names
    const cleanNames: Record<string, string> = {
      'Rules Base Game': 'Base Game Rules',
      'Rules Blighted Reach': 'Blighted Reach Rules', 
      'Cards Base Game': 'Base Game Cards',
      'Cards Blighted Reach': 'Blighted Reach Cards',
      'Cards Leaders And Lore': 'Leaders and Lore',
      'Cards Errata': 'Errata',
      'Cards FAQ': 'FAQ'
    };
    
    return cleanNames[cleaned] || cleaned;
  }
} 