// src/components/AuthGuard.tsx - ENHANCED DEBUG LOGGING
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Navigate, useLocation } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { cleanupAuthState, validateAuthSession } from '@/lib/authUtils';
import { logger } from '@/utils/logger';
import { useAuth } from '@/contexts/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  // ✅ Use AuthContext as primary source of truth
  const { user: contextUser, isLoading: contextLoading, isReady } = useAuth();
  
  // ✅ Local state only for validation and errors
  const [validatedUser, setValidatedUser] = useState<User | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const location = useLocation();

  // ✅ ENHANCED DEBUG: Log all state changes
  useEffect(() => {
    logger.debug('🔍 AuthGuard State Update:', {
      currentPath: location.pathname,
      contextUser: !!contextUser,
      contextUserEmail: contextUser?.email || 'none',
      contextUserID: contextUser?.id || 'none',
      contextLoading,
      isReady,
      validatedUser: !!validatedUser,
      validationError,
      isValidating,
      timestamp: new Date().toISOString()
    });
  }, [contextUser, contextLoading, isReady, validatedUser, validationError, isValidating, location.pathname]);

  // ✅ SIMPLIFIED: Validate user from AuthContext
  useEffect(() => {
    if (!isReady) {
      logger.debug('🔍 AuthGuard: Waiting for AuthContext to be ready...');
      return;
    }
    
    const validateUser = async () => {
      setIsValidating(true);
      setValidationError(null);
      
      try {
        if (!contextUser) {
          logger.debug('🔍 AuthGuard: No user from AuthContext, setting validated user to null');
          setValidatedUser(null);
          setIsValidating(false);
          return;
        }

        logger.debug('🔍 AuthGuard: Validating user from AuthContext:', {
          email: contextUser.email,
          id: contextUser.id,
          currentPath: location.pathname
        });
        
        // ✅ Add timeout for validation (10 seconds)
        const validatePromise = validateAuthSession();
        const validateTimeoutPromise = new Promise((resolve) => 
          setTimeout(() => {
            logger.warn('🔍 AuthGuard: Validation timeout after 10 seconds');
            resolve(false);
          }, 10000)
        );
        
        const isValid = await Promise.race([
          validatePromise, 
          validateTimeoutPromise
        ]) as boolean;
        
        if (isValid) {
          logger.success('✅ AuthGuard: User validation successful, setting validated user');
          setValidatedUser(contextUser);
          setValidationError(null);
        } else {
          logger.warn('⚠️ AuthGuard: User validation failed or timeout');
          cleanupAuthState();
          setValidatedUser(null);
          setValidationError('Sesi tidak valid. Silakan login ulang.');
        }
        
      } catch (error) {
        logger.error('❌ AuthGuard: User validation error:', error);
        cleanupAuthState();
        setValidatedUser(null);
        setValidationError('Terjadi kesalahan validasi. Silakan login ulang.');
      } finally {
        setIsValidating(false);
      }
    };

    validateUser();
  }, [contextUser, isReady, location.pathname]);

  // ✅ ENHANCED DEBUG: Log navigation decisions
  useEffect(() => {
    if (!isReady || contextLoading || isValidating) return;
    
    logger.debug('🔍 AuthGuard: Navigation Decision Point:', {
      currentPath: location.pathname,
      hasValidatedUser: !!validatedUser,
      validatedUserEmail: validatedUser?.email || 'none',
      hasValidationError: !!validationError,
      shouldRedirectToAuth: !validatedUser && location.pathname !== '/auth',
      shouldRedirectToDashboard: validatedUser && location.pathname === '/auth'
    });

    // ✅ Log specific redirect scenarios
    if (!validatedUser && location.pathname !== '/auth') {
      logger.info('🚀 AuthGuard: Will redirect to /auth (no validated user)');
    } else if (validatedUser && location.pathname === '/auth') {
      logger.info('🚀 AuthGuard: Will redirect to / (user authenticated on auth page)');
    } else if (validatedUser && location.pathname !== '/auth') {
      logger.info('✅ AuthGuard: User authenticated, rendering protected content');
    }
  }, [validatedUser, validationError, isReady, contextLoading, isValidating, location.pathname]);

  // ✅ Error handling
  if (validationError) {
    logger.error('❌ AuthGuard: Showing error state:', validationError);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-red-200">
          <div className="p-6 text-center">
            <div className="mx-auto flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <span className="text-red-600 text-2xl">⚠️</span>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Masalah Autentikasi
            </h1>
            <p className="text-gray-600 mb-6">{validationError}</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  logger.info('🚀 AuthGuard: Manual redirect to /auth from error state');
                  window.location.href = '/auth';
                }}
                className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
              >
                Login Ulang
              </button>
              <button
                onClick={() => window.location.reload()}
                className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3 rounded-lg transition-colors"
              >
                Muat Ulang
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Loading state
  if (contextLoading || !isReady || isValidating) {
    logger.debug('🔄 AuthGuard: Showing loading state:', {
      contextLoading,
      isReady,
      isValidating
    });
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Memuat Autentikasi</h2>
          <p className="text-gray-500">
            {!isReady ? 'Memuat sistem...' : 
             isValidating ? 'Memvalidasi sesi...' : 
             'Sedang memverifikasi...'}
          </p>
        </div>
      </div>
    );
  }

  // ✅ CRITICAL: Navigation logic with enhanced debugging
  if (!validatedUser && location.pathname !== '/auth') {
    logger.info('🚀 AuthGuard: Executing redirect to /auth (no validated user)');
    return <Navigate to="/auth" replace />;
  }

  // ✅ SUCCESS: User is authenticated and on auth page, redirect to dashboard
  if (validatedUser && location.pathname === '/auth') {
    logger.info('🚀 AuthGuard: Executing redirect to / (authenticated user on auth page)');
    return <Navigate to="/" replace />;
  }

  // ✅ Render children for authenticated users
  logger.debug('✅ AuthGuard: Rendering protected content for authenticated user');
  return <>{children}</>;
};

export default AuthGuard;