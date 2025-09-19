// src/components/recipe/components/shared/LoadingState.tsx

import React from 'react';
import { ChefHat } from 'lucide-react';

export const LoadingState: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
      <div className="text-center">
        <ChefHat className="w-16 h-16 text-orange-500 mx-auto mb-4 animate-bounce" />
        <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Memuat Resep</h2>
        <p className="text-gray-600">Sedang menyiapkan data resep untuk Anda...</p>
      </div>
    </div>
  );
};

export default LoadingState;