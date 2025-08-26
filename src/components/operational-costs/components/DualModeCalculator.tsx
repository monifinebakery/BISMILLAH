// src/components/operational-costs/components/DualModeCalculator.tsx
// 🧮 Dual-Mode Calculator Component (Revision 7)
// Separate calculator for HPP vs Operasional cost groups

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calculator, 
  Target, 
  DollarSign, 
  CheckCircle, 
  AlertTriangle,
  Info,
  Zap,
  TrendingUp,
  Package
} from 'lucide-react';
import { formatCurrency } from '@/utils/formatUtils';
import { toast } from 'sonner';

// Types
import { 
  OperationalCost, 
  DualModeCalculationResult, 
  AppSettings 
} from '../types/operationalCost.types';

// Utils
import { 
  calculateDualModeCosts, 
  validateDualModeInputs,
  roundCurrency 
} from '../utils/dualModeCalculations';

// API
import { appSettingsApi, productionOutputApi } from '../services';

interface DualModeCalculatorProps {
  costs: OperationalCost[];
  onCalculationComplete?: (
    hppResult: DualModeCalculationResult,
    operasionalResult: DualModeCalculationResult
  ) => void;
  currentSettings?: AppSettings | null;
  className?: string;
}

const DualModeCalculator: React.FC<DualModeCalculatorProps> = ({
  costs,
  onCalculationComplete,
  currentSettings,
  className = ''
}) => {
  // State
  const [targetOutput, setTargetOutput] = useState<number>(
    currentSettings?.target_output_monthly || 3000
  );
  const [selectedGroup, setSelectedGroup] = useState<'hpp' | 'operasional'>('hpp');
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isFetchingProduction, setIsFetchingProduction] = useState(false);
  const [productionData, setProductionData] = useState<any>(null);
  const [results, setResults] = useState<{
    hpp: DualModeCalculationResult | null;
    operasional: DualModeCalculationResult | null;
  }>({ hpp: null, operasional: null });

  // Memoized calculations
  const calculations = useMemo(() => {
    if (targetOutput <= 0) return null;
    return calculateDualModeCosts(costs, targetOutput);
  }, [costs, targetOutput]);

  // Update results when calculations change
  useEffect(() => {
    if (calculations) {
      setResults({
        hpp: calculations.hpp,
        operasional: calculations.operasional
      });
    }
  }, [calculations]);

  // Group summaries
  const hppCosts = useMemo(() => 
    costs.filter(c => c.group === 'hpp' && c.status === 'aktif'), [costs]
  );
  
  const operasionalCosts = useMemo(() => 
    costs.filter(c => c.group === 'operasional' && c.status === 'aktif'), [costs]
  );

  // Handle calculation trigger
  const handleCalculate = async () => {
    setIsCalculating(true);
    
    try {
      // Validate inputs
      const validation = validateDualModeInputs(targetOutput, undefined, 'Calculator');
      if (!validation.isValid) {
        toast.error('Input tidak valid', {
          description: validation.errors.join(', ')
        });
        return;
      }

      // Trigger calculations (already memoized)
      if (calculations) {
        setResults({
          hpp: calculations.hpp,
          operasional: calculations.operasional
        });

        // Notify parent component
        if (onCalculationComplete) {
          onCalculationComplete(calculations.hpp, calculations.operasional);
        }

        toast.success('Kalkulasi berhasil!', {
          description: `HPP: ${formatCurrency(calculations.hpp.costPerUnit)}/pcs, Operasional: ${formatCurrency(calculations.operasional.costPerUnit)}/pcs`
        });
      }
    } catch (error) {
      toast.error('Gagal melakukan kalkulasi');
      console.error('Calculation error:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  // Fetch 30-day production output
  const handleFetchProductionOutput = async () => {
    setIsFetchingProduction(true);
    
    try {
      const result = await productionOutputApi.getSmartProductionOutput(30);
      
      if (result.error) {
        toast.error('Gagal mengambil data produksi', {
          description: result.error
        });
        return;
      }

      if (result.data) {
        setProductionData(result.data);
        setTargetOutput(result.data.monthlyEstimate);
        
        // Show confidence indicator
        const confidenceText = {
          'high': 'Tinggi (data lengkap)',
          'medium': 'Sedang (data terbatas)',
          'low': 'Rendah (estimasi)'
        }[result.data.confidence];
        
        const sourceText = {
          'orders': 'data pesanan',
          'recipes': 'kapasitas resep',
          'manual': 'estimasi default'
        }[result.data.dataSource];

        toast.success('Data produksi berhasil diambil!', {
          description: `${result.data.monthlyEstimate.toLocaleString()} pcs/bulan (dari ${sourceText}, tingkat keyakinan: ${confidenceText})`
        });
      }
    } catch (error) {
      toast.error('Gagal mengambil data produksi');
      console.error('Production fetch error:', error);
    } finally {
      setIsFetchingProduction(false);
    }
  };

  // Save calculation results to app settings
  const handleSaveResults = async () => {
    if (!results.hpp || !results.operasional) {
      toast.error('Tidak ada hasil kalkulasi untuk disimpan');
      return;
    }

    setIsSaving(true);
    
    try {
      const response = await appSettingsApi.calculateAndUpdateCosts(
        results.hpp.totalCosts,
        results.operasional.totalCosts,
        targetOutput
      );

      if (response.error) {
        toast.error('Gagal menyimpan hasil kalkulasi', {
          description: response.error
        });
      } else {
        toast.success('Hasil kalkulasi berhasil disimpan!', {
          description: 'HPP akan menggunakan nilai overhead yang baru'
        });
      }
    } catch (error) {
      toast.error('Gagal menyimpan hasil kalkulasi');
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Get current group result
  const currentResult = selectedGroup === 'hpp' ? results.hpp : results.operasional;
  const currentCosts = selectedGroup === 'hpp' ? hppCosts : operasionalCosts;

  return (
    <div className={`space-y-6 ${className}`}>
      
      {/* Header */}
      <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <Calculator className="h-6 w-6" />
            Kalkulator Dual-Mode Biaya Operasional
          </CardTitle>
          <p className="text-sm text-orange-700">
            Pisahkan biaya Overhead Pabrik (masuk HPP) dan Biaya Operasional (di luar HPP)
          </p>
        </CardHeader>
      </Card>

      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            Pengaturan Kalkulasi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Target Output Input */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Target Produksi Bulanan (30 hari) *
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="1"
                step="1"
                value={targetOutput}
                onChange={(e) => setTargetOutput(Number(e.target.value))}
                placeholder="3000"
                className="max-w-xs"
              />
              <span className="text-sm text-gray-500">pcs/bulan</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleFetchProductionOutput}
                disabled={isFetchingProduction}
                className="ml-2"
              >
                {isFetchingProduction ? (
                  <>
                    <Zap className="h-3 w-3 mr-1 animate-pulse" />
                    Loading...
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Auto (30 hari)
                  </>
                )}
              </Button>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-gray-600">
                Default berdasarkan total output 30 hari terakhir
              </p>
              {productionData && (
                <div className="text-xs text-green-600 bg-green-50 p-2 rounded border border-green-200">
                  📊 Data produksi: {productionData.totalPcs.toLocaleString()} pcs dari {productionData.dataSource === 'orders' ? 'pesanan' : productionData.dataSource === 'recipes' ? 'resep' : 'estimasi'} 
                  ({productionData.startDate} - {productionData.endDate})
                  <br />
                  Tingkat keyakinan: {productionData.confidence === 'high' ? 'Tinggi' : productionData.confidence === 'medium' ? 'Sedang' : 'Rendah'}
                </div>
              )}
            </div>
          </div>

          {/* Group Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Pilih Kelompok Biaya</Label>
            <div className="flex gap-2">
              <Button
                  variant={selectedGroup === 'hpp' ? 'default' : 'outline'}
                  className="flex-1 flex items-center gap-2"
                  onClick={() => setSelectedGroup('hpp')}
              >
                <Package className="h-4 w-4" />
                Overhead Pabrik ({hppCosts.length})
              </Button>
              <Button
                  variant={selectedGroup === 'operasional' ? 'default' : 'outline'}
                  className="flex-1 flex items-center gap-2"
                  onClick={() => setSelectedGroup('operasional')}
              >
                <TrendingUp className="h-4 w-4" />
                Operasional ({operasionalCosts.length})
              </Button>
            </div>
          </div>

          {/* Calculate Button */}
          <div className="pt-2">
            <Button
              onClick={handleCalculate}
              disabled={isCalculating || targetOutput <= 0}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isCalculating ? (
                <>
                  <Zap className="h-4 w-4 mr-2 animate-pulse" />
                  Menghitung...
                </>
              ) : (
                <>
                  <Calculator className="h-4 w-4 mr-2" />
                  Hitung Biaya per Pcs
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current Group Summary */}
      {currentCosts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Ringkasan {selectedGroup === 'hpp' ? 'Overhead Pabrik' : 'Biaya Operasional'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {currentCosts.map((cost) => (
                <div key={cost.id} className="flex justify-between items-center py-2">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{cost.nama_biaya}</p>
                    <p className="text-xs text-gray-500 capitalize">
                      {cost.jenis} • {cost.status}
                    </p>
                  </div>
                  <Badge variant="outline" className="ml-2">
                    {formatCurrency(cost.jumlah_per_bulan)}/bulan
                  </Badge>
                </div>
              ))}
              
              <Separator />
              
              <div className="flex justify-between items-center font-semibold">
                <span>Total Bulanan:</span>
                <span className="text-lg">
                  {formatCurrency(
                    currentCosts.reduce((sum, c) => sum + c.jumlah_per_bulan, 0)
                  )}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Section */}
      {results.hpp && results.operasional && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              Hasil Kalkulasi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Results Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* HPP Results */}
              <div className="bg-white p-4 rounded-lg border">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-purple-800 flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Overhead Pabrik (HPP)
                  </h4>
                  {!results.hpp.isValid && (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  )}
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Biaya:</span>
                    <span className="font-medium">
                      {formatCurrency(results.hpp.totalCosts)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Target Output:</span>
                    <span className="font-medium">
                      {results.hpp.targetOutput.toLocaleString()} pcs
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold text-purple-700">
                    <span>Biaya per Pcs:</span>
                    <span className="text-lg">
                      {formatCurrency(results.hpp.costPerUnit)}
                    </span>
                  </div>
                </div>
                
                {results.hpp.validationErrors.length > 0 && (
                  <Alert className="mt-3">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      {results.hpp.validationErrors.join(', ')}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Operasional Results */}
              <div className="bg-white p-4 rounded-lg border">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-blue-800 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Biaya Operasional
                  </h4>
                  {!results.operasional.isValid && (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  )}
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Biaya:</span>
                    <span className="font-medium">
                      {formatCurrency(results.operasional.totalCosts)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Target Output:</span>
                    <span className="font-medium">
                      {results.operasional.targetOutput.toLocaleString()} pcs
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold text-blue-700">
                    <span>Biaya per Pcs:</span>
                    <span className="text-lg">
                      {formatCurrency(results.operasional.costPerUnit)}
                    </span>
                  </div>
                </div>
                
                {results.operasional.validationErrors.length > 0 && (
                  <Alert className="mt-3">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      {results.operasional.validationErrors.join(', ')}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>

            {/* Usage Information */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>Cara Penggunaan:</strong><br />
                • <strong>Overhead Pabrik</strong> ({formatCurrency(results.hpp.costPerUnit)}/pcs) → 
                Ditambahkan ke HPP resep<br />
                • <strong>Biaya Operasional</strong> ({formatCurrency(results.operasional.costPerUnit)}/pcs) → 
                Untuk analisis BEP dan pricing, tidak masuk HPP
              </AlertDescription>
            </Alert>

            {/* Save Button */}
            {results.hpp.isValid && results.operasional.isValid && (
              <div className="pt-2">
                <Button
                  onClick={handleSaveResults}
                  disabled={isSaving}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSaving ? (
                    <>
                      <Zap className="h-4 w-4 mr-2 animate-pulse" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Gunakan Angka Ini
                    </>
                  )}
                </Button>
                <p className="text-xs text-gray-600 mt-2">
                  Akan disimpan ke pengaturan global untuk digunakan dalam perhitungan HPP
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {currentCosts.length === 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Belum ada biaya {selectedGroup === 'hpp' ? 'Overhead Pabrik' : 'Operasional'} yang aktif. 
            Tambahkan biaya terlebih dahulu untuk melakukan kalkulasi.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default DualModeCalculator;