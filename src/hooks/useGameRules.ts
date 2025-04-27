import { useQuery, useMutation, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import { getLLMCompletion } from '@/services/LLMService';
import { fetchGameRules, fetchRelevantSectionsFromVectorDb, findRelevantSections } from '@/services/RulesService';
import { preprocessQuery, classifyQuery } from '@/services/QueryPreprocessorService';
import { gameResponses } from '@/data/games';
import { useSupabase } from '@/context/SupabaseContext';

// Define the structure for the data returned by the rules query
interface GameRulesData {
  game: string;
  rules: any;
  // We might not need sections loaded by default anymore if using vector search only
  // sections: any[]; 
}

// Define the structure for vector search results (matches the service function)
interface VectorSearchResult {
  id: string;
  content: string;
  metadata: Record<string, any>;
  similarity: number;
}

// Define the structure for the variables passed to the mutation
interface AskQuestionVariables {
  question: string;
  chatHistory?: { content: string; isUser: boolean }[];
}

// Define the structure for the returned value of the hook
interface UseGameRulesReturn {
  rulesQuery: UseQueryResult<GameRulesData, Error>;
  askMutation: UseMutationResult<string, Error, AskQuestionVariables, unknown>;
  getFallbackResponse: (question: string) => string;
}

// Define the isSimilarContent function early in the file, outside the hooks

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

const buildPrompt = (
  gameName: string, 
  question: string, 
  sections: VectorSearchResult[],
  chatHistory?: { content: string; isUser: boolean }[]
): string => {
  // Format the context from vector search results
  const context = sections
    .map(section => {
      // Attempt to create a title from metadata, fallback if needed
      const title = section.metadata?.heading_path?.join(' > ') || section.metadata?.card || 'Relevant Section';
      return `## ${title}\n${section.content}`;
    })
    .join('\n\n');
  
  // Calculate average similarity to help the LLM understand context quality
  const avgSimilarity = sections.reduce((sum, section) => sum + section.similarity, 0) / sections.length;
  const contextQualityNote = avgSimilarity < 0.6 
    ? "\n\nNOTE: The provided information may have low relevance to the question. Be cautious in your response."
    : "";
  
  // Format chat history if provided
  let chatHistoryText = '';
  if (chatHistory && chatHistory.length > 0) {
    // Take the most recent 4 messages for context
    const recentMessages = chatHistory.slice(-4);
    chatHistoryText = `\n\n## Previous Conversation\n${recentMessages.map(msg => 
      `${msg.isUser ? 'User' : 'Assistant'}: ${msg.content}`
    ).join('\n')}`;
  }
    
  // Detect question complexity to customize instructions
  const queryTypes = classifyQuery(question);
  const isEnumeration = queryTypes.includes('ENUMERATION_QUESTION');
  const isComparison = queryTypes.includes('COMPARISON_QUESTION');
  const isInteraction = queryTypes.includes('INTERACTION_QUESTION');
  const isReasoning = queryTypes.includes('REASONING_QUESTION');
  
  // Customize instructions based on question type
  let specializedInstructions = '';
  
  if (isEnumeration) {
    // Check if it's specifically a card/type enumeration question
    if (question.toLowerCase().match(/how many|different|types of|all|count/i) !== null && 
        question.toLowerCase().match(/cards?|types?/i) !== null) {
      
      specializedInstructions = `
**For Card and Type Enumeration Questions:**
1. When counting "different" items, count by UNIQUE NAMES, not by ID numbers.
2. List ONLY the names of the items, nothing more, unless specifically asked for details.
3. For "how many" questions, provide the number after listing the items.
4. Format as a simple bulleted list of names with minimal description.
5. Example format:
   "There are X different [item type]:
   - Item 1
   - Item 2"
`;
    } else {
      // Use regular enumeration instructions
      specializedInstructions = `
**For Enumeration Questions:**
1. List only the requested items with minimal description.
2. Include only what was specifically asked for.
3. Format as a simple bulleted list.
4. End with the total count if that was requested.
`;
    }
  } else if (isComparison) {
    specializedInstructions = `
**For Comparison Questions:**
1. Identify the characteristics of BOTH items being compared.
2. Create a structured comparison addressing similarities first, then differences.
3. When relevant, explain the strategic implications or use cases for each.
4. Ensure your comparison covers all aspects: mechanics, timing, interactions with other rules.
`;
  } else if (isInteraction) {
    specializedInstructions = `
**For Interaction Questions:**
1. Identify the full rules text for EACH element in the interaction.
2. Determine the sequence of events or timing involved.
3. Explain how the rules for each component apply in the specific scenario.
4. If there are edge cases or exceptions, address them clearly.
`;
  } else if (isReasoning) {
    specializedInstructions = `
**For Complex Reasoning Questions:**
1. Break down the scenario into its component parts.
2. Identify all relevant rules that apply to each component.
3. Apply the rules in the correct sequence, explaining the outcome at each step.
4. For "why" questions, explain the game design reasoning if apparent from the rules.
5. For hypothetical scenarios, clearly state if certain outcomes depend on specific conditions.
`;
  }
  
  // Add specific handling for "how much/many" questions
  if (question.toLowerCase().match(/^how (much|many)/i)) {
    specializedInstructions += `
**For "How Much/Many" Questions:**
1. Provide a direct, quantitative answer.
2. If a simple number or amount is the answer, state ONLY that with minimal context.
3. Do not explain game mechanics or provide additional context unless essential.
4. Example format: "[Item] does/has/is [amount/number]."
`;
  }
  
  // Calculate information completeness rating to help LLM understand context quality
  // Basic version - could be made more sophisticated
  const contextCompleteness = calculateContextCompleteness(question, sections);
  const completenessNote = contextCompleteness < 0.7 
    ? "\n\nNOTE: The provided information may be incomplete for this question. Be explicit about what aspects can be confidently answered based on available information."
    : "";
  
  // Add a conciseness instruction at the top of the prompt
  const conciseInstruction = `
**IMPORTANT:**
Answer the question completely with all directly relevant information, but exclude tangential details not specifically requested.
`;

  return `
You are a helpful assistant for the board game "${gameName}".

${chatHistory?.length ? 'This is a follow-up to a previous conversation.' : ''}
The user asked: "${question}"

${conciseInstruction}

${chatHistory?.length ? chatHistoryText : ''}

Here is the relevant information:${contextQualityNote}${completenessNote}

${context}

**Your Role:** You are an expert assistant for board games. Your goal is to provide accurate, complete, and focused answers about ${gameName}.

**CRITICAL: NEVER INVENT OR HALLUCINATE INFORMATION. If information is truly missing and cannot be reasonably deduced from the provided content, state that it isn't provided.**

${specializedInstructions}

**Reasoning and Problem-Solving Approach:**

1. **Systematic Analysis:** First identify ALL relevant rules and information pieces from the provided context that directly answer the question.
   
2. **Connect Related Concepts:** Consider how these rules interact with each other and form logical connections.
   
3. **Step-by-Step Reasoning:** When appropriate, use step-by-step reasoning to reach conclusions:
   - For counting questions, list all instances found and then count them
   - For rules interactions, explain how different rules work together
   - For complex scenarios, break down into component parts

4. **Logical Deduction:** Make reasonable deductions based on rule combinations. Be confident in conclusions that logically follow from the rules, even if not explicitly stated.

5. **Enumerate When Appropriate:** For questions about quantities or lists, explicitly enumerate all relevant items before drawing conclusions.

${chatHistory?.length ? '6. **Consider Conversation Context:** If this is a follow-up question, use the previous conversation to understand what the user is asking about. The user may be referring to concepts or questions from earlier in the conversation without explicitly restating them.' : ''}

**Original Instructions (Still Apply):**

1. **Evaluate Information Completeness:** Before answering, determine if the provided information contains a clear answer to the question, either explicit or through logical deduction.

2. **Answer Directly:** Get straight to the answer without mentioning sources or where information comes from.

3. **Answer Succinctly:** Answer the question as succinctly as possible. Do not attempt to answer related questions.

4. **Prioritize Official Information:** If information from errata or FAQs is included, prioritize that over other information.

**Handling Uncertain or Missing Information:**

5. **For Partial Information:** If you only have part of what's needed, clearly state what you know and what you don't:
   "[Direct answer for what is known]. This doesn't specifically address [what's missing]."

6. **For Tangential Information:** If your information is related but doesn't directly answer:
   "While not explicitly stated, I can determine that [reasoned answer] because [explanation of reasoning]."

7. **For No Relevant Information:** Only if no relevant information is available AND no reasonable deduction can be made:
   "The available information doesn't provide sufficient basis to answer [question], even through deduction."

8. **Confidence Indicator:** End your response with:
   "Confidence: [Level]" where Level is:
   - High: Information explicitly answers OR clear logical deduction is possible
   - Medium: Information addresses the question but requires interpretation or inference
   - Low: Limited information or significant parts of the answer require substantial reasoning

9. **Formatting:**
    * Use bullet points for lists or step-by-step processes.
    * **Bold** key game terms, card names, or action names.

10. **Exclusions:**
    * Do NOT include phrases like "Based on the information..." or refer to any sources.
    * Do NOT refer to page numbers or document names.
    * Never apologize for lack of information.

Remember that the user is in the middle of a game and needs clear, direct answers, but accuracy is more important than completeness.
`;
};

// Helper function to estimate context completeness
function calculateContextCompleteness(question: string, sections: VectorSearchResult[]): number {
  // Simplified version - evaluate based on presence of key terms and similarity scores
  const keyTerms = extractKeyTerms(question);
  
  // Calculate how many key terms are found in the sections
  const termCoverage = keyTerms.map(term => {
    const termPresent = sections.some(section => 
      section.content.toLowerCase().includes(term.toLowerCase())
    );
    return termPresent ? 1 : 0;
  });
  
  // Calculate average term coverage and similarity
  const termCoverageScore = termCoverage.reduce((sum, val) => sum + val, 0) / Math.max(keyTerms.length, 1);
  const similarityScore = sections.length > 0 
    ? sections.reduce((sum, section) => sum + section.similarity, 0) / sections.length 
    : 0;
  
  // Weight and combine scores
  return (termCoverageScore * 0.7) + (similarityScore * 0.3);
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
    mutationFn: async ({ question, chatHistory }: AskQuestionVariables) => {
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
      
      // Preprocess the query
      const expandedQueries = preprocessQuery(question);
      console.log(`[Hybrid Search] Using ${expandedQueries.length} query variations`);
      
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
      const allResults = [...vectorResults];
      
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
          const keyTerms = extractKeyTerms(question);
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
        const reformulatedQuery = reformulateQuery(question);
        if (reformulatedQuery !== question) {
          console.log(`[Hybrid Search] Trying reformulated query: "${reformulatedQuery}"`);
          const refinedResults = await fetchRelevantSectionsFromVectorDb(supabase, reformulatedQuery);
          
          // Add to results set and deduplicate
          allResults = [...allResults, ...refinedResults];
          // ...deduplication code...
        }
        
        // 2. Try focused searches on key entities (especially for enumeration)
        if (isEnumerationQuestion) {
          const subject = extractSubject(question);
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

      if (finalResults.length > 0) {
        // Use combined results to build prompt, now including chat history
        const prompt = buildPrompt(gameName, question, finalResults, chatHistory);
        const response = await getLLMCompletion({ prompt }); 
        return response;
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

// Helper function to extract key terms from a question
function extractKeyTerms(question: string): string[] {
  const lowerQuestion = question.toLowerCase();
  const stopWords = ['a', 'an', 'the', 'in', 'on', 'at', 'for', 'to', 'with', 'by', 'about', 
                     'how', 'what', 'why', 'when', 'where', 'who', 'which', 'is', 'are', 'do', 
                     'does', 'can', 'could', 'would', 'should', 'if'];
  
  // Split by common separators and clean up
  const tokens = lowerQuestion
    .replace(/[?.!,;:()]/g, ' ')
    .split(' ')
    .map(t => t.trim())
    .filter(t => t.length > 2 && !stopWords.includes(t));
  
  // Identify key noun phrases and entities
  const keyTerms = new Set<string>();
  
  // Simple bigram detection (could be improved with NLP)
  for (let i = 0; i < tokens.length - 1; i++) {
    const bigram = `${tokens[i]} ${tokens[i+1]}`;
    keyTerms.add(bigram);
  }
  
  // Add important single tokens
  tokens.forEach(token => keyTerms.add(token));
  
  return Array.from(keyTerms);
}

// Helper to reformulate queries that might not get good vector matches
function reformulateQuery(query: string): string {
  const lowerQuery = query.toLowerCase();
  
  // Try to make enumeration queries more search-friendly
  if (lowerQuery.match(/how many|what are all|list all/i)) {
    // Extract the subject of enumeration
    const match = lowerQuery.match(/how many (.+?)(\s|are|\?|$)/i) || 
                  lowerQuery.match(/what are (?:all|the) (.+?)(\s|\?|$)/i) ||
                  lowerQuery.match(/list (?:all|the) (.+?)(\s|\?|$)/i);
    
    if (match && match[1]) {
      const subject = match[1].trim();
      return `${subject} complete list all types`;
    }
  }
  
  // Try to make interaction queries more search-friendly
  if (lowerQuery.includes(' and ') || lowerQuery.includes(' with ')) {
    return query.replace(/ and | with /gi, ' interaction ') + ' rules interaction how works';
  }
  
  // Default fallback
  return query;
}

// Extract the subject of an enumeration question
function extractSubject(query: string): string | null {
  const matches = query.toLowerCase().match(/how many (.+?)(\s|are|\?|$)/i) || 
                 query.toLowerCase().match(/what are (?:all|the) (.+?)(\s|\?|$)/i) ||
                 query.toLowerCase().match(/list (?:all|the) (.+?)(\s|\?|$)/i);
  
  return matches && matches[1] ? matches[1].trim() : null;
} 