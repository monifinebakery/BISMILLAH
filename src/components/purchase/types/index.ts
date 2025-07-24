// Purchase feature types

// Re-export core types from main types
export type { Purchase, PurchaseItem } from '@/types/supplier';

// Table-specific types
export interface PurchaseTableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, record: Purchase) => React.ReactNode;
}

export interface PaginationConfig {
  current: number;
  pageSize: number;
  total: number;
  showSizeChanger?: boolean;
  showQuickJumper?: boolean;
  pageSizeOptions?: string[];
}

export interface TableSortConfig {
  field: keyof Purchase;
  direction: 'asc' | 'desc';
}

export interface BulkActionConfig {
  key: string;
  label: string;
  icon?: string;
  type?: 'default' | 'danger' | 'warning';
  confirm?: boolean;
  disabled?: (selectedItems: Purchase[]) => boolean;
}

// Form-specific types
export interface PurchaseFormConfig {
  mode: 'create' | 'edit';
  initialData?: Purchase;
  onSubmit: (data: any) => Promise<boolean>;
  onCancel: () => void;
  suppliers: any[];
  bahanBaku: any[];
}

export interface ItemFormConfig {
  bahanBaku: any[];
  onAdd: (item: any) => void;
  onCancel?: () => void;
  autoFillFromBahanBaku?: boolean;
}

export interface FormValidationError {
  field: string;
  message: string;
  type: 'required' | 'invalid' | 'custom';
}

// Search and filter types
export interface SearchConfig {
  placeholder?: string;
  debounceMs?: number;
  minLength?: number;
  fields?: (keyof Purchase)[];
}

export interface FilterOption {
  value: string | number;
  label: string;
  count?: number;
}

export interface FilterConfig {
  key: string;
  label: string;
  type: 'select' | 'multiselect' | 'daterange' | 'numberrange';
  options?: FilterOption[];
  defaultValue?: any;
}

export interface SortOption {
  value: string;
  label: string;
  field: keyof Purchase;
  direction: 'asc' | 'desc';
}

// Notification types
export interface PurchaseNotificationData {
  purchaseId?: string;
  supplierId: string;
  amount: number;
  itemCount?: number;
  status?: string;
  operation: 'create' | 'update' | 'delete' | 'statusChange' | 'bulk';
}

