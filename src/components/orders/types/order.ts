// 🎯 80 lines - Order related types
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
  telefonPelanggan?: string;
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

export interface OrderFilters {
  search: string;
  status: OrderStatus | 'all';
  dateFrom: Date | null;
  dateTo: Date | null;
  minAmount: number | null;
  maxAmount: number | null;
}

export interface OrderStats {
  total: number;
  pending: number;
  completed: number;
  cancelled: number;
  totalRevenue: number;
  averageOrderValue: number;
}

export interface OrderContextType {
  orders: Order[];
  loading: boolean;
  addOrder: (order: NewOrder) => Promise<boolean>;
  updateOrder: (id: string, updates: Partial<Order>) => Promise<boolean>;
  deleteOrder: (id: string) => Promise<boolean>;
}