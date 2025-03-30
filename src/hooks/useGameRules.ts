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

IMPORTANT INSTRUCTIONS FOR YOUR RESPONSE:
1. Be extremely direct and concise - get straight to the answer
2. Do NOT include phrases like "To directly answer" or "Based on the rules provided"
3. Do NOT mention the rulebook or introduction - just state the facts
4. Use bullet points for clarity
5. Bold key terms
6. Avoid unnecessary explanations - users want quick, accurate information

Remember that the user is in the middle of a game and needs clear, direct answers.
`;
  };
  
  return {
    askQuestion,
    loading,
    error
  };
} 