
import { useNavigate, useParams } from 'react-router-dom';
import { Star, Home, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGameContext } from '@/context/GameContext';
import {
  Sidebar,
  SidebarContent,
  SidebarTrigger,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';

const AppSidebar = () => {
  const navigate = useNavigate();
  const { gameId } = useParams();
  const { games, favoriteGames, toggleFavorite } = useGameContext();

  const handleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    toggleFavorite(id);
  };

  return (
    <Sidebar className="border-r border-border">
      <SidebarHeader className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-white">Instarules</span>
          </div>
          <SidebarTrigger />
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                className={cn(
                  "transition-all flex items-center gap-3 rounded-md px-3 py-2 hover:bg-muted",
                  !gameId && "bg-accent bg-opacity-10"
                )}
              >
                <button onClick={() => navigate('/')}>
                  <Home size={18} />
                  <span>Dashboard</span>
                </button>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {favoriteGames.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>
              <div className="flex items-center gap-2">
                <Star size={16} className="text-yellow-400" />
                <span>Favorites</span>
              </div>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {favoriteGames.map((game) => (
                  <SidebarMenuItem key={game.id}>
                    <SidebarMenuButton
                      asChild
                      className={cn(
                        "flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted",
                        gameId === game.id && "bg-accent bg-opacity-10"
                      )}
                    >
                      <button onClick={() => navigate(`/games/${game.id}`)}>
                        <span className="flex-1 truncate text-left">{game.title}</span>
                        <button
                          onClick={(e) => handleFavorite(e, game.id)}
                          className="ml-2 text-yellow-400 hover:text-yellow-500"
                        >
                          <Star size={16} fill="currentColor" />
                        </button>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupLabel>All Games</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {games.map((game) => (
                <SidebarMenuItem key={game.id}>
                  <SidebarMenuButton
                    asChild
                    className={cn(
                      "flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted",
                      gameId === game.id && "bg-accent bg-opacity-10"
                    )}
                  >
                    <button onClick={() => navigate(`/games/${game.id}`)}>
                      <span className="flex-1 truncate text-left">{game.title}</span>
                      <button
                        onClick={(e) => handleFavorite(e, game.id)}
                        className={cn(
                          "ml-2",
                          game.isFavorite ? "text-yellow-400" : "text-gray-400 hover:text-gray-300"
                        )}
                      >
                        <Star
                          size={16}
                          fill={game.isFavorite ? "currentColor" : "none"}
                        />
                      </button>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default AppSidebar;
