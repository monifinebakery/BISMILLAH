// src/components/orders/types.ts - Complete integration dengan types existing Anda

// ✅ EXTEND EXISTING TYPES: Menambahkan interface yang diperlukan untuk hooks
// (Your existing types already cover most of what we need)

// ✅ UI HOOK: Return type untuk useOrderUI (adjust based on your existing OrderFilters)
export interface UseOrderUIReturn {
  // Filters (using your existing OrderFilters interface)
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
  setItemsPerPage: (itemsPerPage: number) => void;
}

// ✅ DATA HOOK: Return type untuk useOrderData 
export interface UseOrderDataReturn {
  orders: Order[];
  loading: boolean;
  isConnected: boolean;
  addOrder: (order: NewOrder) => Promise<boolean>;
  updateOrder: (id: string, updatedData: Partial<Order>) => Promise<boolean>;
  deleteOrder: (id: string) => Promise<boolean>;
  refreshData: () => Promise<void>;
  getOrderById: (id: string) => Order | undefined;
  getOrdersByStatus: (status: OrderStatus) => Order[];
  getOrdersByDateRange: (startDate: Date, endDate: Date) => Order[];
  bulkUpdateStatus: (orderIds: string[], newStatus: OrderStatus) => Promise<boolean>;
  bulkDeleteOrders: (orderIds: string[]) => Promise<boolean>;
}

// ✅ EXPORT HOOK: Return type untuk useOrderExport
export interface UseOrderExportReturn {
  exportToCSV: (orders: Order[], filename?: string) => void;
  exportToJSON: (orders: Order[], filename?: string) => void;
  exportSelected: (orders: Order[], selectedIds: string[], format: 'csv' | 'json') => void;
}

// ✅ NOTIFICATIONS HOOK: Return type untuk useOrderNotifications
export interface UseOrderNotificationsReturn {
  sendWhatsAppMessage: (order: Order, customMessage?: string) => void;
  sendStatusUpdateNotification: (order: Order, oldStatus: OrderStatus, newStatus: OrderStatus) => void;
  sendOrderConfirmation: (order: Order) => void;
  sendOrderReminder: (orders: Order[]) => void;
}

// ✅ ENHANCED CONTEXT: Enhanced context interface untuk OrderProvider
export interface EnhancedOrderContextType extends UseOrderDataReturn {
  // React Query specific features
  invalidateOrders: () => void;
  prefetchOrders: () => void;
  getCachedOrderById: (id: string) => Order | undefined;
  getOrderStats: () => {
    total: number;
    thisMonth: number;
    lastMonth: number;
    completed: number;
    pending: number;
    totalRevenue: number;
    averageOrderValue: number;
  };

  // Query state information
  queryInfo: {
    isFetching: boolean;
    isError: boolean;
    lastUpdated: Date | null;
    cacheStatus: 'fresh' | 'stale' | 'idle';
  };
}

// ✅ UPDATE: OrderFilters interface to match your useOrderUI implementation
// (This should match the one in your useOrderUI hook)
export interface OrderFiltersUI {
  search: string;
  status: OrderStatus | 'all';
  dateFrom: Date | null;
  dateTo: Date | null;
  minAmount: number | null;
  maxAmount: number | null;
}

// ✅ COMPONENT PROPS: Interface untuk komponen props
export interface OrderTableProps {
  uiState: UseOrderUIReturn;
  loading: boolean;
  onEditOrder: (order: Order) => void;
  onDeleteOrder: (orderId: string) => Promise<void>;
  onStatusChange: (orderId: string, newStatus: string) => Promise<void>;
  onNewOrder: () => void;
  onFollowUp: (order: Order) => void;
  onViewDetail: (order: Order) => void;
}

export interface OrderFiltersProps {
  uiState: UseOrderUIReturn;
  loading: boolean;
}

export interface OrderControlsProps {
  uiState: UseOrderUIReturn;
  loading: boolean;
}

export interface OrderDialogsProps {
  showOrderForm: boolean;
  editingOrder: Order | null;
  showTemplateManager: boolean;
  selectedOrderForTemplate: Order | null;
  onSubmitOrder: (data: Partial<Order> | Partial<NewOrder>) => Promise<void>;
  onCloseOrderForm: () => void;
  onCloseTemplateManager: () => void;
}

// ✅ MIGRATION: Mapping untuk backward compatibility
export type OrderFiltersDeprecated = OrderFilters; // Your existing interface
export type OrderFiltersNew = OrderFiltersUI; // New interface for useOrderUI

// Example usage comment untuk developer:
/*
UPDATED USAGE EXAMPLES:

// Using your existing types with the integrated system:
const orderData = useOrderData(user, addActivity, addTransaction, settings, addNotification);
const orderUI = useOrderUI(orderData.orders, 10); // Uses your optimized hook

// Access data with your existing interfaces:
const { currentOrders, selectedOrderIds, filters } = orderUI;
const recipeStats = calculateRecipeStats(orderData.orders.flatMap(o => o.items));
const recipeUsage = getRecipeUsageByOrder(orderData.orders);

// Update filters (matches your OrderFilters interface):
orderUI.updateFilters({ 
  search: 'customer name', 
  status: 'pending',
  dateFrom: new Date(),
  minAmount: 50000
});

// Recipe integration:
const orderWithRecipes = orderData.orders.filter(order => 
  order.items.some(item => item.isFromRecipe)
);

// Template integration with WhatsApp:
const { sendWhatsAppMessage } = useOrderNotifications();
sendWhatsAppMessage(order, customTemplate);
*/