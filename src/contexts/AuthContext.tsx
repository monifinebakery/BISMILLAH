// src/contexts/AuthContext.tsx - ENHANCED with Better Logger Integration

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User, AuthChangeEvent } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  // ✅ ADDED: Helper methods for better integration
  isAuthenticated: boolean;
  userEmail: string | null;
  userId: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    logger.info('AuthContext: Initializing authentication context');

    // ✅ Get initial session with enhanced error handling
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          logger.error('AuthContext: Error getting initial session:', error);
          setSession(null);
          setUser(null);
        } else {
          logger.success('AuthContext: Initial session check completed', {
            hasSession: !!session,
            userEmail: session?.user?.email || 'none',
            userId: session?.user?.id || 'none'
          });
          
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (error) {
        logger.error('AuthContext: Unexpected error during initialization:', error);
        setSession(null);
        setUser(null);
      } finally {
        setIsLoading(false);
        logger.debug('AuthContext: Loading state set to false');
      }
    };

    initializeAuth();

    // ✅ Listen for auth state changes with enhanced logging
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        logger.info('AuthContext: Auth state changed', {
          event,
          hasSession: !!session,
          userEmail: session?.user?.email || 'none',
          userId: session?.user?.id || 'none',
          timestamp: new Date().toISOString()
        });
        
        // ✅ Enhanced state updates based on event type
        switch (event) {
          case 'SIGNED_IN':
            logger.success('AuthContext: User signed in successfully');
            setSession(session);
            setUser(session?.user ?? null);
            setIsLoading(false);
            break;
            
          case 'SIGNED_OUT':
            logger.info('AuthContext: User signed out');
            setSession(null);
            setUser(null);
            setIsLoading(false);
            break;
            
          case 'TOKEN_REFRESHED':
            logger.debug('AuthContext: Token refreshed');
            setSession(session);
            setUser(session?.user ?? null);
            break;
            
          case 'USER_UPDATED':
            logger.debug('AuthContext: User data updated');
            setSession(session);
            setUser(session?.user ?? null);
            break;
            
          default:
            logger.debug('AuthContext: Other auth event', { event });
            setSession(session);
            setUser(session?.user ?? null);
            setIsLoading(false);
        }
      }
    );

    // ✅ Cleanup with proper logging
    return () => {
      logger.debug('AuthContext: Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, []);

  // ✅ ENHANCED: Computed values for better integration
  const value: AuthContextType = {
    session,
    user,
    isLoading,
    isAuthenticated: !!session?.user,
    userEmail: user?.email || null,
    userId: user?.id || null
  };

  // ✅ DEBUG: Log context value changes in development
  useEffect(() => {
    if (import.meta.env.DEV && !isLoading) {
      logger.debug('AuthContext: Context value updated', {
        isAuthenticated: value.isAuthenticated,
        userEmail: value.userEmail,
        userId: value.userId,
        hasSession: !!value.session
      });
    }
  }, [value.isAuthenticated, value.userEmail, value.userId, isLoading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ✅ ENHANCED: useAuth hook with better error handling
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    logger.error('useAuth: Hook called outside of AuthProvider');
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

// ✅ ADDED: Helper hooks for common patterns
export const useAuthUser = () => {
  const { user, isLoading, isAuthenticated } = useAuth();
  return { user, isLoading, isAuthenticated };
};

export const useAuthSession = () => {
  const { session, isLoading, isAuthenticated } = useAuth();
  return { session, isLoading, isAuthenticated };
};

// ✅ ADDED: Global auth state checker (useful for debugging)
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).checkAuthState = () => {
    logger.info('Manual auth state check requested');
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        logger.error('Manual auth check error:', error);
      } else {
        logger.success('Manual auth check result:', {
          hasSession: !!session,
          userEmail: session?.user?.email || 'none',
          expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'none'
        });
      }
    });
  };
}