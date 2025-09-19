// src/components/recipe/components/CostCalculationSection.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Calculator, Users, Package } from 'lucide-react';
import { NewRecipe } from '../types';
import { formatCurrency } from '@/utils/formatUtils';

interface CalculationResults {
  totalHPP: number;
  hppPerPorsi: number;
  hargaJualPorsi: number;
  hppPerPcs: number;
  hargaJualPerPcs: number;
  totalBahanBaku: number;
  biayaTenagaKerja: number;
  biayaOverhead: number;
}

interface CostCalculationSectionProps {
  formData: NewRecipe;
  calculationResults: CalculationResults | null;
  onInputChange: (field: keyof NewRecipe, value: number) => void;
}

export const CostCalculationSection: React.FC<CostCalculationSectionProps> = ({
  formData,
  calculationResults,
  onInputChange,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Additional Costs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Biaya Tambahan & Margin
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="biayaTenagaKerja">Biaya Tenaga Kerja (Rp) - Sudah termasuk dalam overhead</Label>
            <Input
              id="biayaTenagaKerja"
              type="number"
              min="0"
              value={formData.biayaTenagaKerja || ''}
              onChange={(e) => onInputChange('biayaTenagaKerja', parseFloat(e.target.value) || 0)}
              placeholder="0"
              mobileOptimized
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="biayaOverhead">Biaya Overhead (Rp)</Label>
            <Input
              id="biayaOverhead"
              type="number"
              min="0"
              value={formData.biayaOverhead || ''}
              onChange={(e) => onInputChange('biayaOverhead', parseFloat(e.target.value) || 0)}
              placeholder="0"
              mobileOptimized
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="marginKeuntunganPersen">Margin Keuntungan (%)</Label>
            <Input
              id="marginKeuntunganPersen"
              type="number"
              min="0"
              max="100"
              value={formData.marginKeuntunganPersen || ''}
              onChange={(e) => onInputChange('marginKeuntunganPersen', parseFloat(e.target.value) || 0)}
              placeholder="30"
              mobileOptimized
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Rekomendasi: 20-30% untuk makanan, 40-60% untuk minuman
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Calculation Preview */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <Calculator className="h-5 w-5" />
            Preview Kalkulasi HPP
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {calculationResults ? (
            <>
              {/* Cost Breakdown */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Bahan Baku:</span>
                  <span className="font-medium">{formatCurrency(calculationResults.totalBahanBaku)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Biaya Lainnya:</span>
                  <span className="font-medium">
                    {formatCurrency(calculationResults.biayaTenagaKerja + calculationResults.biayaOverhead)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-base">
                  <span>Total HPP:</span>
                  <span>{formatCurrency(calculationResults.totalHPP)}</span>
                </div>
              </div>

              <Separator />

              {/* Per Porsi & Per PCS Results */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                {/* Per Porsi */}
                <div className="bg-white p-3 rounded-lg border">
                  <div className="flex items-center gap-1 text-blue-700 font-medium mb-2">
                    <Users className="h-4 w-4" />
                    <span>Per Porsi</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-600">HPP:</span>
                      <span className="font-medium">{formatCurrency(calculationResults.hppPerPorsi)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Harga Jual:</span>
                      <span className="font-bold text-green-600">
                        {formatCurrency(calculationResults.hargaJualPorsi)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Per PCS */}
                <div className="bg-white p-3 rounded-lg border">
                  <div className="flex items-center gap-1 text-orange-700 font-medium mb-2">
                    <Package className="h-4 w-4" />
                    <span>Per Pcs</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-600">HPP:</span>
                      <span className="font-medium">{formatCurrency(calculationResults.hppPerPcs)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Harga Jual:</span>
                      <span className="font-bold text-green-600">
                        {formatCurrency(calculationResults.hargaJualPerPcs)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profitability */}
              <div className="bg-gray-800 text-white p-3 rounded-lg">
                <div className="text-center">
                  <div className="text-xs text-gray-300 mb-1">Total Profit Potensi</div>
                  <div className="font-bold text-lg">
                    {formatCurrency((calculationResults.hargaJualPorsi - calculationResults.hppPerPorsi) * 
                      (typeof formData.jumlahPorsi === 'number' ? formData.jumlahPorsi : parseInt(formData.jumlahPorsi as string) || 1))}
                  </div>
                  <div className="text-xs text-gray-300 mt-1">
                    Margin {formData.marginKeuntunganPersen}%
                  </div>
                </div>
              </div>

              {/* Note: Manual selling price inputs are now handled in the CostCalculationStep component */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-700">
                  💡 <strong>Info:</strong> Harga jual dapat diatur secara manual melalui form "Kalkulasi HPP & Harga Jual" 
                  yang muncul setelah menambahkan bahan baku.
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <Calculator className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">
                Tambahkan bahan baku untuk melihat kalkulasi
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};