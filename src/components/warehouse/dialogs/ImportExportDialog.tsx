// src/components/warehouse/dialogs/ImportDialog.tsx
// 🎯 Optimized Import Dialog - Lazy Load XLSX (~50KB instead of 600KB)
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { X, Upload, FileText, AlertCircle, CheckCircle, Download } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

// ✅ Updated interface to match BahanBakuFrontend structure
interface BahanBakuImport {
  nama: string; // ✅ Changed from nama_bahan_baku
  kategori: string;
  supplier: string;
  satuan: string;
  expiry?: string; // ✅ Changed from tanggal_kadaluwarsa
  stok: number; // ✅ Changed from stok_saat_ini
  minimum: number; // ✅ Changed from minimum_stok
  jumlahBeliKemasan: number; // ✅ Changed from jumlah_beli_kemasan
  isiPerKemasan: number; // ✅ NEW: Added isi_per_kemasan field
  satuanKemasan: string; // ✅ Changed from satuan_kemasan
  hargaTotalBeliKemasan: number; // ✅ Changed from harga_total_beli_kemasan
}

interface ImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: BahanBakuImport[]) => Promise<boolean>;
}

/**
 * Warehouse Import Dialog Component
 * 
 * ✅ Updated to match BahanBakuFrontend interface
 * ✅ Enhanced with better field mapping
 * ✅ Optimized XLSX lazy loading
 * ✅ Improved validation and error handling
 * 
 * Features:
 * - Lazy load XLSX library (only when needed)
 * - Support CSV and Excel formats
 * - Real-time validation and preview
 * - Template download functionality
 * - Progress indication and error reporting
 * - Compatible with updated type system
 * 
 * Size: ~8KB + XLSX library (loaded on demand)
 */
