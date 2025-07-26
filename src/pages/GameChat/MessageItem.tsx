import ReactMarkdown from 'react-markdown';
import { ThumbsUp, ThumbsDown, Pencil } from 'lucide-react';
import { Message, MessageSources } from '@/types/game';
import { cn } from '@/lib/utils';
import { SourcesToggle } from './SourcesToggle';

interface MessageItemProps {
  message: Message;
  feedbackState: Record<string, { type: string; reason?: string }>;
  onFeedback: (messageId: string, type: 'thumbsUp' | 'thumbsDown') => void;
  onSourceClick: (source: any) => void;
  emptySourcesData: MessageSources;
}

export function MessageItem({ 
  message, 
  feedbackState, 
  onFeedback, 
  onSourceClick, 
  emptySourcesData 
}: MessageItemProps) {
  return (
    <div
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
                  onSourceClick={onSourceClick} 
                />
              )}

              <div className="flex items-center gap-2">
                <div className="flex -space-x-px">
                  <button 
                    className="p-1.5 transition-colors active:scale-95"
                    title="Helpful"
                    onClick={() => onFeedback(message.id, 'thumbsUp')}
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
                    onClick={() => onFeedback(message.id, 'thumbsDown')}
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
  );
} 