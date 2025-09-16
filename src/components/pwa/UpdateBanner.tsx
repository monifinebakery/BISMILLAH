// src/components/pwa/UpdateBanner.tsx
import React, { useState, useEffect } from 'react';
import { usePWA } from '@/utils/pwaUtils';
import { RefreshCw, Download, CheckCircle } from 'lucide-react';

export function UpdateBanner() {
  const { updateAvailable, updateApp } = usePWA();
  const [swState, setSwState] = useState('activated');

  useEffect(() => {
    const handleStateChange = (event: any) => {
      setSwState(event.detail);
    };
    window.addEventListener('sw-state-change', handleStateChange);
    return () => {
      window.removeEventListener('sw-state-change', handleStateChange);
    };
  }, []);

  const handleUpdate = () => {
    updateApp();
  };

  // Jangan tampilkan apapun jika service worker sedang aktif dan tidak ada update
  if (swState === 'activated' && !updateAvailable) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-3">
      {swState === 'installing' && (
        <>
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Building...</span>
        </>
      )}
      {swState === 'installed' && updateAvailable && (
        <>
          <Download className="w-4 h-4" />
          <span>Update Ready</span>
          <button 
            onClick={handleUpdate}
            className="ml-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm"
          >
            Update Now
          </button>
        </>
      )}
      {swState === 'activated' && updateAvailable && (
        <>
          <Download className="w-4 h-4" />
          <span>Update Ready</span>
          <button 
            onClick={handleUpdate}
            className="ml-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm"
          >
            Update Now
          </button>
        </>
      )}
    </div>
  );
}