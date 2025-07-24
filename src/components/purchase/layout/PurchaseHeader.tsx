import React from 'react';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Plus, Download, Settings } from 'lucide-react';
import { formatCurrency } from '@/utils/formatUtils';

interface PurchaseHeaderProps {
  totalPurchases: number;
  totalValue: number;
  pendingCount: number;
  onAddPurchase: () => void;
  onExport?: () => void;
  onSettings?: () => void;
  className?: string;
}

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
    <header className={`flex flex-col lg:flex-row justify-between items-start lg:items-center bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl p-6 mb-8 shadow-xl ${className}`}>
      <div className="flex items-center gap-4 mb-4 lg:mb-0">
        <div className="flex-shrink-0 bg-white bg-opacity-20 p-3 rounded-xl backdrop-blur-sm">
          <ShoppingCart className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Manajemen Pembelian Bahan Baku</h1>
          <p className="text-sm opacity-90 mt-1">Kelola semua transaksi pembelian bahan baku Anda dengan mudah.</p>
          
          {/* Stats */}
          <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
            <div className="bg-white bg-opacity-10 px-3 py-1 rounded-full backdrop-blur-sm">
              <span className="font-semibold">{totalPurchases}</span> Total Pembelian
            </div>
            <div className="bg-white bg-opacity-10 px-3 py-1 rounded-full backdrop-blur-sm">
              <span className="font-semibold">{formatCurrency(totalValue)}</span> Total Nilai
            </div>
            {pendingCount > 0 && (
              <div className="bg-yellow-500 bg-opacity-20 px-3 py-1 rounded-full backdrop-blur-sm border border-yellow-300 border-opacity-30">
                <span className="font-semibold">{pendingCount}</span> Pending
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
        <Button
          onClick={onAddPurchase}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-orange-600 font-semibold rounded-lg shadow-md hover:bg-gray-100 transition-all duration-200 hover:shadow-lg"
        >
          <Plus className="h-5 w-5" />
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
        
        {onSettings && (
          <Button
            onClick={onSettings}
            variant="ghost"
            size="icon"
            className="flex items-center justify-center p-3 text-white hover:bg-white hover:bg-opacity-10 rounded-lg transition-all duration-200"
          >
            <Settings className="h-5 w-5" />
          </Button>
        )}
      </div>
    </header>
  );
};

export default PurchaseHeader;