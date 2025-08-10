// src/components/invoice/utils/invoiceFormatting.ts
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export const formatInvoiceNumber = (orderNumber?: string): string => {
  const today = new Date();
  const dateStr = format(today, 'yyyyMMdd');
  
  if (orderNumber) {
    return `INV-${orderNumber}`;
  }
  
  return `INV/${dateStr}-001`;
};

export const formatDateForInvoice = (date: Date): string => {
  return format(date, 'dd/MM/yyyy', { locale: id });
};

export const formatDateForInput = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

export const generatePaymentInstructions = (businessName?: string): string => {
  return `Transfer ke:
Bank BCA
1234567890
a/n ${businessName || 'Nama Bisnis'}`;
};

export const getDefaultNotes = (): string => {
  return 'Terima kasih atas kepercayaan Anda.';
};