// src/components/warehouse/dialogs/ImportDialog.tsx
// 🎯 Fixed Import Dialog - CSV Upload Made Easy
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { X, Upload, FileText, AlertCircle, CheckCircle, Download } from 'lucide-react';
import { toast } from 'sonner';

// ✅ Updated interface to match BahanBakuFrontend structure
interface BahanBakuImport {
  nama: string;
  kategori: string;
  supplier: string;
  satuan: string;
  expiry?: string;
  stok: number;
  minimum: number;
  jumlahBeliKemasan: number;
  satuanKemasan: string;
  hargaTotalBeliKemasan: number;
}

interface ImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: BahanBakuImport[]) => Promise<boolean>;
}

/**
 * Warehouse Import Dialog Component - FIXED VERSION
 * 
 * ✅ Fixed CSV parsing with proper delimiter detection
 * ✅ Better header mapping and field validation
 * ✅ Improved error messages and user guidance
 * ✅ Enhanced template generation
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

  // ✅ FIXED: More comprehensive header mapping
  const headerMap: Record<string, string> = {
    // Name variations
    'nama_bahan_baku': 'nama', 
    'nama bahan baku': 'nama', 
    'nama': 'nama',
    'name': 'nama',
    'item_name': 'nama',
    'bahan': 'nama',
    'produk': 'nama',
    
    // Category variations
    'kategori': 'kategori', 
    'category': 'kategori',
    'jenis': 'kategori',
    'type': 'kategori',
    
    // Supplier variations
    'supplier': 'supplier', 
    'pemasok': 'supplier',
    'vendor': 'supplier',
    'penyedia': 'supplier',
    
    // Unit variations
    'satuan': 'satuan', 
    'unit': 'satuan',
    'uom': 'satuan',
    'satuan_dasar': 'satuan',
    
    // Expiry variations
    'tanggal_kadaluwarsa': 'expiry', 
    'kadaluarsa': 'expiry', 
    'expiry': 'expiry',
    'expiry_date': 'expiry',
    'exp_date': 'expiry',
    'tanggal_exp': 'expiry',
    
    // Stock variations
    'stok_saat_ini': 'stok', 
    'stok': 'stok', 
    'stock': 'stok',
    'current_stock': 'stok',
    'qty': 'stok',
    'quantity': 'stok',
    'jumlah': 'stok',
    
    // Minimum stock variations
    'minimum_stok': 'minimum', 
    'minimum': 'minimum', 
    'min_stock': 'minimum',
    'min': 'minimum',
    'reorder_point': 'minimum',
    'stok_minimum': 'minimum',
    
    // Package quantity variations
    'jumlah_beli_kemasan': 'jumlahBeliKemasan', 
    'qty_kemasan': 'jumlahBeliKemasan',
    'package_qty': 'jumlahBeliKemasan',
    'kemasan_qty': 'jumlahBeliKemasan',
    'jumlah_kemasan': 'jumlahBeliKemasan',
    'jumlahbelikemasan': 'jumlahBeliKemasan',
    
    // Package unit variations
    'satuan_kemasan': 'satuanKemasan', 
    'kemasan': 'satuanKemasan',
    'package_unit': 'satuanKemasan',
    'pack_unit': 'satuanKemasan',
    'satuankemasan': 'satuanKemasan',
    
    // Total price variations
    'harga_total_beli_kemasan': 'hargaTotalBeliKemasan', 
    'harga_total': 'hargaTotalBeliKemasan',
    'total_price': 'hargaTotalBeliKemasan',
    'package_price': 'hargaTotalBeliKemasan',
    'total_cost': 'hargaTotalBeliKemasan',
    'hargatotalbelikemasan': 'hargaTotalBeliKemasan',
    'harga': 'hargaTotalBeliKemasan'
  };

  // ✅ Required fields
  const requiredFields = [
    'nama', 'kategori', 'supplier', 'satuan', 'stok', 'minimum', 
    'jumlahBeliKemasan', 'satuanKemasan', 'hargaTotalBeliKemasan'
  ];

  // ✅ Enhanced validation function
  const validate = (data: any): string[] => {
    const errors: string[] = [];
    
    // Required field validation
    if (!data.nama?.toString().trim()) errors.push('Nama bahan baku kosong');
    if (!data.kategori?.toString().trim()) errors.push('Kategori kosong');
    if (!data.supplier?.toString().trim()) errors.push('Supplier kosong');
    if (!data.satuan?.toString().trim()) errors.push('Satuan kosong');
    if (!data.satuanKemasan?.toString().trim()) errors.push('Satuan kemasan kosong');
    
    // Numeric field validation
    const stok = parseFloat(data.stok);
    const minimum = parseFloat(data.minimum);
    const jumlahKemasan = parseFloat(data.jumlahBeliKemasan);
    const hargaTotal = parseFloat(data.hargaTotalBeliKemasan);
    
    if (isNaN(stok) || stok < 0) {
      errors.push('Stok tidak valid (harus angka ≥ 0)');
    }
    if (isNaN(minimum) || minimum < 0) {
      errors.push('Minimum stok tidak valid (harus angka ≥ 0)');
    }
    if (isNaN(jumlahKemasan) || jumlahKemasan <= 0) {
      errors.push('Jumlah kemasan tidak valid (harus angka > 0)');
    }
    if (isNaN(hargaTotal) || hargaTotal <= 0) {
      errors.push('Harga total tidak valid (harus angka > 0)');
    }
    
    // Date validation (optional)
    if (data.expiry && data.expiry.toString().trim()) {
      const expiryDate = new Date(data.expiry);
      if (isNaN(expiryDate.getTime())) {
        errors.push('Format tanggal kadaluarsa tidak valid');
      }
    }
    
    return errors;
  };

  // ✅ FIXED: Better CSV parsing with multiple delimiter support
  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length < 2) throw new Error('File kosong atau hanya berisi header');
    
    // ✅ Detect delimiter
    const firstLine = lines[0];
    let delimiter = ',';
    const delimiters = [',', ';', '\t', '|'];
    
    for (const d of delimiters) {
      if (firstLine.split(d).length > firstLine.split(delimiter).length) {
        delimiter = d;
      }
    }
    
    console.log('Detected delimiter:', delimiter);
    
    // ✅ Parse with proper quote handling
    const parseRow = (row: string): string[] => {
      const result = [];
      let current = '';
      let inQuotes = false;
      let i = 0;
      
      while (i < row.length) {
        const char = row[i];
        
        if (char === '"') {
          if (inQuotes && row[i + 1] === '"') {
            current += '"';
            i += 2;
          } else {
            inQuotes = !inQuotes;
            i++;
          }
        } else if (char === delimiter && !inQuotes) {
          result.push(current.trim());
          current = '';
          i++;
        } else {
          current += char;
          i++;
        }
      }
      
      result.push(current.trim());
      return result;
    };
    
    const headers = parseRow(lines[0]).map(h => h.replace(/^"|"$/g, '').trim());
    console.log('Parsed headers:', headers);
    
    return lines.slice(1).map((line, index) => {
      const values = parseRow(line);
      const row: any = { _rowIndex: index + 2 };
      
      headers.forEach((header, i) => {
        let value = values[i] || '';
        // Remove quotes if present
        value = value.replace(/^"|"$/g, '').trim();
        row[header] = value;
      });
      
      return row;
    });
  };

  // ✅ OPTIMIZED: Lazy load XLSX only when needed
  const loadXLSX = async () => {
    try {
      const XLSX = await import('xlsx');
      return XLSX;
    } catch (error) {
      console.error('Failed to load XLSX:', error);
      toast.error('Gagal memuat library Excel. Silakan refresh halaman.');
      throw error;
    }
  };

  // ✅ FIXED: Better file processing
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
        // ✅ FIXED: Better CSV processing
        const text = await file.text();
        console.log('File content preview:', text.substring(0, 200));
        jsonData = parseCSV(text);
        console.log('Parsed CSV data:', jsonData.slice(0, 2));
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

      console.log('Raw data sample:', jsonData[0]);

      // ✅ FIXED: Better data mapping and processing
      const mapped = jsonData.map((row) => {
        const newRow: any = { _rowIndex: row._rowIndex };
        
        // Map headers to standard field names
        Object.keys(row).forEach(key => {
          if (key === '_rowIndex') return;
          
          const normalizedKey = key.toLowerCase().trim().replace(/\s+/g, '_');
          const mappedKey = headerMap[normalizedKey] || headerMap[key.toLowerCase().trim()];
          
          if (mappedKey) {
            let value = row[key];
            
            // Process numeric fields
            if (['stok', 'minimum', 'jumlahBeliKemasan', 'hargaTotalBeliKemasan'].includes(mappedKey)) {
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

      console.log('Mapped data sample:', mapped[0]);

      // ✅ Enhanced validation and error collection
      const valid: BahanBakuImport[] = [];
      const errors: string[] = [];

      // Check for required columns
      const sampleRow = mapped[0] || {};
      const availableFields = Object.keys(sampleRow).filter(k => k !== '_rowIndex');
      const missingCols = requiredFields.filter(field => !availableFields.includes(field));
      
      console.log('Available fields:', availableFields);
      console.log('Missing required fields:', missingCols);
      
      if (missingCols.length > 0) {
        errors.push(`Kolom wajib tidak ditemukan: ${missingCols.join(', ')}`);
        errors.push('Tip: Pastikan nama kolom sesuai dengan template atau gunakan variasi nama yang didukung');
        errors.push(`Kolom yang ditemukan: ${availableFields.join(', ')}`);
      }

      // Validate each row
      mapped.forEach(row => {
        const fieldErrors = validate(row);
        if (fieldErrors.length === 0 && missingCols.length === 0) {
          const { _rowIndex, ...cleanRow } = row;
          valid.push(cleanRow);
        } else {
          if (missingCols.length === 0) {
            errors.push(`Baris ${row._rowIndex}: ${fieldErrors.join(', ')}`);
          }
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
      console.error('Processing error:', error);
      toast.error(`Error memproses file: ${error.message}`);
      setPreview({ valid: [], errors: [error.message] });
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: Download template - simple CSV version
  const downloadTemplate = async () => {
    try {
      setLoading(true);
      
      // ✅ Create simple CSV template
      const csvTemplate = `nama,kategori,supplier,satuan,expiry,stok,minimum,jumlahBeliKemasan,satuanKemasan,hargaTotalBeliKemasan
"Tepung Terigu Premium","Bahan Dasar","PT Supplier Terpercaya","gram","2024-12-31",5000,1000,2,"sak 25kg",150000
"Gula Pasir Halus","Pemanis","CV Gula Manis","gram","2024-11-30",3000,500,1,"karton 1kg",18000
"Minyak Goreng","Minyak","PT Minyak Sehat","ml","2025-06-15",2000,300,4,"botol 500ml",60000`;

      // Download CSV
      const blob = new Blob([csvTemplate], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `template_bahan_baku_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Template CSV berhasil di-download');
    } catch (error) {
      console.error('Template download error:', error);
      toast.error('Gagal membuat template');
    } finally {
      setLoading(false);
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
      console.error('Import error:', error);
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
                    {loading ? 'Membuat...' : 'Download Template CSV'}
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

              {/* ✅ ENHANCED: Better info panel */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex gap-3">
                    <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900">Format yang Didukung</h4>
                      <div className="text-sm text-blue-700 mt-1 space-y-1">
                        <div>• <strong>CSV:</strong> Diproses langsung, sangat cepat</div>
                        <div>• <strong>Excel:</strong> .xlsx, .xls (butuh loading)</div>
                        <div>• <strong>Delimiter:</strong> Auto-detect koma, titik koma, tab</div>
                        <div>• <strong>Ukuran maksimal:</strong> 10MB</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-green-900">Tips Sukses</h4>
                      <div className="text-sm text-green-700 mt-1 space-y-1">
                        <div>• Download template CSV terlebih dahulu</div>
                        <div>• Gunakan Excel untuk edit, save as CSV</div>
                        <div>• Pastikan tidak ada cell kosong di kolom wajib</div>
                        <div>• Format angka: gunakan angka biasa (tanpa titik/koma)</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ✅ Simplified field info */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Kolom Wajib (Header)</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                  <div><code className="bg-white px-1 rounded">nama</code> - Nama bahan baku</div>
                  <div><code className="bg-white px-1 rounded">kategori</code> - Kategori produk</div>
                  <div><code className="bg-white px-1 rounded">supplier</code> - Nama supplier</div>
                  <div><code className="bg-white px-1 rounded">satuan</code> - Satuan dasar</div>
                  <div><code className="bg-white px-1 rounded">stok</code> - Stok saat ini</div>
                  <div><code className="bg-white px-1 rounded">minimum</code> - Stok minimum</div>
                  <div><code className="bg-white px-1 rounded">expiry</code> - Tgl kadaluarsa (opsional)</div>
                  <div><code className="bg-white px-1 rounded">jumlahBeliKemasan</code> - Jumlah kemasan</div>
                  <div><code className="bg-white px-1 rounded">satuanKemasan</code> - Jenis kemasan</div>
                  <div><code className="bg-white px-1 rounded">hargaTotalBeliKemasan</code> - Harga total</div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  💡 Header bisa menggunakan variasi nama (Indonesia/Inggris), sistem akan auto-mapping
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
                    <p className="text-sm text-blue-600">Total Baris</p>
                    <p className="text-2xl font-bold text-blue-900">{preview.valid.length + (preview.errors.filter(e => e.includes('Baris')).length)}</p>
                  </div>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div>
                    <p className="text-sm text-purple-600">Status</p>
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