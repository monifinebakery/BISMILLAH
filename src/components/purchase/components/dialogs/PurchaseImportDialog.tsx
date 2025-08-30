import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { X, Upload, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { usePurchaseImport } from '../../hooks/usePurchaseImport';
import { toast } from 'sonner';
import { UserFriendlyDate } from '@/utils/userFriendlyDate';
import { useSupplier } from '@/contexts/SupplierContext';
import { createSupplierNameResolver } from '../../utils/purchaseHelpers';

interface PurchaseImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

const PurchaseImportDialog: React.FC<PurchaseImportDialogProps> = ({ 
  isOpen, 
  onClose,
  onImportComplete
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const {
    loading,
    preview,
    setPreview,
    processFile,
    downloadTemplate,
    executeImport
  } = usePurchaseImport({ onImportComplete });
  
  // Get suppliers for name resolution
  const { suppliers } = useSupplier();
  const getSupplierName = createSupplierNameResolver(suppliers || []);

  if (!isOpen) return null;

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      processFile(droppedFile);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      processFile(selectedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent centerMode="overlay" size="md+">
        <div className="dialog-panel">
          <DialogHeader className="dialog-header-pad">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Upload className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold">Import Data Pembelian</DialogTitle>
                <p className="text-sm text-gray-600">Upload file Excel atau CSV</p>
              </div>
            </div>
          </DialogHeader>

          <div className="dialog-body overflow-y-auto">
          {!preview ? (
            <div className="space-y-6">
              <div 
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragging ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-gray-400'
                }`}
                onDrop={handleFileDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => document.getElementById('file-input')?.click()}
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {file ? file.name : 'Seret file ke sini atau klik untuk upload'}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Format yang didukung: .xlsx, .xls, .csv (maks. 10MB)
                </p>
                <Button variant="outline" size="sm">
                  Pilih File
                </Button>
                <input
                  id="file-input"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={handleFileInput}
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-900 mb-1">
                      Format File yang Dibutuhkan
                    </h4>
                    <p className="text-sm text-blue-800">
                      Pastikan file Anda memiliki kolom: Tanggal, Supplier, Nama Bahan, Jumlah, Satuan,
                      Total. Anda dapat mengunduh template di bawah ini.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        File berhasil diproses
                      </h3>
                      <p className="text-sm text-gray-600">
                        {preview.valid.length} pembelian siap diimport
                        {preview.errors.length > 0 && (
                          <span className="text-red-600 ml-2">
                            • {preview.errors.length} error ditemukan
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setPreview(null)}
                  >
                    Ganti File
                  </Button>
                </div>
              </div>

              {preview.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-900 mb-2">
                    Error ditemukan:
                  </h4>
                  <ul className="text-sm text-red-800 space-y-1">
                    {preview.errors.slice(0, 5).map((error, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span>•</span>
                        <span>{error}</span>
                      </li>
                    ))}
                    {preview.errors.length > 5 && (
                      <li className="flex items-start gap-2">
                        <span>•</span>
                        <span>+{preview.errors.length - 5} error lainnya</span>
                      </li>
                    )}
                  </ul>
                </div>
              )}

              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b">
                  <h4 className="font-medium text-gray-900">
                    Preview Data
                  </h4>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-gray-900 border-b">Tanggal</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-900 border-b">Supplier</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-900 border-b">Bahan Baku</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-900 border-b">Jumlah</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-900 border-b">Satuan</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-900 border-b">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.valid.slice(0, 10).map((purchase, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-4 py-2 border-b">
                            {UserFriendlyDate.formatToLocalString(purchase.tanggal)}
                          </td>
                          <td className="px-4 py-2 border-b truncate max-w-[120px]" title={getSupplierName(purchase.supplier)}>
                            {getSupplierName(purchase.supplier)}
                          </td>
                          <td className="px-4 py-2 border-b truncate max-w-[150px]" title={purchase.items[0]?.nama}>
                            {purchase.items[0]?.nama || '-'}
                          </td>
                          <td className="px-4 py-2 border-b">
                            {purchase.items[0]?.kuantitas || 0}
                          </td>
                          <td className="px-4 py-2 border-b">
                            {purchase.items[0]?.satuan || ''}
                          </td>
                          <td className="px-4 py-2 border-b">
                            {new Intl.NumberFormat('id-ID', {
                              style: 'currency',
                              currency: 'IDR',
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            }).format(purchase.totalNilai)}
                          </td>
                        </tr>
                      ))}
                      {preview.valid.length > 10 && (
                        <tr>
                          <td colSpan={6} className="px-4 py-2 text-center text-gray-500 text-sm">
                            Menampilkan 10 dari {preview.valid.length} data
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          </div>

          <DialogFooter className="dialog-footer-pad">
            <div className="flex items-center justify-between w-full">
              <div className="flex gap-3">
                {!preview && (
                  <Button 
                    variant="outline" 
                    onClick={downloadTemplate}
                    disabled={loading}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Template
                  </Button>
                )}
              </div>
              
              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose} disabled={loading}>
                  Batal
                </Button>
                {preview && (
                  <Button
                    onClick={async () => {
                      const success = await executeImport();
                      if (success) {
                        toast.success(`${preview.valid.length} pembelian berhasil diimport!`);
                        onClose();
                      }
                    }}
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
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseImportDialog;