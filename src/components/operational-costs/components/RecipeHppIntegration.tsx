// src/components/operational-costs/components/RecipeHppIntegration.tsx
// 🔗 Recipe HPP Integration Component (Revision 10)
// Integrates dual-mode overhead calculations with recipe forms

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
import { formatCurrency } from '@/utils/formatUtils';
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
  legacyHppResult?: {
    hppPerPcs: number;
    hargaJualPerPcs: number;
    totalHPP: number;
  };
  onEnhancedResultChange?: (result: EnhancedHPPCalculationResult | null) => void;
  onEnhancedModeChange?: (isActive: boolean) => void;
  className?: string;
}

const RecipeHppIntegration: React.FC<RecipeHppIntegrationProps> = ({
  recipeData,
  legacyHppResult,
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
    refreshAppSettings,
    compareWithLegacy
  } = useRecipeHppIntegration(recipeData);

  const [showComparison, setShowComparison] = useState(false);

  // Notify parent when enhanced result changes
  React.useEffect(() => {
    if (onEnhancedResultChange) {
      onEnhancedResultChange(isEnhancedMode ? result : null);
    }
  }, [result, isEnhancedMode, onEnhancedResultChange]);

  // Handle mode toggle
  const handleModeToggle = (enabled: boolean) => {
    setIsEnhancedMode(enabled);
    
    // Notify parent component about mode change
    if (onEnhancedModeChange) {
      onEnhancedModeChange(enabled);
    }
    
    if (enabled && !hasOverheadSettings) {
      toast.warning('Overhead belum dikonfigurasi', {
        description: 'Silakan setup overhead pabrik di menu Biaya Operasional terlebih dahulu'
      });
    }
    
    if (enabled) {
      toast.info('Mode Enhanced HPP aktif', {
        description: 'Menggunakan overhead dari kalkulator dual-mode'
      });
    } else {
      toast.info('Mode Enhanced HPP dinonaktifkan', {
        description: 'Kembali menggunakan kalkulasi HPP standar'
      });
    }
  };

  // Calculate comparison data
  const comparison = React.useMemo(() => {
    if (!result || !legacyHppResult || !showComparison) return null;
    return compareWithLegacy(legacyHppResult);
  }, [result, legacyHppResult, showComparison, compareWithLegacy]);

  return (
    <div className={`space-y-4 ${className}`}>
      
      {/* Enhanced Mode Toggle */}
      <Card className={`border-2 ${isEnhancedMode ? 'border-purple-200 bg-purple-50' : 'border-gray-200'}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-600" />
              Enhanced HPP Calculator
              {isEnhancedMode && (
                <Badge className="bg-purple-100 text-purple-800 border-purple-300">
                  Active
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-3">
              {isLoadingSettings && (
                <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />
              )}
              <Switch
                checked={isEnhancedMode}
                onCheckedChange={handleModeToggle}
                disabled={isLoadingSettings}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Mode Description */}
          <div className="text-sm text-gray-600">
            {isEnhancedMode ? (
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium text-green-700">Menggunakan overhead dari dual-mode calculator</p>
                  <p>HPP = Bahan (WAC) + TKL + Overhead Pabrik (otomatis)</p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <Calculator className="h-4 w-4 text-gray-400 mt-0.5" />
                <div>
                  <p>Mode standar: HPP = Bahan + TKL + Overhead (manual)</p>
                  <p className="text-xs text-gray-500">Aktifkan enhanced mode untuk menggunakan overhead otomatis</p>
                </div>
              </div>
            )}
          </div>

          {/* Overhead Settings Status */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Status Overhead Settings:</span>
            </div>
            <div className="flex items-center gap-2">
              {hasOverheadSettings ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-700">
                    {formatCurrency(appSettings?.overhead_per_pcs || 0)}/pcs
                  </span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <span className="text-sm text-orange-700">Belum dikonfigurasi</span>
                </>
              )}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-red-700">
                {error}
              </AlertDescription>
            </Alert>
          )}

        </CardContent>
      </Card>

      {/* Enhanced Results */}
      {isEnhancedMode && result && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <TrendingUp className="h-5 w-5" />
              Enhanced HPP Results
              {isCalculating && (
                <div className="animate-pulse">
                  <Calculator className="h-4 w-4" />
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Cost Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-3 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Bahan (WAC)</span>
                </div>
                <p className="text-lg font-bold text-blue-900">
                  {formatCurrency(result.bahanPerPcs)}
                  <span className="text-sm font-normal text-blue-600">/pcs</span>
                </p>
              </div>
              
              <div className="bg-white p-3 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-800">TKL</span>
                </div>
                <p className="text-lg font-bold text-orange-900">
                  {formatCurrency(result.tklPerPcs)}
                  <span className="text-sm font-normal text-orange-600">/pcs</span>
                </p>
              </div>
              
              <div className="bg-white p-3 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <Settings className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-800">Overhead</span>
                  <Badge variant="outline" className="text-xs">
                    {result.breakdown.overheadSource === 'app_settings' ? 'Auto' : 'Manual'}
                  </Badge>
                </div>
                <p className="text-lg font-bold text-purple-900">
                  {formatCurrency(result.overheadPerPcs)}
                  <span className="text-sm font-normal text-purple-600">/pcs</span>
                </p>
              </div>
            </div>

            <Separator />

            {/* Final Results */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg border-2 border-green-200">
                <div className="text-center">
                  <h4 className="font-semibold text-green-800 mb-2">HPP per Pcs</h4>
                  <p className="text-2xl font-bold text-green-900">
                    {formatCurrency(result.hppPerPcs)}
                  </p>
                  <p className="text-sm text-green-600 mt-1">
                    Total: {formatCurrency(result.totalHPP)}
                  </p>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg border-2 border-emerald-200">
                <div className="text-center">
                  <h4 className="font-semibold text-emerald-800 mb-2">Harga Jual per Pcs</h4>
                  <p className="text-2xl font-bold text-emerald-900">
                    {formatCurrency(result.hargaJualPerPcs)}
                  </p>
                  <p className="text-sm text-emerald-600 mt-1">
                    Profit: {formatCurrency(result.hargaJualPerPcs - result.hppPerPcs)}
                  </p>
                </div>
              </div>
            </div>

            {/* Comparison Toggle */}
            {legacyHppResult && (
              <div className="flex items-center gap-2">
                <Switch
                  checked={showComparison}
                  onCheckedChange={setShowComparison}
                />
                <Label className="text-sm text-gray-600">
                  Tampilkan perbandingan dengan metode standar
                </Label>
              </div>
            )}

          </CardContent>
        </Card>
      )}

      {/* Comparison Results */}
      {comparison && showComparison && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Info className="h-5 w-5" />
              Perbandingan Metode
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-blue-800 mb-2">Enhanced HPP</p>
                <p>HPP: {formatCurrency(result?.hppPerPcs || 0)}/pcs</p>
                <p>Harga Jual: {formatCurrency(result?.hargaJualPerPcs || 0)}/pcs</p>
                <p className="text-xs text-blue-600 mt-1">{comparison.overheadMethod}</p>
              </div>
              
              <div>
                <p className="font-medium text-gray-700 mb-2">Standar HPP</p>
                <p>HPP: {formatCurrency(legacyHppResult?.hppPerPcs || 0)}/pcs</p>
                <p>Harga Jual: {formatCurrency(legacyHppResult?.hargaJualPerPcs || 0)}/pcs</p>
                <p className="text-xs text-gray-500 mt-1">Overhead manual</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-blue-700">Selisih HPP:</span>
                <span className={`font-medium ${
                  comparison.hppDifference > 0 ? 'text-red-600' : comparison.hppDifference < 0 ? 'text-green-600' : 'text-gray-600'
                }`}>
                  {comparison.hppDifference > 0 ? '+' : ''}{formatCurrency(comparison.hppDifference)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-blue-700">Selisih Harga Jual:</span>
                <span className={`font-medium ${
                  comparison.hargaJualDifference > 0 ? 'text-green-600' : comparison.hargaJualDifference < 0 ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {comparison.hargaJualDifference > 0 ? '+' : ''}{formatCurrency(comparison.hargaJualDifference)}
                </span>
              </div>
            </div>

            <Alert className="bg-blue-100 border-blue-300">
              <Info className="h-4 w-4" />
              <AlertDescription className="text-blue-800">
                <strong>Rekomendasi:</strong> {comparison.recommendation}
              </AlertDescription>
            </Alert>

          </CardContent>
        </Card>
      )}

      {/* Setup Instructions */}
      {isEnhancedMode && !hasOverheadSettings && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-orange-800">
            <strong>Setup Required:</strong> Untuk menggunakan enhanced HPP, silakan setup overhead pabrik terlebih dahulu di menu{' '}
            <strong>Biaya Operasional → Kalkulator Dual-Mode</strong>.
          </AlertDescription>
        </Alert>
      )}

    </div>
  );
};

export default RecipeHppIntegration;