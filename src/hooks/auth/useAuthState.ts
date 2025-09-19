// src/hooks/auth/useAuthState.ts - Basic Auth State Management
import { useState, useCallback, useRef, useMemo } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';

export const useAuthState = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const lastUserIdRef = useRef<string | null>(null);

  // ✅ FIX: Use refs to track current values without triggering effects
  const sessionRef = useRef(session);
  const userRef = useRef(user);

  const updateSession = useCallback((newSession: Session | null) => {
    sessionRef.current = newSession;
    setSession(newSession);
  }, []);

  const updateUser = useCallback((newUser: User | null) => {
    userRef.current = newUser;
    setUser(newUser);
  }, []);

  const updateLoadingState = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  const updateReadyState = useCallback((ready: boolean) => {
    setIsReady(ready);
  }, []);

  // Memoized current values for external access
  const currentValues = useMemo(() => ({
    session: sessionRef.current,
    user: userRef.current,
  }), [session, user]);

  const resetAuthState = useCallback(() => {
    logger.debug('Resetting auth state');
    updateSession(null);
    updateUser(null);
    updateLoadingState(true);
    updateReadyState(false);
    lastUserIdRef.current = null;
  }, [updateSession, updateUser, updateLoadingState, updateReadyState]);

  return {
    // State values
    session,
    user,
    isLoading,
    isReady,
    
    // Refs for immediate access
    sessionRef,
    userRef,
    lastUserIdRef,
    
    // Current values helper
    currentValues,
    
    // Update methods
    updateSession,
    updateUser,
    updateLoadingState,
    updateReadyState,
    resetAuthState,
  };
};