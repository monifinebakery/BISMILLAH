// src/components/invoice/utils/invoiceCalculations.ts
import type { InvoiceItem, Discount, Tax, InvoiceCalculations } from '../types';

export const calculateInvoiceTotals = (
  items: InvoiceItem[],
  discount: Discount,
  tax: Tax,
  shipping: number = 0
): InvoiceCalculations => {
  // Calculate subtotal
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  
  // Calculate discount amount
  const discountAmount = discount.type === 'percent' 
    ? subtotal * (discount.value / 100) 
    : discount.value;
  
  // Calculate tax on subtotal after discount
  const subAfterDiscount = subtotal - discountAmount;
  const taxAmount = subAfterDiscount * (tax.value / 100);
  
  // Calculate grand total
  const total = subAfterDiscount + taxAmount + shipping;
  
  return {
    subtotal,
    discountAmount,
    taxAmount,
    total
  };
};

export const calculateItemTotal = (quantity: number, price: number): number => {
  return quantity * price;
};

export const validateCalculations = (calculations: InvoiceCalculations): boolean => {
  return (
    calculations.subtotal >= 0 &&
    calculations.discountAmount >= 0 &&
    calculations.taxAmount >= 0 &&
    calculations.total >= 0
  );
};