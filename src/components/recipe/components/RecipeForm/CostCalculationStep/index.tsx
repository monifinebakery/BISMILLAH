import React from 'react';
import { Calculator, Info, Zap, DollarSign, Settings } from 'lucide-react';
import { logger } from '@/utils/logger';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

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

  // Selling price state - now always manual input (no auto pricing)
  const [sellingPrices, setSellingPrices] = React.useState({
    hargaJualPorsi: data.hargaJualPorsi || 0,
    hargaJualPerPcs: data.hargaJualPerPcs || 0,
  });
  
  // ✅ NEW: Track user manual input to prevent auto-override
  const [userHasEditedPricing, setUserHasEditedPricing] = React.useState({
    porsi: false,
    pcs: false,
  });

  // Sync state with form data ONLY on initial load or when switching between recipes
  // Prevent overriding user manual input during edit
  React.useEffect(() => {
    // Only sync if this is the first time loading the data (initial load)
    // Don't sync if user is actively editing (prevents override of manual input)
    const isInitialLoad = sellingPrices.hargaJualPorsi === 0 && sellingPrices.hargaJualPerPcs === 0;
    const hasValidFormData = (data.hargaJualPorsi || 0) > 0 || (data.hargaJualPerPcs || 0) > 0;
    const userHasNotEditedPricing = !userHasEditedPricing.porsi && !userHasEditedPricing.pcs;
    
    if (isInitialLoad && hasValidFormData && userHasNotEditedPricing) {
      console.log('📥 Initial sync with form data (edit mode):', {
        incoming: { 
          hargaJualPorsi: data.hargaJualPorsi || 0, 
          hargaJualPerPcs: data.hargaJualPerPcs || 0 
        }
      });
      setSellingPrices({
        hargaJualPorsi: data.hargaJualPorsi || 0,
        hargaJualPerPcs: data.hargaJualPerPcs || 0,
      });
    } else if (userHasEditedPricing.porsi || userHasEditedPricing.pcs) {
      console.log('🔒 Protecting manual pricing from auto-override:', userHasEditedPricing);
    }
  }, [data.hargaJualPorsi, data.hargaJualPerPcs, userHasEditedPricing]); // Added userHasEditedPricing to deps

  // Handle enhanced HPP result updates
  const handleEnhancedHppChange = React.useCallback((result: EnhancedHPPCalculationResult | null) => {
    setEnhancedHppResult(result);
    
    if (result) {
      // Update form data with enhanced results (only HPP, not selling prices)
      onUpdate('totalHpp', result.totalHPP);
      onUpdate('hppPerPorsi', result.hppPerPorsi);
      onUpdate('hppPerPcs', result.hppPerPcs);
      
      // Update costs but not selling prices (user controls selling prices) - handle string values
      const jumlahPorsi = typeof data.jumlahPorsi === 'string' 
        ? (data.jumlahPorsi === '' ? 1 : parseInt(data.jumlahPorsi)) || 1
        : (data.jumlahPorsi || 1);
      const jumlahPcsPerPorsi = typeof data.jumlahPcsPerPorsi === 'string'
        ? (data.jumlahPcsPerPorsi === '' ? 1 : parseInt(data.jumlahPcsPerPorsi)) || 1  
        : (data.jumlahPcsPerPorsi || 1);
      onUpdate('biayaTenagaKerja', result.tklPerPcs * jumlahPorsi * jumlahPcsPerPorsi);
      onUpdate('biayaOverhead', result.overheadPerPcs * jumlahPorsi * jumlahPcsPerPorsi);
    }
  }, [onUpdate, data.jumlahPorsi, data.jumlahPcsPerPorsi]);

  // Handle enhanced HPP mode changes
  const handleEnhancedHppModeChange = React.useCallback((isActive: boolean) => {
    setIsEnhancedMode(isActive);
    if (onEnhancedHppModeChange) {
      onEnhancedHppModeChange(isActive);
    }
  }, [onEnhancedHppModeChange]);

  // Prepare recipe data for enhanced HPP integration - handle string values
  const recipeDataForHpp = React.useMemo(() => {
    const jumlahPorsi = typeof data.jumlahPorsi === 'string' 
      ? (data.jumlahPorsi === '' ? 1 : parseInt(data.jumlahPorsi)) || 1
      : (data.jumlahPorsi || 1);
    const jumlahPcsPerPorsi = typeof data.jumlahPcsPerPorsi === 'string'
      ? (data.jumlahPcsPerPorsi === '' ? 1 : parseInt(data.jumlahPcsPerPorsi)) || 1  
      : (data.jumlahPcsPerPorsi || 1);
      
    return {
      bahanResep: data.bahanResep || [],
      jumlahPorsi,
      jumlahPcsPerPorsi,
      biayaTenagaKerja: data.biayaTenagaKerja || 0,
      biayaOverhead: data.biayaOverhead || 0,
      marginKeuntunganPersen: data.marginKeuntunganPersen || 0,
    };
  }, [data]);

  // Calculate accurate ingredient cost for display - handle string values
  const totalIngredientCost = data.bahanResep.reduce((sum, bahan) => sum + bahan.totalHarga, 0);
  const jumlahPorsiForCalc = typeof data.jumlahPorsi === 'string' 
    ? (data.jumlahPorsi === '' ? 1 : parseInt(data.jumlahPorsi)) || 1
    : (data.jumlahPorsi || 1);
  const jumlahPcsPerPorsiForCalc = typeof data.jumlahPcsPerPorsi === 'string'
    ? (data.jumlahPcsPerPorsi === '' ? 1 : parseInt(data.jumlahPcsPerPorsi)) || 1  
    : (data.jumlahPcsPerPorsi || 1);
  const totalPcs = jumlahPorsiForCalc * jumlahPcsPerPorsiForCalc;
  const accurateIngredientCostPerPcs = totalPcs > 0 ? totalIngredientCost / totalPcs : 0;

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
          Sistem akan menghitung HPP dan harga jual secara otomatis menggunakan biaya produksi dari biaya operasional
        </p>
      </div>

      {/* Enhanced HPP Information with Status */}
      <Alert className={`border-2 transition-all duration-500 ${
        enhancedHppResult 
          ? 'border-green-200 bg-green-50 shadow-md' 
          : 'border-amber-200 bg-amber-50'
      }`}>
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4" />
          <div className={`w-2 h-2 rounded-full ${
            enhancedHppResult ? 'bg-green-500' : 'bg-amber-500 animate-pulse'
          }`}></div>
        </div>
        <AlertDescription className={enhancedHppResult ? 'text-green-800' : 'text-amber-800'}>
          <strong>🎯 Status Koneksi:</strong>{' '}
          {enhancedHppResult ? (
            <span className="inline-flex items-center gap-1">
              <span>✓ Terhubung</span> - HPP terhitung otomatis dari biaya produksi Biaya Operasional
            </span>
          ) : (
            <span className="inline-flex items-center gap-1">
              <span>⏳ Menunggu</span> - Setup biaya produksi di Biaya Operasional → Dual-Mode Calculator
            </span>
          )}<br/>
          <strong>Formula:</strong> Bahan + TKL + Biaya Produksi Otomatis = HPP Akurat
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
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200">
              <p className="text-xs sm:text-sm text-gray-600 font-medium text-overflow-safe">HPP per Pcs</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900 text-overflow-safe">
                Rp {enhancedHppResult.hppPerPcs.toLocaleString('id-ID')}
              </p>
            </div>
            
            <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200">
              <p className="text-xs sm:text-sm text-gray-600 font-medium text-overflow-safe">HPP per Porsi</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900 text-overflow-safe">
                Rp {enhancedHppResult.hppPerPorsi.toLocaleString('id-ID')}
              </p>
            </div>
            
            <div className="bg-orange-50 p-3 sm:p-4 rounded-lg border border-orange-200">
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
                <div className="text-right">
                  {/* Show accurate ingredient cost with validation */}
                  {Math.abs(enhancedHppResult.bahanPerPcs - accurateIngredientCostPerPcs) > accurateIngredientCostPerPcs * 0.5 ? (
                    <div className="space-y-1">
                      <span className="font-medium text-red-600">
                        Rp {enhancedHppResult.bahanPerPcs.toLocaleString('id-ID')}
                      </span>
                      <div className="text-xs text-red-500">
                        ⚠️ Validasi: Rp {accurateIngredientCostPerPcs.toLocaleString('id-ID')}
                      </div>
                    </div>
                  ) : (
                    <span className="font-medium">
                      Rp {enhancedHppResult.bahanPerPcs.toLocaleString('id-ID')}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">TKL (Tenaga Kerja):</span>
                <span className="font-medium">Rp {enhancedHppResult.tklPerPcs.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">
                  Biaya Produksi (Overhead):
                </span>
                <div className="text-right">
                  <span className="font-medium">Rp {enhancedHppResult.overheadPerPcs.toLocaleString('id-ID')}</span>
                  {enhancedHppResult.breakdown.overheadBreakdown && (
                    <div className="text-xs text-gray-500 mt-1">
                      💡 Sudah termasuk HPP + TKL dari Biaya Operasional<br/>
                      📋 Operasional: Rp {enhancedHppResult.breakdown.overheadBreakdown.operasionalOnly.toLocaleString('id-ID')} (analisis terpisah)
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600">
              💡 <strong>Metode:</strong> {enhancedHppResult.calculationMethod === 'enhanced_dual_mode' ? 'Enhanced Dual-Mode' : 'Legacy'} •{' '}
              <strong>Biaya Produksi:</strong> {enhancedHppResult.breakdown.overheadSource === 'app_settings' ? 'Otomatis dari Biaya Operasional' : 'Input Manual'}
            </p>
          </div>
        </div>
      )}

      {/* Selling Price Input */}
      {enhancedHppResult && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-orange-600" />
              Harga Jual Produk
            </CardTitle>
            <p className="text-sm text-orange-700 mt-1">
              Tentukan harga jual berdasarkan HPP dan strategi bisnis Anda
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Pricing Suggestions */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Info className="h-4 w-4 text-gray-500" />
                💡 Saran Harga Berdasarkan Margin
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-gray-50 p-2 rounded border">
                  <div className="font-medium text-gray-700">Margin 25%</div>
                  <div className="text-gray-600 mt-1">
                    Per Pcs: <span className="font-medium">Rp {Math.round(enhancedHppResult.hppPerPcs * 1.25).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="text-gray-600">
                    Per Porsi: <span className="font-medium">Rp {Math.round(enhancedHppResult.hppPerPorsi * 1.25).toLocaleString('id-ID')}</span>
                  </div>
                </div>
                <div className="bg-orange-50 p-2 rounded border border-orange-200">
                  <div className="font-medium text-orange-700">Margin 30% (Rekomendasi)</div>
                  <div className="text-orange-700 mt-1">
                    Per Pcs: <span className="font-medium">Rp {Math.round(enhancedHppResult.hppPerPcs * 1.3).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="text-orange-700">
                    Per Porsi: <span className="font-medium">Rp {Math.round(enhancedHppResult.hppPerPorsi * 1.3).toLocaleString('id-ID')}</span>
                  </div>
                </div>
                <div className="bg-gray-50 p-2 rounded border">
                  <div className="font-medium text-gray-700">Margin 35%</div>
                  <div className="text-gray-600 mt-1">
                    Per Pcs: <span className="font-medium">Rp {Math.round(enhancedHppResult.hppPerPcs * 1.35).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="text-gray-600">
                    Per Porsi: <span className="font-medium">Rp {Math.round(enhancedHppResult.hppPerPorsi * 1.35).toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Protection Status Indicator */}
            {(userHasEditedPricing.porsi || userHasEditedPricing.pcs) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm text-blue-800">
                  <span className="text-blue-600 font-medium">🔒</span>
                  <span className="font-medium">Harga Terlindungi</span>
                  <span className="text-blue-600">-</span>
                  <span>Input manual Anda telah disimpan dan tidak akan ditimpa otomatis</span>
                </div>
              </div>
            )}

            {/* Manual Input Section */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Price Per Porsi */}
                <div className="bg-white p-4 rounded-lg border border-gray-300">
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    Harga Jual Per Porsi
                  </Label>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-gray-500">Rp</span>
                    <Input
                      type="number"
                      min="0"
                      step="500"
                      value={sellingPrices.hargaJualPorsi || ''}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        console.log('💰 Manual price edit - hargaJualPorsi:', value);
                        
                        // ✅ Mark as manually edited to prevent auto-override
                        setUserHasEditedPricing(prev => ({
                          ...prev,
                          porsi: true,
                        }));
                        
                        setSellingPrices(prev => ({ ...prev, hargaJualPorsi: value }));
                        onUpdate('hargaJualPorsi', value);
                      }}
                      placeholder="Masukkan harga jual"
                      className="text-sm flex-1"
                    />
                  </div>
                  {/* Quick suggestion buttons */}
                  <div className="flex gap-1 mb-3">
                    {[1.25, 1.3, 1.35].map((multiplier) => {
                      const suggestedPrice = Math.round(enhancedHppResult.hppPerPorsi * multiplier);
                      return (
                        <button
                          key={multiplier}
                          type="button"
                          onClick={() => {
                            console.log('🎯 Applying suggested price for porsi:', suggestedPrice);
                            setSellingPrices(prev => ({ ...prev, hargaJualPorsi: suggestedPrice }));
                            onUpdate('hargaJualPorsi', suggestedPrice);
                          }}
                          className="text-xs px-2 py-1 bg-gray-100 hover:bg-orange-100 hover:text-orange-700 rounded border text-gray-600 transition-colors"
                        >
                          {Math.round((multiplier - 1) * 100)}% → {suggestedPrice.toLocaleString('id-ID')}
                        </button>
                      );
                    })}
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div className="flex justify-between">
                      <span>HPP per Porsi:</span>
                      <span className="font-medium">Rp {enhancedHppResult.hppPerPorsi.toLocaleString('id-ID')}</span>
                    </div>
                    {sellingPrices.hargaJualPorsi > 0 && (
                      <>
                        <div className="flex justify-between font-medium">
                          <span>Profit:</span>
                          <span className={sellingPrices.hargaJualPorsi > enhancedHppResult.hppPerPorsi ? 'text-green-600' : 'text-red-600'}>
                            Rp {(sellingPrices.hargaJualPorsi - enhancedHppResult.hppPerPorsi).toLocaleString('id-ID')}
                          </span>
                        </div>
                        <div className="flex justify-between text-orange-600 font-medium">
                          <span>Margin:</span>
                          <span>
                            {((sellingPrices.hargaJualPorsi - enhancedHppResult.hppPerPorsi) / sellingPrices.hargaJualPorsi * 100).toFixed(1)}%
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Price Per Pcs */}
                <div className="bg-white p-4 rounded-lg border border-gray-300">
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    Harga Jual Per Pcs
                  </Label>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-gray-500">Rp</span>
                    <Input
                      type="number"
                      min="0"
                      step="100"
                      value={sellingPrices.hargaJualPerPcs || ''}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        console.log('💰 Manual price edit - hargaJualPerPcs:', value);
                        
                        // ✅ Mark as manually edited to prevent auto-override
                        setUserHasEditedPricing(prev => ({
                          ...prev,
                          pcs: true,
                        }));
                        
                        setSellingPrices(prev => ({ ...prev, hargaJualPerPcs: value }));
                        onUpdate('hargaJualPerPcs', value);
                      }}
                      placeholder="Masukkan harga jual"
                      className="text-sm flex-1"
                    />
                  </div>
                  {/* Quick suggestion buttons */}
                  <div className="flex gap-1 mb-3">
                    {[1.25, 1.3, 1.35].map((multiplier) => {
                      const suggestedPrice = Math.round(enhancedHppResult.hppPerPcs * multiplier);
                      return (
                        <button
                          key={multiplier}
                          type="button"
                          onClick={() => {
                            console.log('🎯 Applying suggested price for pcs:', suggestedPrice);
                            setSellingPrices(prev => ({ ...prev, hargaJualPerPcs: suggestedPrice }));
                            onUpdate('hargaJualPerPcs', suggestedPrice);
                          }}
                          className="text-xs px-2 py-1 bg-gray-100 hover:bg-orange-100 hover:text-orange-700 rounded border text-gray-600 transition-colors"
                        >
                          {Math.round((multiplier - 1) * 100)}% → {suggestedPrice.toLocaleString('id-ID')}
                        </button>
                      );
                    })}
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div className="flex justify-between">
                      <span>HPP per Pcs:</span>
                      <span className="font-medium">Rp {enhancedHppResult.hppPerPcs.toLocaleString('id-ID')}</span>
                    </div>
                    {sellingPrices.hargaJualPerPcs > 0 && (
                      <>
                        <div className="flex justify-between font-medium">
                          <span>Profit:</span>
                          <span className={sellingPrices.hargaJualPerPcs > enhancedHppResult.hppPerPcs ? 'text-green-600' : 'text-red-600'}>
                            Rp {(sellingPrices.hargaJualPerPcs - enhancedHppResult.hppPerPcs).toLocaleString('id-ID')}
                          </span>
                        </div>
                        <div className="flex justify-between text-orange-600 font-medium">
                          <span>Margin:</span>
                          <span>
                            {((sellingPrices.hargaJualPerPcs - enhancedHppResult.hppPerPcs) / sellingPrices.hargaJualPerPcs * 100).toFixed(1)}%
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              <Separator />
              
              {/* Profit Summary */}
              {(sellingPrices.hargaJualPorsi > 0 || sellingPrices.hargaJualPerPcs > 0) && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-orange-900 mb-3 flex items-center gap-2">
                    📊 Analisis Profitabilitas
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {sellingPrices.hargaJualPorsi > 0 && (
                      <div className="space-y-2">
                        <div className="font-medium text-orange-800">Per Porsi ({data.jumlahPorsi} porsi):</div>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total Revenue:</span>
                            <span className="font-medium text-gray-900">Rp {(sellingPrices.hargaJualPorsi * data.jumlahPorsi).toLocaleString('id-ID')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total HPP:</span>
                            <span className="font-medium text-gray-900">Rp {(enhancedHppResult.hppPerPorsi * data.jumlahPorsi).toLocaleString('id-ID')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total Profit:</span>
                            <span className={`font-medium ${
                              (sellingPrices.hargaJualPorsi - enhancedHppResult.hppPerPorsi) * data.jumlahPorsi > 0 
                                ? 'text-green-600' : 'text-red-600'
                            }`}>
                              Rp {((sellingPrices.hargaJualPorsi - enhancedHppResult.hppPerPorsi) * data.jumlahPorsi).toLocaleString('id-ID')}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                    {sellingPrices.hargaJualPerPcs > 0 && (
                      <div className="space-y-2">
                        <div className="font-medium text-orange-800">Per Pcs ({data.jumlahPorsi * (data.jumlahPcsPerPorsi || 1)} pcs):</div>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total Revenue:</span>
                            <span className="font-medium text-gray-900">Rp {(sellingPrices.hargaJualPerPcs * data.jumlahPorsi * (data.jumlahPcsPerPorsi || 1)).toLocaleString('id-ID')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total HPP:</span>
                            <span className="font-medium text-gray-900">Rp {(enhancedHppResult.hppPerPcs * data.jumlahPorsi * (data.jumlahPcsPerPorsi || 1)).toLocaleString('id-ID')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total Profit:</span>
                            <span className={`font-medium ${
                              (sellingPrices.hargaJualPerPcs - enhancedHppResult.hppPerPcs) * data.jumlahPorsi * (data.jumlahPcsPerPorsi || 1) > 0 
                                ? 'text-green-600' : 'text-red-600'
                            }`}>
                              Rp {((sellingPrices.hargaJualPerPcs - enhancedHppResult.hppPerPcs) * data.jumlahPorsi * (data.jumlahPcsPerPorsi || 1)).toLocaleString('id-ID')}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mobile Bottom Navigation Spacer */}
      <div className="h-20 sm:h-0" aria-hidden="true"></div>
    </div>
  );
};

export default CostCalculationStep;