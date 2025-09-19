// src/components/operational-costs/hooks/useOperationalCostAuth.ts

import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { OPERATIONAL_COST_QUERY_KEYS } from './useOperationalCostQuery';

interface UseOperationalCostAuthProps {
  onError?: (error: string) => void;
}

export const useOperationalCostAuth = ({
  onError
}: UseOperationalCostAuthProps = {}) => {
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const queryClient = useQueryClient();

  // Initialize authentication
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        logger.info('🔐 Initializing authentication');
        
        // Development bypass for authentication
        const isDevelopment = import.meta.env.MODE === 'development';
        const bypassAuth = isDevelopment && import.meta.env.VITE_DEV_BYPASS_AUTH === 'true';
        
        if (bypassAuth) {
          logger.info('🔓 Development bypass: Authentication bypassed');
          if (mounted) {
            setIsAuthenticated(true);
            setIsInitializing(false);
          }
          return;
        }
        
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          logger.error('🔐 Auth error:', error);
          if (mounted) {
            setIsAuthenticated(false);
            setIsInitializing(false);
            if (onError) {
              onError('Gagal memverifikasi autentikasi');
            }
          }
          return;
        }

        const isAuth = !!session?.user;
        logger.info('🔐 Auth state initialized:', { isAuthenticated: isAuth, userId: session?.user?.id });
        
        if (mounted) {
          setIsAuthenticated(isAuth);
          setIsInitializing(false);
        }
      } catch (error) {
        logger.error('🔐 Error initializing auth:', error);
        if (mounted) {
          setIsAuthenticated(false);
          setIsInitializing(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        const isAuth = !!session?.user;
        logger.info('🔐 Auth state changed:', { event, isAuthenticated: isAuth, userId: session?.user?.id });
        
        setIsAuthenticated(isAuth);
        
        if (event === 'SIGNED_OUT') {
          logger.info('🔐 User signed out, clearing queries');
          // Clear all queries when user signs out
          queryClient.clear();
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
      logger.debug('🔐 Auth listener cleaned up');
    };
  }, [queryClient, onError]);

  // Real-time subscription for app_settings changes
  useEffect(() => {
    if (!isAuthenticated) return;

    let mounted = true;
    logger.info('📡 Setting up real-time subscription for app_settings');

    const subscription = supabase
      .channel('app_settings_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'app_settings',
        },
        (payload) => {
          if (!mounted) return;
          
          logger.info('📡 App settings changed, invalidating related queries:', payload);
          
          // Invalidate all queries that depend on app settings (like production target)
          const invalidationPromises = [
            queryClient.invalidateQueries({ queryKey: ['app-settings'] }),
            queryClient.invalidateQueries({ queryKey: OPERATIONAL_COST_QUERY_KEYS.productionTarget() }),
            queryClient.invalidateQueries({ queryKey: ['operational-costs', 'overhead-calculation'] }),
            queryClient.invalidateQueries({ queryKey: ['recipe-overhead'] }),
            queryClient.invalidateQueries({ queryKey: ['enhanced-hpp'] }),
          ];
          
          Promise.all(invalidationPromises).then(() => {
            logger.success('✅ Real-time app settings update processed');
          });
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      subscription.unsubscribe();
      logger.debug('📡 App settings real-time subscription cleaned up');
    };
  }, [isAuthenticated, queryClient]);

  // Manual auth check
  const checkAuth = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        logger.error('🔐 Auth check error:', error);
        setIsAuthenticated(false);
        if (onError) {
          onError('Gagal memverifikasi autentikasi');
        }
        return false;
      }
      
      const isAuth = !!session?.user;
      setIsAuthenticated(isAuth);
      return isAuth;
    } catch (error) {
      logger.error('🔐 Error checking auth:', error);
      setIsAuthenticated(false);
      return false;
    }
  }, [onError]);

  // Sign out
  const signOut = useCallback(async () => {
    try {
      logger.info('🔐 Signing out user');
      await supabase.auth.signOut();
      setIsAuthenticated(false);
      queryClient.clear();
      logger.info('🔐 User signed out successfully');
    } catch (error) {
      logger.error('🔐 Error signing out:', error);
      if (onError) {
        onError('Gagal melakukan logout');
      }
    }
  }, [queryClient, onError]);

  // Refresh session
  const refreshSession = useCallback(async () => {
    try {
      logger.info('🔐 Refreshing session');
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        logger.error('🔐 Session refresh error:', error);
        setIsAuthenticated(false);
        if (onError) {
          onError('Sesi berakhir, silakan login kembali');
        }
        return false;
      }
      
      const isAuth = !!data.session?.user;
      setIsAuthenticated(isAuth);
      logger.info('🔐 Session refreshed successfully');
      return isAuth;
    } catch (error) {
      logger.error('🔐 Error refreshing session:', error);
      setIsAuthenticated(false);
      return false;
    }
  }, [onError]);

  return {
    // State
    isAuthenticated,
    isInitializing,
    
    // Actions
    checkAuth,
    signOut,
    refreshSession,
    
    // Helpers
    requireAuth: (action: string) => {
      if (!isAuthenticated) {
        logger.warn(`🔐 ${action} attempted without authentication`);
        if (onError) {
          onError('Silakan login terlebih dahulu');
        }
        return false;
      }
      return true;
    }
  };
};