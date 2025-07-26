import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ReactMarkdown from 'react-markdown';
import { Source } from '@/types/game';

interface SourceModalProps {
  source: Source | null;
  isOpen: boolean;
  onClose: () => void;
}

export function SourceModal({ source, isOpen, onClose }: SourceModalProps) {
  if (!source) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{source.title}</DialogTitle>
        </DialogHeader>
        
        <div className="overflow-y-auto max-h-[60vh]">
          <ReactMarkdown>
            {source.content || 'No content available.'}
          </ReactMarkdown>
        </div>
      </DialogContent>
    </Dialog>
  );
} 