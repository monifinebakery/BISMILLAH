// src/components/invoice/types/invoice.ts
import type { InvoiceItem } from './item';
import type { Customer } from './customer';

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
  order_number: string; // Standardized field name
  customer_name: string; // Standardized field name
  customer_address?: string; // Standardized field name
  customer_phone?: string; // Standardized field name
  customer_email?: string; // Standardized field name
  order_date?: string; // Standardized field name
  items: Array<{
    id: number;
    item_name: string; // Standardized field name
    quantity: number;
    unit_price: number; // Standardized field name
    total_price: number; // Standardized field name
  }>;
  subtotal: number;
  tax_amount?: number; // Standardized field name
  total_amount: number; // Standardized field name
}