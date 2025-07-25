// src/components/orders/types/order.ts - FIXED VERSION
// Consistent with all implementations and fixes

// ==================== CORE ORDER TYPES ====================

export interface Order {
  id: string;
  nomorPesanan: string;
  namaPelanggan: string;
  teleponPelanggan?: string;
  emailPelanggan?: string;          // 🔧 FIX: Add missing field from context
  alamatPengiriman?: string;        // 🔧 FIX: Rename from alamatPelanggan for consistency
  tanggal: Date | string;
  status: OrderStatus;
  totalPesanan: number;
  subtotal?: number;                // 🔧 FIX: Add missing field from context
  pajak?: number;                   // 🔧 FIX: Add missing field from context
  items?: OrderItem[];
  catatan?: string;                 // 🔧 FIX: Rename from catatanPesanan for consistency
  userId?: string;                  // 🔧 FIX: Add missing field from context
  createdAt?: Date | string;        // 🔧 FIX: Allow string for DB compatibility
  updatedAt?: Date | string;        // 🔧 FIX: Allow string for DB compatibility
}

export interface NewOrder extends Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'userId'> {
  // All fields from Order except the auto-generated ones
}

export interface OrderItem {
  id: string;
  nama: string;
  harga: number;
  jumlah: number;
  subtotal: number;
  // 🔧 FIX: Add optional fields for flexibility
  kategori?: string;
  satuan?: string;
  catatan?: string;
}

export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'processing' 
  | 'ready'
  | 'delivered'
  | 'completed'
  | 'cancelled';

export interface OrderStatusOption {
  key: OrderStatus;
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
}

// ==================== CONTEXT TYPES ====================

export interface OrderContextType {
  orders: Order[];
  loading: boolean;
  addOrder: (order: NewOrder) => Promise<boolean>;
  updateOrder: (id: string, updates: Partial<Order>) => Promise<boolean>;
  deleteOrder: (id: string) => Promise<boolean>;
  // 🔧 FIX: Make bulk operations consistent with implementation
  bulkDeleteOrders?: (ids: string[]) => Promise<boolean>;
  bulkUpdateStatus?: (ids: string[], newStatus: string) => Promise<boolean>; // 🔧 FIX: Rename for clarity
}

// ==================== DATE RANGE TYPES ====================

// 🔧 FIX: Make DateRange consistent with dashboardUtils
export interface DateRange {
  from: Date | string;              // 🔧 FIX: Allow string for flexibility
  to?: Date | string;               // 🔧 FIX: Make optional and allow string
}

// 🔧 FIX: Add preset type for consistency
export interface DateRangePreset {
  label: string;
  range: {
    from: Date;
    to: Date;
  };
}

// ==================== FILTER TYPES ====================

export interface OrderFilters {
  searchTerm: string;
  statusFilter: string;
  dateRange: DateRange | undefined;
  // 🔧 FIX: Add optional advanced filters
  customerFilter?: string;
  minAmount?: number;
  maxAmount?: number;
  itemFilter?: string;
}

// ==================== PAGINATION TYPES ====================

export interface PaginationState {
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
  totalItems: number;
  // 🔧 FIX: Add navigation helpers
  hasNext?: boolean;
  hasPrev?: boolean;
  startIndex?: number;
  endIndex?: number;
}

// ==================== SELECTION TYPES ====================

export interface SelectionState {
  selectedOrderIds: string[];
  isSelectionMode: boolean;
  allCurrentSelected: boolean;
  someCurrentSelected: boolean;
  // 🔧 FIX: Add selection helpers
  selectedCount?: number;
  totalCount?: number;
}

// ==================== HOOK RETURN TYPES ====================

// 🔧 FIX: Add comprehensive hook return types
export interface UseOrderFiltersResult {
  filters: OrderFilters;
  filteredOrders: Order[];
  hasActiveFilters: boolean;
  setSearchTerm: (term: string) => void;
  setStatusFilter: (status: string) => void;
  setDateRange: (range: DateRange | undefined) => void;
  updateFilters: (updates: Partial<OrderFilters>) => void;
  clearFilters: () => void;
}

export interface UseOrderPaginationResult extends PaginationState {
  currentOrders: Order[];
  setCurrentPage: (page: number) => void;
  setItemsPerPage: (count: number) => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;
  goToNextPage: () => void;
  goToPrevPage: () => void;
}

export interface UseOrderSelectionResult extends SelectionState {
  toggleSelectionMode: () => void;
  toggleSelectOrder: (orderId: string, checked: boolean) => void;
  toggleSelectAll: (orders: Order[]) => void;
  clearSelection: () => void;
  getSelectedOrders: (orders: Order[]) => Order[];
}

// ==================== COMPONENT PROP TYPES ====================

// 🔧 FIX: Add common component prop interfaces
export interface OrderTableProps {
  orders: Order[];
  isLoading?: boolean;
  isSelectionMode?: boolean;
  selectedOrderIds?: string[];
  allCurrentSelected?: boolean;
  someCurrentSelected?: boolean;
  hasFilters?: boolean;
  onToggleSelectAll?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onToggleSelectOrder?: (orderId: string, checked: boolean) => void;
  onStatusChange?: (orderId: string, newStatus: string) => void;
  onEdit?: (order: Order) => void;
  onDelete?: (orderId: string) => void;
  onFollowUp?: (order: Order) => void;
  onViewDetail?: (order: Order) => void;
  onAddFirst?: () => void;
  onClearFilters?: () => void;
}

