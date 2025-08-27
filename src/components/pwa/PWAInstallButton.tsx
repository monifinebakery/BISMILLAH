import React from 'react';
import { usePWA } from '@/utils/pwaUtils';
import { Download, Wifi, WifiOff, RefreshCw, Smartphone } from 'lucide-react';
import MobilePWAInstructions from './MobilePWAInstructions';

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
    // On mobile, show instructions instead of trying direct install
    if (isMobileDevice && !canInstall) {
      setShowMobileInstructions(true);
      return;
    }

    setIsInstalling(true);
    try {
      const success = await install();
      if (success) {
        console.log('PWA installed successfully');
      } else if (isMobileDevice) {
        // If install failed on mobile, show instructions
        setShowMobileInstructions(true);
      }
    } catch (error) {
      console.error('PWA installation failed:', error);
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

      {/* Install Button */}
      {canInstall && !isInstalled && (
        <button
          onClick={handleInstall}
          disabled={isInstalling}
          className="flex items-center gap-2 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
          title="Install aplikasi ke perangkat"
        >
          <Download className={`w-4 h-4 ${isInstalling ? 'animate-pulse' : ''}`} />
          <span className="hidden sm:inline">
            {isInstalling ? 'Installing...' : 'Install App'}
          </span>
        </button>
      )}

      {/* Mobile Install Button (when install prompt not available) */}
      {!canInstall && !isInstalled && isMobileDevice && (
        <button
          onClick={() => setShowMobileInstructions(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm rounded-lg transition-colors"
          title="Lihat cara install aplikasi"
        >
          <Smartphone className="w-4 h-4" />
          <span className="hidden sm:inline">Install App</span>
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
  const { canInstall, isInstalled, isOnline, updateAvailable } = usePWA();

  // Show in development and preview modes
  const shouldShow = import.meta.env.DEV || 
                   (typeof window !== 'undefined' && window.location.hostname.includes('preview'));
  
  if (!shouldShow) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-3 rounded-lg text-xs font-mono z-50">
      <div className="space-y-1">
        <div>PWA Status:</div>
        <div>• Can Install: {canInstall ? '✅' : '❌'}</div>
        <div>• Is Installed: {isInstalled ? '✅' : '❌'}</div>
        <div>• Is Online: {isOnline ? '✅' : '❌'}</div>
        <div>• Update Available: {updateAvailable ? '✅' : '❌'}</div>
      </div>
    </div>
  );
}