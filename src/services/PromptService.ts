/**
 * PromptService
 * 
 * Centralized service for building prompts for game rule queries.
 * Extracted from useGameRules.ts to improve maintainability and testability.
 */

import { VectorSearchResult } from '@/types/search';
import { QueryProcessingService } from '@/services/query';

/**
 * Context object containing all inputs needed for prompt building
 */
export interface PromptContext {
  gameName: string;
  question: string;
  sections?: VectorSearchResult[];
  rawContext?: string;
  chatHistory?: { content: string; isUser: boolean }[];
}

/**
 * Service object containing all prompt building logic and helper functions
 */
export const PromptService = {
  /**
   * Builds a complete prompt for the LLM based on the provided context
   */
  buildPrompt: (context: PromptContext): string => {
    const { gameName, question, sections, rawContext, chatHistory } = context;

    let contextText: string;
    let contextQualityNote = '';

    if (rawContext) {
      // Full-context mode: use the raw rulebook content directly
      contextText = rawContext;
    } else if (sections && sections.length > 0) {
      // Vector search mode: format retrieved sections
      contextText = sections
        .map(section => {
          const title = section.metadata?.heading_path?.join(' > ') || section.metadata?.card || 'Relevant Section';
          return `## ${title}\n${section.content}`;
        })
        .join('\n\n');

      const avgSimilarity = sections.reduce((sum, section) => sum + section.similarity, 0) / sections.length;
      contextQualityNote = avgSimilarity < 0.6
        ? "\n\nNOTE: The provided information may have low relevance to the question. Be cautious in your response."
        : "";
    } else {
      contextText = 'No relevant information found.';
    }
    
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
    const queryTypes = QueryProcessingService.classifyQuery(question);
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
5. "Any" does not include "zero" or "none".
`;
    }
    
    // Calculate information completeness rating (skip for raw context — full rulebook is always complete)
    let completenessNote = '';
    if (!rawContext && sections && sections.length > 0) {
      const contextCompleteness = PromptService.calculateContextCompleteness(question, sections);
      completenessNote = contextCompleteness < 0.7
        ? "\n\nNOTE: The provided information may be incomplete for this question. Be explicit about what aspects can be confidently answered based on available information."
        : "";
    }
    
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

${contextText}

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
  },

  /**
   * Calculates how complete the context is for answering the question
   */
  calculateContextCompleteness: (question: string, sections: VectorSearchResult[]): number => {
    // Simplified version - evaluate based on presence of key terms and similarity scores
    const keyTerms = PromptService.extractKeyTerms(question);
    
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
  },

  /**
   * Extracts key terms from a question for analysis
   */
  extractKeyTerms: (question: string): string[] => {
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
  },

  /**
   * Reformulates a query to improve search results
   */
  reformulateQuery: (query: string): string => {
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
  },

  /**
   * Extracts the main subject from a query
   */
  extractSubject: (query: string): string | null => {
    const matches = query.toLowerCase().match(/how many (.+?)(\s|are|\?|$)/i) || 
                   query.toLowerCase().match(/what are (?:all|the) (.+?)(\s|\?|$)/i) ||
                   query.toLowerCase().match(/list (?:all|the) (.+?)(\s|\?|$)/i);
    
    return matches && matches[1] ? matches[1].trim() : null;
  }
}; 