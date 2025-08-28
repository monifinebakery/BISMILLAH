// src/components/warehouse/components/WarehouseEmptyState.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Package, Plus, ShoppingCart, Search } from 'lucide-react';
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
  
  if (searchTerm) {
    // Search empty state
    return (
      <div className="flex flex-col items-center justify-center p-8 md:p-12 text-center">
        <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <Search className="w-8 h-8 md:w-10 md:h-10 text-gray-400" />
        </div>
        
        <h3 className="text-lg md:text-xl font-semibold text-gray-700 mb-3">
          Tidak ada hasil ditemukan
        </h3>
        <p className="text-sm md:text-base text-gray-600 mb-4 max-w-md">
          Pencarian untuk <strong>"{searchTerm}"</strong> tidak menemukan hasil. Coba ubah kata kunci atau filter yang digunakan.
        </p>
        
        <div className="text-sm text-gray-500">
          <span>Tip: Coba kata kunci yang lebih sederhana</span>
        </div>
      </div>
    );
  }
  
  // Default empty state
  return (
    <div className="flex flex-col items-center justify-center p-8 md:p-12 text-center">
      <Package className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mb-4" />
      <h3 className="text-base md:text-lg font-semibold text-gray-600 mb-2">
        Belum ada pembelian bahan baku
      </h3>
      <p className="text-sm md:text-base text-gray-500 mb-6 max-w-md px-4">
        Silakan tambah bahan baku melalui menu Pembelian.
      </p>
      <Button onClick={() => navigate('/pembelian')} className="flex items-center gap-2">
        <Package className="w-4 h-4" />
        Tambah Pembelian
      </Button>
    </div>
  );
};

export default WarehouseEmptyState;