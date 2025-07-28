/ src/components/warehouse/types.ts
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