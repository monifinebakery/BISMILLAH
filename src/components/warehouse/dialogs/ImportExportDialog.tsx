import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="dialog-overlay-center">
        <div className="dialog-panel max-w-5xl flex flex-col h-full">
          <DialogHeader className="dialog-header-pad">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Upload className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold">Import Bahan Baku</DialogTitle>
                <p className="text-sm text-gray-600">Upload file Excel atau CSV</p>
              </div>
            </div>
          </DialogHeader>

          <div className="dialog-body overflow-y-auto flex-1">
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

          <DialogFooter className="dialog-footer-pad">
            <div className="flex items-center justify-between w-full">
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
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportDialog;
