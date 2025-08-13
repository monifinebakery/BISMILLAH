import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Navigate, useLocation } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { cleanupAuthState, validateAuthSession } from '@/lib/authUtils';
import { logger } from '@/utils/logger';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    let mounted = true;
    let retryCount = 0;
    const maxRetries = 3;

    const initAuth = async () => {
      try {
        logger.debug('AuthGuard: Initializing auth...');
        
        // ✅ ADD: Timeout untuk session check (15 detik)
        const sessionPromise = supabase.auth.getSession();
        const sessionTimeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session check timeout')), 15000)
        );
        
        const { data: { session }, error } = await Promise.race([
          sessionPromise, 
          sessionTimeoutPromise
        ]) as any;
        
        if (!mounted) return;

        if (error) {
          logger.error('AuthGuard: Session error:', error);
          
          // Retry on network errors or timeouts
          if (retryCount < maxRetries && (
            error.message?.includes('network') || 
            error.message?.includes('fetch') ||
            error.message?.includes('timeout')
          )) {
            retryCount++;
            logger.warn(`AuthGuard: Retrying... (${retryCount}/${maxRetries})`);
            // ✅ CHANGE: Longer retry delay (2, 4, 6 detik)
            setTimeout(() => initAuth(), 2000 * retryCount);
            return;
          }
          
          // Non-retryable error
          cleanupAuthState();
          setUser(null);
          setError('Gagal memuat sesi. Silakan login ulang.');
          setLoading(false);
          return;
        }

        if (!session) {
          logger.debug('AuthGuard: No session found');
          cleanupAuthState();
          setUser(null);
          setLoading(false);
          return;
        }

        // ✅ ADD: Timeout untuk validation (10 detik)
        logger.debug('AuthGuard: Validating session for user:', session.user.email);
        const validatePromise = validateAuthSession();
        const validateTimeoutPromise = new Promise((resolve) => 
          setTimeout(() => resolve(false), 10000) // Return false if timeout
        );
        
        const isValid = await Promise.race([
          validatePromise, 
          validateTimeoutPromise
        ]) as boolean;
        
        if (!mounted) return;
        
        if (isValid) {
          logger.debug('AuthGuard: Session valid, user authenticated');
          setUser(session.user);
          setError(null);
        } else {
          logger.warn('AuthGuard: Session invalid or validation timeout, cleaning up');
          cleanupAuthState();
          setUser(null);
          setError('Sesi tidak valid. Silakan login ulang.');
        }
        
      } catch (error) {
        logger.error('AuthGuard: Initialization error:', error);
        
        if (mounted) {
          // Retry on unexpected errors
          if (retryCount < maxRetries) {
            retryCount++;
            logger.warn(`AuthGuard: Retrying after error... (${retryCount}/${maxRetries})`);
            // ✅ CHANGE: Longer retry delay (2, 4, 6 detik)
            setTimeout(() => initAuth(), 2000 * retryCount);
            return;
          }
          
          cleanupAuthState();
          setUser(null);
          setError('Terjadi kesalahan. Silakan muat ulang halaman.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        logger.debug('AuthGuard: Auth state changed:', event, session?.user?.email);
        
        if (event === 'SIGNED_OUT' || !session) {
          logger.debug('AuthGuard: User signed out');
          setUser(null);
          setError(null);
        } else if (event === 'SIGNED_IN') {
          logger.debug('AuthGuard: User signed in');
          setUser(session.user);
          setError(null);
        } else if (event === 'TOKEN_REFRESHED') {
          logger.debug('AuthGuard: Token refreshed');
          
          // ✅ ADD: Timeout untuk token refresh validation (10 detik)
          try {
            const validatePromise = validateAuthSession();
            const validateTimeoutPromise = new Promise((resolve) => 
              setTimeout(() => resolve(false), 10000)
            );
            
            const isValid = await Promise.race([
              validatePromise, 
              validateTimeoutPromise
            ]) as boolean;
            
            if (isValid) {
              setUser(session.user);
              setError(null);
            } else {
              logger.warn('AuthGuard: Refreshed token is invalid or validation timeout');
              cleanupAuthState();
              setUser(null);
              setError('Sesi bermasalah. Silakan login ulang.');
            }
          } catch (error) {
            logger.error('AuthGuard: Token refresh validation error:', error);
            cleanupAuthState();
            setUser(null);
            setError('Sesi bermasalah. Silakan login ulang.');
          }
        }
        
        setLoading(false);
      }
    );

    initAuth();

    return () => {
      mounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  // Error state
  if (error) {
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
            <p className="text-gray-600 mb-6">{error}</p>
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

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Memuat Autentikasi</h2>
          <p className="text-gray-500">Sedang memverifikasi sesi Anda...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if not authenticated
  if (!user && location.pathname !== '/auth') {
    logger.debug('AuthGuard: Redirecting to auth, no user found');
    return <Navigate to="/auth" replace />;
  }

  // User is authenticated, render children
  return <>{children}</>;
};

export default AuthGuard;