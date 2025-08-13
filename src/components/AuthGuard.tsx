// src/components/AuthGuard.tsx - FINAL VERSION - COMPATIBLE WITH ALL SERVICES
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { logger } from '@/utils/logger';
import { useAuth } from '@/contexts/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { user, isLoading, isReady } = useAuth();
  const location = useLocation();

  // ✅ Debug logging untuk troubleshooting
  useEffect(() => {
    logger.debug('🔍 AuthGuard State:', {
      currentPath: location.pathname,
      hasUser: !!user,
      userEmail: user?.email || 'none',
      userId: user?.id || 'none',
      userIdType: typeof user?.id,
      isLoading,
      isReady,
      timestamp: new Date().toISOString()
    });

    // ✅ Log specific navigation decisions
    if (isReady && !isLoading) {
      if (!user && location.pathname !== '/auth') {
        logger.info('🚀 AuthGuard: Will redirect to /auth (no user)');
      } else if (user && location.pathname === '/auth') {
        logger.info('🚀 AuthGuard: Will redirect to / (authenticated user on auth page)');
      } else if (user && location.pathname !== '/auth') {
        logger.info('✅ AuthGuard: User authenticated, rendering protected content');
      }
    }
  }, [user, isLoading, isReady, location.pathname]);

  // ✅ Loading state - tampilkan loading sampai AuthContext siap
  if (isLoading || !isReady) {
    logger.debug('🔄 AuthGuard: Showing loading state');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Memuat Autentikasi</h2>
          <p className="text-gray-500">
            {!isReady ? 'Memuat sistem...' : 'Memverifikasi sesi...'}
          </p>
        </div>
      </div>
    );
  }

  // ✅ SEDERHANA: Langsung percaya AuthContext tanpa validasi tambahan
  // Jika user tidak ada dan bukan di halaman auth, redirect ke auth
  if (!user && location.pathname !== '/auth') {
    logger.info('🚀 AuthGuard: Executing redirect to /auth (no user)');
    return <Navigate to="/auth" replace />;
  }

  // ✅ SEDERHANA: Jika user ada dan di halaman auth, redirect ke dashboard
  if (user && location.pathname === '/auth') {
    logger.info('🚀 AuthGuard: Executing redirect to / (authenticated user on auth page)');
    return <Navigate to="/" replace />;
  }

  // ✅ User terautentikasi dan di halaman yang benar
  logger.debug('✅ AuthGuard: Rendering protected content for user:', user.email);
  return <>{children}</>;
};

export default AuthGuard;