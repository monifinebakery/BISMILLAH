export interface OrderItem {
  id: number;
  nama: string;
  quantity: number;
  hargaSatuan: number;
  totalHarga: number;
}

export interface Order {
  id: string;
  nomorPesanan: string;
  tanggal: Date;
  namaPelanggan: string;
  emailPelanggan: string;
  teleponPelanggan: string | null; // Perubahan di sini
  alamatPelanggan: string;
  items: OrderItem[];
  subtotal: number;
  pajak: number;
  totalPesanan: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipping' | 'delivered' | 'cancelled';
  catatan?: string;
}

export interface NewOrderItem {
  nama: string;
  quantity: number;
  hargaSatuan: number;
}

export interface NewOrder {
  namaPelanggan: string;
  emailPelanggan: string;
  teleponPelanggan: string;
  alamatPelanggan: string;
  items: NewOrderItem[];
  catatan?: string;
}