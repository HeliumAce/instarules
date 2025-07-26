import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { SendHorizontal, Loader2, Trash2, ThumbsUp, ThumbsDown, Pencil, ChevronDown, ChevronUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useGameContext } from '@/context/GameContext';
import { Message, Source, MessageSources, RuleSource, CardSource, FeedbackSubmissionData } from '@/types/game';
import { useGameRules } from '@/hooks/useGameRules';
import { useChatMessages } from '@/hooks/useChatMessages';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ReloadIcon } from '@radix-ui/react-icons';
import { useAuth } from '@/context/AuthContext';
import { useToast } from "@/components/ui/use-toast";
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { FeedbackToastContent, type FeedbackReason } from '@/components/ui/FeedbackToast';
import { FeedbackService } from '@/services/FeedbackService';
import { useFeedback } from '@/hooks/useFeedback';
import { generateSessionId, findUserQuestionForMessage } from './GameChat/utils';

// Define empty sources data locally
const emptySourcesData: MessageSources = {
  count: 0,
  sources: []
};

// Internal Sources components
interface SourcesListProps {
  sources: Source[];
  onSourceClick?: (source: Source) => void;
  closeTooltip?: () => void;
}

const SourcesList = ({ sources, onSourceClick, closeTooltip }: SourcesListProps) => {
  // Step 1: Deduplicate card sources before grouping
  const deduplicatedSources = sources.reduce((acc, source) => {
    if (source.contentType === 'rule') {
      const ruleSource = source as RuleSource;
      const cardMatch = ruleSource.title.match(/^(.+?)\s*\(ID:\s*([^)]+)\)$/);
      
      if (cardMatch) {
        // This is a card source - check for duplicates
        const cardName = cardMatch[1];
        
        const existingIndex = acc.findIndex(s => {
          if (s.contentType === 'rule') {
            const existingMatch = (s as RuleSource).title.match(/^(.+?)\s*\(ID:\s*([^)]+)\)$/);
            return existingMatch && existingMatch[1] === cardName;
          }
          return false;
        });
        
        if (existingIndex !== -1) {
          // Duplicate found - prefer base game over expansion
          const existing = acc[existingIndex] as RuleSource;
          const isCurrentBaseGame = ruleSource.bookName.includes('Base Game');
          const isExistingBaseGame = existing.bookName.includes('Base Game');
          
          if (isCurrentBaseGame && !isExistingBaseGame) {
            acc[existingIndex] = source; // Replace expansion with base game
          }
          // Otherwise keep existing (base game preferred, or first expansion if no base game)
        } else {
          acc.push(source); // No duplicate, add it
        }
      } else {
        acc.push(source); // Not a card, add it
      }
    } else {
      acc.push(source); // Not a rule, add it
    }
    return acc;
  }, [] as Source[]);

  // Step 2: Categorize and group sources by content type, then by base game priority
  const categorizedSources = deduplicatedSources.reduce((acc, source) => {
    let category = 'Other';
    let bookName = 'Other';
    
    if (source.contentType === 'rule') {
      const ruleSource = source as RuleSource;
      bookName = ruleSource.bookName;
      
      // Categorize based on bookName patterns
      if (bookName.toLowerCase().includes('cards')) {
        category = 'Cards';
      } else if (bookName.toLowerCase().includes('faq')) {
        category = 'FAQ';  
      } else if (bookName.toLowerCase().includes('rules')) {
        category = 'Rules';
      } else {
        category = 'Other';
      }
    } else if (source.contentType === 'card') {
      category = 'Cards';
      bookName = (source as CardSource).cardName;
    } else {
      category = 'Other';
    }
    
    if (!acc[category]) {
      acc[category] = {};
    }
    if (!acc[category][bookName]) {
      acc[category][bookName] = [];
    }
    acc[category][bookName].push(source);
    return acc;
  }, {} as Record<string, Record<string, Source[]>>);

  // Step 3: Sort categories and books within categories (Base Game first)
  const categoryOrder = ['Rules', 'Cards', 'FAQ', 'Other'];
  const sortedCategories = categoryOrder.filter(cat => categorizedSources[cat]);
  
  const sourcesByBook: Record<string, Source[]> = {};
  
  sortedCategories.forEach(category => {
    const books = Object.keys(categorizedSources[category]);
    
    // Sort books within category: Base Game first, then alphabetically
    const sortedBooks = books.sort((a, b) => {
      const aIsBaseGame = a.toLowerCase().includes('base game');
      const bIsBaseGame = b.toLowerCase().includes('base game');
      
      if (aIsBaseGame && !bIsBaseGame) return -1;
      if (!aIsBaseGame && bIsBaseGame) return 1;
      return a.localeCompare(b);
    });
    
    sortedBooks.forEach(bookName => {
      sourcesByBook[bookName] = categorizedSources[category][bookName];
    });
  });

  const handleClick = (source: Source) => {
    // Call the onSourceClick handler
    onSourceClick?.(source);
    // Close the tooltip
    closeTooltip?.();
  };

  return (
    <div className="mt-2 space-y-3 text-sm">
      {Object.entries(sourcesByBook).map(([bookName, bookSources]) => (
        <div key={bookName}>
          <h4 className="font-medium text-xs uppercase tracking-wider text-muted-foreground mb-1">
            {bookName}
          </h4>
          <ul className="space-y-1">
            {bookSources.map((source) => (
              <li key={source.id}>
                <button
                  onClick={() => handleClick(source)}
                  className="text-left w-full hover:text-foreground text-muted-foreground transition-colors line-clamp-2"
                  title={(() => {
                    if (source.contentType === 'rule') {
                      const ruleSource = source as RuleSource;
                      // Check if this is a card source (title contains "(ID: ")
                      const cardMatch = ruleSource.title.match(/^(.+?)\s*\(ID:\s*([^)]+)\)$/);
                      if (cardMatch) {
                        return `${cardMatch[1]} (${cardMatch[2]})`;
                      }
                      // Regular rule source
                      return `${ruleSource.sourceHeading}${ruleSource.pageNumber ? ` (p.${ruleSource.pageNumber})` : ''}`;
                    } else {
                      return `${(source as CardSource).cardName} (${(source as CardSource).cardId})`;
                    }
                  })()}
                >
                  <div className="font-semibold">
                    {(() => {
                      if (source.contentType === 'rule') {
                        const ruleSource = source as RuleSource;
                        // Check if this is a card source (title contains "(ID: ")
                        const cardMatch = ruleSource.title.match(/^(.+?)\s*\(ID:\s*([^)]+)\)$/);
                        if (cardMatch) {
                          return cardMatch[1]; // Return card name without ID
                        }
                        // Regular rule source - convert to Title Case
                        const cleanHeading = ruleSource.sourceHeading.replace(/\s*\(Page\s*\d+\)\s*$/i, '');
                        return cleanHeading.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
                      } else {
                        return (source as CardSource).cardName;
                      }
                    })()}
                  </div>
                  <div className="text-xs opacity-75">
                    {(() => {
                      if (source.contentType === 'rule') {
                        const ruleSource = source as RuleSource;
                        // Check if this is a card source (title contains "(ID: ")
                        const cardMatch = ruleSource.title.match(/^(.+?)\s*\(ID:\s*([^)]+)\)$/);
                        if (cardMatch) {
                          return cardMatch[2]; // Return card ID without "ID: " prefix
                        }
                        // Regular rule source with page number
                        return ruleSource.pageNumber ? `Page ${ruleSource.pageNumber}` : '';
                      } else if (source.contentType === 'card') {
                        return (source as CardSource).cardId;
                      }
                      return '';
                    })()}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

interface SourcesToggleProps {
  sources: MessageSources;
  onSourceClick?: (source: Source) => void;
}

const SourcesToggle = ({ sources, onSourceClick }: SourcesToggleProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Function to close the tooltip
  const closeTooltip = () => {
    setIsExpanded(false);
  };

  // Set up the click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close the tooltip if click is outside the tooltip and outside the toggle button
      if (
        isExpanded && 
        tooltipRef.current && 
        buttonRef.current && 
        !tooltipRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        closeTooltip();
      }
    };

    // Add event listener when tooltip is expanded
    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    // Clean up event listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
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
          ref={tooltipRef}
          id="sources-list"
          className={cn(
            "absolute left-0 bottom-full mb-2",
            "w-80 bg-muted rounded-lg p-3 shadow-lg"
          )}
        >
          {sources.count === 0 ? (
            <p className="text-sm text-muted-foreground">No sources could be found. Please try another question.</p>
          ) : (
            <SourcesList 
              sources={sources.sources} 
              onSourceClick={onSourceClick}
              closeTooltip={closeTooltip}
            />
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
  // Use the useFeedback hook for centralized state management
  const { feedbackState, submitFeedback, isLoading: feedbackLoading } = useFeedback(gameId || '');
  // Generate session ID once when component mounts
  const [sessionId] = useState(() => generateSessionId());

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!game) {
    return <Navigate to="/" />;
  }

  if (!user) {
    return <Navigate to="/auth" />;
  }

  const handleSourceClick = async (source: Source) => {
    console.log('Source clicked:', source);
    
    // Create formatted source reference as user message
    let userMessage = '';
    
    if (source.contentType === 'rule') {
      const ruleSource = source as RuleSource;
      // Check if this is a card source (title contains "(ID: ")
      const cardMatch = ruleSource.title.match(/^(.+?)\s*\(ID:\s*([^)]+)\)$/);
      if (cardMatch) {
        // Format: "Card Name, ID: XXX"
        userMessage = `${cardMatch[1]}, ID: ${cardMatch[2]}`;
      } else {
        // Format: "Heading, Rulebook p.XX"
        userMessage = `${ruleSource.sourceHeading}, Rulebook p.${ruleSource.pageNumber || '?'}`;
      }
    } else if (source.contentType === 'card') {
      // Format: "Card Name, ID: XXX"
      const cardSource = source as CardSource;
      userMessage = `${cardSource.cardName}, ID: ${cardSource.cardId}`;
    } else {
      // Fallback
      userMessage = `${source.title}`;
    }
    
    // Save as user message
    await saveMessage(userMessage, true);
    
    // Set typing indicator
    setIsTyping(true);
    
    // Create chat history from existing messages
    const chatHistory = messages.slice(-6).map(msg => ({
      content: msg.content,
      isUser: msg.isUser
    }));
    
    // Trigger AI to respond to this source query
    askMutation.mutate(
      { 
        question: userMessage,
        chatHistory: chatHistory.length > 0 ? chatHistory : undefined,
        skipFollowUpHandling: true // Explicitly skip follow-up handling for source selections to treat them as fresh queries
      },
      {
        onSuccess: handleMutationSuccess,
        onError: handleMutationError,
      }
    );
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

  const handleFeedback = async (messageId: string, type: 'thumbsUp' | 'thumbsDown') => {
    const currentFeedback = feedbackState[messageId];
    const isDeselecting = currentFeedback?.type === type;
    
    // Only show toast when selecting feedback, not when deselecting
    if (!isDeselecting) {
      if (type === 'thumbsUp') {
        // Extract context data for thumbs up feedback
        const aiMessage = messages.find(msg => msg.id === messageId);
        const userMessage = findUserQuestionForMessage(messages, messageId);
        
        if (aiMessage && gameId) {
          // Use the useFeedback hook for thumbs up with context data
          await submitFeedback(messageId, 'thumbs_up', undefined, {
            userQuestion: userMessage?.content || '',
            responseConfidence: aiMessage.confidence || undefined,
            responseLength: aiMessage.content.length,
            sessionId
          });
        }
      } else if (type === 'thumbsDown') {
        toast({
          title: "Help us improve",
          description: <FeedbackToastContent 
            onSubmit={(reason) => handleFeedbackSubmission(messageId, reason)}
            onClose={() => {/* Cleanup handled by component */}}
            isSubmitting={false}
          />,
          duration: Infinity // Disable auto-dismiss for thumbs down toast
        });
      }
    }
  };

  const handleFeedbackSubmission = async (messageId: string, reason: FeedbackReason) => {
    try {
      // Extract context data for thumbs down feedback
      const aiMessage = messages.find(msg => msg.id === messageId);
      const userMessage = findUserQuestionForMessage(messages, messageId);
      
      if (aiMessage && gameId) {
        // Use the useFeedback hook for thumbs down with context data
        await submitFeedback(messageId, 'thumbs_down', reason, {
          userQuestion: userMessage?.content || '',
          responseConfidence: aiMessage.confidence || undefined,
          responseLength: aiMessage.content.length,
          sessionId
        });
      }
      
      // Show confirmation toast
      toast({
        title: "Thank you for your feedback!",
        description: "Your feedback helps us improve our responses."
      });
    } catch (error) {
      // Handle error cases
      console.error('Error submitting feedback:', error);
      toast({
        title: "Error submitting feedback",
        description: "Please try again. If the problem persists, contact support.",
        variant: "destructive"
      });
    }
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
                                  aria-pressed={feedbackState[message.id]?.type === 'thumbs_up'}
                                  aria-label="Mark this response as helpful"
                                >
                                  <ThumbsUp 
                                    size={16} 
                                    className={cn(
                                      "transition-colors",
                                      feedbackState[message.id]?.type === 'thumbs_up'
                                        ? "text-muted-foreground hover:text-foreground"
                                        : "text-muted-foreground hover:text-foreground"
                                    )}
                                    fill={feedbackState[message.id]?.type === 'thumbs_up' ? "currentColor" : "none"}
                                  />
                                </button>
                                <button 
                                  className="p-1.5 transition-colors active:scale-95"
                                  title="Not helpful"
                                  onClick={() => handleFeedback(message.id, 'thumbsDown')}
                                  aria-pressed={feedbackState[message.id]?.type === 'thumbs_down'}
                                  aria-label="Mark this response as not helpful"
                                >
                                  <ThumbsDown 
                                    size={16} 
                                    className={cn(
                                      "transition-colors",
                                      feedbackState[message.id]?.type === 'thumbs_down'
                                        ? "text-muted-foreground hover:text-foreground"
                                        : "text-muted-foreground hover:text-foreground"
                                    )}
                                    fill={feedbackState[message.id]?.type === 'thumbs_down' ? "currentColor" : "none"}
                                  />
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
              onKeyDown={(e) => {
                // Submit form on Enter key press without Shift key
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (input.trim() && !isAsking && !isRulesLoading && !isRulesError && rulesQuery.data) {
                    handleSubmit(e);
                  }
                }
              }}
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
