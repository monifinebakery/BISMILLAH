// src/components/routing/RouteErrorFallback.tsx
import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, RefreshCw, Home, LogOut, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { pwaManager } from '@/utils/pwaUtils';
import { logger } from '@/utils/logger';

interface RouteErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
  routeName?: string;
  showLoginFallback?: boolean;
}

/**
 * Enhanced Route Error Fallback Component
 * Provides comprehensive error recovery for mobile/PWA chunk loading failures
 */
export const RouteErrorFallback: React.FC<RouteErrorFallbackProps> = ({
  error,
  resetErrorBoundary,
  routeName,
  showLoginFallback = true
}) => {
  const navigate = useNavigate();
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState<string>('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Detect different types of errors
  const isChunkError = /dynamically imported module|ChunkLoadError|Importing a module script failed|Loading chunk \d+ failed/i.test(
    error?.message || ''
  );
  
  const isNetworkError = /NetworkError|Failed to fetch|ERR_NETWORK|ERR_INTERNET_DISCONNECTED/i.test(
    error?.message || ''
  );

  const isServiceWorkerError = /service worker|sw\.js|workbox/i.test(
    error?.message || ''
  );

  // Monitor online status
  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Log error for monitoring
  React.useEffect(() => {
    logger.error('Route Error Fallback triggered', {
      routeName,
      errorMessage: error.message,
      errorStack: error.stack,
      isChunkError,
      isNetworkError,
      isServiceWorkerError,
      isOnline,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    });
  }, [error, routeName, isChunkError, isNetworkError, isServiceWorkerError, isOnline]);

  /**
   * Comprehensive cache and service worker cleanup
   */
  const performCacheCleanup = useCallback(async () => {
    setRecoveryStep('Membersihkan cache...');
    
    try {
      // Clear all caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        const clearPromises = cacheNames.map(cacheName => {
          logger.info(`Clearing cache: ${cacheName}`);
          return caches.delete(cacheName);
        });
        await Promise.all(clearPromises);
      }

      // Clear localStorage and sessionStorage selectively
      const keysToPreserve = ['auth_token', 'user_preferences', 'theme'];
      const localStorageKeys = Object.keys(localStorage);
      
      localStorageKeys.forEach(key => {
        if (!keysToPreserve.some(preserve => key.includes(preserve))) {
          localStorage.removeItem(key);
        }
      });

      // Clear sessionStorage completely
      sessionStorage.clear();

      setRecoveryStep('Cache berhasil dibersihkan');
      return true;
    } catch (error) {
      logger.error('Cache cleanup failed:', error);
      setRecoveryStep('Gagal membersihkan cache');
      return false;
    }
  }, []);

  /**
   * Service Worker recovery
   */
  const performServiceWorkerRecovery = useCallback(async () => {
    setRecoveryStep('Memperbarui Service Worker...');
    
    try {
      // Unregister all service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(
          registrations.map(registration => {
            logger.info('Unregistering service worker:', registration.scope);
            return registration.unregister();
          })
        );
      }

      // Update PWA
      await pwaManager.updateServiceWorker();
      pwaManager.skipWaiting();

      setRecoveryStep('Service Worker berhasil diperbarui');
      return true;
    } catch (error) {
      logger.error('Service Worker recovery failed:', error);
      setRecoveryStep('Gagal memperbarui Service Worker');
      return false;
    }
  }, []);

  /**
   * Full recovery process
   */
  const handleFullRecovery = useCallback(async () => {
    setIsRecovering(true);
    
    try {
      // Step 1: Cache cleanup
      await performCacheCleanup();
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 2: Service Worker recovery
      if (isServiceWorkerError || isChunkError) {
        await performServiceWorkerRecovery();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Step 3: Hard reload with cache busting
      setRecoveryStep('Memuat ulang aplikasi...');
      const url = new URL(window.location.href);
      url.searchParams.set('v', Date.now().toString());
      url.searchParams.set('recovery', 'true');
      
      // Use replace to avoid back button issues
      window.location.replace(url.toString());
      
    } catch (error) {
      logger.error('Full recovery failed:', error);
      setRecoveryStep('Pemulihan gagal, silakan muat ulang manual');
      setIsRecovering(false);
    }
  }, [performCacheCleanup, performServiceWorkerRecovery, isServiceWorkerError, isChunkError]);

  /**
   * Simple retry without full recovery
   */
  const handleSimpleRetry = useCallback(() => {
    logger.info('Simple retry triggered for route:', routeName);
    resetErrorBoundary();
  }, [resetErrorBoundary, routeName]);

  /**
   * Navigate to home
   */
  const handleGoHome = useCallback(() => {
    logger.info('Navigating to home from error fallback');
    navigate('/', { replace: true });
  }, [navigate]);

  /**
   * Navigate to login
   */
  const handleGoToLogin = useCallback(() => {
    logger.info('Navigating to login from error fallback');
    // Clear auth data
    localStorage.removeItem('auth_token');
    sessionStorage.clear();
    navigate('/login', { replace: true });
  }, [navigate]);

  /**
   * Get error type specific message
   */
  const getErrorMessage = () => {
    if (!isOnline) {
      return 'Tidak ada koneksi internet. Periksa koneksi Anda dan coba lagi.';
    }
    
    if (isChunkError) {
      return 'Gagal memuat komponen aplikasi. Ini biasanya terjadi karena pembaruan aplikasi atau masalah cache.';
    }
    
    if (isNetworkError) {
      return 'Terjadi masalah jaringan. Periksa koneksi internet Anda.';
    }
    
    if (isServiceWorkerError) {
      return 'Terjadi masalah dengan Service Worker. Aplikasi perlu dimuat ulang.';
    }
    
    return error.message || 'Terjadi kesalahan yang tidak diketahui.';
  };

  /**
   * Get recovery suggestions
   */
  const getRecoverySuggestions = () => {
    const suggestions = [];
    
    if (!isOnline) {
      suggestions.push('Periksa koneksi internet Anda');
      suggestions.push('Coba beralih ke WiFi atau data seluler');
    } else if (isChunkError || isServiceWorkerError) {
      suggestions.push('Bersihkan cache browser');
      suggestions.push('Tutup dan buka kembali aplikasi');
      suggestions.push('Restart browser atau aplikasi');
    } else {
      suggestions.push('Coba muat ulang halaman');
      suggestions.push('Periksa koneksi internet');
    }
    
    return suggestions;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto shadow-lg">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            {!isOnline ? (
              <WifiOff className="h-16 w-16 text-red-500" />
            ) : (
              <AlertTriangle className="h-16 w-16 text-orange-500" />
            )}
          </div>
          <CardTitle className="text-xl font-bold text-gray-900">
            {!isOnline ? 'Tidak Ada Koneksi' : 'Terjadi Kesalahan'}
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            {routeName && `Halaman: ${routeName}`}
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Error Message */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">
              {getErrorMessage()}
            </p>
          </div>

          {/* Recovery Status */}
          {isRecovering && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                <p className="text-sm text-blue-800">{recoveryStep}</p>
              </div>
            </div>
          )}

          {/* Online Status */}
          <div className="flex items-center gap-2 text-sm">
            {isOnline ? (
              <>
                <Wifi className="h-4 w-4 text-green-500" />
                <span className="text-green-600">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-red-500" />
                <span className="text-red-600">Offline</span>
              </>
            )}
          </div>

          {/* Recovery Suggestions */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Saran Pemulihan:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              {getRecoverySuggestions().map((suggestion, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-gray-400">•</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Primary Recovery Actions */}
            <div className="grid grid-cols-1 gap-2">
              {!isOnline ? (
                <Button
                  onClick={handleSimpleRetry}
                  disabled={isRecovering}
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Coba Lagi
                </Button>
              ) : (
                <>
                  <Button
                    onClick={handleSimpleRetry}
                    disabled={isRecovering}
                    variant="outline"
                    className="w-full"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Coba Lagi
                  </Button>
                  
                  {(isChunkError || isServiceWorkerError) && (
                    <Button
                      onClick={handleFullRecovery}
                      disabled={isRecovering}
                      className="w-full bg-orange-500 hover:bg-orange-600"
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${isRecovering ? 'animate-spin' : ''}`} />
                      {isRecovering ? 'Memulihkan...' : 'Perbaiki & Muat Ulang'}
                    </Button>
                  )}
                </>
              )}
            </div>

            {/* Navigation Actions */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={handleGoHome}
                disabled={isRecovering}
                variant="outline"
                size="sm"
              >
                <Home className="h-4 w-4 mr-1" />
                Beranda
              </Button>
              
              {showLoginFallback && (
                <Button
                  onClick={handleGoToLogin}
                  disabled={isRecovering}
                  variant="outline"
                  size="sm"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Login
                </Button>
              )}
            </div>
          </div>

          {/* Technical Details (Development) */}
          {import.meta.env.DEV && (
            <details className="bg-gray-100 rounded-lg p-3">
              <summary className="text-xs font-medium text-gray-700 cursor-pointer">
                Detail Teknis
              </summary>
              <div className="mt-2 text-xs text-gray-600 space-y-1">
                <div><strong>Error:</strong> {error.message}</div>
                <div><strong>Route:</strong> {routeName || 'Unknown'}</div>
                <div><strong>Chunk Error:</strong> {isChunkError ? 'Yes' : 'No'}</div>
                <div><strong>Network Error:</strong> {isNetworkError ? 'Yes' : 'No'}</div>
                <div><strong>SW Error:</strong> {isServiceWorkerError ? 'Yes' : 'No'}</div>
                <div><strong>Online:</strong> {isOnline ? 'Yes' : 'No'}</div>
                <div><strong>User Agent:</strong> {navigator.userAgent}</div>
              </div>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RouteErrorFallback;
