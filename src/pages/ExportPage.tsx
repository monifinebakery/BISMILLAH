// src/pages/ExportPage.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ExportPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
        <div className="max-w-5xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Export Data</h1>
              <p className="text-white/80 text-xs">Unduh data penting Anda (Excel/CSV)</p>
            </div>
          </div>
          <Button variant="outline" className="bg-white text-green-700 hover:bg-white/90" onClick={() => navigate('/menu')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Kembali
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto p-4 space-y-4">
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-green-700" /> Pilihan Export Cepat
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <Button className="justify-start gap-2 bg-green-600 hover:bg-green-700">
                <Download className="h-4 w-4" /> Export Keuangan
              </Button>
              <Button className="justify-start gap-2 bg-green-600 hover:bg-green-700">
                <Download className="h-4 w-4" /> Export Gudang
              </Button>
              <Button className="justify-start gap-2 bg-green-600 hover:bg-green-700">
                <Download className="h-4 w-4" /> Export Resep
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">Catatan: tombol export cepat ini placeholder, fungsi export lengkap akan terhubung ke data Anda.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ExportPage;
