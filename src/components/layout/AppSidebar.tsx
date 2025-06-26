import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Star, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGameContext } from '@/context/GameContext';
import UserMenu from '@/components/UserMenu';
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
  SidebarFooter,
} from '@/components/ui/sidebar';

const AppSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { games, toggleFavorite } = useGameContext();
  const { state } = useSidebar();
  
  // Separate games into favorites and non-favorites
  const favoriteGames = games.filter(game => game.isFavorite);
  const nonFavoriteGames = games.filter(game => !game.isFavorite);

  const isCollapsed = state === "collapsed";

  // Helper function to check if a game is currently selected
  const isGameSelected = (gameId: string) => {
    return location.pathname === `/games/${gameId}` || 
           location.pathname === `/games/${gameId}/chat`;
  };

  return (
    <Sidebar className="border-r border-border">
      <SidebarHeader className="border-b border-border">
        <div className={cn(
          "flex items-center justify-between",
          isCollapsed ? "p-2" : "px-4 py-3"
        )}>
          <div className={cn("flex items-center gap-2", isCollapsed && "hidden")}>
            <span className="text-lg font-semibold text-white">Instarules</span>
          </div>
          <SidebarTrigger 
            className={cn(
              "p-2 rounded-md hover:bg-muted transition-colors",
              isCollapsed && "w-full flex items-center justify-center"
            )} 
          />
        </div>
      </SidebarHeader>
      <SidebarContent className={cn("px-2", isCollapsed && "hidden")}>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                className={cn(
                  "transition-all flex items-center gap-3 rounded-md px-3 py-2 hover:bg-muted",
                  location.pathname === '/dashboard' && "bg-accent text-accent-foreground"
                )}
                tooltip="Dashboard"
                onClick={() => navigate('/dashboard')}
                isActive={location.pathname === '/dashboard'}
              >
                <Home size={18} />
                <span>Dashboard</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {favoriteGames.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>
              Favorites
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {favoriteGames.map((game) => (
                  <SidebarMenuItem key={game.id}>
                    <SidebarMenuButton
                      isActive={isGameSelected(game.id)}
                      className={cn(
                        "transition-all",
                        isGameSelected(game.id) && "bg-accent text-accent-foreground"
                      )}
                      onClick={() => navigate(`/games/${game.id}`)}
                      tooltip={game.title}
                    >
                      <span className="flex-1 truncate text-left">{game.title}</span>
                      <span
                        role="button"
                        aria-label={game.isFavorite ? "Remove from favorites" : "Add to favorites"}
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(game.id);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.stopPropagation();
                            toggleFavorite(game.id);
                          }
                        }}
                        className={cn(
                          "ml-2 p-1 rounded-md focus:outline-hidden focus:ring-2 focus:ring-ring",
                          game.isFavorite ? "text-yellow-400" : "text-gray-400 hover:text-yellow-400"
                        )}
                      >
                        <Star
                          size={16}
                          fill={game.isFavorite ? "currentColor" : "none"}
                        />
                      </span>
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
              {nonFavoriteGames.map((game) => (
                <SidebarMenuItem key={game.id}>
                  <SidebarMenuButton
                    isActive={isGameSelected(game.id)}
                    className={cn(
                      "transition-all",
                      isGameSelected(game.id) && "bg-accent text-accent-foreground"
                    )}
                    onClick={() => navigate(`/games/${game.id}`)}
                    tooltip={game.title}
                  >
                    <span className="flex-1 truncate text-left">{game.title}</span>
                    <span
                      role="button"
                      aria-label={game.isFavorite ? "Remove from favorites" : "Add to favorites"}
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(game.id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.stopPropagation();
                          toggleFavorite(game.id);
                        }
                      }}
                      className={cn(
                        "ml-2 p-1 rounded-md focus:outline-hidden focus:ring-2 focus:ring-ring",
                        game.isFavorite ? "text-yellow-400" : "text-gray-400 hover:text-yellow-400"
                      )}
                    >
                      <Star
                        size={16}
                        fill={game.isFavorite ? "currentColor" : "none"}
                      />
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className={cn("mt-auto border-t border-border p-2", isCollapsed && "hidden")}>
        <UserMenu />
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
