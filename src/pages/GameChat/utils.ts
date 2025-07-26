import { Message } from '@/types/game';

/**
 * Generate a unique session ID for chat sessions
 * Creates a proper UUID v4 for database compatibility
 */
export const generateSessionId = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * Find the user question that corresponds to an AI response
 * @param messages - Array of chat messages
 * @param aiMessageId - ID of the AI message to find the question for
 * @returns The user message that prompted the AI response, or null if not found
 */
export const findUserQuestionForMessage = (messages: Message[], aiMessageId: string): Message | null => {
  // Find the AI message
  const aiMessageIndex = messages.findIndex(msg => msg.id === aiMessageId);
  if (aiMessageIndex === -1) return null;
  
  // Look backwards from the AI message to find the most recent user message
  for (let i = aiMessageIndex - 1; i >= 0; i--) {
    if (messages[i].isUser) {
      return messages[i];
    }
  }
  
  return null;
}; 