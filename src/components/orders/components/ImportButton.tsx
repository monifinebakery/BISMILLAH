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
  const { addOrder, bulkAddOrders } = useOrder();

  const handleFile = async (file: File) => {
    try {
      const orders = await parseOrderCSV(file);
      if (!orders.length) {
        toast.error('Tidak ada data yang dapat diimport');
        return;
      }

      // Prepare orders with proper calculations
      const ordersWithCalculations = orders.map(orderData => ({
        ...orderData,
        subtotal: orderData.items.reduce((sum, item) => sum + item.total, 0),
        pajak: 0, // Default pajak 0
        totalPesanan: orderData.items.reduce((sum, item) => sum + item.total, 0),
      }));

      // Use bulk import if available for better performance
      if (bulkAddOrders) {
        const { success, total } = await bulkAddOrders(ordersWithCalculations);
        toast.success(`${success} dari ${total} pesanan berhasil diimport`);
      } else {
        // Fallback to individual imports
        let success = 0;
        for (const orderData of ordersWithCalculations) {
          try {
            const result = await addOrder(orderData);
            if (result) success++;
          } catch (error) {
            console.error('Error adding order:', error);
          }
        }
        toast.success(`${success} dari ${orders.length} pesanan berhasil diimport`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengimpor file');
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
      'Format CSV: tanggal,namaPelanggan,nama,jumlah,satuan,harga. Setiap baris = satu pesanan terpisah. Contoh: 15/01/25,PT. Maju Jaya,tepung terigu,10,kg,120000. Pemisah kolom boleh koma atau titik koma.',
      { 
        duration: 8000,
        style: {
          maxWidth: '500px'
        }
      }
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
          <Button variant="outline" className="flex items-center gap-2 px-4 sm:px-6 py-3 bg-white text-green-600 hover:bg-green-50 border-green-300 font-semibold rounded-lg transition-all duration-200">
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Import Pesanan</span>
            <span className="sm:hidden">Import</span>
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
