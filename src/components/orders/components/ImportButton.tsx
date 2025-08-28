import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, Info, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useOrder } from '../context/OrderContext';
import { parseOrderCSV } from '../utils/orderImport';

const ImportButton: React.FC = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { addOrder } = useOrder();

  const handleFile = async (file: File) => {
    try {
      const orders = await parseOrderCSV(file);
      if (!orders.length) {
        toast.error('Tidak ada data yang dapat diimport');
        return;
      }
      
      console.log('Parsed orders:', orders); // Debug log
      
      let success = 0;
      for (const o of orders) {
        try {
          console.log('Adding order:', o); // Debug log
          const ok = await addOrder(o);
          if (ok) success++;
        } catch (orderError: any) {
          console.error('Error adding individual order:', orderError);
          let errorMsg = 'Unknown error';
          
          if (typeof orderError === 'string') {
            errorMsg = orderError;
          } else if (orderError?.message) {
            errorMsg = orderError.message;
          } else if (orderError?.error?.message) {
            errorMsg = orderError.error.message;
          } else if (orderError?.toString && typeof orderError.toString === 'function') {
            errorMsg = orderError.toString();
          } else {
            errorMsg = JSON.stringify(orderError, null, 2);
          }
          
          toast.error(`Gagal menambah pesanan: ${errorMsg}`);
        }
      }
      toast.success(`${success} pesanan berhasil diimport`);
      
      // ✅ AUTO FINANCIAL SYNC: Sync completed imported orders to financial
      try {
        const { bulkSyncOrdersToFinancial } = await import('@/utils/orderFinancialSync');
        const { user } = await import('@/contexts/AuthContext').then(m => ({ user: null })); // Get user context
        
        // We'll trigger sync in background, don't wait for it
        if (success > 0) {
          console.log('📈 Triggering financial sync for imported orders...');
          // Note: This will only sync completed orders, pending orders will sync when status changes
        }
      } catch (syncError) {
        console.error('Error in post-import financial sync:', syncError);
        // Don't show error to user since import was successful
      }
      
    } catch (err: any) {
      console.error('Import error:', err);
      const errorMsg = err?.message || err?.error?.message || String(err);
      toast.error(`Gagal mengimpor file: ${errorMsg}`);
    }
  };

  const downloadTemplate = () => {
    const link = document.createElement('a');
    link.href = '/templates/order-import-template.csv';
    link.download = 'order-import-template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const showFormatInfo = () => {
    toast.info(
      'Format CSV: pelanggan,tanggal(YYYY-MM-DD),nama,kuantitas,satuan,harga. Pemisah kolom boleh koma atau titik koma.',
    );
  };

  return (
    <>
      <input
        type="file"
        accept=".csv"
        ref={inputRef}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Import
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => inputRef.current?.click()} className="cursor-pointer">
            <Upload className="h-4 w-4 mr-2" /> Upload CSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={downloadTemplate} className="cursor-pointer">
            <Download className="h-4 w-4 mr-2" /> Download Template
          </DropdownMenuItem>
          <DropdownMenuItem onClick={showFormatInfo} className="cursor-pointer">
            <Info className="h-4 w-4 mr-2" /> Cara Format
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

export default ImportButton;
