// src/components/purchase/components/PurchaseHeader.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import {
  ShoppingCart,
  TrendingUp,
  Clock,
  CheckCircle,
  FileText,
  Upload,
  Plus,
  AlertTriangle
} from 'lucide-react';
import { formatCurrency } from '@/utils/formatUtils';
import { PurchaseHeaderProps } from '../types/purchase.types';

const PurchaseHeader: React.FC<PurchaseHeaderProps> = ({
  totalPurchases,
  totalValue,
  pendingCount,
  onAddPurchase,
  className = '',
}) => {
  return (
    <>
      {/* Alert for pending purchases */}
      {pendingCount > 0 && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-800">
            <AlertTriangle className="h-4 w-4" />
            <div className="flex-1">
              <span className="text-sm font-medium">Perhatian: </span>
              <span className="text-sm">
                {pendingCount} pembelian masih pending. Segera proses untuk update stok yang akurat.
              </span>
            </div>
          </div>
        </div>
      )}

      <div className={`bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-6 mb-6 text-white shadow-lg ${className}`}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-white bg-opacity-10 p-3 rounded-xl backdrop-blur-sm">
              <ShoppingCart className="h-8 w-8 text-white" />
            </div>
            
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold mb-2">
                Manajemen Pembelian
              </h1>
              <p className="text-white text-opacity-90">
                Catat pembelian bahan baku langsung dari nota untuk hasil yang akurat
              </p>
            </div>
          </div>

          <div className="hidden md:flex gap-3">
            <Button
              onClick={() => onAddPurchase('import')}
              className="flex items-center gap-2 bg-white bg-opacity-20 text-white border border-white border-opacity-30 hover:bg-white hover:bg-opacity-30 font-medium px-4 py-2 rounded-lg transition-all backdrop-blur-sm"
            >
              <Upload className="h-4 w-4" />
              Import Data
            </Button>

            <Button
              onClick={() => onAddPurchase('packaging')}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              Tambah Pembelian
            </Button>
          </div>
        </div>

        <div className="flex md:hidden flex-col gap-3 mt-6">
          <Button
            onClick={() => onAddPurchase('import')}
            className="w-full flex items-center justify-center gap-2 bg-white bg-opacity-20 text-white border border-white border-opacity-30 hover:bg-white hover:bg-opacity-30 font-medium px-4 py-3 rounded-lg transition-all backdrop-blur-sm"
          >
            <Upload className="h-4 w-4" />
            Import Data
          </Button>
          <Button
            onClick={() => onAddPurchase('packaging')}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-3 rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            Tambah Pembelian
          </Button>
        </div>

        {(totalPurchases > 0 || totalValue > 0) && (
          <div className="mt-4 pt-4 border-t border-white border-opacity-20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex flex-col">
                <span className="text-white opacity-75 text-xs uppercase tracking-wide">Total Pembelian</span>
                <span className="font-bold text-lg">
                  {totalPurchases}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-white opacity-75 text-xs uppercase tracking-wide">Total Nilai</span>
                <span className="font-bold text-lg">
                  {formatCurrency(totalValue)}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-white opacity-75 text-xs uppercase tracking-wide">
                  {pendingCount > 0 ? 'Pending' : 'Status'}
                </span>
                <div className="flex items-center gap-2">
                  <span className={`font-bold text-lg ${pendingCount > 0 ? 'text-yellow-200' : 'text-green-200'}`}>
                    {pendingCount > 0 ? pendingCount : 'Selesai'}
                  </span>
                  {pendingCount > 0 ? (
                    <Clock className="h-3 w-3 text-yellow-200" />
                  ) : (
                    <CheckCircle className="h-3 w-3 text-green-200" />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default PurchaseHeader;