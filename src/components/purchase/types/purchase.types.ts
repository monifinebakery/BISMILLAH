// src/components/purchase/types/purchase.types.ts

export interface PurchaseItem {
  bahanBakuId: string;
  nama: string;
  kuantitas: number;
  satuan: string;
  hargaSatuan: number;
  subtotal: number;
  keterangan?: string;
}

export interface Purchase {
  id: string;
  userId: string;
  supplier: string;
  tanggal: Date;
  totalNilai: number;
  items: PurchaseItem[];
  status: PurchaseStatus;
  metodePerhitungan: CalculationMethod;
  createdAt: Date;
  updatedAt: Date;
}

export type PurchaseStatus = 'pending' | 'completed' | 'cancelled';
export type CalculationMethod = 'FIFO' | 'LIFO' | 'AVERAGE';

// Status option type for dropdowns
export interface StatusOption {
  value: PurchaseStatus;
  label: string;
  color: string;
}

// Form types
export interface PurchaseFormData {
  supplier: string;
  tanggal: Date;
  items: PurchaseItem[];
  metodePerhitungan: CalculationMethod;
}

// Stats types
export interface PurchaseStats {
  total: number;
  totalValue: number;
  byStatus: {
    pending: number;
    completed: number;
    cancelled: number;
  };
  completionRate: number;
}

// API types
export interface PurchaseApiResponse {
  data: Purchase[] | null;
  error: string | null;
}

export interface CreatePurchaseRequest {
  user_id: string;
  supplier: string;
  tanggal: string;
  total_nilai: number;
  items: PurchaseItem[];
  status?: PurchaseStatus;
  metode_perhitungan?: CalculationMethod;
}

// Enhanced table context types with filtering and sorting
export interface PurchaseTableContextType {
  // Selection
  selectedItems: string[];
  setSelectedItems: (items: string[]) => void;
  selectAll: () => void;
  clearSelection: () => void;
  isAllSelected: boolean;
  toggleSelectItem: (id: string) => void;
  
  // Bulk operations
  bulkDelete: () => Promise<void>;
  isBulkDeleting: boolean;
  showBulkDeleteDialog: boolean;
  setShowBulkDeleteDialog: (show: boolean) => void;
  
  // Filtering and searching
  filteredPurchases: Purchase[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: PurchaseStatus | 'all';
  setStatusFilter: (status: PurchaseStatus | 'all') => void;
  
  // Sorting
  sortField: 'tanggal' | 'totalNilai' | 'supplier' | 'status';
  sortOrder: 'asc' | 'desc';
  handleSort: (field: 'tanggal' | 'totalNilai' | 'supplier' | 'status') => void;
  
  // Utility functions
  getSupplierName: (supplierId: string) => string;
}

// Context types - DIPERBARUI
export interface PurchaseContextType {
  // State
  purchases: Purchase[];
  isLoading: boolean;
  error: string | null;
  isProcessing: boolean;

