import React from 'react';
import { Loader2, ShoppingCart } from 'lucide-react';

interface LoadingPurchaseStateProps {
  compact?: boolean;
  message?: string;
  className?: string;
}

const LoadingPurchaseState: React.FC<LoadingPurchaseStateProps> = ({
  compact = false,
  message = 'Memuat data pembelian...',
  className = '',
}) => {
  if (compact) {
    return (
      <div className={`flex items-center justify-center gap-3 ${className}`}>
        <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
        <span className="text-gray-600 font-medium">{message}</span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center py-16 px-8 ${className}`}>
      {/* Animated Icon */}
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-orange-100 rounded-full animate-ping"></div>
        <div className="relative bg-orange-500 rounded-full p-4">
          <ShoppingCart className="h-8 w-8 text-white" />
        </div>
      </div>

      {/* Loading Spinner */}
      <div className="flex items-center gap-3 mb-4">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        <span className="text-xl font-semibold text-gray-700">{message}</span>
      </div>

      {/* Loading Details */}
      <p className="text-gray-500 text-center max-w-md">
        Sedang mengambil data pembelian terbaru dari server. Mohon tunggu sebentar.
      </p>

      {/* Loading Progress Bar */}
      <div className="w-64 bg-gray-200 rounded-full h-2 mt-6">
        <div className="bg-orange-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
      </div>

      {/* Loading Steps */}
      <div className="mt-6 text-sm text-gray-400 text-center space-y-1">
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>Menghubungkan ke database</span>
        </div>
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
          <span>Mengambil data pembelian</span>
        </div>
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
          <span>Memproses data</span>
        </div>
      </div>
    </div>
  );
};

export default LoadingPurchaseState;