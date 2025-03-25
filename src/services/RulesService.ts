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
      // Log the path we're trying to load
      const path = `@/data/games/${gameId}/${gameId}-base.json`;
      console.log('Attempting to load rules from:', path);
      
      // Dynamic import of the JSON file
      console.log('Executing dynamic import');
      const rules = await import(`@/data/games/${gameId}/${gameId}-base.json`);
      console.log('Rules loaded:', rules ? 'Yes, keys: ' + Object.keys(rules).join(', ') : 'No');
      
      this.cachedRules.set(gameId, rules.default || rules);
      console.log('Rules cached for gameId:', gameId);
      return this.cachedRules.get(gameId);
    } catch (error) {
      console.error(`Failed to load rules for game ${gameId}:`, error);
      throw new Error(`Game rules not found for ${gameId}`);
    }
  }
  
  findRelevantSections(rules: any, query: string): any[] {
    const normalizedQuery = query.toLowerCase();
    const queryWords = normalizedQuery.split(/\s+/).filter(word => word.length > 2);
    const scoredSections: {section: any, score: number}[] = [];
    
    // First check if we have any direct keyword matches
    if (rules.keywords) {
      const matchedKeywords = Object.keys(rules.keywords).filter(keyword => 
        normalizedQuery.includes(keyword.toLowerCase())
      );
      
      if (matchedKeywords.length > 0) {
        // Get unique section names from all matched keywords
        const relevantSectionNames = new Set<string>();
        matchedKeywords.forEach(keyword => {
          rules.keywords[keyword].forEach((sectionName: string) => {
            relevantSectionNames.add(sectionName);
          });
        });
        
        // Find those sections in the rules and give them a high score
        relevantSectionNames.forEach(sectionName => {
          const section = this.findSectionByName(rules.sections, sectionName);
          if (section) {
            scoredSections.push({section, score: 10}); // High score for keyword matches
          }
        });
      }
    }
    
    // Score all sections based on word matches
    rules.sections.forEach((section: any) => {
      let score = 0;
      const sectionText = (section.title + ' ' + section.content).toLowerCase();
      
      // Count how many query words appear in the section
      queryWords.forEach(word => {
        if (sectionText.includes(word)) {
          score += 1;
        }
      });
      
      // Check for exact phrase matches (higher score)
      if (sectionText.includes(normalizedQuery)) {
        score += 5;
      }
      
      // Only add if we have some relevance
      if (score > 0) {
        // Check if we already added this section from keywords
        const existing = scoredSections.findIndex(s => s.section.title === section.title);
        if (existing >= 0) {
          scoredSections[existing].score += score;
        } else {
          scoredSections.push({section, score});
        }
      }
      
      // Also check subsections
      if (section.subsections) {
        section.subsections.forEach((subsection: any) => {
          let subScore = 0;
          const subText = (subsection.title + ' ' + subsection.content).toLowerCase();
          
          queryWords.forEach(word => {
            if (subText.includes(word)) {
              subScore += 1;
            }
          });
          
          if (subText.includes(normalizedQuery)) {
            subScore += 5;
          }
          
          if (subScore > 0) {
            const sectionWithSubsection = {
              title: section.title,
              content: section.content,
              subsections: [subsection]
            };
            
            scoredSections.push({section: sectionWithSubsection, score: subScore});
          }
        });
      }
    });
    
    // Sort by score (highest first) and take top 3
    return scoredSections
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(item => item.section);
  }
  
  private findSectionByName(sections: any[], name: string): any | null {
    for (const section of sections) {
      if (section.title === name) {
        return section;
      }
    }
    return null;
  }
}

export default new RulesService(); 