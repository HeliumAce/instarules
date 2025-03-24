
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGameContext } from '@/context/GameContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { games, toggleFavorite } = useGameContext();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 600);
    
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-accent border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 md:px-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-white">Game Rules Assistant</h1>
        <p className="mb-8 text-gray-400">
          Select a game to get instant answers about rules and gameplay
        </p>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((game) => (
            <div
              key={game.id}
              className="group relative overflow-hidden rounded-xl bg-card transition-all hover-scale border-glow"
              onClick={() => navigate(`/games/${game.id}`)}
            >
              <div className="relative aspect-[3/2] overflow-hidden">
                <img
                  src={game.coverImage}
                  alt={game.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(game.id);
                  }}
                  className={cn(
                    "absolute right-3 top-3 rounded-full bg-black/40 p-2 backdrop-blur-sm transition-all",
                    game.isFavorite ? "text-yellow-400" : "text-white/70 hover:text-white"
                  )}
                >
                  <Star size={16} fill={game.isFavorite ? "currentColor" : "none"} />
                </button>
              </div>
              <div className="p-4">
                <h3 className="mb-1 text-lg font-medium text-white">{game.title}</h3>
                <p className="text-sm text-gray-400">{game.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
