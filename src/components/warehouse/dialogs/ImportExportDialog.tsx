// src/components/warehouse/dialogs/ImportExportDialog.tsx
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { X, Upload, Download, FileText, AlertCircle, CheckCircle, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { warehouseUtils } from '../services/warehouseUtils';
import type { BahanBaku } from '../types';

interface ImportExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'import' | 'export';
  data: BahanBaku[];
  selectedData: BahanBaku[];
  onImport: (data: any) => Promise<boolean>;
  onExport: (data: BahanBaku[], format: string) => void;
}

interface ImportPreview {
  valid: any[];
  invalid: any[];
  errors: string[];
}

/**
 * Combined Import/Export Dialog Component
 * 
 * Features:
 * - Import: CSV/Excel file upload with validation
 * - Export: Multiple formats (CSV, Excel, PDF)
 * - Data preview and validation
 * - Progress indication
 * - Error handling
 * 
 * Size: ~8KB (loaded lazily)
 */
const ImportExportDialog: React.FC<ImportExportDialogProps> = ({
  isOpen,
  onClose,
  type,
  data,
  selectedData,
  onImport,
  onExport,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState('csv');
  const [exportScope, setExportScope] = useState<'all' | 'selected'>('all');
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isImportMode = type === 'import';
  const title = isImportMode ? 'Import Data' : 'Export Data';
  const icon = isImportMode ? Upload : Download;

  // Export formats
  const exportFormats = [
    { value: 'csv', label: 'CSV', description: 'Comma-separated values (.csv)' },
    { value: 'excel', label: 'Excel', description: 'Microsoft Excel (.xlsx)' },
    { value: 'pdf', label: 'PDF', description: 'Portable Document Format (.pdf)' },
  ];

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
        parseImportData(text, file.type);
      } catch (error) {
        console.error('Error reading file:', error);
        toast.error('Gagal membaca file');
        setIsProcessing(false);
      }
    };
    
    reader.readAsText(file);
  };

  // Parse import data
  const parseImportData = (text: string, fileType: string) => {
    try {
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        toast.error('File harus memiliki header dan minimal 1 baris data');
        setIsProcessing(false);
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const requiredHeaders = ['nama', 'kategori', 'supplier', 'stok', 'minimum', 'satuan', 'harga'];
      
      // Check required headers
      const missingHeaders = requiredHeaders.filter(h => 
        !headers.some(header => header.toLowerCase().includes(h))
      );
      
      if (missingHeaders.length > 0) {
        toast.error(`Header yang diperlukan tidak ditemukan: ${missingHeaders.join(', ')}`);
        setIsProcessing(false);
        return;
      }

      const valid: any[] = [];
      const invalid: any[] = [];
      const errors: string[] = [];

      // Parse data rows
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        
        if (values.length !== headers.length) {
          errors.push(`Baris ${i + 1}: Jumlah kolom tidak sesuai`);
          continue;
        }

        const rowData: any = {};
        headers.forEach((header, index) => {
          const key = header.toLowerCase();
          let value = values[index];
          
          // Convert numeric fields
          if (['stok', 'minimum', 'harga'].includes(key)) {
            const numValue = parseFloat(value);
            rowData[key] = isNaN(numValue) ? 0 : numValue;
          } else {
            rowData[key] = value;
          }
        });

        // Validate row data
        const validation = warehouseUtils.validateBahanBaku(rowData);
        if (validation.isValid) {
          valid.push(rowData);
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
      let successCount = 0;
      
      for (const item of importPreview.valid) {
        const success = await onImport(item);
        if (success) successCount++;
      }

      if (successCount > 0) {
        toast.success(`${successCount} item berhasil diimpor`);
        onClose();
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

  // Execute export
  const executeExport = () => {
    const exportData = exportScope === 'selected' ? selectedData : data;
    
    if (exportData.length === 0) {
      toast.error('Tidak ada data untuk diekspor');
      return;
    }

    setIsProcessing(true);
    
    try {
      onExport(exportData, selectedFormat);
      toast.success(`Data berhasil diekspor dalam format ${selectedFormat.toUpperCase()}`);
      onClose();
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Gagal mengekspor data');
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset state when dialog closes
  const handleClose = () => {
    setImportPreview(null);
    setIsProcessing(false);
    setSelectedFormat('csv');
    setExportScope('all');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              isImportMode ? 'bg-green-100' : 'bg-blue-100'
            }`}>
              <icon className={`w-5 h-5 ${
                isImportMode ? 'text-green-600' : 'text-blue-600'
              }`} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
              <p className="text-sm text-gray-600">
                {isImportMode 
                  ? 'Import data dari file CSV atau Excel' 
                  : 'Export data ke berbagai format file'
                }
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
          
          {isImportMode ? (
            /* Import Section */
            <div className="space-y-6">
              
              {/* File Upload Area */}
              {!importPreview && (
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
                      {dragOver ? 'Lepaskan file di sini' : 'Upload File'}
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
              )}

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
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        // Create and download template
                        const template = 'nama,kategori,supplier,stok,minimum,satuan,harga,expiry\n"Contoh Bahan","Kategori A","Supplier 1",100,10,"kg",5000,"2024-12-31"';
                        const blob = new Blob([template], { type: 'text/csv' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'template_import_bahan_baku.csv';
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="text-blue-600 border-blue-300 hover:bg-blue-50"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Template
                    </Button>
                  </div>
                </div>
              </div>

              {/* Import Preview */}
              {importPreview && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Preview Data</h3>
                  
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
                        <table className="min-w-full border border-gray-200 rounded-lg">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Nama</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Kategori</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Stok</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Harga</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {importPreview.valid.slice(0, 5).map((item, index) => (
                              <tr key={index}>
                                <td className="px-3 py-2 text-sm text-gray-900">{item.nama}</td>
                                <td className="px-3 py-2 text-sm text-gray-600">{item.kategori}</td>
                                <td className="px-3 py-2 text-sm text-gray-600">{item.stok} {item.satuan}</td>
                                <td className="px-3 py-2 text-sm text-gray-600">{warehouseUtils.formatCurrency(item.harga)}</td>
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
          ) : (
            /* Export Section */
            <div className="space-y-6">
              
              {/* Export Options */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Opsi Export</h3>
                
                {/* Data Scope */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Data yang akan diekspor:
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="all"
                        checked={exportScope === 'all'}
                        onChange={(e) => setExportScope(e.target.value as 'all' | 'selected')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="ml-3 text-sm text-gray-700">
                        Semua data ({data.length} item)
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="selected"
                        checked={exportScope === 'selected'}
                        onChange={(e) => setExportScope(e.target.value as 'all' | 'selected')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        disabled={selectedData.length === 0}
                      />
                      <span className={`ml-3 text-sm ${
                        selectedData.length === 0 ? 'text-gray-400' : 'text-gray-700'
                      }`}>
                        Hanya data yang dipilih ({selectedData.length} item)
                      </span>
                    </label>
                  </div>
                </div>

                {/* Format Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Format file:
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {exportFormats.map((format) => (
                      <label
                        key={format.value}
                        className={`relative flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                          selectedFormat === format.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200'
                        }`}
                      >
                        <input
                          type="radio"
                          value={format.value}
                          checked={selectedFormat === format.value}
                          onChange={(e) => setSelectedFormat(e.target.value)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {format.label}
                          </div>
                          <div className="text-xs text-gray-500">
                            {format.description}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Export Preview */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">
                  Preview Export
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Jumlah Item:</span>
                    <span className="font-medium ml-2">
                      {exportScope === 'selected' ? selectedData.length : data.length}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Format:</span>
                    <span className="font-medium ml-2">{selectedFormat.toUpperCase()}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Nilai:</span>
                    <span className="font-medium ml-2">
                      {warehouseUtils.formatCurrency(
                        (exportScope === 'selected' ? selectedData : data)
                          .reduce((sum, item) => sum + (item.stok * item.harga), 0)
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Ukuran Estimasi:</span>
                    <span className="font-medium ml-2">
                      ~{Math.round((exportScope === 'selected' ? selectedData.length : data.length) * 0.5)}KB
                    </span>
                  </div>
                </div>
              </div>
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
          
          {isImportMode ? (
            <>
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
                    Import {importPreview?.valid.length || 0} Item
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button
              onClick={executeExport}
              disabled={isProcessing || (exportScope === 'selected' && selectedData.length === 0)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Mengekspor...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Export Data
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportExportDialog;