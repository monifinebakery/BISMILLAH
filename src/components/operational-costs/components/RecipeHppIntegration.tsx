// src/components/operational-costs/components/RecipeHppIntegration.tsx
// 🔗 Recipe HPP Integration Component (Revision 10)
// Integrates dual-mode overhead calculations with recipe forms

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Calculator, 
  Zap, 
  Settings, 
  Info, 
  TrendingUp, 
  Package,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

// Hooks
import { useRecipeHppIntegration } from '../hooks/useEnhancedHppCalculation';

// Types
import type { EnhancedHPPCalculationResult } from '../utils/enhancedHppCalculations';

interface RecipeHppIntegrationProps {
  recipeData: {
    bahanResep: any[];
    jumlahPorsi: number;
    jumlahPcsPerPorsi: number;
    biayaTenagaKerja: number;
    biayaOverhead: number;
    marginKeuntunganPersen: number;
  };
  onEnhancedResultChange?: (result: EnhancedHPPCalculationResult | null) => void;
  onEnhancedModeChange?: (isActive: boolean) => void;
  className?: string;
}

const RecipeHppIntegration: React.FC<RecipeHppIntegrationProps> = ({
  recipeData,
  onEnhancedResultChange,
  onEnhancedModeChange,
  className = ''
}) => {
  const {
    result,
    appSettings,
    isCalculating,
    isLoadingSettings,
    error,
    isEnhancedMode,
    setIsEnhancedMode,
    hasOverheadSettings,
  } = useRecipeHppIntegration(recipeData);

  // Notify parent when enhanced result changes (always notify since enhanced mode is default)
  React.useEffect(() => {
    if (onEnhancedResultChange) {
      onEnhancedResultChange(result);
    }
  }, [result]); // Removed onEnhancedResultChange to prevent infinite re-renders

  // Notify parent about mode changes
  React.useEffect(() => {
    if (onEnhancedModeChange) {
      onEnhancedModeChange(isEnhancedMode);
    }
  }, [isEnhancedMode]); // Removed onEnhancedModeChange to prevent infinite re-renders

  return (
    <div className={`space-y-4 ${className}`}>
      
      {/* Main Enhanced HPP Calculator */}
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5 text-purple-600" />
            Smart HPP Calculator
            <Badge className="bg-purple-100 text-purple-800 border-purple-300">
              🤖 AI Powered
            </Badge>
          </CardTitle>
          <p className="text-sm text-purple-700">
            Kalkulasi HPP otomatis menggunakan overhead yang sudah dihitung dari biaya operasional
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Status Information */}
          <div className="flex items-center justify-between p-3 bg-white/70 rounded-lg border border-purple-200">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-800">Status Overhead:</span>
            </div>
            <div className="flex items-center gap-2">
              {hasOverheadSettings ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-semibold text-green-700">
                    Rp {appSettings?.overhead_per_pcs?.toLocaleString('id-ID') || 0}/pcs
                  </span>
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                    Siap
                  </Badge>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <span className="text-sm text-orange-700">Perlu Setup</span>
                </>
              )}
            </div>
          </div>

          {/* Loading State */}
          {(isCalculating || isLoadingSettings) && (
            <div className="flex items-center justify-center p-6 bg-white/50 rounded-lg">
              <div className="flex items-center gap-3 text-purple-600">
                <RefreshCw className="h-5 w-5 animate-spin" />
                <span className="text-sm font-medium">
                  {isLoadingSettings ? 'Memuat pengaturan...' : 'Menghitung HPP...'}
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
              </AlertDescription>
            </Alert>
          )}

        </CardContent>
      </Card>

      {/* Enhanced Results - Always show when available */}
      {result && (
        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <TrendingUp className="h-5 w-5" />
              Hasil Kalkulasi HPP
              {isCalculating && (
                <div className="animate-pulse">
                  <Calculator className="h-4 w-4" />
                </div>
              )}
              <Badge className="bg-green-100 text-green-800 border-green-300">
                {result.breakdown.overheadSource === 'app_settings' ? '🤖 Auto' : '✏️ Manual'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Cost Breakdown - Simplified for UMKM */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-lg border border-blue-200 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Bahan (WAC)</span>
                </div>
                <p className="text-2xl font-bold text-blue-900">
                  Rp {result.bahanPerPcs.toLocaleString('id-ID')}
                  <span className="text-sm font-normal text-blue-600">/pcs</span>
                </p>
                <div className="text-xs text-blue-600 mt-2">
                  💡 Biaya bahan baku dengan harga rata-rata (WAC)
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg border border-purple-200 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Settings className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-800">
                    Biaya Produksi (Overhead)
                  </span>
                </div>
                <p className="text-2xl font-bold text-purple-900">
                  Rp {result.overheadPerPcs.toLocaleString('id-ID')}
                  <span className="text-sm font-normal text-purple-600">/pcs</span>
                </p>
                {result.breakdown.overheadBreakdown && (
                  <div className="text-xs text-purple-600 mt-2">
                    <div>💡 Overhead: Rp {result.breakdown.overheadBreakdown.overheadOnly.toLocaleString('id-ID')}</div>
                    <div>📋 Operasional: Rp {result.breakdown.overheadBreakdown.operasionalOnly.toLocaleString('id-ID')} (terpisah)</div>
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

            {/* Method Information */}
            <div className="bg-white/70 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">Metode Kalkulasi:</span>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-800">
                    {result.calculationMethod === 'enhanced_dual_mode' ? 'Enhanced Dual-Mode' : 'Standard'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {result.breakdown.overheadSource === 'app_settings' ? 'Biaya produksi otomatis dari biaya operasional' : 'Biaya produksi input manual'}
                  </p>
                </div>
              </div>
            </div>

          </CardContent>
        </Card>
      )}"
      {/* Setup Instructions - Only show if overhead not configured */}
      {!hasOverheadSettings && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-orange-800">
            <strong>🚀 Setup Diperlukan:</strong> Untuk kalkulasi HPP otomatis, silakan setup biaya produksi (overhead) terlebih dahulu:{' '}
            <strong>Menu Biaya Operasional → Kalkulator Dual-Mode</strong>.
            <div className="mt-2 text-sm">
              💡 Setelah setup selesai, sistem akan otomatis menghitung biaya produksi berdasarkan biaya operasional aktual.
            </div>
          </AlertDescription>
        </Alert>
      )}

    </div>
  );
};

export default RecipeHppIntegration;