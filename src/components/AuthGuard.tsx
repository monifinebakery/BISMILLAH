// src/components/AuthGuard.tsx - FORCE RE-RENDER VERSION
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { logger } from '@/utils/logger';
import { useAuth } from '@/contexts/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { user, isLoading, isReady } = useAuth();
  const location = useLocation();
  const [renderCount, setRenderCount] = useState(0);

  // ✅ Development bypass authentication
  const isDevelopmentBypass = import.meta.env.DEV && import.meta.env.VITE_DEV_BYPASS_AUTH === 'true';
  
  if (isDevelopmentBypass) {
    console.log('🔧 [DEV] AuthGuard: Bypassing authentication check');
    return <>{children}</>;
  }

  // ✅ FORCE RE-RENDER on auth state changes
  useEffect(() => {
    setRenderCount(prev => prev + 1);
  }, [user, isReady, isLoading]);

  // ✅ ENHANCED DEBUG: Log all state changes
  useEffect(() => {
    const debugInfo = {
      renderCount,
      currentPath: location.pathname,
      hasUser: !!user,
      userEmail: user?.email || 'none',
      userId: user?.id || 'none',
      userIdType: typeof user?.id,
      isLoading,
      isReady,
      timestamp: new Date().toISOString()
    };

    logger.debug('🔍 AuthGuard State Update:', debugInfo);
    
    // ✅ FORCE LOG to console for debugging
    console.log(`🔍 [AuthGuard #${renderCount}] State:`, debugInfo);

    // ✅ Log specific navigation decisions
    if (isReady && !isLoading) {
      if (!user && location.pathname !== '/auth') {
        logger.info('🚀 AuthGuard: Will redirect to /auth (no user)');
        console.log(`🚀 [AuthGuard #${renderCount}] Will redirect to /auth (no user)`);
      } else if (user && location.pathname === '/auth') {
        logger.info('🚀 AuthGuard: Will redirect to / (authenticated user on auth page)');
        console.log(`🚀 [AuthGuard #${renderCount}] Will redirect to / (authenticated user on auth page)`);
        console.log(`🚀 [AuthGuard #${renderCount}] User details:`, { id: user.id, email: user.email });
      } else if (user && location.pathname !== '/auth') {
        logger.info('✅ AuthGuard: User authenticated, rendering protected content');
        console.log(`✅ [AuthGuard #${renderCount}] User authenticated, rendering protected content`);
      }
    } else {
      console.log(`⏳ [AuthGuard #${renderCount}] Waiting for AuthContext:`, { isReady, isLoading });
    }
  }, [user, isLoading, isReady, location.pathname, renderCount]);

  // ✅ IMMEDIATE REDIRECT CHECK on user change
  useEffect(() => {
    if (isReady && !isLoading && user && location.pathname === '/auth') {
      console.log(`🚀 [AuthGuard] IMMEDIATE REDIRECT triggered for user:`, user.email);
      console.log(`🚀 [AuthGuard] Current path before redirect:`, location.pathname);
      
      // Small delay to ensure state is stable
      setTimeout(() => {
        if (location.pathname === '/auth') {
          console.log(`🚀 [AuthGuard] Executing delayed redirect`);
          window.location.href = '/';
        }
      }, 100);
    }
  }, [user, isReady, isLoading, location.pathname]);

  // ✅ ENHANCED: Loading state with more detailed info
  if (isLoading || !isReady) {
    console.log(`🔄 [AuthGuard #${renderCount}] Loading state:`, { isLoading, isReady });
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Memuat Autentikasi</h2>
          <p className="text-gray-500">
            {!isReady ? 'Memuat sistem...' : 'Memverifikasi sesi...'}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Render #{renderCount} | isLoading: {isLoading.toString()} | isReady: {isReady.toString()}
          </p>
        </div>
      </div>
    );
  }

  // ✅ ENHANCED: Redirect logic with detailed logging
  if (!user) {
    console.log(`🔒 [AuthGuard #${renderCount}] No user found, redirecting to /auth`);
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  console.log(`✅ [AuthGuard #${renderCount}] User authenticated, rendering children`);
  return <>{children}</>;
};

export { AuthGuard };
