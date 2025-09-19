// src/components/AuthGuard.tsx - FIXED REDIRECT RACE CONDITIONS
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { logger } from '@/utils/logger';
import { useAuth } from '@/contexts/AuthContext';
import { authNavigationLogger } from '@/utils/auth/navigationLogger';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { user, isLoading, isReady } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // ✅ FIX: Navigation state management to prevent race conditions
  const navigationRef = useRef({ isNavigating: false, lastPath: '', lastTimestamp: 0 });
  const [renderCount, setRenderCount] = useState(0);
  // ✅ ANTI-FLICKER: Reduce mobile optimization states to prevent flicker
  const isMobile = useRef(/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
  const [isInitialized, setIsInitialized] = useState(false);
  

  // ✅ Development bypass authentication (must NOT short‑circuit before hooks)
  const isDevelopmentBypass = import.meta.env.DEV && import.meta.env.VITE_DEV_BYPASS_AUTH === 'true';

  // ✅ FIX: Centralized navigation handler to prevent race conditions
  const handleNavigation = useCallback((targetPath: string, reason: string) => {
    const now = Date.now();
    const { isNavigating, lastPath, lastTimestamp } = navigationRef.current;

    // ✅ FIX: Check for redirect loops using navigation logger
    const loopCheck = authNavigationLogger.detectRedirectLoop();
    if (loopCheck.hasLoop) {
      logger.error('🚫 AuthGuard: Redirect loop detected, aborting navigation', {
        details: loopCheck.details,
        targetPath,
        reason
      });
      console.error('🚫 [AuthGuard] REDIRECT LOOP DETECTED:', loopCheck.details);
      return false;
    }

    // Prevent duplicate navigation within 500ms window
    if (isNavigating && lastPath === targetPath && (now - lastTimestamp) < 500) {
      console.log(`🚫 [AuthGuard] Prevented duplicate navigation to ${targetPath} (${reason})`);
      return false;
    }

    // ✅ FIX: Log navigation event
    authNavigationLogger.logNavigation({
      from: location.pathname,
      to: targetPath,
      reason,
      source: 'AuthGuard',
      userId: user?.id,
      userEmail: user?.email
    });

    // Update navigation state
    navigationRef.current = {
      isNavigating: true,
      lastPath: targetPath,
      lastTimestamp: now
    };
    
    // Reset navigation state after navigation completes
    setTimeout(() => {
      navigationRef.current.isNavigating = false;
    }, 200);

    navigate(targetPath, { replace: true });
    return true;
  }, [navigate, location.pathname, user]);

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

  // ✅ ANTI-FLICKER: Simple initialization tracking
  useEffect(() => {
    if (isReady && !isLoading) {
      if (!isInitialized) {
        // Small delay to prevent flash
        const timer = setTimeout(() => setIsInitialized(true), 50);
        return () => clearTimeout(timer);
      }
    }
  }, [isReady, isLoading, isInitialized]);

  // ✅ FIXED: Simplified redirect logic with race condition prevention
  useEffect(() => {
    // Only handle navigation when auth state is fully ready
    if (!isReady || isLoading) return;

    // Case 1: Authenticated user on auth page → redirect to app
    if (user && location.pathname === '/auth') {
      logger.info('✅ AuthGuard: Redirecting authenticated user to app', {
        userId: user.id,
        email: user.email
      });
      navigate('/', { replace: true });
    }
    // Case 2: No user and not on auth page → will be handled by Navigate component below
  }, [user, isReady, isLoading, location.pathname, navigate]);

  // ✅ ANTI-FLICKER: Simplified loading state without mobile branching
  if ((isLoading || !isReady) && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Memuat Autentikasi</h2>
          <p className="text-gray-500 text-sm">Memverifikasi sesi...</p>
          {import.meta.env.DEV && (
            <p className="text-xs text-gray-400 mt-2">
              Ready: {isReady.toString()} | Loading: {isLoading.toString()}
            </p>
          )}
        </div>
      </div>
    );
  }
  
  // ✅ DEV BYPASS: Render children after hooks are called to satisfy Rules of Hooks
  if (isDevelopmentBypass) {
    console.log('🔧 [DEV] AuthGuard: Bypassing authentication check');
    return <>{children}</>;
  }

  // ✅ ANTI-FLICKER: Quick initialization state
  if (user && !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-600">Menyiapkan...</p>
        </div>
      </div>
    );
  }

  // ✅ FIXED: Simplified redirect logic without race conditions
  if (!user) {
    // Check for recent OTP verification to provide better UX
    let recentlyVerified = false;
    try {
      const ts = parseInt(localStorage.getItem('otpVerifiedAt') || '0', 10) || 0;
      recentlyVerified = ts > 0 && (Date.now() - ts) < 10000; // Reduced to 10s
    } catch (error) {
      logger.warn('[AuthGuard] Failed to read otpVerifiedAt from storage', error);
    }

    if (recentlyVerified) {
      console.log(`⏳ [AuthGuard #${renderCount}] Waiting for session (OTP recently verified)`);
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm text-gray-600">Menyiapkan sesi...</p>
            <p className="text-xs text-gray-400 mt-2">Render #{renderCount}</p>
          </div>
        </div>
      );
    }

    // ✅ FIXED: Use Navigate component for unauthenticated users (no competing navigation)
    console.log(`🔒 [AuthGuard #${renderCount}] No user, using Navigate to /auth`);
    
    // ✅ FIX: Log navigation event for Navigate component
    authNavigationLogger.logNavigation({
      from: location.pathname,
      to: '/auth',
      reason: 'unauthenticated user',
      source: 'Navigate'
    });
    
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  console.log(`✅ [AuthGuard #${renderCount}] User authenticated, rendering children`);
  return <>{children}</>;
};

export { AuthGuard };
