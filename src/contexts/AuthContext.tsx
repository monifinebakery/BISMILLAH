// src/contexts/AuthContext.tsx - FIXED with Logger
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // ✅ Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      logger.context('AuthContext', 'Initial session check:', {
        hasSession: !!session,
        userEmail: session?.user?.email || 'none'
      });
      
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // ✅ Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      logger.context('AuthContext', `Auth state changed: ${event}`, {
        hasSession: !!session,
        userEmail: session?.user?.email || 'none',
        event
      });
      
      setSession(session);
      setUser(session?.user ?? null);
    });

    // Cleanup listener when component unmounts
    return () => {
      logger.context('AuthContext', 'Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, []);

  const value = { session, user, isLoading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};