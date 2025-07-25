// src/components/orders/components/EmptyState.tsx
import React from 'react';
import { Package, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  hasFilters: boolean;
  onAddFirst?: () => void;
  onClearFilters?: () => void;
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  hasFilters,
  onAddFirst,
  onClearFilters,
  className = ""
}) => {
  if (hasFilters) {
    return (
      <div className={`flex flex-col items-center gap-4 py-12 ${className}`}>
        <Search className="h-16 w-16 text-gray-300" />
        <div className="text-center">
          <p className="text-lg font-medium text-gray-600 mb-2">
            Tidak ada pesanan yang cocok dengan filter
          </p>
          <p className="text-gray-500 text-sm mb-4">
            Coba ubah filter pencarian Anda
          </p>
        </div>
        {onClearFilters && (
          <Button
            onClick={onClearFilters}
            variant="outline"
            className="border-gray-300 text-gray-600 hover:bg-gray-50"
          >
            Hapus Semua Filter
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center gap-4 py-12 ${className}`}>
      <Package className="h-16 w-16 text-gray-300" />
      <div className="text-center">
        <p className="text-lg font-medium text-gray-600 mb-2">
          Belum ada pesanan
        </p>
        <p className="text-gray-500 text-sm mb-4">
          Mulai dengan menambahkan pesanan pertama
        </p>
      </div>
      {onAddFirst && (
        <Button
          onClick={onAddFirst}
          className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg shadow-md transition-all duration-200"
        >
          <Plus className="h-4 w-4 mr-2" />
          Tambah Pesanan Pertama
        </Button>
      )}
    </div>
  );
};

export default EmptyState;