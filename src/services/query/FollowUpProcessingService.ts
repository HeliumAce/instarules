/**
 * Follow-Up Processing Service
 * 
 * Handles detection, analysis, and reformulation of follow-up questions
 * within conversation contexts for improved contextual understanding.
 */

import { Entity, extractEntitiesFromHistory, rankEntitiesByRelevance } from '@/services/EntityExtractionService';

export interface FollowUpProcessingOptions {
  query: string;
  chatHistory: { content: string; isUser: boolean }[];
}

export interface FollowUpProcessingResult {
  originalQuery: string;
  isFollowUp: boolean;
  reformulatedQuery?: string;
  entities: Entity[];
  previousQuestion?: string;
  confidence: number;
}

export class FollowUpProcessingService {
  /**
   * Detects if a query is likely a follow-up question.
   */
  static detectFollowUp(query: string): boolean {
    const lowerQuery = query.toLowerCase();
    
    // Linguistic patterns that suggest follow-ups
    const followUpPatterns = [
      /^(?:and|so|but)\s+/i,                      // Starting with conjunctions
      /\b(?:they|them|these|those|it|this)\b/i,   // Pronouns without clear referents
      /^(?:when|where|how|why|what)\s+(?:are|is|do|does|can|could)\s+(?:they|them|it|this)\b/i, // WH + be/do + pronoun
      /^(?:who|what)\s+(?:are|is)\s+/i,           // Who/what are/is 
      /\bused\s+for\b/i,                          // Purpose questions
      /^tell\s+me\s+more\b/i,                     // Explicit follow-up requests
      /\bexamples?\b/i,                           // Asking for examples
      /^great\b/i,                                // Common acknowledgment starter
      /^thanks\b/i,                               // Thanks, followed by question
      /^(?:ok|okay)\b/i                           // Acknowledgment
    ];
    
    return followUpPatterns.some(pattern => pattern.test(lowerQuery));
  }

  /**
   * Calculates confidence score for follow-up detection.
   */
  static calculateFollowUpConfidence(query: string): number {
    const lowerQuery = query.toLowerCase();
    let confidence = 0;
    
    // Strong indicators (high confidence)
    if (/\b(?:they|them|these|those|it|this)\b/i.test(lowerQuery)) {
      confidence += 0.4; // Pronouns are strong indicators
    }
    
    if (/^(?:and|so|but)\s+/i.test(lowerQuery)) {
      confidence += 0.3; // Starting with conjunctions
    }
    
    // Medium indicators
    if (/\bused\s+for\b/i.test(lowerQuery)) {
      confidence += 0.2;
    }
    
    if (/\bexamples?\b/i.test(lowerQuery)) {
      confidence += 0.2;
    }
    
    // Weak indicators
    if (/^(?:ok|okay|great|thanks)\b/i.test(lowerQuery)) {
      confidence += 0.1;
    }
    
    return Math.min(confidence, 1.0); // Cap at 1.0
  }

  /**
   * Reformulates follow-up queries by replacing pronouns with entities.
   */
  static reformulateFollowUp(
    query: string, 
    entities: Entity[],
    previousQuestion?: string
  ): string {
    if (entities.length === 0) return query;
    
    // Get the highest-ranked entities - these are most likely the subjects of the follow-up
    const rankingResult = rankEntitiesByRelevance({ entities, query });
    const sortedEntities = rankingResult.entities;
    
    // Get the most relevant entity
    const primaryEntity = sortedEntities[0];
    
    // Common pronouns to replace
    const pronounPatterns = [
      { pattern: /\b(?:they|them|these|those)\b/i, replacement: `${primaryEntity.text}` },
      { pattern: /\b(?:it|this)\b/i, replacement: `${primaryEntity.text}` }
    ];
    
    let reformulated = query;
    
    // Try to replace pronouns
    for (const { pattern, replacement } of pronounPatterns) {
      if (pattern.test(reformulated)) {
        reformulated = reformulated.replace(pattern, replacement);
        break; // Only replace one pronoun to avoid over-substitution
      }
    }
    
    // If no pronouns were found but it's still a follow-up,
    // add contextual information from the previous question
    if (reformulated === query && previousQuestion) {
      // Extract what the previous question was about
      const subjectMatches = 
        previousQuestion.toLowerCase().match(/what (?:are|is) (?:the|a|an)? (.+?)(?:\?|$)/i) ||
        previousQuestion.toLowerCase().match(/how (?:do|does) (.+?) work/i);
      
      if (subjectMatches && subjectMatches[1]) {
        const subject = subjectMatches[1].trim();
        // Add the subject for context
        reformulated = `${reformulated} regarding ${subject}`;
      } else if (primaryEntity) {
        // Fall back to using the primary entity
        reformulated = `${reformulated} about ${primaryEntity.text}`;
      }
    }
    
    return reformulated;
  }

