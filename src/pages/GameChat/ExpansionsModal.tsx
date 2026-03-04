import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ExpansionDefinition } from '@/types/game';

interface ExpansionsModalProps {
  expansions: ExpansionDefinition[];
  isOpen: boolean;
  onClose: () => void;
  isExpansionEnabled: (id: string) => boolean;
  onToggle: (id: string) => void;
}

export function ExpansionsModal({
  expansions,
  isOpen,
  onClose,
  isExpansionEnabled,
  onToggle,
}: ExpansionsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Expansions</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Base Game</Label>
            <Switch checked disabled aria-label="Base game always enabled" />
          </div>

          <hr className="border-border" />

          {expansions.map(expansion => (
            <div key={expansion.id} className="flex items-center justify-between">
              <Label htmlFor={`exp-${expansion.id}`} className="text-sm font-medium cursor-pointer">
                {expansion.displayName}
              </Label>
              <Switch
                id={`exp-${expansion.id}`}
                checked={isExpansionEnabled(expansion.id)}
                onCheckedChange={() => onToggle(expansion.id)}
                aria-label={`Toggle ${expansion.displayName}`}
              />
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
