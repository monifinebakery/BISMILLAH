// src/components/orders/types.ts - FIXED EnhancedOrderContextType

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number; // Current active price based on pricing mode
  total: number;
  recipe_id?: string;
  recipe_category?: string;
  is_from_recipe?: boolean;
  description?: string;
  unit?: string;
  // New fields for per piece pricing support
  pricing_mode?: 'per_portion' | 'per_piece';
  price_per_portion?: number;
  price_per_piece?: number;
}

export interface Order {
  id: string;
  user_id: string;
  order_number: string;
  created_at: Date;
  updated_at: Date;
  tanggal: Date;
  tanggal_selesai?: Date; // ✅ ADD THIS
  
  // Customer Info
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  alamat_pengiriman?: string;
  
  // Order Details
  items: OrderItem[];
  status: OrderStatus;
  catatan?: string;
  
  // Financial Info
  subtotal: number;
  diskon_promo?: number;
  total_setelah_diskon?: number;
  tax_amount: number;
  total_amount: number;

  // Promo Info
  promo_id?: string;
  promo_code?: string;
  promo_type?: string;

  // Recipe Analytics (optional)
  recipe_count?: number;
  custom_item_count?: number;
  total_recipe_value?: number;
}

export interface NewOrder {
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  alamat_pengiriman?: string;
  items: OrderItem[];
  status?: OrderStatus;
  catatan?: string;
  subtotal?: number;
  diskon_promo?: number;
  total_setelah_diskon?: number;
  tax_amount?: number;
  total_amount?: number;
  tanggal?: Date;
  tanggal_selesai?: Date;
  
  // Promo Info
  promo_id?: string;
  promo_code?: string;
  promo_type?: string;
}

export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'delivered'
  | 'cancelled'
  | 'completed';

// ✅ ENHANCED: Context Loading States
export interface ContextLoadingStates {
  auth: boolean;
  activity: boolean;
  financial: boolean;
  settings: boolean;
  notification: boolean;
}

// ✅ FIXED: Enhanced Order Context Type with updateOrderStatus
export interface EnhancedOrderContextType {
  // Core data
  orders: Order[];
  loading: boolean;

  // Connection status
  is_connected: boolean;
  context_ready: boolean;
  context_loading_states?: ContextLoadingStates; // Made optional since OrderProvider doesn't use it
  
  // ✅ FIXED: CRUD operations with updateOrderStatus
  addOrder: (order: NewOrder) => Promise<boolean>;
  updateOrder: (id: string, updatedData: Partial<Order>) => Promise<boolean>;
  updateOrderStatus: (id: string, newStatus: string) => Promise<boolean>; // ✅ MUST HAVE THIS!
  deleteOrder: (id: string) => Promise<boolean>;
  
  // Utility functions
  refreshData: () => Promise<void>;
  getOrderById: (id: string) => Order | undefined;
  getOrdersByStatus: (status: string) => Order[];
  getOrdersByDateRange: (startDate: Date, endDate: Date) => Order[];
  
  // Bulk operations
  bulkUpdateStatus: (orderIds: string[], newStatus: string) => Promise<boolean>;
  bulkDeleteOrders: (orderIds: string[]) => Promise<boolean>;
  bulkAddOrders: (orders: NewOrder[]) => Promise<{ success: number; total: number }>;
  
  // ✅ Additional utilities (that OrderProvider provides)
  searchOrders: (searchTerm: string) => Order[];
  getTotalRevenue: () => number;
  getPendingOrdersCount: () => number;
  getProcessingOrdersCount: () => number;
  getCompletedOrdersCount: () => number;
  getCancelledOrdersCount: () => number;
}

// ✅ ENHANCED: Hook return type with dedicated status update
export interface UseOrderDataReturn {
  orders: Order[];
  loading: boolean;
  is_connected: boolean;
  addOrder: (order: NewOrder) => Promise<boolean>;
  updateOrder: (id: string, updatedData: Partial<Order>) => Promise<boolean>;
  updateOrderStatus: (id: string, newStatus: string) => Promise<boolean>; // ✅ MUST HAVE THIS!
  deleteOrder: (id: string) => Promise<boolean>;
  refreshData: () => Promise<void>;
  getOrderById: (id: string) => Order | undefined;
  getOrdersByStatus: (status: string) => Order[];
  getOrdersByDateRange: (startDate: Date, endDate: Date) => Order[];
  bulkUpdateStatus: (orderIds: string[], newStatus: string) => Promise<boolean>;
  bulkDeleteOrders: (orderIds: string[]) => Promise<boolean>;
}

// ✅ UI State Types with filters
export interface OrderFilters {
  search: string;
  status: string | 'all';
  date_from: Date | null;
  date_to: Date | null;
  recipe_filter?: string;
  item_type_filter?: 'all' | 'recipe' | 'custom';
  min_amount?: number | null; // ✅ Added for useOrderUI compatibility
  max_amount?: number | null; // ✅ Added for useOrderUI compatibility
}

export interface UseOrderUIReturn {
  // Data
  currentOrders: Order[];
  totalItems: number;
  totalPages: number;
  filteredOrders: Order[]; // ✅ Added for useOrderUI compatibility

  // Pagination
  currentPage: number;
  itemsPerPage: number;
  setCurrentPage: (page: number) => void;
  setItemsPerPage: (items: number) => void;
  
  // Filters
  filters: OrderFilters;
  updateFilters: (newFilters: Partial<OrderFilters>) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
  
