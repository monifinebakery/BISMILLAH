// PWA Emergency Bypass - Handle authentication loops and stuck states
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { safePerformance } from '@/utils/browserApiSafeWrappers';


export interface PWAState {
  isStuck: boolean;
  reason: string;
  suggestedAction: string;
  canBypass: boolean;
}

/**
 * Detect if PWA is in a stuck authentication state
 */
export function detectPWAStuckState(): PWAState {
  const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
               (window.navigator as any).standalone === true;
  
  if (!isPWA) {
    return {
      isStuck: false,
      reason: 'Not running in PWA mode',
      suggestedAction: 'Use normal web version',
      canBypass: false
    };
  }

  const currentPath = window.location.pathname;
  const timeOnPage = safePerformance.now();
  
  // Check debug values if available
  const authReady = (window as any).__DEBUG_AUTH_READY__;
  const authLoading = (window as any).__DEBUG_AUTH_LOADING__;
  const authUser = (window as any).__DEBUG_AUTH_USER__;
  
  // Scenario 1: Stuck in loading for too long
  if (authLoading && !authReady && timeOnPage > 15000) {
    return {
      isStuck: true,
      reason: 'AuthContext stuck in loading state',
      suggestedAction: 'Clear cache and reload',
      canBypass: true
    };
  }
  
  // Scenario 2: User authenticated but stuck on auth page
  if (currentPath === '/auth' && authUser && authReady) {
    return {
      isStuck: true,
      reason: 'Authenticated user stuck on auth page',
      suggestedAction: 'Force redirect to main app',
      canBypass: true
    };
  }
  
  // Scenario 3: Rapid redirects (detect via session storage)
  const redirectCount = parseInt(sessionStorage.getItem('pwa_redirect_count') || '0');
  if (redirectCount > 3) {
    return {
      isStuck: true,
      reason: 'Too many redirects detected',
      suggestedAction: 'Clear session and force refresh',
      canBypass: true
    };
  }
  
  return {
    isStuck: false,
    reason: 'PWA state appears normal',
    suggestedAction: 'Continue normal operation',
    canBypass: false
  };
}

/**
 * Clear all authentication and caching data
 */
export async function clearAllAuthData(): Promise<void> {
  try {
    logger.warn('PWA Emergency: Clearing all auth data');
    
    // Clear local storage
    const authKeys = Object.keys(localStorage).filter(key => 
      key.includes('supabase') || 
      key.includes('auth') || 
      key.includes('session') ||
      key.includes('payment')
    );
    authKeys.forEach(key => localStorage.removeItem(key));
    
    // Clear session storage
    const sessionKeys = Object.keys(sessionStorage).filter(key => 
      key.includes('supabase') || 
      key.includes('auth') || 
      key.includes('session') ||
      key.includes('pwa')
    );
    sessionKeys.forEach(key => sessionStorage.removeItem(key));
    
    // Clear Supabase session
    await supabase.auth.signOut({ scope: 'global' });
    
    logger.success('PWA Emergency: All auth data cleared');
    
  } catch (error) {
    logger.error('PWA Emergency: Error clearing auth data:', error);
  }
}

/**
 * Force bypass authentication check
 */
export function forceBypassAuth(): void {
  logger.warn('PWA Emergency: Forcing auth bypass');
  
  // Set bypass flag
  sessionStorage.setItem('pwa_emergency_bypass', 'true');
  sessionStorage.setItem('pwa_emergency_bypass_time', Date.now().toString());
  
  // Clear redirect counter
  sessionStorage.removeItem('pwa_redirect_count');
  
  // Force navigate to main page
  window.location.href = '/';
}

/**
 * Check if emergency bypass is active
 */
export function isEmergencyBypassActive(): boolean {
  const bypass = sessionStorage.getItem('pwa_emergency_bypass');
  const bypassTime = sessionStorage.getItem('pwa_emergency_bypass_time');
  
  if (!bypass || !bypassTime) return false;
  
  // Bypass expires after 10 minutes
  const elapsed = Date.now() - parseInt(bypassTime);
  if (elapsed > 10 * 60 * 1000) {
    sessionStorage.removeItem('pwa_emergency_bypass');
    sessionStorage.removeItem('pwa_emergency_bypass_time');
    return false;
  }
  
  return bypass === 'true';
}

/**
 * Track redirect attempts to detect loops
 */
export function trackRedirect(from: string, to: string): void {
  const count = parseInt(sessionStorage.getItem('pwa_redirect_count') || '0');
  sessionStorage.setItem('pwa_redirect_count', (count + 1).toString());
  
  logger.debug('PWA: Redirect tracked', { 
    from, 
    to, 
    count: count + 1,
    timestamp: new Date().toISOString()
  });
  
  // If too many redirects, suggest emergency bypass
  if (count > 2) {
    logger.warn('PWA: Multiple redirects detected, consider emergency bypass');
    
    if (import.meta.env.DEV) {
      console.warn('🚨 PWA Redirect Loop Detected!');
      console.log('🔧 Emergency fix available: window.PWA_EMERGENCY_BYPASS()');
    }
  }
}

/**
 * Complete emergency recovery - clear everything and restart
 */
export async function emergencyRecovery(): Promise<void> {
  logger.error('PWA Emergency: Starting complete recovery');
  
  try {
    // 1. Clear all auth data
    await clearAllAuthData();
    
    // 2. Clear all browser caches if possible
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
    }
    
    // 3. Clear all storage
    localStorage.clear();
    sessionStorage.clear();
    
    // 4. Set recovery flag
    sessionStorage.setItem('pwa_recovered', 'true');
    sessionStorage.setItem('pwa_recovery_time', Date.now().toString());
    
    logger.success('PWA Emergency: Recovery completed');
    
    // 5. Force refresh
    window.location.reload();
    
  } catch (error) {
    logger.error('PWA Emergency: Recovery failed:', error);
    
    // Last resort: force refresh
    window.location.reload();
  }
}

// Development/Debug functions
if (import.meta.env.DEV) {
  // @ts-ignore
  window.PWA_EMERGENCY_BYPASS = forceBypassAuth;
  // @ts-ignore
  window.PWA_EMERGENCY_RECOVERY = emergencyRecovery;
  // @ts-ignore
  window.PWA_CLEAR_AUTH = clearAllAuthData;
  // @ts-ignore
  window.PWA_CHECK_STUCK = detectPWAStuckState;
}
