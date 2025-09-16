// src/components/operational-costs/components/AutoSyncRecipeDisplay.tsx
// 🔗 Auto-Sync Recipe Display Component (Simplified Single Mode)
// Tampilkan hasil auto-sync biaya operasional tanpa mode toggles

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Calculator, 
  Zap, 
  Info, 
  TrendingUp, 
  Package,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Settings2
} from 'lucide-react';

import { useAutoSyncRecipe } from '../hooks/useAutoSyncRecipe';
import type { EnhancedHPPCalculationResult } from '../utils/enhancedHppCalculations';

interface AutoSyncRecipeDisplayProps {
  recipeData: {
    bahanResep: Array<{
      nama: string;
      jumlah: number;
      satuan: string;
      hargaSatuan: number;
      totalHarga: number;
      warehouseId?: string;
    }>;
    jumlahPorsi: number;
    jumlahPcsPerPorsi: number;
    marginKeuntunganPersen: number;
  };
  onResultChange?: (result: EnhancedHPPCalculationResult | null) => void;
  className?: string;
}

const AutoSyncRecipeDisplay: React.FC<AutoSyncRecipeDisplayProps> = ({
  recipeData,
  onResultChange,
  className = ''
}) => {
  const {
    result,
    isCalculating,
    isLoadingSettings,
    error,
    hasOperationalCosts,
    refreshCalculation,
    clearError
  } = useAutoSyncRecipe({
    ...recipeData,
    onResultChange
  });

  return (
    <div className={`space-y-4 ${className}`}>
      
      {/* Main Auto-Sync Calculator */}
      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            Auto-Sync HPP Calculator
            {hasOperationalCosts ? (
              <Badge className="bg-green-100 text-green-800 border-green-300">✅ Aktif</Badge>
            ) : (
              <Badge className="bg-gray-100 text-gray-800 border-gray-300">⚪ Siap Setup</Badge>
            )}
          </CardTitle>
          <p className="text-sm text-blue-700">
            Kalkulasi HPP otomatis menggunakan biaya operasional yang sudah dikonfigurasi
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Status Information with Refresh Button */}
          <div className="flex items-center justify-between p-3 bg-white/70 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Status:</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {hasOperationalCosts ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-semibold text-green-700">
                      Biaya operasional tersinkron
                    </span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <span className="text-sm text-orange-700">
                      Belum ada biaya operasional
                    </span>
                  </>
                )}
              </div>
              
              {/* Manual Refresh Button */}
              <button
                onClick={refreshCalculation}
                disabled={isCalculating || isLoadingSettings}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh data biaya operasional"
              >
                <RefreshCw className={`h-3 w-3 ${(isCalculating || isLoadingSettings) ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Loading State */}
          {(isCalculating || isLoadingSettings) && (
            <div className="flex items-center justify-center p-6 bg-white/50 rounded-lg">
              <div className="flex items-center gap-3 text-blue-600">
                <RefreshCw className="h-5 w-5 animate-spin" />
                <span className="text-sm font-medium">
                  {isLoadingSettings ? 'Mengecek biaya operasional...' : 'Menghitung HPP...'}
                </span>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-red-700">
                <strong>Error:</strong> {error}
                <button 
                  onClick={clearError}
                  className="ml-2 text-red-600 hover:text-red-800 underline text-sm"
                >
                  Tutup
                </button>
              </AlertDescription>
            </Alert>
          )}

        </CardContent>
      </Card>

      {/* Auto-Sync Results - Show when available */}
      {result && hasOperationalCosts && (
        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <TrendingUp className="h-5 w-5" />
              Hasil Auto-Sync HPP
              {isCalculating && (
                <div className="animate-pulse">
                  <Calculator className="h-4 w-4" />
                </div>
              )}
              <Badge className="bg-green-100 text-green-800 border-green-300">
                🔄 Otomatis
              </Badge>
            </CardTitle>
            <p className="text-sm text-green-700">
              HPP dihitung otomatis menggunakan biaya operasional terkini
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Cost Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-lg border border-blue-200 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Bahan Baku</span>
                </div>
                <p className="text-2xl font-bold text-blue-900">
                  Rp {result.bahanPerPcs.toLocaleString('id-ID')}
                  <span className="text-sm font-normal text-blue-600">/pcs</span>
                </p>
                <div className="text-xs text-blue-600 mt-2">
                  💡 Harga bahan dengan WAC (Weighted Average Cost)
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg border border-purple-200 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Settings2 className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-800">Biaya Operasional</span>
                </div>
                <p className="text-2xl font-bold text-purple-900">
                  Rp {result.overheadPerPcs.toLocaleString('id-ID')}
                  <span className="text-sm font-normal text-purple-600">/pcs</span>
                </p>
                {result.breakdown.overheadBreakdown && (
                  <div className="text-xs text-purple-600 mt-2">
                    <div>🏭 Overhead: Rp {result.breakdown.overheadBreakdown.overheadOnly.toLocaleString('id-ID')}</div>
                    <div>📋 Operasional: Rp {result.breakdown.overheadBreakdown.operasionalOnly.toLocaleString('id-ID')}</div>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Final Results */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-lg border-2 border-green-300 shadow-sm">
                <div className="text-center">
                  <h4 className="font-semibold text-green-800 mb-2 flex items-center justify-center gap-2">
                    <Calculator className="h-4 w-4" />
                    HPP per Pcs
                  </h4>
                  <p className="text-3xl font-bold text-green-900 mb-1">
                    Rp {result.hppPerPcs.toLocaleString('id-ID')}
                  </p>
                  <p className="text-sm text-green-600">
                    Total HPP: Rp {result.totalHPP.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg border-2 border-emerald-300 shadow-sm">
                <div className="text-center">
                  <h4 className="font-semibold text-emerald-800 mb-2 flex items-center justify-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Harga Jual per Pcs
                  </h4>
                  <p className="text-3xl font-bold text-emerald-900 mb-1">
                    Rp {result.hargaJualPerPcs.toLocaleString('id-ID')}
                  </p>
                  <p className="text-sm text-emerald-600">
                    Profit: Rp {(result.hargaJualPerPcs - result.hppPerPcs).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            </div>

            {/* Info Footer */}
            <div className="bg-white/70 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">Auto-Sync Status:</span>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-800">Tersinkron Otomatis</p>
                  <p className="text-xs text-gray-500">
                    Biaya operasional otomatis tersinkron dari menu Biaya Operasional
                  </p>
                </div>
              </div>
              
              {/* Debug Panel - Show in development */}
              {process.env.NODE_ENV === 'development' && result?.breakdown.overheadBreakdown && (
                <details className="mt-4 p-3 bg-gray-50 rounded border">
                  <summary className="text-xs font-medium text-gray-700 cursor-pointer hover:text-gray-900">
                    🔍 Debug Info (Dev Only)
                  </summary>
                  <div className="mt-2 text-xs text-gray-600 space-y-1">
                    <div><strong>Overhead Only:</strong> Rp {result.breakdown.overheadBreakdown.overheadOnly.toLocaleString('id-ID')}/pcs</div>
                    <div><strong>Operasional Only:</strong> Rp {result.breakdown.overheadBreakdown.operasionalOnly.toLocaleString('id-ID')}/pcs</div>
                    <div><strong>Combined Total:</strong> Rp {result.breakdown.overheadBreakdown.combined.toLocaleString('id-ID')}/pcs</div>
                    <div><strong>Method:</strong> {result.calculationMethod}</div>
                    <div><strong>Source:</strong> {result.breakdown.overheadSource}</div>
                    <div className="text-xs text-gray-500 mt-2">
                      💡 {result.breakdown.overheadBreakdown.note}
                    </div>
                  </div>
                </details>
              )}
            </div>

          </CardContent>
        </Card>
      )}

      {/* Setup Instructions - Only show if no operational costs */}
      {!hasOperationalCosts && !isLoadingSettings && (
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-blue-800">
            <strong>💡 Setup Mudah:</strong> Untuk mengaktifkan auto-sync HPP, silakan isi data biaya operasional terlebih dahulu di <strong>Menu Biaya Operasional → Kalkulator Biaya Produksi</strong>.
            <div className="mt-2 text-sm">
              ✨ Setelah setup, semua recipe akan otomatis menggunakan biaya operasional terbaru.
            </div>
          </AlertDescription>
        </Alert>
      )}

    </div>
  );
};

export default AutoSyncRecipeDisplay;