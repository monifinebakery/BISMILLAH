import React, { useState, useEffect } from 'react';
import { usePWA } from '@/utils/pwaUtils';
import { useIsMobile } from "@/hooks/use-mobile";

const UpdateBanner: React.FC = () => {
  const { updateAvailable, updateApp } = usePWA();
  const isMobile = useIsMobile();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (updateAvailable) {
      // Delay 3 detik sebelum tampilkan banner
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      setShowBanner(false);
    }
  }, [updateAvailable]);

  if (!showBanner) return null;

  // Mobile version: Header-integrated banner with brief description
  if (isMobile) {
    return (
      <div className="bg-blue-600 text-white px-3 py-2 border-b border-blue-500">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-sm">🔄</span>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium">Update tersedia</div>
              <div className="text-xs opacity-90 truncate">Fitur & perbaikan terbaru</div>
            </div>
          </div>
          <button
            onClick={updateApp}
            className="bg-white text-blue-600 px-2 py-1 rounded text-xs font-medium hover:bg-blue-50 transition-colors focus:outline-none focus:ring-1 focus:ring-blue-300 flex-shrink-0"
          >
            Update
          </button>
        </div>
      </div>
    );
  }

  // Desktop version: Original overlay banner with detailed description
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-blue-600 text-white px-4 py-3 shadow-lg">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <span className="text-lg">🔄</span>
          <div>
            <div className="font-medium">Update tersedia</div>
            <div className="text-sm opacity-90">Fitur baru & perbaikan keamanan sudah siap digunakan</div>
          </div>
        </div>
        <button
          onClick={updateApp}
          className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 whitespace-nowrap"
        >
          Refresh Sekarang
        </button>
      </div>
    </div>
  );
};

export default UpdateBanner;
