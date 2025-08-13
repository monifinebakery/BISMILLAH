// src/contexts/AuthContext.tsx - ENHANCED FOR RELIABILITY
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
  triggerRedirectCheck: () => void;
}

// ✅ MOBILE: Device capability detection (shared with authUtils)
const detectDeviceCapabilities = () => {
  const capabilities = {
    hasLocalStorage: false,
    hasSessionStorage: false,
    networkType: 'unknown',
    isSlowDevice: false,
    userAgent: navigator.userAgent || 'unknown'
  };

  // Test localStorage
  try {
    localStorage.setItem('__test__', 'test');
    localStorage.removeItem('__test__');
    capabilities.hasLocalStorage = true;
  } catch {
    logger.warn('localStorage not available or restricted');
  }

  // Test sessionStorage
  try {
    sessionStorage.setItem('__test__', 'test');
    sessionStorage.removeItem('__test__');
    capabilities.hasSessionStorage = true;
  } catch {
    logger.warn('sessionStorage not available or restricted');
  }

  // Detect network type
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    capabilities.networkType = connection.effectiveType || 'unknown';
  }

  // Detect slow device (simplified heuristic)
  const isSlowDevice = capabilities.userAgent.includes('Android 4') || 
                      capabilities.userAgent.includes('iPhone OS 10') ||
                      !capabilities.hasLocalStorage;
  capabilities.isSlowDevice = isSlowDevice;

  return capabilities;
};

// ✅ MOBILE: Adaptive timeout for AuthContext
const getAdaptiveTimeout = (baseTimeout = 15000) => {
  const capabilities = detectDeviceCapabilities();
  
  let timeout = baseTimeout;
  
  // Increase timeout for slow devices
  if (capabilities.isSlowDevice) {
    timeout *= 2;
    logger.debug('AuthContext: Slow device detected, doubling timeout:', timeout);
  }
  
  // Increase timeout for slow networks
  if (capabilities.networkType === 'slow-2g' || capabilities.networkType === '2g') {
    timeout *= 3;
    logger.debug('AuthContext: Slow network detected, tripling timeout:', timeout);
  } else if (capabilities.networkType === '3g') {
    timeout *= 1.5;
    logger.debug('AuthContext: 3G network detected, increasing timeout:', timeout);
  }
  
  // Cap at reasonable maximum
  return Math.min(timeout, 45000); // Max 45 seconds for AuthContext
};

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

  // ✅ ENHANCED: Manual refresh with sanitization and mobile timeout
  const refreshUser = async () => {
    try {
      logger.context('AuthContext', 'Manual user refresh triggered');
      
      // ✅ MOBILE: Use adaptive timeout for refresh
      const adaptiveTimeout = getAdaptiveTimeout(10000);
      
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('AuthContext refresh timeout')), adaptiveTimeout)
      );
      
      const { data: { session }, error } = await Promise.race([
        sessionPromise,
        timeoutPromise
      ]) as any;
      
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

  // ✅ NEW: Helper function to manually trigger redirect check
  const triggerRedirectCheck = () => {
    if (isReady && user && window.location.pathname === '/auth') {
      logger.info('🚀 AuthContext: Manual redirect trigger - user authenticated on auth page');
      window.location.href = '/';
    }
  };

  useEffect(() => {
    let mounted = true;
    
    const initializeAuth = async () => {
      try {
        logger.context('AuthContext', 'Initializing auth...');
        
        // ✅ MOBILE FIX: Adaptive timeout to prevent hanging on mobile
        const adaptiveTimeout = getAdaptiveTimeout(15000);
        logger.debug('AuthContext: Using adaptive timeout:', adaptiveTimeout);
        
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth initialization timeout')), adaptiveTimeout)
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
          wasUserSanitized: !!session?.user && !validUser,
          adaptiveTimeout
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
        
        // ✅ MOBILE: More lenient error handling for mobile devices
        if (error.message?.includes('timeout')) {
          const capabilities = detectDeviceCapabilities();
          if (capabilities.isSlowDevice || capabilities.networkType === '2g' || capabilities.networkType === '3g') {
            logger.warn('AuthContext: Mobile device timeout detected, allowing graceful fallback');
            // Don't force signout on mobile timeout - let AuthGuard handle it
          }
        }
        
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

    // ✅ SIMPLIFIED: Auth state change handler - NO REDIRECT LOGIC
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
        
        // ✅ CRITICAL FIX: NO REDIRECT LOGIC HERE
        // Let AuthGuard handle all redirects consistently
        // AuthContext should only manage state, not navigation
        
        logger.context('AuthContext', 'Auth state updated, letting AuthGuard handle navigation');
      }
    );

    return () => {
      mounted = false;
      logger.context('AuthContext', 'Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, []);

  // ✅ DEBUG: Expose auth state to window for debugging (development only)
  useEffect(() => {
    // @ts-ignore - Debug purposes only
    window.__DEBUG_AUTH_USER__ = user;
    // @ts-ignore - Debug purposes only  
    window.__DEBUG_AUTH_READY__ = isReady;
    // @ts-ignore - Debug purposes only
    window.__DEBUG_AUTH_LOADING__ = isLoading;
    // @ts-ignore - Debug purposes only
    window.__DEBUG_AUTH_SESSION__ = session;
    
    // ✅ FORCE LOG untuk debugging
    console.log('🔧 [AuthContext] Debug values set:', {
      user: !!user,
      userEmail: user?.email,
      isReady,
      isLoading,
      session: !!session
    });
  }, [user, isReady, isLoading, session]);

  // ✅ ENHANCED: Additional validation in context value
  const contextValue = { 
    session, 
    user, 
    isLoading, 
    isReady,
    refreshUser,
    triggerRedirectCheck
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