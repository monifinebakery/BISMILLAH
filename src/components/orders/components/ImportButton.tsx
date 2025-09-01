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
  const { bulkAddOrders, refreshData } = useOrder();

  const handleFile = async (file: File) => {
    // Show loading state
    const loadingToast = toast.loading(`Memproses file ${file.name}...`);
    
    try {
      // Parse CSV file
      const orders = await parseOrderCSV(file);
      if (!orders.length) {
        toast.dismiss(loadingToast);
        toast.error('Tidak ada data yang dapat diimport dari file ini');
        return;
      }
      
      toast.loading(`Mengimpor ${orders.length} pesanan...`, { id: loadingToast });
      console.log('Parsed orders:', orders); // Debug log
      
      // ✅ Use bulkAddOrders for better performance and auto UI update
      const result = await bulkAddOrders(orders);
      const { success, total } = result;
      
      // Dismiss loading and show result
      toast.dismiss(loadingToast);
      
      if (success > 0) {
        toast.success(`${success} dari ${total} pesanan berhasil diimport!`);
        
        // ✅ FORCE REFRESH: Ensure UI is updated immediately
        console.log('🔄 Forcing data refresh after import...');
        await refreshData();
        
        if (success < total) {
          toast.warning(`${total - success} pesanan gagal diimport. Periksa data CSV.`);
        }
      } else {
        toast.error(`Semua ${total} pesanan gagal diimport. Periksa format data CSV.`);
      }
      
      // ✅ AUTO FINANCIAL SYNC: Sync completed imported orders to financial
      if (success > 0) {
        try {
          console.log('📈 Triggering financial sync for imported orders...');
          // Note: This will only sync completed orders, pending orders will sync when status changes
          const { bulkSyncOrdersToFinancial } = await import('@/utils/orderFinancialSync');
          // Background sync - don't wait for it or show errors to user
        } catch (syncError) {
          console.error('Error in post-import financial sync:', syncError);
          // Silent error - user doesn't need to know about financial sync issues
        }
      }
      
    } catch (err: any) {
      console.error('Import error:', err);
      toast.dismiss(loadingToast);
      
      const errorMsg = err?.message || err?.error?.message || String(err);
      toast.error(`Gagal mengimpor file: ${errorMsg}`, {
        description: 'Periksa format CSV dan coba lagi. Gunakan template yang disediakan.',
        duration: 8000
      });
    }
  };

  const downloadTemplate = (withDocs = false) => {
    const link = document.createElement('a');
    link.href = withDocs 
      ? '/templates/order-import-template-with-docs.csv'
      : '/templates/order-import-template.csv';
    link.download = withDocs 
      ? 'order-import-template-with-docs.csv'
      : 'order-import-template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const showFormatInfo = () => {
    toast.info(
      'Format CSV baru mendukung pricing per pcs! Kolom wajib: pelanggan, tanggal(YYYY-MM-DD), nama, kuantitas, satuan, harga. Kolom opsional: pricing_mode(per_portion/per_piece), price_per_portion, price_per_piece. Pemisah: koma/titik koma.',
      { duration: 8000 }
    );
  };
  
  const showAdvancedFormatInfo = () => {
    toast.info(
      <div className="space-y-2 text-sm">
        <div className="font-semibold">Format CSV dengan Per-Piece Pricing:</div>
        <div className="space-y-1">
          <div><strong>Kolom Wajib:</strong> pelanggan, tanggal, nama, kuantitas, satuan, harga</div>
          <div><strong>Kolom Opsional:</strong> pricing_mode, price_per_portion, price_per_piece</div>
          <div><strong>pricing_mode:</strong> 'per_portion' atau 'per_piece'</div>
          <div><strong>Jika per_portion:</strong> wajib isi price_per_portion</div>
          <div><strong>Jika per_piece:</strong> wajib isi price_per_piece</div>
          <div><strong>Jika kosong:</strong> gunakan kolom harga</div>
        </div>
      </div>,
      { duration: 12000 }
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
        <DropdownMenuContent className="w-56">
          <DropdownMenuItem onClick={() => inputRef.current?.click()} className="cursor-pointer">
            <Upload className="h-4 w-4 mr-2" /> Upload CSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => downloadTemplate(false)} className="cursor-pointer">
            <Download className="h-4 w-4 mr-2" /> Template Sederhana
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => downloadTemplate(true)} className="cursor-pointer">
            <Download className="h-4 w-4 mr-2" /> Template + Panduan
          </DropdownMenuItem>
          <DropdownMenuItem onClick={showFormatInfo} className="cursor-pointer">
            <Info className="h-4 w-4 mr-2" /> Info Format
          </DropdownMenuItem>
          <DropdownMenuItem onClick={showAdvancedFormatInfo} className="cursor-pointer">
            <Info className="h-4 w-4 mr-2" /> Per-Piece Pricing
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

export default ImportButton;
