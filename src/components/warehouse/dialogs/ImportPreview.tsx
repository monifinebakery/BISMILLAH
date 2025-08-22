import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle } from 'lucide-react';
import type { BahanBakuImport } from '../types';
import { formatDate } from '@/utils/formatUtils';

interface ImportPreviewProps {
  preview: { valid: BahanBakuImport[]; errors: string[] };
  onReset: () => void;
}

const ImportPreview: React.FC<ImportPreviewProps> = ({ preview, onReset }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Preview Import</h3>
        <Button variant="outline" size="sm" onClick={onReset}>
          Pilih File Lain
        </Button>
      </div>

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
                  
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Terakhir Diperbarui</th>
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
                      {item.updatedAt ? formatDate(item.updatedAt) : '-'}
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
  );
};

export default ImportPreview;
