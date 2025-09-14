import { useState } from 'react';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { loadXLSX } from '@/components/warehouse/dialogs/import-utils';
import { usePurchase } from './usePurchase';
import { useSupplier } from '@/contexts/SupplierContext';
import { useBahanBaku } from '@/components/warehouse/context/WarehouseContext';
import { useSupplierAutoSave } from './useSupplierAutoSave';
import { UserFriendlyDate } from '@/utils/userFriendlyDate';
import { safeDom } from '@/utils/browserApiSafeWrappers';


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
  const { bahanBaku: warehouseItems } = useBahanBaku();
  const { getOrCreateSupplierId } = useSupplierAutoSave();

  const validate = (data: any): string[] => {
    const errors: string[] = [];

    if (!data.tanggal) {
      errors.push('Tanggal pembelian tidak boleh kosong');
    } else {
      // Use UserFriendlyDate for comprehensive validation
      const parseResult = UserFriendlyDate.parse(data.tanggal);
      if (!parseResult.success) {
        errors.push(`Format tanggal tidak valid: ${parseResult.error || 'Gunakan format DD/MM/YYYY atau YYYY-MM-DD'}`);
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
      '2025-01-15;PT. Maju Jaya;tepung terigu;10;kg;120000',
      '2025-01-16;CV. Sumber Rejeki;gula pasir;5;kg;75000',
      '2025-01-17;Toko Bahan Kue;minyak goreng;2;liter;40000'
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = safeDom.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'template_pembelian.csv');
    link.style.visibility = 'hidden';
    safeDom.safeAppendChild(document.body, link);
    link.click();
    // Safe cleanup
    safeDom.safeRemoveElement(link);
    URL.revokeObjectURL(url);
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

        const parseCSVLine = (line: string): string[] => {
          const result: string[] = [];
          let current = '';
          let inQuotes = false;
          let i = 0;

          while (i < line.length) {
            const char = line[i];

            if (char === '"') {
              if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i += 2;
                continue;
              } else {
                inQuotes = !inQuotes;
                i++;
                continue;
              }
            }

            if (char === delimiter && !inQuotes) {
              result.push(current.trim());
              current = '';
              i++;
              continue;
            }

            current += char;
            i++;
          }

          result.push(current.trim());
          return result;
        };

        const headers = parseCSVLine(firstLine);
        jsonData = lines.slice(1).map((line, index) => {
          const values = parseCSVLine(line);
          const row: any = { _rowIndex: index + 2 };
          headers.forEach((h, i) => {
            const mappedHeader = headerMap[h.toLowerCase().trim()] || h.toLowerCase().trim();
            const value = values[i] || '';
            row[mappedHeader] = value;
          });
          return row;
        });
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Gagal memproses file: ${errorMessage}`);
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
      const newSuppliers: string[] = []; // Track newly created suppliers
      
      for (const purchaseData of preview.valid) {
        try {
          // ✅ AUTO-SAVE SUPPLIER: Get or create supplier from import data
          console.log('🔄 [IMPORT SUPPLIER] Processing supplier:', purchaseData.supplier);
          
          let supplierId = purchaseData.supplier;
          
          // Check if supplier looks like UUID (existing ID)
          if (!purchaseData.supplier.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
            // This is a supplier name, not ID - try auto-save
            const existingSupplier = suppliers?.find(s => 
              s.nama.toLowerCase() === purchaseData.supplier.toLowerCase()
            );
            
            const resolvedSupplierId = await getOrCreateSupplierId(purchaseData.supplier);
            if (resolvedSupplierId) {
              supplierId = resolvedSupplierId;
              
              // Track if this is a new supplier (wasn't in suppliers list before)
              if (!existingSupplier && !newSuppliers.includes(purchaseData.supplier)) {
                newSuppliers.push(purchaseData.supplier);
              }
              
              console.log('✅ [IMPORT SUPPLIER] Auto-saved/found supplier:', {
                name: purchaseData.supplier,
                id: supplierId,
                isNew: !existingSupplier
              });
            } else {
              console.warn('⚠️ [IMPORT SUPPLIER] Failed to auto-save supplier, using name:', purchaseData.supplier);
            }
          }
          
          // Use UserFriendlyDate for safe parsing
          const parsedDate = UserFriendlyDate.safeParseToDate(purchaseData.tanggal);
          
          const purchase = {
            supplier: supplierId,
            tanggal: parsedDate,
            items: purchaseData.items.map(item => {
              // 🔧 AUTOMATIC UNIT PRICE CALCULATION: Same as manual entry
              // Calculate unit price from total payment ÷ quantity
              const calculatedUnitPrice = item.kuantitas > 0 
                ? Math.round((purchaseData.totalNilai / item.kuantitas) * 100) / 100
                : 0;
                
              const subtotal = item.kuantitas * calculatedUnitPrice;
              
              // 🔄 WAREHOUSE LINKING: Find existing warehouse item by name and unit
              let bahanBakuId = '';
              const matchingWarehouseItem = warehouseItems?.find(wItem => 
                wItem.nama.toLowerCase().trim() === item.nama.toLowerCase().trim() &&
                wItem.satuan.toLowerCase().trim() === item.satuan.toLowerCase().trim()
              );
              
              if (matchingWarehouseItem) {
                bahanBakuId = matchingWarehouseItem.id;
                console.log('✅ [IMPORT LINK] Found matching warehouse item:', {
                  importItem: item.nama,
                  warehouseId: bahanBakuId,
                  warehouseName: matchingWarehouseItem.nama
                });
              } else {
                console.log('⚠️ [IMPORT LINK] No matching warehouse item found for:', {
                  name: item.nama,
                  unit: item.satuan,
                  suggestion: 'Item will be created as new purchase item without warehouse link'
                });
              }
              
              console.log('🔄 [IMPORT CALC] Automatic price calculation:', {
                itemName: item.nama,
                totalPayment: purchaseData.totalNilai,
                quantity: item.kuantitas,
                calculatedPrice: calculatedUnitPrice,
                subtotal: subtotal,
                warehouseLinked: !!bahanBakuId
              });
              
              return {
                ...item,
                bahanBakuId: bahanBakuId, // ✅ LINK to warehouse item if found
                unitPrice: calculatedUnitPrice, // Use calculated price instead of 0
                subtotal: subtotal,
                // Mark as imported for tracking, but treated SAMA with manual entry
                keterangan: `[IMPORTED] Harga otomatis: Rp ${purchaseData.totalNilai.toLocaleString('id-ID')} ÷ ${item.kuantitas} = Rp ${calculatedUnitPrice.toLocaleString('id-ID')}${bahanBakuId ? ' | Linked to warehouse' : ' | New item'}`
              };
            }),
            total_nilai: purchaseData.totalNilai,
            metode_perhitungan: 'AVERAGE' as const,
            status: 'pending' as const // ✅ SAMA: Import and manual both start as pending
          };

          console.log('🔄 [IMPORT] Creating purchase with automatic calculation:', purchase);

          const success = await addPurchase(purchase);
          if (success) {
            successCount++;
          }
        } catch (error) {
          logger.error('Error importing purchase:', error);
        }
      }

      if (successCount > 0) {
        // Success message with supplier info
        let message = `${successCount} pembelian berhasil diimport!`;
        if (newSuppliers.length > 0) {
          message += ` ${newSuppliers.length} supplier baru ditambahkan: ${newSuppliers.join(', ')}`;
          toast.success(message, { duration: 5000 });
          
          // Additional info toast for new suppliers
          toast.info(
            `🏢 Supplier baru tersedia di menu Supplier Management`, 
            { duration: 3000 }
          );
        } else {
          toast.success(message);
        }
        
        setPreview(null);
        onImportComplete();
        return true;
      } else {
        toast.error('Tidak ada pembelian yang berhasil diimport');
        return false;
      }
    } catch (error) {
      logger.error('Import execution error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Gagal mengimport data: ${errorMessage}`);
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
