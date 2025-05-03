import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { SendHorizontal, Loader2, Trash2, ThumbsUp, ThumbsDown, Pencil, ChevronDown, ChevronUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useGameContext } from '@/context/GameContext';
import { Message, Source, MessageSources, RuleSource, CardSource } from '@/types/game';
import { useGameRules } from '@/hooks/useGameRules';
import { useChatMessages } from '@/hooks/useChatMessages';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ReloadIcon } from '@radix-ui/react-icons';
import { useAuth } from '@/context/AuthContext';
import { useToast } from "@/components/ui/use-toast";
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

// Define empty sources data locally
const emptySourcesData: MessageSources = {
  count: 0,
  sources: []
};

// Internal Sources components
interface SourcesListProps {
  sources: Source[];
  onSourceClick?: (source: Source) => void;
}

const SourcesList = ({ sources, onSourceClick }: SourcesListProps) => {
  // Group sources by type
  const rulesSources = sources.filter((s): s is RuleSource => s.contentType === 'rule');
  const cardSources = sources.filter((s): s is CardSource => s.contentType === 'card');

  return (
    <div className="mt-2 space-y-2 text-sm">
      {rulesSources.length > 0 && (
        <div>
          <h4 className="font-medium text-muted-foreground mb-1">Rules</h4>
          <ul className="space-y-1">
            {rulesSources.map((source) => (
              <li key={source.id}>
                <button
                  onClick={() => onSourceClick?.(source)}
                  className="text-left w-full hover:text-foreground text-muted-foreground transition-colors"
                >
                  {source.bookName} - {source.sourceHeading}
                  {source.pageNumber && <span className="ml-1 text-xs">p.{source.pageNumber}</span>}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {cardSources.length > 0 && (
        <div>
          <h4 className="font-medium text-muted-foreground mb-1">Cards</h4>
          <ul className="space-y-1">
            {cardSources.map((source) => (
              <li key={source.id}>
                <button
                  onClick={() => onSourceClick?.(source)}
                  className="text-left w-full hover:text-foreground text-muted-foreground transition-colors"
                >
                  {source.cardName}
                  <span className="ml-1 text-xs opacity-60">{source.cardId}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

interface SourcesToggleProps {
  sources: MessageSources;
  onSourceClick?: (source: Source) => void;
}

const SourcesToggle = ({ sources, onSourceClick }: SourcesToggleProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-sm"
        aria-expanded={isExpanded}
        aria-controls="sources-list"
        title={sources.count === 0 ? "No sources could be found. Please try another question." : undefined}
      >
        <span>Sources</span>
        <Badge 
          variant="outline" 
          className="font-medium bg-muted-foreground text-background hover:bg-muted-foreground border-0 py-0 px-2"
        >
          {sources.count}
        </Badge>
      </button>

      {isExpanded && (
        <div
          id="sources-list"
          className={cn(
            "absolute left-0 bottom-full mb-2",
            "w-64 bg-muted rounded-lg p-3 shadow-lg"
          )}
        >
          {sources.count === 0 ? (
            <p className="text-sm text-muted-foreground">No sources could be found. Please try another question.</p>
          ) : (
            <SourcesList sources={sources.sources} onSourceClick={onSourceClick} />
          )}
        </div>
      )}
    </div>
  );
};

const GameChat = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const { getGameById } = useGameContext();
  const { user } = useAuth();
  const { toast } = useToast();
  const game = gameId ? getGameById(gameId) : undefined;
  const [input, setInput] = useState('');
  const [isClearing, setIsClearing] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { rulesQuery, askMutation, getFallbackResponse } = useGameRules(gameId || '');
  const { messages, loading: messagesLoading, error: messagesError, saveMessage, clearMessages } = useChatMessages(gameId || '');
  const [messageFeedback, setMessageFeedback] = useState<Record<string, 'thumbsUp' | 'thumbsDown' | null>>({});

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!game) {
    return <Navigate to="/" />;
  }

  if (!user) {
    return <Navigate to="/auth" />;
  }

  const handleSourceClick = (source: Source) => {
    console.log('Source clicked:', source);
    // TODO: Implement source click functionality (e.g., show source details)
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleMutationSuccess = async (response: string) => {
    setIsTyping(false);
    
    let sources: MessageSources | undefined = undefined;
    
    // Check if response has sources attached
    if (typeof response === 'object' && (response as any).sources) {
      sources = (response as any).sources as MessageSources;
      // Use string representation of the response object
      response = String(response);
    }
    
    // Save the message with sources
    await saveMessage(response, false, sources);
  };

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
    setIsTyping(true);

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

  const handleFeedback = (messageId: string, type: 'thumbsUp' | 'thumbsDown') => {
    setMessageFeedback(prev => {
      if (prev[messageId] === type) {
        const newFeedback = { ...prev };
        delete newFeedback[messageId];
        return newFeedback;
      }
      return { ...prev, [messageId]: type };
    });
    console.log(`Message ${messageId} feedback: ${type}`);
  };

  const isRulesLoading = rulesQuery.isLoading;
  const isRulesError = rulesQuery.isError;
  const isAsking = askMutation.isPending;
  const rulesErrorMessage = rulesQuery.error?.message;
  const askErrorMessage = askMutation.error?.message;

  const renderMessageFooter = (message: Message) => {
    // Always show sources for AI messages
    if (!message.isUser) {
      return (
        <div className="flex justify-between items-center text-xs text-slate-500 mt-2">
          {message.confidence && (
            <div className="flex items-center gap-1">
              <CircleIcon className="w-2 h-2" />
              <span>{message.confidence} confidence</span>
            </div>
          )}
          <SourcesToggle 
            sources={message.sources || emptySourcesData} 
            onSourceClick={handleSourceClick}
          />
        </div>
      );
    }
    return null;
  };

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
          <div className="mx-auto max-w-3xl space-y-3 px-4 w-full py-2">
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
                        "w-full rounded-xl relative group/message",
                        message.isUser
                          ? "bg-[hsl(var(--chat-message))] text-white p-4"
                          : "text-foreground p-4 pb-2"
                      )}
                    >
                      {message.isUser ? (
                        <p className="text-sm md:text-base">{message.content}</p>
                      ) : (
                        <>
                          <div className="text-sm md:text-base prose prose-invert max-w-none">
                            <ReactMarkdown>
                              {message.content}
                            </ReactMarkdown>
                          </div>
                          
                          {/* Feedback icons and confidence score for non-user messages */}
                          <div className="flex items-center justify-between pt-1 mt-1 border-t border-muted/20 transition-opacity">
                            {/* Sources - show for all AI messages */}
                            {!message.isUser && (
                              <SourcesToggle 
                                sources={message.sources || emptySourcesData} 
                                onSourceClick={handleSourceClick} 
                              />
                            )}

                            <div className="flex items-center gap-2">
                              <div className="flex -space-x-px">
                                <button 
                                  className="p-1.5 transition-colors active:scale-95"
                                  title="Helpful"
                                  onClick={() => handleFeedback(message.id, 'thumbsUp')}
                                  aria-pressed={messageFeedback[message.id] === 'thumbsUp'}
                                >
                                  <ThumbsUp size={16} className="text-muted-foreground transition-colors hover:text-foreground" />
                                </button>
                                <button 
                                  className="p-1.5 transition-colors active:scale-95"
                                  title="Not helpful"
                                  onClick={() => handleFeedback(message.id, 'thumbsDown')}
                                  aria-pressed={messageFeedback[message.id] === 'thumbsDown'}
                                >
                                  <ThumbsDown size={16} className="text-muted-foreground transition-colors hover:text-foreground" />
                                </button>
                                <div className="w-px h-full bg-muted/20"></div>
                                <button 
                                  className="p-1.5 transition-colors active:scale-95"
                                  title="Edit this question"
                                  onClick={() => console.log('Edit clicked')}
                                >
                                  <Pencil size={16} className="text-muted-foreground transition-colors hover:text-foreground" />
                                </button>
                              </div>
                              
                              {/* Confidence score indicator */}
                              {message.confidence && (
                                <span className="text-sm text-muted-foreground">
                                  {message.confidence} confidence
                                </span>
                              )}
                            </div>
                          </div>
                        </>
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

      <footer className="bg-background pt-1 pb-3 px-4">
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
