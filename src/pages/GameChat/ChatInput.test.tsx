import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatInput } from './ChatInput';

describe('ChatInput', () => {
  const mockSetInput = vi.fn();
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display textarea with correct placeholder when ready', () => {
    render(
      <ChatInput
        input=""
        setInput={mockSetInput}
        onSubmit={mockOnSubmit}
        isAsking={false}
        isRulesLoading={false}
        isRulesError={false}
        rulesQueryData={{}}
      />
    );

    expect(screen.getByPlaceholderText('Ask about rules, setup, or gameplay...')).toBeInTheDocument();
  });

  it('should display loading placeholder when rules are loading', () => {
    render(
      <ChatInput
        input=""
        setInput={mockSetInput}
        onSubmit={mockOnSubmit}
        isAsking={false}
        isRulesLoading={true}
        isRulesError={false}
        rulesQueryData={null}
      />
    );

    expect(screen.getByPlaceholderText('Loading rules...')).toBeInTheDocument();
  });

  it('should display processing placeholder when asking', () => {
    render(
      <ChatInput
        input=""
        setInput={mockSetInput}
        onSubmit={mockOnSubmit}
        isAsking={true}
        isRulesLoading={false}
        isRulesError={false}
        rulesQueryData={{}}
      />
    );

    expect(screen.getByPlaceholderText('Processing your question...')).toBeInTheDocument();
  });

  it('should call setInput when user types', () => {
    render(
      <ChatInput
        input=""
        setInput={mockSetInput}
        onSubmit={mockOnSubmit}
        isAsking={false}
        isRulesLoading={false}
        isRulesError={false}
        rulesQueryData={{}}
      />
    );

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'test input' } });

    expect(mockSetInput).toHaveBeenCalledWith('test input');
  });

  it('should call onSubmit when form is submitted', () => {
    render(
      <ChatInput
        input="test message"
        setInput={mockSetInput}
        onSubmit={mockOnSubmit}
        isAsking={false}
        isRulesLoading={false}
        isRulesError={false}
        rulesQueryData={{}}
      />
    );

    const submitButton = screen.getByRole('button');
    fireEvent.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalled();
  });

  it('should call onSubmit when Enter is pressed without Shift', () => {
    render(
      <ChatInput
        input="test message"
        setInput={mockSetInput}
        onSubmit={mockOnSubmit}
        isAsking={false}
        isRulesLoading={false}
        isRulesError={false}
        rulesQueryData={{}}
      />
    );

    const textarea = screen.getByRole('textbox');
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });

    expect(mockOnSubmit).toHaveBeenCalled();
  });

  it('should not call onSubmit when Enter is pressed with Shift', () => {
    render(
      <ChatInput
        input="test message"
        setInput={mockSetInput}
        onSubmit={mockOnSubmit}
        isAsking={false}
        isRulesLoading={false}
        isRulesError={false}
        rulesQueryData={{}}
      />
    );

    const textarea = screen.getByRole('textbox');
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should not call onSubmit when input is empty', () => {
    render(
      <ChatInput
        input=""
        setInput={mockSetInput}
        onSubmit={mockOnSubmit}
        isAsking={false}
        isRulesLoading={false}
        isRulesError={false}
        rulesQueryData={{}}
      />
    );

    const textarea = screen.getByRole('textbox');
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should disable textarea and button when loading', () => {
    render(
      <ChatInput
        input="test"
        setInput={mockSetInput}
        onSubmit={mockOnSubmit}
        isAsking={true}
        isRulesLoading={false}
        isRulesError={false}
        rulesQueryData={{}}
      />
    );

    const textarea = screen.getByRole('textbox');
    const submitButton = screen.getByRole('button');

    expect(textarea).toBeDisabled();
    expect(submitButton).toBeDisabled();
  });

  it('should disable textarea and button when rules are loading', () => {
    render(
      <ChatInput
        input="test"
        setInput={mockSetInput}
        onSubmit={mockOnSubmit}
        isAsking={false}
        isRulesLoading={true}
        isRulesError={false}
        rulesQueryData={null}
      />
    );

    const textarea = screen.getByRole('textbox');
    const submitButton = screen.getByRole('button');

    expect(textarea).toBeDisabled();
    expect(submitButton).toBeDisabled();
  });

  it('should disable textarea and button when rules have error', () => {
    render(
      <ChatInput
        input="test"
        setInput={mockSetInput}
        onSubmit={mockOnSubmit}
        isAsking={false}
        isRulesLoading={false}
        isRulesError={true}
        rulesQueryData={null}
      />
    );

    const textarea = screen.getByRole('textbox');
    const submitButton = screen.getByRole('button');

    expect(textarea).toBeDisabled();
    expect(submitButton).toBeDisabled();
  });

  it('should disable submit button when input is empty', () => {
    render(
      <ChatInput
        input=""
        setInput={mockSetInput}
        onSubmit={mockOnSubmit}
        isAsking={false}
        isRulesLoading={false}
        isRulesError={false}
        rulesQueryData={{}}
      />
    );

    const submitButton = screen.getByRole('button');
    expect(submitButton).toBeDisabled();
  });

  it('should show loading spinner when asking', () => {
    render(
      <ChatInput
        input="test"
        setInput={mockSetInput}
        onSubmit={mockOnSubmit}
        isAsking={true}
        isRulesLoading={false}
        isRulesError={false}
        rulesQueryData={{}}
      />
    );

    // The Loader2 component should be present (vitest will find it by the class)
    const submitButton = screen.getByRole('button');
    expect(submitButton.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('should show send icon when not asking', () => {
    render(
      <ChatInput
        input="test"
        setInput={mockSetInput}
        onSubmit={mockOnSubmit}
        isAsking={false}
        isRulesLoading={false}
        isRulesError={false}
        rulesQueryData={{}}
      />
    );

    // The SendHorizontal component should be present
    const submitButton = screen.getByRole('button');
    expect(submitButton.querySelector('svg')).toBeInTheDocument();
  });
}); 