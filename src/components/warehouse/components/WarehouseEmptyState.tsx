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
      <div className="flex flex-col items-center justify-center p-12 md:p-16 text-center bg-gradient-to-b from-gray-50 to-white rounded-2xl border-2 border-dashed border-gray-200">
        <div className="relative mb-6">
          <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center animate-pulse">
            <Search className="w-8 h-8 md:w-10 md:h-10 text-gray-400" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center animate-bounce">
            <span className="text-xs text-white font-bold">❌</span>
          </div>
        </div>
        
        <h3 className="text-xl md:text-2xl font-bold text-gray-700 mb-3 bg-gradient-to-r from-gray-600 to-gray-800 bg-clip-text text-transparent">
          🔍 Tidak ada hasil ditemukan
        </h3>
        <p className="text-base text-gray-600 mb-6 max-w-md leading-relaxed">
          Pencarian untuk <strong>“{searchTerm}”</strong> tidak menemukan hasil. Coba ubah kata kunci atau filter yang digunakan.
        </p>
        
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <span className="text-lg">💡</span>
            <span>Coba kata kunci yang lebih sederhana</span>
          </div>
        </div>
      </div>
    );
  }
  
  // Default empty state
  return (
    <div className="flex flex-col items-center justify-center p-12 md:p-16 text-center bg-gradient-to-b from-blue-50 to-indigo-50 rounded-2xl border-2 border-dashed border-blue-200">
      <div className="relative mb-8">
        <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full flex items-center justify-center shadow-lg animate-bounce">
          <div className="text-5xl md:text-6xl animate-pulse">📦</div>
        </div>
        <div className="absolute -top-2 -right-2 w-10 h-10 bg-gradient-to-r from-green-400 to-blue-400 rounded-full flex items-center justify-center animate-ping">
          <Plus className="h-5 w-5 text-white" />
        </div>
      </div>
      
      <h3 className="text-2xl md:text-3xl font-bold text-gray-700 mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
        🎆 Siap Mulai Kelola Gudang?
      </h3>
      <p className="text-base md:text-lg text-gray-600 mb-8 max-w-lg leading-relaxed">
        Belum ada bahan baku yang tercatat di gudang. Mari mulai dengan menambahkan pembelian bahan baku pertama Anda!
      </p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto mb-8">
        {[
          { icon: '🛍️', name: 'Tambah Pembelian' },
          { icon: '📊', name: 'Monitor Stok' },
          { icon: '🚨', name: 'Alert Otomatis' },
          { icon: '💰', name: 'Hitung Nilai Stok' }
        ].map((item, index) => (
          <div 
            key={item.name}
            className="flex items-center gap-3 text-sm bg-white bg-opacity-60 px-4 py-3 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:scale-105 border border-blue-100"
            style={{animationDelay: `${index * 100}ms`}}
          >
            <span className="text-lg">{item.icon}</span>
            <span className="font-medium text-gray-700">{item.name}</span>
          </div>
        ))}
      </div>
      
      <Button 
        onClick={() => navigate('/pembelian')} 
        size="lg" 
        className="group bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-8 py-4 text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
      >
        <ShoppingCart className="h-6 w-6 mr-3 group-hover:animate-bounce" />
        <span className="font-bold">Mulai Tambah Pembelian</span>
      </Button>
      
      <div className="flex items-center justify-center gap-6 mt-8 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <span className="text-lg animate-bounce">💡</span>
          <span>Tip: Data akan tersinkron otomatis ke semua menu</span>
        </div>
      </div>
    </div>
  );
};

export default WarehouseEmptyState;