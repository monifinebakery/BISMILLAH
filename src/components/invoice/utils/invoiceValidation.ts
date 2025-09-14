// src/components/invoice/utils/invoiceValidation.ts
import type { InvoiceData, Customer, InvoiceItem } from '../types';

export interface ValidationError {
  field: string;
  message: string;
}

export const validateCustomer = (customer: Customer): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (!customer.name.trim()) {
    errors.push({ field: 'customer.name', message: 'Nama pelanggan wajib diisi' });
  }
  
  if (!customer.address.trim()) {
    errors.push({ field: 'customer.address', message: 'Alamat pelanggan wajib diisi' });
  }
  
  if (customer.email && !isValidEmail(customer.email)) {
    errors.push({ field: 'customer.email', message: 'Format email tidak valid' });
  }
  
  return errors;
};

export const validateInvoiceItems = (items: InvoiceItem[]): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (items.length === 0) {
    errors.push({ field: 'items', message: 'Minimal harus ada satu item' });
    return errors;
  }
  
  items.forEach((item, index) => {
    if (!item.description.trim()) {
      errors.push({ 
        field: `items[${index}].description`, 
        message: `Deskripsi item ${index + 1} wajib diisi` 
      });
    }
    
    if (item.quantity <= 0) {
      errors.push({ 
        field: `items[${index}].quantity`, 
        message: `Jumlah item ${index + 1} harus lebih dari 0` 
      });
    }
    
    if (item.unit_price < 0) {
      errors.push({ 
        field: `items[${index}].unit_price`, 
        message: `Harga item ${index + 1} tidak boleh negatif` 
      });
    }
  });
  
  return errors;
};

export const validateInvoice = (invoiceData: InvoiceData): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (!invoiceData.invoiceNumber.trim()) {
    errors.push({ field: 'invoiceNumber', message: 'Nomor invoice wajib diisi' });
  }
  
  if (invoiceData.dueDate <= invoiceData.issueDate) {
    errors.push({ field: 'dueDate', message: 'Tanggal jatuh tempo harus setelah tanggal terbit' });
  }
  
  errors.push(...validateCustomer(invoiceData.customer));
  errors.push(...validateInvoiceItems(invoiceData.items));
  
  return errors;
};

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};