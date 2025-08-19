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
import { usePurchase } from '../context/PurchaseContext';
import { parsePurchaseCSV } from '../utils/purchaseImport';

const ImportButton: React.FC = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { addPurchase, setBulkProcessing } = usePurchase();

  const handleFile = async (file: File) => {
    try {
      const purchases = await parsePurchaseCSV(file);
      if (!purchases.length) {
        toast.error('Tidak ada data yang dapat diimport');
        return;
      }
      setBulkProcessing(true);
      let success = 0;
      for (const p of purchases) {
        const ok = await addPurchase(p);
        if (ok) success++;
      }
      setBulkProcessing(false);
      toast.success(`${success} pembelian berhasil diimport`);
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengimpor file');
    }
  };

  const downloadTemplate = () => {
    const link = document.createElement('a');
    link.href = '/templates/purchase-import-template.csv';
    link.download = 'purchase-import-template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const showFormatInfo = () => {
    toast.info(
      'Format CSV: supplier,tanggal(YYYY-MM-DD),nama,kuantitas,satuan,harga. Pemisah kolom boleh koma atau titik koma.',
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
