// src/components/AuthGuard.tsx - FIXED REDIRECT RACE CONDITIONS
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { logger } from '@/utils/logger';
import { useAuth } from '@/contexts/AuthContext';
import { authNavigationLogger } from '@/utils/auth/navigationLogger';
import { safeStorageGet, safeStorageRemove } from '@/utils/auth/safeStorage'; // ✅ FIX: Thread-safe storage
import { getMobileOptimizedTimeout, detectMobileCapabilities } from '@/utils/mobileOptimizations';
import { detectSafariIOS, getSafariTimeout } from '@/utils/safariUtils';

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
  const [isWaitingForOtpSession, setIsWaitingForOtpSession] = useState(false);
  const [otpTick, setOtpTick] = useState(() => Date.now());
  const otpTimestampRef = useRef<number>(0);
  const otpTimeoutDeadlineRef = useRef<number>(0);
  const otpWaitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);


  // ✅ Development bypass authentication (must NOT short‑circuit before hooks)
  const isDevelopmentBypass = import.meta.env.DEV && import.meta.env.VITE_DEV_BYPASS_AUTH === 'true';

  const readOtpTimestamp = useCallback(() => {
    try {
      return parseInt(safeStorageGet('otpVerifiedAt') || '0', 10) || 0;
    } catch (error) {
      console.error('Failed to read otpVerifiedAt timestamp:', error);
      return 0;
    }
  }, []);

  const stopOtpWaiting = useCallback(() => {
    if (otpWaitTimeoutRef.current) {
      clearTimeout(otpWaitTimeoutRef.current);
      otpWaitTimeoutRef.current = null;
    }
    otpTimeoutDeadlineRef.current = 0;
    otpTimestampRef.current = 0;
    setIsWaitingForOtpSession(prev => (prev ? false : prev));
  }, []);

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

  // ✅ FORCE RE-RENDER on auth state changes with timeout prevention
  useEffect(() => {
    setRenderCount(prev => prev + 1);

    // ✅ FIX: Auto-cleanup stale otpVerifiedAt flag to prevent infinite loops
    if (!user && !isLoading && isReady) {
      const otpTimestamp = readOtpTimestamp();
      const now = Date.now();
      const OTP_DISPLAY_TIMEOUT_MS = 12000;
      const OTP_STALE_THRESHOLD_MS = 15000;
      const MIN_WAIT_WINDOW_MS = 3000;

      if (otpTimestamp > 0) {
        const elapsed = now - otpTimestamp;

        if (elapsed > OTP_STALE_THRESHOLD_MS) {
          console.warn('🧙 [AuthGuard] Clearing stale otpVerifiedAt flag');
          try {
            safeStorageRemove('otpVerifiedAt');
          } catch (error) {
            console.error('Failed to clean stale otpVerifiedAt:', error);
          }
          stopOtpWaiting();
        } else {
          otpTimestampRef.current = otpTimestamp;
          setIsWaitingForOtpSession(prev => (prev ? prev : true));

          const remainingWindow = Math.max(0, OTP_DISPLAY_TIMEOUT_MS - elapsed);
          const waitDuration = Math.max(MIN_WAIT_WINDOW_MS, remainingWindow);
          otpTimeoutDeadlineRef.current = now + waitDuration;

          if (otpWaitTimeoutRef.current) {
            clearTimeout(otpWaitTimeoutRef.current);
          }

          otpWaitTimeoutRef.current = setTimeout(() => {
            console.warn('🚨 AuthGuard: OTP session wait timeout reached, redirecting to auth');
            try {
              safeStorageRemove('otpVerifiedAt');
            } catch (error) {
              console.error('Failed to remove otpVerifiedAt flag after timeout:', error);
            }
            stopOtpWaiting();
            if (location.pathname !== '/auth') {
              navigate('/auth', { replace: true });
            }
          }, waitDuration);
        }
      } else {
        stopOtpWaiting();
      }
    } else {
      stopOtpWaiting();
    }

    // ✅ MOBILE-OPTIMIZED: Reasonable timeout with retry-based strategy
    if (isLoading && !isReady && !user) {
      const mobileCapabilities = detectMobileCapabilities();
      const safariDetection = detectSafariIOS();
      
      // ✅ NEW STRATEGY: Reasonable timeout, let auth system handle retries
      let timeoutDuration = 12000; // Base 12s timeout
      
      if (safariDetection.isSafariIOS) {
        // Safari iOS gets longer but reasonable timeout
        timeoutDuration = getSafariTimeout(15000); // Up to 22-30s (reduced from 48s)
        console.log('📱 AuthGuard: Safari iOS detected, using extended timeout:', timeoutDuration + 'ms');
      } else if (mobileCapabilities.isMobile) {
        // Other mobile browsers get moderate increase
        timeoutDuration = getMobileOptimizedTimeout(15000, 'auth'); // Around 15-20s
        console.log('📱 AuthGuard: Mobile device detected, using mobile timeout:', timeoutDuration + 'ms');
      }
      
      const timeoutId = setTimeout(() => {
        console.warn('🚨 AuthGuard: Session verification timeout (' + timeoutDuration + 'ms), redirecting to auth');
        if (location.pathname !== '/auth') {
          navigate('/auth', { replace: true });
        }
      }, timeoutDuration);
      
      return () => {
        clearTimeout(timeoutId);
        if (otpWaitTimeoutRef.current) {
          clearTimeout(otpWaitTimeoutRef.current);
          otpWaitTimeoutRef.current = null;
        }
      };
    }
    return () => {
      if (otpWaitTimeoutRef.current) {
        clearTimeout(otpWaitTimeoutRef.current);
        otpWaitTimeoutRef.current = null;
      }
    };
  }, [user, isReady, isLoading, navigate, location.pathname, readOtpTimestamp, stopOtpWaiting]);

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
    
    // ✅ REDUCED: Only log in dev mode and when there are actual changes
    if (import.meta.env.DEV && renderCount % 5 === 1) {
      console.log(`🔍 [AuthGuard #${renderCount}] State:`, debugInfo);
    }

    // ✅ REDUCED: Log specific navigation decisions (dev mode only)
    if (import.meta.env.DEV && isReady && !isLoading) {
      if (!user && location.pathname !== '/auth') {
        console.log(`🚀 [AuthGuard #${renderCount}] Will redirect to /auth (no user)`);
      } else if (user && location.pathname === '/auth') {
        console.log(`🚀 [AuthGuard #${renderCount}] Will redirect to / (authenticated user)`);
      } else if (user && location.pathname !== '/auth') {
        if (renderCount % 10 === 1) {
          console.log(`✅ [AuthGuard #${renderCount}] User authenticated, rendering content`);
        }
      }
    }
  }, [user, isLoading, isReady, location.pathname, renderCount]);

  // ✅ ANTI-FLICKER: Simple initialization tracking
  useEffect(() => {
    if (isReady && !isLoading) {
      if (!isInitialized) {
        // Minimal delay to prevent flash, optimized for speed
        const timer = setTimeout(() => setIsInitialized(true), 20); // Reduced from 50ms to 20ms
        return () => clearTimeout(timer);
      }
    }
  }, [isReady, isLoading, isInitialized]);

  useEffect(() => {
    if (!isWaitingForOtpSession) {
      return;
    }

    const intervalId = setInterval(() => {
      setOtpTick(Date.now());
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isWaitingForOtpSession]);

  // ✅ REMOVED: Navigation useEffect to prevent race conditions with Navigate component
  // All navigation is now handled by the Navigate component below to ensure atomic redirects

  // ✅ OPTIMIZED: Faster loading state with better UX
  if ((isLoading || !isReady) && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Memuat Autentikasi</h2>
          <p className="text-gray-500 text-sm">Memverifikasi sesi...</p>
          <div className="mt-2 text-xs text-gray-400">
            <div className="w-32 h-1 bg-gray-200 rounded-full mx-auto overflow-hidden">
              <div className="h-full bg-orange-500 animate-pulse" style={{width: '60%'}}></div>
            </div>
          </div>
          {import.meta.env.DEV && (
            <p className="text-xs text-gray-400 mt-2">
              Ready: {isReady.toString()} | Loading: {isLoading.toString()} | Render: #{renderCount}
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
    const otpTimestamp = otpTimestampRef.current || readOtpTimestamp();
    const now = otpTick;
    const OTP_DISPLAY_TIMEOUT_MS = 12000;
    const waitingForOtp = isWaitingForOtpSession || (otpTimestamp > 0 && (now - otpTimestamp) < OTP_DISPLAY_TIMEOUT_MS);
    const elapsedSeconds = otpTimestamp > 0 ? Math.max(0, Math.floor((now - otpTimestamp) / 1000)) : 0;

    const remainingSeconds = otpTimeoutDeadlineRef.current > 0
      ? Math.max(0, Math.ceil((otpTimeoutDeadlineRef.current - now) / 1000))
      : Math.max(0, Math.ceil((OTP_DISPLAY_TIMEOUT_MS - (now - otpTimestamp)) / 1000));

    if (waitingForOtp) {
      console.log(`⏳ [AuthGuard #${renderCount}] Waiting for session (OTP recently verified, ${elapsedSeconds}s ago)`);

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm text-gray-600">Menyiapkan sesi...</p>
            <p className="text-xs text-gray-400 mt-2">Render #{renderCount}</p>
            <p className="text-xs text-gray-400 mt-1">{elapsedSeconds}s dari verifikasi</p>
            {remainingSeconds > 0 && (
              <p className="text-xs text-gray-400 mt-1">
                Mengarahkan ulang otomatis dalam ±{remainingSeconds}s jika sesi belum aktif
              </p>
            )}
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
