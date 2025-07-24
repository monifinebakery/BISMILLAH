import React from 'react';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Plus, Search, RefreshCw } from 'lucide-react';

interface EmptyPurchaseStateProps {
  searchTerm?: string;
  onAddPurchase?: () => void;
  onClearSearch?: () => void;
  compact?: boolean;
  className?: string;
}

const EmptyPurchaseState: React.FC<EmptyPurchaseStateProps> = ({
  searchTerm,
  onAddPurchase,
  onClearSearch,
  compact = false,
  className = '',
}) => {
  const isSearchResult = Boolean(searchTerm && searchTerm.trim());

  if (compact) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-600 font-medium mb-2">
          {isSearchResult ? 'Tidak ada hasil pencarian' : 'Belum ada pembelian'}
        </p>
        <p className="text-gray-500 text-sm">
          {isSearchResult 
            ? 'Coba ubah kata kunci pencarian Anda'
            : 'Mulai dengan menambahkan pembelian pertama'
          }
        </p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center py-16 px-8 text-center ${className}`}>
      {/* Icon */}
      <div className="relative mb-8">
        <div className="bg-gray-100 rounded-full p-6 mb-4">
          {isSearchResult ? (
            <Search className="h-16 w-16 text-gray-400" />
          ) : (
            <ShoppingCart className="h-16 w-16 text-gray-400" />
          )}
        </div>
        {!isSearchResult && (
          <div className="absolute -bottom-2 -right-2 bg-orange-500 rounded-full p-2">
            <Plus className="h-4 w-4 text-white" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto">
        <h3 className="text-xl font-semibold text-gray-800 mb-3">
          {isSearchResult 
            ? `Tidak ada hasil untuk "${searchTerm}"`
            : 'Belum ada data pembelian'
          }
        </h3>
        
        <p className="text-gray-600 mb-6 leading-relaxed">
          {isSearchResult ? (
            <>
              Tidak ditemukan pembelian yang cocok dengan pencarian Anda. 
              Coba gunakan kata kunci yang berbeda atau periksa ejaan.
            </>
          ) : (
            <>
              Anda belum memiliki catatan pembelian bahan baku. 
              Mulai kelola pembelian Anda dengan menambahkan transaksi pertama.
            </>
          )}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {isSearchResult ? (
            <>
              {onClearSearch && (
                <Button
                  onClick={onClearSearch}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Bersihkan Pencarian
                </Button>
              )}
              {onAddPurchase && (
                <Button
                  onClick={onAddPurchase}
                  className="bg-orange-500 hover:bg-orange-600 flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Tambah Pembelian Baru
                </Button>
              )}
            </>
          ) : (
            onAddPurchase && (
              <Button
                onClick={onAddPurchase}
                className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg shadow-md transition-all duration-200 flex items-center gap-2 px-6 py-3"
              >
                <Plus className="h-5 w-5" />
                Tambah Pembelian Pertama
              </Button>
            )
          )}
        </div>
      </div>

      {/* Tips */}
      {!isSearchResult && (
        <div className="mt-10 bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-lg">
          <h4 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
            <div className="bg-blue-500 rounded-full p-1">
              <ShoppingCart className="h-3 w-3 text-white" />
            </div>
            Tips untuk memulai:
          </h4>
          <ul className="text-sm text-blue-700 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">•</span>
              <span>Pastikan data supplier dan bahan baku sudah lengkap</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">•</span>
              <span>Siapkan nota atau dokumen pembelian sebagai referensi</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">•</span>
              <span>Input data secara berkala untuk tracking yang akurat</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default EmptyPurchaseState;