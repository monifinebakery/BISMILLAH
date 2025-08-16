// src/components/operational-costs/components/AutoModeOperationalCost.tsx

import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calculator, 
  TrendingUp, 
  Settings, 
  ChevronDown, 
  ChevronUp,
  Zap,
  Info,
  AlertCircle,
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import { formatCurrency } from '../utils/costHelpers';
import { 
  calculateSimpleAllocation, 
  getProductionSuggestions, 
  getBusinessSizeDescription,
  validateSimpleAllocation,
  SimpleAllocationData
} from '../utils/simpleAllocationHelpers';

interface AutoModeOperationalCostProps {
  totalMonthlyCosts: number;
  onAllocationChange: (perProductCost: number, monthlyProduction: number) => void;
  onAdvancedMode: () => void;
  isLoading?: boolean;
  className?: string;
}

export const AutoModeOperationalCost: React.FC<AutoModeOperationalCostProps> = ({
  totalMonthlyCosts,
  onAllocationChange,
  onAdvancedMode,
  isLoading = false,
  className = ''
}) => {
  const [allocationData, setAllocationData] = useState<SimpleAllocationData>({
    monthlyFixedCosts: totalMonthlyCosts || 8000000,
    estimatedMonthlyProduction: 3000,
    additionalCostPerProduct: 0
  });
  
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [step, setStep] = useState<'input' | 'calculate' | 'result'>('input');

  // Update monthly costs when prop changes
  useEffect(() => {
    if (totalMonthlyCosts > 0 && totalMonthlyCosts !== allocationData.monthlyFixedCosts) {
      setAllocationData(prev => ({
        ...prev,
        monthlyFixedCosts: totalMonthlyCosts
      }));
    }
  }, [totalMonthlyCosts, allocationData.monthlyFixedCosts]);

  // Calculate when both inputs are valid
  useEffect(() => {
    if (allocationData.monthlyFixedCosts > 0 && allocationData.estimatedMonthlyProduction > 0) {
      const result = calculateSimpleAllocation(
        allocationData.monthlyFixedCosts,
        allocationData.estimatedMonthlyProduction
      );
      
      if (result.isValid) {
        setAllocationData(prev => ({
          ...prev,
          additionalCostPerProduct: result.perProduct
        }));
        setStep('result');
        onAllocationChange(result.perProduct, allocationData.estimatedMonthlyProduction);
      }
    }
  }, [allocationData.monthlyFixedCosts, allocationData.estimatedMonthlyProduction, onAllocationChange]);

  const handleFixedCostsChange = useCallback((value: number) => {
    setAllocationData(prev => ({ ...prev, monthlyFixedCosts: value }));
    setStep('input');
  }, []);

  const handleProductionChange = useCallback((value: number) => {
    setAllocationData(prev => ({ ...prev, estimatedMonthlyProduction: value }));
    setStep('input');
  }, []);

  const validation = validateSimpleAllocation(allocationData);
  const businessSize = getBusinessSizeDescription(allocationData.monthlyFixedCosts);
  const productionSuggestions = getProductionSuggestions(allocationData.monthlyFixedCosts);

  return (
    <Card className={`${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Zap className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">🚀 Auto-Mode: Hitung Otomatis</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Bagi rata biaya tetap ke setiap produk
              </p>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs"
          >
            {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Conversation-style Interface */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">
              🎯 Mari hitung biaya tambahan per produk
            </span>
          </div>

          {/* Step 1: Monthly Fixed Costs */}
          <div className="space-y-3">
            <div>
              <label className="text-sm text-blue-700 mb-2 block">
                💰 Biaya tetap bulanan Anda: 
                <span className="text-xs text-blue-600 ml-2">
                  (sewa, listrik, gaji admin, marketing, dll)
                </span>
              </label>
              
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  Rp
                </span>
                <Input
                  type="number"
                  min="0"
                  value={allocationData.monthlyFixedCosts || ''}
                  onChange={(e) => handleFixedCostsChange(parseFloat(e.target.value) || 0)}
                  placeholder="8000000"
                  className="pl-8 bg-white border-blue-300 focus:border-blue-500"
                  disabled={isLoading}
                />
              </div>

              {/* Business Size Indicator */}
              {allocationData.monthlyFixedCosts > 0 && (
                <div className="mt-2">
                  <Badge 
                    variant="outline" 
                    className={`text-${businessSize.color}-700 border-${businessSize.color}-300`}
                  >
                    {businessSize.size} • {businessSize.description}
                  </Badge>
                </div>
              )}
            </div>

            {/* Step 2: Production Estimate */}
            <div>
              <label className="text-sm text-blue-700 mb-2 block">
                📦 Estimasi: berapa produk dibuat per bulan?
              </label>
              
              <div className="relative">
                <Input
                  type="number"
                  min="1"
                  value={allocationData.estimatedMonthlyProduction || ''}
                  onChange={(e) => handleProductionChange(parseFloat(e.target.value) || 0)}
                  placeholder="3000"
                  className="pr-16 bg-white border-blue-300 focus:border-blue-500"
                  disabled={isLoading}
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  produk
                </span>
              </div>

              {/* Quick suggestion buttons */}
              <div className="flex gap-1 flex-wrap items-center mt-2">
                <p className="text-xs text-blue-400 mr-2">Coba:</p>
                {productionSuggestions.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => handleProductionChange(amount)}
                    className="text-xs px-2 py-1 bg-blue-100 hover:bg-blue-200 rounded border border-blue-300 text-blue-700 hover:text-blue-800 transition-colors"
                    disabled={isLoading}
                  >
                    {amount.toLocaleString()} pcs
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Result Display */}
          {step === 'result' && validation.isValid && (
            <div className="bg-white border border-blue-300 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">✨ Hasil Perhitungan</span>
              </div>

              <div className="space-y-3">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-700 mb-2">Tambahan biaya per produk:</p>
                  <div className="text-2xl font-bold text-green-700">
                    {formatCurrency(allocationData.additionalCostPerProduct)}
                  </div>
                  <p className="text-xs text-green-600 mt-1">per produk</p>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600 leading-relaxed">
                    💡 <strong>Artinya:</strong> Setiap produk perlu "bayar" {formatCurrency(allocationData.additionalCostPerProduct)} 
                    untuk tutup biaya tetap bulanan Anda.
                  </p>
                </div>

                {/* Calculation breakdown */}
                <div className="border-t pt-3 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Biaya tetap/bulan:</span>
                    <span className="font-medium">{formatCurrency(allocationData.monthlyFixedCosts)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Target produksi/bulan:</span>
                    <span className="font-medium">{allocationData.estimatedMonthlyProduction.toLocaleString()} produk</span>
                  </div>
                  <div className="flex justify-between text-xs border-t pt-2">
                    <span className="text-gray-600">Formula:</span>
                    <span className="font-mono text-xs">
                      {formatCurrency(allocationData.monthlyFixedCosts)} ÷ {allocationData.estimatedMonthlyProduction.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    className="flex-1 text-xs h-8"
                    disabled={isLoading}
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    ✓ Gunakan perhitungan ini
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAdvanced(true)}
                    className="text-xs h-8"
                    disabled={isLoading}
                  >
                    ⚙️ Atur manual
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Warnings */}
          {validation.warnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">Perhatian</span>
              </div>
              <ul className="text-xs text-yellow-700 space-y-1">
                {validation.warnings.map((warning, index) => (
                  <li key={index}>• {warning}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Validation errors */}
          {!validation.isValid && Object.keys(validation.errors).length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-800">Error</span>
              </div>
              <ul className="text-xs text-red-700 space-y-1">
                {Object.values(validation.errors).map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Advanced Mode Toggle */}
        {showAdvanced && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium text-gray-700">Mode Lanjutan</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={onAdvancedMode}
                className="text-xs"
              >
                <Settings className="h-3 w-3 mr-1" />
                Hitung dari bahan baku (Advanced)
              </Button>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-600 mb-2">
                <strong>Mode saat ini:</strong> Bagi rata per produk (Recommended)
              </p>
              <p className="text-xs text-gray-600">
                Cocok untuk bisnis yang ingin pembagian biaya operasional yang sederhana dan mudah dipahami.
              </p>
            </div>

            <div className="mt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvanced(false)}
                className="text-xs"
              >
                Kembali ke otomatis
              </Button>
            </div>
          </div>
        )}

        {/* Context Reminder */}
        {validation.isValid && allocationData.additionalCostPerProduct > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-xs text-gray-600 flex items-center gap-2">
              <Info className="h-3 w-3" />
              💡 Dari total biaya tetap <strong>{formatCurrency(allocationData.monthlyFixedCosts)}</strong> 
              dibagi <strong>{allocationData.estimatedMonthlyProduction.toLocaleString()} produk</strong> = 
              <strong> {formatCurrency(allocationData.additionalCostPerProduct)}/produk</strong>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
