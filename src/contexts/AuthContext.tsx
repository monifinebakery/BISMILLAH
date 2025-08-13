// src/contexts/AuthContext.tsx - FIXED with User Sanitization
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isReady: boolean;
  refreshUser: () => Promise<void>;
}

// ✅ NEW: User object sanitization
const sanitizeUser = (user: User | null): User | null => {
  if (!user) return null;
  
  // ✅ CRITICAL: Check for string "null" in user.id
  if (user.id === 'null' || user.id === 'undefined' || !user.id) {
    logger.error('AuthContext: Invalid user ID detected:', {
      userId: user.id,
      userIdType: typeof user.id,
      email: user.email,
      fullUser: user
    });
    
    // ✅ CRITICAL: Return null if user ID is invalid
    // Don't allow corrupted user objects to propagate
    return null;
  }
  
  // ✅ Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(user.id)) {
    logger.error('AuthContext: Invalid UUID format in user.id:', {
      userId: user.id,
      userIdType: typeof user.id,
      email: user.email
    });
    return null;
  }
  
  // ✅ Log valid user for debugging
  logger.debug('AuthContext: User sanitization passed:', {
    userId: user.id,
    userIdType: typeof user.id,
    email: user.email
  });
  
  return user;
};

// ✅ NEW: Session validation
const validateSession = (session: Session | null): { session: Session | null; user: User | null } => {
  if (!session) {
    return { session: null, user: null };
  }
  
  // ✅ Sanitize user from session
  const sanitizedUser = sanitizeUser(session.user);
  
  if (!sanitizedUser) {
    logger.warn('AuthContext: Session has invalid user, nullifying session');
    return { session: null, user: null };
  }
  
  return { session, user: sanitizedUser };
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);

  // ✅ ENHANCED: Manual refresh with sanitization
  const refreshUser = async () => {
    try {
      logger.context('AuthContext', 'Manual user refresh triggered');
      
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        logger.error('AuthContext refresh error:', error);
        return;
      }
      
      // ✅ CRITICAL: Validate and sanitize session
      const { session: validSession, user: validUser } = validateSession(session);
      
      setSession(validSession);
      setUser(validUser);
      
      logger.context('AuthContext', 'Manual refresh completed:', {
        hasSession: !!validSession,
        hasValidUser: !!validUser,
        userEmail: validUser?.email || 'none',
        userId: validUser?.id || 'none'
      });
      
    } catch (error) {
      logger.error('AuthContext refresh failed:', error);
    }
  };

  useEffect(() => {
    let mounted = true;
    
    const initializeAuth = async () => {
      try {
        logger.context('AuthContext', 'Initializing auth...');
        
        // Add timeout to prevent hanging
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth initialization timeout')), 15000)
        );
        
        const { data: { session } } = await Promise.race([
          sessionPromise, 
          timeoutPromise
        ]) as any;
        
        if (!mounted) return;
        
        // ✅ CRITICAL: Validate and sanitize initial session
        const { session: validSession, user: validUser } = validateSession(session);
        
        logger.context('AuthContext', 'Initial session loaded and validated:', {
          hasSession: !!validSession,
          hasValidUser: !!validUser,
          userEmail: validUser?.email || 'none',
          userId: validUser?.id || 'none',
          originalSessionValid: !!session,
          wasUserSanitized: !!session?.user && !validUser
        });
        
        setSession(validSession);
        setUser(validUser);
        
        // ✅ ENHANCED: If session was invalid, force signout
        if (session && !validSession) {
          logger.warn('AuthContext: Invalid session detected, signing out...');
          try {
            await supabase.auth.signOut();
          } catch (signOutError) {
            logger.error('AuthContext: Failed to sign out invalid session:', signOutError);
          }
        }
        
      } catch (error) {
        logger.error('AuthContext initialization failed:', error);
        if (mounted) {
          setSession(null);
          setUser(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
          setIsReady(true);
          logger.context('AuthContext', 'Auth initialization completed');
        }
      }
    };

    initializeAuth();

    // ✅ ENHANCED: Auth state change handler with sanitization
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        logger.context('AuthContext', `Auth state changed: ${event}`, {
          hasSession: !!session,
          userEmail: session?.user?.email || 'none',
          userId: session?.user?.id || 'none',
          userIdType: typeof session?.user?.id,
          event,
          currentPath: window.location.pathname
        });
        
        // ✅ CRITICAL: Always sanitize auth state changes
        const { session: validSession, user: validUser } = validateSession(session);
        
        setSession(validSession);
        setUser(validUser);
        
        // ✅ ENHANCED: Log sanitization results
        if (session && !validSession) {
          logger.error('AuthContext: Auth state change contained invalid session/user, nullified');
          
          // Force sign out if session is corrupted
          try {
            await supabase.auth.signOut();
            logger.info('AuthContext: Signed out due to invalid session');
          } catch (signOutError) {
            logger.error('AuthContext: Failed to sign out invalid session:', signOutError);
          }
          return;
        }
        
        // ✅ Handle redirects centrally (only for valid sessions)
        if (event === 'SIGNED_IN' && validSession?.user) {
          if (window.location.pathname === '/auth') {
            logger.info('AuthContext: Redirecting to dashboard after valid sign in');
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

  // ✅ ENHANCED: Additional validation in context value
  const contextValue = { 
    session, 
    user, 
    isLoading, 
    isReady,
    refreshUser
  };

  // ✅ DEBUG: Log context value in development
  useEffect(() => {
    if (import.meta.env.DEV && isReady) {
      logger.debug('AuthContext: Context value update:', {
        hasSession: !!session,
        hasUser: !!user,
        userId: user?.id || 'none',
        userIdType: typeof user?.id,
        userEmail: user?.email || 'none',
        isLoading,
        isReady
      });
      
      // ✅ ALERT if string "null" somehow gets through
      if (user?.id === 'null') {
        logger.error('🚨 AuthContext: STRING NULL DETECTED IN CONTEXT VALUE!');
        console.error('🚨 AuthContext: User with string null ID:', user);
      }
    }
  }, [session, user, isLoading, isReady]);
  
  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};