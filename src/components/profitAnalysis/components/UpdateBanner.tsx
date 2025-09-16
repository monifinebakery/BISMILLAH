import React from 'react';

interface UpdateBannerProps {
  onRefresh?: () => void;
}

const UpdateBanner: React.FC<UpdateBannerProps> = ({ onRefresh }) => {
  const handleClick = () => {
    if (onRefresh) return onRefresh();
    window.location.reload();
  };

  return (
    <div className="w-full border border-gray-200 bg-white rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div className="text-sm sm:text-base text-gray-900">
        🎉 Update tersedia! Silakan refresh aplikasi anda.
      </div>
      <button
        onClick={handleClick}
        className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md border border-gray-300 text-gray-900 bg-white hover:bg-gray-50 transition-colors w-full sm:w-auto"
      >
        Refresh
      </button>
    </div>
  );
};

export default UpdateBanner;

