import React from 'react';
import { usePWA } from '@/utils/pwaUtils';
import { Download, Wifi, WifiOff, RefreshCw, Smartphone } from 'lucide-react';
import MobilePWAInstructions from './MobilePWAInstructions';
import { safeDom } from '@/utils/browserApiSafeWrappers';
import { safeStorageGet, safeStorageSet } from '@/utils/auth/safeStorage';


interface PWAInstallButtonProps {
  className?: string;
  showNetworkStatus?: boolean;
}

export default function PWAInstallButton({ 
  className = '', 
  showNetworkStatus = true 
}: PWAInstallButtonProps) {
  const { 
    canInstall, 
    isInstalled, 
    isOnline, 
    updateAvailable, 
    install, 
    updateApp 
  } = usePWA();

  const [isInstalling, setIsInstalling] = React.useState(false);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [showMobileInstructions, setShowMobileInstructions] = React.useState(false);
  const [isMobileDevice, setIsMobileDevice] = React.useState(false);

  React.useEffect(() => {
    // Detect if mobile device
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /android|iphone|ipad|ipod|windows phone/.test(userAgent);
    setIsMobileDevice(isMobile);
  }, []);

  const handleInstall = async () => {
    setIsInstalling(true);
    
    try {
      // Try direct installation first if available
      if (canInstall) {
        const success = await install();
        if (success) {
          console.log('PWA installed successfully');
          return;
        }
      }
      
      // If direct install not available or failed, show instructions on mobile
      if (isMobileDevice) {
        setShowMobileInstructions(true);
      } else {
        console.log('Install not available on this device/browser');
      }
    } catch (error) {
      console.error('PWA installation failed:', error);
      // Fallback to instructions on mobile
      if (isMobileDevice) {
        setShowMobileInstructions(true);
      }
    } finally {
      setIsInstalling(false);
    }
  };

  const handleUpdate = () => {
    setIsUpdating(true);
    updateApp();
  };

  if (isInstalled && !updateAvailable && !showNetworkStatus) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Network Status Indicator */}
      {showNetworkStatus && (
        <div className="flex items-center gap-1 text-sm">
          {isOnline ? (
            <>
              <Wifi className="w-4 h-4 text-green-500" />
              <span className="text-green-600 hidden sm:inline">Online</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-red-500" />
              <span className="text-red-600 hidden sm:inline">Offline</span>
            </>
          )}
        </div>
      )}

      {/* Update Available Button */}
      {updateAvailable && (
        <button
          onClick={handleUpdate}
          disabled={isUpdating}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
          title="Update aplikasi ke versi terbaru"
        >
          <RefreshCw className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">
            {isUpdating ? 'Updating...' : 'Update'}
          </span>
        </button>
      )}

      {/* Single Install Button - handles both direct install and fallback */}
      {!isInstalled && (
        <button
          onClick={handleInstall}
          disabled={isInstalling}
          className={`flex items-center gap-2 px-3 py-1.5 text-white text-sm rounded-lg transition-colors disabled:opacity-50 ${
            canInstall 
              ? 'bg-green-500 hover:bg-green-600' 
              : 'bg-orange-500 hover:bg-orange-600'
          }`}
          title={canInstall ? "Install aplikasi sekarang" : "Lihat cara install aplikasi"}
        >
          {canInstall ? (
            <Download className={`w-4 h-4 ${isInstalling ? 'animate-pulse' : ''}`} />
          ) : (
            <Smartphone className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">
            {isInstalling ? 'Installing...' : 'Install App'}
          </span>
        </button>
      )}

      {/* Installed Indicator */}
      {isInstalled && !updateAvailable && showNetworkStatus && (
        <div className="flex items-center gap-1 text-sm text-green-600">
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Installed</span>
        </div>
      )}
      
      {/* Mobile PWA Instructions Modal */}
      <MobilePWAInstructions 
        isOpen={showMobileInstructions}
        onClose={() => setShowMobileInstructions(false)}
      />
    </div>
  );
}

