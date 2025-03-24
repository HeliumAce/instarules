
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
  useSidebar,
} from '@/components/ui/sidebar';

const AppSidebar = () => {
  const navigate = useNavigate();
  const { gameId } = useParams();
  const { games, favoriteGames, toggleFavorite } = useGameContext();
  const { state } = useSidebar();

  const handleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    toggleFavorite(id);
  };

  return (
    <Sidebar className="border-r border-border">
      <SidebarHeader className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div className={cn("flex items-center gap-2", state === "collapsed" && "hidden")}>
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
                tooltip="Dashboard"
              >
                <button onClick={() => navigate('/')}>
                  <Home size={18} />
                  <span className={cn(state === "collapsed" && "hidden")}>Dashboard</span>
                </button>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {favoriteGames.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className={cn(state === "collapsed" && "opacity-0")}>
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
                      tooltip={game.title}
                    >
                      <button onClick={() => navigate(`/games/${game.id}`)}>
                        <span className={cn("flex-1 truncate text-left", state === "collapsed" && "hidden")}>{game.title}</span>
                        <button
                          onClick={(e) => handleFavorite(e, game.id)}
                          className={cn(
                            "ml-2 text-yellow-400 hover:text-yellow-500",
                            state === "collapsed" && "ml-0"
                          )}
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
          <SidebarGroupLabel className={cn(state === "collapsed" && "opacity-0")}>All Games</SidebarGroupLabel>
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
                    tooltip={game.title}
                  >
                    <button onClick={() => navigate(`/games/${game.id}`)}>
                      <span className={cn("flex-1 truncate text-left", state === "collapsed" && "hidden")}>{game.title}</span>
                      <button
                        onClick={(e) => handleFavorite(e, game.id)}
                        className={cn(
                          "ml-2",
                          game.isFavorite ? "text-yellow-400" : "text-gray-400 hover:text-gray-300",
                          state === "collapsed" && "ml-0"
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
