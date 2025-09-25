// src/hooks/auth/useAuthValidation.ts - Auth Session Refresh and Validation
import { useCallback } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { 
  getAdaptiveTimeout,
  safeWithTimeout
} from '@/contexts/auth/helpers';
import { validateSession } from '@/utils/auth/sessionValidation';
import { 
  validateAuthSession, 
  debugAuthState, 
  refreshSessionSafely 
} from '@/lib/authUtils';
import { getFreshSession } from '@/utils/auth/getFreshSession';

type GetSessionResult = Awaited<ReturnType<typeof supabase.auth.getSession>>;

interface UseAuthValidationProps {
  updateSession: (session: Session | null) => void;
  updateUser: (user: User | null) => void;
}

export const useAuthValidation = ({
  updateSession,
  updateUser,
}: UseAuthValidationProps) => {

  const refreshUser = useCallback(async () => {
    try {
      logger.context("AuthContext", "Manual user refresh triggered");
      
      // Get fresh session directly from Supabase as single source of truth
      const freshSession = await getFreshSession();
      
      if (!freshSession) {
        logger.warn("AuthContext: No session available from Supabase");
        
        // Try refresh as last resort
        const refreshedSession = await refreshSessionSafely();
        if (!refreshedSession) {
          logger.warn("AuthContext: Both getSession and refreshSession failed");
          updateSession(null);
          updateUser(null);
          return;
        }
        
        const { session: validSession, user: validUser } =
          validateSession(refreshedSession);
        updateSession(validSession);
        updateUser(validUser);
        return;
      }

      const { session: validSession, user: validUser } =
        validateSession(freshSession);
      updateSession(validSession);
      updateUser(validUser);

      logger.context("AuthContext", "Manual refresh completed", {
        hasSession: !!validSession,
        hasValidUser: !!validUser,
        userEmail: validUser?.email || "none",
        userId: validUser?.id || "none",
      });
    } catch (error) {
      logger.error("AuthContext refresh failed", error);
    }
  }, [updateSession, updateUser]);

  const validateSessionWrapper = useCallback(async () => {
    try {
      return await validateAuthSession();
    } catch (error) {
      logger.error("AuthContext: Error validating session", error);
      return false;
    }
  }, []);

  const debugAuthWrapper = useCallback(async () => {
    try {
      return await debugAuthState();
    } catch (error) {
      logger.error("AuthContext: Error debugging auth", error);
      return {
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }, []);

  return {
    refreshUser,
    validateSession: validateSessionWrapper,
    debugAuth: debugAuthWrapper,
  };
};