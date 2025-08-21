import { useState } from 'react';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { loadXLSX } from '@/components/warehouse/dialogs/import-utils';
import { usePurchase } from '@/components/purchase/context/PurchaseContext';
import { useSupplier } from '@/contexts/SupplierContext';
import Papa from 'papaparse';

// Define the import data structure
export interface PurchaseImportData {
  tanggal: string;
  supplier: string;
  items: Array<{
    nama: string;
    kuantitas: number;
    satuan: string;
  }>;
  totalNilai: number;
}

// Mapping of possible header names to our standard fields
const headerMap: Record<string, string> = {
  // Date variations
  'tanggal': 'tanggal',
  'date': 'tanggal',
  'tgl': 'tanggal',
  'tanggal_pembelian': 'tanggal',
  'purchase_date': 'tanggal',
  
  // Supplier variations
  'supplier': 'supplier',
  'pemasok': 'supplier',
  'vendor': 'supplier',
  'nama_supplier': 'supplier',
  'supplier_name': 'supplier',
  
  // Item name variations
  'nama_bahan': 'nama',
  'nama_bahan_baku': 'nama',
  'item': 'nama',
  'bahan': 'nama',
  'nama_item': 'nama',
  
  // Quantity variations
  'jumlah': 'kuantitas',
  'qty': 'kuantitas',
  'kuantitas': 'kuantitas',
  'quantity': 'kuantitas',
  
  // Unit variations
  'satuan': 'satuan',
  'unit': 'satuan',
  'uom': 'satuan',

  // Total variations
  'total': 'totalNilai',
  'total_nilai': 'totalNilai',
  'total_harga': 'totalNilai',
  'amount': 'totalNilai',
};

const requiredFields = [
  'tanggal',
  'supplier',
  'nama',
  'kuantitas',
  'satuan',
  'totalNilai'
];

