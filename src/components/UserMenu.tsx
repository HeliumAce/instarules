
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { LogOut, User } from 'lucide-react';

const UserMenu = () => {
  const { user, signOut, loading } = useAuth();

  // Calculate initials for all cases to avoid conditional execution
  const initials = user?.email ? user.email.substring(0, 2).toUpperCase() : 'U';

  if (loading) {
    return <div className="flex items-center justify-center w-full py-2"><Button variant="ghost" size="sm" disabled className="w-full">Loading...</Button></div>;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center w-full py-2">
        <Button variant="outline" size="sm" asChild className="w-full">
          <a href="/auth">Sign In</a>
        </Button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="w-full flex justify-start items-center gap-3 px-3 py-2 h-auto">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <span className="truncate">{user.email}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem disabled className="flex items-center gap-2">
          <User size={16} />
          <span>{user.email}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => signOut()} className="text-red-500 flex items-center gap-2">
          <LogOut size={16} />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
