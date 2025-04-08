// Helper to load HTML file content
const loadHtmlFile = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr.responseText);
      } else {
        reject(new Error(`Failed to load HTML file: ${url} (Status: ${xhr.status})`));
      }
    };
    xhr.onerror = () => {
       reject(new Error(`Network error loading HTML file: ${url}`));
    }
    xhr.send();
  });
}

// Helper to process structured FAQ JSON
const processStructuredFaq = (faqData: any, sourceType: string): any[] => {
  if (!faqData || !Array.isArray(faqData.clarifications)) {
    return [];
  }
   return faqData.clarifications.map((item: any) => ({
    title: item.section || 'General Clarification',
    content: item.text || '',
    sourceType: sourceType
  }));
}

// Helper to process structured Errata JSON
const processErrata = (errataData: any): any[] => {
  if (!Array.isArray(errataData)) {
    return [];
  }
   return errataData.map((item: any) => ({
    title: `Errata: ${item.card || 'General'}`, 
    content: Array.isArray(item.errata) ? item.errata.map((e: any) => e.text).join('\\n') : item.text || '',
    sourceType: 'Errata'
  }));
}

// Helper to extract sections from a single HTML string
const extractSectionsFromHtml = (html: string, sourceType: string): any[] => {
  const sections: any[] = [];
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const headings = doc.querySelectorAll('h1, h2, h3');
  
  let currentSection: any = null;
  let currentSubSection: any = null;
  
  headings.forEach(heading => {
      const level = parseInt(heading.tagName.substring(1));
      const title = heading.textContent?.trim() || 'Untitled Section';
      let content = '';
      
      let sibling = heading.nextSibling;
      while (sibling && !['H1', 'H2', 'H3'].includes(sibling.nodeName)) {
           if (sibling.nodeType === Node.TEXT_NODE) {
               content += sibling.textContent;
           } else if (sibling.nodeType === Node.ELEMENT_NODE) {
               content += (sibling as Element).textContent;
          }
          sibling = sibling.nextSibling;
      }
       content = content.replace(/\s{2,}/g, ' ').trim();
      
      if (level === 1) {
           currentSection = { title, content, sourceType, subsections: [] };
           sections.push(currentSection);
           currentSubSection = null;
      } else if (level === 2 && currentSection) {
           currentSubSection = { title, content, sourceType };
           currentSection.subsections.push(currentSubSection);
      } else if (level === 3 && currentSubSection) {
            currentSubSection.content += `\n\n**${title}**\n${content}`;
      } else if (level === 3 && currentSection && !currentSubSection) {
           currentSubSection = { title, content, sourceType };
           currentSection.subsections.push(currentSubSection);
      }
  });
  
  return sections;
}

// Helper to process the combined HTML content for Arcs
const processArcsHtmlContent = (baseRulesHtml: string, blightedReachHtml: string): any[] => {
  const sections: any[] = [];
  sections.push(...extractSectionsFromHtml(baseRulesHtml, 'Base Game Rules'));
  sections.push(...extractSectionsFromHtml(blightedReachHtml, 'Blighted Reach Rules'));
  return sections;
}

// Main function to load Arcs rules from multiple sources
const loadArcsRules = async (): Promise<any> => {
  try {
    const cardsBasePromise = import('@/data/games/arcs/cards-base.json');
    const cardsBlightedReachPromise = import('@/data/games/arcs/cards-blighted-reach.json');
    const cardsLeadersLorePromise = import('@/data/games/arcs/cards-leaders-lore.json');
    const cardsErrataPromise = import('@/data/games/arcs/cards-errata.json');
    const cardsFaqPromise = import('@/data/games/arcs/cards-faq.json');
    const faqBasePromise = import('@/data/games/arcs/faq-base.json');
    const faqBlightedReachPromise = import('@/data/games/arcs/faq-blighted-reach.json');
    const rulesBasePromise = loadHtmlFile('/src/data/games/arcs/rules-base.html');
    const rulesBlightedReachPromise = loadHtmlFile('/src/data/games/arcs/rules-blighted-reach.html');
    
    const [
      cardsBase,
      cardsBlightedReach,
      cardsLeadersLore,
      cardsErrata,
      cardsFaq,
      faqBase,
      faqBlightedReach,
      rulesBase,
      rulesBlightedReach
    ] = await Promise.all([
      cardsBasePromise,
      cardsBlightedReachPromise,
      cardsLeadersLorePromise,
      cardsErrataPromise,
      cardsFaqPromise,
      faqBasePromise,
      faqBlightedReachPromise,
      rulesBasePromise,
      rulesBlightedReachPromise
    ]);
    
    const combinedRules = {
      game: 'Arcs',
      sections: processArcsHtmlContent(rulesBase, rulesBlightedReach),
      cards: [
        ...(cardsBase.default || cardsBase),
        ...(cardsBlightedReach.default || cardsBlightedReach),
        ...(cardsLeadersLore.default || cardsLeadersLore)
      ],
      faq: [
        ...(processStructuredFaq(faqBase.default || faqBase, 'Base Game FAQ')),
        ...(processStructuredFaq(faqBlightedReach.default || faqBlightedReach, 'Blighted Reach FAQ')),
        ...(cardsFaq.default || cardsFaq)
      ],
      errata: processErrata(cardsErrata.default || cardsErrata)
    };
    
    return combinedRules;
  } catch (error) {
    throw new Error('Failed to load Arcs rules');
  }
}

