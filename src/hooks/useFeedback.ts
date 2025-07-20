import { useState, useRef, useCallback, useEffect } from 'react';
import { FeedbackService } from '@/services/FeedbackService';
import { useToast } from '@/hooks/use-toast';
import { FeedbackType, FeedbackReason, FeedbackSubmissionData } from '@/types/game';
import { useAuth } from '@/context/AuthContext';

interface FeedbackState {
  type: FeedbackType;
  submitted: boolean;
  timestamp: number;
  reason?: FeedbackReason;
}

interface UseFeedbackReturn {
  feedbackState: Record<string, FeedbackState>;
  submitFeedback: (messageId: string, type: FeedbackType, reason?: FeedbackReason, contextData?: {
    userQuestion: string;
    responseConfidence?: string;
    responseLength: number;
    sessionId: string;
  }) => Promise<void>;
  clearFeedback: (messageId: string) => void;
  isLoading: boolean;
  error: string | null;
  isLoadingInitial: boolean;
}

/**
 * Custom hook for managing feedback state with smart loading states and database persistence
 * - Only shows loading spinner if operation takes > 200ms
 * - Provides optimistic updates for immediate UI feedback
 * - Uses existing toast system for error handling
 * - Loads existing feedback from database on initialization
 */
export const useFeedback = (gameId: string): UseFeedbackReturn => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [feedbackState, setFeedbackState] = useState<Record<string, FeedbackState>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Ref to track loading timeout
  const loadingTimeout = useRef<NodeJS.Timeout>();

  /**
   * Load existing feedback from database on hook initialization
   */
  useEffect(() => {
    const loadExistingFeedback = async () => {
      try {
        setIsLoadingInitial(true);
        
        // Query database for existing feedback for this game and user
        const { data: existingFeedback } = await FeedbackService.getFeedbackForGame(gameId, user?.id);
        
        if (existingFeedback && Array.isArray(existingFeedback)) {
          // Convert database records to feedback state
          const initialState: Record<string, FeedbackState> = {};
          
          existingFeedback.forEach(feedback => {
            initialState[feedback.message_id] = {
              type: feedback.feedback_type,
              submitted: true, // Already submitted to database
              timestamp: new Date(feedback.created_at).getTime(),
              reason: feedback.feedback_reason || undefined
            };
          });
          
          setFeedbackState(initialState);
        }
        
      } catch (error) {
        console.error('Failed to load existing feedback:', error);
        // Don't show error toast for initial load - just log it
      } finally {
        setIsLoadingInitial(false);
      }
    };

    if (gameId) {
      loadExistingFeedback();
    }
  }, [gameId, user?.id]);

  /**
   * Submit feedback with smart loading states
   * - Shows loading only if operation takes > 200ms
   * - Provides optimistic updates
   * - Handles errors with existing toast system
   */
  const submitFeedback = useCallback(async (
    messageId: string, 
    type: FeedbackType, 
    reason?: FeedbackReason,
    contextData?: {
      userQuestion: string;
      responseConfidence?: string;
      responseLength: number;
      sessionId: string;
    }
  ): Promise<void> => {
    // Optimistic update - immediate UI feedback
    setFeedbackState(prev => ({
      ...prev,
      [messageId]: {
        type,
        submitted: false, // Will be set to true on success
        timestamp: Date.now(),
        reason
      }
    }));

    // Start loading timer (only show if slow)
    loadingTimeout.current = setTimeout(() => {
      setIsLoading(true);
    }, 200);

    try {
      // Prepare feedback data
      const feedbackData: FeedbackSubmissionData = {
        gameId,
        feedbackType: type,
        userQuestion: contextData?.userQuestion || '',
        messageId,
        feedbackReason: reason,
        responseConfidence: contextData?.responseConfidence,
        responseLength: contextData?.responseLength || 0,
        userId: user?.id,
        sessionId: contextData?.sessionId || '',
      };

      // Submit to database
      await FeedbackService.submitFeedback(feedbackData);

      // Success - update state and clear loading
      clearTimeout(loadingTimeout.current);
      setIsLoading(false);
      setError(null);

      // Mark as successfully submitted
      setFeedbackState(prev => ({
        ...prev,
        [messageId]: {
          ...prev[messageId]!,
          submitted: true
        }
      }));

      // Show success toast (only for thumbs up - thumbs down has its own toast)
      if (type === 'thumbs_up') {
        toast({
          title: "Thank you for your feedback!",
          description: "Your feedback helps us improve our responses."
        });
      }

    } catch (err) {
      // Error handling
      clearTimeout(loadingTimeout.current);
      setIsLoading(false);
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit feedback';
      setError(errorMessage);

      // Remove optimistic update on error
      setFeedbackState(prev => {
        const newState = { ...prev };
        delete newState[messageId];
        return newState;
      });

      // Show error toast using existing system
      toast({
        variant: "destructive",
        title: "Error submitting feedback",
        description: "Please try again. If the problem persists, contact support."
      });
    }
  }, [gameId, user?.id, toast]);

  /**
   * Clear feedback for a specific message
   */
  const clearFeedback = useCallback((messageId: string): void => {
    setFeedbackState(prev => {
      const newState = { ...prev };
      delete newState[messageId];
      return newState;
    });
  }, []);

  return {
    feedbackState,
    submitFeedback,
    clearFeedback,
    isLoading,
    error,
    isLoadingInitial
  };
}; 