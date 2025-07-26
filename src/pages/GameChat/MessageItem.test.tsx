import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MessageItem } from './MessageItem';
import { Message, MessageSources } from '@/types/game';

// Mock ReactMarkdown to avoid complex markdown parsing in tests
vi.mock('react-markdown', () => ({
  default: ({ children }: { children: string }) => (
    <div data-testid="markdown-content">{children}</div>
  ),
}));

// Mock SourcesToggle component
vi.mock('./SourcesToggle', () => ({
  SourcesToggle: ({ sources, onSourceClick }: any) => (
    <div data-testid="sources-toggle" onClick={() => onSourceClick?.({ id: 'test-source' })}>
      Sources ({sources.count})
    </div>
  ),
}));

describe('MessageItem', () => {
  const mockUserMessage: Message = {
    id: 'user-1',
    content: 'What are the rules?',
    isUser: true,
    createdAt: new Date().toISOString(),
    sessionId: 'test-session',
  };

  const mockAIMessage: Message = {
    id: 'ai-1',
    content: 'Here are the rules...',
    isUser: false,
    createdAt: new Date().toISOString(),
    sessionId: 'test-session',
    confidence: '85%',
    sources: {
      count: 2,
      sources: [{ id: 'source-1', contentType: 'rule', title: 'Test Rule', content: 'Test content' }]
    }
  };

  const mockFeedbackState = {
    'ai-1': { type: 'thumbs_up' }
  };

  const mockEmptySources: MessageSources = {
    count: 0,
    sources: []
  };

  const mockOnFeedback = vi.fn();
  const mockOnSourceClick = vi.fn();

  it('should display user message content', () => {
    render(
      <MessageItem
        message={mockUserMessage}
        feedbackState={{}}
        onFeedback={mockOnFeedback}
        onSourceClick={mockOnSourceClick}
        emptySourcesData={mockEmptySources}
      />
    );

    expect(screen.getByText('What are the rules?')).toBeInTheDocument();
  });

  it('should display AI message content with markdown', () => {
    render(
      <MessageItem
        message={mockAIMessage}
        feedbackState={mockFeedbackState}
        onFeedback={mockOnFeedback}
        onSourceClick={mockOnSourceClick}
        emptySourcesData={mockEmptySources}
      />
    );

    expect(screen.getByTestId('markdown-content')).toHaveTextContent('Here are the rules...');
  });

  it('should show confidence score for AI messages', () => {
    render(
      <MessageItem
        message={mockAIMessage}
        feedbackState={mockFeedbackState}
        onFeedback={mockOnFeedback}
        onSourceClick={mockOnSourceClick}
        emptySourcesData={mockEmptySources}
      />
    );

    expect(screen.getByText('85% confidence')).toBeInTheDocument();
  });

  it('should call onFeedback when thumbs up is clicked', () => {
    render(
      <MessageItem
        message={mockAIMessage}
        feedbackState={{}}
        onFeedback={mockOnFeedback}
        onSourceClick={mockOnSourceClick}
        emptySourcesData={mockEmptySources}
      />
    );

    const thumbsUpButton = screen.getByLabelText('Mark this response as helpful');
    fireEvent.click(thumbsUpButton);

    expect(mockOnFeedback).toHaveBeenCalledWith('ai-1', 'thumbsUp');
  });

  it('should call onFeedback when thumbs down is clicked', () => {
    render(
      <MessageItem
        message={mockAIMessage}
        feedbackState={{}}
        onFeedback={mockOnFeedback}
        onSourceClick={mockOnSourceClick}
        emptySourcesData={mockEmptySources}
      />
    );

    const thumbsDownButton = screen.getByLabelText('Mark this response as not helpful');
    fireEvent.click(thumbsDownButton);

    expect(mockOnFeedback).toHaveBeenCalledWith('ai-1', 'thumbsDown');
  });

  it('should show sources toggle for AI messages', () => {
    render(
      <MessageItem
        message={mockAIMessage}
        feedbackState={mockFeedbackState}
        onFeedback={mockOnFeedback}
        onSourceClick={mockOnSourceClick}
        emptySourcesData={mockEmptySources}
      />
    );

    expect(screen.getByTestId('sources-toggle')).toBeInTheDocument();
    expect(screen.getByText('Sources (2)')).toBeInTheDocument();
  });

  it('should not show sources toggle for user messages', () => {
    render(
      <MessageItem
        message={mockUserMessage}
        feedbackState={{}}
        onFeedback={mockOnFeedback}
        onSourceClick={mockOnSourceClick}
        emptySourcesData={mockEmptySources}
      />
    );

    expect(screen.queryByTestId('sources-toggle')).not.toBeInTheDocument();
  });

  it('should call onSourceClick when sources are clicked', () => {
    render(
      <MessageItem
        message={mockAIMessage}
        feedbackState={mockFeedbackState}
        onFeedback={mockOnFeedback}
        onSourceClick={mockOnSourceClick}
        emptySourcesData={mockEmptySources}
      />
    );

    const sourcesToggle = screen.getByTestId('sources-toggle');
    fireEvent.click(sourcesToggle);

    expect(mockOnSourceClick).toHaveBeenCalledWith({ id: 'test-source' });
  });

  it('should not show confidence score when confidence is not provided', () => {
    const messageWithoutConfidence = { ...mockAIMessage, confidence: undefined };
    
    render(
      <MessageItem
        message={messageWithoutConfidence}
        feedbackState={mockFeedbackState}
        onFeedback={mockOnFeedback}
        onSourceClick={mockOnSourceClick}
        emptySourcesData={mockEmptySources}
      />
    );

    expect(screen.queryByText(/confidence/)).not.toBeInTheDocument();
  });
}); 