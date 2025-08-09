// src/contexts/AuthContext.tsx - ENHANCED (Master Auth State)
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isReady: boolean; // ✅ NEW: Indicates auth is fully initialized
  refreshUser: () => Promise<void>; // ✅ NEW: Manual refresh function
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false); // ✅ NEW: Track when fully ready

  // ✅ NEW: Manual refresh function
  const refreshUser = async () => {
    try {
      logger.context('AuthContext', 'Manual user refresh triggered');
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        logger.error('AuthContext refresh error:', error);
        return;
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      
      logger.context('AuthContext', 'Manual refresh completed:', {
        hasSession: !!session,
        userEmail: session?.user?.email || 'none'
      });
    } catch (error) {
      logger.error('AuthContext refresh failed:', error);
    }
  };

  useEffect(() => {
    let mounted = true; // ✅ Prevent state updates if unmounted
    
    // ✅ Get initial session with timeout
    const initializeAuth = async () => {
      try {
        logger.context('AuthContext', 'Initializing auth...');
        
        // Add timeout to prevent hanging
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth initialization timeout')), 5000)
        );
        
        const { data: { session } } = await Promise.race([
          sessionPromise, 
          timeoutPromise
        ]) as any;
        
        if (!mounted) return;
        
        logger.context('AuthContext', 'Initial session loaded:', {
          hasSession: !!session,
          userEmail: session?.user?.email || 'none'
        });
        
        setSession(session);
        setUser(session?.user ?? null);
        
      } catch (error) {
        logger.error('AuthContext initialization failed:', error);
        if (mounted) {
          setSession(null);
          setUser(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
          setIsReady(true); // ✅ Mark as ready
          logger.context('AuthContext', 'Auth initialization completed');
        }
      }
    };

    initializeAuth();

    // ✅ Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        logger.context('AuthContext', `Auth state changed: ${event}`, {
          hasSession: !!session,
          userEmail: session?.user?.email || 'none',
          event,
          currentPath: window.location.pathname
        });
        
        setSession(session);
        setUser(session?.user ?? null);
        
        // ✅ Handle redirects centrally in AuthContext
        if (event === 'SIGNED_IN' && session?.user) {
          if (window.location.pathname === '/auth') {
            logger.info('AuthContext: Redirecting to dashboard after sign in');
            setTimeout(() => {
              window.location.href = '/';
            }, 1000);
          }
        } else if (event === 'SIGNED_OUT') {
          if (window.location.pathname !== '/auth') {
            logger.info('AuthContext: Redirecting to auth after sign out');
            window.location.href = '/auth';
          }
        }
      }
    );

    return () => {
      mounted = false;
      logger.context('AuthContext', 'Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, []);

  const value = { 
    session, 
    user, 
    isLoading, 
    isReady, // ✅ NEW
    refreshUser // ✅ NEW
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};