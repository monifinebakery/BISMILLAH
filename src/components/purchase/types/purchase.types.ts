// src/components/purchase/types/purchase.types.ts

// ============ App (Frontend) Shapes ============
export interface PurchaseItem {
  bahanBakuId: string;
  nama: string;
  kuantitas: number;
  satuan: string;
  hargaSatuan: number;
  subtotal: number;
  keterangan?: string;
  // ✅ NEW: Packaging fields for accurate pricing
  jumlahKemasan?: number;
  isiPerKemasan?: number;
  satuanKemasan?: string;
  hargaTotalBeliKemasan?: number;
}

export interface Purchase {
  id: string;
  userId: string;
  supplier: string;           // supplier ID (relasi)
  tanggal: Date;
  totalNilai: number;
  items: PurchaseItem[];
  status: PurchaseStatus;
  metodePerhitungan: CalculationMethod;
  createdAt: Date;
  updatedAt: Date;
}

export type PurchaseStatus = 'pending' | 'completed' | 'cancelled';
export type CalculationMethod = 'AVERAGE';

// Status option type for dropdowns
export interface StatusOption {
  value: PurchaseStatus;
  label: string;
  color: string;
}

// Form types
export interface PurchaseFormData {
  supplier: string; // supplier ID
  tanggal: Date;
  items: PurchaseItem[];
  metodePerhitungan: CalculationMethod;
}

// ============ Stats ============
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

// ============ API / DB Shapes ============
// Baris item untuk disimpan ke DB (snake_case). Ini yang dibaca manual sync.
export interface PurchaseItemDB {
  bahan_baku_id: string;
  jumlah: number;
  harga_satuan: number;
  // metadata tambahan (aman disimpan)
  nama?: string;
  satuan?: string;
  subtotal?: number;
  keterangan?: string | null;
  // ✅ NEW: Packaging metadata for audit trail
  jumlah_kemasan?: number;
  isi_per_kemasan?: number;
  satuan_kemasan?: string;
  harga_total_beli_kemasan?: number;
}

// Payload INSERT ke tabel purchases
export interface CreatePurchaseRequest {
  user_id: string;
  supplier: string; // supplier ID
  tanggal: string; // 'YYYY-MM-DD'
  total_nilai: number;
  items: PurchaseItemDB[]; // ✅ gunakan shape DB
  status?: PurchaseStatus;
  metode_perhitungan?: CalculationMethod;
}

// Response pembelian (opsional kalau perlu)
export interface PurchaseApiResponse {
  data: Purchase[] | null;
  error: string | null;
}

// ============ Table Context (UI) ============
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
  suppliers: Array<{ id: string; nama: string }>;
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

// ============ Purchase Context ============
export interface PurchaseContextType {
  // State
  purchases: Purchase[];
  isLoading: boolean;
  error: string | null;
  isProcessing?: boolean; // ✅ disediakan karena dipakai di PurchaseContext

  // Core actions
  addPurchase: (purchase: Omit<Purchase, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  updatePurchase: (id: string, updates: Partial<Purchase>) => Promise<boolean>;
  deletePurchase: (id: string) => Promise<boolean>;
  refreshPurchases: () => Promise<void>;

  // Enhanced utils
  stats: PurchaseStats;
  validatePrerequisites: () => boolean;
  getSupplierName: (id: string) => string;

  // Status handling (manual sync untuk stok & WAC)
  setStatus: (id: string, status: PurchaseStatus) => Promise<boolean>;

  // Bulk ops
  bulkDelete: (ids: string[]) => Promise<void>;
  bulkStatusUpdate: (ids: string[], status: PurchaseStatus) => Promise<void>;

  // Finders
  findPurchase: (id: string) => Purchase | undefined;

  // Realtime guard (opsional dipakai saat bulk)
  setBulkProcessing: (v: boolean) => void;
}

// Hook aliases
export interface UsePurchaseReturn extends PurchaseContextType {}
export interface UsePurchaseTableReturn extends PurchaseTableContextType {}

export interface UsePurchaseStatsReturn {
  stats: PurchaseStats;
  isCalculating: boolean;
}

// ============ Status management hooks ============
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

// ============ Intent types ============
// ✅ NEW: Intent system for different add purchase modes
export type AddPurchaseIntent = 'quick' | 'accurate' | 'packaging' | 'normal';

// ============ Component Props ============
export interface PurchaseDialogProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  purchase?: Purchase | null;
  suppliers: Array<{ id: string; nama: string }>;
  onClose: () => void;
}

export interface PurchaseTablePropsExtended {
  onEdit: (purchase: Purchase) => void;
  onStatusChange?: (purchaseId: string, newStatus: PurchaseStatus) => Promise<void>;
  onDelete?: (purchaseId: string) => Promise<void>;
  onBulkDelete?: (purchaseIds: string[]) => Promise<void>;
  validateStatusChange?: (
    purchaseId: string,
    newStatus: PurchaseStatus
  ) => Promise<{
    canChange: boolean;
    warnings: string[];
    errors: string[];
  }>;
}

export interface PurchaseHeaderProps {
  totalPurchases: number;
  totalValue: number;
  pendingCount: number;
  onAddPurchase: (intent?: AddPurchaseIntent) => void; // <— ubah ke terima intent
  className?: string;
}

// Purchase detail dialog props
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

// Filters / Pagination / Export
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

export interface PaginationState {
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
  totalItems: number;
}

export interface PurchaseExportData {
  tanggal: string;
  supplier: string;
  totalNilai: string;
  status: string;
  jumlahItem: string;
  totalKuantitas: string;
  dibuat: string;
}

// Validation
export interface PurchaseValidationError {
  field: string;
  message: string;
}

export interface PurchaseValidationResult {
  isValid: boolean;
  errors: PurchaseValidationError[];
}

// Events
export type PurchaseEventHandler<T = void> = (purchase: Purchase) => T;
export type PurchaseStatusEventHandler = (purchaseId: string, newStatus: PurchaseStatus) => Promise<void>;
export type PurchaseBulkEventHandler = (purchaseIds: string[]) => Promise<void>;

// Loading states
export interface LoadingStates {
  isLoading: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

// Empty state types
export interface EmptyStateProps {
  onAddPurchase: () => void;
  hasSuppliers: boolean;
  type?: 'no-data' | 'no-results' | 'error';
  title?: string;
  description?: string;
  actionLabel?: string;
}
