
export interface Supplier {
  id: string;
  nama: string;
  kontak: string;
  email?: string;
  telepon?: string;
  alamat?: string;
  catatan?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseTransaction {
  id: string;
  supplierId: string;
  supplierName: string;
  tanggal: Date;
  items: PurchaseItem[];
  totalAmount: number;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseItem {
  id: string;
  bahanBakuId: string;
  namaBarang: string;
  kuantitas: number;
  satuan: string;
  hargaSatuan: number;
  totalHarga: number;
}

export interface InventoryMethod {
  type: 'FIFO' | 'LIFO' | 'AVERAGE';
  label: string;
}

export interface StockMovement {
  id: string;
  bahanBakuId: string;
  namaBarang: string;
  type: 'in' | 'out';
  kuantitas: number;
  hargaSatuan: number;
  tanggal: Date;
  referensi: string; // purchase transaction id or production id
  saldoAkhir: number;
  createdAt: Date;
}
