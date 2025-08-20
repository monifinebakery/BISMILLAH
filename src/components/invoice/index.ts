// src/components/invoice/index.ts - Main barrel export
export { default as InvoicePage } from './InvoicePage';

// Re-export hooks for external use
export {
  useOrderQuery,
  useInvoiceForm,
  useInvoiceCalculations,
  useInvoicePdf,
  useInvoiceQueryUtils
} from './hooks';

// Re-export components for external use
export {
  InvoiceHeader,
  CustomerInfo,
  ItemsTable,
  TotalsSection,
  PaymentInstructions,
  InvoiceActions,
  StatusBadge
} from './components';

// Re-export templates for external use  
export {
  InvoiceTemplate,
  ModernTemplate,
  ClassicTemplate
} from './templates';

// Re-export types for external use
export type {
  InvoiceData,
  InvoiceItem,
  Customer,
  OrderData,
  InvoiceStatus,
  Discount,
  Tax,
  InvoiceCalculations
} from './types';

// Re-export utils for external use
export {
  calculateInvoiceTotals,
  validateInvoice,
  formatInvoiceNumber,
  downloadInvoicePdf
} from './utils';

// Re-export API for external use
export { invoiceApi, invoiceQueryKeys } from './api';