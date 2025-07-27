import { ThumbsUp, ThumbsDown, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeedbackButtonsProps {
  messageId: string;
  feedbackState: Record<string, { type: string; reason?: string }>;
  onFeedback: (messageId: string, type: 'thumbsUp' | 'thumbsDown') => void;
  confidence?: string;
}

export function FeedbackButtons({ 
  messageId, 
  feedbackState, 
  onFeedback, 
  confidence 
}: FeedbackButtonsProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-px">
        <button 
          className="p-1.5 transition-colors active:scale-95"
          title="Helpful"
          onClick={() => onFeedback(messageId, 'thumbsUp')}
          aria-pressed={feedbackState[messageId]?.type === 'thumbs_up'}
          aria-label="Mark this response as helpful"
        >
          <ThumbsUp 
            size={16} 
            className={cn(
              "transition-colors",
              feedbackState[messageId]?.type === 'thumbs_up'
                ? "text-muted-foreground hover:text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
            fill={feedbackState[messageId]?.type === 'thumbs_up' ? "currentColor" : "none"}
          />
        </button>
        <button 
          className="p-1.5 transition-colors active:scale-95"
          title="Not helpful"
          onClick={() => onFeedback(messageId, 'thumbsDown')}
          aria-pressed={feedbackState[messageId]?.type === 'thumbs_down'}
          aria-label="Mark this response as not helpful"
        >
          <ThumbsDown 
            size={16} 
            className={cn(
              "transition-colors",
              feedbackState[messageId]?.type === 'thumbs_down'
                ? "text-muted-foreground hover:text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
            fill={feedbackState[messageId]?.type === 'thumbs_down' ? "currentColor" : "none"}
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
      {confidence && (
        <span className="text-sm text-muted-foreground">
          {confidence} confidence
        </span>
      )}
    </div>
  );
} 