// src/components/recipe/components/RecipeForm/CostCalculationStep/index.tsx - FIXED

import React from 'react';
import { Calculator, Info } from 'lucide-react';
import { logger } from '@/utils/logger';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Component imports
import { CostInputsCard } from './components/CostInputsCard';
import { ResultsCard } from './components/ResultsCard';
import { SummaryGrid } from './components/SummaryGrid';
import { BreakdownChart } from './components/BreakdownChart';
import { CostValidationAlert } from './components/shared/ValidationAlert';

// Hook imports
import { useCostCalculation } from './hooks/useCostCalculation';
import { useOverheadManagement } from './hooks/useOverheadManagement';

// Utility imports
import { calculateIngredientCost } from './utils/calculations';
import { formatCurrency } from './utils/formatters';

// Enhanced HPP Integration
import RecipeHppIntegration from '@/components/operational-costs/components/RecipeHppIntegration';
import type { EnhancedHPPCalculationResult } from '@/components/operational-costs/utils/enhancedHppCalculations';

// Types
import type { NewRecipe, RecipeFormStepProps } from '../../../types';
import type { CostCalculationData } from './utils/types';

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
  
  // Enhanced HPP state
  const [enhancedHppResult, setEnhancedHppResult] = React.useState<EnhancedHPPCalculationResult | null>(null);
  
  // 🔧 FIX: Transform NewRecipe data to CostCalculationData format
  const costCalculationData: CostCalculationData = {
    bahanResep: data.bahanResep || [],
    jumlahPorsi: data.jumlahPorsi || 1,
    jumlahPcsPerPorsi: data.jumlahPcsPerPorsi || 1,
    biayaTenagaKerja: data.biayaTenagaKerja || 0,
    biayaOverhead: data.biayaOverhead || 0,
    marginKeuntunganPersen: data.marginKeuntunganPersen || 0, // 🎯 KEY FIX!
  };

  // 🐛 DEBUG: Log the transformation
  logger.debug('CostCalculationStep data transformation', {
    originalData: data,
    transformedData: costCalculationData,
    marginKeuntunganPersen: {
      original: data.marginKeuntunganPersen,
      transformed: costCalculationData.marginKeuntunganPersen,
      type: typeof costCalculationData.marginKeuntunganPersen
    }
  });

  // Calculate ingredient cost with enhanced function
  const ingredientCost = calculateIngredientCost(costCalculationData.bahanResep);
  logger.debug('Calculated ingredient cost', { ingredientCost });

  // 🔧 FIX: Main cost calculation hook with correct data format
  const {
    costBreakdown,
    profitAnalysis,
    breakEvenPoint,
    validationErrors,
    totalRevenue,
    isDataValid,
  } = useCostCalculation(costCalculationData); // ✅ Use transformed data

  // Override ingredient cost with our enhanced calculation
  costBreakdown.ingredientCost = ingredientCost;
  costBreakdown.totalProductionCost = ingredientCost + costBreakdown.laborCost + costBreakdown.overheadCost;
  costBreakdown.costPerPortion = costCalculationData.jumlahPorsi > 0 ? costBreakdown.totalProductionCost / costCalculationData.jumlahPorsi : 0;
  costBreakdown.costPerPiece = costCalculationData.jumlahPcsPerPorsi > 0 ? costBreakdown.costPerPortion / costCalculationData.jumlahPcsPerPorsi : 0;

  // Overhead management for auto-calculation
  const overheadManagement = useOverheadManagement({
    ingredientCost: costBreakdown.ingredientCost,
    jumlahPorsi: costCalculationData.jumlahPorsi,
    currentOverheadCost: costCalculationData.biayaOverhead,
    onOverheadUpdate: (value) => onUpdate('biayaOverhead', value),
  });

  // Combine validation errors
  const allErrors = { ...errors, ...validationErrors };
  const hasValidationErrors = Object.keys(allErrors).length > 0 || !!overheadManagement.error;

  // Handle enhanced HPP result updates
  const handleEnhancedHppChange = React.useCallback((result: EnhancedHPPCalculationResult | null) => {
    setEnhancedHppResult(result);
    
    if (result) {
      // Update form data with enhanced results - using proper field names from NewRecipe
      onUpdate('totalHpp', result.totalHPP);
      onUpdate('hppPerPorsi', result.hppPerPorsi);
      onUpdate('hppPerPcs', result.hppPerPcs);
      onUpdate('hargaJualPorsi', result.hargaJualPerPorsi);
      onUpdate('hargaJualPerPcs', result.hargaJualPerPcs);
      onUpdate('biayaOverhead', result.overheadPerPcs * costCalculationData.jumlahPorsi * costCalculationData.jumlahPcsPerPorsi);
    }
  }, [onUpdate, costCalculationData.jumlahPorsi, costCalculationData.jumlahPcsPerPorsi]);

  // Handle enhanced HPP mode changes
  const handleEnhancedHppModeChange = React.useCallback((isActive: boolean) => {
    if (onEnhancedHppModeChange) {
      onEnhancedHppModeChange(isActive);
    }
  }, [onEnhancedHppModeChange]);

  // Prepare recipe data for enhanced HPP integration
  const recipeDataForHpp = React.useMemo(() => ({
    bahanResep: costCalculationData.bahanResep,
    jumlahPorsi: costCalculationData.jumlahPorsi,
    jumlahPcsPerPorsi: costCalculationData.jumlahPcsPerPorsi,
    biayaTenagaKerja: costCalculationData.biayaTenagaKerja || 0,
    biayaOverhead: costCalculationData.biayaOverhead || 0,
    marginKeuntunganPersen: costCalculationData.marginKeuntunganPersen || 0,
  }), [costCalculationData]);

  // Legacy HPP result for comparison
  const legacyHppResult = React.useMemo(() => ({
    hppPerPcs: costBreakdown.costPerPiece,
    hargaJualPerPcs: profitAnalysis.sellingPricePerPiece,
    totalHPP: costBreakdown.totalProductionCost,
  }), [costBreakdown, profitAnalysis]);

  // 🐛 FINAL DEBUG LOG
  logger.debug('CostCalculationStep final values', {
    costBreakdown,
    profitAnalysis,
    marginAmount: profitAnalysis.marginAmount,
    isMarginZero: profitAnalysis.marginAmount === 0,
    marginKeuntunganPersen: costCalculationData.marginKeuntunganPersen,
    enhancedHppResult
  });

  return (
    <div className="space-y-6">
      
      {/* Step Header */}
      <div className="text-center pb-4">
        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Calculator className="w-8 h-8 text-purple-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Kalkulasi HPP & Harga Jual
        </h2>
        <p className="text-gray-600">
          Tentukan biaya produksi dan margin keuntungan untuk resep Anda
        </p>
      </div>

      {/* Enhanced HPP Feature Alert */}
      <Alert className="border-blue-200 bg-blue-50">
        <Info className="h-4 w-4" />
        <AlertDescription className="text-blue-800">
          <strong>🚀 Fitur Baru:</strong> Sekarang Anda dapat menggunakan overhead otomatis dari menu{' '}
          <strong>Biaya Operasional</strong>. Aktifkan toggle di bawah untuk menggunakan overhead yang sudah dihitung{' '}
          berdasarkan dual-mode calculator.
        </AlertDescription>
      </Alert>



      {/* Main Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Section - Cost Inputs */}
        <CostInputsCard
          data={costCalculationData}
          errors={allErrors}
          ingredientCost={costBreakdown.ingredientCost}
          onUpdate={(field: string, value: any) => {
            // Map CostCalculationData fields to NewRecipe fields
            const fieldMap: Record<string, keyof NewRecipe> = {
              'biayaTenagaKerja': 'biayaTenagaKerja',
              'biayaOverhead': 'biayaOverhead',
              'marginKeuntunganPersen': 'marginKeuntunganPersen'
            };
            const mappedField = fieldMap[field] || field as keyof NewRecipe;
            onUpdate(mappedField, value);
          }}
          isLoading={isLoading}
        />

        {/* Right Section - Results */}
        <div className="space-y-6">
          <ResultsCard
            costBreakdown={costBreakdown}
            profitAnalysis={profitAnalysis}
            jumlahPorsi={costCalculationData.jumlahPorsi}
            jumlahPcsPerPorsi={costCalculationData.jumlahPcsPerPorsi}
            marginKeuntunganPersen={costCalculationData.marginKeuntunganPersen || 0}
            isUsingAutoOverhead={overheadManagement.isUsingAutoOverhead}
            overheadCalculation={overheadManagement.overheadCalculation}
          />
        </div>
      </div>

      {/* Summary Section */}
      <SummaryGrid
        costBreakdown={costBreakdown}
        profitAnalysis={profitAnalysis}
        breakEvenPoint={breakEvenPoint}
        totalRevenue={totalRevenue}
        jumlahPorsi={costCalculationData.jumlahPorsi}
        jumlahPcsPerPorsi={costCalculationData.jumlahPcsPerPorsi}
        marginKeuntunganPersen={costCalculationData.marginKeuntunganPersen || 0}
      />

      {/* Cost Breakdown Chart */}
      <BreakdownChart
        costBreakdown={costBreakdown}
        isUsingAutoOverhead={overheadManagement.isUsingAutoOverhead}
      />

      {/* Overhead Details (if using auto-calculation) */}
      {overheadManagement.isUsingAutoOverhead && overheadManagement.overheadCalculation && (
        <OverheadDetailsCard
          overheadCalculation={overheadManagement.overheadCalculation}
          jumlahPorsi={costCalculationData.jumlahPorsi}
        />
      )}

      {/* Enhanced HPP Integration */}
      <RecipeHppIntegration
        recipeData={recipeDataForHpp}
        legacyHppResult={legacyHppResult}
        onEnhancedResultChange={handleEnhancedHppChange}
        onEnhancedModeChange={handleEnhancedHppModeChange}
        className="mt-6"
      />

      {/* Validation Errors */}
      {hasValidationErrors && (
        <CostValidationAlert
          validationErrors={allErrors}
          overheadError={overheadManagement.error}
        />
      )}

      {/* Mobile Bottom Navigation Spacer */}
      <div className="h-20 sm:h-0" aria-hidden="true"></div>
    </div>
  );
};

