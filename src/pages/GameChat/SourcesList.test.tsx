import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SourcesList } from './SourcesList';
import { Source, RuleSource, CardSource } from '@/types/game';

describe('SourcesList', () => {
  const mockRuleSource: RuleSource = {
    id: 'rule-1',
    contentType: 'rule',
    title: 'Test Rule',
    content: 'Test rule content',
    bookName: 'Base Game',
    headings: ['Test Heading'],
    sourceHeading: 'Test Rule Heading',
    pageNumber: 42,
  };

  const mockCardSource: CardSource = {
    id: 'card-1',
    contentType: 'card',
    title: 'Test Card',
    content: 'Test card content',
    cardId: 'CARD001',
    cardName: 'Test Card Name',
  };

  const mockOnSourceClick = vi.fn();
  const mockCloseTooltip = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display rule sources with correct formatting', () => {
    render(
      <SourcesList
        sources={[mockRuleSource]}
        onSourceClick={mockOnSourceClick}
        closeTooltip={mockCloseTooltip}
      />
    );

    expect(screen.getByText('Base Game')).toBeInTheDocument();
    expect(screen.getByText('Test Rule Heading')).toBeInTheDocument();
    expect(screen.getByText('Page 42')).toBeInTheDocument();
  });

  it('should display card sources with correct formatting', () => {
    render(
      <SourcesList
        sources={[mockCardSource]}
        onSourceClick={mockOnSourceClick}
        closeTooltip={mockCloseTooltip}
      />
    );

    // Be more specific - look for the card name in the button content
    expect(screen.getByRole('button', { name: /Test Card Name/ })).toBeInTheDocument();
    expect(screen.getByText('CARD001')).toBeInTheDocument();
  });

  it('should call onSourceClick when a source is clicked', () => {
    render(
      <SourcesList
        sources={[mockRuleSource]}
        onSourceClick={mockOnSourceClick}
        closeTooltip={mockCloseTooltip}
      />
    );

    const sourceButton = screen.getByRole('button', { name: /Test Rule Heading/ });
    fireEvent.click(sourceButton);

    expect(mockOnSourceClick).toHaveBeenCalledWith(mockRuleSource);
  });

  it('should call closeTooltip when a source is clicked', () => {
    render(
      <SourcesList
        sources={[mockRuleSource]}
        onSourceClick={mockOnSourceClick}
        closeTooltip={mockCloseTooltip}
      />
    );

    const sourceButton = screen.getByRole('button', { name: /Test Rule Heading/ });
    fireEvent.click(sourceButton);

    expect(mockCloseTooltip).toHaveBeenCalled();
  });

  it('should categorize sources by book name', () => {
    const baseGameRule: RuleSource = { ...mockRuleSource, bookName: 'Base Game' };
    const expansionRule: RuleSource = { ...mockRuleSource, id: 'rule-2', bookName: 'Expansion Pack' };

    render(
      <SourcesList
        sources={[baseGameRule, expansionRule]}
        onSourceClick={mockOnSourceClick}
        closeTooltip={mockCloseTooltip}
      />
    );

    expect(screen.getByText('Base Game')).toBeInTheDocument();
    expect(screen.getByText('Expansion Pack')).toBeInTheDocument();
  });

  it('should handle empty sources list', () => {
    render(
      <SourcesList
        sources={[]}
        onSourceClick={mockOnSourceClick}
        closeTooltip={mockCloseTooltip}
      />
    );

    // Should render without errors, but no content
    expect(screen.queryByText(/Base Game/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Test/)).not.toBeInTheDocument();
  });

  it('should provide helpful tooltips for sources', () => {
    render(
      <SourcesList
        sources={[mockRuleSource]}
        onSourceClick={mockOnSourceClick}
        closeTooltip={mockCloseTooltip}
      />
    );

    const sourceButton = screen.getByRole('button', { name: /Test Rule Heading/ });
    expect(sourceButton).toHaveAttribute('title', 'Test Rule Heading (p.42)');
  });

  it('should display card sources with ID in title', () => {
    const cardRule: RuleSource = {
      ...mockRuleSource,
      title: 'Test Card (ID: CARD001)',
      sourceHeading: 'Test Card'
    };

    render(
      <SourcesList
        sources={[cardRule]}
        onSourceClick={mockOnSourceClick}
        closeTooltip={mockCloseTooltip}
      />
    );

    expect(screen.getByText('Test Card')).toBeInTheDocument();
    expect(screen.getByText('CARD001')).toBeInTheDocument();
  });
}); 