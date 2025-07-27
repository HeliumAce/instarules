import ReactMarkdown from 'react-markdown';
import { Message, MessageSources } from '@/types/game';
import { cn } from '@/lib/utils';
import { SourcesToggle } from './SourcesToggle';
import { FeedbackButtons } from './FeedbackButtons';

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

              <FeedbackButtons
                messageId={message.id}
                feedbackState={feedbackState}
                onFeedback={onFeedback}
                confidence={message.confidence}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
} 