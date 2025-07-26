import { Source, RuleSource, CardSource } from '@/types/game';

interface SourcesListProps {
  sources: Source[];
  onSourceClick?: (source: Source) => void;
  closeTooltip?: () => void;
}

export function SourcesList({ sources, onSourceClick, closeTooltip }: SourcesListProps) {
  // Step 1: Deduplicate card sources before grouping
  const deduplicatedSources = sources.reduce((acc, source) => {
    if (source.contentType === 'rule') {
      const ruleSource = source as RuleSource;
      const cardMatch = ruleSource.title.match(/^(.+?)\s*\(ID:\s*([^)]+)\)$/);
      
      if (cardMatch) {
        // This is a card source - check for duplicates
        const cardName = cardMatch[1];
        
        const existingIndex = acc.findIndex(s => {
          if (s.contentType === 'rule') {
            const existingMatch = (s as RuleSource).title.match(/^(.+?)\s*\(ID:\s*([^)]+)\)$/);
            return existingMatch && existingMatch[1] === cardName;
          }
          return false;
        });
        
        if (existingIndex !== -1) {
          // Duplicate found - prefer base game over expansion
          const existing = acc[existingIndex] as RuleSource;
          const isCurrentBaseGame = ruleSource.bookName.includes('Base Game');
          const isExistingBaseGame = existing.bookName.includes('Base Game');
          
          if (isCurrentBaseGame && !isExistingBaseGame) {
            acc[existingIndex] = source; // Replace expansion with base game
          }
          // Otherwise keep existing (base game preferred, or first expansion if no base game)
        } else {
          acc.push(source); // No duplicate, add it
        }
      } else {
        acc.push(source); // Not a card, add it
      }
    } else {
      acc.push(source); // Not a rule, add it
    }
    return acc;
  }, [] as Source[]);

  // Step 2: Categorize and group sources by content type, then by base game priority
  const categorizedSources = deduplicatedSources.reduce((acc, source) => {
    let category = 'Other';
    let bookName = 'Other';
    
    if (source.contentType === 'rule') {
      const ruleSource = source as RuleSource;
      bookName = ruleSource.bookName;
      
      // Categorize based on bookName patterns
      if (bookName.toLowerCase().includes('cards')) {
        category = 'Cards';
      } else if (bookName.toLowerCase().includes('faq')) {
        category = 'FAQ';  
      } else if (bookName.toLowerCase().includes('rules')) {
        category = 'Rules';
      } else {
        category = 'Other';
      }
    } else if (source.contentType === 'card') {
      category = 'Cards';
      bookName = (source as CardSource).cardName;
    } else {
      category = 'Other';
    }
    
    if (!acc[category]) {
      acc[category] = {};
    }
    if (!acc[category][bookName]) {
      acc[category][bookName] = [];
    }
    acc[category][bookName].push(source);
    return acc;
  }, {} as Record<string, Record<string, Source[]>>);

  // Step 3: Sort categories and books within categories (Base Game first)
  const categoryOrder = ['Rules', 'Cards', 'FAQ', 'Other'];
  const sortedCategories = categoryOrder.filter(cat => categorizedSources[cat]);
  
  const sourcesByBook: Record<string, Source[]> = {};
  
  sortedCategories.forEach(category => {
    const books = Object.keys(categorizedSources[category]);
    
    // Sort books within category: Base Game first, then alphabetically
    const sortedBooks = books.sort((a, b) => {
      const aIsBaseGame = a.toLowerCase().includes('base game');
      const bIsBaseGame = b.toLowerCase().includes('base game');
      
      if (aIsBaseGame && !bIsBaseGame) return -1;
      if (!aIsBaseGame && bIsBaseGame) return 1;
      return a.localeCompare(b);
    });
    
    sortedBooks.forEach(bookName => {
      sourcesByBook[bookName] = categorizedSources[category][bookName];
    });
  });

  const handleClick = (source: Source) => {
    // Call the onSourceClick handler
    onSourceClick?.(source);
    // Close the tooltip
    closeTooltip?.();
  };

  return (
    <div className="mt-2 space-y-3 text-sm">
      {Object.entries(sourcesByBook).map(([bookName, bookSources]) => (
        <div key={bookName}>
          <h4 className="font-medium text-xs uppercase tracking-wider text-muted-foreground mb-1">
            {bookName}
          </h4>
          <ul className="space-y-1">
            {bookSources.map((source) => (
              <li key={source.id}>
                <button
                  onClick={() => handleClick(source)}
                  className="text-left w-full hover:text-foreground text-muted-foreground transition-colors line-clamp-2"
                  title={(() => {
                    if (source.contentType === 'rule') {
                      const ruleSource = source as RuleSource;
                      // Check if this is a card source (title contains "(ID: ")
                      const cardMatch = ruleSource.title.match(/^(.+?)\s*\(ID:\s*([^)]+)\)$/);
                      if (cardMatch) {
                        return `${cardMatch[1]} (${cardMatch[2]})`;
                      }
                      // Regular rule source
                      return `${ruleSource.sourceHeading}${ruleSource.pageNumber ? ` (p.${ruleSource.pageNumber})` : ''}`;
                    } else {
                      return `${(source as CardSource).cardName} (${(source as CardSource).cardId})`;
                    }
                  })()}
                >
                  <div className="font-semibold">
                    {(() => {
                      if (source.contentType === 'rule') {
                        const ruleSource = source as RuleSource;
                        // Check if this is a card source (title contains "(ID: ")
                        const cardMatch = ruleSource.title.match(/^(.+?)\s*\(ID:\s*([^)]+)\)$/);
                        if (cardMatch) {
                          return cardMatch[1]; // Return card name without ID
                        }
                        // Regular rule source - convert to Title Case
                        const cleanHeading = ruleSource.sourceHeading.replace(/\s*\(Page\s*\d+\)\s*$/i, '');
                        return cleanHeading.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
                      } else {
                        return (source as CardSource).cardName;
                      }
                    })()}
                  </div>
                  <div className="text-xs opacity-75">
                    {(() => {
                      if (source.contentType === 'rule') {
                        const ruleSource = source as RuleSource;
                        // Check if this is a card source (title contains "(ID: ")
                        const cardMatch = ruleSource.title.match(/^(.+?)\s*\(ID:\s*([^)]+)\)$/);
                        if (cardMatch) {
                          return cardMatch[2]; // Return card ID without "ID: " prefix
                        }
                        // Regular rule source with page number
                        return ruleSource.pageNumber ? `Page ${ruleSource.pageNumber}` : '';
                      } else if (source.contentType === 'card') {
                        return (source as CardSource).cardId;
                      }
                      return '';
                    })()}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
} 