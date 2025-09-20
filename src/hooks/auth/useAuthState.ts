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
    // ✅ ANTI-FLICKER: Only update if session actually changed
    if (sessionRef.current?.access_token !== newSession?.access_token) {
      sessionRef.current = newSession;
      setSession(newSession);
    }
  }, []);

  const updateUser = useCallback((newUser: User | null) => {
    // ✅ ANTI-FLICKER: Only update if user actually changed
    if (userRef.current?.id !== newUser?.id) {
      userRef.current = newUser;
      setUser(newUser);
    }
  }, []);

  // ✅ FIX: Atomic auth state update to prevent race conditions
  const updateAuthState = useCallback((newSession: Session | null, newUser: User | null) => {
    let changed = false;
    
    // Check if session changed
    if (sessionRef.current?.access_token !== newSession?.access_token) {
      sessionRef.current = newSession;
      changed = true;
    }
    
    // Check if user changed 
    if (userRef.current?.id !== newUser?.id) {
      userRef.current = newUser;
      changed = true;
    }
    
    // Atomic state update if anything changed
    if (changed) {
      setSession(sessionRef.current);
      setUser(userRef.current);
    }
  }, []);

  const updateLoadingState = useCallback((loading: boolean) => {
    // ✅ ANTI-FLICKER: Only update if loading state actually changed
    setIsLoading(current => current !== loading ? loading : current);
  }, []);

  const updateReadyState = useCallback((ready: boolean) => {
    // ✅ ANTI-FLICKER: Only update if ready state actually changed
    setIsReady(current => current !== ready ? ready : current);
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
    updateAuthState, // ✅ NEW: Atomic update method
    updateLoadingState,
    updateReadyState,
    resetAuthState,
  };
};