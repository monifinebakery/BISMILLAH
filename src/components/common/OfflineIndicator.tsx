// src/components/common/OfflineIndicator.tsx
import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { usePWA } from '@/utils/pwaUtils';
import { offlineQueue } from '@/utils/offlineQueue';

export const OfflineIndicator: React.FC = () => {
  const { isOnline } = usePWA();
  const [showIndicator, setShowIndicator] = useState(false);
  const [pendingOperations, setPendingOperations] = useState(0);

  // Update pending operations count
  useEffect(() => {
    const updatePendingCount = () => {
      const status = offlineQueue.getQueueStatus();
      setPendingOperations(status.totalOperations);
    };

    updatePendingCount();

    // Update every 2 seconds when offline
    const interval = setInterval(() => {
      if (!isOnline) {
        updatePendingCount();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isOnline]);

  // Show indicator briefly when coming back online
  useEffect(() => {
    if (isOnline && !showIndicator) {
      setShowIndicator(true);
      const timer = setTimeout(() => setShowIndicator(false), 3000);
      return () => clearTimeout(timer);
    } else if (!isOnline) {
      setShowIndicator(true);
      // No cleanup needed for offline state
      return () => {};
    }
    // Default return for other cases
    return () => {};
  }, [isOnline, showIndicator]);

  if (!showIndicator) return null;

  return (
    <div className={`fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg transition-all duration-300 z-50 ${
      isOnline
        ? 'bg-green-500 text-white border border-green-400'
        : 'bg-red-500 text-white border border-red-400 animate-pulse'
    }`}>
      <div className="flex items-center gap-2">
        {isOnline ? (
          <>
            <Wifi className="w-4 h-4" />
            <span className="text-sm font-medium">Online</span>
            {pendingOperations > 0 && (
              <span className="text-xs bg-green-600 px-2 py-1 rounded animate-pulse">
                {pendingOperations} sync pending
              </span>
            )}
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">Offline Mode</span>
              <span className="text-xs opacity-90">
                Perubahan tersimpan lokal
              </span>
            </div>
            {pendingOperations > 0 && (
              <div className="flex items-center gap-1 text-xs bg-red-600 px-2 py-1 rounded">
                <AlertCircle className="w-3 h-3" />
                {pendingOperations} queued
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