  // Selection
  selectedOrderIds: string[];
  isSelectionMode: boolean;
  allCurrentSelected: boolean;
  someCurrentSelected: boolean;
  toggleSelectOrder: (orderId: string, forceValue?: boolean) => void;
  toggleSelectAll: (orders: Order[]) => void;
  clearSelection: () => void;
  toggleSelectionMode: () => void;
  getSelectedOrders?: (allOrders: Order[]) => Order[]; // ✅ Added for useOrderUI compatibility
}

// Database format (snake_case)
export interface OrderDB {
  id: string;
  user_id: string;
  nomor_pesanan: string;
  created_at: string;
  updated_at: string;
  tanggal: string;
  nama_pelanggan: string;
  telepon_pelanggan: string;
  email_pelanggan?: string;
  alamat_pengiriman?: string;
  items: OrderItem[];
  status: OrderStatus;
  catatan?: string;
  subtotal: number;
  pajak: number;
  total_pesanan: number;
  tanggal_selesai?: string; // ✅ ADD THIS
}

// Validation
export interface OrderValidationResult {
  is_valid: boolean;
  errors: string[];
}

// Statistics dengan Recipe Analytics
export interface OrderStats {
  total_orders: number;
  total_revenue: number;
  average_order_value: number;
  status_distribution: {
    [key in OrderStatus]: number;
  };
  recipe_usage: {
    total_recipe_items: number;
    total_custom_items: number;
    recipe_revenue: number;
    custom_revenue: number;
    popular_recipes: Array<{
      recipe_id: string;
      recipe_name: string;
      order_count: number;
      total_quantity: number;
      total_revenue: number;
    }>;
  };
  today_orders: number;
  week_orders: number;
  month_orders: number;
}

export type OrderSortField =
  | 'created_at'
  | 'customer_name'
  | 'status'
  | 'total_amount'
  | 'recipe_count'
  | 'tanggal';

// ✅ ENHANCED: Connection Health Status
export interface ConnectionHealthStatus {
  is_connected: boolean;
  last_ping: Date | null;
  reconnect_attempts: number;
  max_reconnect_attempts: number;
  connection_quality: 'excellent' | 'good' | 'poor' | 'disconnected';
}

// ✅ ERROR HANDLING: Error types for better debugging
export interface OrderError {
  type: 'network' | 'validation' | 'permission' | 'server' | 'unknown';
  message: string;
  code?: string;
  details?: any;
  timestamp: Date;
}

// Form state
export interface OrderFormData extends NewOrder {}

// Constants
export const ORDER_STATUSES: OrderStatus[] = [
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'delivered',
  'completed',
  'cancelled'
];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Menunggu Konfirmasi',
  confirmed: 'Dikonfirmasi',
  preparing: 'Sedang Diproses',
  ready: 'Siap Diambil',
  delivered: 'Sudah Dikirim',
  completed: 'Selesai',
  cancelled: 'Dibatalkan'
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-300',
  preparing: 'bg-purple-100 text-purple-800 border-purple-300',
  ready: 'bg-green-100 text-green-800 border-green-300',
  delivered: 'bg-teal-100 text-teal-800 border-teal-300',
  completed: 'bg-gray-100 text-gray-800 border-gray-300',
  cancelled: 'bg-red-100 text-red-800 border-red-300'
};

// Helper functions
export const getStatusText = (status: OrderStatus): string => {
  return ORDER_STATUS_LABELS[status] || status;
};

export const getStatusColor = (status: OrderStatus): string => {
  return ORDER_STATUS_COLORS[status] || 'bg-gray-100 text-gray-800 border-gray-300';
};

// ✅ ENHANCED: Recipe Integration Helpers
export const calculateRecipeStats = (items: OrderItem[]) => {
  const recipeItems = items.filter(item => item.is_from_recipe);
  const customItems = items.filter(item => !item.is_from_recipe);

  return {
    recipe_count: recipeItems.length,
    custom_item_count: customItems.length,
    recipe_value: recipeItems.reduce((sum, item) => sum + item.total, 0),
    custom_value: customItems.reduce((sum, item) => sum + item.total, 0),
    recipe_percentage: items.length > 0 ? (recipeItems.length / items.length) * 100 : 0
  };
};

export const getRecipeUsageByOrder = (orders: Order[]) => {
  const recipeUsage = new Map<string, {
    recipe_id: string;
    recipe_name: string;
    order_count: number;
    total_quantity: number;
    total_revenue: number;
  }>();

  orders.forEach(order => {
    const recipeItems = order.items.filter(item => item.is_from_recipe && item.recipe_id);

    recipeItems.forEach(item => {
      const key = item.recipe_id!;
      const existing = recipeUsage.get(key);

      if (existing) {
        existing.order_count += 1;
        existing.total_quantity += item.quantity;
        existing.total_revenue += item.total;
      } else {
        recipeUsage.set(key, {
          recipe_id: item.recipe_id!,
          recipe_name: item.name,
          order_count: 1,
          total_quantity: item.quantity,
          total_revenue: item.total
        });
      }
    });
  });

  return Array.from(recipeUsage.values())
    .sort((a, b) => b.total_revenue - a.total_revenue);
};

// ✅ CONNECTION HEALTH: Helper functions
export const getConnectionQuality = (
  reconnectAttempts: number,
  maxAttempts: number
): ConnectionHealthStatus['connection_quality'] => {
  if (reconnectAttempts === 0) return 'excellent';
  if (reconnectAttempts <= maxAttempts * 0.3) return 'good';
  if (reconnectAttempts <= maxAttempts * 0.7) return 'poor';
  return 'disconnected';
};