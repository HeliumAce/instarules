import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ToggleLeft } from 'lucide-react';
import { ExpansionDefinition } from '@/types/game';

interface ExpansionsPopoverProps {
  expansions: ExpansionDefinition[];
  isExpansionEnabled: (id: string) => boolean;
  onToggle: (id: string) => void;
}

export function ExpansionsPopover({
  expansions,
  isExpansionEnabled,
  onToggle,
}: ExpansionsPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <ToggleLeft size={16} />
          Expansions
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-0">
        <div className="px-3 py-2.5 border-b border-border">
          <p className="text-sm font-semibold text-muted-foreground">Expansions</p>
        </div>
        <div className="p-3 space-y-3">
          {expansions.map(expansion => (
            <div key={expansion.id} className="flex items-center justify-between">
              <Label
                htmlFor={`exp-${expansion.id}`}
                className="text-sm text-muted-foreground cursor-pointer"
              >
                {expansion.displayName}
              </Label>
              <Switch
                id={`exp-${expansion.id}`}
                checked={isExpansionEnabled(expansion.id)}
                onCheckedChange={() => onToggle(expansion.id)}
                aria-label={`Toggle ${expansion.displayName}`}
                className="data-[state=unchecked]:bg-muted-foreground"
              />
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
