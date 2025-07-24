// src/components/orders/types/order.ts
export interface Order {
  id: string;
  nomorPesanan: string;
  namaPelanggan: string;
  teleponPelanggan?: string;
  tanggal: Date | string;
  status: OrderStatus;
  totalPesanan: number;
  items?: OrderItem[];
  alamatPelanggan?: string;
  catatanPesanan?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface NewOrder extends Omit<Order, 'id' | 'createdAt' | 'updatedAt'> {}

export interface OrderItem {
  id: string;
  nama: string;
  harga: number;
  jumlah: number;
  subtotal: number;
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

export interface OrderContextType {
  orders: Order[];
  loading: boolean;
  addOrder: (order: NewOrder) => Promise<boolean>;
  updateOrder: (id: string, updates: Partial<Order>) => Promise<boolean>;
  deleteOrder: (id: string) => Promise<boolean>;
  bulkDeleteOrders?: (ids: string[]) => Promise<boolean>;
  bulkUpdateOrders?: (ids: string[], updates: Partial<Order>) => Promise<boolean>;
}

export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

// Filter and pagination types
export interface OrderFilters {
  searchTerm: string;
  statusFilter: string;
  dateRange: DateRange | undefined;
}

export interface PaginationState {
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
  totalItems: number;
}

export interface SelectionState {
  selectedOrderIds: string[];
  isSelectionMode: boolean;
  allCurrentSelected: boolean;
  someCurrentSelected: boolean;
}