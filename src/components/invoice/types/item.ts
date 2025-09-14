// src/components/invoice/types/item.ts
export interface InvoiceItem {
  id: number;
  description: string;
  quantity: number;
  unit_price: number; // Standardized field name
  total?: number; // Calculated field
}

export interface OrderItem {
  id: number;
  item_name: string; // Standardized field name
  quantity: number;
  unit_price: number; // Standardized field name
  total_price: number; // Standardized field name
}