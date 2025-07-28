// src/components/warehouse/types.ts
/**
 * Complete Warehouse Type Definitions
 * Centralized type definitions for better maintainability
 */

// Core Data Types
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

// Filter & Sort Types
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

// Dialog Types
export interface DialogState {
  addItem: boolean;
  editItem: boolean;
  bulkEdit: boolean;
  bulkDelete: boolean;
  import: boolean;
  export: boolean;
}

// Context Types
export interface WarehouseContextType {
  // State
  bahanBaku: BahanBaku[];
  loading: boolean;
  isConnected: boolean;
  isBulkDeleting: boolean;
  
  // CRUD Operations
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

// Component Props Types
export interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface WarehouseHeaderProps {
  itemCount: number;
  selectedCount: number;
  isConnected: boolean;
  onOpenDialog: (dialog: string) => void;
}

export interface WarehouseTableProps {
  items: BahanBaku[];
  isLoading: boolean;
  isSelectionMode: boolean;
  searchTerm: string;
  sortConfig: SortConfig;
  onSort: (key: keyof BahanBaku) => void;
  onEdit: (item: BahanBaku) => void;
  onDelete: (id: string, nama: string) => void;
  selectedItems: string[];
  onToggleSelection: (id: string) => void;
  onSelectAllCurrent: () => void;
  isSelected: (id: string) => boolean;
  allCurrentSelected: boolean;
  someCurrentSelected: boolean;
  emptyStateAction: () => void;
}

export interface WarehouseFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onResetFilters: () => void;
  itemsPerPage: number;
  onItemsPerPageChange: (count: number) => void;
  isSelectionMode: boolean;
  onToggleSelectionMode: () => void;
  availableCategories: string[];
  availableSuppliers: string[];
  activeFiltersCount: number;
}

export interface BulkActionsProps {
  selectedCount: number;
  onBulkEdit: () => void;
  onBulkDelete: () => void;
  onClearSelection: () => void;
  isProcessing: boolean;
}

export interface DialogManagerProps {
  dialogs: {
    states: Record<string, boolean>;
    open: (dialog: string) => void;
    close: (dialog: string) => void;
    editingItem: any;
    setEditingItem: (item: any) => void;
  };
  handlers: any;
  context: any;
  selection: any;
  filters: any;
  bulk: any;
  pageId: string;
}

// Dialog Props Types
export interface DialogProps extends ComponentProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface AddEditDialogProps extends DialogProps {
  mode: 'add' | 'edit';
  item?: BahanBaku;
  onSave: (data: any) => Promise<void>;
  availableCategories: string[];
  availableSuppliers: string[];
}

export interface BulkOperationsDialogProps extends DialogProps {
  operation: 'edit' | 'delete';
  selectedItems: string[];
  selectedItemsData: BahanBaku[];
  onConfirm: (data?: any) => Promise<void>;
  isProcessing: boolean;
  availableCategories: string[];
  availableSuppliers: string[];
}

export interface ImportExportDialogProps extends DialogProps {
  type: 'import' | 'export';
  data: BahanBaku[];
  selectedData: BahanBaku[];
  onImport: (data: any) => Promise<boolean>;
  onExport: (data: BahanBaku[], format: string) => void;
}

// Service Types
export interface ServiceConfig {
  userId?: string;
  onError?: (error: string) => void;
  enableDebugLogs?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  cacheTimeout?: number;
}

export interface CrudServiceOptions extends ServiceConfig {
  batchSize?: number;
  validateData?: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export type ExportFormat = 'csv' | 'excel' | 'pdf';

export interface ImportResult {
  valid: any[];
  invalid: any[];
  errors: string[];
  totalProcessed: number;
}

// Hook Types
export interface BulkOperationsConfig {
  updateBahanBaku: (id: string, updates: Partial<BahanBaku>) => Promise<boolean>;
  bulkDeleteBahanBaku: (ids: string[]) => Promise<boolean>;
  selectedItems: string[];
  clearSelection: () => void;
}

export interface BulkEditData {
  kategori?: string;
  supplier?: string;
  minimum?: number;
  harga?: number;
  expiry?: string;
}

// Performance Types
export interface PerformanceMetrics {
  renderTime: number;
  totalRenders: number;
  avgRenderTime: number;
  lastFetchTime: number;
  lastSearchTime: number;
  cacheHitRate: number;
}

export interface WarehouseProviderOptions {
  enableDebugLogs?: boolean;
  performanceMode?: 'default' | 'optimized' | 'aggressive';
  preloadServices?: boolean;
  cacheTimeout?: number;
  maxRetries?: number;
  batchSize?: number;
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Event Handler Types
export type WarehouseEventHandler<T = void> = (data: T) => void | Promise<void>;
export type WarehouseAsyncHandler<T = void, R = boolean> = (data: T) => Promise<R>;