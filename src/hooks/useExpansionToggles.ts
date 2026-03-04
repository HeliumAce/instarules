import { useState, useEffect, useCallback } from 'react';
import { ExpansionDefinition } from '@/types/game';

const STORAGE_KEY_PREFIX = 'expansionToggles_';

export function useExpansionToggles(gameId: string, expansions: ExpansionDefinition[]) {
  const [enabledExpansions, setEnabledExpansions] = useState<string[]>(() => {
    const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${gameId}`);
    if (stored) {
      try {
        return JSON.parse(stored) as string[];
      } catch {
        // fall through to defaults
      }
    }
    return expansions.filter(e => e.defaultEnabled).map(e => e.id);
  });

  useEffect(() => {
    localStorage.setItem(
      `${STORAGE_KEY_PREFIX}${gameId}`,
      JSON.stringify(enabledExpansions)
    );
  }, [gameId, enabledExpansions]);

  const toggleExpansion = useCallback((expansionId: string) => {
    setEnabledExpansions(prev =>
      prev.includes(expansionId)
        ? prev.filter(id => id !== expansionId)
        : [...prev, expansionId]
    );
  }, []);

  const isExpansionEnabled = useCallback(
    (expansionId: string) => enabledExpansions.includes(expansionId),
    [enabledExpansions]
  );

  return { enabledExpansions, toggleExpansion, isExpansionEnabled };
}
