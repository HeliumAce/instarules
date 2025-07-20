import { supabase } from '@/integrations/supabase/client';
import { FeedbackSubmissionData, FeedbackSubmissionResponse } from '@/types/game';

/**
 * Service for handling feedback operations with Supabase
 * Implements UPSERT pattern to handle feedback changes gracefully
 */
export class FeedbackService {
  /**
   * Submit feedback to the database using UPSERT pattern
   * This allows users to change their feedback (thumbs up → thumbs down) without creating duplicates
   */
  static async submitFeedback(data: FeedbackSubmissionData): Promise<FeedbackSubmissionResponse> {
    try {
      // Validate required fields
      if (!data.gameId || !data.messageId || !data.sessionId) {
        throw new Error('Missing required fields: gameId, messageId, or sessionId');
      }

      // Prepare the data for Supabase (convert to snake_case for database)
      const feedbackData = {
        game_id: data.gameId,
        feedback_type: data.feedbackType,
        user_question: data.userQuestion,
        message_id: data.messageId,
        feedback_reason: data.feedbackReason || null,
        response_confidence: data.responseConfidence || null,
        response_length: data.responseLength || null,
        user_id: data.userId || null,
        session_id: data.sessionId,
        updated_at: new Date().toISOString()
      };

      // Use UPSERT pattern: INSERT if not exists, UPDATE if exists
      const { data: result, error } = await supabase
        .from('user_feedback')
        .upsert(
          [feedbackData],
          {
            onConflict: 'user_id,message_id', // Use the unique constraint
            ignoreDuplicates: false // We want to update existing records
          }
        )
        .select()
        .single();

      if (error) {
        console.error('FeedbackService submitFeedback error:', error);
        
        // Handle specific error cases
        if (error.code === '23505') { // Unique constraint violation
          throw new Error('Feedback already exists for this message');
        } else if (error.code === '23503') { // Foreign key violation
          throw new Error('Invalid message ID or user ID');
        } else if (error.code === '42501') { // Insufficient privileges
          throw new Error('You do not have permission to submit feedback');
        }
        
        throw new Error(`Database error: ${error.message}`);
      }

      // Convert the result back to our application format
      const userFeedback = result ? {
        id: result.id,
        gameId: result.game_id,
        feedbackType: result.feedback_type,
        userQuestion: result.user_question,
        messageId: result.message_id,
        feedbackReason: result.feedback_reason,
        responseConfidence: result.response_confidence,
        responseLength: result.response_length,
        userId: result.user_id,
        sessionId: result.session_id,
        createdAt: new Date(result.created_at),
        updatedAt: new Date(result.updated_at)
      } : null;

      return {
        success: true,
        data: userFeedback
      };

    } catch (error) {
      console.error('FeedbackService submitFeedback failed:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get existing feedback for a message
   */
  static async getFeedbackForMessage(messageId: string, userId?: string): Promise<FeedbackSubmissionResponse> {
    try {
      const { data, error } = await supabase
        .from('user_feedback')
        .select('*')
        .eq('message_id', messageId)
        .eq('user_id', userId || null)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw new Error(`Database error: ${error.message}`);
      }

      return {
        success: true,
        data: data || null,
        message: data ? 'Feedback found' : 'No feedback found'
      };

    } catch (error) {
      console.error('FeedbackService getFeedbackForMessage failed:', error);
      throw error;
    }
  }

  /**
   * Get all feedback for a specific game and user
   */
  static async getFeedbackForGame(gameId: string, userId?: string): Promise<FeedbackSubmissionResponse> {
    try {
      const { data, error } = await supabase
        .from('user_feedback')
        .select('*')
        .eq('game_id', gameId)
        .eq('user_id', userId || null)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      return {
        success: true,
        data: data || [],
        message: data ? `${data.length} feedback records found` : 'No feedback found'
      };

    } catch (error) {
      console.error('FeedbackService getFeedbackForGame failed:', error);
      throw error;
    }
  }

  /**
   * Delete feedback for a specific message (for clearing feedback)
   */
  static async deleteFeedback(messageId: string, userId?: string): Promise<FeedbackSubmissionResponse> {
    try {
      const { error } = await supabase
        .from('user_feedback')
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      return {
        success: true
      };

    } catch (error) {
      console.error('FeedbackService deleteFeedback failed:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
} 