import { SendHorizontal, Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isAsking: boolean;
  isRulesLoading: boolean;
  isRulesError: boolean;
  rulesQueryData: any;
}

export function ChatInput({
  input,
  setInput,
  onSubmit,
  isAsking,
  isRulesLoading,
  isRulesError,
  rulesQueryData
}: ChatInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Submit form on Enter key press without Shift key
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isAsking && !isRulesLoading && !isRulesError && rulesQueryData) {
        onSubmit(e);
      }
    }
  };

  const getPlaceholder = () => {
    if (isRulesLoading) return "Loading rules...";
    if (isAsking) return "Processing your question...";
    return "Ask about rules, setup, or gameplay...";
  };

  const isDisabled = isAsking || isRulesLoading || isRulesError || !rulesQueryData;

  return (
    <footer className="bg-background pt-1 pb-3 px-4">
      <form onSubmit={onSubmit} className="mx-auto max-w-3xl">
        <div className="relative">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={getPlaceholder()}
            className="flex-1 bg-muted text-foreground pr-12 h-[130px] resize-none rounded-md"
            disabled={isDisabled}
          />
          <Button 
            type="submit" 
            disabled={isDisabled || !input.trim()}
            className="absolute top-2 right-2 p-2 h-auto"
            variant="ghost"
          >
            {isAsking ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <SendHorizontal size={18} />
            )}
          </Button>
        </div>
      </form>
    </footer>
  );
} 