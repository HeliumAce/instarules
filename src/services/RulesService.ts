class RulesService {
  private cachedRules: Map<string, any> = new Map();
  
  constructor() {
    console.log('RulesService initialized');
  }
  
  async loadRules(gameId: string): Promise<any> {
    console.log('loadRules called for gameId:', gameId);
    
    if (this.cachedRules.has(gameId)) {
      console.log('Returning cached rules for gameId:', gameId);
      return this.cachedRules.get(gameId);
    }
    
    try {
      // Special case for Arcs which now uses multiple files
      if (gameId === 'arcs') {
        console.log('Loading Arcs data from multiple files');
        return await this.loadArcsRules();
      }
      
      // For other games, use the original approach
      const path = `@/data/games/${gameId}/${gameId}-base.json`;
      console.log('Attempting to load rules from:', path);
      
      // Dynamic import of the JSON file
      console.log('Executing dynamic import');
      const rules = await import(/* @vite-ignore */ `@/data/games/${gameId}/${gameId}-base.json`);
      console.log('Rules loaded:', rules ? 'Yes, keys: ' + Object.keys(rules).join(', ') : 'No');
      
      this.cachedRules.set(gameId, rules.default || rules);
      console.log('Rules cached for gameId:', gameId);
      return this.cachedRules.get(gameId);
    } catch (error) {
      console.error(`Failed to load rules for game ${gameId}:`, error);
      throw new Error(`Game rules not found for ${gameId}`);
    }
  }
  
  private async loadArcsRules(): Promise<any> {
    try {
      console.log('Loading Arcs rules from multiple files');
      
      // Load JSON files
      const cardsBasePromise = import('@/data/games/arcs/cards-base.json');
      const cardsBlightedReachPromise = import('@/data/games/arcs/cards-blighted-reach.json');
      const cardsLeadersLorePromise = import('@/data/games/arcs/cards-leaders-lore.json');
      const cardsErrataPromise = import('@/data/games/arcs/cards-errata.json');
      const cardsFaqPromise = import('@/data/games/arcs/cards-faq.json');
      const faqBasePromise = import('@/data/games/arcs/faq-base.json');
      const faqBlightedReachPromise = import('@/data/games/arcs/faq-blighted-reach.json');
      
      // Load HTML content using XMLHttpRequest
      console.log('Loading HTML files with XMLHttpRequest');
      const rulesBasePromise = this.loadHtmlFile('/src/data/games/arcs/rules-base.html');
      const rulesBlightedReachPromise = this.loadHtmlFile('/src/data/games/arcs/rules-blighted-reach.html');
      
      // Wait for all promises to resolve
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
      
      // Combine all data
      const combinedRules = {
        game: 'Arcs',
        sections: this.processArcsHtmlContent(rulesBase, rulesBlightedReach),
        cards: [
          ...(cardsBase.default || cardsBase),
          ...(cardsBlightedReach.default || cardsBlightedReach),
          ...(cardsLeadersLore.default || cardsLeadersLore)
        ],
        faq: [
          ...(this.processStructuredFaq(faqBase.default || faqBase, 'Base Game FAQ')),
          ...(this.processStructuredFaq(faqBlightedReach.default || faqBlightedReach, 'Blighted Reach FAQ')),
          ...(cardsFaq.default || cardsFaq) // Assuming cards-faq.json is already an array
        ],
        errata: this.processErrata(cardsErrata.default || cardsErrata) // Process errata for consistency
      };
      
      this.cachedRules.set('arcs', combinedRules);
      console.log('Arcs rules combined and cached');
      return combinedRules;
    } catch (error) {
      console.error('Failed to load Arcs rules from multiple files:', error);
      throw new Error('Failed to load Arcs rules');
    }
  }
  
  // Helper to load HTML file content
  private loadHtmlFile(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(xhr.responseText);
        } else {
          console.error(`XHR Error: Status ${xhr.status} for URL ${url}`);
          reject(new Error(`Failed to load HTML file: ${url} (Status: ${xhr.status})`));
        }
      };
      xhr.onerror = () => {
         console.error(`XHR Error: Network error for URL ${url}`);
         reject(new Error(`Network error loading HTML file: ${url}`));
      }
      xhr.send();
    });
  }
  
  // Helper to process structured FAQ JSON (faq-base, faq-blighted-reach)
  private processStructuredFaq(faqData: any, sourceType: string): any[] {
    if (!faqData || !Array.isArray(faqData.clarifications)) {
       console.warn(`Unexpected FAQ structure for ${sourceType}:`, faqData);
      return [];
    }
    // Map clarifications to a common structure expected by findRelevantSections if needed
    // Assuming the structure { section: string, text: string } is suitable
     return faqData.clarifications.map((item: any) => ({
      title: item.section || 'General Clarification', // Provide a default title
      content: item.text || '',
      sourceType: sourceType
    }));
  }
  
  // Helper to process structured Errata JSON
  private processErrata(errataData: any): any[] {
    if (!Array.isArray(errataData)) {
      console.warn(`Unexpected Errata structure:`, errataData);
      return [];
    }
    // Map errata to a common structure
     return errataData.map((item: any) => ({
      title: `Errata: ${item.card || 'General'}`, // Use card name or 'General' as title
      content: Array.isArray(item.errata) ? item.errata.map((e: any) => e.text).join('\\n') : item.text || '',
      sourceType: 'Errata'
    }));
  }
  
  // Helper to process the combined HTML content
  private processArcsHtmlContent(baseRulesHtml: string, blightedReachHtml: string): any[] {
    console.log('Processing HTML content for Arcs rules');
    const sections: any[] = [];
    
    // Process base rules HTML
    sections.push(...this.extractSectionsFromHtml(baseRulesHtml, 'Base Game Rules'));
    
    // Process blighted reach rules HTML
    sections.push(...this.extractSectionsFromHtml(blightedReachHtml, 'Blighted Reach Rules'));
    
     console.log(`Extracted ${sections.length} sections from HTML`);
    return sections;
  }
  
  // Helper to extract sections from a single HTML string
   private extractSectionsFromHtml(html: string, sourceType: string): any[] {
    const sections: any[] = [];
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const headings = doc.querySelectorAll('h1, h2, h3'); // Adjust based on actual structure
    
    let currentSection: any = null;
    let currentSubSection: any = null;
    
    headings.forEach(heading => {
        const level = parseInt(heading.tagName.substring(1));
        const title = heading.textContent?.trim() || 'Untitled Section';
        let content = '';
        
        // Extract content between this heading and the next
        let sibling = heading.nextSibling;
        while (sibling && !['H1', 'H2', 'H3'].includes(sibling.nodeName)) {
             if (sibling.nodeType === Node.TEXT_NODE) {
                 content += sibling.textContent;
             } else if (sibling.nodeType === Node.ELEMENT_NODE) {
                 // Include text from child elements, trying to preserve some structure
                 content += (sibling as Element).textContent; // Or innerText for less whitespace sensitivity
            }
            sibling = sibling.nextSibling;
        }
         content = content.replace(/\\s{2,}/g, ' ').trim(); // Clean up whitespace
        
        if (level === 1) { // Main sections (e.g., Page Numbers)
             currentSection = { title, content, sourceType, subsections: [] };
             sections.push(currentSection);
             currentSubSection = null; // Reset subsection when a new H1 is found
        } else if (level === 2 && currentSection) { // Subsections within a Page
             currentSubSection = { title, content, sourceType };
             currentSection.subsections.push(currentSubSection);
        } else if (level === 3 && currentSubSection) { // H3 might be details within an H2
              // Append H3 content to the current H2 subsection's content or handle differently
              currentSubSection.content += `\\n\\n**${title}**\\n${content}`;
        } else if (level === 3 && currentSection && !currentSubSection) {
             // H3 directly under H1? Create a subsection.
             currentSubSection = { title, content, sourceType };
             currentSection.subsections.push(currentSubSection);
        }
         // Add more levels (h4, etc.) if needed
    });
    
    return sections;
  }
  
  // Helper to strip HTML tags (Simple version, might need improvement)
  private stripHtmlTags(html: string): string {
    if (!html) return '';
    // Basic tag removal, might leave unwanted whitespace or content
    return html.replace(/<[^>]*>/g, ' ').replace(/\\s{2,}/g, ' ').trim();
  }
  
  findRelevantSections(rules: any, query: string): any[] {
    console.log(`Finding relevant sections for query: "${query}"`);
    if (!rules || !Array.isArray(rules.sections)) {
        console.error('Invalid rules object passed to findRelevantSections:', rules);
        return [];
    }
    
    const normalizedQuery = query.toLowerCase().trim();
     if (!normalizedQuery) return []; // Avoid processing empty queries
    
    const queryWords = new Set(normalizedQuery.split(/\W+/).filter(word => word.length > 2)); // Use Set for efficiency
     console.log('Query words:', Array.from(queryWords));
    
    const scoredSections: { section: any, score: number }[] = [];
    
    // --- Incorporate Card, FAQ, and Errata Data into Search ---
     const allContent = [
         ...rules.sections,
         ...(rules.cards || []).map((card: any) => ({ title: `Card: ${card.name}`, content: card.text || '', sourceType: card.tags?.join(', ') || 'Card' })),
         ...(rules.faq || []).map((faqItem: any) => ({ title: `FAQ: ${faqItem.card || faqItem.section || faqItem.title}`, content: faqItem.text || (Array.isArray(faqItem.faq) ? faqItem.faq.map((qa: any) => `Q: ${qa.q}\\nA: ${qa.a}`).join('\\n') : ''), sourceType: faqItem.sourceType || 'FAQ' })),
         ...(rules.errata || []).map((errataItem: any) => ({ title: errataItem.title || `Errata: ${errataItem.card || 'General'}`, content: errataItem.content || '', sourceType: 'Errata' }))
     ];
     console.log(`Total content items to search: ${allContent.length}`);
    
    // Score all content items based on word matches
     allContent.forEach((item: any, index: number) => {
         if (!item || typeof item.title !== 'string' || typeof item.content !== 'string') {
             // console.warn(`Skipping invalid content item at index ${index}:`, item);
             return; // Skip malformed items
         }
         
         let score = 0;
         const itemTitleLower = item.title.toLowerCase();
         const itemContentLower = item.content.toLowerCase();
         const combinedTextLower = itemTitleLower + ' ' + itemContentLower;
         
         // 1. Exact phrase match in title or content (high score)
         if (combinedTextLower.includes(normalizedQuery)) {
             score += 15;
         }
         
         // 2. All query words present (good score)
         let allWordsFound = queryWords.size > 0;
         queryWords.forEach(word => {
             if (!combinedTextLower.includes(word)) {
                 allWordsFound = false;
             } else {
                  score += 2; // Add score for each matching word
             }
         });
         if (allWordsFound) {
             score += 10;
         }
         
         // 3. Boost score for matches in title
         queryWords.forEach(word => {
             if (itemTitleLower.includes(word)) {
                 score += 3;
             }
         });
          if (itemTitleLower.includes(normalizedQuery)) {
             score += 5; // Extra boost for full phrase in title
         }
         
         // 4. Simple keyword existence (lower score)
         // (Already covered by word scoring above)
         
         // Consider subsections if applicable (original logic)
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
                      // Represent subsection match by adding it with a slightly modified title
                      scoredSections.push({
                          section: {
                              ...item, // Include parent section info
                              title: `${item.title} - ${subsection.title}`, // Combine titles
                              content: subsection.content // Use subsection content primarily
                          },
                          score: score + subScore // Combine scores, maybe weigh subsection less?
                     });
                 }
             });
         } else if (score > 0) {
             // Only add if we have some relevance
              scoredSections.push({ section: item, score });
         }
     });
     
     // Remove duplicates (prefer higher score if title/content match)
     const uniqueScoredSections = scoredSections.reduce((acc, current) => {
         const existingIndex = acc.findIndex(item => item.section.title === current.section.title && item.section.content === current.section.content);
         if (existingIndex > -1) {
             if (current.score > acc[existingIndex].score) {
                 acc[existingIndex] = current; // Replace with higher score
             }
         } else {
             acc.push(current);
         }
         return acc;
     }, [] as {section: any, score: number}[]);
     
    // Sort by score (highest first) and take top results (e.g., top 5)
     const topSections = uniqueScoredSections
      .sort((a, b) => b.score - a.score)
      .slice(0, 5) // Increased from 3 to potentially include card/faq data
      .map(item => item.section);

      console.log(`Found ${topSections.length} relevant sections:`, topSections.map(s => s.title));
      return topSections;
  }
  
  // Find section by name (used by older keyword logic, might not be needed now)
  private findSectionByName(sections: any[], name: string): any | null {
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
}

export default new RulesService(); 