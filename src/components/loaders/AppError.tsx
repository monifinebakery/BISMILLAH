// src/components/loaders/AppError.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

interface AppErrorProps {
  title?: string;
  onRetry?: () => void;
  showRetry?: boolean;
}

export const AppError: React.FC<AppErrorProps> = ({ 
  title = "Terjadi Kesalahan", 
  onRetry, 
  showRetry = true 
}) => {
  const navigate = useNavigate();
  
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50 z-50">
      <div className="flex flex-col items-center justify-center p-8 text-center max-w-md">
        <div className="bg-red-100 rounded-full p-6 mb-6">
          <div className="h-12 w-12 text-red-500 text-3xl flex items-center justify-center">⚠️</div>
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-3">{title}</h3>
        <p className="text-gray-600 mb-6 leading-relaxed">
          Gagal memuat halaman. Silakan coba lagi atau kembali ke dashboard.
        </p>
        <div className="flex gap-3">
          {showRetry && (
            <button
              onClick={onRetry || (() => window.location.reload())}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-6 py-2 rounded-lg transition-all"
            >
              Muat Ulang
            </button>
          )}
          <button
            onClick={() => navigate('/')}
            className="border border-gray-500 text-gray-700 hover:bg-gray-50 px-6 py-2 rounded-lg transition-colors"
          >
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};