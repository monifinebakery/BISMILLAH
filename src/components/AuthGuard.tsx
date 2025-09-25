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
  const { user, isLoading, isReady, refreshUser } = useAuth(); // ✅ Tambah refreshUser
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
  }, [navigate, user]);

  // ✅ FORCE RE-RENDER on auth state changes with timeout prevention
  useEffect(() => {
    setRenderCount(prev => prev + 1);

    // ✅ FIX: Auto-cleanup stale otpVerifiedAt flag to prevent infinite loops
    if (!user && !isLoading && isReady) {
      const otpTimestamp = readOtpTimestamp();
      const now = Date.now();
      const OTP_DISPLAY_TIMEOUT_MS = 60000; // ✅ FIX: Increased to 60s (1 minute) for slower connections
      const OTP_STALE_THRESHOLD_MS = 90000; // ✅ FIX: Increased to 90s (1.5 minutes) for slower connections
      const MIN_WAIT_WINDOW_MS = 20000; // ✅ FIX: Increased to 20s for better reliability

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
            otpWaitTimeoutRef.current = null; // ✅ FIX: Explicitly set to null after clearing
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

    // ✅ ENHANCED: Better session refresh with retry logic when AuthGuard detects potential stale session
    if (!user && !isLoading && isReady) {
      // Increased delay to allow more time for auth state to settle
      const refreshTimer = setTimeout(async () => {
        try {
          console.log('AuthGuard: Attempting to refresh potentially stale session...');
          await refreshUser();
          console.log('AuthGuard: Session refresh completed');
        } catch (error) {
          console.warn('AuthGuard: Failed to refresh user session, will retry once more', error);
          // One more attempt after a delay for slow connections
          setTimeout(async () => {
            try {
              await refreshUser();
              console.log('AuthGuard: Second session refresh attempt completed');
            } catch (retryError) {
              console.error('AuthGuard: Both session refresh attempts failed', retryError);
            }
          }, 2000);
        }
      }, 800); // ✅ FIX: Increased from 300ms to 800ms for better auth state settling
      
      return () => clearTimeout(refreshTimer);
    }
  }, [user, isReady, isLoading, navigate, readOtpTimestamp, stopOtpWaiting, refreshUser]);

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
  }, [user, isLoading, isReady, renderCount]);

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
    const OTP_DISPLAY_TIMEOUT_MS = 60000; // ✅ FIX: Match with timeout above for consistency
    const waitingForOtp = isWaitingForOtpSession || (otpTimestamp > 0 && (now - otpTimestamp) < OTP_DISPLAY_TIMEOUT_MS);
    const elapsedSeconds = otpTimestamp > 0 ? Math.max(0, Math.floor((now - otpTimestamp) / 1000)) : 0;

    const remainingSeconds = otpTimeoutDeadlineRef.current > 0
      ? Math.max(0, Math.ceil((otpTimeoutDeadlineRef.current - now) / 1000))
      : Math.max(0, Math.ceil((OTP_DISPLAY_TIMEOUT_MS - (now - otpTimestamp)) / 1000));

    if (waitingForOtp) {
      console.log(`⏳ [AuthGuard #${renderCount}] Waiting for session (OTP recently verified, ${elapsedSeconds}s ago, ${remainingSeconds}s remaining)`);
      
      // ✅ FIX: Add debug info in dev mode
      if (import.meta.env.DEV && elapsedSeconds > 20) {
        console.warn(`⚠️ [AuthGuard] OTP session taking longer than expected: ${elapsedSeconds}s elapsed`);
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm text-gray-600">Menyiapkan sesi...</p>
            <p className="text-xs text-gray-400 mt-2">Render #{renderCount}</p>
            <p className="text-xs text-gray-400 mt-1">{elapsedSeconds}s dari verifikasi</p>
            {remainingSeconds > 0 && (
              <p className="text-xs text-gray-400 mt-1">
                {elapsedSeconds > 15 ? 
                  'Memproses... mohon tunggu sebentar' : 
                  `Mengarahkan ulang otomatis dalam ±${remainingSeconds}s jika sesi belum aktif`
                }
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
