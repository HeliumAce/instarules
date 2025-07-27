import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FeedbackButtons } from './FeedbackButtons';

describe('FeedbackButtons', () => {
  const mockOnFeedback = vi.fn();
  const mockMessageId = 'test-message-1';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display thumbs up and thumbs down buttons', () => {
    render(
      <FeedbackButtons
        messageId={mockMessageId}
        feedbackState={{}}
        onFeedback={mockOnFeedback}
      />
    );

    expect(screen.getByLabelText('Mark this response as helpful')).toBeInTheDocument();
    expect(screen.getByLabelText('Mark this response as not helpful')).toBeInTheDocument();
  });

  it('should call onFeedback with thumbsUp when thumbs up is clicked', () => {
    render(
      <FeedbackButtons
        messageId={mockMessageId}
        feedbackState={{}}
        onFeedback={mockOnFeedback}
      />
    );

    const thumbsUpButton = screen.getByLabelText('Mark this response as helpful');
    fireEvent.click(thumbsUpButton);

    expect(mockOnFeedback).toHaveBeenCalledWith(mockMessageId, 'thumbsUp');
  });

  it('should call onFeedback with thumbsDown when thumbs down is clicked', () => {
    render(
      <FeedbackButtons
        messageId={mockMessageId}
        feedbackState={{}}
        onFeedback={mockOnFeedback}
      />
    );

    const thumbsDownButton = screen.getByLabelText('Mark this response as not helpful');
    fireEvent.click(thumbsDownButton);

    expect(mockOnFeedback).toHaveBeenCalledWith(mockMessageId, 'thumbsDown');
  });

  it('should display confidence score when provided', () => {
    render(
      <FeedbackButtons
        messageId={mockMessageId}
        feedbackState={{}}
        onFeedback={mockOnFeedback}
        confidence="85%"
      />
    );

    expect(screen.getByText('85% confidence')).toBeInTheDocument();
  });

  it('should not display confidence score when not provided', () => {
    render(
      <FeedbackButtons
        messageId={mockMessageId}
        feedbackState={{}}
        onFeedback={mockOnFeedback}
      />
    );

    expect(screen.queryByText(/confidence/)).not.toBeInTheDocument();
  });

  it('should show edit button with correct tooltip', () => {
    render(
      <FeedbackButtons
        messageId={mockMessageId}
        feedbackState={{}}
        onFeedback={mockOnFeedback}
      />
    );

    const editButton = screen.getByTitle('Edit this question');
    expect(editButton).toBeInTheDocument();
  });

  it('should handle feedback state for thumbs up', () => {
    const feedbackState = {
      [mockMessageId]: { type: 'thumbs_up' }
    };

    render(
      <FeedbackButtons
        messageId={mockMessageId}
        feedbackState={feedbackState}
        onFeedback={mockOnFeedback}
      />
    );

    const thumbsUpButton = screen.getByLabelText('Mark this response as helpful');
    expect(thumbsUpButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('should handle feedback state for thumbs down', () => {
    const feedbackState = {
      [mockMessageId]: { type: 'thumbs_down' }
    };

    render(
      <FeedbackButtons
        messageId={mockMessageId}
        feedbackState={feedbackState}
        onFeedback={mockOnFeedback}
      />
    );

    const thumbsDownButton = screen.getByLabelText('Mark this response as not helpful');
    expect(thumbsDownButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('should handle no feedback state', () => {
    render(
      <FeedbackButtons
        messageId={mockMessageId}
        feedbackState={{}}
        onFeedback={mockOnFeedback}
      />
    );

    const thumbsUpButton = screen.getByLabelText('Mark this response as helpful');
    const thumbsDownButton = screen.getByLabelText('Mark this response as not helpful');
    
    expect(thumbsUpButton).toHaveAttribute('aria-pressed', 'false');
    expect(thumbsDownButton).toHaveAttribute('aria-pressed', 'false');
  });
}); 