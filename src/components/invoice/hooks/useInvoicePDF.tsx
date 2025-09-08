// src/components/invoice/hooks/useInvoicePDF.tsx
// PDF generation hook for invoices
import { useCallback } from 'react';
import { toast } from 'sonner';
import { downloadInvoicePDF } from '../utils/invoicePDF';

export const useInvoicePDF = () => {
  const handleDownloadPDF = useCallback(async (filename?: string) => {
    try {
      await downloadInvoicePDF(filename);
      toast.success('Invoice PDF berhasil diunduh');
    } catch (error) {
      toast.error('Gagal mengunduh PDF: ' + (error instanceof Error ? error.message : String(error)));
    }
  }, []);

  return { handleDownloadPDF };
};
