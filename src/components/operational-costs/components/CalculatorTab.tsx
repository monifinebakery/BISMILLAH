import React from 'react';
import { Calculator, AlertTriangle, HelpCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { OperationalCost, AppSettings } from '../types/operationalCost.types';

interface CalculatorTabProps {
  costs: OperationalCost[];
  appSettings: AppSettings | null;
  onCalculationComplete: (hppResult: any, operasionalResult: any) => void;
  onSwitchToManagementTab: () => void;
}

const CalculatorTab: React.FC<CalculatorTabProps> = ({
  costs,
  appSettings,
  onCalculationComplete,
  onSwitchToManagementTab,
}) => {
  return (
    <div className="space-y-6">
      {/* No costs warning */}
      {costs.length === 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="font-medium text-orange-800">Belum ada data biaya</p>
                <p className="text-sm text-orange-700">Tambahkan biaya operasional dulu di tab "Kelola Biaya"</p>
              </div>
                  <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={onSwitchToManagementTab}
                      size="sm"
                      className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 min-w-fit"
                    >
                      <span className="whitespace-nowrap">Ke Tab Kelola Biaya</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-orange-50 border-orange-200 text-orange-900 max-w-xs">
                    <p>Klik untuk beralih ke tab Kelola Biaya dan mulai menambahkan biaya operasional</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Seamless Calculation Info Card */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <CheckCircle className="h-5 w-5" />
            Kalkulasi Otomatis Seamless
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    type="button"
                    className="p-1 -m-1 touch-manipulation"
                    aria-label="Info kalkulasi otomatis"
                  >
                    <HelpCircle className="h-4 w-4 text-green-500 hover:text-green-700 transition-colors" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="bg-green-50 border-green-200 text-green-900 max-w-xs">
                  <p>Sistem sekarang otomatis menghitung biaya produksi dan operasional tanpa perlu setup manual yang rumit.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-green-700 space-y-2">
            <p>✅ <strong>Sistem telah disederhanakan untuk UMKM:</strong></p>
            <ul className="ml-4 space-y-1">
              <li>• Kalkulasi biaya produksi dilakukan otomatis di background</li>
              <li>• Biaya produksi langsung terintegrasi dengan perhitungan HPP resep</li>
              <li>• Tidak perlu setup manual yang rumit</li>
              <li>• Fokus pada input biaya, sistem mengurus sisanya</li>
            </ul>
            
            <div className="mt-4 p-3 bg-white rounded border border-green-200">
              <p className="text-sm">
                💡 <strong>Data biaya tersedia:</strong> {costs.length} item biaya aktif
                ({costs.filter(c => c.group === 'hpp').length} Biaya Produksi + {costs.filter(c => c.group === 'operasional').length} Operasional)
              </p>
              <p className="text-xs text-green-600 mt-2">
                Lihat hasil perhitungan real-time di header orange di atas ↑
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CalculatorTab;