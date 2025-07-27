import { useState, useRef, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { MessageSources, Source } from '@/types/game';
import { cn } from '@/lib/utils';
import { SourcesList } from './SourcesList';

interface SourcesToggleProps {
  sources: MessageSources;
  onSourceClick?: (source: Source) => void;
}

export function SourcesToggle({ sources, onSourceClick }: SourcesToggleProps) {
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
} 