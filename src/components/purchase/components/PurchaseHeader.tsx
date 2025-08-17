// src/components/purchase/components/PurchaseHeader.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  ShoppingCart,
  Download,
  TrendingUp,
  Clock,
  CheckCircle,
  FileText
} from 'lucide-react';
import { formatCurrency } from '@/utils/formatUtils';
import { PurchaseHeaderProps } from '../types/purchase.types';

const PurchaseHeader: React.FC<PurchaseHeaderProps> = ({
  totalPurchases,
  totalValue,
  pendingCount,
  onAddPurchase,
  onExport,
  onSettings,
  className = '',
}) => {
  return (
    <Card className={`bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-xl ${className}`}>
      <div className="p-6">
        {/* Main header content */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6">
          {/* Left content */}
          <div className="flex items-center gap-4 mb-4 lg:mb-0">
            <div className="flex-shrink-0 bg-white bg-opacity-20 p-3 rounded-xl backdrop-blur-sm">
              <ShoppingCart className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold">
                Manajemen Pembelian Bahan Baku
              </h1>
              <p className="text-sm opacity-90 mt-1">
                Catat pembelian bahan baku langsung dari nota untuk hasil yang akurat.
              </p>
            </div>
          </div>
          
          {/* Right actions */}
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            {/* Hanya 1 tombol: Tambah dari Nota */}
            <Button
              onClick={() => onAddPurchase('packaging')}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-orange-600 font-semibold rounded-lg shadow-md hover:bg-gray-100 transition-all duration-200 hover:shadow-lg"
            >
              <FileText className="h-5 w-5" />
              Tambah Pembelian
            </Button>

            {onExport && (
              <Button
                onClick={onExport}
                variant="outline"
                className="flex items-center justify-center gap-2 px-6 py-3 bg-white bg-opacity-10 text-white border-white border-opacity-30 font-semibold rounded-lg backdrop-blur-sm hover:bg-opacity-20 transition-all duration-200"
              >
                <Download className="h-5 w-5" />
                Export
              </Button>
            )}
          </div>
        </div>

        {/* Stats section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total Purchases */}
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4 border border-white border-opacity-20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold">{totalPurchases}</div>
                <div className="text-sm opacity-80">Total Pembelian</div>
              </div>
            </div>
          </div>

          {/* Total Value */}
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4 border border-white border-opacity-20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <ShoppingCart className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
                <div className="text-sm opacity-80">Total Nilai</div>
              </div>
            </div>
          </div>

          {/* Pending Count */}
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4 border border-white border-opacity-20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                {pendingCount > 0 ? (
                  <Clock className="h-5 w-5 text-white" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-white" />
                )}
              </div>
              <div>
                <div className="text-2xl font-bold">{pendingCount}</div>
                <div className="text-sm opacity-80">
                  {pendingCount > 0 ? 'Pending' : 'Semua Selesai'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional info if there are pending items */}
        {pendingCount > 0 && (
          <div className="mt-4 p-3 bg-yellow-500 bg-opacity-20 backdrop-blur-sm rounded-lg border border-yellow-300 border-opacity-30">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              <span>
                Anda memiliki <strong>{pendingCount}</strong> pembelian yang masih pending. 
                Segera proses untuk update stok yang akurat.
              </span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default PurchaseHeader;
