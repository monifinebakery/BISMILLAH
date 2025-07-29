// 🎯 Bahan Baku Import Dialog - Pattern seperti exportUtils
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { X, Upload, FileText, AlertCircle, CheckCircle, FileSpreadsheet, Download } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

interface BahanBaku {
  id?: string;
  nama_bahan_baku: string;
  kategori: string;
  supplier: string;
  satuan: string;
  tanggal_kadaluarsa?: string;
  stok_saat_ini: number;
  minimum_stok: number;
  jumlah_beli_kemasan: number;
  satuan_kemasan: string;
  harga_total_beli_kemasan: number;
  harga_per_satuan?: number;
  harga_per_kemasan?: number;
}

interface ImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: BahanBaku[]) => Promise<boolean>;
}

interface ImportPreview {
  valid: BahanBaku[];
  invalid: any[];
  errors: string[];
}

const BahanBakuImportDialog: React.FC<ImportDialogProps> = ({
  isOpen,
  onClose,
  onImport
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Header mapping untuk fleksibilitas
  const headerMapping: Record<string, string> = {
    // Nama bahan
    'nama_bahan_baku': 'nama_bahan_baku',
    'nama bahan baku': 'nama_bahan_baku',
    'nama_bahan': 'nama_bahan_baku',
    'nama bahan': 'nama_bahan_baku',
    'bahan': 'nama_bahan_baku',
    'nama': 'nama_bahan_baku',
    
    // Kategori
    'kategori': 'kategori',
    'category': 'kategori',
    'jenis': 'kategori',
    
    // Supplier
    'supplier': 'supplier',
    'pemasok': 'supplier',
    'vendor': 'supplier',
    
    // Satuan dasar
    'satuan': 'satuan',
    'unit': 'satuan',
    'satuan_dasar': 'satuan',
    'satuan dasar': 'satuan',
    
    // Tanggal kadaluarsa
    'tanggal_kadaluarsa': 'tanggal_kadaluarsa',
    'tanggal kadaluarsa': 'tanggal_kadaluarsa',
    'kadaluarsa': 'tanggal_kadaluarsa',
    'expiry': 'tanggal_kadaluarsa',
    'exp_date': 'tanggal_kadaluarsa',
    
    // Stok saat ini
    'stok_saat_ini': 'stok_saat_ini',
    'stok saat ini': 'stok_saat_ini',
    'stok': 'stok_saat_ini',
    'current_stock': 'stok_saat_ini',
    'stock': 'stok_saat_ini',
    
    // Minimum stok
    'minimum_stok': 'minimum_stok',
    'minimum stok': 'minimum_stok',
    'min_stock': 'minimum_stok',
    'minimum': 'minimum_stok',
    
    // Jumlah beli kemasan
    'jumlah_beli_kemasan': 'jumlah_beli_kemasan',
    'jumlah beli kemasan': 'jumlah_beli_kemasan',
    'qty_kemasan': 'jumlah_beli_kemasan',
    'jumlah_kemasan': 'jumlah_beli_kemasan',
    'jumlah kemasan': 'jumlah_beli_kemasan',
    
    // Satuan kemasan
    'satuan_kemasan': 'satuan_kemasan',
    'satuan kemasan': 'satuan_kemasan',
    'unit_kemasan': 'satuan_kemasan',
    'kemasan': 'satuan_kemasan',
    
    // Harga total
    'harga_total_beli_kemasan': 'harga_total_beli_kemasan',
    'harga total beli kemasan': 'harga_total_beli_kemasan',
    'harga_total': 'harga_total_beli_kemasan',
    'harga total': 'harga_total_beli_kemasan',
    'total_harga': 'harga_total_beli_kemasan',
    'total harga': 'harga_total_beli_kemasan'
  };

  // Required fields
  const requiredFields = [
    'nama_bahan_baku',
    'kategori',
    'supplier',
    'satuan',
    'stok_saat_ini',
    'minimum_stok',
    'jumlah_beli_kemasan',
    'satuan_kemasan',
    'harga_total_beli_kemasan'
  ];

  // Validate bahan baku data
  const validateBahanBaku = (data: any): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!data.nama_bahan_baku?.toString().trim()) {
      errors.push('Nama bahan baku harus diisi');
    }

    if (!data.kategori?.toString().trim()) {
      errors.push('Kategori harus diisi');
    }

    if (!data.supplier?.toString().trim()) {
      errors.push('Supplier harus diisi');
    }

    if (!data.satuan?.toString().trim()) {
      errors.push('Satuan harus diisi');
    }

    const stokSaatIni = parseFloat(data.stok_saat_ini);
    if (isNaN(stokSaatIni) || stokSaatIni < 0) {
      errors.push('Stok saat ini harus berupa angka >= 0');
    }

    const minimumStok = parseFloat(data.minimum_stok);
    if (isNaN(minimumStok) || minimumStok < 0) {
      errors.push('Minimum stok harus berupa angka >= 0');
    }

    const jumlahBeli = parseFloat(data.jumlah_beli_kemasan);
    if (isNaN(jumlahBeli) || jumlahBeli <= 0) {
      errors.push('Jumlah beli kemasan harus berupa angka > 0');
    }

    if (!data.satuan_kemasan?.toString().trim()) {
      errors.push('Satuan kemasan harus diisi');
    }

    const hargaTotal = parseFloat(data.harga_total_beli_kemasan);
    if (isNaN(hargaTotal) || hargaTotal <= 0) {
      errors.push('Harga total beli kemasan harus berupa angka > 0');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  // Process Excel/CSV file - mirip pattern exportUtils
  const processImportFile = (file: File) => {
    setIsProcessing(true);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        let jsonData: any[] = [];
        
        // Handle Excel files
        if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames.find(name => 
            name.toLowerCase().includes('bahan') || 
            name.toLowerCase().includes('material') ||
            name.toLowerCase().includes('inventory')
          ) || workbook.SheetNames[0];
          
          const worksheet = workbook.Sheets[sheetName];
          jsonData = XLSX.utils.sheet_to_json(worksheet);
        } 
        // Handle CSV files
        else if (file.name.endsWith('.csv')) {
          const text = e.target?.result as string;
          const lines = text.split('\n').filter(line => line.trim());
          
          if (lines.length < 2) {
            throw new Error('File harus memiliki header dan minimal 1 baris data');
          }

          const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
          jsonData = lines.slice(1).map((line, index) => {
            const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
            const row: any = {};
            headers.forEach((header, i) => {
              row[header] = values[i] || '';
            });
            return row;
          });
        }

        if (jsonData.length === 0) {
          throw new Error('Tidak ada data yang ditemukan dalam file');
        }

        parseJsonData(jsonData);
        
      } catch (error) {
        console.error('Error processing file:', error);
        toast.error(`Gagal memproses file: ${error.message || 'Unknown error'}`);
        setIsProcessing(false);
      }
    };

    reader.onerror = () => {
      toast.error("Gagal membaca file");
      setIsProcessing(false);
    };

    // Read file appropriately
    if (file.name.endsWith('.csv')) {
      reader.readAsText(file, 'UTF-8');
    } else {
      reader.readAsArrayBuffer(file);
    }
  };

  // Parse JSON data from Excel/CSV
  const parseJsonData = (jsonData: any[]) => {
    try {
      const valid: BahanBaku[] = [];
      const invalid: any[] = [];
      const errors: string[] = [];

      // Get available headers and map them
      const firstRow = jsonData[0];
      const availableHeaders = Object.keys(firstRow);
      const mappedHeaders: Record<string, string> = {};
      
      // Map headers
      availableHeaders.forEach(header => {
        const normalizedHeader = header.toLowerCase().trim();
        const mappedField = headerMapping[normalizedHeader];
        if (mappedField) {
          mappedHeaders[header] = mappedField;
        }
      });

      // Check required fields
      const missingFields = requiredFields.filter(field => 
        !Object.values(mappedHeaders).includes(field)
      );

      if (missingFields.length > 0) {
        toast.error(`Kolom yang diperlukan tidak ditemukan: ${missingFields.join(', ')}`);
        setIsProcessing(false);
        return;
      }

      // Process each row
      jsonData.forEach((row, index) => {
        try {
          const processedRow: any = {};
          
          // Map data using header mapping
          Object.entries(mappedHeaders).forEach(([originalHeader, mappedField]) => {
            let value = row[originalHeader];
            
            // Convert numeric fields
            if (['stok_saat_ini', 'minimum_stok', 'jumlah_beli_kemasan', 'harga_total_beli_kemasan'].includes(mappedField)) {
              if (typeof value === 'string') {
                value = value.replace(/[,\s]/g, '');
              }
              const numValue = parseFloat(value);
              processedRow[mappedField] = isNaN(numValue) ? 0 : numValue;
            } else {
              processedRow[mappedField] = value?.toString().trim() || '';
            }
          });

          // Calculate derived values
          if (processedRow.harga_total_beli_kemasan > 0 && processedRow.jumlah_beli_kemasan > 0) {
            processedRow.harga_per_kemasan = processedRow.harga_total_beli_kemasan / processedRow.jumlah_beli_kemasan;
            processedRow.harga_per_satuan = processedRow.harga_per_kemasan; // Simplified calculation
          }

          // Validate row
          const validation = validateBahanBaku(processedRow);
          if (validation.isValid) {
            valid.push(processedRow as BahanBaku);
          } else {
            invalid.push({ ...processedRow, errors: validation.errors, rowIndex: index + 2 });
            errors.push(`Baris ${index + 2}: ${validation.errors.join(', ')}`);
          }
          
        } catch (rowError) {
          errors.push(`Baris ${index + 2}: Error memproses data - ${rowError.message}`);
        }
      });

      setImportPreview({ valid, invalid, errors });
      setIsProcessing(false);
      
    } catch (error) {
      console.error('Error parsing JSON data:', error);
      toast.error('Gagal memproses data dari file');
      setIsProcessing(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (file: File) => {
    if (!file) return;

    const allowedExtensions = ['.csv', '.xlsx', '.xls'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension)) {
      toast.error('Format file tidak didukung. Gunakan CSV atau Excel (.xlsx, .xls).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('Ukuran file terlalu besar. Maksimal 10MB.');
      return;
    }

    processImportFile(file);
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  // Execute import
  const executeImport = async () => {
    if (!importPreview || importPreview.valid.length === 0) {
      toast.error('Tidak ada data valid untuk diimpor');
      return;
    }

    setIsProcessing(true);
    
    try {
      const success = await onImport(importPreview.valid);
      
      if (success) {
        toast.success(`${importPreview.valid.length} bahan baku berhasil diimpor`);
        handleClose();
      } else {
        toast.error('Gagal mengimpor data');
      }
      
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Terjadi kesalahan saat mengimpor data');
    } finally {
      setIsProcessing(false);
    }
  };

  // Generate template Excel - mirip exportUtils pattern
  const generateTemplate = () => {
    try {
      const wb = XLSX.utils.book_new();
      
      // Template data
      const templateData = [
        {
          'nama_bahan_baku': 'Tepung Terigu',
          'kategori': 'Bahan Dasar',
          'supplier': 'PT Supplier A',
          'satuan': 'gram',
          'tanggal_kadaluarsa': '2024-12-31',
          'stok_saat_ini': 5000,
          'minimum_stok': 1000,
          'jumlah_beli_kemasan': 2,
          'satuan_kemasan': 'kg',
          'harga_total_beli_kemasan': 150000
        },
        {
          'nama_bahan_baku': 'Gula Pasir',
          'kategori': 'Pemanis',
          'supplier': 'PT Supplier B',
          'satuan': 'gram',
          'tanggal_kadaluarsa': '2024-11-30',
          'stok_saat_ini': 3000,
          'minimum_stok': 500,
          'jumlah_beli_kemasan': 1,
          'satuan_kemasan': 'kg',
          'harga_total_beli_kemasan': 18000
        },
        {
          'nama_bahan_baku': 'Minyak Goreng',
          'kategori': 'Minyak',
          'supplier': 'PT Supplier C',
          'satuan': 'ml',
          'tanggal_kadaluarsa': '2025-01-15',
          'stok_saat_ini': 2000,
          'minimum_stok': 300,
          'jumlah_beli_kemasan': 4,
          'satuan_kemasan': 'liter',
          'harga_total_beli_kemasan': 120000
        }
      ];

      const worksheet = XLSX.utils.json_to_sheet(templateData);
      
      // Set column widths
      const colWidths = [
        { wch: 20 }, // nama_bahan_baku
        { wch: 15 }, // kategori
        { wch: 18 }, // supplier
        { wch: 10 }, // satuan
        { wch: 18 }, // tanggal_kadaluarsa
        { wch: 12 }, // stok_saat_ini
        { wch: 12 }, // minimum_stok
        { wch: 18 }, // jumlah_beli_kemasan
        { wch: 15 }, // satuan_kemasan
        { wch: 20 }  // harga_total_beli_kemasan
      ];
      worksheet['!cols'] = colWidths;
      
      XLSX.utils.book_append_sheet(wb, worksheet, "Template Import");

      // Add instruction sheet
      const instructionData = [
        { 'Kolom': 'nama_bahan_baku', 'Wajib': 'Ya', 'Deskripsi': 'Nama lengkap bahan baku' },
        { 'Kolom': 'kategori', 'Wajib': 'Ya', 'Deskripsi': 'Kategori bahan (misal: Bahan Dasar, Bumbu, dll)' },
        { 'Kolom': 'supplier', 'Wajib': 'Ya', 'Deskripsi': 'Nama supplier/vendor' },
        { 'Kolom': 'satuan', 'Wajib': 'Ya', 'Deskripsi': 'Satuan dasar (gram, ml, pcs, dll)' },
        { 'Kolom': 'tanggal_kadaluarsa', 'Wajib': 'Tidak', 'Deskripsi': 'Format: YYYY-MM-DD' },
        { 'Kolom': 'stok_saat_ini', 'Wajib': 'Ya', 'Deskripsi': 'Jumlah stok dalam satuan dasar' },
        { 'Kolom': 'minimum_stok', 'Wajib': 'Ya', 'Deskripsi': 'Batas minimum stok' },
        { 'Kolom': 'jumlah_beli_kemasan', 'Wajib': 'Ya', 'Deskripsi': 'Jumlah kemasan yang dibeli' },
        { 'Kolom': 'satuan_kemasan', 'Wajib': 'Ya', 'Deskripsi': 'Satuan kemasan (kg, liter, karton, dll)' },
        { 'Kolom': 'harga_total_beli_kemasan', 'Wajib': 'Ya', 'Deskripsi': 'Total harga pembelian dalam rupiah' }
      ];

      const instructionSheet = XLSX.utils.json_to_sheet(instructionData);
      instructionSheet['!cols'] = [{ wch: 25 }, { wch: 8 }, { wch: 40 }];
      XLSX.utils.book_append_sheet(wb, instructionSheet, "Petunjuk");

      // Generate filename
      const fileName = `template_import_bahan_baku_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      toast.success("Template Excel berhasil di-download!");
      
    } catch (error) {
      console.error("Error generating template:", error);
      toast.error("Gagal membuat template Excel");
    }
  };

  // Reset state when dialog closes
  const handleClose = () => {
    setImportPreview(null);
    setIsProcessing(false);
    setDragOver(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-green-100">
              <Upload className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Import Bahan Baku</h2>
              <p className="text-sm text-gray-600">
                Import data bahan baku dari file Excel atau CSV
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isProcessing}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          
          {/* File Upload Area */}
          {!importPreview && (
            <div className="space-y-6">
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragOver 
                    ? 'border-green-400 bg-green-50' 
                    : 'border-gray-300 hover:border-green-400'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center">
                  <Upload className={`w-12 h-12 mb-4 ${
                    dragOver ? 'text-green-500' : 'text-gray-400'
                  }`} />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {dragOver ? 'Lepaskan file di sini' : 'Upload File Bahan Baku'}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Drag & drop file Excel (.xlsx, .xls) atau CSV, atau klik untuk browse
                  </p>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isProcessing}
                      className="flex items-center gap-2"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      {isProcessing ? 'Memproses...' : 'Pilih File'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={generateTemplate}
                      className="flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download Template
                    </Button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file);
                    }}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Info Panel */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-blue-900 mb-2">
                      Format File yang Didukung
                    </h4>
                    <div className="text-sm text-blue-700 space-y-2">
                      <div><strong>Excel:</strong> .xlsx, .xls (Rekomendasi)</div>
                      <div><strong>CSV:</strong> .csv (Comma-separated values)</div>
                      <div><strong>Ukuran maksimal:</strong> 10MB</div>
                    </div>
                    <div className="mt-3 text-xs text-blue-600">
                      <div><strong>💡 Tips:</strong></div>
                      <div>• Download template Excel untuk format yang benar</div>
                      <div>• Pastikan tidak ada baris kosong di tengah data</div>
                      <div>• Gunakan format tanggal YYYY-MM-DD untuk kadaluarsa</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Import Preview */}
          {importPreview && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Preview Import Data</h3>
                <Button
                  onClick={() => setImportPreview(null)}
                  variant="outline"
                  size="sm"
                  disabled={isProcessing}
                >
                  Pilih File Lain
                </Button>
              </div>
              
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm text-green-600">Data Valid</p>
                      <p className="text-2xl font-bold text-green-900">
                        {importPreview.valid.length}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="text-sm text-red-600">Data Error</p>
                      <p className="text-2xl font-bold text-red-900">
                        {importPreview.invalid.length}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div>
                    <p className="text-sm text-blue-600">Total Baris</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {importPreview.valid.length + importPreview.invalid.length}
                    </p>
                  </div>
                </div>
              </div>

              {/* Error List */}
              {importPreview.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-900 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Error yang Ditemukan ({importPreview.errors.length})
                  </h4>
                  <div className="max-h-48 overflow-y-auto">
                    <ul className="text-sm text-red-700 space-y-1">
                      {importPreview.errors.slice(0, 20).map((error, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-red-400 mt-1.5">•</span>
                          <span>{error}</span>
                        </li>
                      ))}
                      {importPreview.errors.length > 20 && (
                        <li className="italic text-red-600">
                          ... dan {importPreview.errors.length - 20} error lainnya
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              )}

              {/* Valid Data Preview Table */}
              {importPreview.valid.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Preview Data Valid (10 pertama)
                  </h4>
                  <div className="overflow-x-auto border rounded-lg">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-gray-500">Nama Bahan</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-500">Kategori</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-500">Supplier</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-500">Stok</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-500">Min Stock</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-500">Kemasan</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-500">Harga Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {importPreview.valid.slice(0, 10).map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-gray-900 font-medium">{item.nama_bahan_baku}</td>
                            <td className="px-3 py-2 text-gray-600">{item.kategori}</td>
                            <td className="px-3 py-2 text-gray-600">{item.supplier}</td>
                            <td className="px-3 py-2 text-gray-600">
                              {item.stok_saat_ini} {item.satuan}
                            </td>
                            <td className="px-3 py-2 text-gray-600">
                              {item.minimum_stok} {item.satuan}
                            </td>
                            <td className="px-3 py-2 text-gray-600">
                              {item.jumlah_beli_kemasan} {item.satuan_kemasan}
                            </td>
                            <td className="px-3 py-2 text-gray-600 font-medium">
                              Rp {item.harga_total_beli_kemasan?.toLocaleString('id-ID')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {importPreview.valid.length > 10 && (
                    <p className="text-sm text-gray-500 mt-2 text-center">
                      ... dan {importPreview.valid.length - 10} data valid lainnya
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {importPreview && (
              <span>
                Siap mengimpor <strong>{importPreview.valid.length}</strong> bahan baku
                {importPreview.invalid.length > 0 && (
                  <span className="text-red-600 ml-2">
                    ({importPreview.invalid.length} error)
                  </span>
                )}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isProcessing}
            >
              Batal
            </Button>
            
            {importPreview && (
              <Button
                onClick={executeImport}
                disabled={importPreview.valid.length === 0 || isProcessing}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Mengimpor...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Import {importPreview.valid.length} Bahan Baku
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BahanBakuImportDialog;