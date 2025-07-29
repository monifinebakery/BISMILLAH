// 🎯 Bahan Baku Import Dialog - Versi Ringkas
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { X, Upload, FileText, AlertCircle, CheckCircle, Download } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface BahanBaku {
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
}

interface ImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: BahanBaku[]) => Promise<boolean>;
}

const BahanBakuImportDialog: React.FC<ImportDialogProps> = ({
  isOpen,
  onClose,
  onImport
}) => {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<{ valid: BahanBaku[]; errors: string[] } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Header mapping
  const headerMap: Record<string, string> = {
    'nama_bahan_baku': 'nama_bahan_baku', 'nama bahan baku': 'nama_bahan_baku', 'nama': 'nama_bahan_baku',
    'kategori': 'kategori', 'category': 'kategori',
    'supplier': 'supplier', 'pemasok': 'supplier',
    'satuan': 'satuan', 'unit': 'satuan',
    'tanggal_kadaluarsa': 'tanggal_kadaluarsa', 'kadaluarsa': 'tanggal_kadaluarsa', 'expiry': 'tanggal_kadaluarsa',
    'stok_saat_ini': 'stok_saat_ini', 'stok': 'stok_saat_ini', 'stock': 'stok_saat_ini',
    'minimum_stok': 'minimum_stok', 'minimum': 'minimum_stok', 'min_stock': 'minimum_stok',
    'jumlah_beli_kemasan': 'jumlah_beli_kemasan', 'qty_kemasan': 'jumlah_beli_kemasan',
    'satuan_kemasan': 'satuan_kemasan', 'kemasan': 'satuan_kemasan',
    'harga_total_beli_kemasan': 'harga_total_beli_kemasan', 'harga_total': 'harga_total_beli_kemasan'
  };

  const requiredFields = ['nama_bahan_baku', 'kategori', 'supplier', 'satuan', 'stok_saat_ini', 'minimum_stok', 'jumlah_beli_kemasan', 'satuan_kemasan', 'harga_total_beli_kemasan'];

  // Validate data
  const validate = (data: any): string[] => {
    const errors: string[] = [];
    if (!data.nama_bahan_baku?.trim()) errors.push('Nama bahan baku kosong');
    if (!data.kategori?.trim()) errors.push('Kategori kosong');
    if (!data.supplier?.trim()) errors.push('Supplier kosong');
    if (!data.satuan?.trim()) errors.push('Satuan kosong');
    if (!data.satuan_kemasan?.trim()) errors.push('Satuan kemasan kosong');
    if (isNaN(data.stok_saat_ini) || data.stok_saat_ini < 0) errors.push('Stok tidak valid');
    if (isNaN(data.minimum_stok) || data.minimum_stok < 0) errors.push('Minimum stok tidak valid');
    if (isNaN(data.jumlah_beli_kemasan) || data.jumlah_beli_kemasan <= 0) errors.push('Jumlah kemasan tidak valid');
    if (isNaN(data.harga_total_beli_kemasan) || data.harga_total_beli_kemasan <= 0) errors.push('Harga total tidak valid');
    return errors;
  };

  // Process file
  const processFile = (file: File) => {
    if (!file.name.match(/\.(csv|xlsx|xls)$/i)) {
      toast.error('Format file tidak didukung');
      return;
    }

    setLoading(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        let jsonData: any[] = [];

        if (file.name.endsWith('.csv')) {
          const text = e.target?.result as string;
          const lines = text.split('\n').filter(l => l.trim());
          if (lines.length < 2) throw new Error('File kosong');
          
          const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
          jsonData = lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.replace(/"/g, '').trim());
            const row: any = {};
            headers.forEach((h, i) => row[h] = values[i] || '');
            return row;
          });
        } else {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const wb = XLSX.read(data, { type: 'array' });
          const ws = wb.Sheets[wb.SheetNames[0]];
          jsonData = XLSX.utils.sheet_to_json(ws);
        }

        // Map headers
        const mapped = jsonData.map((row, i) => {
          const newRow: any = {};
          Object.keys(row).forEach(key => {
            const mappedKey = headerMap[key.toLowerCase().trim()];
            if (mappedKey) {
              let value = row[key];
              if (['stok_saat_ini', 'minimum_stok', 'jumlah_beli_kemasan', 'harga_total_beli_kemasan'].includes(mappedKey)) {
                value = parseFloat(String(value).replace(/[,\s]/g, '')) || 0;
              }
              newRow[mappedKey] = value;
            }
          });
          return { ...newRow, rowIndex: i + 2 };
        });

        // Validate
        const valid: BahanBaku[] = [];
        const errors: string[] = [];

        mapped.forEach(row => {
          const fieldErrors = validate(row);
          if (fieldErrors.length === 0) {
            const { rowIndex, ...cleanRow } = row;
            valid.push(cleanRow);
          } else {
            errors.push(`Baris ${row.rowIndex}: ${fieldErrors.join(', ')}`);
          }
        });

        // Check required columns
        const missingCols = requiredFields.filter(field => 
          !Object.values(headerMap).includes(field) || 
          !Object.keys(jsonData[0] || {}).some(key => headerMap[key.toLowerCase().trim()] === field)
        );
        
        if (missingCols.length > 0) {
          errors.unshift(`Kolom wajib tidak ditemukan: ${missingCols.join(', ')}`);
        }

        setPreview({ valid, errors });
        
      } catch (error) {
        toast.error(`Error: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    if (file.name.endsWith('.csv')) {
      reader.readAsText(file, 'UTF-8');
    } else {
      reader.readAsArrayBuffer(file);
    }
  };

  // Download template
  const downloadTemplate = () => {
    const template = [
      {
        nama_bahan_baku: 'Tepung Terigu',
        kategori: 'Bahan Dasar',
        supplier: 'PT Supplier A',
        satuan: 'gram',
        tanggal_kadaluarsa: '2024-12-31',
        stok_saat_ini: 5000,
        minimum_stok: 1000,
        jumlah_beli_kemasan: 2,
        satuan_kemasan: 'kg',
        harga_total_beli_kemasan: 150000
      },
      {
        nama_bahan_baku: 'Gula Pasir',
        kategori: 'Pemanis',
        supplier: 'PT Supplier B',
        satuan: 'gram',
        tanggal_kadaluarsa: '2024-11-30',
        stok_saat_ini: 3000,
        minimum_stok: 500,
        jumlah_beli_kemasan: 1,
        satuan_kemasan: 'kg',
        harga_total_beli_kemasan: 18000
      }
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(template);
    ws['!cols'] = Array(10).fill({ wch: 18 });
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, `template_bahan_baku_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Template berhasil di-download');
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
    } catch (error) {
      toast.error('Gagal mengimpor data');
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
                  <Button variant="outline" onClick={downloadTemplate}>
                    <Download className="w-4 h-4 mr-2" />
                    Template
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

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Format yang Didukung</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Excel (.xlsx, .xls) atau CSV (.csv) • Maksimal 10MB
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Preview */
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Preview Import</h3>
                <Button variant="outline" size="sm" onClick={() => setPreview(null)}>
                  Pilih File Lain
                </Button>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
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
              </div>

              {/* Errors */}
              {preview.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-900 mb-2">Error ({preview.errors.length})</h4>
                  <div className="max-h-32 overflow-y-auto text-sm text-red-700 space-y-1">
                    {preview.errors.slice(0, 10).map((error, i) => (
                      <div key={i}>• {error}</div>
                    ))}
                    {preview.errors.length > 10 && <div className="italic">... dan {preview.errors.length - 10} error lainnya</div>}
                  </div>
                </div>
              )}

              {/* Preview Table */}
              {preview.valid.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Data Valid (5 pertama)</h4>
                  <div className="overflow-x-auto border rounded-lg">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-gray-500">Nama</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-500">Kategori</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-500">Supplier</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-500">Stok</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-500">Harga</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {preview.valid.slice(0, 5).map((item, i) => (
                          <tr key={i}>
                            <td className="px-3 py-2 font-medium">{item.nama_bahan_baku}</td>
                            <td className="px-3 py-2 text-gray-600">{item.kategori}</td>
                            <td className="px-3 py-2 text-gray-600">{item.supplier}</td>
                            <td className="px-3 py-2 text-gray-600">{item.stok_saat_ini} {item.satuan}</td>
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
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            {preview && `Siap import ${preview.valid.length} bahan baku`}
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
                {loading ? 'Mengimpor...' : `Import ${preview.valid.length} Data`}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BahanBakuImportDialog;