import React, { useState, useEffect } from 'react';
import { usePWA } from '@/utils/pwaUtils';

const UpdateBanner: React.FC = () => {
  const { updateAvailable, updateApp } = usePWA();
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

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-blue-600 text-white px-4 py-3 shadow-lg">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <span className="text-lg">🔄</span>
          <span className="font-medium">Update tersedia</span>
        </div>
        <button
          onClick={updateApp}
          className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 whitespace-nowrap"
        >
          Refresh
        </button>
      </div>
    </div>
  );
};

export default UpdateBanner;
