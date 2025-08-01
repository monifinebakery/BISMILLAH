// src/components/recipe/components/RecipeForm/CostCalculationStep/index.tsx

import React from 'react';
import { Calculator } from 'lucide-react';
import { CostInputsCard } from './components/CostInputsCard';
import { ResultsCard } from './components/ResultsCard';
import { SummaryGrid } from './components/SummaryGrid';
import { BreakdownChart } from './components/BreakdownChart';
import { CostValidationAlert } from './components/shared/ValidationAlert';
import { useCostCalculation } from './hooks/useCostCalculation';
import { useOverheadManagement } from './hooks/useOverheadManagement';
import type { NewRecipe, RecipeFormStepProps } from '../../types';

// Import original utility function as fallback
import { calculateIngredientCost as originalCalculateIngredientCost } from '../../services/recipeUtils';

interface CostCalculationStepProps extends Omit<RecipeFormStepProps, 'onNext' | 'onPrevious'> {}

const CostCalculationStep: React.FC<CostCalculationStepProps> = ({
  data,
  errors,
  onUpdate,
  isLoading = false,
}) => {
  
  // Debug: Check data structure
  console.log('CostCalculationStep data:', data);
  console.log('Recipe ingredients:', data.bahanResep);
  
  // Try to calculate ingredient cost with original function as fallback
  let ingredientCost = 0;
  try {
    ingredientCost = originalCalculateIngredientCost(data.bahanResep);
    console.log('Original ingredient cost calculation:', ingredientCost);
  } catch (error) {
    console.error('Error calculating ingredient cost:', error);
  }

  // Main cost calculation hook
  const {
    costBreakdown,
    profitAnalysis,
    breakEvenPoint,
    validationErrors,
    totalRevenue,
    isDataValid,
  } = useCostCalculation(data);

  // Override ingredient cost if original calculation worked
  if (ingredientCost > 0) {
    costBreakdown.ingredientCost = ingredientCost;
    costBreakdown.totalProductionCost = ingredientCost + costBreakdown.laborCost + costBreakdown.overheadCost;
    costBreakdown.costPerPortion = data.jumlahPorsi > 0 ? costBreakdown.totalProductionCost / data.jumlahPorsi : 0;
    costBreakdown.costPerPiece = data.jumlahPcsPerPorsi > 0 ? costBreakdown.costPerPortion / data.jumlahPcsPerPorsi : 0;
  }

  // Overhead management for auto-calculation
  const overheadManagement = useOverheadManagement({
    ingredientCost: costBreakdown.ingredientCost,
    jumlahPorsi: data.jumlahPorsi,
    currentOverheadCost: data.biayaOverhead,
    onOverheadUpdate: (value) => onUpdate('biayaOverhead', value),
  });

  // Combine validation errors
  const allErrors = { ...errors, ...validationErrors };
  const hasValidationErrors = Object.keys(allErrors).length > 0 || !!overheadManagement.error;

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

      {/* Main Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Section - Cost Inputs */}
        <CostInputsCard
          data={data}
          errors={allErrors}
          ingredientCost={costBreakdown.ingredientCost}
          onUpdate={onUpdate}
          isLoading={isLoading}
        />

        {/* Right Section - Results */}
        <div className="space-y-6">
          <ResultsCard
            costBreakdown={costBreakdown}
            profitAnalysis={profitAnalysis}
            jumlahPorsi={data.jumlahPorsi}
            jumlahPcsPerPorsi={data.jumlahPcsPerPorsi}
            marginKeuntunganPersen={data.marginKeuntunganPersen || 0}
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
        jumlahPorsi={data.jumlahPorsi}
        marginKeuntunganPersen={data.marginKeuntunganPersen || 0}
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
          jumlahPorsi={data.jumlahPorsi}
        />
      )}

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

// Overhead Details Card Component
interface OverheadDetailsCardProps {
  overheadCalculation: any;
  jumlahPorsi: number;
}

const OverheadDetailsCard: React.FC<OverheadDetailsCardProps> = ({
  overheadCalculation,
  jumlahPorsi,
}) => {
  const { formatCurrency } = require('../utils/formatters');
  
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