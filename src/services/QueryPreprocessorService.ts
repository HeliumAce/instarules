/**
 * Query Preprocessor Service
 * 
 * Enhances search queries to improve vector search results by expanding terms
 * and adding relevant context based on query classification.
 */

// Query types for classification
type QueryType = 
  | 'RESOURCE_QUESTION'
  | 'CARD_QUESTION'
  | 'RULE_QUESTION'
  | 'SETUP_QUESTION'
  | 'VICTORY_QUESTION'
  | 'ACTION_QUESTION'
  | 'GAMEPLAY_QUESTION'
  | 'COMPONENT_QUESTION'
  | 'GENERAL_QUESTION';

/**
 * Classifies a query into different types to determine preprocessing strategy
 */
function classifyQuery(query: string): QueryType[] {
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
  
  // Catch-all
  if (classifications.length === 0) {
    classifications.push('GENERAL_QUESTION');
  }
  
  return classifications;
}

/**
 * Expand a query with additional terms based on query type
 */
function expandQueryByType(query: string, types: QueryType[]): string[] {
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