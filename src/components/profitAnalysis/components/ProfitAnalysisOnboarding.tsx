import React from 'react';
import { Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProfitAnalysisOnboardingProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProfitAnalysisOnboarding: React.FC<ProfitAnalysisOnboardingProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Info className="h-8 w-8 text-orange-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Selamat Datang! 👋</h2>
            <p className="text-gray-600">
              Ikuti panduan singkat ini untuk memahami dashboard untung rugi
            </p>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
              <div>
                <p className="font-medium text-blue-800">Lengkapi Data</p>
                <p className="text-sm text-blue-600">Masukkan pemasukan, HPP, dan biaya operasional</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
              <div>
                <p className="font-medium text-green-800">Analisis Hasil</p>
                <p className="text-sm text-green-600">Lihat ringkasan dan grafik tren performa bisnis</p>
              </div>
            </div>
          </div>

          <Button onClick={onClose} className="w-full">
            Mulai Analisis
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProfitAnalysisOnboarding;
