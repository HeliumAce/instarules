import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { SendHorizontal, Loader2, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useGameContext } from '@/context/GameContext';
import { Message } from '@/types/game';
import { useGameRules } from '@/hooks/useGameRules';
import { useChatMessages } from '@/hooks/useChatMessages';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ReloadIcon } from '@radix-ui/react-icons';
import { useAuth } from '@/context/AuthContext';
import { useToast } from "@/components/ui/use-toast";

const GameChat = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const { getGameById } = useGameContext();
  const { user } = useAuth();
  const { toast } = useToast();
  const game = gameId ? getGameById(gameId) : undefined;
  const [input, setInput] = useState('');
  const [isClearing, setIsClearing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { rulesQuery, askMutation, getFallbackResponse } = useGameRules(gameId || '');
  const { messages, loading: messagesLoading, error: messagesError, saveMessage, clearMessages } = useChatMessages(gameId || '');

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!game) {
    return <Navigate to="/" />;
  }

  if (!user) {
    return <Navigate to="/auth" />;
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleMutationSuccess = useCallback(async (response: string) => {
    await saveMessage(response, false);
  }, [saveMessage]);

  const handleMutationError = useCallback(async (error: Error) => {
    console.error('Error in chat interaction:', error);
    const errorMessage = error.message.includes('Rules not loaded') 
      ? "The rules are still loading, please wait a moment."
      : "Sorry, I couldn't process your question. Please try again.";
    await saveMessage(errorMessage, false);
    toast({
      variant: "destructive",
      title: "Chat Error",
      description: errorMessage,
    });
  }, [saveMessage, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentInput = input.trim();
    if (!currentInput) return;

    await saveMessage(currentInput, true);
    setInput('');

    // Create chat history from existing messages
    // Only include the last few messages to keep context reasonable
    const chatHistory = messages.slice(-6).map(msg => ({
      content: msg.content,
      isUser: msg.isUser
    }));

    askMutation.mutate(
      { 
        question: currentInput,
        chatHistory: chatHistory.length > 0 ? chatHistory : undefined 
      },
      {
        onSuccess: handleMutationSuccess,
        onError: handleMutationError,
      }
    );
  };

  const handleClear = async () => {
    try {
      setIsClearing(true);
      await clearMessages();
      askMutation.reset();
    } catch (error) {
      console.error('Error clearing messages:', error);
    } finally {
      setIsClearing(false);
    }
  };

  const isRulesLoading = rulesQuery.isLoading;
  const isRulesError = rulesQuery.isError;
  const isAsking = askMutation.isPending;
  const rulesErrorMessage = rulesQuery.error?.message;
  const askErrorMessage = askMutation.error?.message;

  return (
    <div className="flex h-screen flex-col">
      <header className="border-b border-border bg-background p-4 flex justify-between items-center">
        <h1 className="text-xl font-semibold text-white">{game.title} Rules</h1>
        <Button 
          variant="destructive" 
          size="sm"
          onClick={handleClear}
          disabled={isClearing || messagesLoading || isAsking}
          className="flex items-center gap-2"
        >
          {isClearing ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Trash2 size={16} />
          )}
          Clear Chat
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="flex min-h-full flex-col justify-end">
          <div className="mx-auto max-w-3xl space-y-6 px-4 w-full py-4">
            {messagesError && (
              <Alert variant="destructive">
                <AlertDescription>
                  Error loading previous messages. Please try refreshing.
                </AlertDescription>
              </Alert>
            )}
            
            {isRulesError && (
              <Alert variant="destructive">
                <AlertDescription>
                  Error loading game rules: {rulesErrorMessage || 'Unknown error'}
                </AlertDescription>
              </Alert>
            )}
            
            {messagesLoading || isRulesLoading ? (
              <div className="flex justify-center py-4">
                <ReloadIcon className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading {messagesLoading ? 'messages' : 'rules'}...</span>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={cn(
                        "w-full rounded-xl p-4",
                        message.isUser
                          ? "bg-[hsl(var(--chat-message))] text-white"
                          : "text-foreground"
                      )}
                    >
                      {message.isUser ? (
                        <p className="text-sm md:text-base">{message.content}</p>
                      ) : (
                        <div className="text-sm md:text-base prose prose-invert max-w-none">
                          <ReactMarkdown>
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}
            
            {isAsking && (
              <div className="flex justify-start">
                <div className="w-full rounded-xl bg-muted p-4">
                  <div className="flex space-x-2">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-foreground"></div>
                    <div className="h-2 w-2 animate-pulse rounded-full bg-foreground animation-delay-200"></div>
                    <div className="h-2 w-2 animate-pulse rounded-full bg-foreground animation-delay-400"></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      <footer className="bg-background p-4">
        <form onSubmit={handleSubmit} className="mx-auto max-w-3xl">
          <div className="relative">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                isRulesLoading ? "Loading rules..." 
                : isAsking ? "Processing your question..." 
                : "Ask about rules, setup, or gameplay..."
              }
              className="flex-1 bg-muted text-foreground pr-12 h-[130px] resize-none rounded-md"
              disabled={isAsking || isRulesLoading || isRulesError || !rulesQuery.data}
            />
            <Button 
              type="submit" 
              disabled={isAsking || isRulesLoading || isRulesError || !input.trim() || !rulesQuery.data}
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
    </div>
  );
};

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export default GameChat;
