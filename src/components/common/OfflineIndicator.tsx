import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OfflineIndicatorProps {
  className?: string;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ className }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showIndicator, setShowIndicator] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'slow' | 'offline'>('good');

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setConnectionQuality('good');
      // Show "back online" message briefly
      setShowIndicator(true);
      setTimeout(() => setShowIndicator(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setConnectionQuality('offline');
      setShowIndicator(true);
    };

    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check connection quality periodically
    const checkConnection = async () => {
      if (!navigator.onLine) {
        setConnectionQuality('offline');
        return;
      }

      try {
        const startTime = Date.now();
        // Quick fetch to check connection speed
        const response = await fetch('/favicon.ico', { 
          method: 'HEAD',
          cache: 'no-cache'
        });
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        if (responseTime < 500) {
          setConnectionQuality('good');
        } else {
          setConnectionQuality('slow');
        }
      } catch (error) {
        setConnectionQuality('offline');
      }
    };

    // Check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000);
    checkConnection(); // Initial check

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  // Always show when offline, show briefly when coming back online
  const shouldShow = !isOnline || (isOnline && showIndicator);

  if (!shouldShow) return null;

  const getStatusConfig = () => {
    if (!isOnline) {
      return {
        icon: WifiOff,
        text: 'Offline Mode',
        subtext: 'Beberapa fitur mungkin terbatas',
        bgColor: 'bg-red-500',
        textColor: 'text-white',
        borderColor: 'border-red-600'
      };
    }

    if (connectionQuality === 'slow') {
      return {
        icon: AlertCircle,
        text: 'Koneksi Lambat',
        subtext: 'Performa mungkin lebih lambat',
        bgColor: 'bg-yellow-500',
        textColor: 'text-black',
        borderColor: 'border-yellow-600'
      };
    }

    return {
      icon: CheckCircle,
      text: 'Kembali Online',
      subtext: 'Semua fitur tersedia',
      bgColor: 'bg-green-500',
      textColor: 'text-white',
      borderColor: 'border-green-600'
    };
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={cn(
      'fixed bottom-4 left-4 z-50 animate-in slide-in-from-bottom-2 duration-300',
      className
    )}>
      <div className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border',
        'backdrop-blur-sm bg-opacity-95',
        config.bgColor,
        config.textColor,
        config.borderColor
      )}>
        <Icon className="h-5 w-5 flex-shrink-0" />
        <div className="flex flex-col">
          <span className="text-sm font-semibold leading-tight">
            {config.text}
          </span>
          <span className="text-xs opacity-90 leading-tight">
            {config.subtext}
          </span>
        </div>
        
        {/* Connection quality indicator for online state */}
        {isOnline && connectionQuality !== 'offline' && (
          <div className="flex items-center gap-1 ml-2">
            <div className={cn(
              'w-2 h-2 rounded-full',
              connectionQuality === 'good' ? 'bg-green-300' : 'bg-yellow-300'
            )} />
            <div className={cn(
              'w-2 h-2 rounded-full',
              connectionQuality === 'good' ? 'bg-green-300' : 'bg-gray-400'
            )} />
            <div className={cn(
              'w-2 h-2 rounded-full',
              connectionQuality === 'good' ? 'bg-green-300' : 'bg-gray-400'
            )} />
          </div>
        )}
      </div>
    </div>
  );
};
