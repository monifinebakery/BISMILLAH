// src/components/orders/types.ts - Enhanced with Context Loading States

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
  recipeId?: string;
  recipeCategory?: string;
  isFromRecipe?: boolean;
  description?: string;
  unit?: string;
}

export interface Order {
  id: string;
  userId: string;
  nomorPesanan: string; // ✅ Added: Order number field
  createdAt: Date;
  updatedAt: Date;
  tanggal: Date; // ✅ Added: Order date field
  
  // Customer Info
  namaPelanggan: string;
  teleponPelanggan?: string;
  emailPelanggan?: string;
  alamatPengiriman?: string;
  
  // Order Details
  items: OrderItem[];
  status: OrderStatus;
  catatan?: string;
  
  // Financial Info
  subtotal: number;
  pajak: number;
  totalPesanan: number;
  
  // Recipe Analytics (optional)
  recipeCount?: number;
  customItemCount?: number;
  totalRecipeValue?: number;
}

export interface NewOrder {
  namaPelanggan: string;
  teleponPelanggan?: string;
  emailPelanggan?: string;
  alamatPengiriman?: string;
  items: OrderItem[];
  status?: OrderStatus;
  catatan?: string;
  subtotal?: number;
  pajak?: number;
  totalPesanan?: number;
  tanggal?: Date; // ✅ Added: Optional order date
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

// ✅ ENHANCED: Order Context Type with loading states
export interface EnhancedOrderContextType {
  // Core data
  orders: Order[];
  loading: boolean;
  
  // Connection status
  isConnected: boolean;
  contextReady: boolean;
  contextLoadingStates: ContextLoadingStates;
  
  // CRUD operations
  addOrder: (order: NewOrder) => Promise<boolean>;
  updateOrder: (id: string, updatedData: Partial<Order>) => Promise<boolean>;
  deleteOrder: (id: string) => Promise<boolean>;
  
  // Utility functions
  refreshData: () => Promise<void>;
  getOrderById: (id: string) => Order | undefined;
  getOrdersByStatus: (status: string) => Order[];
  getOrdersByDateRange: (startDate: Date, endDate: Date) => Order[];
  
  // Bulk operations
  bulkUpdateStatus: (orderIds: string[], newStatus: string) => Promise<boolean>;
  bulkDeleteOrders: (orderIds: string[]) => Promise<boolean>;
}

// ✅ ENHANCED: Hook return type
export interface UseOrderDataReturn {
  orders: Order[];
  loading: boolean;
  isConnected: boolean;
  addOrder: (order: NewOrder) => Promise<boolean>;
  updateOrder: (id: string, updatedData: Partial<Order>) => Promise<boolean>;
  deleteOrder: (id: string) => Promise<boolean>;
  refreshData: () => Promise<void>;
  getOrderById: (id: string) => Order | undefined;
  getOrdersByStatus: (status: string) => Order[];
  getOrdersByDateRange: (startDate: Date, endDate: Date) => Order[];
  bulkUpdateStatus: (orderIds: string[], newStatus: string) => Promise<boolean>;
  bulkDeleteOrders: (orderIds: string[]) => Promise<boolean>;
}

// ✅ UI State Types
export interface OrderFilters {
  search: string;
  status: string | 'all';
  dateFrom: Date | null;
  dateTo: Date | null;
  recipeFilter?: string;
  itemTypeFilter?: 'all' | 'recipe' | 'custom';
}

export interface UseOrderUIReturn {
  // Data
  currentOrders: Order[];
  totalItems: number;
  totalPages: number;
  
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
  telepon_pelanggan?: string;
  email_pelanggan?: string;
  alamat_pengiriman?: string;
  items: OrderItem[];
  status: OrderStatus;
  catatan?: string;
  subtotal: number;
  pajak: number;
  total_pesanan: number;
}

// Validation
export interface OrderValidationResult {
  isValid: boolean;
  errors: string[];
}

// Statistics dengan Recipe Analytics
export interface OrderStats {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  statusDistribution: {
    [key in OrderStatus]: number;
  };
  recipeUsage: {
    totalRecipeItems: number;
    totalCustomItems: number;
    recipeRevenue: number;
    customRevenue: number;
    popularRecipes: Array<{
      recipeId: string;
      recipeName: string;
      orderCount: number;
      totalQuantity: number;
      totalRevenue: number;
    }>;
  };
  todayOrders: number;
  weekOrders: number;
  monthOrders: number;
}

export type OrderSortField = 
  | 'createdAt' 
  | 'namaPelanggan' 
  | 'status' 
  | 'totalPesanan'
  | 'recipeCount'
  | 'tanggal';

// ✅ ENHANCED: Connection Health Status
export interface ConnectionHealthStatus {
  isConnected: boolean;
  lastPing: Date | null;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected';
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
  const recipeItems = items.filter(item => item.isFromRecipe);
  const customItems = items.filter(item => !item.isFromRecipe);
  
  return {
    recipeCount: recipeItems.length,
    customItemCount: customItems.length,
    recipeValue: recipeItems.reduce((sum, item) => sum + item.total, 0),
    customValue: customItems.reduce((sum, item) => sum + item.total, 0),
    recipePercentage: items.length > 0 ? (recipeItems.length / items.length) * 100 : 0
  };
};

export const getRecipeUsageByOrder = (orders: Order[]) => {
  const recipeUsage = new Map<string, {
    recipeId: string;
    recipeName: string;
    orderCount: number;
    totalQuantity: number;
    totalRevenue: number;
  }>();

  orders.forEach(order => {
    const recipeItems = order.items.filter(item => item.isFromRecipe && item.recipeId);
    
    recipeItems.forEach(item => {
      const key = item.recipeId!;
      const existing = recipeUsage.get(key);
      
      if (existing) {
        existing.orderCount += 1;
        existing.totalQuantity += item.quantity;
        existing.totalRevenue += item.total;
      } else {
        recipeUsage.set(key, {
          recipeId: item.recipeId!,
          recipeName: item.name,
          orderCount: 1,
          totalQuantity: item.quantity,
          totalRevenue: item.total
        });
      }
    });
  });

  return Array.from(recipeUsage.values())
    .sort((a, b) => b.totalRevenue - a.totalRevenue);
};

// ✅ CONNECTION HEALTH: Helper functions
export const getConnectionQuality = (reconnectAttempts: number, maxAttempts: number): ConnectionHealthStatus['connectionQuality'] => {
  if (reconnectAttempts === 0) return 'excellent';
  if (reconnectAttempts <= maxAttempts * 0.3) return 'good';
  if (reconnectAttempts <= maxAttempts * 0.7) return 'poor';
  return 'disconnected';
};