// State management types
export interface PurchaseState {
  purchases: Purchase[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export interface PurchaseTableState {
  selectedIds: string[];
  isSelectionMode: boolean;
  currentPage: number;
  pageSize: number;
  sortConfig: TableSortConfig | null;
  filters: Record<string, any>;
  searchTerm: string;
}

export interface PurchaseFormState {
  isOpen: boolean;
  mode: 'create' | 'edit';
  editingPurchase: Purchase | null;
  isSubmitting: boolean;
  hasUnsavedChanges: boolean;
}

// Component props types
export interface PurchaseTableProps {
  purchases: Purchase[];
  suppliers: any[];
  isLoading?: boolean;
  onEdit?: (purchase: Purchase) => void;
  onDelete?: (id: string) => void;
  onStatusChange?: (id: string, status: string) => void;
  onBulkAction?: (action: string, selectedIds: string[]) => void;
}

export interface PurchaseRowProps {
  purchase: Purchase;
  suppliers: any[];
  isSelected?: boolean;
  isSelectionMode?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
  onEdit?: (purchase: Purchase) => void;
  onDelete?: (id: string) => void;
  onStatusChange?: (id: string, status: string) => void;
}

export interface PurchaseDialogProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  purchase?: Purchase;
  suppliers: any[];
  bahanBaku: any[];
  onSubmit: (data: any) => Promise<boolean>;
  onClose: () => void;
}

export interface BulkActionsProps {
  selectedIds: string[];
  selectedPurchases: Purchase[];
  suppliers: any[];
  onAction: (action: string) => Promise<boolean>;
  onClear: () => void;
}

// API response types
export interface PurchaseApiResponse {
  data: Purchase[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface PurchaseCreateResponse {
  success: boolean;
  data?: Purchase;
  error?: string;
}

export interface PurchaseUpdateResponse {
  success: boolean;
  data?: Purchase;
  error?: string;
}

export interface PurchaseDeleteResponse {
  success: boolean;
  error?: string;
}

export interface BulkOperationResponse {
  successful: number;
  failed: number;
  errors?: Array<{ id: string; error: string }>;
}

// Configuration types
export interface PurchaseFeatureConfig {
  enableBulkOperations?: boolean;
  enableRealTimeUpdates?: boolean;
  enableNotifications?: boolean;
  defaultPageSize?: number;
  maxPageSize?: number;
  allowedStatuses?: string[];
  requiredFields?: string[];
  autoSaveInterval?: number;
  searchDebounceMs?: number;
}

export interface PurchaseDisplayConfig {
  showSupplierColumn?: boolean;
  showDateColumn?: boolean;
  showAmountColumn?: boolean;
  showStatusColumn?: boolean;
  showActionsColumn?: boolean;
  compactMode?: boolean;
  showRowNumbers?: boolean;
  highlightRecentItems?: boolean;
}

// Event types
export interface PurchaseEvent {
  type: 'create' | 'update' | 'delete' | 'statusChange' | 'bulk';
  purchase?: Purchase;
  purchases?: Purchase[];
  oldData?: any;
  newData?: any;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface PurchaseEventHandler {
  onPurchaseCreated?: (event: PurchaseEvent) => void;
  onPurchaseUpdated?: (event: PurchaseEvent) => void;
  onPurchaseDeleted?: (event: PurchaseEvent) => void;
  onStatusChanged?: (event: PurchaseEvent) => void;
  onBulkOperation?: (event: PurchaseEvent) => void;
}

// Utility types
export type PurchaseStatus = 'pending' | 'completed' | 'cancelled';
export type PurchaseFormMode = 'create' | 'edit';
export type BulkActionType = 'delete' | 'updateStatus' | 'export';
export type SortDirection = 'asc' | 'desc';
export type FilterType = 'text' | 'select' | 'date' | 'number' | 'boolean';

// Generic types for reusability
export interface DataTableColumn<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  render?: (value: any, record: T) => React.ReactNode;
}

export interface DataTableConfig<T> {
  columns: DataTableColumn<T>[];
  pagination?: PaginationConfig;
  selection?: {
    enabled: boolean;
    mode: 'single' | 'multiple';
  };
  sorting?: {
    enabled: boolean;
    default?: TableSortConfig;
  };
  filtering?: {
    enabled: boolean;
    configs: FilterConfig[];
  };
}

// Hook return types
export interface UsePurchaseOperationsReturn {
  isLoading: boolean;
  createPurchase: (data: any) => Promise<boolean>;
  updatePurchase: (id: string, data: any, oldData: Purchase) => Promise<boolean>;
  deletePurchase: (id: string, purchase: Purchase) => Promise<boolean>;
  changeStatus: (id: string, status: string, purchase: Purchase) => Promise<boolean>;
}

export interface UseBulkOperationsReturn {
  isLoading: boolean;
  selectedSummary: {
    count: number;
    totalValue: number;
    suppliers: string[];
    purchases: Purchase[];
  };
  bulkDelete: () => Promise<boolean>;
  bulkUpdateStatus: (status: string) => Promise<boolean>;
  exportSelected: (format: 'csv' | 'excel') => Promise<boolean>;
}

export interface UsePurchaseSearchReturn {
  filters: any;
  filteredPurchases: Purchase[];
  searchStats: {
    total: number;
    filtered: number;
    hidden: number;
    hasActiveFilters: boolean;
  };
  updateFilter: (key: string, value: any) => void;
  clearFilters: () => void;
  setQuickFilter: (type: string) => void;
}

// Error types
export interface PurchaseError {
  code: string;
  message: string;
  field?: string;
  details?: any;
}

export interface ValidationErrorMap {
  [field: string]: string[];
}

// Export all types as a namespace for convenience
export namespace PurchaseTypes {
  export type TableColumn = PurchaseTableColumn;
  export type FormConfig = PurchaseFormConfig;
  export type SearchConfig = SearchConfig;
  export type NotificationData = PurchaseNotificationData;
  export type FeatureConfig = PurchaseFeatureConfig;
  export type Event = PurchaseEvent;
  export type Status = PurchaseStatus;
  export type Error = PurchaseError;
}