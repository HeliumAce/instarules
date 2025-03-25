import { useState } from 'react';
import LLMService from '@/services/LLMService';
import RulesService from '@/services/RulesService';

export function useGameRules(gameId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  console.log('useGameRules initialized with gameId:', gameId);
  
  const askQuestion = async (question: string): Promise<string> => {
    console.log('askQuestion called with:', question);
    setLoading(true);
    setError(null);
    
    try {
      // Load game rules
      console.log('Loading rules for game:', gameId);
      const rules = await RulesService.loadRules(gameId);
      
      if (!rules || !rules.sections) {
        console.error('Invalid rules format or missing sections');
        return "I'm sorry, but I couldn't load the rules for this game. Please try again later.";
      }
      
      // Find relevant sections
      console.log('Finding relevant sections for query:', question);
      const relevantSections = RulesService.findRelevantSections(rules, question);
      console.log('Found relevant sections:', relevantSections.length, 
                  'Titles:', relevantSections.map(s => s.title));
      
      if (relevantSections.length === 0) {
        console.log('No relevant sections found');
        return "I couldn't find specific information about that in the game rules. Could you rephrase your question or ask about a different aspect of the game?";
      }
      
      // Build prompt with relevant sections
      console.log('Building prompt');
      const prompt = buildPrompt(rules.game, question, relevantSections);
      console.log('Prompt built, length:', prompt.length);
      
      // Get response from LLM
      console.log('Calling LLMService.getCompletion');
      const response = await LLMService.getCompletion(prompt);
      console.log('Received response from LLM:', response ? 'Yes (length: ' + response.length + ')' : 'No');
      
      return response;
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