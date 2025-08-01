// src/components/recipe/components/RecipeForm/CostCalculationStep.tsx

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calculator,
  DollarSign,
  TrendingUp,
  Users,
  Wrench,
  Building,
  Target,
  BarChart3,
  Info,
  AlertCircle,
  RefreshCw,
  Zap,
  Settings
} from 'lucide-react';
import { formatCurrency, formatPercentage, calculateIngredientCost } from '../../services/recipeUtils';
import type { NewRecipe, RecipeFormStepProps } from '../../types';

// ✅ Import Operational Cost Hook
import { useOperationalCost } from '@/components/operational-costs/context/OperationalCostContext';

interface CostCalculationStepProps extends Omit<RecipeFormStepProps, 'onNext' | 'onPrevious'> {}

const CostCalculationStep: React.FC<CostCalculationStepProps> = ({
  data,
  errors,
  onUpdate,
  isLoading = false,
}) => {
  // ✅ Access Operational Cost Context
  const { 
    state: { 
      overheadCalculation, 
      loading: overheadLoading, 
      error: overheadError,
      isAuthenticated 
    },
    actions: { calculateOverhead, setError: clearOverheadError }
  } = useOperationalCost();

  // Local state for overhead management
  const [isUsingAutoOverhead, setIsUsingAutoOverhead] = useState(true);
  const [lastCalculatedOverhead, setLastCalculatedOverhead] = useState<number>(0);
  const [isMobile, setIsMobile] = useState(false);

  // ✅ Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Calculate costs
  const ingredientCost = calculateIngredientCost(data.bahanResep);
  const totalProductionCost = ingredientCost + (data.biayaTenagaKerja || 0) + (data.biayaOverhead || 0);
  const costPerPortion = data.jumlahPorsi > 0 ? totalProductionCost / data.jumlahPorsi : 0;
  const costPerPiece = data.jumlahPcsPerPorsi > 0 ? costPerPortion / data.jumlahPcsPerPorsi : 0;
  
  // Calculate margins
  const marginAmount = totalProductionCost * (data.marginKeuntunganPersen || 0) / 100;
  const sellingPricePerPortion = costPerPortion + (marginAmount / data.jumlahPorsi);
  const sellingPricePerPiece = costPerPiece + (marginAmount / data.jumlahPorsi / (data.jumlahPcsPerPorsi || 1));
  
  // Profitability analysis
  const profitPerPortion = sellingPricePerPortion - costPerPortion;
  const profitPerPiece = sellingPricePerPiece - costPerPiece;
  const profitabilityLevel = (data.marginKeuntunganPersen || 0) >= 30 ? 'high' : 
                           (data.marginKeuntunganPersen || 0) >= 15 ? 'medium' : 'low';

  // ✅ Auto-calculate overhead when ingredients change
  useEffect(() => {
    if (isUsingAutoOverhead && isAuthenticated && ingredientCost > 0) {
      // Calculate overhead based on material cost
      calculateOverhead(ingredientCost);
    }
  }, [ingredientCost, isUsingAutoOverhead, isAuthenticated, calculateOverhead]);

  // ✅ Auto-populate overhead when calculation completes
  useEffect(() => {
    if (isUsingAutoOverhead && overheadCalculation?.overhead_per_unit) {
      const overheadPerUnit = overheadCalculation.overhead_per_unit;
      const totalOverheadForBatch = overheadPerUnit * (data.jumlahPorsi || 1);
      
      // Only update if different from current value
      if (Math.abs(totalOverheadForBatch - (data.biayaOverhead || 0)) > 0.01) {
        setLastCalculatedOverhead(overheadPerUnit);
        onUpdate('biayaOverhead', totalOverheadForBatch);
      }
    }
  }, [overheadCalculation, isUsingAutoOverhead, data.jumlahPorsi, data.biayaOverhead, onUpdate]);

  // Handle manual overhead toggle
  const handleOverheadModeToggle = () => {
    if (isUsingAutoOverhead) {
      // Switching to manual mode
      setIsUsingAutoOverhead(false);
    } else {
      // Switching to auto mode
      setIsUsingAutoOverhead(true);
      if (overheadCalculation?.overhead_per_unit) {
        const totalOverheadForBatch = overheadCalculation.overhead_per_unit * (data.jumlahPorsi || 1);
        onUpdate('biayaOverhead', totalOverheadForBatch);
      }
    }
  };

  // Handle manual refresh of overhead calculation
  const handleRefreshOverhead = async () => {
    if (isAuthenticated) {
      await calculateOverhead(ingredientCost);
    }
  };

  const getProfitabilityColor = () => {
    switch (profitabilityLevel) {
      case 'high': return 'text-green-700 bg-green-100 border-green-300';
      case 'medium': return 'text-yellow-700 bg-yellow-100 border-yellow-300';
      case 'low': return 'text-red-700 bg-red-100 border-red-300';
      default: return 'text-gray-700 bg-gray-100 border-gray-300';
    }
  };

  // ✅ Responsive Tooltip Component
  const ResponsiveTooltip: React.FC<{
    children: React.ReactNode;
    content: React.ReactNode;
    className?: string;
  }> = ({ children, content, className = "" }) => {
    const [showTooltip, setShowTooltip] = useState(false);

    if (isMobile) {
      return (
        <div className="relative group">
          <div 
            onClick={() => setShowTooltip(!showTooltip)}
            className={`cursor-pointer ${className}`}
          >
            {children}
          </div>
          {showTooltip && (
            <>
              {/* Overlay */}
              <div 
                className="fixed inset-0 bg-black bg-opacity-20 z-40"
                onClick={() => setShowTooltip(false)}
              />
              {/* Mobile Tooltip */}
              <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 max-w-xs w-11/12">
                <div className="bg-gray-900 text-white text-sm rounded-lg p-4 shadow-xl border border-gray-700">
                  {content}
                  <button
                    onClick={() => setShowTooltip(false)}
                    className="mt-3 w-full bg-gray-800 text-gray-200 py-2 px-3 rounded text-xs hover:bg-gray-700 transition-colors"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      );
    }

    // Desktop tooltip
    return (
      <div className="group relative">
        <div className={className}>
          {children}
        </div>
        <div className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-50">
          <div className="bg-gray-900 text-white text-sm rounded-lg py-3 px-4 shadow-xl border border-gray-700 max-w-xs">
            {content}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2">
              <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        </div>
      </div>
    );
  };

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

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Column - Cost Inputs */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Material Cost Summary */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-blue-600" />
                Biaya Bahan Baku
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-blue-700">Total Biaya Bahan:</span>
                  <Badge className="bg-blue-100 text-blue-900 border-blue-300">
                    {formatCurrency(ingredientCost)}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-700">Biaya per Porsi:</span>
                  <Badge variant="outline" className="text-blue-700 border-blue-300">
                    {formatCurrency(data.jumlahPorsi > 0 ? ingredientCost / data.jumlahPorsi : 0)}
                  </Badge>
                </div>
                <div className="text-sm text-blue-600 bg-blue-100 p-2 rounded">
                  {data.bahanResep.length} bahan telah dihitung otomatis
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Costs */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Biaya Tambahan</CardTitle>
              <p className="text-sm text-gray-600">
                Masukkan biaya produksi selain bahan baku
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Labor Cost */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  Biaya Tenaga Kerja
                  <ResponsiveTooltip
                    content={
                      <div className="space-y-2">
                        <p className="font-semibold text-yellow-300">💼 Biaya Tenaga Kerja:</p>
                        <p className="leading-relaxed">Gaji staf produksi (koki, staf dapur) yang terlibat langsung dalam membuat produk makanan/minuman.</p>
                        
                        <div className="border-t border-gray-700 pt-2">
                          <p className="text-red-300">❌ Bukan termasuk:</p>
                          <p className="text-gray-300 text-xs ml-4">• Gaji admin, kasir, marketing</p>
                          <p className="text-gray-300 text-xs ml-4">• Staff non-produksi lainnya</p>
                        </div>
                        
                        <div className="border-t border-gray-700 pt-2">
                          <p className="text-green-300">✅ Yang dihitung:</p>
                          <p className="text-gray-300 text-xs ml-4">• Staf yang ikut proses produksi</p>
                          <p className="text-gray-300 text-xs ml-4">• Untuk periode batch ini saja</p>
                        </div>
                        
                        <div className="border-t border-gray-700 pt-2">
                          <p className="font-medium text-blue-300">📊 Formula:</p>
                          <p className="text-xs bg-gray-800 p-2 rounded mt-1 font-mono">
                            (Total Gaji Bulanan Staf Produksi) ÷<br/>
                            (Total Porsi Diproduksi per Bulan)
                          </p>
                        </div>
                      </div>
                    }
                  >
                    <Info className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help" />
                  </ResponsiveTooltip>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    Rp
                  </span>
                  <Input
                    type="number"
                    min="0"
                    value={data.biayaTenagaKerja || ''}
                    onChange={(e) => onUpdate('biayaTenagaKerja', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className={`pl-8 ${errors.biayaTenagaKerja ? 'border-red-300 focus:border-red-500' : ''}`}
                    disabled={isLoading}
                  />
                </div>
                {errors.biayaTenagaKerja && (
                  <p className="text-sm text-red-600">{errors.biayaTenagaKerja}</p>
                )}
                <p className="text-xs text-gray-500">
                  Upah pekerja untuk membuat {data.jumlahPorsi} porsi
                </p>
              </div>

              {/* ✅ Enhanced Overhead Cost with Auto-Calculate */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Building className="h-4 w-4 text-gray-500" />
                    Biaya Overhead
                  </Label>
                  
                  {/* Auto/Manual Toggle */}
                  <div className="flex items-center gap-2">
                    {isAuthenticated && (
                      <>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleRefreshOverhead}
                          disabled={overheadLoading}
                          className="text-xs h-6 px-2"
                        >
                          <RefreshCw className={`h-3 w-3 mr-1 ${overheadLoading ? 'animate-spin' : ''}`} />
                          Refresh
                        </Button>
                        <Button
                          type="button"
                          variant={isUsingAutoOverhead ? "default" : "outline"}
                          size="sm"
                          onClick={handleOverheadModeToggle}
                          className="text-xs h-6 px-2"
                        >
                          {isUsingAutoOverhead ? (
                            <>
                              <Zap className="h-3 w-3 mr-1" />
                              Auto
                            </>
                          ) : (
                            <>
                              <Settings className="h-3 w-3 mr-1" />
                              Manual
                            </>
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Overhead Calculation Info */}
                {isUsingAutoOverhead && overheadCalculation && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Auto-calculated from Operational Costs</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-green-600">Overhead per Unit:</span>
                        <p className="font-semibold text-green-900">
                          {formatCurrency(overheadCalculation.overhead_per_unit)}
                        </p>
                      </div>
                      <div>
                        <span className="text-green-600">Total untuk {data.jumlahPorsi} porsi:</span>
                        <p className="font-semibold text-green-900">
                          {formatCurrency(overheadCalculation.overhead_per_unit * (data.jumlahPorsi || 1))}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Overhead Input */}
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    Rp
                  </span>
                  <Input
                    type="number"
                    min="0"
                    value={data.biayaOverhead || ''}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      onUpdate('biayaOverhead', value);
                      // Switch to manual mode if user edits
                      if (isUsingAutoOverhead && value !== (overheadCalculation?.overhead_per_unit || 0) * (data.jumlahPorsi || 1)) {
                        setIsUsingAutoOverhead(false);
                      }
                    }}
                    placeholder="0"
                    className={`pl-8 ${errors.biayaOverhead ? 'border-red-300 focus:border-red-500' : ''} ${
                      isUsingAutoOverhead ? 'bg-green-50 border-green-200' : ''
                    }`}
                    disabled={isLoading}
                  />
                </div>

                {errors.biayaOverhead && (
                  <p className="text-sm text-red-600">{errors.biayaOverhead}</p>
                )}

                {/* Error/Warning Messages */}
                {overheadError && (
                  <div className="bg-red-50 border border-red-200 rounded p-2">
                    <p className="text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {overheadError}
                    </p>
                  </div>
                )}

                {!isAuthenticated && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                    <p className="text-xs text-yellow-700">
                      Login untuk menggunakan auto-calculate overhead dari biaya operasional
                    </p>
                  </div>
                )}

                <p className="text-xs text-gray-500">
                  {isUsingAutoOverhead 
                    ? `Dihitung dari biaya operasional per unit × ${data.jumlahPorsi} porsi`
                    : "Listrik, gas, sewa tempat, dll. untuk batch ini"
                  }
                </p>
              </div>

              {/* Profit Margin */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-gray-500" />
                  Margin Keuntungan (%)
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    max="1000"
                    step="0.1"
                    value={data.marginKeuntunganPersen || ''}
                    onChange={(e) => onUpdate('marginKeuntunganPersen', parseFloat(e.target.value) || 0)}
                    placeholder="25"
                    className={`pr-8 ${errors.marginKeuntunganPersen ? 'border-red-300 focus:border-red-500' : ''}`}
                    disabled={isLoading}
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    %
                  </span>
                </div>
                {errors.marginKeuntunganPersen && (
                  <p className="text-sm text-red-600">{errors.marginKeuntunganPersen}</p>
                )}
                <p className="text-xs text-gray-500">
                  Persentase keuntungan yang diinginkan dari total biaya produksi
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Results */}
        <div className="space-y-6">
          
          {/* HPP Summary */}
          <Card className="border-purple-200 bg-purple-50">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-600" />
                Hasil Kalkulasi HPP
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Total Production Cost */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-purple-700">Biaya Bahan:</span>
                  <span className="font-medium text-purple-900">
                    {formatCurrency(ingredientCost)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-purple-700">Biaya Tenaga Kerja:</span>
                  <span className="font-medium text-purple-900">
                    {formatCurrency(data.biayaTenagaKerja || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-purple-700 flex items-center gap-1">
                    Biaya Overhead:
                    {isUsingAutoOverhead && (
                      <Zap className="h-3 w-3 text-green-600" title="Auto-calculated" />
                    )}
                  </span>
                  <span className="font-medium text-purple-900">
                    {formatCurrency(data.biayaOverhead || 0)}
                  </span>
                </div>
                <div className="border-t border-purple-200 pt-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-purple-800">Total HPP:</span>
                    <Badge className="bg-purple-200 text-purple-900 border-purple-300">
                      {formatCurrency(totalProductionCost)}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Per Unit Costs */}
              <div className="bg-white rounded-lg p-3 border border-purple-200">
                <h4 className="font-medium text-purple-900 mb-2">HPP per Unit</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Per Porsi:</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(costPerPortion)}
                    </span>
                  </div>
                  {data.jumlahPcsPerPorsi > 1 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Per Pcs:</span>
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(costPerPiece)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Selling Price */}
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-600" />
                Harga Jual Rekomendasi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Margin Amount */}
              <div className="bg-white rounded-lg p-3 border border-green-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-green-700">Margin Keuntungan:</span>
                  <Badge className="bg-green-200 text-green-900 border-green-300">
                    {formatCurrency(marginAmount)}
                  </Badge>
                </div>
                <div className="text-xs text-green-600">
                  {formatPercentage(data.marginKeuntunganPersen || 0)} dari total HPP
                </div>
              </div>

              {/* Selling Prices */}
              <div className="space-y-3">
                <div className="bg-white rounded-lg p-3 border border-green-200">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-green-800">Harga Jual per Porsi:</span>
                  </div>
                  <div className="text-xl font-bold text-green-900">
                    {formatCurrency(sellingPricePerPortion)}
                  </div>
                  <div className="text-xs text-green-600">
                    Keuntungan: {formatCurrency(profitPerPortion)}
                  </div>
                </div>

                {data.jumlahPcsPerPorsi > 1 && (
                  <div className="bg-white rounded-lg p-3 border border-green-200">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-green-800">Harga Jual per Pcs:</span>
                    </div>
                    <div className="text-xl font-bold text-green-900">
                      {formatCurrency(sellingPricePerPiece)}
                    </div>
                    <div className="text-xs text-green-600">
                      Keuntungan: {formatCurrency(profitPerPiece)}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Profitability Assessment */}
          <Card className={`border-2 ${
            profitabilityLevel === 'high' ? 'border-green-300 bg-green-50' :
            profitabilityLevel === 'medium' ? 'border-yellow-300 bg-yellow-50' :
            'border-red-300 bg-red-50'
          }`}>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className={`h-5 w-5 ${
                  profitabilityLevel === 'high' ? 'text-green-600' :
                  profitabilityLevel === 'medium' ? 'text-yellow-600' :
                  'text-red-600'
                }`} />
                Analisis Profitabilitas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-4">
                <Badge className={`text-lg px-4 py-2 ${getProfitabilityColor()}`}>
                  {profitabilityLevel === 'high' ? 'Sangat Menguntungkan' :
                   profitabilityLevel === 'medium' ? 'Cukup Menguntungkan' :
                   'Perlu Peningkatan'}
                </Badge>
                <p className="text-sm mt-2 text-gray-600">
                  Margin {formatPercentage(data.marginKeuntunganPersen || 0)}
                </p>
              </div>

              {/* Recommendations */}
              <div className={`p-3 rounded-lg border ${
                profitabilityLevel === 'high' ? 'bg-green-100 border-green-200' :
                profitabilityLevel === 'medium' ? 'bg-yellow-100 border-yellow-200' :
                'bg-red-100 border-red-200'
              }`}>
                <h4 className={`font-medium mb-2 ${
                  profitabilityLevel === 'high' ? 'text-green-900' :
                  profitabilityLevel === 'medium' ? 'text-yellow-900' :
                  'text-red-900'
                }`}>
                  Rekomendasi:
                </h4>
                <ul className={`text-sm space-y-1 ${
                  profitabilityLevel === 'high' ? 'text-green-800' :
                  profitabilityLevel === 'medium' ? 'text-yellow-800' :
                  'text-red-800'
                }`}>
                  {profitabilityLevel === 'high' ? (
                    <>
                      <li>• Margin sangat baik untuk sustainability</li>
                      <li>• Pertimbangkan untuk ekspansi produksi</li>
                      <li>• Monitor kompetitor untuk positioning</li>
                    </>
                  ) : profitabilityLevel === 'medium' ? (
                    <>
                      <li>• Cari cara untuk efisiensi biaya bahan</li>
                      <li>• Pertimbangkan optimasi proses produksi</li>
                      <li>• Evaluasi harga jual di pasar</li>
                    </>
                  ) : (
                    <>
                      <li>• Tingkatkan margin minimal ke 15%</li>
                      <li>• Review harga supplier dan bahan alternatif</li>
                      <li>• Pertimbangkan menaikkan harga jual</li>
                    </>
                  )}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Calculation Summary */}
      <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Info className="h-5 w-5 text-gray-600" />
            Ringkasan Kalkulasi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Total Investment */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-blue-600 font-medium">TOTAL INVESTASI</p>
                  <p className="text-lg font-bold text-blue-900">
                    {formatCurrency(totalProductionCost)}
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Untuk {data.jumlahPorsi} porsi
              </p>
            </div>

            {/* Revenue Potential */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-green-600 font-medium">POTENSI REVENUE</p>
                  <p className="text-lg font-bold text-green-900">
                    {formatCurrency(sellingPricePerPortion * data.jumlahPorsi)}
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Jika semua terjual
              </p>
            </div>

            {/* Total Profit */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Target className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-purple-600 font-medium">TOTAL PROFIT</p>
                  <p className="text-lg font-bold text-purple-900">
                    {formatCurrency(marginAmount)}
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                {formatPercentage(data.marginKeuntunganPersen || 0)} margin
              </p>
            </div>

            {/* Break Even Point */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-orange-600 font-medium">BREAK EVEN</p>
                  <p className="text-lg font-bold text-orange-900">
                    {Math.ceil(totalProductionCost / (profitPerPortion || 1))} porsi
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Untuk balik modal
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ✅ RESPONSIVE Cost Breakdown Chart */}
      {totalProductionCost > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Breakdown Biaya Produksi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              
              {/* Visual Cost Distribution */}
              <div className="flex h-4 sm:h-6 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-500 transition-all duration-500 hover:bg-blue-600"
                  style={{ 
                    width: `${(ingredientCost / totalProductionCost) * 100}%` 
                  }}
                  title={`Bahan Baku: ${formatCurrency(ingredientCost)}`}
                />
                <div 
                  className="bg-green-500 transition-all duration-500 hover:bg-green-600"
                  style={{ 
                    width: `${((data.biayaTenagaKerja || 0) / totalProductionCost) * 100}%` 
                  }}
                  title={`Tenaga Kerja: ${formatCurrency(data.biayaTenagaKerja || 0)}`}
                />
                <div 
                  className="bg-purple-500 transition-all duration-500 hover:bg-purple-600"
                  style={{ 
                    width: `${((data.biayaOverhead || 0) / totalProductionCost) * 100}%` 
                  }}
                  title={`Overhead: ${formatCurrency(data.biayaOverhead || 0)}`}
                />
              </div>

              {/* ✅ RESPONSIVE Legend */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-sm">
                <div className="flex items-center gap-2 p-2 sm:p-0">
                  <div className="w-4 h-4 bg-blue-500 rounded-full flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900">Bahan Baku</p>
                    <p className="text-gray-600 text-xs sm:text-sm">
                      {formatCurrency(ingredientCost)} 
                      <span className="block sm:inline sm:ml-1">
                        ({Math.round((ingredientCost / totalProductionCost) * 100)}%)
                      </span>
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 p-2 sm:p-0">
                  <div className="w-4 h-4 bg-green-500 rounded-full flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900">Tenaga Kerja</p>
                    <p className="text-gray-600 text-xs sm:text-sm">
                      {formatCurrency(data.biayaTenagaKerja || 0)} 
                      <span className="block sm:inline sm:ml-1">
                        ({Math.round(((data.biayaTenagaKerja || 0) / totalProductionCost) * 100)}%)
                      </span>
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 p-2 sm:p-0">
                  <div className="w-4 h-4 bg-purple-500 rounded-full flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 flex items-center gap-1">
                      Overhead
                      {isUsingAutoOverhead && (
                        <Zap className="h-3 w-3 text-green-600 flex-shrink-0" title="Auto-calculated" />
                      )}
                    </p>
                    <p className="text-gray-600 text-xs sm:text-sm">
                      {formatCurrency(data.biayaOverhead || 0)} 
                      <span className="block sm:inline sm:ml-1">
                        ({Math.round(((data.biayaOverhead || 0) / totalProductionCost) * 100)}%)
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* ✅ Mobile-friendly summary */}
              {isMobile && (
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2 text-sm">Ringkasan Biaya</h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Biaya Produksi:</span>
                      <span className="font-semibold text-gray-900">{formatCurrency(totalProductionCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Komponen Terbesar:</span>
                      <span className="font-medium text-gray-900">
                        {ingredientCost >= (data.biayaTenagaKerja || 0) && ingredientCost >= (data.biayaOverhead || 0) 
                          ? 'Bahan Baku' 
                          : (data.biayaTenagaKerja || 0) >= (data.biayaOverhead || 0) 
                            ? 'Tenaga Kerja' 
                            : 'Overhead'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ✅ Overhead Calculation Details */}
      {isUsingAutoOverhead && overheadCalculation && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-green-600" />
              Detail Kalkulasi Overhead Otomatis
            </CardTitle>
          </CardHeader>
          <CardContent>
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
                  <Badge variant="outline" className="border-green-300 text-green-700">
                    {overheadCalculation.metode === 'per_unit' ? 'Per Unit' : 'Persentase'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-green-700">Basis Alokasi:</span>
                  <span className="font-medium text-green-900">
                    {overheadCalculation.metode === 'per_unit' 
                      ? `${overheadCalculation.nilai_basis} unit/bulan`
                      : `${overheadCalculation.nilai_basis}%`
                    }
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
                  <span className="text-sm text-green-700">Untuk {data.jumlahPorsi} porsi:</span>
                  <span className="font-bold text-green-900">
                    {formatCurrency(overheadCalculation.overhead_per_unit * (data.jumlahPorsi || 1))}
                  </span>
                </div>
                {overheadCalculation.material_cost && (
                  <div className="flex justify-between">
                    <span className="text-sm text-green-700">Basis Bahan Baku:</span>
                    <span className="font-medium text-green-900">
                      {formatCurrency(overheadCalculation.material_cost)}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-white rounded-lg border border-green-200">
              <p className="text-xs text-green-600 flex items-center gap-1">
                <Info className="h-3 w-3" />
                Nilai overhead dihitung otomatis berdasarkan biaya operasional aktif dan pengaturan alokasi.
                {overheadCalculation.material_cost && " Perhitungan memperhitungkan biaya bahan baku sebagai basis."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation Errors */}
      {(errors.biayaTenagaKerja || errors.biayaOverhead || errors.marginKeuntunganPersen || overheadError) && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-red-800 font-medium mb-1">Perbaiki kesalahan berikut:</p>
                <ul className="text-sm text-red-700 space-y-1">
                  {errors.biayaTenagaKerja && <li>• {errors.biayaTenagaKerja}</li>}
                  {errors.biayaOverhead && <li>• {errors.biayaOverhead}</li>}
                  {errors.marginKeuntunganPersen && <li>• {errors.marginKeuntunganPersen}</li>}
                  {overheadError && <li>• Overhead: {overheadError}</li>}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ✅ Mobile Bottom Navigation Spacer */}
      <div className="h-20 sm:h-0" aria-hidden="true"></div>
    </div>
  );
};

export default CostCalculationStep;