// PWA Status Component for debugging
export function PWAStatus() {
  const { canInstall, isInstalled, isOnline, updateAvailable, isPotentiallyInstallable } = usePWA();
  const [deviceInfo, setDeviceInfo] = React.useState({
    userAgent: '',
    isHTTPS: false,
    hasServiceWorker: false,
    hasManifest: false
  });
  const [isVisible, setIsVisible] = React.useState(() => {
    // Get initial visibility state from safeStorage
    return safeStorageGet('pwa-debug-visible') !== 'false';
  });

  React.useEffect(() => {
    setDeviceInfo({
      userAgent: navigator.userAgent.toLowerCase(),
      isHTTPS: window.location.protocol === 'https:' || window.location.hostname === 'localhost',
      hasServiceWorker: 'serviceWorker' in navigator,
      hasManifest: !!safeDom.querySelector('link[rel="manifest"]')
    });
  }, []);

  // Show in development and preview, but not in production
  const shouldShow = import.meta.env.DEV || 
                   (typeof window !== 'undefined' && (
                     window.location.hostname === 'localhost' ||
                     window.location.hostname.includes('preview.monifine.my.id')
                   ));
  
  if (!shouldShow) {
    return null;
  }

  const toggleVisibility = () => {
    const newVisibility = !isVisible;
    setIsVisible(newVisibility);
    safeStorageSet('pwa-debug-visible', newVisibility.toString()).catch(() => {
      // Best effort, ignore errors
    });
  };

  const isMobile = /android|iphone|ipad|ipod/.test(deviceInfo.userAgent);
  const browserType = deviceInfo.userAgent.includes('chrome') ? 'Chrome' : 
                     deviceInfo.userAgent.includes('safari') ? 'Safari' : 
                     deviceInfo.userAgent.includes('firefox') ? 'Firefox' : 'Other';

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={toggleVisibility}
        className="fixed bottom-4 right-4 bg-black/70 hover:bg-black/90 text-white p-2 rounded-full text-xs font-mono z-50 transition-all duration-200"
        title={isVisible ? "Hide PWA Debug" : "Show PWA Debug"}
      >
        {isVisible ? '🔍' : '👁️'}
      </button>

      {/* Debug Panel */}
      {isVisible && (
        <div className="fixed bottom-16 right-4 bg-black/90 text-white p-3 rounded-lg text-xs font-mono z-50 max-w-xs transition-all duration-300 animate-in slide-in-from-bottom-2">
          <div className="space-y-1">
            <div className="font-bold text-yellow-300 flex items-center justify-between">
              PWA Debug Status:
              <button
                onClick={toggleVisibility}
                className="text-gray-400 hover:text-white text-xs ml-2"
                title="Hide"
              >
                ✕
              </button>
            </div>
            <div>• Can Install (Prompt): {canInstall ? '✅' : '❌'}</div>
            <div>• Potentially Installable: {isPotentiallyInstallable() ? '✅' : '❌'}</div>
            <div>• Is Installed: {isInstalled ? '✅' : '❌'}</div>
            <div>• Is Online: {isOnline ? '✅' : '❌'}</div>
            <div>• Update Available: {updateAvailable ? '✅' : '❌'}</div>
            <div className="border-t border-gray-600 pt-1 mt-2">
              <div>• HTTPS: {deviceInfo.isHTTPS ? '✅' : '❌'}</div>
              <div>• Service Worker: {deviceInfo.hasServiceWorker ? '✅' : '❌'}</div>
              <div>• Manifest: {deviceInfo.hasManifest ? '✅' : '❌'}</div>
            </div>
            <div className="border-t border-gray-600 pt-1 mt-2">
              <div>• Device: {isMobile ? 'Mobile 📱' : 'Desktop 💻'}</div>
              <div>• Browser: {browserType}</div>
            </div>
            {!canInstall && isPotentiallyInstallable() && (
              <div className="border-t border-yellow-600 pt-1 mt-2 text-yellow-300">
                <div>ℹ️ Manual install available</div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
