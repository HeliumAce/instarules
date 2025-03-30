import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const isInitialMount = useRef(true);
  const lastExpiresAt = useRef<number | null>(null);
  const initialPathRef = useRef<string>(location.pathname);

  // Handle initial session check
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session) {
          lastExpiresAt.current = session.expires_at;
          // Only redirect to dashboard if we're on the auth page
          if (location.pathname === '/auth') {
            navigate('/dashboard');
          }
        } else if (location.pathname !== '/auth') {
          // If no session and not on auth page, redirect to auth
          navigate('/auth');
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setLoading(false);
        isInitialMount.current = false;
      }
    };

    initializeAuth();
  }, []);

  // Handle auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Always update the session and user state
        setSession(session);
        setUser(session?.user ?? null);
        
        // Skip navigation logic during initial mount
        if (isInitialMount.current) return;

        // Check if this is a real session change
        const isRealSessionChange = session?.expires_at !== lastExpiresAt.current;
        
        if (event === 'SIGNED_IN' && isRealSessionChange) {
          lastExpiresAt.current = session?.expires_at ?? null;
          toast({
            title: "Welcome back!",
            description: "You have successfully signed in.",
          });
          navigate('/dashboard');
        } else if (event === 'SIGNED_OUT') {
          lastExpiresAt.current = null;
          toast({
            title: "Signed out",
            description: "You have been signed out successfully.",
          });
          navigate('/auth');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
      
      toast({
        title: "Account created!",
        description: "Please check your email to confirm your account.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred during sign up.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Sign in failed",
        description: error.message || "Check your email and password.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Error signing out",
        description: error.message || "An error occurred during sign out.",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Don't render children until we've checked for an existing session
  if (loading) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
