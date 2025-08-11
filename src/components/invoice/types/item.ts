// src/components/invoice/types/item.ts
export interface InvoiceItem {
  id: number;
  description: string;
  quantity: number;
  price: number;
  total?: number; // Calculated field
}

export interface OrderItem {
  id: number;
  namaBarang: string;
  quantity: number;
  hargaSatuan: number;
  totalHarga: number;
}