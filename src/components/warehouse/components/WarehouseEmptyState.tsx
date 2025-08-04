// src/components/warehouse/components/WarehouseEmptyState.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Package } from 'lucide-react';

interface WarehouseEmptyStateProps {
  searchTerm: string;
  onEmptyStateAction: () => void;
}

/**
 * Empty State Component for Warehouse
 * 
 * Features:
 * - Contextual messaging based on search state
 * - Call-to-action button
 * - Responsive design
 * - Friendly illustrations
 * 
 * Size: ~1KB
 */
const WarehouseEmptyState: React.FC<WarehouseEmptyStateProps> = ({
  searchTerm,
  onEmptyStateAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 md:p-12 text-center">
      <Package className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mb-4" />
      <h3 className="text-base md:text-lg font-semibold text-gray-600 mb-2">
        {searchTerm ? 'Tidak ada hasil ditemukan' : 'Belum ada bahan baku'}
      </h3>
      <p className="text-sm md:text-base text-gray-500 mb-6 max-w-md px-4">
        {searchTerm 
          ? `Coba ubah kata kunci pencarian atau filter yang digunakan.`
          : 'Mulai kelola inventori Anda dengan menambahkan bahan baku pertama.'
        }
      </p>
      {!searchTerm && (
        <Button onClick={onEmptyStateAction} className="flex items-center gap-2">
          <Package className="w-4 h-4" />
          Tambah Bahan Baku
        </Button>
      )}
    </div>
  );
};

export default WarehouseEmptyState;