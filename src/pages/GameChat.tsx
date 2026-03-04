import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Check, Layers, Loader2, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGameContext } from '@/context/GameContext';
import { Message, Source, MessageSources } from '@/types/game';
import { useGameRules } from '@/hooks/useGameRules';
import { useChatMessages } from '@/hooks/useChatMessages';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ReloadIcon } from '@radix-ui/react-icons';
import { useAuth } from '@/context/AuthContext';
import { useToast } from "@/components/ui/use-toast";
import { FeedbackToastContent, type FeedbackReason } from '@/components/ui/FeedbackToast';
import { useFeedback } from '@/hooks/useFeedback';
import { generateSessionId, findUserQuestionForMessage } from './GameChat/utils';
import { MessageItem } from './GameChat/MessageItem';
import { SourceModal } from './GameChat/SourceModal';
import { ExpansionsModal } from './GameChat/ExpansionsModal';
import { ChatInput } from './GameChat/ChatInput';
import { useExpansionToggles } from '@/hooks/useExpansionToggles';
import { getGameConfig } from '@/data/games';

// Define empty sources data locally
const emptySourcesData: MessageSources = {
  count: 0,
  sources: []
};

interface StatusMessage {
  id: string;
  content: string;
  timestamp: Date;
  enabled: boolean;
}

type DisplayItem =
  | { type: 'message'; message: Message }
  | { type: 'status'; status: StatusMessage };



const GameChat = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const { getGameById } = useGameContext();
  const { user } = useAuth();
  const { toast } = useToast();
  const game = gameId ? getGameById(gameId) : undefined;
  const [input, setInput] = useState('');
  const [isClearing, setIsClearing] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
  const [isExpansionsModalOpen, setIsExpansionsModalOpen] = useState(false);
  const [statusMessages, setStatusMessages] = useState<StatusMessage[]>([]);
  const contextCutoffRef = useRef<Date | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const gameConfig = getGameConfig(gameId || '');
  const expansions = gameConfig.expansions ?? [];
  const hasExpansions = expansions.length > 0;
  const { enabledExpansions, toggleExpansion, isExpansionEnabled } =
    useExpansionToggles(gameId || '', expansions);
  const { rulesQuery, askMutation, getFallbackResponse } = useGameRules(
    gameId || '',
    hasExpansions ? enabledExpansions : undefined
  );
  const { messages, loading: messagesLoading, error: messagesError, saveMessage, clearMessages } = useChatMessages(gameId || '');
  // Use the useFeedback hook for centralized state management
  const { feedbackState, submitFeedback, isLoading: feedbackLoading } = useFeedback(gameId || '');
  // Generate session ID once when component mounts
  const [sessionId] = useState(() => generateSessionId());

  useEffect(() => {
    scrollToBottom();
  }, [messages, statusMessages]);

  if (!game) {
    return <Navigate to="/" />;
  }

  if (!user) {
    return <Navigate to="/auth" />;
  }

  const handleSourceClick = (source: Source) => {
    console.log('Source clicked:', source);
    setSelectedSource(source);
    setIsSourceModalOpen(true);
  };

  const handleExpansionToggle = (expansionId: string) => {
    const expansion = expansions.find(e => e.id === expansionId);
    const willBeEnabled = !isExpansionEnabled(expansionId);
    toggleExpansion(expansionId);
    contextCutoffRef.current = new Date();
    setStatusMessages(prev => [...prev, {
      id: crypto.randomUUID(),
      content: `${expansion?.displayName} expansion has been ${willBeEnabled ? 'enabled' : 'disabled'}`,
      timestamp: new Date(),
      enabled: willBeEnabled,
    }]);
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
    // Only include messages after the last expansion toggle to avoid stale context
    const cutoff = contextCutoffRef.current;
    const relevantMessages = cutoff
      ? messages.filter(m => m.timestamp > cutoff)
      : messages;
    const chatHistory = relevantMessages.slice(-6).map(msg => ({
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
      setStatusMessages([]);
      contextCutoffRef.current = null;
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



  return (
    <div className="flex h-screen flex-col">
      <header className="border-b border-border bg-background p-4 flex justify-between items-center">
        <h1 className="text-xl font-semibold text-white">{game.title} Rules</h1>
        <div className="flex items-center gap-2">
          {hasExpansions && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpansionsModalOpen(true)}
              className="flex items-center gap-2"
            >
              <Layers size={16} />
              Expansions
            </Button>
          )}
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
        </div>
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
                {(() => {
                  const displayItems: DisplayItem[] = [
                    ...messages.map(m => ({ type: 'message' as const, message: m })),
                    ...statusMessages.map(s => ({ type: 'status' as const, status: s })),
                  ].sort((a, b) => {
                    const tA = a.type === 'message' ? a.message.timestamp : a.status.timestamp;
                    const tB = b.type === 'message' ? b.message.timestamp : b.status.timestamp;
                    return tA.getTime() - tB.getTime();
                  });

                  return displayItems.map(item => {
                    if (item.type === 'status') {
                      return (
                        <div key={item.status.id} className="flex items-center gap-2 py-2 px-3">
                          {item.status.enabled ? (
                            <Check size={14} className="text-emerald-400 shrink-0" />
                          ) : (
                            <X size={14} className="text-amber-400 shrink-0" />
                          )}
                          <span className={`text-sm ${item.status.enabled ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {item.status.content}
                          </span>
                        </div>
                      );
                    }
                    return (
                      <MessageItem
                        key={item.message.id}
                        message={item.message}
                        feedbackState={feedbackState}
                        onFeedback={handleFeedback}
                        onSourceClick={handleSourceClick}
                        emptySourcesData={emptySourcesData}
                      />
                    );
                  });
                })()}
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

      <ChatInput
        input={input}
        setInput={setInput}
        onSubmit={handleSubmit}
        isAsking={isAsking}
        isRulesLoading={isRulesLoading}
        isRulesError={isRulesError}
        rulesQueryData={rulesQuery.data}
      />
      
      {/* Source Modal */}
      <SourceModal
        source={selectedSource}
        isOpen={isSourceModalOpen}
        onClose={() => {
          setIsSourceModalOpen(false);
          setSelectedSource(null);
        }}
      />

      {/* Expansions Modal */}
      {hasExpansions && (
        <ExpansionsModal
          expansions={expansions}
          isOpen={isExpansionsModalOpen}
          onClose={() => setIsExpansionsModalOpen(false)}
          isExpansionEnabled={isExpansionEnabled}
          onToggle={handleExpansionToggle}
        />
      )}
    </div>
  );
};

export default GameChat;