/**
 * Fetches and processes the rules for a given game ID.
 * Handles loading JSON for general games and combined sources for 'arcs'.
 */
export const fetchGameRules = async (gameId: string): Promise<any> => {
  try {
    if (gameId === 'arcs') {
      return await loadArcsRules();
    }
    
    const rules = await import(/* @vite-ignore */ `@/data/games/${gameId}/${gameId}-base.json`);
    return rules.default || rules;
  } catch (error) {
    throw new Error(`Game rules not found for ${gameId}`);
  }
}

/**
 * Finds relevant sections, cards, FAQs, or errata based on a query.
 * Scores content items based on keyword matching and returns the top results.
 */
export const findRelevantSections = (rules: any, query: string): any[] => {
  if (!rules) {
      return [];
  }
  
  const normalizedQuery = query.toLowerCase().trim();
   if (!normalizedQuery) return [];
  
  const queryWords = new Set(normalizedQuery.split(/\W+/).filter(word => word.length > 2));
  
  const scoredSections: { section: any, score: number }[] = [];
  
   // Combine all searchable content
   const allContent = [
       ...(rules.sections || []),
       ...(rules.cards || []).map((card: any) => ({ title: `Card: ${card.name}`, content: card.text || '', sourceType: card.tags?.join(', ') || 'Card' })),
       ...(rules.faq || []).map((faqItem: any) => ({ title: `FAQ: ${faqItem.card || faqItem.section || faqItem.title}`, content: faqItem.text || (Array.isArray(faqItem.faq) ? faqItem.faq.map((qa: any) => `Q: ${qa.q}\nA: ${qa.a}`).join('\n') : ''), sourceType: faqItem.sourceType || 'FAQ' })),
       ...(rules.errata || []).map((errataItem: any) => ({ title: errataItem.title || `Errata: ${errataItem.card || 'General'}`, content: errataItem.content || '', sourceType: 'Errata' }))
   ];
  
  allContent.forEach((item: any) => {
       if (!item || typeof item.title !== 'string' || typeof item.content !== 'string') {
           return;
       }
       
       let score = 0;
       const itemTitleLower = item.title.toLowerCase();
       const itemContentLower = item.content.toLowerCase();
       const combinedTextLower = itemTitleLower + ' ' + itemContentLower;
       
       if (combinedTextLower.includes(normalizedQuery)) {
           score += 15;
       }
       
       let allWordsFound = queryWords.size > 0;
       queryWords.forEach(word => {
           if (!combinedTextLower.includes(word)) {
               allWordsFound = false;
           } else {
                score += 2;
           }
       });
       if (allWordsFound) {
           score += 10;
       }
       
       queryWords.forEach(word => {
           if (itemTitleLower.includes(word)) {
               score += 3;
           }
       });
        if (itemTitleLower.includes(normalizedQuery)) {
           score += 5;
       }
       
       if (Array.isArray(item.subsections)) {
           item.subsections.forEach((subsection: any) => {
                if (!subsection || typeof subsection.title !== 'string' || typeof subsection.content !== 'string') return;
               
               let subScore = 0;
               const subTitleLower = subsection.title.toLowerCase();
               const subContentLower = subsection.content.toLowerCase();
               const combinedSubTextLower = subTitleLower + ' ' + subContentLower;
               
               if (combinedSubTextLower.includes(normalizedQuery)) subScore += 15;
               
               let allSubWordsFound = queryWords.size > 0;
               queryWords.forEach(word => {
                    if (!combinedSubTextLower.includes(word)) {
                        allSubWordsFound = false;
                    } else {
                       subScore += 2;
                    }
               });
                if (allSubWordsFound) subScore += 10;
                
               queryWords.forEach(word => {
                    if (subTitleLower.includes(word)) subScore += 3;
               });
               if (subTitleLower.includes(normalizedQuery)) subScore += 5;
               
               if (subScore > 0) {
                    scoredSections.push({
                        section: {
                            ...item,
                            title: `${item.title} - ${subsection.title}`,
                            content: subsection.content
                        },
                        score: score + subScore
                   });
               }
           });
       } else if (score > 0) {
            scoredSections.push({ section: item, score });
       }
   });
   
   const uniqueScoredSections = scoredSections.reduce((acc, current) => {
       const existingIndex = acc.findIndex(item => item.section.title === current.section.title && item.section.content === current.section.content);
       if (existingIndex > -1) {
           if (current.score > acc[existingIndex].score) {
               acc[existingIndex] = current;
           }
       } else {
           acc.push(current);
       }
       return acc;
   }, [] as {section: any, score: number}[]);
   
   const topSections = uniqueScoredSections
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(item => item.section);

    return topSections;
}

// Find section by name (used by older keyword logic, might not be needed now)
const findSectionByName = (sections: any[], name: string): any | null => {
  for (const section of sections) {
    if (section.title === name) {
      return section;
    }
     // Optionally search subsections too
     if (Array.isArray(section.subsections)) {
          for (const sub of section.subsections) {
              if (sub.title === name) {
                   // Return the subsection directly or the parent section?
                   // Let's return the subsection for specificity
                   return sub;
              }
          }
     }
  }
  return null;
} 