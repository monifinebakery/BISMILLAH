import React from 'react';
import { Calculator, Info, Zap } from 'lucide-react';
import { logger } from '@/utils/logger';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Enhanced HPP Integration (Primary Method)
import RecipeHppIntegration from '@/components/operational-costs/components/RecipeHppIntegration';
import type { EnhancedHPPCalculationResult } from '@/components/operational-costs/utils/enhancedHppCalculations';

// Types
import type { NewRecipe, RecipeFormStepProps } from '../../../types';

interface CostCalculationStepProps extends Omit<RecipeFormStepProps, 'onNext' | 'onPrevious'> {
  onEnhancedHppModeChange?: (isActive: boolean) => void;
}

const CostCalculationStep: React.FC<CostCalculationStepProps> = ({
  data,
  errors,
  onUpdate,
  isLoading = false,
  onEnhancedHppModeChange,
}) => {
  
  // Enhanced HPP state (always enabled)
  const [enhancedHppResult, setEnhancedHppResult] = React.useState<EnhancedHPPCalculationResult | null>(null);
  const [isEnhancedMode, setIsEnhancedMode] = React.useState(true); // Default to enhanced mode

  // Handle enhanced HPP result updates
  const handleEnhancedHppChange = React.useCallback((result: EnhancedHPPCalculationResult | null) => {
    setEnhancedHppResult(result);
    
    if (result) {
      // Update form data with enhanced results
      onUpdate('totalHpp', result.totalHPP);
      onUpdate('hppPerPorsi', result.hppPerPorsi);
      onUpdate('hppPerPcs', result.hppPerPcs);
      onUpdate('hargaJualPorsi', result.hargaJualPerPorsi);
      onUpdate('hargaJualPerPcs', result.hargaJualPerPcs);
      onUpdate('biayaTenagaKerja', result.tklPerPcs * (data.jumlahPorsi || 1) * (data.jumlahPcsPerPorsi || 1));
      onUpdate('biayaOverhead', result.overheadPerPcs * (data.jumlahPorsi || 1) * (data.jumlahPcsPerPorsi || 1));
    }
  }, [onUpdate, data.jumlahPorsi, data.jumlahPcsPerPorsi]);

  // Handle enhanced HPP mode changes
  const handleEnhancedHppModeChange = React.useCallback((isActive: boolean) => {
    setIsEnhancedMode(isActive);
    if (onEnhancedHppModeChange) {
      onEnhancedHppModeChange(isActive);
    }
  }, [onEnhancedHppModeChange]);

  // Prepare recipe data for enhanced HPP integration
  const recipeDataForHpp = React.useMemo(() => ({
    bahanResep: data.bahanResep || [],
    jumlahPorsi: data.jumlahPorsi || 1,
    jumlahPcsPerPorsi: data.jumlahPcsPerPorsi || 1,
    biayaTenagaKerja: data.biayaTenagaKerja || 0,
    biayaOverhead: data.biayaOverhead || 0,
    marginKeuntunganPersen: data.marginKeuntunganPersen || 0,
  }), [data]);

  return (
    <div className="space-y-6">
      
      {/* Step Header */}
      <div className="text-center pb-4">
        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
          <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 text-overflow-safe">
          Kalkulasi HPP Otomatis
        </h2>
        <p className="text-sm sm:text-base text-gray-600 text-overflow-safe">
          Sistem akan menghitung HPP dan harga jual secara otomatis menggunakan overhead dari biaya operasional
        </p>
      </div>

      {/* Enhanced HPP Information */}
      <Alert className="border-green-200 bg-green-50">
        <Zap className="h-4 w-4" />
        <AlertDescription className="text-green-800">
          <strong>🎯 HPP Otomatis Aktif:</strong> Sistem menggunakan overhead yang sudah dihitung dari{' '}
          <strong>Biaya Operasional → Dual-Mode Calculator</strong>. HPP akan dihitung berdasarkan:{' '}
          <strong>Bahan + TKL + Overhead Otomatis</strong>.
        </AlertDescription>
      </Alert>

      {/* Main Enhanced HPP Calculator */}
      <RecipeHppIntegration
        recipeData={recipeDataForHpp}
        onEnhancedResultChange={handleEnhancedHppChange}
        onEnhancedModeChange={handleEnhancedHppModeChange}
        className=""
      />

      {/* Results Summary */}
      {enhancedHppResult && isEnhancedMode && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calculator className="h-5 w-5 text-green-600" />
            Hasil Kalkulasi HPP
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
              <p className="text-xs sm:text-sm text-blue-600 font-medium text-overflow-safe">HPP per Pcs</p>
              <p className="text-lg sm:text-xl font-bold text-blue-900 text-overflow-safe">
                Rp {enhancedHppResult.hppPerPcs.toLocaleString('id-ID')}
              </p>
            </div>
            
            <div className="bg-purple-50 p-3 sm:p-4 rounded-lg">
              <p className="text-xs sm:text-sm text-purple-600 font-medium text-overflow-safe">HPP per Porsi</p>
              <p className="text-lg sm:text-xl font-bold text-purple-900 text-overflow-safe">
                Rp {enhancedHppResult.hppPerPorsi.toLocaleString('id-ID')}
              </p>
            </div>
            
            <div className="bg-green-50 p-3 sm:p-4 rounded-lg">
              <p className="text-xs sm:text-sm text-green-600 font-medium text-overflow-safe">Harga Jual per Pcs</p>
              <p className="text-lg sm:text-xl font-bold text-green-900 text-overflow-safe">
                Rp {enhancedHppResult.hargaJualPerPcs.toLocaleString('id-ID')}
              </p>
            </div>
            
            <div className="bg-orange-50 p-3 sm:p-4 rounded-lg">
              <p className="text-xs sm:text-sm text-orange-600 font-medium text-overflow-safe">Total HPP</p>
              <p className="text-lg sm:text-xl font-bold text-orange-900 text-overflow-safe">
                Rp {enhancedHppResult.totalHPP.toLocaleString('id-ID')}
              </p>
            </div>
          </div>
          
          {/* Breakdown Details */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h4 className="text-md font-medium text-gray-700 mb-3">Rincian Biaya per Pcs:</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Bahan:</span>
                <span className="font-medium">Rp {enhancedHppResult.bahanPerPcs.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">TKL:</span>
                <span className="font-medium">Rp {enhancedHppResult.tklPerPcs.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Overhead:</span>
                <span className="font-medium">Rp {enhancedHppResult.overheadPerPcs.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600">
              💡 <strong>Metode:</strong> {enhancedHppResult.calculationMethod === 'enhanced_dual_mode' ? 'Enhanced Dual-Mode' : 'Legacy'} •{' '}
              <strong>Overhead:</strong> {enhancedHppResult.breakdown.overheadSource === 'app_settings' ? 'Otomatis dari Biaya Operasional' : 'Input Manual'}
            </p>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Spacer */}
      <div className="h-20 sm:h-0" aria-hidden="true"></div>
    </div>
  );
};

export default CostCalculationStep;