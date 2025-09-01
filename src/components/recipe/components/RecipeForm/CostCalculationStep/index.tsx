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

  // Manual selling price state - get from form data
  const [isManualPricingMode, setIsManualPricingMode] = React.useState(data.isManualPricingEnabled || false);
  const [manualPrices, setManualPrices] = React.useState({
    hargaJualPorsi: data.manualSellingPricePerPortion || 0,
    hargaJualPerPcs: data.manualSellingPricePerPiece || 0,
  });

  // Sync state with form data when it changes (for existing recipes)
  React.useEffect(() => {
    setIsManualPricingMode(data.isManualPricingEnabled || false);
    setManualPrices({
      hargaJualPorsi: data.manualSellingPricePerPortion || 0,
      hargaJualPerPcs: data.manualSellingPricePerPiece || 0,
    });
  }, [data.isManualPricingEnabled, data.manualSellingPricePerPortion, data.manualSellingPricePerPiece]);

  // When manual pricing is enabled, also show manual prices instead of auto prices in the display
  const displayPrices = React.useMemo(() => {
    if (isManualPricingMode && enhancedHppResult) {
      return {
        hargaJualPerPorsi: manualPrices.hargaJualPorsi || enhancedHppResult.hargaJualPerPorsi,
        hargaJualPerPcs: manualPrices.hargaJualPerPcs || enhancedHppResult.hargaJualPerPcs,
      };
    }
    return enhancedHppResult ? {
      hargaJualPerPorsi: enhancedHppResult.hargaJualPerPorsi,
      hargaJualPerPcs: enhancedHppResult.hargaJualPerPcs,
    } : { hargaJualPerPorsi: 0, hargaJualPerPcs: 0 };
  }, [isManualPricingMode, manualPrices, enhancedHppResult]);

  // Handle enhanced HPP result updates
  const handleEnhancedHppChange = React.useCallback((result: EnhancedHPPCalculationResult | null) => {
    setEnhancedHppResult(result);
    
    if (result) {
      // Update form data with enhanced results
      onUpdate('totalHpp', result.totalHPP);
      onUpdate('hppPerPorsi', result.hppPerPorsi);
      onUpdate('hppPerPcs', result.hppPerPcs);
      
      // Only update selling prices if not in manual pricing mode
      if (!isManualPricingMode) {
        onUpdate('hargaJualPorsi', result.hargaJualPerPorsi);
        onUpdate('hargaJualPerPcs', result.hargaJualPerPcs);
      }
      
      onUpdate('biayaTenagaKerja', result.tklPerPcs * (data.jumlahPorsi || 1) * (data.jumlahPcsPerPorsi || 1));
      onUpdate('biayaOverhead', result.overheadPerPcs * (data.jumlahPorsi || 1) * (data.jumlahPcsPerPorsi || 1));
    }
  }, [onUpdate, data.jumlahPorsi, data.jumlahPcsPerPorsi, isManualPricingMode]);

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
              <p className="text-xs sm:text-sm text-green-600 font-medium text-overflow-safe">
                Harga Jual per Pcs
                {isManualPricingMode && <span className="text-orange-600 ml-1">(Manual)</span>}
              </p>
              <p className="text-lg sm:text-xl font-bold text-green-900 text-overflow-safe">
                Rp {displayPrices.hargaJualPerPcs.toLocaleString('id-ID')}
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

      {/* Manual Selling Price Input */}
      {enhancedHppResult && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Harga Jual Manual
              <div className="flex items-center gap-2 ml-auto">
                <Button
                  type="button"
                  variant={isManualPricingMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    const newMode = !isManualPricingMode;
                    setIsManualPricingMode(newMode);
                    onUpdate('isManualPricingEnabled', newMode);
                    
                    if (newMode) {
                      // Enable manual mode - use current form values or auto-calculated values as starting point
                      const initialPorsiPrice = data.hargaJualPorsi || enhancedHppResult.hargaJualPerPorsi;
                      const initialPcsPrice = data.hargaJualPerPcs || enhancedHppResult.hargaJualPerPcs;
                      
                      setManualPrices({
                        hargaJualPorsi: initialPorsiPrice,
                        hargaJualPerPcs: initialPcsPrice,
                      });
                      
                      onUpdate('manualSellingPricePerPortion', initialPorsiPrice);
                      onUpdate('manualSellingPricePerPiece', initialPcsPrice);
                      onUpdate('hargaJualPorsi', initialPorsiPrice);
                      onUpdate('hargaJualPerPcs', initialPcsPrice);
                    } else {
                      // Disable manual mode - clear database fields and use auto prices
                      onUpdate('manualSellingPricePerPortion', 0);
                      onUpdate('manualSellingPricePerPiece', 0);
                      if (enhancedHppResult) {
                        onUpdate('hargaJualPorsi', enhancedHppResult.hargaJualPerPorsi);
                        onUpdate('hargaJualPerPcs', enhancedHppResult.hargaJualPerPcs);
                      }
                    }
                  }}
                  className="text-xs h-7 px-3"
                >
                  {isManualPricingMode ? (
                    <>
                      <Settings className="h-3 w-3 mr-1" />
                      Manual Aktif
                    </>
                  ) : (
                    <>
                      <Zap className="h-3 w-3 mr-1" />
                      Otomatis
                    </>
                  )}
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isManualPricingMode ? (
              <Alert className="border-blue-200 bg-blue-50">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-blue-800">
                  <strong>Mode Otomatis:</strong> Harga jual dihitung berdasarkan HPP + margin keuntungan ({data.marginKeuntunganPersen || 0}%).
                  Klik "Manual Aktif" untuk mengatur harga jual secara manual.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                <Alert className="border-orange-200 bg-orange-50">
                  <Settings className="h-4 w-4" />
                  <AlertDescription className="text-orange-800">
                    <strong>Mode Manual:</strong> Anda dapat mengatur harga jual sendiri. 
                    Sistem akan menghitung profit berdasarkan harga manual vs HPP.
                  </AlertDescription>
                </Alert>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Manual Price Per Porsi */}
                  <div className="bg-white p-4 rounded-lg border border-green-300">
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Harga Jual Per Porsi
                    </Label>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm text-gray-500">Rp</span>
                      <Input
                        type="number"
                        min="0"
                        step="500"
                        value={manualPrices.hargaJualPorsi || ''}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          setManualPrices(prev => ({ ...prev, hargaJualPorsi: value }));
                          onUpdate('hargaJualPorsi', value);
                          onUpdate('manualSellingPricePerPortion', value);
                        }}
                        placeholder={enhancedHppResult.hargaJualPerPorsi.toLocaleString('id-ID')}
                        className="text-sm flex-1"
                      />
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div className="flex justify-between">
                        <span>HPP per Porsi:</span>
                        <span className="font-medium">Rp {enhancedHppResult.hppPerPorsi.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Harga Auto:</span>
                        <span className="text-blue-600">Rp {enhancedHppResult.hargaJualPerPorsi.toLocaleString('id-ID')}</span>
                      </div>
                      {manualPrices.hargaJualPorsi > 0 && (
                        <div className="flex justify-between font-medium">
                          <span>Profit Manual:</span>
                          <span className={manualPrices.hargaJualPorsi > enhancedHppResult.hppPerPorsi ? 'text-green-600' : 'text-red-600'}>
                            Rp {(manualPrices.hargaJualPorsi - enhancedHppResult.hppPerPorsi).toLocaleString('id-ID')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Manual Price Per Pcs */}
                  <div className="bg-white p-4 rounded-lg border border-green-300">
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Harga Jual Per Pcs
                    </Label>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm text-gray-500">Rp</span>
                      <Input
                        type="number"
                        min="0"
                        step="100"
                        value={manualPrices.hargaJualPerPcs || ''}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          setManualPrices(prev => ({ ...prev, hargaJualPerPcs: value }));
                          onUpdate('hargaJualPerPcs', value);
                          onUpdate('manualSellingPricePerPiece', value);
                        }}
                        placeholder={enhancedHppResult.hargaJualPerPcs.toLocaleString('id-ID')}
                        className="text-sm flex-1"
                      />
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div className="flex justify-between">
                        <span>HPP per Pcs:</span>
                        <span className="font-medium">Rp {enhancedHppResult.hppPerPcs.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Harga Auto:</span>
                        <span className="text-blue-600">Rp {enhancedHppResult.hargaJualPerPcs.toLocaleString('id-ID')}</span>
                      </div>
                      {manualPrices.hargaJualPerPcs > 0 && (
                        <div className="flex justify-between font-medium">
                          <span>Profit Manual:</span>
                          <span className={manualPrices.hargaJualPerPcs > enhancedHppResult.hppPerPcs ? 'text-green-600' : 'text-red-600'}>
                            Rp {(manualPrices.hargaJualPerPcs - enhancedHppResult.hppPerPcs).toLocaleString('id-ID')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                {/* Quick Action Buttons */}
                <div className="flex gap-2 flex-wrap">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setManualPrices({
                        hargaJualPorsi: enhancedHppResult.hargaJualPerPorsi,
                        hargaJualPerPcs: enhancedHppResult.hargaJualPerPcs,
                      });
                      onUpdate('hargaJualPorsi', enhancedHppResult.hargaJualPerPorsi);
                      onUpdate('hargaJualPerPcs', enhancedHppResult.hargaJualPerPcs);
                      onUpdate('manualSellingPricePerPortion', enhancedHppResult.hargaJualPerPorsi);
                      onUpdate('manualSellingPricePerPiece', enhancedHppResult.hargaJualPerPcs);
                    }}
                    className="text-xs h-8 px-3"
                  >
                    Reset ke Auto
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const roundedPorsi = Math.ceil(enhancedHppResult.hargaJualPerPorsi / 1000) * 1000;
                      const roundedPcs = Math.ceil(enhancedHppResult.hargaJualPerPcs / 1000) * 1000;
                      setManualPrices({
                        hargaJualPorsi: roundedPorsi,
                        hargaJualPerPcs: roundedPcs,
                      });
                      onUpdate('hargaJualPorsi', roundedPorsi);
                      onUpdate('hargaJualPerPcs', roundedPcs);
                      onUpdate('manualSellingPricePerPortion', roundedPorsi);
                      onUpdate('manualSellingPricePerPiece', roundedPcs);
                    }}
                    className="text-xs h-8 px-3"
                  >
                    Bulatkan 1K
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const roundedPorsi = Math.ceil(enhancedHppResult.hargaJualPerPorsi / 500) * 500;
                      const roundedPcs = Math.ceil(enhancedHppResult.hargaJualPerPcs / 500) * 500;
                      setManualPrices({
                        hargaJualPorsi: roundedPorsi,
                        hargaJualPerPcs: roundedPcs,
                      });
                      onUpdate('hargaJualPorsi', roundedPorsi);
                      onUpdate('hargaJualPerPcs', roundedPcs);
                      onUpdate('manualSellingPricePerPortion', roundedPorsi);
                      onUpdate('manualSellingPricePerPiece', roundedPcs);
                    }}
                    className="text-xs h-8 px-3"
                  >
                    Bulatkan 500
                  </Button>
                </div>
                
                {/* Profit Summary for Manual Pricing */}
                {(manualPrices.hargaJualPorsi > 0 || manualPrices.hargaJualPerPcs > 0) && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">📊 Ringkasan Profit Manual</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {manualPrices.hargaJualPorsi > 0 && (
                        <div className="space-y-1">
                          <div className="font-medium text-blue-800">Per Porsi:</div>
                          <div className="flex justify-between">
                            <span>Total Revenue:</span>
                            <span className="font-medium">Rp {(manualPrices.hargaJualPorsi * data.jumlahPorsi).toLocaleString('id-ID')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Total Profit:</span>
                            <span className={`font-medium ${
                              (manualPrices.hargaJualPorsi - enhancedHppResult.hppPerPorsi) * data.jumlahPorsi > 0 
                                ? 'text-green-600' : 'text-red-600'
                            }`}>
                              Rp {((manualPrices.hargaJualPorsi - enhancedHppResult.hppPerPorsi) * data.jumlahPorsi).toLocaleString('id-ID')}
                            </span>
                          </div>
                        </div>
                      )}
                      {manualPrices.hargaJualPerPcs > 0 && (
                        <div className="space-y-1">
                          <div className="font-medium text-blue-800">Per Pcs:</div>
                          <div className="flex justify-between">
                            <span>Total Revenue:</span>
                            <span className="font-medium">Rp {(manualPrices.hargaJualPerPcs * data.jumlahPorsi * (data.jumlahPcsPerPorsi || 1)).toLocaleString('id-ID')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Total Profit:</span>
                            <span className={`font-medium ${
                              (manualPrices.hargaJualPerPcs - enhancedHppResult.hppPerPcs) * data.jumlahPorsi * (data.jumlahPcsPerPorsi || 1) > 0 
                                ? 'text-green-600' : 'text-red-600'
                            }`}>
                              Rp {((manualPrices.hargaJualPerPcs - enhancedHppResult.hppPerPcs) * data.jumlahPorsi * (data.jumlahPcsPerPorsi || 1)).toLocaleString('id-ID')}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Mobile Bottom Navigation Spacer */}
      <div className="h-20 sm:h-0" aria-hidden="true"></div>
    </div>
  );
};

export default CostCalculationStep;