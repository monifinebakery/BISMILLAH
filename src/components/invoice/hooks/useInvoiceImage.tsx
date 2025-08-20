// src/components/invoice/hooks/useInvoiceImage.tsx
import { useCallback } from 'react';
import { toast } from 'sonner';
import { downloadInvoiceImage } from '../utils';

export const useInvoiceImage = () => {
  const handleDownloadImage = useCallback(async () => {
    try {
      await downloadInvoiceImage();
      toast.success('Invoice berhasil diunduh');
    } catch (error) {
      toast.error('Gagal mengunduh gambar: ' + (error as Error).message);
    }
  }, []);

  return { handleDownloadImage };
};