// Overhead Details Card Component (existing logic)
interface OverheadDetailsCardProps {
  overheadCalculation: any;
  jumlahPorsi: number;
}

const OverheadDetailsCard: React.FC<OverheadDetailsCardProps> = ({
  overheadCalculation,
  jumlahPorsi,
}) => {
  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
          <Calculator className="w-4 h-4 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-green-900">
          Detail Kalkulasi Overhead Otomatis
        </h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-green-700">Total Biaya Operasional:</span>
            <span className="font-medium text-green-900">
              {formatCurrency(overheadCalculation.total_costs)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-green-700">Metode Alokasi:</span>
            <span className="font-medium text-green-900">
              {overheadCalculation.metode === 'per_unit' ? 'Per Unit' : 'Persentase'}
            </span>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-green-700">Overhead per Unit:</span>
            <span className="font-bold text-green-900">
              {formatCurrency(overheadCalculation.overhead_per_unit)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-green-700">Untuk {jumlahPorsi} porsi:</span>
            <span className="font-bold text-green-900">
              {formatCurrency(overheadCalculation.overhead_per_unit * jumlahPorsi)}
            </span>
          </div>
        </div>
      </div>
      
      <div className="mt-4 p-3 bg-white rounded-lg border border-green-200">
        <p className="text-xs text-green-600">
          💡 Nilai overhead dihitung otomatis berdasarkan biaya operasional aktif dan pengaturan alokasi.
        </p>
      </div>
    </div>
  );
};

export default CostCalculationStep;