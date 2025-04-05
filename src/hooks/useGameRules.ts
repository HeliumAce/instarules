import { useState } from 'react';
import LLMService from '@/services/LLMService';
import RulesService from '@/services/RulesService';
import { gameResponses } from '@/data/games';

export function useGameRules(gameId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  console.log('useGameRules initialized with gameId:', gameId);
  
  const askQuestion = async (question: string): Promise<string> => {
    console.log('askQuestion called with:', question);
    setLoading(true);
    setError(null);
    
    try {
      // First try to load game rules
      try {
        const rules = await RulesService.loadRules(gameId);
        
        if (rules && rules.sections) {
          // Find relevant sections
          const relevantSections = RulesService.findRelevantSections(rules, question);
          
          if (relevantSections.length > 0) {
            // Build prompt with relevant sections
            const prompt = buildPrompt(rules.game, question, relevantSections);
            
            // Get response from LLM
            const response = await LLMService.getCompletion(prompt);
            if (response) return response;
          }
        }
      } catch (err) {
        console.warn('Failed to load rules from JSON, falling back to static responses:', err);
      }
      
      // Fall back to static responses if rules loading fails
      const gameSpecificResponses = gameResponses[gameId] || gameResponses.default;
      const normalizedQuery = question.toLowerCase();
      
      for (const [keyword, response] of Object.entries(gameSpecificResponses)) {
        if (keyword !== 'default' && normalizedQuery.includes(keyword)) {
          return response;
        }
      }
      
      return gameSpecificResponses.default;
      
    } catch (err: any) {
      const errorMsg = err.message || 'An error occurred';
      console.error('Error in askQuestion:', errorMsg, err);
      setError(errorMsg);
      return "I'm sorry, I couldn't find information about that in the game rules.";
    } finally {
      setLoading(false);
    }
  };
  
  const buildPrompt = (gameName: string, question: string, sections: any[]): string => {
    return `
You are a helpful assistant for the board game "${gameName}".

The user asked: "${question}"

Here are the relevant rules from the game rulebook:

${sections.map(section => {
  let content = `## ${section.title}\n${section.content}`;
  
  if (section.subsections && section.subsections.length > 0) {
    content += '\n\n' + section.subsections.map((sub: any) => 
      `### ${sub.title}\n${sub.content}`
    ).join('\n\n');
  }
  
  return content;
}).join('\n\n')}

**Your Role:** You are an expert rules assistant for the board game Arcs. Your goal is to provide accurate, concise answers based *only* on the provided text snippets.

**Instructions:**

1.  **Answer Directly:** Get straight to the answer using the provided context.
2.  **Answer Succintly:** Answer the question as succintly as possible. Do not attempt to answer related questions.
2.  **Prioritize Sources:** If context includes errata or official FAQ snippets, prioritize their information over rulebook snippets if they address the same point. State if errata overrides a rule.
3.  **Synthesize Information:** If multiple snippets are relevant, combine them into a coherent answer.
4.  **Handle Ambiguity/Conflict:** If the provided snippets are contradictory (and not resolved by errata/FAQ priority) or insufficient to fully answer the question, clearly state that the rules are unclear or the information isn't present in the provided context. Do not guess or infer rules.
5.  **Formatting:**
    * Use bullet points for lists or step-by-step processes.
    * **Bold** key game terms, card names, or action names mentioned in the rules.
6.  **Exclusions:**
    * Do NOT include preamble phrases like "Based on the rules..." or "The context states...". or any other preamble.
    * Do NOT refer to rulebook page numbers or document names unless quoting a specific named source like an FAQ.
    * Avoid unnecessary explanations or flavor text.

Remember that the user is in the middle of a game and needs clear, direct answers.
`;
  };
  
  return {
    askQuestion,
    loading,
    error
  };
} 