// src/components/recipe/components/shared/EmptyState.tsx

import React from 'react';
import { Button } from '@/components/ui/button';
import { ChefHat, Search, Plus, Filter } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  type?: 'no-data' | 'no-results' | 'error';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  type = 'no-data',
}) => {
  const getIcon = () => {
    switch (type) {
      case 'no-results':
        return <Search className="w-12 h-12 text-gray-400" />;
      case 'error':
        return <Filter className="w-12 h-12 text-gray-400" />;
      default:
        return <ChefHat className="w-12 h-12 text-gray-400" />;
    }
  };

  const getIllustration = () => {
    if (type === 'no-data') {
      return (
        <div className="relative">
          <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center">
            {getIcon()}
          </div>
          {/* Decorative elements */}
          <div className="absolute top-8 left-1/2 transform -translate-x-1/2 -translate-y-2">
            <div className="w-2 h-2 bg-orange-300 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
          </div>
          <div className="absolute top-12 right-1/3 transform translate-x-2">
            <div className="w-1.5 h-1.5 bg-red-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
          <div className="absolute top-16 left-1/3 transform -translate-x-2">
            <div className="w-1 h-1 bg-yellow-300 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      );
    }

    return (
      <div className="w-24 h-24 mx-auto mb-6 bg-gray-400 rounded-full flex items-center justify-center">
        {getIcon()}
      </div>
    );
  };

  return (
    <div className="text-center py-12 px-6">
      {getIllustration()}
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {title}
      </h3>
      
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        {description}
      </p>

      {actionLabel && onAction && (
        <Button onClick={onAction} className="bg-orange-500 hover:bg-orange-600 text-white">
          {type === 'no-data' ? (
            <>
              <Plus className="w-4 h-4 mr-2" />
              {actionLabel}
            </>
          ) : (
            actionLabel
          )}
        </Button>
      )}

      {/* Additional help text for no-data state */}
      {type === 'no-data' && (
        <div className="mt-8 p-4 bg-orange-50 rounded-lg max-w-md mx-auto">
          <h4 className="text-sm font-medium text-orange-900 mb-2">
            Tips untuk memulai:
          </h4>
          <ul className="text-sm text-orange-700 space-y-1 text-left">
            <li>• Tambahkan resep favorit Anda</li>
            <li>• Hitung HPP untuk menentukan harga jual</li>
            <li>• Kelompokkan resep berdasarkan kategori</li>
            <li>• Analisis profitabilitas setiap resep</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default EmptyState;