import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Package, AlertTriangle, Upload, MessageSquare } from 'lucide-react';

interface WarehouseHeaderProps {
  itemCount: number;
  selectedCount: number;
  isConnected: boolean;
  onOpenDialog: (dialog: string) => void;
}

const WarehouseHeader: React.FC<WarehouseHeaderProps> = ({
  itemCount, selectedCount, isConnected, onOpenDialog
}) => (
  <>
    {!isConnected && (
      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center gap-2 text-yellow-800">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm font-medium">
            Koneksi tidak stabil. Data mungkin tidak ter-update secara real-time.
          </span>
        </div>
      </div>
    )}

    {/* Header Card with consistent styling */}
    <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-6 mb-6 text-white shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Icon Container */}
          <div className="bg-white bg-opacity-20 p-3 rounded-xl backdrop-blur-sm">
            <Package className="h-8 w-8 text-white" />
          </div>
          
          {/* Content */}
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold mb-2">
              Manajemen Gudang
            </h1>
            <p className="text-white opacity-90">
              Kelola semua stok bahan baku dengan sistem inventory yang terintegrasi.
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 mt-6">
        <Button 
          onClick={() => onOpenDialog('import')} 
          className="w-full flex items-center justify-center gap-2 bg-white text-orange-600 hover:bg-gray-100 font-medium px-4 py-3 rounded-lg transition-all"
        >
          <Upload className="h-4 w-4" />
          Import Data
        </Button>
        
        <Button 
          onClick={() => onOpenDialog('addItem')} 
          className="w-full flex items-center justify-center gap-2 bg-white bg-opacity-20 text-white border border-white border-opacity-30 hover:bg-white hover:bg-opacity-30 font-medium px-4 py-3 rounded-lg transition-all backdrop-blur-sm"
        >
          <Plus className="h-4 w-4" />
          Tambah Item Baru
        </Button>
      </div>

      {/* Stats Bar */}
      {itemCount > 0 && (
        <div className="mt-4 pt-4 border-t border-white border-opacity-20">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white opacity-90">
              Total: {itemCount} item{selectedCount > 0 && ` • ${selectedCount} dipilih`}
            </span>
          </div>
        </div>
      )}
    </div>
  </>
);

export default WarehouseHeader;