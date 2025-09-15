// src/components/purchase/types/purchase.types.ts

// ============ App (Frontend) Shapes ============
// Frontend interface (camelCase for consistency with warehouse types)
export interface PurchaseItem {
  bahanBakuId: string;    // consistent with warehouse: maps to bahan_baku_id
  nama: string;
  quantity: number;       // standardized from kuantitas
  satuan: string;
  unitPrice: number;      // standardized from hargaSatuan
  subtotal: number;
  keterangan?: string;
}

export interface Purchase {
  id: string;
  userId: string;
  supplier: string;           // supplier name (nama supplier)
  tanggal: Date;
  total_nilai: number;        // sesuai schema database
  items: PurchaseItem[];
  status: PurchaseStatus;
  metode_perhitungan: CalculationMethod; // sesuai schema database
  keterangan?: string;        // Optional description/notes
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
  supplier: string; // supplier name (nama supplier)
  tanggal: Date | string; // Allow both Date object and string for flexibility
  items: PurchaseItem[];
  metode_perhitungan: CalculationMethod; // sesuai schema database
  keterangan?: string; // Add optional keterangan field
  total_nilai?: number; // ✅ FIX: Add total_nilai for consistency with Purchase interface
}

// ============ Stats ============
export interface PurchaseStats {
  total: number;
  total_nilai: number;
  byStatus: {
    pending: number;
    completed: number;
    cancelled: number;
  };
  completionRate: number;
}

export interface PurchaseStatsProps {
  stats: PurchaseStats;
  className?: string;
}

// ============ API / DB Shapes ============
// Database interface (snake_case for database consistency)
export interface PurchaseItemDB {
  bahan_baku_id: string;
  quantity: number;           // standardized from jumlah
  unit_price: number;         // standardized from harga_per_satuan
  // metadata tambahan (aman disimpan)
  nama?: string;
  satuan?: string;
  subtotal?: number;
  keterangan?: string | null;
}

// Payload INSERT ke tabel purchases
export interface CreatePurchaseRequest {
  user_id: string;
  supplier: string; // supplier name (nama supplier)
  tanggal: string; // 'YYYY-MM-DD'
  total_nilai: number;        // sesuai schema database
  items: PurchaseItemDB[]; // ✅ gunakan shape DB
  status?: PurchaseStatus;
  metode_perhitungan?: CalculationMethod; // sesuai schema database
}

// ✅ NEW: Payload UPDATE untuk tabel purchases
export interface UpdatePurchaseRequest {
  supplier?: string;
  tanggal?: string;
  total_nilai?: number;       // sesuai schema database
  items?: PurchaseItemDB[];
  status?: PurchaseStatus;
  metode_perhitungan?: CalculationMethod; // sesuai schema database
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


  // Filtering and searching
  filteredPurchases: Purchase[];
  suppliers: Array<{ id: string; nama: string }>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: PurchaseStatus | 'all';
  setStatusFilter: (status: PurchaseStatus | 'all') => void;

  // Sorting
  sortField: 'tanggal' | 'total_nilai' | 'supplier' | 'status'; // sesuai schema database
  sortOrder: 'asc' | 'desc';
  handleSort: (field: 'tanggal' | 'total_nilai' | 'supplier' | 'status') => void;

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

  // Finders
  findPurchase: (id: string) => Purchase | undefined;
  getPurchaseById: (id: string) => Purchase | undefined;
}

// Hook aliases
export type UsePurchaseReturn = PurchaseContextType;
export type UsePurchaseTableReturn = PurchaseTableContextType;

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
  total_nilai: number;
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


// Filters / Pagination / Export
export interface PurchaseFilters {
  searchQuery: string;
  statusFilter: PurchaseStatus | 'all';
  dateRange?: {
    from: Date;
    to: Date;
  };
  supplierFilter?: string;
  sortBy: 'tanggal' | 'total_nilai' | 'supplier' | 'status';  // sesuai schema database
  sortOrder: 'asc' | 'desc';
}

export interface PurchaseFiltersProps {
  filters: PurchaseFilters;
  onChange: (filters: PurchaseFilters) => void;
  suppliers?: Array<{ id: string; nama: string }>;
  className?: string;
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
  total_nilai: string;
  status: string;
  jumlah_item: string;
  total_kuantitas: string;
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
