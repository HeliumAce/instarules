
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Game } from '@/types/game';
import { gameData } from '@/data/games';

interface GameContextType {
  games: Game[];
  favoriteGames: Game[];
  toggleFavorite: (gameId: string) => void;
  getGameById: (gameId: string) => Game | undefined;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const useGameContext = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGameContext must be used within a GameProvider');
  }
  return context;
};

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [games, setGames] = useState<Game[]>(gameData);
  const [favoriteGames, setFavoriteGames] = useState<Game[]>([]);

  // Load favorites from localStorage on initial render
  useEffect(() => {
    const storedFavorites = localStorage.getItem('favoriteGames');
    if (storedFavorites) {
      const favoriteIds = JSON.parse(storedFavorites) as string[];
      const favGames = games.filter(game => favoriteIds.includes(game.id));
      setFavoriteGames(favGames);
      
      // Update the games array with favorite status
      setGames(prevGames => 
        prevGames.map(game => ({
          ...game,
          isFavorite: favoriteIds.includes(game.id)
        }))
      );
    }
  }, []);

  const toggleFavorite = (gameId: string) => {
    // Update games
    setGames(prevGames => 
      prevGames.map(game => 
        game.id === gameId 
          ? { ...game, isFavorite: !game.isFavorite } 
          : game
      )
    );
    
    // Update favoriteGames
    const game = games.find(g => g.id === gameId);
    if (!game) return;
    
    if (game.isFavorite) {
      // Remove from favorites
      setFavoriteGames(prev => prev.filter(g => g.id !== gameId));
      
      // Update localStorage
      const favoriteIds = favoriteGames.filter(g => g.id !== gameId).map(g => g.id);
      localStorage.setItem('favoriteGames', JSON.stringify(favoriteIds));
    } else {
      // Add to favorites
      setFavoriteGames(prev => [...prev, { ...game, isFavorite: true }]);
      
      // Update localStorage
      const favoriteIds = [...favoriteGames.map(g => g.id), gameId];
      localStorage.setItem('favoriteGames', JSON.stringify(favoriteIds));
    }
  };

  const getGameById = (gameId: string) => {
    return games.find(game => game.id === gameId);
  };

  return (
    <GameContext.Provider value={{ games, favoriteGames, toggleFavorite, getGameById }}>
      {children}
    </GameContext.Provider>
  );
};
