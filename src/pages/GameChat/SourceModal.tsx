import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { X, FileText, BookOpen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Source, RuleSource, CardSource } from '@/types/game';
import { cn } from '@/lib/utils';

interface SourceModalProps {
  source: Source | null;
  isOpen: boolean;
  onClose: () => void;
}

export function SourceModal({ source, isOpen, onClose }: SourceModalProps) {
  if (!source) return null;

  const isRuleSource = source.contentType === 'rule';
  const ruleSource = isRuleSource ? source as RuleSource : null;
  const cardSource = !isRuleSource ? source as CardSource : null;

  const getSourceIcon = () => {
    if (isRuleSource) {
      return <BookOpen className="w-4 h-4" />;
    }
    return <FileText className="w-4 h-4" />;
  };

  const getSourceTitle = () => {
    if (isRuleSource && ruleSource) {
      return ruleSource.sourceHeading;
    }
    if (cardSource) {
      return cardSource.cardName;
    }
    return source.title;
  };

  const getSourceSubtitle = () => {
    if (isRuleSource && ruleSource) {
      const parts = [];
      if (ruleSource.bookName) parts.push(ruleSource.bookName);
      if (ruleSource.pageNumber) parts.push(`Page ${ruleSource.pageNumber}`);
      return parts.join(' • ');
    }
    if (cardSource && cardSource.cardId) {
      return `ID: ${cardSource.cardId}`;
    }
    return '';
  };

  const getSourceTypeBadge = () => {
    const typeMap = {
      rule: 'Rule',
      card: 'Card',
      faq: 'FAQ',
      errata: 'Errata'
    };
    return typeMap[source.contentType] || 'Source';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {getSourceIcon()}
              <div className="flex-1">
                <DialogTitle className="text-lg font-semibold">
                  {getSourceTitle()}
                </DialogTitle>
                {getSourceSubtitle() && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {getSourceSubtitle()}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {getSourceTypeBadge()}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Separator className="my-4" />

        <ScrollArea className="flex-1">
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown>
              {source.content || 'No content available.'}
            </ReactMarkdown>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
} 