export const usePurchaseImport = ({ onImportComplete }: { onImportComplete: () => void }) => {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<{ valid: PurchaseImportData[]; errors: string[] } | null>(null);
  const { addPurchase } = usePurchase();
  const { suppliers } = useSupplier();

  const validate = (data: any): string[] => {
    const errors: string[] = [];

    if (!data.tanggal) {
      errors.push('Tanggal pembelian tidak boleh kosong');
    } else {
      const date = new Date(data.tanggal);
      if (isNaN(date.getTime())) {
        errors.push('Format tanggal tidak valid');
      }
    }

    if (!data.supplier?.trim()) {
      errors.push('Supplier tidak boleh kosong');
    }

    if (!data.nama?.trim()) {
      errors.push('Nama bahan baku tidak boleh kosong');
    }

    if (isNaN(data.kuantitas) || data.kuantitas <= 0) {
      errors.push('Kuantitas harus angka positif');
    }

    if (!data.satuan?.trim()) {
      errors.push('Satuan tidak boleh kosong');
    }

    if (isNaN(data.totalNilai) || data.totalNilai < 0) {
      errors.push('Total nilai tidak valid');
    }

    return errors;
  };

  const downloadTemplate = () => {
    const csvContent = [
      'tanggal;supplier;nama;jumlah;satuan;total',
      '2024-01-15;PT. Maju Jaya;tepung terigu;10;kg;120000',
      '2024-01-16;CV. Sumber Rejeki;gula pasir;5;kg;75000',
      '2024-01-17;Toko Bahan Kue;minyak goreng;2;liter;40000'
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'template_pembelian.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const processFile = async (file: File) => {
    if (!file.name.match(/\.(csv|xlsx|xls)$/i)) {
      toast.error('Format file tidak didukung. Gunakan .csv, .xlsx, atau .xls');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Ukuran file terlalu besar. Maksimal 10MB');
      return;
    }

    setLoading(true);

    try {
      let jsonData: any[] = [];

      if (file.name.endsWith('.csv')) {
        const text = await file.text();
        const lines = text.split('\n').filter(l => l.trim());
        if (lines.length < 2) throw new Error('File kosong atau hanya berisi header');

        const firstLine = lines[0];
        const delimiter = firstLine.includes(';') && !firstLine.includes(',') ? ';' : ',';

        logger.info(`CSV delimiter detected: '${delimiter}'`);
        toast.info(`Menggunakan delimiter: '${delimiter}'`, { duration: 1000 });

        const parsed = Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          delimiter,
          quoteChar: '"'
        });

        jsonData = parsed.data.map((row: any, index: number) => ({
          ...row,
          _rowIndex: index + 2
        }));
      } else {
        toast.info('Memuat library Excel...', { duration: 1000 });

        const XLSX = await loadXLSX();
        const buffer = await file.arrayBuffer();
        const data = new Uint8Array(buffer);
        const wb = XLSX.read(data, { type: 'array' });

        if (!wb.SheetNames.length) {
          throw new Error('File Excel tidak memiliki sheet');
        }

        const ws = wb.Sheets[wb.SheetNames[0]];
        jsonData = XLSX.utils.sheet_to_json(ws, { defval: '' });
      }

      // Validate and process data
      const valid: PurchaseImportData[] = [];
      const errors: string[] = [];

      jsonData.forEach((row: any, index) => {
        const rowIndex = row._rowIndex || index + 2;
        
        // Map fields using headerMap
        const mappedRow: any = {};
        Object.keys(row).forEach(key => {
          const mappedKey = headerMap[key.toLowerCase()] || key;
          mappedRow[mappedKey] = row[key];
        });

        const rowErrors = validate(mappedRow);
        if (rowErrors.length > 0) {
          errors.push(`Baris ${rowIndex}: ${rowErrors.join(', ')}`);
        } else {
          // Convert to our data structure
          valid.push({
            tanggal: mappedRow.tanggal,
            supplier: mappedRow.supplier,
            items: [{
              nama: mappedRow.nama,
              kuantitas: parseFloat(mappedRow.kuantitas),
              satuan: mappedRow.satuan
            }],
            totalNilai: parseFloat(mappedRow.totalNilai)
          });
        }
      });

      setPreview({ valid, errors });
      
      if (valid.length > 0) {
        toast.success(`File berhasil diproses: ${valid.length} data valid ditemukan`);
      }
      
      if (errors.length > 0) {
        toast.warning(`${errors.length} error ditemukan dalam file`);
      }

    } catch (error) {
      logger.error('Import error:', error);
      toast.error(`Gagal memproses file: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const executeImport = async (): Promise<boolean> => {
    if (!preview?.valid.length) {
      toast.error('Tidak ada data valid yang dapat diimport');
      return false;
    }

    setLoading(true);

    try {
      let successCount = 0;
      
      for (const purchaseData of preview.valid) {
        try {
          // Convert supplier name to ID if needed
          let supplierId = purchaseData.supplier;
          
          // Try to find supplier by name
          const supplier = suppliers?.find(s => 
            s.nama.toLowerCase() === purchaseData.supplier.toLowerCase() ||
            s.id === purchaseData.supplier
          );
          
          if (supplier) {
            supplierId = supplier.id;
          }
          
            const purchase = {
              supplier: supplierId,
              tanggal: new Date(purchaseData.tanggal),
              items: purchaseData.items.map(item => {
                const hargaSatuan = purchaseData.totalNilai / item.kuantitas;
                return {
                  ...item,
                  hargaSatuan,
                  subtotal: hargaSatuan * item.kuantitas
                };
              }),
              totalNilai: purchaseData.totalNilai,
              metodePerhitungan: 'AVERAGE' as const,
              status: 'pending' as const
            };

          const success = await addPurchase(purchase);
          if (success) {
            successCount++;
          }
        } catch (error) {
          logger.error('Error importing purchase:', error);
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} pembelian berhasil diimport!`);
        setPreview(null);
        onImportComplete();
        return true;
      } else {
        toast.error('Tidak ada pembelian yang berhasil diimport');
        return false;
      }
    } catch (error) {
      logger.error('Import execution error:', error);
      toast.error(`Gagal mengimport data: ${(error as Error).message}`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    preview,
    setPreview,
    processFile,
    downloadTemplate,
    executeImport
  };
};