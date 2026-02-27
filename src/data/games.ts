import { Game, GameRetrievalConfig, RetrievalStrategy } from '@/types/game';

export const gameData: Game[] = [
  {
    id: "arcs",
    title: "Arcs",
    description: "Lead a spacefaring society through an epic saga of survival and power at the galaxy's edge.",
    isFavorite: false
  },
  {
    id: "brass-lancashire",
    title: "Brass Lancashire",
    description: "Build networks, develop industries, and navigate the world of the Industrial Revolution in Lancashire.",
    isFavorite: false
  },
  {
    id: "seti",
    title: "SETI",
    description: "Search for extraterrestrial intelligence, explore the cosmos, and make first contact.",
    isFavorite: false
  }
];

// Retrieval strategy config per game
// Games not listed here have no rules data and will use fallback responses
export const gameRetrievalConfig: Record<string, GameRetrievalConfig> = {
  'arcs': { strategy: 'vector-search', displayName: 'Arcs' },
  'brass-lancashire': { strategy: 'full-context', displayName: 'Brass Lancashire' },
  'seti': { strategy: 'full-context', displayName: 'SETI' },
};

export const getGameConfig = (gameId: string): { strategy: RetrievalStrategy | 'none'; displayName: string } => {
  return gameRetrievalConfig[gameId] ?? { strategy: 'none' as const, displayName: 'Unknown Game' };
};

// Sample AI responses for game-specific queries
export const gameResponses: Record<string, Record<string, string>> = {
  "default": {
    "default": "I can help answer questions about the rules for this game. What would you like to know?"
  }
};

export function getGameResponse(gameId: string, query: string): string {
  const gameSpecificResponses = gameResponses[gameId] || gameResponses.default;
  
  // Look for keywords in the query to find matching responses
  const normalizedQuery = query.toLowerCase();
  
  for (const [keyword, response] of Object.entries(gameSpecificResponses)) {
    if (keyword !== 'default' && normalizedQuery.includes(keyword)) {
      return response;
    }
  }
  
  // Return default response if no keyword matches
  return gameSpecificResponses.default;
}
