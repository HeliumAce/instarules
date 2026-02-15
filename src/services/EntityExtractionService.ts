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

export interface ChatMessage {
  content: string;
  isUser: boolean;
}

export interface EntityExtractionOptions {
  chatHistory: ChatMessage[];
}

export interface EntityExtractionResult {
  entities: Entity[];
  stats: {
    totalEntities: number;
    uniqueEntities: number;
    userEntities: number;
    assistantEntities: number;
  };
}

export interface EntityRankingOptions {
  entities: Entity[];
  query: string;
}

export interface EntityRankingResult {
  entities: Entity[];
  relevanceScores: Map<string, number>;
}

export interface MessageExtractionOptions {
  content: string;
  position: number;
  entities: Entity[];
}

export interface QuestionExtractionOptions {
  content: string;
  position: number;
  entities: Entity[];
}

/**
 * Extracts key entities from previous messages
 */
export function extractEntitiesFromHistory(options: EntityExtractionOptions): EntityExtractionResult {
  const { chatHistory } = options;
  const entities: Entity[] = [];
  let position = 0;
  let userEntities = 0;
  let assistantEntities = 0;
  
  // Process messages in order (oldest to newest)
  for (const message of chatHistory) {
    position++;
    
    // Focus on assistant responses as they contain structured information
    if (!message.isUser) {
      // Extract entities from assistant messages
      extractEntitiesFromMessage({ content: message.content, position, entities });
      assistantEntities++;
    } else {
      // Extract key entities from user questions
      extractEntitiesFromUserQuestion({ content: message.content, position, entities });
      userEntities++;
    }
  }
  
  // Return deduplicated entities
  const uniqueEntities = deduplicateEntities(entities);
  
  return {
    entities: uniqueEntities,
    stats: {
      totalEntities: entities.length,
      uniqueEntities: uniqueEntities.length,
      userEntities,
      assistantEntities
    }
  };
}

/**
 * Extracts entities from assistant messages
 */
function extractEntitiesFromMessage(options: MessageExtractionOptions): void {
  const { content, position, entities } = options;
  
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
function extractEntitiesFromUserQuestion(options: QuestionExtractionOptions): void {
  const { content, position, entities } = options;
  
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
      salience: 0.9
    });
  }
  
  // Look for capitalized terms (likely proper nouns, game terms)
  const capitalizedMatches = content.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g);
  if (capitalizedMatches) {
    capitalizedMatches.forEach(match => {
      // Filter out common words that shouldn't be entities
      const commonWords = ['The', 'This', 'That', 'What', 'How', 'When', 'Where', 'Why', 'Which', 'Who'];
      if (!commonWords.includes(match)) {
        entities.push({
          text: match,
          type: 'proper_noun',
          position,
          salience: 0.7
        });
      }
    });
  }
}

/**
 * Deduplicates entities and merges their salience scores
 */
function deduplicateEntities(entities: Entity[]): Entity[] {
  const entityMap = new Map<string, Entity>();
  
  entities.forEach(entity => {
    const key = entity.text.toLowerCase().trim();
    const existing = entityMap.get(key);
    
    if (existing) {
      // Merge salience scores (take the higher one)
      existing.salience = Math.max(existing.salience, entity.salience);
      // Keep the more recent position
      if (entity.position > existing.position) {
        existing.position = entity.position;
      }
    } else {
      entityMap.set(key, { ...entity });
    }
  });
  
  return Array.from(entityMap.values());
}

/**
 * Ranks entities by relevance to the current query
 */
export function rankEntitiesByRelevance(options: EntityRankingOptions): EntityRankingResult {
  const { entities, query } = options;
  const relevanceScores = new Map<string, number>();
  const queryLower = query.toLowerCase();
  
  entities.forEach(entity => {
    const entityLower = entity.text.toLowerCase();
    let score = entity.salience; // Start with base salience
    
    // Boost score if entity appears in query
    if (queryLower.includes(entityLower)) {
      score += 0.5;
    }
    
    // Boost score for more recent entities
    score += entity.position * 0.1;
    
    // Boost score for question subjects
    if (entity.type === 'question_subject') {
      score += 0.3;
    }
    
    relevanceScores.set(entity.text, score);
  });
  
  // Sort by relevance score
  const rankedEntities = entities.sort((a, b) => {
    const scoreA = relevanceScores.get(a.text) || 0;
    const scoreB = relevanceScores.get(b.text) || 0;
    return scoreB - scoreA;
  });
  
  return {
    entities: rankedEntities,
    relevanceScores
  };
} 