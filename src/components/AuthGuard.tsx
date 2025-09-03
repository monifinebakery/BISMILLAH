// src/components/AuthGuard.tsx - PWA EMERGENCY BYPASS VERSION
import React, { useEffect, useState, useRef } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { logger } from '@/utils/logger';
import { useAuth } from '@/contexts/AuthContext';
import { trackRedirect, detectPWAStuckState, isEmergencyBypassActive } from '@/utils/pwaEmergencyBypass';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { user, isLoading, isReady } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [renderCount, setRenderCount] = useState(0);
  const lastRedirectTime = useRef<number>(0);
  const redirectCooldown = 2000; // 2 seconds cooldown to prevent loops
  const [emergencyBypassActive, setEmergencyBypassActive] = useState(false);

  // ✅ FORCE RE-RENDER on auth state changes
  useEffect(() => {
    setRenderCount(prev => prev + 1);
  }, [user, isReady, isLoading]);
  
  // ✅ EMERGENCY BYPASS: Check if we should bypass auth
  useEffect(() => {
    const bypassActive = isEmergencyBypassActive();
    if (bypassActive && !emergencyBypassActive) {
      logger.warn('AuthGuard: Emergency bypass is active');
      setEmergencyBypassActive(true);
    }
    
    // Auto-detect stuck state
    const stuckState = detectPWAStuckState();
    if (stuckState.isStuck && import.meta.env.DEV) {
      console.warn('🚨 PWA Stuck State Detected:', stuckState.reason);
      console.log('🔧 Suggested Action:', stuckState.suggestedAction);
      if (stuckState.canBypass) {
        console.log('🆘 Emergency bypass available: window.PWA_EMERGENCY_BYPASS()');
      }
    }
  }, [emergencyBypassActive, isLoading, isReady, user, location.pathname]);

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

  // ✅ SAFE REDIRECT with loop prevention and emergency bypass
  useEffect(() => {
    if (isReady && !isLoading && user && location.pathname === '/auth') {
      const now = Date.now();
      
      // Emergency bypass check
      if (emergencyBypassActive) {
        console.log(`🆘 [AuthGuard] Emergency bypass active, forcing redirect`);
        navigate('/', { replace: true });
        return;
      }
      
      // Prevent redirect loops with cooldown
      if (now - lastRedirectTime.current < redirectCooldown) {
        console.log(`🚫 [AuthGuard] Redirect cooldown active, user on /auth`);
        return;
      }
      
      console.log(`🚀 [AuthGuard] SAFE REDIRECT triggered for user:`, user.email);
      console.log(`🚀 [AuthGuard] Current path before redirect:`, location.pathname);
      
      lastRedirectTime.current = now;
      
      // Track redirect for loop detection
      trackRedirect('/auth', '/');
      
      // Use React Router navigate instead of window.location for PWA compatibility
      setTimeout(() => {
        if (location.pathname === '/auth') {
          console.log(`🚀 [AuthGuard] Executing React Router redirect`);
          navigate('/', { replace: true });
        }
      }, 100);
    }
  }, [user, isReady, isLoading, location.pathname, navigate, emergencyBypassActive]);

  // ✅ ENHANCED: Loading state with PWA-specific messaging
  if (isLoading || !isReady) {
    console.log(`🔄 [AuthGuard #${renderCount}] Loading state:`, { isLoading, isReady });
    
    // ✅ PWA Detection
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                 (window.navigator as any).standalone === true;
    
    const loadingMessage = isPWA 
      ? (!isReady ? 'Memuat aplikasi...' : 'Memverifikasi login...')
      : (!isReady ? 'Memuat sistem...' : 'Memverifikasi sesi...');
      
    const subMessage = isPWA 
      ? 'Harap tunggu sebentar'
      : 'Sistem sedang mempersiapkan sesi Anda';
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            {isPWA ? '📱 ' : ''}Memuat Autentikasi
          </h2>
          <p className="text-gray-500 mb-2">
            {loadingMessage}
          </p>
          <p className="text-sm text-gray-400">
            {subMessage}
          </p>
          {import.meta.env.DEV && (
            <p className="text-xs text-gray-400 mt-3 font-mono">
              {isPWA ? 'PWA' : 'Web'} | Render #{renderCount} | Loading: {isLoading.toString()} | Ready: {isReady.toString()}
            </p>
          )}
          {import.meta.env.DEV && emergencyBypassActive && (
            <div className="mt-4 px-3 py-2 bg-yellow-100 text-yellow-800 rounded text-xs">
              🆘 Emergency Bypass Active
            </div>
          )}
        </div>
      </div>
    );
  }

  // ✅ PWA SAFE: Redirect logic with loop prevention
  if (!user && location.pathname !== '/auth' && !emergencyBypassActive) {
    console.log(`🚀 [AuthGuard #${renderCount}] EXECUTING REDIRECT to /auth`);
    trackRedirect(location.pathname, '/auth');
    return <Navigate to="/auth" replace />;
  }
  
  // ✅ EMERGENCY BYPASS: Skip auth if bypass is active
  if (emergencyBypassActive) {
    console.log(`🆘 [AuthGuard #${renderCount}] Emergency bypass active, rendering children`);
    return (
      <>
        {children}
        {import.meta.env.DEV && (
          <div className="fixed bottom-4 left-4 bg-yellow-500 text-white px-3 py-2 rounded text-xs font-mono z-50">
            🆘 Emergency Bypass Active
          </div>
        )}
      </>
    );
  }

  if (user && location.pathname === '/auth') {
    const now = Date.now();
    
    // Check if we're in a redirect loop
    if (now - lastRedirectTime.current < redirectCooldown) {
      console.log(`⚠️ [AuthGuard #${renderCount}] Redirect loop detected, showing loading instead`);
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              🔄 Mengalihkan...
            </h2>
            <p className="text-gray-500 mb-2">
              Sedang mengalihkan ke halaman utama
            </p>
            <p className="text-sm text-gray-400">
              PWA Mode - Harap tunggu
            </p>
            {import.meta.env.DEV && (
              <button 
                onClick={() => {
                  console.log('🆘 Activating emergency bypass');
                  setEmergencyBypassActive(true);
                }}
                className="mt-4 px-3 py-2 bg-yellow-500 text-white rounded text-xs"
              >
                Activate Emergency Bypass
              </button>
            )}
          </div>
        </div>
      );
    }
    
    console.log(`🚀 [AuthGuard #${renderCount}] EXECUTING REDIRECT to / for user:`, user.email);
    console.log(`🚀 [AuthGuard #${renderCount}] Current path was:`, location.pathname);
    
    // Update last redirect time
    lastRedirectTime.current = now;
    trackRedirect('/auth', '/');
    return <Navigate to="/" replace />;
  }

  // ✅ User terautentikasi dan di halaman yang benar
  console.log(`✅ [AuthGuard #${renderCount}] Rendering protected content for user:`, user?.email);
  return <>{children}</>;
};

export default AuthGuard;