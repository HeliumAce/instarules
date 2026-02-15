/**
 * Query Expansion Service
 * 
 * Handles generation of search variations and expanded terms based on query types
 * to improve vector search results through intelligent term expansion.
 */

import { QueryType } from './QueryClassificationService';

export interface QueryExpansionOptions {
  query: string;
  queryTypes: QueryType[];
}

export interface QueryExpansionResult {
  originalQuery: string;
  expandedQueries: string[];
  expansionStrategy: string;
}

export class QueryExpansionService {
  /**
   * Expands a query with additional terms based on query type.
   */
  static expandQueryByType(query: string, types: QueryType[]): string[] {
    const expansions: string[] = [query]; // Always include original query
    
    if (types.includes('RESOURCE_QUESTION')) {
      expansions.push(`${query} tokens spend prelude action material fuel weapon relic psionic list types`);
      expansions.push(`resource tokens spend actions list types`);
    }
    
    if (types.includes('CARD_QUESTION')) {
      expansions.push(`${query} play hand deck discard action effect text abilities`);
    }
    
    if (types.includes('VICTORY_QUESTION')) {
      expansions.push(`${query} win game victory points objective scoring end conditions`);
    }
    
    if (types.includes('ACTION_QUESTION')) {
      expansions.push(`${query} turn action move build repair fight battle secure abilities`);
    }
    
    if (types.includes('COMPONENT_QUESTION')) {
      // For component questions like "what are the 5 [something]"
      if (query.toLowerCase().match(/what are the (5|five|different)/)) {
        expansions.push(`${query} list items bullets types components tokens resources actions`);
        expansions.push(`components resources actions list types rulebook`);
      }
    }
    
    // For enumeration questions, expand to find comprehensive lists
    if (types.includes('ENUMERATION_QUESTION')) {
      // Extract the subject of the enumeration
      const matches = query.toLowerCase().match(/how many (.+?)(\s|are|\?|$)/i) || 
                     query.toLowerCase().match(/what are (?:all|the) (.+?)(\s|\?|$)/i) ||
                     query.toLowerCase().match(/list (?:all|the) (.+?)(\s|\?|$)/i);
      
      if (matches && matches[1]) {
        const subject = matches[1].trim();
        expansions.push(`${subject} list all types`);
        expansions.push(`${subject} count total number`);
      }
      
      expansions.push(`${query} complete list comprehensive all variants`);
    }
    
    // For comparison questions
    if (types.includes('COMPARISON_QUESTION')) {
      // Extract the compared entities
      const compareMatches = query.toLowerCase().match(/(.*?)\b(versus|vs|compared to|difference between|instead of)\b(.*)/i);
      if (compareMatches) {
        const firstTerm = compareMatches[1].trim();
        const secondTerm = compareMatches[3].trim();
        
        if (firstTerm && secondTerm) {
          expansions.push(`${firstTerm} rules mechanics`);
          expansions.push(`${secondTerm} rules mechanics`);
          expansions.push(`${firstTerm} ${secondTerm} comparison`);
        }
      }
    }
    
    // For interaction questions
    if (types.includes('INTERACTION_QUESTION')) {
      expansions.push(`${query} rules combination interaction effect together`);
      expansions.push(`${query} rule conflict resolution precedence`);
    }
    
    // For complex reasoning questions
    if (types.includes('REASONING_QUESTION')) {
      expansions.push(`${query} rules explanation detailed scenario example`);
      expansions.push(`${query} mechanics implications consequences`);
      
      // For "why" questions
      if (query.toLowerCase().includes('why')) {
        expansions.push(`${query} reason purpose design intention rules`);
      }
    }
    
    return expansions;
  }

  /**
   * Generates search variations with comprehensive expansion analysis.
   */
  static generateSearchVariations(options: QueryExpansionOptions): QueryExpansionResult {
    const { query, queryTypes } = options;
    
    const expandedQueries = this.expandQueryByType(query, queryTypes);
    
    // Determine expansion strategy based on types
    let expansionStrategy = 'standard';
    if (queryTypes.includes('ENUMERATION_QUESTION')) {
      expansionStrategy = 'enumeration-focused';
    } else if (queryTypes.includes('COMPARISON_QUESTION')) {
      expansionStrategy = 'comparison-focused';
    } else if (queryTypes.includes('INTERACTION_QUESTION')) {
      expansionStrategy = 'interaction-focused';
    } else if (queryTypes.includes('REASONING_QUESTION')) {
      expansionStrategy = 'reasoning-focused';
    }
    
    return {
      originalQuery: query,
      expandedQueries,
      expansionStrategy
    };
  }

  /**
   * Extracts subject from enumeration questions for targeted expansion.
   */
  static extractEnumerationSubject(query: string): string | null {
    const matches = query.toLowerCase().match(/how many (.+?)(\s|are|\?|$)/i) || 
                   query.toLowerCase().match(/what are (?:all|the) (.+?)(\s|\?|$)/i) ||
                   query.toLowerCase().match(/list (?:all|the) (.+?)(\s|\?|$)/i);
    
    return matches && matches[1] ? matches[1].trim() : null;
  }

  /**
   * Extracts compared entities from comparison questions.
   */
  static extractComparisonEntities(query: string): { firstTerm: string; secondTerm: string } | null {
    const compareMatches = query.toLowerCase().match(/(.*?)\b(versus|vs|compared to|difference between|instead of)\b(.*)/i);
    
    if (compareMatches) {
      const firstTerm = compareMatches[1].trim();
      const secondTerm = compareMatches[3].trim();
      
      if (firstTerm && secondTerm) {
        return { firstTerm, secondTerm };
      }
    }
    
    return null;
  }

  /**
   * Generates context-specific expansions for complex question types.
   */
  static generateContextualExpansions(query: string, queryTypes: QueryType[]): string[] {
    const contextualExpansions: string[] = [];
    
    // Add domain-specific terms based on question type
    if (queryTypes.includes('RESOURCE_QUESTION')) {
      contextualExpansions.push('material fuel weapon relic psionic prelude action resources');
    }
    
    if (queryTypes.includes('CARD_QUESTION')) {
      contextualExpansions.push('cards deck hand abilities effects actions play discard');
    }
    
    if (queryTypes.includes('ACTION_QUESTION')) {
      contextualExpansions.push('actions turn move build repair fight battle secure abilities');
    }
    
    if (queryTypes.includes('VICTORY_QUESTION')) {
      contextualExpansions.push('victory points objectives scoring win conditions end game');
    }
    
    return contextualExpansions;
  }
} 