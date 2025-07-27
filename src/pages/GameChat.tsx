import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { SendHorizontal, Loader2, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
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
import { MessageItem } from './GameChat/MessageItem';
import { SourceModal } from './GameChat/SourceModal';
import { ChatInput } from './GameChat/ChatInput';

// Define empty sources data locally
const emptySourcesData: MessageSources = {
  count: 0,
  sources: []
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
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
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

  const handleSourceClick = (source: Source) => {
    console.log('Source clicked:', source);
    setSelectedSource(source);
    setIsSourceModalOpen(true);
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
                  <MessageItem
                    key={message.id}
                    message={message}
                    feedbackState={feedbackState}
                    onFeedback={handleFeedback}
                    onSourceClick={handleSourceClick}
                    emptySourcesData={emptySourcesData}
                  />
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
    </div>
  );
};

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export default GameChat;
