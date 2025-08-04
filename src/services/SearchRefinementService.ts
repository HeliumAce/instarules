import { SupabaseClient } from '@supabase/supabase-js';
import { VectorSearchResult } from '@/types/search';
import { fetchRelevantSectionsFromVectorDb } from '@/services/RulesService';
import { PromptService } from '@/services/PromptService';

export interface SearchRefinementOptions {
  question: string;
  queryTypes: string[];
  isEnumerationQuestion: boolean;
  currentResults: VectorSearchResult[];
}

export class SearchRefinementService {
  /**
   * Adds broader context searches for complex questions or when initial results are insufficient.
   */
  static async addBroaderContext(
    supabase: SupabaseClient,
    options: SearchRefinementOptions
  ): Promise<VectorSearchResult[]> {
    const { question, queryTypes, isEnumerationQuestion, currentResults } = options;
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
    const updatedResults = [...currentResults];
    for (const broadQuery of broaderQueries) {
      const additionalSections = await fetchRelevantSectionsFromVectorDb(supabase, broadQuery);
      // Add to results with deduplication
      updatedResults.push(...additionalSections);
    }
    
    return updatedResults;
  }

  /**
   * Refines search results when initial results are insufficient.
   */
  static async refineSearchResults(
    supabase: SupabaseClient,
    options: SearchRefinementOptions
  ): Promise<VectorSearchResult[]> {
    const { question, queryTypes, isEnumerationQuestion, currentResults } = options;
    let allResults = [...currentResults];
    
    // 1. Try query reformulation
    const reformulatedQuery = PromptService.reformulateQuery(question);
    if (reformulatedQuery !== question) {
      console.log(`[Hybrid Search] Trying reformulated query: "${reformulatedQuery}"`);
      const refinedResults = await fetchRelevantSectionsFromVectorDb(supabase, reformulatedQuery);
      
      // Add to results set and deduplicate
      allResults = [...allResults, ...refinedResults];
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
      }
    }
    
    return allResults;
  }

  /**
   * Determines if search results are insufficient and need refinement.
   */
  static needsRefinement(results: VectorSearchResult[]): boolean {
    return results.length < 3 || results.every(result => result.similarity < 0.55);
  }

  /**
   * Determines if broader context is needed based on question complexity and result count.
   */
  static needsBroaderContext(
    queryTypes: string[],
    vectorResults: VectorSearchResult[]
  ): boolean {
    return (queryTypes.some(type => 
      ['REASONING_QUESTION', 'COMPARISON_QUESTION', 'INTERACTION_QUESTION'].includes(type)
    ) && vectorResults.length < 5) || vectorResults.length < 2;
  }
} 