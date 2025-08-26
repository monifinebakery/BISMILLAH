import React from 'react';
import { Calculator, AlertTriangle, HelpCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { OperationalCost, AppSettings } from '../types/operationalCost.types';
import DualModeCalculator from './DualModeCalculator';

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
                      className="bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      Ke Tab Kelola Biaya
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
      
      {/* Calculator Guide Card */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <Calculator className="h-5 w-5" />
            Kalkulator Dual-Mode
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    type="button"
                    className="p-1 -m-1 touch-manipulation"
                    aria-label="Info kalkulator dual-mode"
                  >
                    <HelpCircle className="h-4 w-4 text-orange-500 hover:text-orange-700 transition-colors" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="bg-orange-50 border-orange-200 text-orange-900 max-w-xs">
                  <p>Kalkulator ini menghitung biaya per produk dari dua grup terpisah: HPP (masuk resep) dan Operasional (untuk markup harga jual).</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-orange-700 space-y-2">
            <p>🧮 <strong>Hitung biaya per produk dari daftar biaya yang sudah Anda kelola:</strong></p>
            <ul className="ml-4 space-y-1">
              <li>• Set target produksi bulanan</li>
              <li>• Hitung overhead HPP per produk (masuk ke resep)</li>
              <li>• Hitung biaya operasional per produk (untuk markup)</li>
              <li>• Simpan hasil untuk digunakan otomatis di resep</li>
            </ul>
            
            <div className="mt-4 p-3 bg-white rounded border border-orange-200">
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      type="button"
                      className="p-1 -m-1 touch-manipulation w-full text-left"
                      aria-label="Info data biaya"
                    >
                      <p className="text-sm">
                        💡 <strong>Data biaya:</strong> {costs.length} item biaya siap dihitung
                        ({costs.filter(c => c.group === 'hpp').length} HPP + {costs.filter(c => c.group === 'operasional').length} Operasional)
                      </p>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-orange-50 border-orange-200 text-orange-900 max-w-xs">
                    <p>Menampilkan total biaya yang siap untuk dikalkulasi berdasarkan klasifikasi grup</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <DualModeCalculator
        costs={costs}
        currentSettings={appSettings}
        onCalculationComplete={onCalculationComplete}
      />
    </div>
  );
};

export default CalculatorTab;