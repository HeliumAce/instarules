import React from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

// Defines the four feedback reasons for thumbs down responses
export type FeedbackReason = 'not_related' | 'incorrect' | 'poorly_worded' | 'other';

// Props for the feedback toast content component
interface FeedbackToastContentProps {
  onSubmit: (reason: FeedbackReason) => void; // Called when user clicks submit with selected reason
  onClose?: () => void; // Called when component unmounts or closes
  isSubmitting?: boolean; // Shows loading state during submission
}

// Main component that renders radio buttons and submit button for feedback collection
export const FeedbackToastContent: React.FC<FeedbackToastContentProps> = ({
  onSubmit,
  onClose,
  isSubmitting = false,
}) => {
  // Internal state management - this ensures re-renders work properly
  // Initialize with empty string to avoid controlled/uncontrolled warning
  const [selectedReason, setSelectedReason] = React.useState<FeedbackReason | ''>('');

  // Refs for focus management
  const submitButtonRef = React.useRef<HTMLButtonElement>(null);
  const radioGroupRef = React.useRef<HTMLDivElement>(null);

  // Cleanup function for when component unmounts
  React.useEffect(() => {
    return () => {
      onClose?.();
    };
  }, [onClose]);

  const handleSubmit = () => {
    if (selectedReason && selectedReason !== '') {
      onSubmit(selectedReason as FeedbackReason);
      setSelectedReason(''); // Clear internal state after submission
    }
  };

  // Handle keyboard navigation and shortcuts
  const handleKeyDown = (event: React.KeyboardEvent) => {
    // Quick submission: Ctrl+Enter or Cmd+Enter
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      if (selectedReason && selectedReason !== '' && !isSubmitting) {
        handleSubmit();
      }
      return;
    }

    // Escape key: close toast
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose?.();
      return;
    }

    // Tab navigation: move focus between radio group and submit button
    if (event.key === 'Tab') {
      // Let default tab behavior work for accessibility
      return;
    }

    // Enter key on submit button: submit if enabled
    if (event.key === 'Enter' && event.target === submitButtonRef.current) {
      event.preventDefault();
      if (selectedReason && selectedReason !== '' && !isSubmitting) {
        handleSubmit();
      }
      return;
    }

    // Space key on submit button: submit if enabled
    if (event.key === ' ' && event.target === submitButtonRef.current) {
      event.preventDefault();
      if (selectedReason && selectedReason !== '' && !isSubmitting) {
        handleSubmit();
      }
      return;
    }
  };

  // Focus management: move focus to submit button when reason is selected
  React.useEffect(() => {
    if (selectedReason && selectedReason !== '' && submitButtonRef.current) {
      // Small delay to ensure the button is enabled before focusing
      const timer = setTimeout(() => {
        submitButtonRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [selectedReason]);

  return (
    <div 
      className="space-y-4 w-full" 
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-label="Feedback form"
      aria-describedby="feedback-description"
    >
      {/* Hidden description for screen readers */}
      <div id="feedback-description" className="sr-only">
        Please select a reason for your feedback and then submit
      </div>

      {/* Radio group for selecting feedback reason */}
      <RadioGroup 
        value={selectedReason} 
        onValueChange={setSelectedReason}
        ref={radioGroupRef}
        aria-label="Feedback reason options"
        className="space-y-3 w-full mt-3"
      >
        {/* Each radio option with improved styling and accessibility */}
        <div className="flex items-center space-x-3 w-full bg-muted/50 rounded-md p-2">
          <RadioGroupItem 
            value="not_related" 
            id="not_related"
            className="border-2 border-white text-white focus:ring-2 focus:ring-white/20"
          />
          <Label htmlFor="not_related" className="text-sm font-medium text-foreground cursor-pointer flex-1">
            The answer was not related to my question
          </Label>
        </div>
        
        <div className="flex items-center space-x-3 w-full bg-muted/50 rounded-md p-2">
          <RadioGroupItem 
            value="incorrect" 
            id="incorrect"
            className="border-2 border-white text-white focus:ring-2 focus:ring-white/20"
          />
          <Label htmlFor="incorrect" className="text-sm font-medium text-foreground cursor-pointer flex-1">
            The answer was incorrect
          </Label>
        </div>
        
        <div className="flex items-center space-x-3 w-full bg-muted/50 rounded-md p-2">
          <RadioGroupItem 
            value="poorly_worded" 
            id="poorly_worded"
            className="border-2 border-white text-white focus:ring-2 focus:ring-white/20"
          />
          <Label htmlFor="poorly_worded" className="text-sm font-medium text-foreground cursor-pointer flex-1">
            The answer was poorly worded or confusing
          </Label>
        </div>
        
        <div className="flex items-center space-x-3 w-full bg-muted/50 rounded-md p-2">
          <RadioGroupItem 
            value="other" 
            id="other"
            className="border-2 border-white text-white focus:ring-2 focus:ring-white/20"
          />
          <Label htmlFor="other" className="text-sm font-medium text-foreground cursor-pointer flex-1">
            Other
          </Label>
        </div>
      </RadioGroup>
      
      {/* Submit button - disabled until reason is selected or during submission */}
      <Button 
        ref={submitButtonRef}
        onClick={handleSubmit} 
        disabled={!selectedReason || selectedReason === '' || isSubmitting}
        size="sm"
        className="w-full"
        aria-describedby={selectedReason ? "submit-enabled" : "submit-disabled"}
      >
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </Button>

      {/* Hidden descriptions for screen readers */}
      <div id="submit-enabled" className="sr-only">
        Submit button is enabled. Press Enter or Space to submit, or Ctrl+Enter for quick submission.
      </div>
      <div id="submit-disabled" className="sr-only">
        Submit button is disabled. Please select a feedback reason first.
      </div>
    </div>
  );
};

export default FeedbackToastContent; 