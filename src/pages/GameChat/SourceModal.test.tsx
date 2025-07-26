import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SourceModal } from './SourceModal';
import { RuleSource, CardSource } from '@/types/game';

// Mock ReactMarkdown to avoid complex markdown parsing in tests
vi.mock('react-markdown', () => ({
  default: ({ children }: { children: string }) => (
    <div data-testid="markdown-content">{children}</div>
  ),
}));

describe('SourceModal', () => {
  const mockRuleSource: RuleSource = {
    id: 'rule-1',
    contentType: 'rule',
    title: 'Test Rule Title',
    content: 'Test Rule Content',
    bookName: 'Base Game',
    headings: ['Test Heading'],
    sourceHeading: 'Test Rule Heading',
    pageNumber: 42,
  };

  const mockCardSource: CardSource = {
    id: 'card-1',
    contentType: 'card',
    title: 'Test Card Title',
    content: 'Test Card Content',
    cardId: 'CARD001',
    cardName: 'Test Card Name',
  };

  it('should display source title and content when modal is open', () => {
    render(
      <SourceModal
        source={mockRuleSource}
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('Test Rule Title')).toBeInTheDocument();
    expect(screen.getByTestId('markdown-content')).toHaveTextContent('Test Rule Content');
  });

  it('should close when user clicks close button', () => {
    const onClose = vi.fn();
    render(
      <SourceModal
        source={mockRuleSource}
        isOpen={true}
        onClose={onClose}
      />
    );

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('should not render when modal is closed', () => {
    render(
      <SourceModal
        source={mockRuleSource}
        isOpen={false}
        onClose={vi.fn()}
      />
    );

    expect(screen.queryByText('Test Rule Title')).not.toBeInTheDocument();
  });

  it('should display fallback content when no content is available', () => {
    const sourceWithoutContent = { ...mockRuleSource, content: '' };
    
    render(
      <SourceModal
        source={sourceWithoutContent}
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByTestId('markdown-content')).toHaveTextContent('No content available.');
  });
}); 