  // Core actions
  addPurchase: (purchase: Omit<Purchase, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  updatePurchase: (id: string, updates: Partial<Purchase>) => Promise<boolean>;
  deletePurchase: (id: string) => Promise<boolean>;
  refreshPurchases: () => Promise<void>;

  // Enhanced utils
  stats: PurchaseStats;
  validatePrerequisites: () => boolean;
  getSupplierName: (id: string) => string;

  // Status handling (pakai trigger DB untuk stok & WAC)
  setStatus: (id: string, status: PurchaseStatus) => Promise<boolean>;

  // Bulk ops
  bulkDelete: (ids: string[]) => Promise<void>;
  bulkStatusUpdate: (ids: string[], status: PurchaseStatus) => Promise<void>;

  // Finders
  findPurchase: (id: string) => Purchase | undefined;

  // Realtime guard (opsional dipakai saat bulk)
  setBulkProcessing: (v: boolean) => void;
}

// Hook types
export interface UsePurchaseReturn extends PurchaseContextType {}

export interface UsePurchaseTableReturn extends PurchaseTableContextType {}

export interface UsePurchaseStatsReturn {
  stats: PurchaseStats;
  isCalculating: boolean;
}

// Status management hook types
export interface UsePurchaseStatusProps {
  onStatusUpdate: (purchaseId: string, newStatus: PurchaseStatus) => Promise<boolean>;
  onError?: (error: string) => void;
  onSuccess?: (message: string) => void;
}

export interface UsePurchaseStatusReturn {
  updateStatus: (purchaseId: string, newStatus: PurchaseStatus) => Promise<void>;
  isUpdating: string | null;
  isUpdatingPurchase: (purchaseId: string) => boolean;
}

// Component props types
export interface PurchaseDialogProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  purchase?: Purchase | null;
  suppliers: Array<{ id: string; nama: string }>;
  bahanBaku: Array<{ id: string; nama: string; satuan: string }>;
  onClose: () => void;
}

// Enhanced PurchaseTable props with new handlers - DIPERBARUI
export interface PurchaseTablePropsExtended {
  onEdit: (purchase: Purchase) => void;
  onStatusChange?: (purchaseId: string, newStatus: PurchaseStatus) => Promise<void>;
  onDelete?: (purchaseId: string) => Promise<void>;
  onBulkDelete?: (purchaseIds: string[]) => Promise<void>;
  onViewDetails?: (purchase: Purchase) => void;
  validateStatusChange?: (purchaseId: string, newStatus: PurchaseStatus) => Promise<{
    canChange: boolean;
    warnings: string[];
    errors: string[];
  }>;
}

export interface PurchaseHeaderProps {
  totalPurchases: number;
  totalValue: number;
  pendingCount: number;
  onAddPurchase: () => void;
  onExport?: () => void;
  onSettings?: () => void;
  className?: string;
}

export interface DataWarningBannerProps {
  missingSuppliers: boolean;
  missingBahanBaku: boolean;
  onDismiss: () => void;
}

// Purchase detail dialog props
export interface PurchaseDetailDialogProps {
  isOpen: boolean;
  purchase: Purchase | null;
  suppliers: Array<{ id: string; nama: string; kontak?: string; alamat?: string }>;
  bahanBaku: Array<{ id: string; nama: string; satuan: string }>;
  onClose: () => void;
  onEdit?: (purchase: Purchase) => void;
}

// Status dropdown component props
export interface StatusDropdownProps {
  purchase: Purchase;
  isEditing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onStatusChange: (purchaseId: string, newStatus: PurchaseStatus) => Promise<void>;
  isUpdating?: boolean;
}

// Bulk actions props
export interface BulkActionsToolbarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkDelete: () => void;
  onBulkExport?: () => void;
  onBulkStatusChange?: (status: PurchaseStatus) => void;
  isDeleting?: boolean;
}

// Filter and search types
export interface PurchaseFilters {
  searchQuery: string;
  statusFilter: PurchaseStatus | 'all';
  dateRange?: {
    from: Date;
    to: Date;
  };
  supplierFilter?: string;
  sortBy: 'tanggal' | 'totalNilai' | 'supplier' | 'status';
  sortOrder: 'asc' | 'desc';
}

// Pagination types
export interface PaginationState {
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
  totalItems: number;
}

// Export types for external use
export interface PurchaseExportData {
  tanggal: string;
  supplier: string;
  totalNilai: string;
  status: string;
  jumlahItem: string;
  totalKuantitas: string;
  metodePerhitungan: string;
  dibuat: string;
}

// Validation types
export interface PurchaseValidationError {
  field: string;
  message: string;
}

export interface PurchaseValidationResult {
  isValid: boolean;
  errors: PurchaseValidationError[];
}

// Event handler types
export type PurchaseEventHandler<T = void> = (purchase: Purchase) => T;
export type PurchaseStatusEventHandler = (purchaseId: string, newStatus: PurchaseStatus) => Promise<void>;
export type PurchaseBulkEventHandler = (purchaseIds: string[]) => Promise<void>;

// Loading states
export interface LoadingStates {
  isLoading: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isExporting: boolean;
}

// Empty state types
export interface EmptyStateProps {
  onAddPurchase: () => void;
  hasSuppliers: boolean;
  hasBahanBaku: boolean;
  type?: 'no-data' | 'no-results' | 'error';
  title?: string;
  description?: string;
  actionLabel?: string;
}

// Export all types
export type {
  PurchaseItem,
  Purchase,
  PurchaseStatus,
  CalculationMethod,
  StatusOption,
  PurchaseFormData,
  PurchaseContextType,
  PurchaseTableContextType,
  PurchaseStats,
  PurchaseApiResponse,
  CreatePurchaseRequest,
  UsePurchaseReturn,
  UsePurchaseTableReturn,
  UsePurchaseStatsReturn,
  UsePurchaseStatusProps,
  UsePurchaseStatusReturn,
  PurchaseDialogProps,
  PurchaseTablePropsExtended,
  PurchaseHeaderProps,
  DataWarningBannerProps,
  PurchaseDetailDialogProps,
  StatusDropdownProps,
  BulkActionsToolbarProps,
  PurchaseFilters,
  PaginationState,
  PurchaseExportData,
  PurchaseValidationError,
  PurchaseValidationResult,
  PurchaseEventHandler,
  PurchaseStatusEventHandler,
  PurchaseBulkEventHandler,
  LoadingStates,
  EmptyStateProps,
};