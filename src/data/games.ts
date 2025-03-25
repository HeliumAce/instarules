import { Game } from '@/types/game';

export const gameData: Game[] = [
  {
    id: "arcs",
    title: "Arcs",
    description: "Lead a spacefaring society through an epic saga of survival and power at the galaxy's edge.",
    isFavorite: false
  },
  {
    id: "radlands",
    title: "Radlands",
    description: "A post-apocalyptic dueling card game where you protect your camps and destroy your opponent's.",
    isFavorite: false
  },
  {
    id: "bohnanza",
    title: "Bohnanza",
    description: "Plant, trade, and harvest beans in this unique card game where hand order matters.",
    isFavorite: false
  },
  {
    id: "modern-art",
    title: "Modern Art",
    description: "Become an art dealer, auction paintings, and manipulate the art market to make the most money.",
    isFavorite: false
  },
  {
    id: "catan",
    title: "Catan",
    description: "Trade, build and settle the island of Catan in this award-winning strategy game.",
    coverImage: "https://images.unsplash.com/photo-1606503153255-59d8b2e4739e?q=80&w=800&h=500&auto=format&fit=crop",
    isFavorite: false
  },
  {
    id: "ticket-to-ride",
    title: "Ticket to Ride",
    description: "Cross the North American continent by train while collecting and playing matching cards.",
    coverImage: "https://images.unsplash.com/photo-1627392213351-4b2d2c44baa4?q=80&w=800&h=500&auto=format&fit=crop",
    isFavorite: false
  },
  {
    id: "pandemic",
    title: "Pandemic",
    description: "Work together as a team to treat infections around the world while gathering resources for cures.",
    coverImage: "https://images.unsplash.com/photo-1593634804965-0394d844680c?q=80&w=800&h=500&auto=format&fit=crop",
    isFavorite: false
  },
  {
    id: "wingspan",
    title: "Wingspan",
    description: "A competitive bird-collection, engine-building game for 1-5 players.",
    coverImage: "https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?q=80&w=800&h=500&auto=format&fit=crop",
    isFavorite: false
  },
  {
    id: "scythe",
    title: "Scythe",
    description: "An engine-building, asymmetric, competitive game set in an alternate post-WWI period.",
    coverImage: "https://images.unsplash.com/photo-1551269901-5c5e14c25df7?q=80&w=800&h=500&auto=format&fit=crop",
    isFavorite: false
  },
  {
    id: "terraforming-mars",
    title: "Terraforming Mars",
    description: "Compete with rival CEOs to make Mars habitable and build your corporate empire.",
    coverImage: "https://images.unsplash.com/photo-1545156521-77bd85671d30?q=80&w=800&h=500&auto=format&fit=crop",
    isFavorite: false
  },
  {
    id: "gloomhaven",
    title: "Gloomhaven",
    description: "A cooperative game of tactical combat in a persistent, evolving fantasy campaign world.",
    coverImage: "https://images.unsplash.com/photo-1518736114810-f0d758375f92?q=80&w=800&h=500&auto=format&fit=crop",
    isFavorite: false
  },
  {
    id: "azul",
    title: "Azul",
    description: "Draft colorful tiles to decorate the walls of the Royal Palace of Evora.",
    coverImage: "https://images.unsplash.com/photo-1567225557594-88d73e55f2cb?q=80&w=800&h=500&auto=format&fit=crop",
    isFavorite: false
  }
];

// Sample AI responses for game-specific queries
export const gameResponses: Record<string, Record<string, string>> = {
  "catan": {
    "setup": "To set up Catan, first randomly arrange the 19 terrain hexes. Place the number tokens on each hex in alphabetical order. Each player chooses a color and takes the corresponding settlements, cities, and roads. Players place 2 settlements and 2 roads during setup according to specific rules. Place the robber on the desert hex.",
    "resources": "There are 5 resources in Catan: brick (from hills), grain (from fields), lumber (from forests), ore (from mountains), and wool (from pastures).",
    "win": "The first player to reach 10 victory points on their turn wins the game. Points are earned by building settlements (1 point each), cities (2 points each), having the longest road (2 points), having the largest army (2 points), or victory point development cards.",
    "default": "I can answer questions about Catan rules, including setup, resources, building, trading, and winning conditions. What would you like to know?"
  },
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
