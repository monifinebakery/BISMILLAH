// src/types/invoice.ts

// Pastikan OrderItem didefinisikan seperti ini di src/types/order.ts atau di file ini jika tidak ada
export interface OrderItem {
  id?: string | number; // Optional jika item bukan dari DB
  nama: string; // Nama produk/layanan
  quantity: number; // Jumlah
  hargaSatuan: number; // Harga per satuan
  totalHarga: number; // Quantity * HargaSatuan (dihitung)
  // Anda bisa menambahkan properti lain di sini jika perlu (misal: deskripsi, kategori)
}


export type InvoicePaymentStatus = 'Belum Dibayar' | 'Sebagian Dibayar' | 'Lunas' | 'Jatuh Tempo' | 'Dibatalkan';
export type InvoiceTemplateStyle = 'Simple' | 'Modern' | 'Professional'; // Nama template yang akan kita gunakan

export interface InvoiceCustomerInfo {
  namaPelanggan: string;
  emailPelanggan?: string | null;
  teleponPelanggan?: string | null;
  alamatPelanggan?: string | null;
}

export interface InvoiceBusinessInfo {
  namaBisnis: string;
  alamatBisnis?: string | null;
  emailBisnis?: string | null;
  teleponBisnis?: string | null;
  npwpBisnis?: string | null; // Nomor Pajak (opsional)
}

export interface Invoice {
  id: string;
  userId: string; // Foreign key ke auth.users

  invoiceNumber: string; // Misal: INV-20240718-001
  issueDate: Date; // Tanggal pembuatan invoice
  dueDate: Date | null; // Tanggal jatuh tempo pembayaran

  customerInfo: InvoiceCustomerInfo; // Informasi pelanggan yang wajib diisi
  businessInfo: InvoiceBusinessInfo; // Informasi bisnis yang wajib diisi (bisa dari user_settings)

  items: OrderItem[]; // Daftar item dalam invoice (diinput manual)

  subtotal: number;
  taxAmount: number; // Jumlah pajak (nominal), bukan persentase
  discountAmount: number | null; // Jumlah diskon nominal pada invoice
  shippingCost: number | null; // Biaya pengiriman

  totalAmount: number; // Total akhir yang harus dibayar

  amountPaid: number; // Jumlah yang sudah dibayar
  paymentStatus: InvoicePaymentStatus;

  notes: string | null; // Catatan kaki atau syarat dan ketentuan

  templateStyle: InvoiceTemplateStyle; // Template yang dipilih untuk tampilan invoice ini

  createdAt: Date | null;
  updatedAt: Date | null;
}