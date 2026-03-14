import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types';

interface AuthContextType {
  user: Profile | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,
  signIn: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const fetchingRef = useRef(false);

  useEffect(() => {
    // Use onAuthStateChange as the single source of truth.
    // INITIAL_SESSION fires on mount with the current session (replaces getSession).
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);

      if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsLoading(false);
        return;
      }

      // Fetch profile on initial load and sign-in, skip token refreshes
      if ((event === 'INITIAL_SESSION' || event === 'SIGNED_IN') && session?.user) {
        if (!fetchingRef.current) {
          fetchProfile(session.user.id);
        }
      } else if (!session) {
        // No session at all
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string, retries = 3): Promise<void> {
    fetchingRef.current = true;
    for (let i = 0; i < retries; i++) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) throw error;
        setUser(data);
        setIsLoading(false);
        fetchingRef.current = false;
        return;
      } catch (err) {
        console.error(`fetchProfile attempt ${i + 1} failed:`, err);
        if (i < retries - 1) {
          await new Promise((r) => setTimeout(r, 1000));
        }
      }
    }
    // All retries exhausted — sign out to clear the stale session
    // so the user doesn't get stuck in a broken state
    console.error('Profile fetch failed after all retries, signing out');
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsLoading(false);
    fetchingRef.current = false;
  }

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    // Verify user has admin role before allowing dashboard access
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      await supabase.auth.signOut();
      throw new Error('Access denied. This account does not have admin privileges.');
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isAuthenticated: !!user && !!session,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