export interface FilterBarProps {
  filters: OrderFilters;
  onFiltersChange: (filters: Partial<OrderFilters>) => void;
  onPageChange?: (page: number) => void;
  onClearFilters?: () => void;
  disabled?: boolean;
}

export interface SelectionToolbarProps {
  isSelectionMode: boolean;
  selectedCount: number;
  totalCount: number;
  onToggleSelectionMode: () => void;
  onClearSelection: () => void;
  onSelectAll: () => void;
  onBulkEdit: () => void;
  onBulkDelete: () => void;
  disabled?: boolean;
}

// ==================== FORM TYPES ====================

// 🔧 FIX: Add form-related types
export interface OrderFormData {
  namaPelanggan: string;
  teleponPelanggan?: string;
  emailPelanggan?: string;
  alamatPengiriman?: string;
  tanggal: Date | string;
  status: OrderStatus;
  items: OrderItem[];
  catatan?: string;
  subtotal?: number;
  pajak?: number;
  totalPesanan: number;
}

export interface OrderFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<Order> | Partial<NewOrder>) => Promise<void>;
  initialData?: Order | null;
  loading?: boolean;
}

// ==================== API TYPES ====================

// 🔧 FIX: Add API response types
export interface OrderApiResponse {
  data?: Order[];
  error?: string;
  count?: number;
  message?: string;
}

export interface BulkOperationResult {
  success: boolean;
  successCount: number;
  failureCount: number;
  errors?: string[];
  message?: string;
}

// ==================== UTILITY TYPES ====================

// 🔧 FIX: Add utility types for transformations
export interface OrderDBRecord {
  id: string;
  nomor_pesanan: string;
  nama_pelanggan: string;
  telepon_pelanggan?: string;
  email_pelanggan?: string;
  alamat_pengiriman?: string;
  tanggal: string;
  status: OrderStatus;
  total_pesanan: number;
  subtotal?: number;
  pajak?: number;
  items?: OrderItem[];
  catatan?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// 🔧 FIX: Add validation types
export interface OrderValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface OrderValidationResult {
  isValid: boolean;
  errors: OrderValidationError[];
}

// ==================== EVENT TYPES ====================

// 🔧 FIX: Add event handler types
export type OrderEventHandler = (order: Order) => void;
export type OrderStatusChangeHandler = (orderId: string, newStatus: OrderStatus) => void;
export type OrderDeleteHandler = (orderId: string) => void;
export type BulkOrderHandler = (orderIds: string[]) => void;
export type FilterChangeHandler = (filters: Partial<OrderFilters>) => void;
export type PageChangeHandler = (page: number) => void;

// ==================== EXPORT GROUPS ====================

// 🔧 FIX: Organized exports for better imports
export type {
  // Core types
  Order as OrderType,
  NewOrder as NewOrderType,
  OrderItem as OrderItemType,
  OrderStatus as OrderStatusType,
  
  // Context types
  OrderContextType as OrderContext,
  
  // State types
  OrderFilters as FiltersType,
  PaginationState as PaginationType,
  SelectionState as SelectionType,
  
  // Component types
  OrderTableProps,
  FilterBarProps,
  SelectionToolbarProps,
  OrderFormProps,
  
  // Hook types
  UseOrderFiltersResult,
  UseOrderPaginationResult,
  UseOrderSelectionResult,
  
  // Utility types
  DateRange,
  DateRangePreset,
  OrderDBRecord,
  OrderValidationError,
  OrderValidationResult,
  BulkOperationResult,
  
  // Event types
  OrderEventHandler,
  OrderStatusChangeHandler,
  OrderDeleteHandler,
  BulkOrderHandler,
  FilterChangeHandler,
  PageChangeHandler,
};

// ==================== DEFAULT VALUES ====================

// 🔧 FIX: Add default values for consistency
export const DEFAULT_ORDER_FILTERS: OrderFilters = {
  searchTerm: '',
  statusFilter: 'all',
  dateRange: undefined,
};

export const DEFAULT_PAGINATION: PaginationState = {
  currentPage: 1,
  itemsPerPage: 10,
  totalPages: 1,
  totalItems: 0,
};

export const DEFAULT_SELECTION: SelectionState = {
  selectedOrderIds: [],
  isSelectionMode: false,
  allCurrentSelected: false,
  someCurrentSelected: false,
};

// 🔧 FIX: Add status validation helpers
export const ORDER_STATUS_VALUES: OrderStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'ready',
  'delivered',
  'completed',
  'cancelled'
];

export const isValidOrderStatus = (status: string): status is OrderStatus => {
  return ORDER_STATUS_VALUES.includes(status as OrderStatus);
};

// 🔧 FIX: Add field validation helpers
export const REQUIRED_ORDER_FIELDS: (keyof Order)[] = [
  'namaPelanggan',
  'tanggal',
  'status',
  'totalPesanan'
];

export const isRequiredOrderField = (field: string): field is keyof Order => {
  return REQUIRED_ORDER_FIELDS.includes(field as keyof Order);
};