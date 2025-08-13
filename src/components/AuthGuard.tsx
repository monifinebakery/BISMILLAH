// src/components/AuthGuard.tsx - FIXED NAVIGATION LOGIC
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Navigate, useLocation } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { cleanupAuthState, validateAuthSession } from '@/lib/authUtils';
import { logger } from '@/utils/logger';
import { useAuth } from '@/contexts/AuthContext'; // ✅ Use AuthContext

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  // ✅ SIMPLIFIED: Use AuthContext as primary source of truth
  const { user: contextUser, isLoading: contextLoading, isReady } = useAuth();
  
  // ✅ Local state only for validation and errors
  const [validatedUser, setValidatedUser] = useState<User | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const location = useLocation();

  // ✅ SIMPLIFIED: Validate user from AuthContext
  useEffect(() => {
    if (!isReady) return; // Wait for AuthContext to be ready
    
    const validateUser = async () => {
      setIsValidating(true);
      setValidationError(null);
      
      try {
        if (!contextUser) {
          logger.debug('AuthGuard: No user from AuthContext');
          setValidatedUser(null);
          setIsValidating(false);
          return;
        }

        logger.debug('AuthGuard: Validating user from AuthContext:', contextUser.email);
        
        // ✅ ADD: Timeout untuk validation (10 detik)
        const validatePromise = validateAuthSession();
        const validateTimeoutPromise = new Promise((resolve) => 
          setTimeout(() => resolve(false), 10000) // Return false if timeout
        );
        
        const isValid = await Promise.race([
          validatePromise, 
          validateTimeoutPromise
        ]) as boolean;
        
        if (isValid) {
          logger.debug('AuthGuard: User validation successful');
          setValidatedUser(contextUser);
          setValidationError(null);
        } else {
          logger.warn('AuthGuard: User validation failed or timeout');
          cleanupAuthState();
          setValidatedUser(null);
          setValidationError('Sesi tidak valid. Silakan login ulang.');
        }
        
      } catch (error) {
        logger.error('AuthGuard: User validation error:', error);
        cleanupAuthState();
        setValidatedUser(null);
        setValidationError('Terjadi kesalahan validasi. Silakan login ulang.');
      } finally {
        setIsValidating(false);
      }
    };

    validateUser();
  }, [contextUser, isReady]);

  // ✅ REMOVED: Duplicate onAuthStateChange listener
  // AuthContext already handles auth state changes
  // AuthGuard only needs to validate what AuthContext provides

  // ✅ SIMPLIFIED: Error handling
  if (validationError) {
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
                onClick={() => window.location.href = '/auth'}
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

  // ✅ SIMPLIFIED: Loading state
  if (contextLoading || !isReady || isValidating) {
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

  // ✅ CRITICAL FIX: Clear redirect logic
  if (!validatedUser && location.pathname !== '/auth') {
    logger.debug('AuthGuard: No validated user, redirecting to auth');
    return <Navigate to="/auth" replace />;
  }

  // ✅ SUCCESS: User is authenticated and validated
  if (validatedUser && location.pathname === '/auth') {
    logger.debug('AuthGuard: Validated user on auth page, redirecting to dashboard');
    return <Navigate to="/" replace />;
  }

  // ✅ Render children for authenticated users
  return <>{children}</>;
};

export default AuthGuard;