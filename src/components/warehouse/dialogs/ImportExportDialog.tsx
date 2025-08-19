import React from 'react';
import { Button } from '@/components/ui/button';
import { X, Upload } from 'lucide-react';
import ImportControls from './ImportControls';
import ImportPreview from './ImportPreview';
import { useImportExport } from '../hooks';
import type { BahanBakuImport } from '../types';

interface ImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: BahanBakuImport[]) => Promise<boolean>;
}

const ImportDialog: React.FC<ImportDialogProps> = ({ isOpen, onClose, onImport }) => {
  const {
    loading,
    preview,
    setPreview,
    processFile,
    downloadTemplate,
    downloadCSVTemplate,
    executeImport
  } = useImportExport({ onImport });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg border w-full max-w-5xl max-h-[90vh] overflow-hidden">
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

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {!preview ? (
            <ImportControls
              loading={loading}
              onFile={processFile}
              downloadTemplate={downloadTemplate}
              downloadCSVTemplate={downloadCSVTemplate}
            />
          ) : (
            <ImportPreview preview={preview} onReset={() => setPreview(null)} />
          )}
        </div>

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
                onClick={async () => {
                  const success = await executeImport();
                  if (success) onClose();
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
      </div>
    </div>
  );
};

export default ImportDialog;
