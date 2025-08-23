// src/components/AuthGuard.tsx - SIMPLIFIED & RELIABLE VERSION
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

  // ✅ FORCE RE-RENDER on auth state changes
  useEffect(() => {
    setRenderCount(prev => prev + 1);
  }, [user, isReady, isLoading]);

  // ✅ SIMPLIFIED DEBUG: Log only key state changes
  useEffect(() => {
    const debugInfo = {
      renderCount,
      currentPath: location.pathname,
      hasUser: !!user,
      userEmail: user?.email || 'none',
      isLoading,
      isReady,
      timestamp: new Date().toISOString()
    };

    // ✅ Log debug info in development
    if (import.meta.env.DEV) {
      console.log(`🔍 [AuthGuard #${renderCount}] State:`, debugInfo);
      
      // ✅ Log navigation decisions
      if (isReady && !isLoading) {
        if (!user && location.pathname !== '/auth') {
          console.log(`🚀 [AuthGuard #${renderCount}] Will redirect to /auth (no user)`);
        } else if (user && location.pathname === '/auth') {
          console.log(`🚀 [AuthGuard #${renderCount}] Will redirect to / (user authenticated)`);
        } else if (user && location.pathname !== '/auth') {
          console.log(`✅ [AuthGuard #${renderCount}] Rendering protected content`);
        }
      }
    }
  }, [user, isLoading, isReady, location.pathname, renderCount]);

  // ✅ ENHANCED: Loading state with timeout fallback
  if (isLoading || !isReady) {
    console.log(`🔄 [AuthGuard #${renderCount}] Loading state:`, { isLoading, isReady });
    
    // Force redirect to auth page after 20 seconds of loading
    useEffect(() => {
      const timeout = setTimeout(() => {
        if ((isLoading || !isReady) && location.pathname !== '/auth') {
          console.log('🚨 AuthGuard: Force redirect after 20s timeout');
          window.location.href = '/auth';
        }
      }, 20000);
      
      return () => clearTimeout(timeout);
    }, [isLoading, isReady, location.pathname]);
    
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
          <button 
            onClick={() => {
              console.log('🔄 Manual refresh triggered');
              window.location.reload();
            }}
            className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm"
          >
            Refresh Halaman
          </button>
        </div>
      </div>
    );
  }

  // ✅ ENHANCED: Redirect logic with detailed logging
  if (!user && location.pathname !== '/auth') {
    console.log(`🚀 [AuthGuard #${renderCount}] EXECUTING REDIRECT to /auth`);
    return <Navigate to="/auth" replace />;
  }

  if (user && location.pathname === '/auth') {
    console.log(`🚀 [AuthGuard #${renderCount}] EXECUTING REDIRECT to / for user:`, user.email);
    console.log(`🚀 [AuthGuard #${renderCount}] Current path was:`, location.pathname);
    return <Navigate to="/" replace />;
  }

  // ✅ User terautentikasi dan di halaman yang benar
  console.log(`✅ [AuthGuard #${renderCount}] Rendering protected content for user:`, user?.email);
  return <>{children}</>;
};

export default AuthGuard;