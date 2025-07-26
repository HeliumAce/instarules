import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SourceModal } from './SourceModal';
import { RuleSource, CardSource } from '@/types/game';

// Mock the Dialog component to avoid portal issues in tests
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: any) => <h2 data-testid="dialog-title">{children}</h2>,
}));

// Mock ReactMarkdown to avoid markdown parsing issues in tests
vi.mock('react-markdown', () => ({
  default: ({ children }: any) => <div data-testid="markdown-content">{children}</div>,
}));

describe('SourceModal', () => {
  const mockRuleSource: RuleSource = {
    id: 'rule-1',
    contentType: 'rule',
    title: 'Test Rule',
    content: '# Test Rule Content\n\nThis is a test rule with **bold text** and *italic text*.',
    bookName: 'Base Game Rules',
    headings: ['Test Rule'],
    sourceHeading: 'Test Rule',
    pageNumber: 42
  };

  const mockCardSource: CardSource = {
    id: 'card-1',
    contentType: 'card',
    title: 'Test Card',
    content: '**Card Name**: Test Card\n\n**Card ID**: ARCS-001\n\nThis is a test card description.',
    cardId: 'ARCS-001',
    cardName: 'Test Card'
  };

  it('should display rule content when modal is open', () => {
    render(<SourceModal source={mockRuleSource} isOpen={true} onClose={vi.fn()} />);
    
    expect(screen.getByText('Test Rule')).toBeInTheDocument();
    expect(screen.getByTestId('markdown-content')).toHaveTextContent('Test Rule Content');
  });

  it('should display card content when modal is open', () => {
    render(<SourceModal source={mockCardSource} isOpen={true} onClose={vi.fn()} />);
    
    expect(screen.getByText('Test Card')).toBeInTheDocument();
    expect(screen.getByText('Test Card')).toBeInTheDocument(); // Content contains card name
  });

  it('should close when user clicks close button', () => {
    const onClose = vi.fn();
    render(<SourceModal source={mockRuleSource} isOpen={true} onClose={onClose} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(onClose).toHaveBeenCalled();
  });

  it('should not render when modal is closed', () => {
    render(<SourceModal source={mockRuleSource} isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByText('Test Rule')).not.toBeInTheDocument();
  });

  it('should show fallback message when content is empty', () => {
    const sourceWithoutContent: RuleSource = {
      ...mockRuleSource,
      content: ''
    };
    
    render(<SourceModal source={sourceWithoutContent} isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('No content available.')).toBeInTheDocument();
  });
}); 