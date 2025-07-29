// 🎯 120 lines - All types in one file
// Core Order Types
export type OrderStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'processing' 
  | 'shipped' 
  | 'delivered' 
  | 'cancelled' 
  | 'completed';

export interface OrderItem {
  id: string;
  productId?: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
  notes?: string;
}

export interface Order {
  id: string;
  nomorPesanan: string;
  namaPelanggan: string;
  teleponPelanggan: string;
  emailPelanggan: string;
  alamatPengiriman: string;
  tanggal: Date;
  items: OrderItem[];
  totalPesanan: number;
  status: OrderStatus;
  catatan: string;
  subtotal: number;
  pajak: number;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewOrder {
  namaPelanggan: string;
  teleponPelanggan?: string;
  emailPelanggan?: string;
  alamatPengiriman?: string;
  tanggal?: Date;
  items: OrderItem[];
  totalPesanan: number;
  status?: OrderStatus;
  catatan?: string;
  subtotal?: number;
  pajak?: number;
}

// Filter & UI Types
export interface OrderFilters {
  search: string;
  status: OrderStatus | 'all';
  dateFrom: Date | null;
  dateTo: Date | null;
  minAmount: number | null;
  maxAmount: number | null;
}

// Hook Return Types
export interface UseOrderDataReturn {
  orders: Order[];
  loading: boolean;
  isConnected: boolean;
  addOrder: (order: NewOrder) => Promise<boolean>;
  updateOrder: (id: string, updates: Partial<Order>) => Promise<boolean>;
  deleteOrder: (id: string) => Promise<boolean>;
  refreshData: () => Promise<void>;
  getOrderById: (id: string) => Order | undefined;
  getOrdersByStatus: (status: string) => Order[];
  getOrdersByDateRange: (startDate: Date, endDate: Date) => Order[];
  bulkUpdateStatus: (orderIds: string[], newStatus: string) => Promise<boolean>;
  bulkDeleteOrders: (orderIds: string[]) => Promise<boolean>;
}

export interface UseOrderUIReturn {
  // Filters
  filters: OrderFilters;
  filteredOrders: Order[];
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
  getSelectedOrders: (allOrders: Order[]) => Order[];
  
  // Pagination
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
  currentOrders: Order[];
  setCurrentPage: (page: number) => void;
  setItemsPerPage: (items: number) => void;
}

// Component Props Types  
export interface OrderTableProps {
  orders: Order[];
  isLoading: boolean;
  isSelectionMode: boolean;
  selectedOrderIds: string[];
  allCurrentSelected: boolean;
  someCurrentSelected: boolean;
  hasFilters: boolean;
  onToggleSelectAll: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onToggleSelectOrder: (orderId: string, forceValue?: boolean) => void;
  onStatusChange: (orderId: string, newStatus: string) => void;
  onEdit: (order: Order) => void;
  onDelete: (orderId: string) => void;
  onFollowUp: (order: Order) => void;
  onViewDetail: (order: Order) => void;
  onAddFirst: () => void;
  onClearFilters: () => void;
}

// Context Types
export interface OrderContextType {
  orders: Order[];
  loading: boolean;
  addOrder: (order: NewOrder) => Promise<boolean>;
  updateOrder: (id: string, updates: Partial<Order>) => Promise<boolean>;
  deleteOrder: (id: string) => Promise<boolean>;
}

export interface EnhancedOrderContextType extends OrderContextType {
  isConnected: boolean;
  refreshData: () => Promise<void>;
  getOrderById: (id: string) => Order | undefined;
  getOrdersByStatus: (status: string) => Order[];
  getOrdersByDateRange: (startDate: Date, endDate: Date) => Order[];
  bulkUpdateStatus: (orderIds: string[], newStatus: string) => Promise<boolean>;
  bulkDeleteOrders: (orderIds: string[]) => Promise<boolean>;
}