import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Package, AlertTriangle, Download, Upload } from 'lucide-react';

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

    <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl p-6 mb-8 shadow-xl">
      <div className="flex items-center gap-4 mb-4 lg:mb-0">
        <div className="flex-shrink-0 bg-white bg-opacity-20 p-3 rounded-xl backdrop-blur-sm">
          <Package className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Manajemen Gudang</h1>
          <p className="text-sm opacity-90 mt-1">
            {itemCount} item{selectedCount > 0 && ` • ${selectedCount} dipilih`}
          </p>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 w-full lg:w-auto">
        <Button onClick={() => onOpenDialog('addItem')} className="flex items-center gap-2 px-4 py-2 bg-white text-orange-600 font-semibold rounded-lg hover:bg-gray-100 transition-all">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Tambah Item</span>
        </Button>
        
        <Button onClick={() => onOpenDialog('import')} variant="secondary" className="flex items-center gap-2 px-4 py-2">
          <Upload className="h-4 w-4" />
          <span className="hidden sm:inline">Import</span>
        </Button>
        
        <Button onClick={() => onOpenDialog('export')} variant="secondary" className="flex items-center gap-2 px-4 py-2">
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Export</span>
        </Button>
      </div>
    </header>
  </>
);

export default WarehouseHeader;