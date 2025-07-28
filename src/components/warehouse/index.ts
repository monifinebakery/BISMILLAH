// src/components/warehouse/index.ts
/**
 * Main Warehouse Module Export
 * Clean and simple barrel export for external usage
 */

// Main Components
export { default as WarehousePage } from './WarehousePage';
export { WarehouseProvider, useWarehouseContext } from './WarehouseContext';

// Types
export type * from './types';

// ===== INTERNAL BARREL EXPORTS =====

// src/components/warehouse/components/index.ts
// Static Components (Always Loaded)
export { default as WarehouseHeader } from './WarehouseHeader';
export { default as WarehouseTable } from './WarehouseTable';  
export { default as WarehouseFilters } from './WarehouseFilters';
export { default as BulkActions } from './BulkActions';

// src/components/warehouse/hooks/index.ts
// Core Hook
export { useWarehouseCore } from './useWarehouseCore';

// Dynamic Hook (Lazy Loaded)
export const useWarehouseBulk = () => import('./useWarehouseBulk');

// src/components/warehouse/services/index.ts
// Service API
export * from './warehouseApi';
export * from './warehouseUtils';

// src/components/warehouse/types.ts
/**
 * All Warehouse Types in One File
 * Keep it simple and lightweight (~5KB)
 */

export interface BahanBaku {
  id: string;
  nama: string;
  kategori: string;
  supplier: string;
  stok: number;
  minimum: number;
  satuan: string;
  harga: number;
  expiry?: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface FilterState {
  category: string;
  supplier: string;
  stockLevel: 'all' | 'low' | 'out';
  expiry: 'all' | 'expiring' | 'expired';
}

export interface SortConfig {
  key: keyof BahanBaku;
  direction: 'asc' | 'desc';
}

export interface DialogState {
  addItem: boolean;
  editItem: boolean;
  bulkEdit: boolean;
  bulkDelete: boolean;
  import: boolean;
  export: boolean;
}

export interface WarehouseContextType {
  // State
  bahanBaku: BahanBaku[];
  loading: boolean;
  isConnected: boolean;
  isBulkDeleting: boolean;
  
  // Actions
  addBahanBaku: (bahan: Omit<BahanBaku, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<boolean>;
  updateBahanBaku: (id: string, updates: Partial<BahanBaku>) => Promise<boolean>;
  deleteBahanBaku: (id: string) => Promise<boolean>;
  bulkDeleteBahanBaku: (ids: string[]) => Promise<boolean>;
  refreshData: () => Promise<void>;
  
  // Utilities
  getBahanBakuByName: (nama: string) => BahanBaku | undefined;
  reduceStok: (nama: string, jumlah: number) => Promise<boolean>;
  
  // Analysis
  getLowStockItems: () => BahanBaku[];
  getOutOfStockItems: () => BahanBaku[];
  getExpiringItems: (days?: number) => BahanBaku[];
}

export interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface TableProps extends ComponentProps {
  items: BahanBaku[];
  isLoading: boolean;
  onEdit: (item: BahanBaku) => void;
  onDelete: (id: string, nama: string) => void;
  selectedItems: string[];
  onToggleSelection: (id: string) => void;
  isSelectionMode: boolean;
  sortConfig: SortConfig;
  onSort: (key: keyof BahanBaku) => void;
}

export interface DialogProps extends ComponentProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface AddEditDialogProps extends DialogProps {
  mode: 'add' | 'edit';
  item?: BahanBaku;
  onSave: (data: any) => Promise<void>;
}

export interface BulkDialogProps extends DialogProps {
  operation: 'edit' | 'delete';
  selectedItems: string[];
  selectedItemsData: BahanBaku[];
  onConfirm: (data?: any) => Promise<void>;
  isProcessing: boolean;
}

// ===== SIMPLIFIED COMPONENT IMPLEMENTATIONS =====

// src/components/warehouse/components/WarehouseHeader.tsx
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

// src/components/warehouse/components/BulkActions.tsx  
import React from 'react';
import { Button } from '@/components/ui/button';
import { Settings, AlertTriangle } from 'lucide-react';

interface BulkActionsProps {
  selectedCount: number;
  onBulkEdit: () => void;
  onBulkDelete: () => void;
  onClearSelection: () => void;
  isProcessing: boolean;
}

const BulkActions: React.FC<BulkActionsProps> = ({
  selectedCount, onBulkEdit, onBulkDelete, onClearSelection, isProcessing
}) => (
  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <span className="font-medium text-orange-900">
          {selectedCount} item dipilih
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button onClick={onBulkEdit} variant="outline" size="sm" className="flex items-center gap-2" disabled={isProcessing}>
          <Settings className="h-4 w-4" />
          Edit Bulk
        </Button>
        <Button onClick={onBulkDelete} variant="outline" size="sm" className="flex items-center gap-2 text-red-600 hover:text-red-700" disabled={isProcessing}>
          <AlertTriangle className="h-4 w-4" />
          Hapus
        </Button>
        <Button onClick={onClearSelection} variant="ghost" size="sm" className="text-gray-600">
          Batal
        </Button>
      </div>
    </div>
  </div>
);

export default BulkActions;