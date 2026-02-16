export type RetrievalStrategy = 'vector-search' | 'full-context' | 'hybrid';

export interface GameRetrievalConfig {
  strategy: RetrievalStrategy;
  displayName: string;
}

export type Game = {
  id: string;
  title: string;
  description: string;
  coverImage?: string;
  isFavorite: boolean;
};

export interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  confidence?: 'High' | 'Medium' | 'Low'; // Optional confidence level for AI responses
  sources?: MessageSources; // Add sources to Message interface
}

export interface BaseSource {
  id: string;
  contentType: 'rule' | 'card' | 'faq' | 'errata';
  title: string;
  content: string; // Actual rule content for display in modal
}

export interface RuleSource extends BaseSource {
  contentType: 'rule';
  bookName: string;
  headings: string[];
  sourceHeading: string;
  pageNumber?: number;
}

export interface CardSource extends BaseSource {
  contentType: 'card';
  cardId: string;
  cardName: string;
}

export type Source = RuleSource | CardSource;

export interface MessageSources {
  count: number;
  sources: Source[];
}

// Feedback-related types for thumbs up/down feature
export type FeedbackType = 'thumbs_up' | 'thumbs_down';

export type FeedbackReason = 'not_related' | 'incorrect' | 'poorly_worded' | 'other';

export interface UserFeedback {
  id: string;
  gameId: string;
  feedbackType: FeedbackType;
  userQuestion: string;
  messageId: string;
  feedbackReason?: FeedbackReason; // Optional, only for thumbs_down
  responseConfidence?: string;
  responseLength?: number;
  userId?: string;
  sessionId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Data structure for collecting feedback before submission
export interface FeedbackSubmissionData {
  gameId: string;
  feedbackType: FeedbackType;
  userQuestion: string;
  messageId: string;
  feedbackReason?: FeedbackReason;
  responseConfidence?: string;
  responseLength?: number;
  userId?: string;
  sessionId: string;
}

// Response from feedback submission operations
export interface FeedbackSubmissionResponse {
  success: boolean;
  data?: UserFeedback;
  error?: string;
}
