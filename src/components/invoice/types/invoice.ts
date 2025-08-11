// src/components/invoice/types/invoice.ts
import type { InvoiceItem, Customer } from './index';

export type InvoiceStatus = 'BELUM LUNAS' | 'LUNAS' | 'JATUH TEMPO';
export type DiscountType = 'percent' | 'fixed';
export type TaxType = 'percent';

export interface Discount {
  type: DiscountType;
  value: number;
}

export interface Tax {
  type: TaxType;
  value: number;
}

export interface InvoiceCalculations {
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
}

export interface InvoiceData {
  // Basic info
  invoiceNumber: string;
  issueDate: Date;
  dueDate: Date;
  status: InvoiceStatus;
  
  // Customer info
  customer: Customer;
  
  // Items
  items: InvoiceItem[];
  
  // Calculations
  discount: Discount;
  tax: Tax;
  shipping: number;
  
  // Additional info
  notes: string;
  paymentInstructions: string;
}

export interface OrderData {
  id: string;
  nomorPesanan: string;
  namaPelanggan: string;
  alamatPelanggan?: string;
  telefonPelanggan?: string;
  emailPelanggan?: string;
  tanggal?: string;
  items: Array<{
    id: number;
    namaBarang: string;
    quantity: number;
    hargaSatuan: number;
    totalHarga: number;
  }>;
  subtotal: number;
  pajak: number;
  totalPesanan: number;
}