// src/components/invoice/hooks/useInvoicePrint.tsx
import { useCallback } from 'react';
import { toast } from 'sonner';
import { exportToHTML, copyToClipboard, printInvoice } from '../utils';

export const useInvoicePrint = (invoiceNumber: string) => {
  const handlePrint = useCallback(() => {
    printInvoice();
    toast.success('Membuka dialog print...');
  }, []);

  const handleDownloadHTML = useCallback(() => {
    try {
      exportToHTML(invoiceNumber);
      toast.success('Invoice berhasil didownload sebagai HTML');
    } catch (error) {
      toast.error('Gagal mendownload invoice: ' + (error as Error).message);
    }
  }, [invoiceNumber]);

  const handleCopyToClipboard = useCallback(async () => {
    try {
      await copyToClipboard();
      toast.success('Invoice berhasil dicopy ke clipboard');
    } catch (error) {
      toast.error('Gagal copy ke clipboard: ' + (error as Error).message);
    }
  }, []);

  return {
    handlePrint,
    handleDownloadHTML,
    handleCopyToClipboard
  };
};