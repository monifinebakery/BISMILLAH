// src/components/invoice/hooks/useInvoicePdf.tsx
import { useCallback } from 'react';
import { toast } from 'sonner';
import { downloadInvoicePdf } from '../utils';

export const useInvoicePdf = () => {
  const handleDownloadPDF = useCallback(() => {
    try {
      downloadInvoicePdf();
      toast.success('Membuka dialog unduh PDF...');
    } catch (error) {
      toast.error('Gagal mengunduh PDF: ' + (error as Error).message);
    }
  }, []);

  return { handleDownloadPDF };
};