const ImportDialog: React.FC<ImportDialogProps> = ({
  isOpen,
  onClose,
  onImport
}) => {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<{ valid: BahanBakuImport[]; errors: string[] } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // ✅ Updated header mapping to match BahanBakuFrontend field names
  const headerMap: Record<string, string> = {
    // Name variations
    'nama_bahan_baku': 'nama', 
    'nama bahan baku': 'nama', 
    'nama': 'nama',
    'name': 'nama',
    'item_name': 'nama',
    
    // Category variations
    'kategori': 'kategori', 
    'category': 'kategori',
    'jenis': 'kategori',
    
    // Supplier variations
    'supplier': 'supplier', 
    'pemasok': 'supplier',
    'vendor': 'supplier',
    
    // Unit variations
    'satuan': 'satuan', 
    'unit': 'satuan',
    'uom': 'satuan',
    
    // Expiry variations
    'tanggal_kadaluwarsa': 'expiry', 
    'kadaluarsa': 'expiry', 
    'expiry': 'expiry',
    'expiry_date': 'expiry',
    'exp_date': 'expiry',
    
    // Stock variations
    'stok_saat_ini': 'stok', 
    'stok': 'stok', 
    'stock': 'stok',
    'current_stock': 'stok',
    'qty': 'stok',
    'quantity': 'stok',
    
    // Minimum stock variations
    'minimum_stok': 'minimum', 
    'minimum': 'minimum', 
    'min_stock': 'minimum',
    'min': 'minimum',
    'reorder_point': 'minimum',
    
    // Package quantity variations
    'jumlah_beli_kemasan': 'jumlahBeliKemasan', 
    'qty_kemasan': 'jumlahBeliKemasan',
    'package_qty': 'jumlahBeliKemasan',
    'kemasan_qty': 'jumlahBeliKemasan',
    
    // Package content variations (NEW)
    'isi_per_kemasan': 'isiPerKemasan',
    'content_per_package': 'isiPerKemasan',
    'package_content': 'isiPerKemasan',
    'isi_kemasan': 'isiPerKemasan',
    
    // Package unit variations
    'satuan_kemasan': 'satuanKemasan', 
    'kemasan': 'satuanKemasan',
    'package_unit': 'satuanKemasan',
    'pack_unit': 'satuanKemasan',
    
    // Total price variations
    'harga_total_beli_kemasan': 'hargaTotalBeliKemasan', 
    'harga_total': 'hargaTotalBeliKemasan',
    'total_price': 'hargaTotalBeliKemasan',
    'package_price': 'hargaTotalBeliKemasan',
    'total_cost': 'hargaTotalBeliKemasan'
  };

  // ✅ Updated required fields
  const requiredFields = [
    'nama', 'kategori', 'supplier', 'satuan', 'stok', 'minimum', 
    'jumlahBeliKemasan', 'isiPerKemasan', 'satuanKemasan', 'hargaTotalBeliKemasan'
  ];

  // ✅ Enhanced validation function
  const validate = (data: any): string[] => {
    const errors: string[] = [];
    
    // Required field validation
    if (!data.nama?.trim()) errors.push('Nama bahan baku kosong');
    if (!data.kategori?.trim()) errors.push('Kategori kosong');
    if (!data.supplier?.trim()) errors.push('Supplier kosong');
    if (!data.satuan?.trim()) errors.push('Satuan kosong');
    if (!data.satuanKemasan?.trim()) errors.push('Satuan kemasan kosong');
    
    // Numeric field validation
    if (isNaN(data.stok) || data.stok < 0) {
      errors.push('Stok tidak valid (harus angka ≥ 0)');
    }
    if (isNaN(data.minimum) || data.minimum < 0) {
      errors.push('Minimum stok tidak valid (harus angka ≥ 0)');
    }
    if (isNaN(data.jumlahBeliKemasan) || data.jumlahBeliKemasan <= 0) {
      errors.push('Jumlah kemasan tidak valid (harus angka > 0)');
    }
    if (isNaN(data.isiPerKemasan) || data.isiPerKemasan <= 0) {
      errors.push('Isi per kemasan tidak valid (harus angka > 0)');
    }
    if (isNaN(data.hargaTotalBeliKemasan) || data.hargaTotalBeliKemasan <= 0) {
      errors.push('Harga total tidak valid (harus angka > 0)');
    }
    
    // Date validation (optional)
    if (data.expiry && data.expiry.trim()) {
      const expiryDate = new Date(data.expiry);
      if (isNaN(expiryDate.getTime())) {
        errors.push('Format tanggal kadaluarsa tidak valid');
      } else if (expiryDate < new Date()) {
        errors.push('Tanggal kadaluarsa sudah lewat');
      }
    }
    
    // Business logic validation
    if (data.stok > 0 && data.minimum > 0 && data.stok < data.minimum) {
      errors.push('Stok saat ini lebih rendah dari minimum (akan muncul alert)');
    }
    
    return errors;
  };

  // ✅ OPTIMIZED: Lazy load XLSX only when needed
  const loadXLSX = async () => {
    try {
      const XLSX = await import('xlsx');
      return XLSX;
    } catch (error) {
      logger.error('Failed to load XLSX:', error);
      toast.error('Gagal memuat library Excel. Silakan refresh halaman.');
      throw error;
    }
  };

  // ✅ OPTIMIZED: Process file with lazy XLSX loading
  const processFile = async (file: File) => {
    if (!file.name.match(/\.(csv|xlsx|xls)$/i)) {
      toast.error('Format file tidak didukung. Gunakan .csv, .xlsx, atau .xls');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('Ukuran file terlalu besar. Maksimal 10MB');
      return;
    }

    setLoading(true);
    
    try {
      let jsonData: any[] = [];

      if (file.name.endsWith('.csv')) {
        // ✅ FIXED: Enhanced CSV processing with semicolon support
        const text = await file.text();
        const lines = text.split('\n').filter(l => l.trim());
        if (lines.length < 2) throw new Error('File kosong atau hanya berisi header');
        
        // ✅ Auto-detect delimiter (comma vs semicolon)
        const firstLine = lines[0];
        const delimiter = firstLine.includes(';') && !firstLine.includes(',') ? ';' : ',';
        
        logger.info(`CSV delimiter detected: '${delimiter}'`);
        toast.info(`Menggunakan delimiter: '${delimiter}'`, { duration: 1000 });
        
        // ✅ Enhanced CSV parsing with proper quote handling
        const parseCSVLine = (line: string): string[] => {
          const result: string[] = [];
          let current = '';
          let inQuotes = false;
          let i = 0;
          
          while (i < line.length) {
            const char = line[i];
            
            if (char === '"') {
              if (inQuotes && line[i + 1] === '"') {
                // Handle escaped quotes
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
            const value = values[i] || '';
            row[h] = value;
          });
          return row;
        });
      } else {
        // ✅ Excel processing - lazy load XLSX
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
        
        // Add row index for error reporting
        jsonData = jsonData.map((row, index) => ({ ...row, _rowIndex: index + 2 }));
      }

      if (jsonData.length === 0) {
        throw new Error('Tidak ada data yang dapat diproses');
      }

      // ✅ Enhanced data mapping and processing
      const mapped = jsonData.map((row) => {
        const newRow: any = { _rowIndex: row._rowIndex };
        
        // Map headers to standard field names
        Object.keys(row).forEach(key => {
          if (key === '_rowIndex') return;
          
          const mappedKey = headerMap[key.toLowerCase().trim()];
          if (mappedKey) {
            let value = row[key];
            
            // Process numeric fields
            if (['stok', 'minimum', 'jumlahBeliKemasan', 'isiPerKemasan', 'hargaTotalBeliKemasan'].includes(mappedKey)) {
              // Clean and parse numbers
              const cleanValue = String(value).replace(/[,\s]/g, '').replace(/[^\d.-]/g, '');
              value = parseFloat(cleanValue) || 0;
            }
            
            // Process date fields
            if (mappedKey === 'expiry' && value) {
              // Try to parse various date formats
              const dateValue = new Date(value);
              if (!isNaN(dateValue.getTime())) {
                value = dateValue.toISOString().split('T')[0];
              }
            }
            
            // Clean string fields
            if (typeof value === 'string') {
              value = value.trim();
            }
            
            newRow[mappedKey] = value;
          }
        });
        
        return newRow;
      });

      // ✅ Enhanced validation and error collection
      const valid: BahanBakuImport[] = [];
      const errors: string[] = [];

      // Check for required columns
      const sampleRow = mapped[0] || {};
      const missingCols = requiredFields.filter(field => 
        !(field in sampleRow) || sampleRow[field] === undefined
      );
      
      if (missingCols.length > 0) {
        errors.push(`Kolom wajib tidak ditemukan: ${missingCols.join(', ')}`);
        errors.push('Tip: Pastikan nama kolom sesuai dengan template atau gunakan variasi nama yang didukung');
      }

      // Validate each row
      mapped.forEach(row => {
        const fieldErrors = validate(row);
        if (fieldErrors.length === 0) {
          const { _rowIndex, ...cleanRow } = row;
          valid.push(cleanRow);
        } else {
          errors.push(`Baris ${row._rowIndex}: ${fieldErrors.join(', ')}`);
        }
      });

      // Set preview results
      setPreview({ valid, errors });
      
      // Show summary toast
      if (valid.length > 0) {
        toast.success(`File berhasil diproses: ${valid.length} data valid, ${errors.length} error`);
      } else {
        toast.error('Tidak ada data valid yang dapat diimport');
      }
      
    } catch (error: any) {
      logger.error('Processing error:', error);
      toast.error(`Error memproses file: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ✅ OPTIMIZED: Download template with lazy XLSX
  const downloadTemplate = async () => {
    try {
      setLoading(true);
      toast.info('Memuat library Excel...', { duration: 1000 });
      
      const XLSX = await loadXLSX();
      
      // ✅ Updated template with correct field names including isiPerKemasan
      const template = [
        {
          nama: 'Tepung Terigu Premium',
          kategori: 'Bahan Dasar',
          supplier: 'PT Supplier Terpercaya',
          satuan: 'gram',
          expiry: '2024-12-31',
          stok: 5000,
          minimum: 1000,
          jumlahBeliKemasan: 2,
          isiPerKemasan: 25000, // ✅ NEW: Added isi per kemasan
          satuanKemasan: 'sak',
          hargaTotalBeliKemasan: 150000
        },
        {
          nama: 'Gula Pasir Halus',
          kategori: 'Pemanis',
          supplier: 'CV Gula Manis',
          satuan: 'gram',
          expiry: '2024-11-30',
          stok: 3000,
          minimum: 500,
          jumlahBeliKemasan: 1,
          isiPerKemasan: 1000, // ✅ NEW: Added isi per kemasan
          satuanKemasan: 'karton',
          hargaTotalBeliKemasan: 18000
        },
        {
          nama: 'Minyak Goreng',
          kategori: 'Minyak',
          supplier: 'PT Minyak Sehat',
          satuan: 'ml',
          expiry: '2025-06-15',
          stok: 2000,
          minimum: 300,
          jumlahBeliKemasan: 4,
          isiPerKemasan: 500, // ✅ NEW: Added isi per kemasan
          satuanKemasan: 'botol',
          hargaTotalBeliKemasan: 60000
        }
      ];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(template);
      
      // Set column widths
      ws['!cols'] = [
        { wch: 20 }, // nama
        { wch: 15 }, // kategori
        { wch: 20 }, // supplier
        { wch: 10 }, // satuan
        { wch: 12 }, // expiry
        { wch: 8 },  // stok
        { wch: 8 },  // minimum
        { wch: 15 }, // jumlahBeliKemasan
        { wch: 12 }, // isiPerKemasan ✅ NEW
        { wch: 15 }, // satuanKemasan
        { wch: 18 }  // hargaTotalBeliKemasan
      ];
      
      XLSX.utils.book_append_sheet(wb, ws, 'Template Bahan Baku');
      
      const fileName = `template_bahan_baku_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      toast.success('Template berhasil di-download');
    } catch (error) {
      logger.error('Template download error:', error);
      toast.error('Gagal membuat template');
    } finally {
      setLoading(false);
    }
  };

  // ✅ NEW: Download CSV template with semicolon delimiter
  const downloadCSVTemplate = () => {
    try {
      // ✅ Template data yang sama seperti Excel tapi format CSV
      const template = [
        {
          nama: 'Tepung Terigu Premium',
          kategori: 'Bahan Dasar',
          supplier: 'PT Supplier Terpercaya',
          satuan: 'gram',
          expiry: '2024-12-31',
          stok: 5000,
          minimum: 1000,
          jumlahBeliKemasan: 2,
          isiPerKemasan: 25000,
          satuanKemasan: 'sak',
          hargaTotalBeliKemasan: 150000
        },
        {
          nama: 'Gula Pasir Halus',
          kategori: 'Pemanis',
          supplier: 'CV Gula Manis',
          satuan: 'gram',
          expiry: '2024-11-30',
          stok: 3000,
          minimum: 500,
          jumlahBeliKemasan: 1,
          isiPerKemasan: 1000,
          satuanKemasan: 'karton',
          hargaTotalBeliKemasan: 18000
        },
        {
          nama: 'Minyak Goreng',
          kategori: 'Minyak',
          supplier: 'PT Minyak Sehat',
          satuan: 'ml',
          expiry: '2025-06-15',
          stok: 2000,
          minimum: 300,
          jumlahBeliKemasan: 4,
          isiPerKemasan: 500,
          satuanKemasan: 'botol',
          hargaTotalBeliKemasan: 60000
        }
      ];
      
      // ✅ Create CSV with semicolon delimiter (untuk Excel Indonesia)
      const headers = Object.keys(template[0]);
      const csvContent = [
        headers.join(';'), // Header dengan semicolon
        ...template.map(row => 
          headers.map(key => {
            const value = row[key as keyof typeof row];
            // Quote strings yang mengandung semicolon atau spasi
            if (typeof value === 'string' && (value.includes(';') || value.includes(' '))) {
              return `"${value}"`;
            }
            return value;
          }).join(';')
        )
      ].join('\n');
      
      // ✅ Download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `template_bahan_baku_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      
      toast.success('Template CSV berhasil di-download');
      logger.info('CSV template downloaded with semicolon delimiter');
      
    } catch (error) {
      logger.error('CSV template download error:', error);
      toast.error('Gagal membuat template CSV');
    }
  };

  // Execute import
  const executeImport = async () => {
    if (!preview?.valid.length) return;
    
    setLoading(true);
    try {
      const success = await onImport(preview.valid);
      if (success) {
        toast.success(`${preview.valid.length} bahan baku berhasil diimpor`);
        onClose();
      }
    } catch (error: any) {
      logger.error('Import error:', error);
      toast.error(`Gagal mengimpor data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Drag handlers
  const handleDrag = (e: React.DragEvent, over: boolean) => {
    e.preventDefault();
    setDragOver(over);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Upload className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Import Bahan Baku</h2>
              <p className="text-sm text-gray-600">Upload file Excel atau CSV</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          
          {!preview ? (
            /* Upload Area */
            <div className="space-y-6">
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragOver ? 'border-green-400 bg-green-50' : 'border-gray-300'
                }`}
                onDragOver={(e) => handleDrag(e, true)}
                onDragLeave={(e) => handleDrag(e, false)}
                onDrop={handleDrop}
              >
                <Upload className={`w-12 h-12 mx-auto mb-4 ${dragOver ? 'text-green-500' : 'text-gray-400'}`} />
                <h3 className="text-lg font-medium mb-2">
                  {dragOver ? 'Lepaskan file di sini' : 'Upload File'}
                </h3>
                <p className="text-gray-600 mb-4">Drag & drop atau klik untuk memilih file</p>
                <div className="flex justify-center gap-3">
                  <Button onClick={() => fileRef.current?.click()} disabled={loading}>
                    {loading ? 'Memproses...' : 'Pilih File'}
                  </Button>
                  <Button variant="outline" onClick={downloadTemplate} disabled={loading}>
                    <Download className="w-4 h-4 mr-2" />
                    {loading ? 'Membuat...' : 'Template Excel'}
                  </Button>
                  <Button variant="outline" onClick={downloadCSVTemplate} disabled={loading}>
                    <Download className="w-4 h-4 mr-2" />
                    {loading ? 'Membuat...' : 'Template CSV'}
                  </Button>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
                  className="hidden"
                />
              </div>

              {/* ✅ ENHANCED: Improved info panel */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex gap-3">
                    <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900">Format yang Didukung</h4>
                      <div className="text-sm text-blue-700 mt-1 space-y-1">
                        <div>• <strong>CSV:</strong> Langsung diproses, sangat cepat</div>
                        <div>• <strong>Excel:</strong> .xlsx, .xls (butuh loading ~2-3 detik)</div>
                        <div>• <strong>Delimiter:</strong> Koma (,) atau semicolon (;)</div>
                        <div>• <strong>Ukuran maksimal:</strong> 10MB</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-900">Tips Penting</h4>
                      <div className="text-sm text-yellow-700 mt-1 space-y-1">
                        <div>• Gunakan template untuk hasil terbaik</div>
                        <div>• Pastikan semua kolom wajib terisi</div>
                        <div>• Format tanggal: YYYY-MM-DD</div>
                        <div>• Angka jangan pakai titik/koma pemisah</div>
                        <div>• <strong>CSV:</strong> Gunakan semicolon (;) jika Excel Indonesia</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ✅ Field mapping info */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Kolom yang Diperlukan</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                  <div><span className="font-medium">nama</span> - Nama bahan baku</div>
                  <div><span className="font-medium">kategori</span> - Kategori produk</div>
                  <div><span className="font-medium">supplier</span> - Nama supplier</div>
                  <div><span className="font-medium">satuan</span> - Satuan dasar</div>
                  <div><span className="font-medium">stok</span> - Stok saat ini</div>
                  <div><span className="font-medium">minimum</span> - Stok minimum</div>
                  <div><span className="font-medium">expiry</span> - Tanggal kadaluarsa (opsional)</div>
                  <div><span className="font-medium">jumlahBeliKemasan</span> - Jumlah kemasan</div>
                  <div><span className="font-medium">isiPerKemasan</span> - Isi per kemasan ✅ NEW</div>
                  <div><span className="font-medium">satuanKemasan</span> - Jenis kemasan</div>
                  <div><span className="font-medium">hargaTotalBeliKemasan</span> - Harga total</div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Sistem mendukung berbagai variasi nama kolom (Indonesia/Inggris)
                </p>
              </div>
            </div>
          ) : (
            /* Preview Results */
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Preview Import</h3>
                <Button variant="outline" size="sm" onClick={() => setPreview(null)}>
                  Pilih File Lain
                </Button>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm text-green-600">Valid</p>
                      <p className="text-2xl font-bold text-green-900">{preview.valid.length}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="text-sm text-red-600">Error</p>
                      <p className="text-2xl font-bold text-red-900">{preview.errors.length}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div>
                    <p className="text-sm text-blue-600">Total</p>
                    <p className="text-2xl font-bold text-blue-900">{preview.valid.length + preview.errors.length}</p>
                  </div>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div>
                    <p className="text-sm text-purple-600">Siap Import</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {preview.valid.length > 0 ? '✓' : '✗'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Errors */}
              {preview.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-900 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Error ({preview.errors.length})
                  </h4>
                  <div className="max-h-40 overflow-y-auto text-sm text-red-700 space-y-1">
                    {preview.errors.slice(0, 20).map((error, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-red-400 mt-1">•</span>
                        <span>{error}</span>
                      </div>
                    ))}
                    {preview.errors.length > 20 && (
                      <div className="italic text-red-600 pt-2 border-t border-red-200">
                        ... dan {preview.errors.length - 20} error lainnya
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Preview Table */}
              {preview.valid.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">
                    Data Valid (menampilkan 5 pertama dari {preview.valid.length})
                  </h4>
                  <div className="overflow-x-auto border rounded-lg">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-gray-500">Nama</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-500">Kategori</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-500">Supplier</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-500">Stok</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-500">Kemasan</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-500">Isi/Kemasan</th> {/* ✅ NEW */}
                          <th className="px-3 py-2 text-left font-medium text-gray-500">Harga Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {preview.valid.slice(0, 5).map((item, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-3 py-2 font-medium">{item.nama}</td>
                            <td className="px-3 py-2 text-gray-600">{item.kategori}</td>
                            <td className="px-3 py-2 text-gray-600">{item.supplier}</td>
                            <td className="px-3 py-2 text-gray-600">
                              {item.stok} {item.satuan}
                              {item.stok <= item.minimum && (
                                <span className="ml-1 text-yellow-600 text-xs">⚠️</span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-gray-600">
                              {item.jumlahBeliKemasan} {item.satuanKemasan}
                            </td>
                            <td className="px-3 py-2 text-gray-600"> {/* ✅ NEW */}
                              {item.isiPerKemasan} {item.satuan}
                            </td>
                            <td className="px-3 py-2 text-gray-600">
                              Rp {item.hargaTotalBeliKemasan?.toLocaleString('id-ID')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {preview.valid.length > 5 && (
                    <p className="text-sm text-gray-500 mt-2 text-center">
                      ... dan {preview.valid.length - 5} data lainnya
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            {preview && (
              <span>
                Siap import <strong>{preview.valid.length}</strong> bahan baku
                {preview.errors.length > 0 && (
                  <span className="text-red-600 ml-2">
                    • {preview.errors.length} error perlu diperbaiki
                  </span>
                )}
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Batal
            </Button>
            {preview && (
              <Button 
                onClick={executeImport} 
                disabled={!preview.valid.length || loading}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    Mengimpor...
                  </>
                ) : (
                  `Import ${preview.valid.length} Data`
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportDialog;