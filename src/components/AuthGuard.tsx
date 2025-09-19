// src/components/AuthGuard.tsx - FORCE RE-RENDER VERSION
import React, { useEffect, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { logger } from '@/utils/logger';
import { useAuth } from '@/contexts/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { user, isLoading, isReady } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [renderCount, setRenderCount] = useState(0);
  const otpRefreshRequestedRef = useRef(false);
  const [isMobileOptimized, setIsMobileOptimized] = useState(false);
  const [showQuickPreview, setShowQuickPreview] = useState(false);
  
  // ⚡ MOBILE DETECTION
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // ✅ Development bypass authentication (must NOT short‑circuit before hooks)
  const isDevelopmentBypass = import.meta.env.DEV && import.meta.env.VITE_DEV_BYPASS_AUTH === 'true';

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

  // ⚡ MOBILE-OPTIMIZED: Quick preview untuk user experience
  useEffect(() => {
    if (user && isReady && !isLoading) {
      if (!isMobileOptimized) {
        // Show quick preview first untuk mobile
        if (isMobile) {
          setShowQuickPreview(true);
          setTimeout(() => setIsMobileOptimized(true), 50);
        } else {
          setIsMobileOptimized(true);
        }
      }
    }
  }, [user, isReady, isLoading, isMobile, isMobileOptimized]);


  // ✅ IMPROVED REDIRECT CHECK - more reliable for OTP flow
  useEffect(() => {
    if (isReady && !isLoading && user && location.pathname === '/auth') {
      console.log(`🚀 [AuthGuard] IMMEDIATE SPA REDIRECT triggered for user:`, user.email);
      console.log(`🚀 [AuthGuard] Current path before redirect:`, location.pathname);
      
      // ✅ FIXED: Immediate redirect for successful OTP - no delay needed
      // The session is already validated by AuthContext at this point
      console.log(`🚀 [AuthGuard] Executing immediate SPA redirect to /`);
      navigate('/', { replace: true });
    }
  }, [user, isReady, isLoading, location.pathname, navigate]);

  // ⚡ MOBILE-OPTIMIZED: Loading state dengan progressive improvement
  if ((isLoading || !isReady) && !user) {
    console.log(`🔄 [AuthGuard #${renderCount}] Loading state:`, { isLoading, isReady, isMobile });
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          {/* ⚡ MOBILE: Smaller spinner untuk mobile */}
          <div className={`${
            isMobile ? 'w-12 h-12' : 'w-16 h-16'
          } border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4`}></div>
          
          <h2 className={`${
            isMobile ? 'text-lg' : 'text-xl'
          } font-semibold text-gray-700 mb-2`}>Memuat Autentikasi</h2>
          
          <p className="text-gray-500 text-sm">
            {!isReady ? (
              isMobile ? 'Memuat...' : 'Memuat sistem...'
            ) : (
              isMobile ? 'Verifikasi...' : 'Memverifikasi sesi...'
            )}
          </p>
          
          {/* ⚡ MOBILE: Hide debug info di mobile untuk cleaner UI */}
          {!isMobile && (
            <p className="text-xs text-gray-400 mt-2">
              Render #{renderCount} | isLoading: {isLoading.toString()} | isReady: {isReady.toString()}
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

  // ⚡ MOBILE: Quick preview state untuk smoother transition
  if (user && showQuickPreview && !isMobileOptimized && isMobile) {
    console.log(`⚡ [AuthGuard #${renderCount}] Showing quick preview for mobile`);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-600">Hampir siap...</p>
        </div>
      </div>
    );
  }

  // ✅ ENHANCED: Redirect logic with mobile-friendly grace period after OTP
  if (!user) {
    let recentlyVerified = false;
    try {
      const ts = parseInt(localStorage.getItem('otpVerifiedAt') || '0', 10) || 0;
      recentlyVerified = ts > 0 && (Date.now() - ts) < 15000; // 15s grace
    } catch (error) {
      console.warn('[AuthGuard] Failed to read otpVerifiedAt from storage', error);
    }

    if (recentlyVerified) {
      console.log(`⏳ [AuthGuard #${renderCount}] Waiting for session (OTP just verified)`);
      if (!otpRefreshRequestedRef.current) {
        otpRefreshRequestedRef.current = true;
        Promise.resolve().then(() => {
          try {
            window.dispatchEvent(new Event('auth-refresh-request'));
          } catch (error) {
            console.warn('[AuthGuard] Failed to dispatch auth refresh event', error);
          }
        });
      }
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm text-gray-600">Menyiapkan sesi...</p>
          </div>
        </div>
      );
    }

    otpRefreshRequestedRef.current = false;

    console.log(`🔒 [AuthGuard #${renderCount}] No user found, redirecting to /auth`);
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  console.log(`✅ [AuthGuard #${renderCount}] User authenticated, rendering children`);
  return <>{children}</>;
};

export { AuthGuard };
