import React from 'react';
import { Target, HelpCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { OperationalCost, AppSettings } from '../types/operationalCost.types';
import { useProgressSetup } from '../hooks/useProgressSetup';

interface ProgressSetupProps {
  costs: OperationalCost[];
  appSettings: AppSettings | null;
}

const ProgressSetup: React.FC<ProgressSetupProps> = ({ costs, appSettings }) => {
  const {
    isVisible,
    isStep2Complete,
    totalCosts,
    hppCosts,
    operationalCosts,
    isSetupComplete
  } = useProgressSetup(costs, appSettings);

  if (!isVisible) {
    return null;
  }

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader className="pb-4">
        <CardTitle className="text-sm font-medium text-orange-800 flex items-center gap-2">
          <Target className="h-4 w-4" />
          Progress Setup
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  type="button"
                  className="p-1 -m-1 touch-manipulation"
                  aria-label="Info progress setup"
                >
                  <HelpCircle className="h-4 w-4 text-orange-500 hover:text-orange-700 transition-colors" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="bg-orange-50 border-orange-200 text-orange-900 max-w-xs">
                <p>Tracking progres setup sistem biaya Anda. Setelah kedua langkah selesai, sistem siap digunakan untuk kalkulasi resep.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Step 1 */}
            <div className="flex items-center gap-2">
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="p-1 -m-1 touch-manipulation"
                      aria-label="Info langkah 1"
                    >
                      <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        ✓
                      </div>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-orange-50 border-orange-200 text-orange-900 max-w-xs">
                    <p>Langkah 1 selesai: Anda sudah menambahkan biaya operasional</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <span className="text-sm font-medium text-green-800">Biaya Ditambahkan</span>
            </div>

            <div className="hidden sm:block w-8 h-1 bg-green-300 rounded"></div>
            <div className="sm:hidden h-8 w-1 bg-green-300 rounded self-center"></div>

            {/* Step 2 */}
            <div className="flex items-center gap-2">
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="p-1 -m-1 touch-manipulation"
                      aria-label="Info langkah 2"
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        isStep2Complete
                          ? 'bg-green-600 text-white' 
                          : 'bg-orange-600 text-white'
                      }`}>
                        {isStep2Complete ? '✓' : '2'}
                      </div>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-orange-50 border-orange-200 text-orange-900 max-w-xs">
                    <p>{isStep2Complete
                      ? 'Langkah 2 selesai: Kalkulasi biaya per produk sudah dilakukan' 
                      : 'Langkah 2: Lakukan kalkulasi biaya per produk di tab "Kalkulator Dual-Mode"'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <span className={`text-sm font-medium ${
                isStep2Complete
                  ? 'text-green-800' 
                  : 'text-orange-800'
              }`}>
                Kalkulasi Selesai
              </span>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="p-1 -m-1 touch-manipulation"
                    aria-label="Info ringkasan biaya"
                  >
                    <div className="text-xs text-orange-600">
                      {totalCosts} biaya • {hppCosts} HPP + {operationalCosts} Operasional
                    </div>
                  </button>
                </TooltipTrigger>
                <TooltipContent className="bg-orange-50 border-orange-200 text-orange-900 max-w-xs">
                  <p>Total biaya yang sudah ditambahkan dan diklasifikasi ke grup HPP atau Operasional</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {isStep2Complete && (
              <div className="text-xs text-green-600 font-medium">
                Siap digunakan di resep! 🎉
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProgressSetup;