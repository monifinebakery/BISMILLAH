import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
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
      <Button variant="secondary" onClick={() => inputRef.current?.click()} className="flex items-center gap-2">
        <Upload className="h-4 w-4" />
        Import
      </Button>
    </>
  );
};

export default ImportButton;

