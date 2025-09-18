// src/components/warehouse/components/WarehouseEmptyState.tsx
import React from 'react';
import { EmptyState } from '@/components/ui';
import { Package, Search } from 'lucide-react';
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
      <EmptyState
        icon={Search}
        title="Tidak ada hasil ditemukan"
        description={`Pencarian untuk "${searchTerm}" tidak menemukan hasil. Coba ubah kata kunci atau filter yang digunakan.`}
        size="lg"
        customIllustration={
          <div className="text-sm text-gray-500 mt-4">
            💡 Tip: Coba kata kunci yang lebih sederhana
          </div>
        }
      />
    );
  }
  
  // Default empty state
  return (
    <EmptyState
      illustration="package"
      title="Belum ada pembelian bahan baku"
      description="Silakan tambah bahan baku melalui menu Pembelian."
      actionText="Tambah Pembelian"
      onAction={() => navigate('/pembelian')}
      size="lg"
    />
  );
};

export default WarehouseEmptyState;