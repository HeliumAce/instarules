/**
 * Query Preprocessor Service
 * 
 * Enhances search queries to improve vector search results by expanding terms
 * and adding relevant context based on query classification.
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

/**
 * Classifies a query into different types to determine preprocessing strategy
 */
export function classifyQuery(query: string): QueryType[] {
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
 * Expand a query with additional terms based on query type
 */
export function expandQueryByType(query: string, types: QueryType[]): string[] {
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
 * Main preprocessing function that transforms a query for better search results
 */
export function preprocessQuery(query: string): string[] {
  // 1. Classify the query
  const queryTypes = classifyQuery(query);
  
  // 2. Expand based on classification
  const expandedQueries = expandQueryByType(query, queryTypes);
  
  // 3. Log for debugging
  console.log(`[QueryPreprocessor] Original: "${query}"`);
  console.log(`[QueryPreprocessor] Types: ${queryTypes.join(', ')}`);
  console.log(`[QueryPreprocessor] Expanded: ${expandedQueries.length} variations`);
  
  return expandedQueries;
}

// Helper functions for testing and special cases
export function isResourceQuestion(query: string): boolean {
  return classifyQuery(query).includes('RESOURCE_QUESTION');
}

export function isEnumerationQuestion(query: string): boolean {
  const lowerQuery = query.toLowerCase();
  return lowerQuery.match(/what are the (5|five|different|types|kinds)/) !== null;
} 