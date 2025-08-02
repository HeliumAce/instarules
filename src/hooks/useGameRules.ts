import { useQuery, useMutation, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import { getLLMCompletion } from '@/services/LLMService';
import { fetchGameRules, fetchRelevantSectionsFromVectorDb, findRelevantSections } from '@/services/RulesService';
import { preprocessQuery, classifyQuery, detectFollowUp, expandQueryByType } from '@/services/QueryPreprocessorService';
import { extractEntitiesFromHistory, rankEntitiesByRelevance } from '@/services/EntityExtractionService';
import { gameResponses } from '@/data/games';
import { useSupabase } from '@/context/SupabaseContext';
import { VectorSearchResult } from '@/types/search';
import { PromptService } from '@/services/PromptService';

// Define the structure for the data returned by the rules query
interface GameRulesData {
  game: string;
  rules: any;
}

// VectorSearchResult type now imported from centralized types

// Define the structure for the variables passed to the mutation
interface AskQuestionVariables {
  question: string;
  chatHistory?: { content: string; isUser: boolean }[];
  skipFollowUpHandling?: boolean;
}

// Define the structure for the returned value of the hook
interface UseGameRulesReturn {
  rulesQuery: UseQueryResult<GameRulesData, Error>;
  askMutation: UseMutationResult<string, Error, AskQuestionVariables, unknown>;
  getFallbackResponse: (question: string) => string;
}

// Helper function to check if two content blocks are similar
function isSimilarContent(content1: string, content2: string, threshold: number): boolean {
  // Simple text similarity check
  const preview1 = content1.substring(0, 200).toLowerCase();
  const preview2 = content2.substring(0, 200).toLowerCase();
  
  // If one completely contains the other, they're similar
  if (preview1.includes(preview2) || preview2.includes(preview1)) {
    return true;
  }
  
  // Count matching words as a similarity measure
  const words1 = new Set(preview1.split(/\s+/).filter(w => w.length > 3));
  const words2 = new Set(preview2.split(/\s+/).filter(w => w.length > 3));
  
  // Find intersection
  const commonWords = [...words1].filter(word => words2.has(word));
  
  // Calculate Jaccard similarity
  const similarity = commonWords.length / (words1.size + words2.size - commonWords.length);
  
  return similarity >= threshold;
}





// Convert vector search results to MessageSources format
function convertToMessageSources(results: VectorSearchResult[]): MessageSources {
  if (!results || results.length === 0) {
    return { count: 0, sources: [] };
  }
  
  const sources = results.map((result): Source => {
    // Extract metadata from the result
    const metadata = result.metadata || {};
    
    // Check if it's a rule or card based on metadata
    if (metadata.card_id || metadata.card_name || (metadata.content_type === 'card')) {
      // Extract card information from content if not in metadata
      let cardName = metadata.card_name;
      let cardId = metadata.card_id;
      
      if (!cardName || !cardId) {
        // Try to extract from content
        const content = result.content || '';
        
        // Look for card name pattern
        if (!cardName) {
          // First line might contain the card name
          const firstLine = content.split('\n')[0];
          if (firstLine && firstLine.length < 50) {
            cardName = firstLine.replace(/\(ID:.*?\)/i, '').trim();
          }
        }
        
        // Look for card ID pattern
        if (!cardId) {
          const idMatch = content.match(/\(ID:\s*([\w\-]+)\)/i) || 
                          content.match(/ID:\s*([\w\-]+)/i) ||
                          content.match(/(ARCS-[\w\-]+)/i);
          if (idMatch && idMatch[1]) {
            cardId = idMatch[1].trim();
          }
        }
      }
      
      // It's a card source
      return {
        id: result.id,
        contentType: 'card',
        title: cardName || 'Card',
        cardId: cardId || '',
        cardName: cardName || 'Card',
        content: result.content // Preserve the actual content for display
      } as CardSource;
    } else {
      // Extract enhanced metadata from the v2 schema
      const content = result.content || '';
      
      // Use h1_heading as the primary source/book name (new enhanced metadata)
      const h1Heading = (result as any).h1_heading || metadata.h1_heading;
      let bookName = h1Heading || "Rulebook";
      
      // Clean up H1 heading for display (remove file extensions, convert to title case)
      if (bookName && bookName !== "Rulebook") {
        // Convert common patterns to readable names
        bookName = bookName
          .replace(/^arcs_/i, '')
          .replace(/_/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());
        
        // Map specific patterns to cleaner names
        const cleanNames: Record<string, string> = {
          'Rules Base Game': 'Base Game Rules',
          'Rules Blighted Reach': 'Blighted Reach Rules', 
          'Cards Base Game': 'Base Game Cards',
          'Cards Blighted Reach': 'Blighted Reach Cards',
          'Cards Leaders And Lore': 'Leaders and Lore',
          'Cards Errata': 'Card Errata',
          'Faq Base Game': 'Base Game FAQ',
          'Faq Blighted Reach': 'Blighted Reach FAQ',
          'Cards Faq': 'Cards FAQ'
        };
        
        bookName = cleanNames[bookName] || bookName;
      }
      
      // Try to extract page number
      let pageNumber = metadata.page ? parseInt(metadata.page) : undefined;
      if (!pageNumber) {
        const pageMatch = content.match(/\(Page (\d+)\)/i);
        if (pageMatch && pageMatch[1]) {
          pageNumber = parseInt(pageMatch[1]);
        }
      }
      
      // Use source_heading from metadata as the specific section within the book
      let sourceHeading = metadata.source_heading || metadata.heading || '';
      if (!sourceHeading) {
        // Try to find section title in content as fallback
        const lines = content.split('\n');
        const titleLine = lines.find(line => 
          /^[A-Z].*[A-Z]/.test(line) || // Contains uppercase letters
          line.includes(':') || // Contains a colon
          (line.length < 40 && line.length > 5) // Short line that might be a title
        );
        
        if (titleLine) {
          sourceHeading = titleLine
            .replace(/\(Page \d+\)/i, '')
            .replace(/^\s*-\s*/, '')
            .trim();
        }
      }
      
      // Convert ALL CAPS headings to Title Case for better readability
      if (sourceHeading === sourceHeading.toUpperCase() && sourceHeading.length > 2) {
        sourceHeading = sourceHeading
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
      }
      
      // Default to rule source with enhanced v2 metadata
      return {
        id: result.id,
        contentType: 'rule',
        title: metadata.title || sourceHeading || 'Rule',
        bookName: bookName,
        headings: metadata.headings || [],
        sourceHeading: sourceHeading || 'General Rules',
        pageNumber: pageNumber,
        content: result.content // Preserve the actual content for display
      } as RuleSource;
    }
  });
  
  // Deduplicate sources
  const deduplicatedSources = deduplicateSources(sources);
  
  return {
    count: deduplicatedSources.length,
    sources: deduplicatedSources
  };
}

// Helper function to deduplicate and organize sources
function deduplicateSources(sources: Source[]): Source[] {
  if (!sources || sources.length <= 1) {
    return sources;
  }
  
  // Step 1: Deduplicate with quality checks
  const uniqueRuleSources = new Map<string, RuleSource>();
  const uniqueCardSources = new Map<string, CardSource>();
  const otherSources: Source[] = [];
  
  // Process each source
  sources.forEach(source => {
    if (source.contentType === 'rule') {
      const ruleSource = source as RuleSource;
      
      // Create a unique key for this rule source
      const key = `${ruleSource.sourceHeading}-${ruleSource.pageNumber || 'unknown'}-${ruleSource.bookName}`;
      
      // Check if this is a higher quality source than what we already have
      if (!uniqueRuleSources.has(key) || isHigherQualitySource(ruleSource, uniqueRuleSources.get(key)!)) {
        uniqueRuleSources.set(key, ruleSource);
      }
    } else if (source.contentType === 'card') {
      const cardSource = source as CardSource;
      
      // Create a unique key for this card source
      const key = cardSource.cardId ? `${cardSource.cardName}-${cardSource.cardId}` : cardSource.cardName;
      
      // Check if this is a higher quality source than what we already have
      if (!uniqueCardSources.has(key) || isHigherQualityCardSource(cardSource, uniqueCardSources.get(key)!)) {
        uniqueCardSources.set(key, cardSource);
      }
    } else {
      // For any other type of source, just add it
      otherSources.push(source);
    }
  });
  
  // Step 2: Group similar rule sources (e.g., same section but different pages)
  // This helps consolidate redundant entries like "THE BLIGHT" appearing multiple times
  const groupedRuleSources = new Map<string, RuleSource[]>();
  
  uniqueRuleSources.forEach((source) => {
    // Group by heading name (ignoring page numbers and small variations)
    // Use case-insensitive comparison but preserve original casing for display
    const normalizedHeading = source.sourceHeading.toUpperCase().trim();
    const originalHeading = source.sourceHeading.trim();
    
    if (!groupedRuleSources.has(normalizedHeading)) {
      groupedRuleSources.set(normalizedHeading, []);
    }
    
    // Ensure we preserve the original casing
    if (source.sourceHeading === source.sourceHeading.toUpperCase() && originalHeading.length > 2) {
      // Convert all-caps headings to title case for better readability
      source.sourceHeading = originalHeading
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    }
    
    groupedRuleSources.get(normalizedHeading)!.push(source);
  });
  
  // Keep only the best source from each group
  const bestRuleSources: RuleSource[] = [];
  
  groupedRuleSources.forEach((sourceGroup) => {
    if (sourceGroup.length === 1) {
      // Only one source in this group, add it directly
      bestRuleSources.push(sourceGroup[0]);
    } else {
      // Multiple sources with the same heading, pick the best one
      const bestSource = sourceGroup.reduce((best, current) => {
        return (isHigherQualitySource(current, best)) ? current : best;
      }, sourceGroup[0]);
      
      bestRuleSources.push(bestSource);
    }
  });
  
  // Step 3: Sort sources
  // Sort rule sources by page number and heading
  bestRuleSources.sort((a, b) => {
    // First sort by page number if available
    if (a.pageNumber && b.pageNumber) {
      return a.pageNumber - b.pageNumber;
    }
    
    // If one has page number and other doesn't, prioritize the one with page number
    if (a.pageNumber && !b.pageNumber) return -1;
    if (!a.pageNumber && b.pageNumber) return 1;
    
    // Otherwise sort by heading
    return a.sourceHeading.localeCompare(b.sourceHeading);
  });
  
  // Sort card sources alphabetically by name
  const sortedCardSources = Array.from(uniqueCardSources.values())
    .sort((a, b) => a.cardName.localeCompare(b.cardName));
  
  // Step 4: Combine all sources - rules first, then cards, then others
  return [...bestRuleSources, ...sortedCardSources, ...otherSources];
}

// Helper to determine if a source has higher quality information
function isHigherQualitySource(newSource: RuleSource, existingSource: RuleSource): boolean {
  // If the new source has a page number and the existing one doesn't, prefer the new one
  if (newSource.pageNumber && !existingSource.pageNumber) {
    return true;
  }
  
  // If the new source has a more specific heading, prefer it
  if (newSource.sourceHeading && newSource.sourceHeading !== 'General Rules' && 
      existingSource.sourceHeading === 'General Rules') {
    return true;
  }
  
  // If the new source has a more detailed title, prefer it
  if (newSource.title && newSource.title.length > 5 && 
      (!existingSource.title || existingSource.title.length <= 5)) {
    return true;
  }
  
  return false;
}

// Helper to determine if a card source has higher quality information
function isHigherQualityCardSource(newSource: CardSource, existingSource: CardSource): boolean {
  // If the new source has an ID and the existing one doesn't, prefer the new one
  if (newSource.cardId && !existingSource.cardId) {
    return true;
  }
  
  // If the new source has a longer (more detailed) name, prefer it
  if (newSource.cardName && existingSource.cardName && 
      newSource.cardName.length > existingSource.cardName.length) {
    return true;
  }
  
  return false;
}

export function useGameRules(gameId: string): UseGameRulesReturn {
  // Get Supabase client via hook - this is safe here
  const { supabase } = useSupabase(); 

  // Query to fetch basic game info (e.g., game name). 
  // We might not need the full rules sections if only using vector search.
  // Consider creating a lighter fetch function if fetchGameRules loads too much.
  const rulesQuery = useQuery<GameRulesData, Error>({
    queryKey: ['gameBaseInfo', gameId], // Adjusted key if only loading base info
    queryFn: async () => { 
        // If fetchGameRules loads everything, extract just the game name?
        // Or create a new service function fetchGameBaseInfo(gameId)
        const rules = await fetchGameRules(gameId); 
        return { game: rules?.game || 'Unknown Game', rules }; // Return full rules for text search
    },
    enabled: !!gameId, 
    staleTime: Infinity, 
    gcTime: Infinity,    
  });

  // Mutation to ask question using hybrid search for context
  const askMutation = useMutation<string, Error, AskQuestionVariables>({
    mutationFn: async ({ question, chatHistory, skipFollowUpHandling }: AskQuestionVariables) => {
      // Ensure game name is available
      const gameName = rulesQuery.data?.game;
      if (!gameName) {
        throw new Error('Game information not loaded yet.'); 
      }

      // Get query classifications right at the beginning
      const queryTypes = classifyQuery(question);
      const isEnumerationQuestion = queryTypes.includes('ENUMERATION_QUESTION');
      const isCardEnumerationQuestion = 
        (isEnumerationQuestion || question.toLowerCase().match(/how many|different|types of|all|count/i) !== null) && 
        question.toLowerCase().match(/cards?|types?/i) !== null;
      
      // Preprocess the query with chat history for follow-up detection
      // Skip follow-up handling if skipFollowUpHandling is true
      const expandedQueries = skipFollowUpHandling
        ? expandQueryByType(question, queryTypes) // Use standard query expansion without follow-up handling
        : preprocessQuery(question, chatHistory);
        
      console.log(`[Hybrid Search] Using ${expandedQueries.length} query variations ${skipFollowUpHandling ? 'without' : 'including'} follow-up handling`);
      
      // Step 1: Perform vector search with all query variations
      console.log(`[Hybrid Search] Starting vector searches`);
      let allVectorResults: VectorSearchResult[] = [];
      
      // Execute searches
      for (const expandedQuery of expandedQueries) {
        console.log(`[Hybrid Search] Vector search for: "${expandedQuery}"`);
        const results = await fetchRelevantSectionsFromVectorDb(supabase, expandedQuery);
        console.log(`[Hybrid Search] Found ${results.length} results for variation`);
        allVectorResults = [...allVectorResults, ...results];
      }
      
      // Simple deduplication without using the name-based approach yet
      const vectorResults = allVectorResults.filter((result, index, self) => 
        index === self.findIndex(r => r.id === result.id)
      );
      
      // For complex questions, lower the deduplication strictness to gather more diverse context
      let dedupThreshold = queryTypes.some(type => 
        ['REASONING_QUESTION', 'COMPARISON_QUESTION', 'INTERACTION_QUESTION'].includes(type)
      ) ? 0.3 : 0.8;
      
      // Different deduplication strategies based on question type
      const isDedupByName = isCardEnumerationQuestion; // Use name-based dedup for card enumeration
      
      // Deduplicate vector results with adaptable strategy
      let allResults = [...vectorResults];
      
      // For complex questions or low result count, try adding broader context
      if ((queryTypes.some(type => 
        ['REASONING_QUESTION', 'COMPARISON_QUESTION', 'INTERACTION_QUESTION'].includes(type)
      ) && vectorResults.length < 5) || vectorResults.length < 2) {
        // Add broader search with multiple variations
        const broaderQueries = [];
        
        if (isEnumerationQuestion) {
          // Extract subject of enumeration for broader search
          const match = question.toLowerCase().match(/how many (.+?)(\s|are|\?|$)/i) || 
                       question.toLowerCase().match(/what are (?:all|the) (.+?)(\s|\?|$)/i);
          if (match && match[1]) {
            broaderQueries.push(`${match[1].trim()} types list all`);
          }
        } else if (queryTypes.some(type => 
          ['REASONING_QUESTION', 'COMPARISON_QUESTION', 'INTERACTION_QUESTION'].includes(type)
        )) {
          // Extract key terms for broader search
          const keyTerms = PromptService.extractKeyTerms(question);
          keyTerms.forEach(term => {
            broaderQueries.push(`${term} rules mechanics interactions`);
          });
        }
        
        // Perform additional searches with broader queries
        for (const broadQuery of broaderQueries) {
          const additionalSections = await fetchRelevantSectionsFromVectorDb(supabase, broadQuery);
          // Add to results with deduplication
          allResults.push(...additionalSections);
        }
      }
      
      // If initial search doesn't yield good results, refine the search
      if (allResults.length < 3 || 
          allResults.every(result => result.similarity < 0.55)) {
        console.log(`[Hybrid Search] Initial results insufficient, attempting refinement`);
        
        // 1. Try query reformulation
        const reformulatedQuery = PromptService.reformulateQuery(question);
        if (reformulatedQuery !== question) {
          console.log(`[Hybrid Search] Trying reformulated query: "${reformulatedQuery}"`);
          const refinedResults = await fetchRelevantSectionsFromVectorDb(supabase, reformulatedQuery);
          
          // Add to results set and deduplicate
          allResults = [...allResults, ...refinedResults];
          // ...deduplication code...
        }
        
        // 2. Try focused searches on key entities (especially for enumeration)
        if (isEnumerationQuestion) {
          const subject = PromptService.extractSubject(question);
          if (subject) {
            console.log(`[Hybrid Search] Running focused search on subject: "${subject}"`);
            const subjectResults = await fetchRelevantSectionsFromVectorDb(
              supabase, 
              `${subject} list all types complete`
            );
            
            // Add to results set with high priority
            allResults.unshift(...subjectResults);
            // ...deduplication code...
          }
        }
      }
      
      // Determine result limit based on question type
      const resultLimit = isCardEnumerationQuestion ? 15 : 
        (isEnumerationQuestion ? 12 : 8);
      
      // Sort by similarity and take top results with dynamic limit
      const finalResults = allResults
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, resultLimit);
      
      // Log combined results for debugging
      console.log(`[Hybrid Search] Final combined results: ${finalResults.length}`);
      finalResults.forEach((result, i) => {
        const source = result.id.toString().startsWith('text') ? 'text search' : 'vector search';
        console.log(`Result #${i+1}: similarity=${result.similarity.toFixed(2)}, source=${source}`);
        console.log(`Content preview: ${result.content.substring(0, 100).replace(/\n/g, ' ')}...`);
      });

      // Follow-up recovery mechanism:
      // If we have poor results (few or low similarity) and detected a likely follow-up question,
      // try searching using the most recent entities from the conversation as context
      if (!skipFollowUpHandling &&
          (finalResults.length < 2 || finalResults.every(result => result.similarity < 0.45)) && 
          chatHistory && chatHistory.length >= 2 && 
          detectFollowUp(question)) {
          
        console.log('[Follow-up Recovery] Detected potential follow-up with poor results, attempting recovery');
        
        // Get entities from recent conversation history
        const entities = extractEntitiesFromHistory(chatHistory);
        
        if (entities.length > 0) {
          // Sort entities by recency and salience
          const sortedEntities = rankEntitiesByRelevance(entities, question);
          
          // Take the top 2 entities and use them for recovery search
          const recoveryTerms = sortedEntities.slice(0, 2).map(e => e.text);
          
          console.log(`[Follow-up Recovery] Using terms: ${recoveryTerms.join(', ')}`);
          
          // Run a recovery search with these terms and the original question
          const recoveryQueries = recoveryTerms.map(term => 
            `${question} ${term}`
          );
          
          // Perform recovery searches
          const recoveryResults: VectorSearchResult[] = [];
          for (const recoveryQuery of recoveryQueries) {
            console.log(`[Follow-up Recovery] Trying recovery query: "${recoveryQuery}"`);
            const results = await fetchRelevantSectionsFromVectorDb(supabase, recoveryQuery);
            recoveryResults.push(...results);
          }
          
          // Add recovery results to final results if they're better
          if (recoveryResults.length > 0) {
            const uniqueRecoveryResults = recoveryResults.filter(
              recovery => !finalResults.some(final => final.id === recovery.id)
            );
            
            // If we have new good results, add them
            const goodRecoveryResults = uniqueRecoveryResults
              .filter(result => result.similarity > 0.5)
              .sort((a, b) => b.similarity - a.similarity)
              .slice(0, 3);
            
            if (goodRecoveryResults.length > 0) {
              console.log(`[Follow-up Recovery] Found ${goodRecoveryResults.length} additional relevant sections`);
              finalResults.push(...goodRecoveryResults);
              
              // Re-sort by similarity
              finalResults.sort((a, b) => b.similarity - a.similarity);
            }
          }
        }
      }

      if (finalResults.length > 0) {
        // Use combined results to build prompt, only include chat history if not skipping follow-up handling
        const prompt = PromptService.buildPrompt({
          gameName,
          question,
          sections: finalResults,
          chatHistory: skipFollowUpHandling ? undefined : chatHistory
        });
        const response = await getLLMCompletion({ prompt }); 
        
        // Create a response object with sources metadata
        const sourcesData = convertToMessageSources(finalResults);
        const enhancedResponse = Object.assign(String(response), { sources: sourcesData });
        
        return enhancedResponse;
      } else {
        // Fallback if no results found
        return getFallbackResponse(question); 
      }
    },
  });

  // Function to get the static fallback response
  const getFallbackResponse = (question: string): string => {
    const gameSpecificResponses = gameResponses[gameId] || gameResponses.default;
    const normalizedQuery = question.toLowerCase();
    
    for (const [keyword, response] of Object.entries(gameSpecificResponses)) {
      if (keyword !== 'default' && normalizedQuery.includes(keyword)) {
        return response;
      }
    }
    
    // Override default response with our custom message
    return "I'm not able to answer your question.";
  };

  return {
    rulesQuery,     
    askMutation,    
    getFallbackResponse 
  };
}





 