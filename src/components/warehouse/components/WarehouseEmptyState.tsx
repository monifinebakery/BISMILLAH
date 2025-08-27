// src/components/warehouse/components/WarehouseEmptyState.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface WarehouseEmptyStateProps {
  searchTerm: string;
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
}) => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center p-8 md:p-12 text-center">
      <Package className="w-12 h-12 md:w-16 md:h-16 text-gray-500 mb-4" />
      <h3 className="text-base md:text-lg font-semibold text-gray-600 mb-2">
        {searchTerm ? 'Tidak ada hasil ditemukan' : 'Belum ada pembelian bahan baku'}
      </h3>
      <p className="text-sm md:text-base text-gray-500 mb-6 max-w-md px-4">
        {searchTerm
          ? `Coba ubah kata kunci pencarian atau filter yang digunakan.`
          : 'Silakan tambah bahan baku melalui menu Pembelian.'
        }
      </p>
      {!searchTerm && (
        <Button onClick={() => navigate('/pembelian')} className="flex items-center gap-2">
          <Package className="w-4 h-4" />
          Tambah Pembelian
        </Button>
      )}
    </div>
  );
};

export default WarehouseEmptyState;