// src/components/invoice/hooks/useInvoiceCalculations.tsx
import { useMemo } from 'react';
import { calculateInvoiceTotals } from '../utils';
import type { InvoiceItem, Discount, Tax, InvoiceCalculations } from '../types';

export const useInvoiceCalculations = (
  items: InvoiceItem[],
  discount: Discount,
  tax: Tax,
  shipping: number = 0
): InvoiceCalculations => {
  return useMemo(() => {
    return calculateInvoiceTotals(items, discount, tax, shipping);
  }, [items, discount, tax, shipping]);
};