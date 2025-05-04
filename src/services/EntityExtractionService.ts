/**
 * EntityExtractionService.ts
 * 
 * This service extracts key entities from conversation history to help
 * with resolving pronouns and references in follow-up questions.
 */

export interface Entity {
  text: string;
  type: string;  // optional categorization (e.g., "resource", "card", "action")
  position: number;  // position in the conversation (higher = more recent)
  salience: number;  // how prominent was this entity (0-1)
}

/**
 * Extracts key entities from previous messages
 */
export function extractEntitiesFromHistory(
  chatHistory: { content: string; isUser: boolean }[]
): Entity[] {
  const entities: Entity[] = [];
  let position = 0;
  
  // Process messages in order (oldest to newest)
  for (const message of chatHistory) {
    position++;
    
    // Focus on assistant responses as they contain structured information
    if (!message.isUser) {
      // Extract entities from assistant messages
      extractEntitiesFromMessage(message.content, position, entities);
    } else {
      // Extract key entities from user questions
      extractEntitiesFromUserQuestion(message.content, position, entities);
    }
  }
  
  // Return deduplicated entities
  return deduplicateEntities(entities);
}

/**
 * Extracts entities from assistant messages
 */
function extractEntitiesFromMessage(
  content: string,
  position: number,
  entities: Entity[]
): void {
  // Look for list items which often enumerate important game concepts
  const listMatches = content.match(/(?:^|\n)(?:[\-•*]\s+|\d+\.\s+)(.+?)(?:$|\n)/gm);
  if (listMatches) {
    listMatches.forEach(match => {
      const itemText = match.replace(/^(?:[\-•*]\s+|\d+\.\s+)/, '').trim();
      entities.push({
        text: itemText,
        type: 'list_item',
        position,
        salience: 0.8
      });
    });
  }
  
  // Look for emphasized terms (often game terms and important concepts)
  const emphasisMatches = content.match(/(?:\*\*|__)(.+?)(?:\*\*|__)/g);
  if (emphasisMatches) {
    emphasisMatches.forEach(match => {
      const term = match.replace(/(?:\*\*|__)/g, '').trim();
      entities.push({
        text: term,
        type: 'emphasized',
        position,
        salience: 0.9
      });
    });
  }
}

/**
 * Extract relevant entities from user questions
 */
function extractEntitiesFromUserQuestion(
  content: string,
  position: number,
  entities: Entity[]
): void {
  // Look for "what is/are X" patterns
  const whatIsMatches = content.match(/what\s+(?:is|are)\s+(?:the|a|an)?\s+([a-zA-Z0-9\s]+?)(?:\?|$|\s+in)/i);
  if (whatIsMatches && whatIsMatches[1]) {
    entities.push({
      text: whatIsMatches[1].trim(),
      type: 'question_subject',
      position,
      salience: 1.0  // Subject of a direct question gets highest salience
    });
  }
  
  // Look for "how do X" patterns
  const howDoMatches = content.match(/how\s+(?:do|does|can)\s+(?:the|a|an)?\s+([a-zA-Z0-9\s]+?)(?:\?|$|\s+work)/i);
  if (howDoMatches && howDoMatches[1]) {
    entities.push({
      text: howDoMatches[1].trim(),
      type: 'question_subject',
      position,
      salience: 1.0
    });
  }
}

/**
 * Deduplicate and merge related entities
 */
function deduplicateEntities(entities: Entity[]): Entity[] {
  // Deduplicate entities with same text
  const uniqueEntities: Record<string, Entity> = {};
  
  for (const entity of entities) {
    const lowercase = entity.text.toLowerCase();
    
    if (uniqueEntities[lowercase]) {
      // Update existing entity with higher position/salience
      uniqueEntities[lowercase].position = Math.max(
        uniqueEntities[lowercase].position, 
        entity.position
      );
      uniqueEntities[lowercase].salience = Math.max(
        uniqueEntities[lowercase].salience, 
        entity.salience
      );
    } else {
      uniqueEntities[lowercase] = entity;
    }
  }
  
  return Object.values(uniqueEntities);
}

/**
 * Rank entities by relevance to the current query
 */
export function rankEntitiesByRelevance(
  entities: Entity[], 
  query: string
): Entity[] {
  return [...entities].sort((a, b) => {
    // Position is most important (recency)
    const positionDiff = b.position - a.position;
    if (positionDiff !== 0) return positionDiff;
    
    // Then salience
    return b.salience - a.salience;
  });
} 