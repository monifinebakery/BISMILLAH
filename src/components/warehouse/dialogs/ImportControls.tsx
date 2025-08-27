import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, FileText, AlertCircle, Download } from 'lucide-react';

interface ImportControlsProps {
  loading: boolean;
  onFile: (file: File) => void;
  downloadTemplate: () => Promise<void>;
  downloadCSVTemplate: () => void;
}

const ImportControls: React.FC<ImportControlsProps> = ({
  loading,
  onFile,
  downloadTemplate,
  downloadCSVTemplate,
}) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDrag = (e: React.DragEvent, over: boolean) => {
    e.preventDefault();
    setDragOver(over);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  };

  return (
    <div className="space-y-6">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragOver ? 'border-green-400 bg-green-50' : 'border-gray-500'
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
          <Button variant="outline" onClick={downloadTemplate} disabled={loading}>
            <Download className="w-4 h-4 mr-2" />
            {loading ? 'Membuat...' : 'Template Excel'}
          </Button>
          <Button variant="outline" onClick={downloadCSVTemplate} disabled={loading}>
            <Download className="w-4 h-4 mr-2" />
            {loading ? 'Membuat...' : 'Template CSV'}
          </Button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
          className="hidden"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-3">
            <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Format yang Didukung</h4>
              <div className="text-sm text-blue-700 mt-1 space-y-1">
                <div>• <strong>CSV:</strong> Langsung diproses, sangat cepat</div>
                <div>• <strong>Excel:</strong> .xlsx, .xls (butuh loading ~2-3 detik)</div>
                <div>• <strong>Delimiter:</strong> Koma (,) atau semicolon (;)</div>
                <div>• <strong>Ukuran maksimal:</strong> 10MB</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-900">Tips Penting</h4>
              <div className="text-sm text-yellow-700 mt-1 space-y-1">
                <div>• Gunakan template untuk hasil terbaik</div>
                <div>• Pastikan semua kolom wajib terisi</div>
                <div>• Format tanggal: YYYY-MM-DD</div>
                <div>• Angka jangan pakai titik/koma pemisah</div>
                <div>• <strong>CSV:</strong> Gunakan semicolon (;) jika Excel Indonesia</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-500 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Kolom yang Diperlukan</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
          <div><span className="font-medium">nama</span> - Nama bahan baku</div>
          <div><span className="font-medium">kategori</span> - Kategori produk</div>
          <div><span className="font-medium">supplier</span> - Nama supplier</div>
          <div><span className="font-medium">satuan</span> - Satuan dasar</div>
          <div><span className="font-medium">stok</span> - Stok saat ini</div>
          <div><span className="font-medium">minimum</span> - Stok minimum</div>
          <div><span className="font-medium">expiry</span> - Tanggal kadaluarsa (opsional)</div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Sistem mendukung berbagai variasi nama kolom (Indonesia/Inggris)
        </p>
      </div>
    </div>
  );
};

export default ImportControls;
