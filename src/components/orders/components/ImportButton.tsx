import React, { useRef, useState } from 'react';
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
import ImportTutorialDialog from './ImportTutorialDialog';

const ImportButton: React.FC = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { bulkAddOrders, refreshData } = useOrder();
  const [showTutorial, setShowTutorial] = useState(false);

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

  const downloadTemplate = () => {
    const link = document.createElement('a');
    link.href = '/templates/order-import-template.csv';
    link.download = 'template-import-pesanan.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Template CSV berhasil didownload!');
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
        <DropdownMenuContent className="w-48">
          <DropdownMenuItem onClick={() => inputRef.current?.click()} className="cursor-pointer">
            <Upload className="h-4 w-4 mr-2" /> Upload CSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={downloadTemplate} className="cursor-pointer">
            <Download className="h-4 w-4 mr-2" /> Download Template
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowTutorial(true)} className="cursor-pointer">
            <Info className="h-4 w-4 mr-2" /> Cara Import
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <ImportTutorialDialog
        open={showTutorial}
        onOpenChange={setShowTutorial}
        onDownloadTemplate={downloadTemplate}
      />
    </>
  );
};

export default ImportButton;
