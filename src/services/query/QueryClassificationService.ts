/**
 * Query Classification Service
 * 
 * Handles categorization and analysis of questions to determine their type
 * and characteristics for appropriate processing strategies.
 */

// Query types for classification
export type QueryType = 
  | 'RESOURCE_QUESTION'
  | 'CARD_QUESTION'
  | 'RULE_QUESTION'
  | 'SETUP_QUESTION'
  | 'VICTORY_QUESTION'
  | 'ACTION_QUESTION'
  | 'GAMEPLAY_QUESTION'
  | 'COMPONENT_QUESTION'
  | 'GENERAL_QUESTION'
  | 'ENUMERATION_QUESTION'  // How many, list all, etc.
  | 'COMPARISON_QUESTION'   // What's the difference, can I use X instead of Y
  | 'INTERACTION_QUESTION'  // How does X work with Y
  | 'REASONING_QUESTION';   // Why, when, complex conditionals

export interface QueryAnalysis {
  query: string;
  queryTypes: QueryType[];
  isEnumeration: boolean;
  isComparison: boolean;
  isInteraction: boolean;
  isReasoning: boolean;
}

export class QueryClassificationService {
  /**
   * Classifies a query into different types to determine preprocessing strategy.
   */
  static classifyQuery(query: string): QueryType[] {
    const lowerQuery = query.toLowerCase();
    const classifications: QueryType[] = [];
    
    // Resource questions
    if (
      lowerQuery.includes('resource') || 
      lowerQuery.includes('spend') || 
      lowerQuery.includes('token') ||
      (lowerQuery.includes('what') && lowerQuery.includes('5') && lowerQuery.includes('type'))
    ) {
      classifications.push('RESOURCE_QUESTION');
    }
    
    // Card questions
    if (
      lowerQuery.includes('card') || 
      lowerQuery.includes('deck') || 
      lowerQuery.includes('hand')
    ) {
      classifications.push('CARD_QUESTION');
    }
    
    // Rule clarifications
    if (
      lowerQuery.includes('rule') || 
      lowerQuery.includes('how do i') || 
      lowerQuery.includes('how does') || 
      lowerQuery.includes('how to') ||
      lowerQuery.includes('can i') ||
      lowerQuery.includes('allowed')
    ) {
      classifications.push('RULE_QUESTION');
    }
    
    // Setup questions
    if (
      lowerQuery.includes('setup') || 
      lowerQuery.includes('start') || 
      lowerQuery.includes('begin')
    ) {
      classifications.push('SETUP_QUESTION');
    }
    
    // Victory conditions
    if (
      lowerQuery.includes('win') || 
      lowerQuery.includes('victor') || 
      lowerQuery.includes('scoring') ||
      lowerQuery.includes('points') ||
      lowerQuery.includes('objective')
    ) {
      classifications.push('VICTORY_QUESTION');
    }
    
    // Action questions
    if (
      lowerQuery.includes('action') || 
      lowerQuery.includes('move') || 
      lowerQuery.includes('turn') ||
      lowerQuery.includes('play')
    ) {
      classifications.push('ACTION_QUESTION');
    }
    
    // Component questions
    if (
      lowerQuery.includes('piece') || 
      lowerQuery.includes('component') || 
      lowerQuery.includes('token') ||
      lowerQuery.includes('marker') ||
      lowerQuery.includes('board') ||
      lowerQuery.includes('tile')
    ) {
      classifications.push('COMPONENT_QUESTION');
    }
    
    // Enumeration questions (what are the X...)
    if (
      (lowerQuery.includes('what') && 
       (lowerQuery.includes('are') || lowerQuery.includes('is')) && 
       (
         lowerQuery.includes('the 5') || 
         lowerQuery.includes('the five') || 
         lowerQuery.includes('different types') ||
         lowerQuery.includes('kinds of')
       )
      )
    ) {
      // Check if we've already classified this
      if (classifications.length === 0) {
        classifications.push('COMPONENT_QUESTION');
      }
    }
    
    // Add for enumeration questions
    if (
      (lowerQuery.includes('how many') || 
       lowerQuery.includes('list all') || 
       lowerQuery.includes('what are all') ||
       lowerQuery.includes('count') || 
       lowerQuery.match(/what are the (5|five|different|all|types|kinds)/))
    ) {
      classifications.push('ENUMERATION_QUESTION');
    }
    
    // Add for comparison questions
    if (
      lowerQuery.includes('difference between') ||
      lowerQuery.includes('compared to') ||
      lowerQuery.includes('versus') ||
      lowerQuery.includes(' vs ') ||
      lowerQuery.includes('instead of')
    ) {
      classifications.push('COMPARISON_QUESTION');
    }
    
    // Add for interaction questions
    if (
      (lowerQuery.includes('interact') || 
       lowerQuery.includes('work with') || 
       lowerQuery.includes('work together') ||
       lowerQuery.includes('combine')) &&
      (lowerQuery.match(/\band\b/) || lowerQuery.match(/\bwith\b/))
    ) {
      classifications.push('INTERACTION_QUESTION');
    }
    
    // Add for complex reasoning questions
    if (
      lowerQuery.includes('why') ||
      lowerQuery.includes('when would') ||
      lowerQuery.includes('if i') ||
      lowerQuery.includes('what happens if') ||
      lowerQuery.includes('explain how') ||
      lowerQuery.includes('scenario')
    ) {
      classifications.push('REASONING_QUESTION');
    }
    
    // Catch-all
    if (classifications.length === 0) {
      classifications.push('GENERAL_QUESTION');
    }
    
    return classifications;
  }

  /**
   * Performs comprehensive analysis of a query including type classification and characteristics.
   */
  static analyzeQuery(query: string): QueryAnalysis {
    const queryTypes = this.classifyQuery(query);
    
    return {
      query,
      queryTypes,
      isEnumeration: queryTypes.includes('ENUMERATION_QUESTION'),
      isComparison: queryTypes.includes('COMPARISON_QUESTION'),
      isInteraction: queryTypes.includes('INTERACTION_QUESTION'),
      isReasoning: queryTypes.includes('REASONING_QUESTION')
    };
  }

  // Convenience methods for specific question type checks
  static isResourceQuestion(query: string): boolean {
    return this.classifyQuery(query).includes('RESOURCE_QUESTION');
  }

  static isEnumerationQuestion(query: string): boolean {
    const lowerQuery = query.toLowerCase();
    return lowerQuery.match(/what are the (5|five|different|types|kinds)/) !== null;
  }

  static isCardQuestion(query: string): boolean {
    return this.classifyQuery(query).includes('CARD_QUESTION');
  }

  static isRuleQuestion(query: string): boolean {
    return this.classifyQuery(query).includes('RULE_QUESTION');
  }

  static isComparisonQuestion(query: string): boolean {
    return this.classifyQuery(query).includes('COMPARISON_QUESTION');
  }

  static isInteractionQuestion(query: string): boolean {
    return this.classifyQuery(query).includes('INTERACTION_QUESTION');
  }

  static isReasoningQuestion(query: string): boolean {
    return this.classifyQuery(query).includes('REASONING_QUESTION');
  }
} 