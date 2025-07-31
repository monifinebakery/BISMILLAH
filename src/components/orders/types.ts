// src/components/order/types.ts - Updated with Recipe Integration

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
  
  // Recipe Integration Fields
  recipeId?: string;          // Link ke recipe ID
  recipeCategory?: string;    // Kategori dari recipe
  isFromRecipe?: boolean;     // Flag apakah item ini dari recipe
  
  // Additional fields
  description?: string;       // Deskripsi tambahan
  unit?: string;             // Satuan (porsi, pcs, dll)
}

export interface Order {
  id: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  
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
  recipeCount?: number;       // Jumlah item dari recipe
  customItemCount?: number;   // Jumlah item manual
  totalRecipeValue?: number;  // Total nilai dari recipe items
}

export interface NewOrder {
  // Customer Info
  namaPelanggan: string;
  teleponPelanggan?: string;
  emailPelanggan?: string;
  alamatPengiriman?: string;
  
  // Order Details
  items: OrderItem[];
  status?: OrderStatus;
  catatan?: string;
  
  // Financial Info (calculated)
  subtotal?: number;
  pajak?: number;
  totalPesanan?: number;
}

export type OrderStatus = 
  | 'pending'     // Menunggu konfirmasi
  | 'confirmed'   // Dikonfirmasi
  | 'preparing'   // Sedang diproses
  | 'ready'       // Siap untuk pickup/delivery
  | 'delivered'   // Sudah dikirim/diambil
  | 'cancelled'   // Dibatalkan
  | 'completed';  // Selesai

// Database format (snake_case)
export interface OrderDB {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
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

// Form state
export interface OrderFormData extends NewOrder {}

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
  
  // Status distribution
  statusDistribution: {
    [key in OrderStatus]: number;
  };
  
  // Recipe Analytics
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
  
  // Time-based stats
  todayOrders: number;
  weekOrders: number;
  monthOrders: number;
}

// Filter dan Search
export interface OrderFilters {
  searchTerm: string;
  statusFilter: OrderStatus | 'all';
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  recipeFilter?: string;      // Filter by specific recipe
  itemTypeFilter?: 'all' | 'recipe' | 'custom'; // Filter by item type
}

export type OrderSortField = 
  | 'createdAt' 
  | 'namaPelanggan' 
  | 'status' 
  | 'totalPesanan'
  | 'recipeCount';

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
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  preparing: 'bg-purple-100 text-purple-800',
  ready: 'bg-green-100 text-green-800',
  delivered: 'bg-teal-100 text-teal-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800'
};

// Helper functions
export const getStatusText = (status: OrderStatus): string => {
  return ORDER_STATUS_LABELS[status] || status;
};

export const getStatusColor = (status: OrderStatus): string => {
  return ORDER_STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';
};

// Recipe Integration Helpers
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