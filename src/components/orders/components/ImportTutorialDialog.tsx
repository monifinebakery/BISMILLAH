import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface ImportTutorialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownloadTemplate: () => void;
}

const ImportTutorialDialog: React.FC<ImportTutorialDialogProps> = ({
  open,
  onOpenChange,
  onDownloadTemplate,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-orange-600" />
            Cara Import Pesanan dari CSV
          </DialogTitle>
          <DialogDescription>
            Panduan lengkap untuk import data pesanan dengan mudah
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step 1 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                1
              </div>
              <h3 className="font-semibold">Download Template CSV</h3>
            </div>
            <div className="ml-8 space-y-2">
              <p className="text-sm text-gray-600">
                Download template CSV yang sudah berisi contoh data dan format yang benar.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={onDownloadTemplate}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download Template
              </Button>
            </div>
          </div>

          <Separator />

          {/* Step 2 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                2
              </div>
              <h3 className="font-semibold">Isi Data Pesanan</h3>
            </div>
            <div className="ml-8 space-y-3">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Kolom Wajib:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <div><strong>pelanggan</strong> - Nama pelanggan</div>
                  <div><strong>tanggal</strong> - Format: 2025-01-01</div>
                  <div><strong>nama</strong> - Nama produk</div>
                  <div><strong>kuantitas</strong> - Jumlah (angka)</div>
                  <div><strong>satuan</strong> - porsi, pcs, gelas, dll</div>
                  <div><strong>harga</strong> - Harga per item</div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2 text-blue-800">Kolom Opsional (Pricing Per Pcs):</h4>
                <div className="space-y-2 text-sm text-blue-700">
                  <div><strong>pricing_mode</strong> - Isi "per_portion" atau "per_piece"</div>
                  <div><strong>price_per_portion</strong> - Harga per porsi (jika mode per_portion)</div>
                  <div><strong>price_per_piece</strong> - Harga per pcs (jika mode per_piece)</div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Step 3 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                3
              </div>
              <h3 className="font-semibold">Upload File CSV</h3>
            </div>
            <div className="ml-8 space-y-2">
              <p className="text-sm text-gray-600">
                Setelah selesai isi data, save file sebagai CSV dan klik tombol "Upload CSV".
              </p>
              <div className="flex items-start gap-2 text-sm text-green-700 bg-green-50 p-3 rounded-lg">
                <CheckCircle2 className="h-4 w-4 mt-0.5" />
                <div>
                  Data akan otomatis ter-import dan muncul di daftar pesanan tanpa perlu refresh!
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Tips */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              Tips Penting
            </h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex gap-2">
                <span className="text-amber-500">•</span>
                <span>Gunakan format tanggal YYYY-MM-DD (contoh: 2025-01-01)</span>
              </div>
              <div className="flex gap-2">
                <span className="text-amber-500">•</span>
                <span>Pemisah kolom bisa koma (,) atau titik koma (;)</span>
              </div>
              <div className="flex gap-2">
                <span className="text-amber-500">•</span>
                <span>Kosongkan kolom opsional jika tidak digunakan</span>
              </div>
              <div className="flex gap-2">
                <span className="text-amber-500">•</span>
                <span>Pesanan dengan pelanggan & tanggal sama akan digabung otomatis</span>
              </div>
            </div>
          </div>

          {/* Example */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h4 className="font-medium text-orange-800 mb-2">Contoh Data CSV:</h4>
            <div className="bg-white p-3 rounded border font-mono text-xs overflow-x-auto">
              <div>pelanggan;tanggal;nama;kuantitas;satuan;harga</div>
              <div>PT Contoh;2025-01-01;Nasi Gudeg;10;porsi;50000</div>
              <div>Toko ABC;2025-01-02;Kerupuk;20;pcs;2500</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportTutorialDialog;
