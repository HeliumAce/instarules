import { describe, it, expect } from 'vitest';
import { generateSessionId, findUserQuestionForMessage } from './utils';
import { Message } from '@/types/game';

describe('generateSessionId', () => {
  it('should generate unique session IDs', () => {
    const id1 = generateSessionId();
    const id2 = generateSessionId();
    
    expect(id1).toBeDefined();
    expect(id2).toBeDefined();
    expect(id1).not.toBe(id2);
  });

  it('should generate valid UUID v4 format', () => {
    const id = generateSessionId();
    
    // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(id).toMatch(uuidPattern);
  });
});

describe('findUserQuestionForMessage', () => {
  const createMockMessage = (id: string, content: string, isUser: boolean): Message => ({
    id,
    content,
    isUser,
    createdAt: new Date().toISOString(),
    sessionId: 'test-session',
  });

  it('should find the user question for an AI response', () => {
    const messages: Message[] = [
      createMockMessage('user-1', 'What are the rules?', true),
      createMockMessage('ai-1', 'Here are the rules...', false),
      createMockMessage('user-2', 'Tell me about cards', true),
      createMockMessage('ai-2', 'Cards work like this...', false),
    ];

    const result = findUserQuestionForMessage(messages, 'ai-2');
    
    expect(result).toBeDefined();
    expect(result?.id).toBe('user-2');
    expect(result?.content).toBe('Tell me about cards');
  });

  it('should return null when AI message is not found', () => {
    const messages: Message[] = [
      createMockMessage('user-1', 'What are the rules?', true),
      createMockMessage('ai-1', 'Here are the rules...', false),
    ];

    const result = findUserQuestionForMessage(messages, 'non-existent-id');
    
    expect(result).toBeNull();
  });

  it('should return null when no user message precedes AI message', () => {
    const messages: Message[] = [
      createMockMessage('ai-1', 'Here are the rules...', false),
      createMockMessage('user-1', 'What are the rules?', true),
    ];

    const result = findUserQuestionForMessage(messages, 'ai-1');
    
    expect(result).toBeNull();
  });

  it('should find the most recent user message before AI response', () => {
    const messages: Message[] = [
      createMockMessage('user-1', 'First question', true),
      createMockMessage('ai-1', 'First answer', false),
      createMockMessage('user-2', 'Second question', true),
      createMockMessage('user-3', 'Third question', true),
      createMockMessage('ai-2', 'Second answer', false),
    ];

    const result = findUserQuestionForMessage(messages, 'ai-2');
    
    expect(result?.id).toBe('user-3'); // Should find the most recent user message
    expect(result?.content).toBe('Third question');
  });
}); 