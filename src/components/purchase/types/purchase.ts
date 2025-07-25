// types/purchase.ts - Foundation Types

// 🏗️ Base Purchase Types (extending existing)
export interface Purchase {
  id: string;
  supplier: string;
  totalNilai: number;
  tanggal: Date;
  items: PurchaseItem[];
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  status: PurchaseStatus;
  metodePerhitungan?: 'FIFO' | 'LIFO' | 'AVERAGE';
}

export interface PurchaseItem {
  id: string;
  namaBarang: string;
  jumlah: number;
  satuan: string;
  hargaSatuan: number;
  totalHarga: number;
}

export type PurchaseStatus = 'pending' | 'completed' | 'cancelled';

// 📊 Table-specific Types
export interface PurchaseTableState {
  searchTerm: string;
  currentPage: number;
  itemsPerPage: number;
  selectedItems: string[];
  isSelectionMode: boolean;
  sortConfig: SortConfig;
}

export interface SortConfig {
  field: keyof Purchase | 'supplierName';
  direction: 'asc' | 'desc';
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  startItem: number;
  endItem: number;
}

// 📝 Form Types
export interface PurchaseFormData {
  supplier: string;
  tanggal: Date;
  items: PurchaseItem[];
  status: PurchaseStatus;
  metodePerhitungan?: 'FIFO' | 'LIFO' | 'AVERAGE';
}

export interface ItemFormData {
  namaBarang: string;
  jumlah: number;
  satuan: string;
  hargaSatuan: number;
}

export interface PurchaseFormErrors {
  supplier?: string;
  tanggal?: string;
  items?: string;
  [key: string]: string | undefined;
}

export interface ItemFormErrors {
  namaBarang?: string;
  jumlah?: string;
  satuan?: string;
  hargaSatuan?: string;
}

// 🔍 Search & Filter Types
export interface SearchFilters {
  searchTerm: string;
  statusFilter: PurchaseStatus | 'all';
  supplierFilter: string | 'all';
  dateRangeFilter: {
    start: Date | null;
    end: Date | null;
  };
  amountRangeFilter: {
    min: number | null;
    max: number | null;
  };
}

export interface FilteredPurchaseResult {
  purchases: Purchase[];
  totalCount: number;
  filteredCount: number;
}

// 🔨 Bulk Operations Types
export interface BulkOperationState {
  selectedIds: string[];
  isSelectionMode: boolean;
  operationType: BulkOperationType | null;
  isProcessing: boolean;
}

export type BulkOperationType = 'delete' | 'updateStatus' | 'export';

export interface BulkDeletePayload {
  ids: string[];
  reason?: string;
}

export interface BulkStatusUpdatePayload {
  ids: string[];
  newStatus: PurchaseStatus;
  reason?: string;
}

// 📊 Statistics Types
export interface PurchaseStatistics {
  totalPurchases: number;
  totalValue: number;
  averageValue: number;
  statusBreakdown: {
    pending: number;
    completed: number;
    cancelled: number;
  };
  monthlyTrend: MonthlyPurchaseData[];
  topSuppliers: SupplierPurchaseData[];
}

export interface MonthlyPurchaseData {
  month: string;
  year: number;
  count: number;
  totalValue: number;
}

export interface SupplierPurchaseData {
  supplierId: string;
  supplierName: string;
  purchaseCount: number;
  totalValue: number;
  lastPurchaseDate: Date;
}

// ⚡ API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  metadata?: {
    total: number;
    page: number;
    limit: number;
  };
}

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// 🎯 Component Props Types
export interface PurchaseTableProps {
  purchases: Purchase[];
  isLoading?: boolean;
  onEdit?: (purchase: Purchase) => void;
  onDelete?: (id: string) => void;
  onStatusChange?: (id: string, status: PurchaseStatus) => void;
}

export interface PurchaseTableRowProps {
  purchase: Purchase;
  supplierName: string;
  isSelected: boolean;
  isSelectionMode: boolean;
  onSelect: (id: string) => void;
  onEdit: (purchase: Purchase) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: PurchaseStatus) => void;
}

export interface PurchaseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editingPurchase?: Purchase | null;
  onSave: (data: PurchaseFormData) => Promise<boolean>;
  suppliers: Array<{ id: string; nama: string }>;
  bahanBaku: Array<{ id: string; nama: string; satuan: string; hargaSatuan: number }>;
}

export interface BulkActionsToolbarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkDelete: (ids: string[]) => void;
  onBulkStatusUpdate: (ids: string[], status: PurchaseStatus) => void;
  isProcessing: boolean;
}

// 🔧 Hook Return Types
export interface UsePurchaseTableReturn {
  tableState: PurchaseTableState;
  filteredPurchases: Purchase[];
  paginationInfo: PaginationInfo;
  sortedPurchases: Purchase[];
  updateSearchTerm: (term: string) => void;
  updatePage: (page: number) => void;
  updateItemsPerPage: (count: number) => void;
  updateSort: (field: keyof Purchase) => void;
  resetFilters: () => void;
}

