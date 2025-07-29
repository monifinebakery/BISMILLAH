// 🎯 Bahan Baku Import Dialog - Sesuai dengan Screenshot
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { X, Upload, FileText, AlertCircle, CheckCircle, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';

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
  harga_per_satuan: number;
  harga_per_kemasan: number;
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

  // Required columns sesuai screenshot
  const requiredColumns = [
    'nama_bahan_baku',
    'kategori', 
    'supplier',
    'satuan',
    'tanggal_kadaluarsa',
    'stok_saat_ini',
    'minimum_stok',
    'jumlah_beli_kemasan',
    'satuan_kemasan',
    'harga_total_beli_kemasan'
  ];

  // Column mapping untuk berbagai format header
  const columnMapping: Record<string, string> = {
    'nama bahan baku': 'nama_bahan_baku',
    'nama_bahan_baku': 'nama_bahan_baku',
    'nama': 'nama_bahan_baku',
    'bahan': 'nama_bahan_baku',
    
    'kategori': 'kategori',
    'category': 'kategori',
    
    'supplier': 'supplier',
    'pemasok': 'supplier',
    
    'satuan': 'satuan',
    'unit': 'satuan',
    'satuan_dasar': 'satuan',
    
    'tanggal kadaluarsa': 'tanggal_kadaluarsa',
    'tanggal_kadaluarsa': 'tanggal_kadaluarsa',
    'expiry': 'tanggal_kadaluarsa',
    'exp_date': 'tanggal_kadaluarsa',
    
    'stok saat ini': 'stok_saat_ini',
    'stok_saat_ini': 'stok_saat_ini',
    'stok': 'stok_saat_ini',
    'current_stock': 'stok_saat_ini',
    
    'minimum stok': 'minimum_stok',
    'minimum_stok': 'minimum_stok',
    'min_stock': 'minimum_stok',
    
    'jumlah beli kemasan': 'jumlah_beli_kemasan',
    'jumlah_beli_kemasan': 'jumlah_beli_kemasan',
    'qty_kemasan': 'jumlah_beli_kemasan',
    'jumlah_kemasan': 'jumlah_beli_kemasan',
    
    'satuan kemasan': 'satuan_kemasan',
    'satuan_kemasan': 'satuan_kemasan',
    'unit_kemasan': 'satuan_kemasan',
    
    'harga total beli kemasan': 'harga_total_beli_kemasan',
    'harga_total_beli_kemasan': 'harga_total_beli_kemasan',
    'total_harga': 'harga_total_beli_kemasan',
    'harga_total': 'harga_total_beli_kemasan'
  };

  // Validate bahan baku data
  const validateBahanBaku = (data: any): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!data.nama_bahan_baku?.trim()) {
      errors.push('Nama bahan baku harus diisi');
    }

    if (!data.kategori?.trim()) {
      errors.push('Kategori harus diisi');
    }

    if (!data.supplier?.trim()) {
      errors.push('Supplier harus diisi');
    }

    if (!data.satuan?.trim()) {
      errors.push('Satuan harus diisi');
    }

    if (isNaN(data.stok_saat_ini) || data.stok_saat_ini < 0) {
      errors.push('Stok saat ini harus berupa angka >= 0');
    }

    if (isNaN(data.minimum_stok) || data.minimum_stok < 0) {
      errors.push('Minimum stok harus berupa angka >= 0');
    }

    if (isNaN(data.jumlah_beli_kemasan) || data.jumlah_beli_kemasan <= 0) {
      errors.push('Jumlah beli kemasan harus berupa angka > 0');
    }

    if (!data.satuan_kemasan?.trim()) {
      errors.push('Satuan kemasan harus diisi');
    }

    if (isNaN(data.harga_total_beli_kemasan) || data.harga_total_beli_kemasan <= 0) {
      errors.push('Harga total beli kemasan harus berupa angka > 0');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  // Parse CSV content
  const parseCSV = (text: string): string[][] => {
    const lines = text.split('\n').filter(line => line.trim());
    const result: string[][] = [];

    for (const line of lines) {
      const columns: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          columns.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      
      columns.push(current.trim());
      result.push(columns);
    }

    return result;
  };

  // Handle file selection
  const handleFileSelect = (file: File) => {
    if (!file) return;

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    if (!['csv', 'xlsx', 'xls'].includes(fileExtension || '')) {
      toast.error('Format file tidak didukung. Gunakan CSV atau Excel.');
      return;
    }

    setIsProcessing(true);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        parseImportData(text);
      } catch (error) {
        console.error('Error reading file:', error);
        toast.error('Gagal membaca file');
        setIsProcessing(false);
      }
    };
    
    reader.readAsText(file, 'UTF-8');
  };

  // Parse import data
  const parseImportData = (text: string) => {
    try {
      const rows = parseCSV(text);
      
      if (rows.length < 2) {
        toast.error('File harus memiliki header dan minimal 1 baris data');
        setIsProcessing(false);
        return;
      }

      // Map headers
      const rawHeaders = rows[0].map(h => h.toLowerCase().trim());
      const mappedHeaders = rawHeaders.map(header => {
        const mapped = columnMapping[header];
        return mapped || header;
      });

      // Check required columns
      const missingColumns: string[] = [];
      for (const required of requiredColumns) {
        if (!mappedHeaders.includes(required)) {
          missingColumns.push(required);
        }
      }

      if (missingColumns.length > 0) {
        toast.error(`Kolom yang diperlukan tidak ditemukan: ${missingColumns.join(', ')}`);
        setIsProcessing(false);
        return;
      }

      const valid: BahanBaku[] = [];
      const invalid: any[] = [];
      const errors: string[] = [];

      // Parse data rows
      for (let i = 1; i < rows.length; i++) {
        const values = rows[i];
        
        if (values.length !== rawHeaders.length) {
          errors.push(`Baris ${i + 1}: Jumlah kolom tidak sesuai dengan header`);
          continue;
        }

        const rowData: any = {};
        
        // Map values to proper columns
        for (let j = 0; j < mappedHeaders.length; j++) {
          const column = mappedHeaders[j];
          let value = values[j]?.replace(/"/g, '').trim();
          
          // Convert numeric fields
          if (['stok_saat_ini', 'minimum_stok', 'jumlah_beli_kemasan', 'harga_total_beli_kemasan'].includes(column)) {
            const numValue = parseFloat(value?.replace(/[,]/g, '') || '0');
            rowData[column] = isNaN(numValue) ? 0 : numValue;
          } else {
            rowData[column] = value || '';
          }
        }

        // Calculate derived fields
        if (rowData.harga_total_beli_kemasan > 0 && rowData.jumlah_beli_kemasan > 0) {
          rowData.harga_per_kemasan = rowData.harga_total_beli_kemasan / rowData.jumlah_beli_kemasan;
          rowData.harga_per_satuan = rowData.harga_per_kemasan; // Simplified calculation
        }

        // Validate row data
        const validation = validateBahanBaku(rowData);
        if (validation.isValid) {
          valid.push(rowData as BahanBaku);
        } else {
          invalid.push({ ...rowData, errors: validation.errors });
          errors.push(`Baris ${i + 1}: ${validation.errors.join(', ')}`);
        }
      }

      setImportPreview({ valid, invalid, errors });
      setIsProcessing(false);
      
    } catch (error) {
      console.error('Error parsing data:', error);
      toast.error('Gagal memproses file');
      setIsProcessing(false);
    }
  };

  // Handle drag and drop
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

  // Generate and download template
  const downloadTemplate = () => {
    // Create CSV with header row and multiple sample data rows
    const csvContent = `nama_bahan_baku,kategori,supplier,satuan,tanggal_kadaluarsa,stok_saat_ini,minimum_stok,jumlah_beli_kemasan,satuan_kemasan,harga_total_beli_kemasan
"Tepung Terigu","Bahan Dasar","PT Supplier A","gram","2024-12-31","5000","1000","2","kg","150000"
"Gula Pasir","Pemanis","PT Supplier B","gram","2024-11-30","3000","500","1","kg","18000"
"Minyak Goreng","Minyak","PT Supplier C","ml","2025-01-15","2000","300","4","liter","120000"
"Bawang Merah","Bumbu","PT Supplier D","gram","2024-10-31","1500","200","3","kg","75000"
"Cabai Merah","Bumbu","PT Supplier E","gram","2024-09-30","800","100","2","kg","50000"`;

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_import_bahan_baku.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Reset state when dialog closes
  const handleClose = () => {
    setImportPreview(null);
    setIsProcessing(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-green-100">
              <Upload className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Import Bahan Baku</h2>
              <p className="text-sm text-gray-600">
                Import data bahan baku dari file CSV atau Excel
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
                    Drag & drop file CSV atau Excel, atau klik untuk browse
                  </p>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                    className="flex items-center gap-2"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Pilih File
                  </Button>
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

              {/* Template Download */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-blue-900 mb-1">
                      Template Import
                    </h4>
                    <p className="text-sm text-blue-700 mb-3">
                      Download template CSV untuk memastikan format data yang benar.
                    </p>
                    <div className="text-xs text-blue-600 mb-3 space-y-1">
                      <div><strong>Kolom yang diperlukan:</strong></div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>• nama_bahan_baku</div>
                        <div>• kategori</div>
                        <div>• supplier</div>
                        <div>• satuan</div>
                        <div>• tanggal_kadaluarsa</div>
                        <div>• stok_saat_ini</div>
                        <div>• minimum_stok</div>
                        <div>• jumlah_beli_kemasan</div>
                        <div>• satuan_kemasan</div>
                        <div>• harga_total_beli_kemasan</div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={downloadTemplate}
                      className="text-blue-600 border-blue-300 hover:bg-blue-50"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Download Template CSV
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Import Preview */}
          {importPreview && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Preview Data Import</h3>
              
              {/* Summary */}
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
                  <h4 className="font-medium text-red-900 mb-2">
                    Error yang Ditemukan:
                  </h4>
                  <div className="max-h-40 overflow-y-auto">
                    <ul className="text-sm text-red-700 space-y-1">
                      {importPreview.errors.slice(0, 10).map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                      {importPreview.errors.length > 10 && (
                        <li className="italic">... dan {importPreview.errors.length - 10} error lainnya</li>
                      )}
                    </ul>
                  </div>
                </div>
              )}

              {/* Valid Data Preview */}
              {importPreview.valid.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">
                    Preview Data Valid (5 pertama):
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-200 rounded-lg text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Nama Bahan</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Kategori</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Supplier</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Stok</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Min Stock</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Harga Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {importPreview.valid.slice(0, 5).map((item, index) => (
                          <tr key={index}>
                            <td className="px-3 py-2 text-gray-900">{item.nama_bahan_baku}</td>
                            <td className="px-3 py-2 text-gray-600">{item.kategori}</td>
                            <td className="px-3 py-2 text-gray-600">{item.supplier}</td>
                            <td className="px-3 py-2 text-gray-600">{item.stok_saat_ini} {item.satuan}</td>
                            <td className="px-3 py-2 text-gray-600">{item.minimum_stok} {item.satuan}</td>
                            <td className="px-3 py-2 text-gray-600">Rp {item.harga_total_beli_kemasan?.toLocaleString('id-ID')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
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
              onClick={() => setImportPreview(null)}
              variant="outline"
              disabled={isProcessing}
            >
              Pilih File Lain
            </Button>
          )}
          
          <Button
            onClick={executeImport}
            disabled={!importPreview || importPreview.valid.length === 0 || isProcessing}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                Mengimpor...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Import {importPreview?.valid.length || 0} Bahan Baku
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BahanBakuImportDialog;