  /**
   * Gets the previous user question from chat history.
   */
  static getPreviousUserQuestion(chatHistory: { content: string; isUser: boolean }[]): string {
    const previousUserMessages = chatHistory
      .filter(msg => msg.isUser)
      .slice(-2, -1);
    
    return previousUserMessages.length > 0 ? previousUserMessages[0].content : '';
  }

  /**
   * Processes a query for follow-up characteristics and reformulation.
   */
  static processFollowUp(options: FollowUpProcessingOptions): FollowUpProcessingResult {
    const { query, chatHistory } = options;
    
    // Check if this is a follow-up question
    const isFollowUp = this.detectFollowUp(query);
    const confidence = this.calculateFollowUpConfidence(query);
    
    if (!isFollowUp) {
      return {
        originalQuery: query,
        isFollowUp: false,
        entities: [],
        confidence: 0
      };
    }
    
    console.log('[Follow-up Detection] Detected potential follow-up question:', query);
    
    // Get entities from conversation history
    const entityResult = extractEntitiesFromHistory({ chatHistory });
    const entities = entityResult.entities;
    console.log('[Follow-up Detection] Extracted entities:', entities.map(e => e.text).join(', '));
    
    // Get previous question for context
    const previousQuestion = this.getPreviousUserQuestion(chatHistory);
    
    // Attempt reformulation if we have entities
    let reformulatedQuery: string | undefined;
    if (entities.length > 0) {
      reformulatedQuery = this.reformulateFollowUp(query, entities, previousQuestion);
      
      if (reformulatedQuery !== query) {
        console.log('[Follow-up Detection] Reformulated query:', reformulatedQuery);
      }
    }
    
    return {
      originalQuery: query,
      isFollowUp: true,
      reformulatedQuery,
      entities,
      previousQuestion,
      confidence
    };
  }

  /**
   * Analyzes conversation context to extract relevant information for follow-up processing.
   */
  static analyzeConversationContext(chatHistory: { content: string; isUser: boolean }[]): {
    recentTopics: string[];
    entities: Entity[];
    conversationLength: number;
  } {
    const entityResult = extractEntitiesFromHistory({ chatHistory });
    const entities = entityResult.entities;
    const conversationLength = chatHistory.length;
    
    // Extract recent topics from the last few user messages
    const recentUserMessages = chatHistory
      .filter(msg => msg.isUser)
      .slice(-3) // Last 3 user messages
      .map(msg => msg.content);
    
    // Simple topic extraction (could be enhanced with more sophisticated NLP)
    const recentTopics = recentUserMessages
      .flatMap(msg => {
        // Extract potential topics from questions
        const topicMatches = msg.toLowerCase().match(/(?:what|how|where|when|why|which) (?:are|is|do|does) (?:the )?(.+?)(?:\?|$)/gi);
        return topicMatches ? topicMatches.map(match => match.split(' ').slice(3).join(' ').replace('?', '').trim()) : [];
      })
      .filter(topic => topic.length > 2);
    
    return {
      recentTopics,
      entities,
      conversationLength
    };
  }

  /**
   * Determines if a follow-up question needs contextual enhancement.
   */
  static needsContextualEnhancement(query: string, entities: Entity[]): boolean {
    const hasPronouns = /\b(?:they|them|these|those|it|this)\b/i.test(query);
    const isVague = query.length < 20 && !query.includes('?');
    const hasEntities = entities.length > 0;
    
    return (hasPronouns || isVague) && hasEntities;
  }
} 