export interface UseBulkOperationsReturn {
  bulkState: BulkOperationState;
  toggleSelection: (id: string) => void;
  toggleSelectionMode: () => void;
  selectAll: (items: Purchase[]) => void;
  clearSelection: () => void;
  bulkDelete: (ids: string[]) => Promise<boolean>;
  bulkStatusUpdate: (ids: string[], status: PurchaseStatus) => Promise<boolean>;
}

export interface UsePurchaseFormReturn {
  formData: PurchaseFormData;
  formErrors: PurchaseFormErrors;
  itemFormData: ItemFormData;
  itemFormErrors: ItemFormErrors;
  isValid: boolean;
  updateFormData: (data: Partial<PurchaseFormData>) => void;
  updateItemFormData: (data: Partial<ItemFormData>) => void;
  addItem: () => boolean;
  removeItem: (itemId: string) => void;
  validateForm: () => boolean;
  resetForm: () => void;
}

// 🚨 Error Types
export interface PurchaseError extends Error {
  code: string;
  details?: any;
  retryable?: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// 🎨 UI State Types
export interface LoadingState {
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;
}

export interface DialogState {
  isOpen: boolean;
  mode: 'create' | 'edit' | 'view';
  data?: Purchase | null;
}

// 📱 Responsive Types
export interface ViewportInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
  height: number;
}

// 🎯 Event Types
export interface PurchaseEvent {
  type: 'created' | 'updated' | 'deleted' | 'statusChanged';
  purchaseId: string;
  timestamp: Date;
  userId: string;
  details?: any;
}

// 🔄 Real-time Types
export interface RealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new?: any;
  old?: any;
  table: string;
}

// 📊 Export Types
export interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  dateRange?: {
    start: Date;
    end: Date;
  };
  includeItems: boolean;
  selectedIds?: string[];
}

export interface ExportResult {
  success: boolean;
  downloadUrl?: string;
  filename?: string;
  error?: string;
}

// 🎯 Default Values
export const DEFAULT_PURCHASE_FORM: PurchaseFormData = {
  supplier: '',
  tanggal: new Date(),
  items: [],
  status: 'pending',
  metodePerhitungan: 'FIFO'
};

export const DEFAULT_ITEM_FORM: ItemFormData = {
  namaBarang: '',
  jumlah: 0,
  satuan: '',
  hargaSatuan: 0
};

export const DEFAULT_TABLE_STATE: PurchaseTableState = {
  searchTerm: '',
  currentPage: 1,
  itemsPerPage: 10,
  selectedItems: [],
  isSelectionMode: false,
  sortConfig: {
    field: 'tanggal',
    direction: 'desc'
  }
};

export const DEFAULT_SEARCH_FILTERS: SearchFilters = {
  searchTerm: '',
  statusFilter: 'all',
  supplierFilter: 'all',
  dateRangeFilter: {
    start: null,
    end: null
  },
  amountRangeFilter: {
    min: null,
    max: null
  }
};

// 🎨 Status Colors & Labels
export const PURCHASE_STATUS_CONFIG = {
  pending: {
    label: 'Menunggu',
    color: 'bg-yellow-100 text-yellow-800',
    icon: '⏳'
  },
  completed: {
    label: 'Selesai', 
    color: 'bg-green-100 text-green-800',
    icon: '✅'
  },
  cancelled: {
    label: 'Dibatalkan',
    color: 'bg-red-100 text-red-800', 
    icon: '❌'
  }
} as const;

// 🔧 Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type PurchaseKeys = keyof Purchase;

export type Sortable<T> = {
  [K in keyof T]: T[K] extends string | number | Date ? K : never;
}[keyof T];

// Type guards
export const isPurchaseStatus = (status: string): status is PurchaseStatus => {
  return ['pending', 'completed', 'cancelled'].includes(status);
};

export const isPurchaseItem = (item: any): item is PurchaseItem => {
  return item && 
    typeof item.id === 'string' &&
    typeof item.namaBarang === 'string' &&
    typeof item.jumlah === 'number' &&
    typeof item.satuan === 'string' &&
    typeof item.hargaSatuan === 'number' &&
    typeof item.totalHarga === 'number';
};

export const isPurchase = (purchase: any): purchase is Purchase => {
  return purchase &&
    typeof purchase.id === 'string' &&
    typeof purchase.supplier === 'string' &&
    typeof purchase.totalNilai === 'number' &&
    purchase.tanggal instanceof Date &&
    Array.isArray(purchase.items) &&
    purchase.items.every(isPurchaseItem) &&
    isPurchaseStatus(purchase.status);
};