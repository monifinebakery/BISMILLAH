// src/components/warehouse/components/dialogs/ImportDialog.tsx
import React, { useState, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Upload,
  Loader2,
  FileText,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  X,
  Download,
  Info,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { BahanBaku, ImportResult } from '../../types/warehouse';
import { validateBahanBakuData } from '../../context/utils/transformers';
import { cn } from '@/lib/utils';

interface ImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (item: Omit<BahanBaku, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<boolean>;
}

interface ParsedItem {
  data: Partial<BahanBaku>;
  errors: string[];
  isValid: boolean;
  row: number;
}

const ImportDialog: React.FC<ImportDialogProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedItem[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [currentStep, setCurrentStep] = useState<'upload' | 'preview' | 'result'>('upload');
  const [importProgress, setImportProgress] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // CSV template headers
  const csvHeaders = [
    'nama', 'kategori', 'stok', 'satuan', 'minimum', 'hargaSatuan', 
    'supplier', 'tanggalKadaluwarsa', 'jumlahBeliKemasan', 'satuanKemasan', 'hargaTotalBeliKemasan'
  ];

  const resetState = () => {
    setFile(null);
    setParsedData([]);
    setImportResult(null);
    setCurrentStep('upload');
    setImportProgress(0);
  };

  const downloadTemplate = () => {
    const templateData = [
      csvHeaders.join(','),
      'Tepung Terigu,Bahan Pokok,100,kg,10,15000,PT Sumber Makmur,2024-12-31,10,karton,1500000',
      'Gula Pasir,Bahan Pokok,50,kg,5,12000,CV Sweet Indo,2024-11-30,20,karton,240000',
      'Minyak Goreng,Minyak & Lemak,25,liter,5,18000,PT Minyak Jaya,2024-10-15,12,jerigen,216000',
    ].join('\n');

    const blob = new Blob([templateData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = 'template_import_inventory.csv';
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Template berhasil diunduh');
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        toast.error('Hanya file CSV yang didukung');
        return;
      }
      
      if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('File terlalu besar. Maksimal 5MB');
        return;
      }
      
      setFile(selectedFile);
    }
  };

  const parseCSV = (content: string): ParsedItem[] => {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('File CSV harus memiliki header dan minimal 1 baris data');
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const dataLines = lines.slice(1);

    return dataLines.map((line, index) => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      const row = index + 2; // +2 because index starts from 0 and we skip header
      
      try {
        const itemData: Partial<BahanBaku> = {};
        
        headers.forEach((header, i) => {
          const value = values[i] || '';
          
          switch (header.toLowerCase()) {
            case 'nama':
              itemData.nama = value;
              break;
            case 'kategori':
              itemData.kategori = value;
              break;
            case 'stok':
              itemData.stok = parseFloat(value) || 0;
              break;
            case 'satuan':
              itemData.satuan = value;
              break;
            case 'minimum':
              itemData.minimum = parseFloat(value) || 0;
              break;
            case 'hargasatuan':
              itemData.hargaSatuan = parseFloat(value) || 0;
              break;
            case 'supplier':
              itemData.supplier = value;
              break;
            case 'tanggalkadaluwarsa':
              if (value) {
                const date = new Date(value);
                itemData.tanggalKadaluwarsa = isNaN(date.getTime()) ? null : date;
              }
              break;
            case 'jumlahbelikemasan':
              itemData.jumlahBeliKemasan = parseFloat(value) || 0;
              break;
            case 'satuankemasan':
              itemData.satuanKemasan = value;
              break;
            case 'hargatotalbelikemasan':
              itemData.hargaTotalBeliKemasan = parseFloat(value) || 0;
              break;
          }
        });

        const validation = validateBahanBakuData(itemData);
        
        return {
          data: itemData,
          errors: validation.errors,
          isValid: validation.isValid,
          row,
        };
      } catch (error) {
        return {
          data: {},
          errors: [`Baris ${row}: Error parsing data - ${error}`],
          isValid: false,
          row,
        };
      }
    });
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    
    try {
      const content = await file.text();
      const parsed = parseCSV(content);
      
      setParsedData(parsed);
      setCurrentStep('preview');
      
      const validCount = parsed.filter(item => item.isValid).length;
      const invalidCount = parsed.length - validCount;
      
      if (invalidCount > 0) {
        toast.warning(`${validCount} item valid, ${invalidCount} item bermasalah`);
      } else {
        toast.success(`${validCount} item siap untuk diimpor`);
      }
      
    } catch (error: any) {
      console.error('Parse error:', error);
      toast.error(`Gagal memproses file: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleImport = async () => {
    const validItems = parsedData.filter(item => item.isValid);
    
    if (validItems.length === 0) {
      toast.error('Tidak ada item valid untuk diimpor');
      return;
    }

    setIsImporting(true);
    setImportProgress(0);
    
    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < validItems.length; i++) {
      const item = validItems[i];
      
      try {
        const success = await onImport(item.data as Omit<BahanBaku, 'id' | 'createdAt' | 'updatedAt' | 'userId'>);
        
        if (success) {
          successCount++;
        } else {
          failedCount++;
          errors.push(`Baris ${item.row}: Gagal menyimpan ke database`);
        }
      } catch (error: any) {
        failedCount++;
        errors.push(`Baris ${item.row}: ${error.message}`);
      }
      
      // Update progress
      const progress = Math.round(((i + 1) / validItems.length) * 100);
      setImportProgress(progress);
      
      // Small delay to show progress
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const result: ImportResult = {
      success: successCount,
      failed: failedCount,
      errors,
      duplicates: 0, // Could be implemented with duplicate checking
    };

    setImportResult(result);
    setCurrentStep('result');
    setIsImporting(false);

    if (successCount > 0) {
      toast.success(`${successCount} item berhasil diimpor`);
    }
    
    if (failedCount > 0) {
      toast.error(`${failedCount} item gagal diimpor`);
    }
  };

  const renderUploadStep = () => (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-blue-900 mb-2">Panduan Import</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• File harus dalam format CSV dengan encoding UTF-8</li>
              <li>• Gunakan template yang disediakan untuk format yang benar</li>
              <li>• Maksimal ukuran file 5MB</li>
              <li>• Pastikan data sesuai dengan format template</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Template Download */}
      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
        <div className="flex items-center gap-3">
          <FileSpreadsheet className="h-8 w-8 text-green-600" />
          <div>
            <h4 className="font-medium text-gray-900">Template CSV</h4>
            <p className="text-sm text-gray-600">Unduh template untuk format yang benar</p>
          </div>
        </div>
        <Button variant="outline" onClick={downloadTemplate}>
          <Download className="h-4 w-4 mr-2" />
          Unduh Template
        </Button>
      </div>

      {/* File Upload */}
      <div className="space-y-2">
        <Label>Upload File CSV</Label>
        <div 
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
            file ? "border-green-500 bg-green-50" : "border-gray-300 hover:border-gray-400"
          )}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
          
          {file ? (
            <div className="flex items-center justify-center gap-2">
              <FileText className="h-8 w-8 text-green-600" />
              <div>
                <p className="font-medium text-green-900">{file.name}</p>
                <p className="text-sm text-green-700">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
          ) : (
            <div>
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">Klik untuk memilih file CSV</p>
              <p className="text-sm text-gray-500 mt-1">atau drag & drop file di sini</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderPreviewStep = () => {
    const validItems = parsedData.filter(item => item.isValid);
    const invalidItems = parsedData.filter(item => !item.isValid);

    return (
      <div className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-600">{validItems.length}</div>
            <div className="text-sm text-green-800">Valid</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-red-600">{invalidItems.length}</div>
            <div className="text-sm text-red-800">Error</div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-gray-600">{parsedData.length}</div>
            <div className="text-sm text-gray-800">Total</div>
          </div>
        </div>

        {/* Error Items */}
        {invalidItems.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-medium text-red-900 mb-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Item dengan Error ({invalidItems.length})
            </h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {invalidItems.slice(0, 5).map((item, index) => (
                <div key={index} className="text-sm">
                  <div className="font-medium text-red-800">Baris {item.row}:</div>
                  <ul className="list-disc list-inside text-red-700 ml-2">
                    {item.errors.map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                  </ul>
                </div>
              ))}
              {invalidItems.length > 5 && (
                <div className="text-sm text-red-600">
                  dan {invalidItems.length - 5} error lainnya...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Valid Items Preview */}
        {validItems.length > 0 && (
          <div className="border rounded-lg">
            <div className="p-3 border-b bg-gray-50">
              <h4 className="font-medium text-gray-900">Preview Data Valid ({validItems.length})</h4>
            </div>
            <div className="max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left">Nama</th>
                    <th className="px-3 py-2 text-left">Kategori</th>
                    <th className="px-3 py-2 text-left">Stok</th>
                    <th className="px-3 py-2 text-left">Harga</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {validItems.slice(0, 10).map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-3 py-2">{item.data.nama}</td>
                      <td className="px-3 py-2">{item.data.kategori}</td>
                      <td className="px-3 py-2">{item.data.stok} {item.data.satuan}</td>
                      <td className="px-3 py-2">Rp {item.data.hargaSatuan?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {validItems.length > 10 && (
                <div className="p-3 text-center text-gray-500 text-sm bg-gray-50">
                  dan {validItems.length - 10} item lainnya...
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderResultStep = () => {
    if (!importResult) return null;

    return (
      <div className="space-y-4">
        {/* Result Summary */}
        <div className="text-center py-6">
          {importResult.success > 0 ? (
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          ) : (
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          )}
          
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Import Selesai
          </h3>
          
          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
            <div className="bg-green-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-green-600">
                {importResult.success}
              </div>
              <div className="text-sm text-green-800">Berhasil</div>
            </div>
            <div className="bg-red-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-red-600">
                {importResult.failed}
              </div>
              <div className="text-sm text-red-800">Gagal</div>
            </div>
          </div>
        </div>

        {/* Errors */}
        {importResult.errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-medium text-red-900 mb-3">Error Detail:</h4>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {importResult.errors.map((error, index) => (
                <div key={index} className="text-sm text-red-700">
                  • {error}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-orange-500" />
            Import Data Inventory
          </DialogTitle>
          <DialogDescription>
            Import data bahan baku dari file CSV ke dalam sistem inventory.
          </DialogDescription>
        </DialogHeader>

        {/* Progress Indicator */}
        {isImporting && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Mengimpor data...</span>
              <span className="text-sm text-gray-500">{importProgress}%</span>
            </div>
            <Progress value={importProgress} className="h-2" />
          </div>
        )}

        {/* Step Content */}
        {currentStep === 'upload' && renderUploadStep()}
        {currentStep === 'preview' && renderPreviewStep()}
        {currentStep === 'result' && renderResultStep()}

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
          {currentStep === 'result' ? (
            <Button onClick={() => { resetState(); onClose(); }} className="w-full">
              Selesai
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={onClose} disabled={isUploading || isImporting}>
                Batal
              </Button>
              
              {currentStep === 'upload' && (
                <Button
                  onClick={handleUpload}
                  disabled={!file || isUploading}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Proses File
                    </>
                  )}
                </Button>
              )}
              
              {currentStep === 'preview' && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => { resetState(); }}
                    disabled={isImporting}
                  >
                    Upload Ulang
                  </Button>
                  <Button
                    onClick={handleImport}
                    disabled={parsedData.filter(item => item.isValid).length === 0 || isImporting}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Import {parsedData.filter(item => item.isValid).length} Item
                      </>
                    )}
                  </Button>
                </>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportDialog;