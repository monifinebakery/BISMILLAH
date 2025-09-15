// src/components/recipe/components/RecipeForm/CostCalculationStep/components/CostInputsCard.tsx

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, 
  Users, 
  Building, 
  TrendingUp, 
  Info,
  RefreshCw,
  Zap,
  Settings,
  AlertCircle,
  Package // ✅ NEW: Icon for pieces per portion
} from 'lucide-react';
import { ResponsiveTooltip } from './shared/ResponsiveTooltip';
import { useOverheadManagement } from '../hooks/useOverheadManagement';
import { formatCurrency } from '../utils/formatters';
import type { CostCalculationData, ValidationErrors } from '../utils/types';

interface CostInputsCardProps {
  data: CostCalculationData;
  errors: ValidationErrors;
  ingredientCost: number;
  onUpdate: (field: keyof CostCalculationData, value: number) => void;
  isLoading?: boolean;
}

export const CostInputsCard: React.FC<CostInputsCardProps> = ({
  data,
  errors,
  ingredientCost,
  onUpdate,
  isLoading = false,
}) => {
  const overheadManagement = useOverheadManagement({
    ingredientCost,
    jumlah_porsi: data.jumlah_porsi,
    currentOverheadCost: data.biaya_overhead,
    onOverheadUpdate: (value) => onUpdate('biaya_overhead', value),
  });

  // ✅ Calculate per-piece costs for display - handle string values
  const jumlah_porsi = typeof data.jumlah_porsi === 'string' \n    ? (data.jumlah_porsi === '' ? 1 : parseInt(data.jumlah_porsi)) || 1\n    : data.jumlah_porsi || 1;\n  const jumlah_pcs_per_porsi = typeof data.jumlah_pcs_per_porsi === 'string'\n    ? (data.jumlah_pcs_per_porsi === '' ? 1 : parseInt(data.jumlah_pcs_per_porsi)) || 1  \n    : (data.jumlah_pcs_per_porsi || 1);\n  const totalPieces = jumlah_porsi * jumlah_pcs_per_porsi;\n  const ingredientCostPerPiece = totalPieces > 0 ? ingredientCost / totalPieces : 0;\n

  return (
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
                {formatCurrency(jumlah_porsi > 0 ? ingredientCost / jumlah_porsi : 0)}
              </Badge>
            </div>
            {/* ✅ NEW: Show per-piece cost if there are multiple pieces per portion */}
            {jumlah_pcs_per_porsi > 1 && (
              <div className="flex justify-between items-center">
                <span className="text-blue-700">Biaya per Pcs:</span>
                <Badge variant="outline" className="text-blue-700 border-blue-300">
                  {formatCurrency(ingredientCostPerPiece)}
                </Badge>
              </div>
            )}
            <div className="text-sm text-blue-600 bg-blue-100 p-2 rounded">
              {data.bahanResep.length} bahan telah dihitung otomatis
              {/* ✅ Show total pieces info */}
              {jumlah_pcs_per_porsi > 1 && (
                <div className="mt-1 text-xs">
                  Total: {jumlah_porsi} porsi × {jumlah_pcs_per_porsi} pcs = {totalPieces} pcs
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ✅ NEW: Portion & Pieces Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Konfigurasi Unit</CardTitle>
          <p className="text-sm text-gray-600">
            Atur jumlah porsi dan pieces per porsi
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Jumlah Pcs per Porsi */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Package className="h-4 w-4 text-gray-500" />
              Jumlah Pcs per Porsi
              <ResponsiveTooltip 
                content={
                  <div className="space-y-2">
                    <p className="font-semibold text-blue-300">📦 Jumlah Pcs per Porsi:</p>
                    <p className="leading-relaxed">Berapa banyak pieces/unit individual yang ada dalam 1 porsi.</p>
                    
                    <div className="border-t border-gray-700 pt-2">
                      <p className="text-green-300">✅ Contoh:</p>
                      <p className="text-gray-300 text-xs ml-4">• Donat: 6 pcs per box (porsi)</p>
                      <p className="text-gray-300 text-xs ml-4">• Kue sus: 12 pcs per tray</p>
                      <p className="text-gray-300 text-xs ml-4">• Nasi box: 1 pcs per porsi</p>
                    </div>
                    
                    <div className="border-t border-gray-700 pt-2">
                      <p className="font-medium text-purple-300">🎯 Manfaat:</p>
                      <p className="text-gray-300 text-xs">Memungkinkan kalkulasi HPP dan harga jual per piece untuk fleksibilitas penjualan.</p>
                    </div>
                  </div>
                }
              >
                <Info className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help" />
              </ResponsiveTooltip>
            </Label>
            <div className="relative">
              <Input
                type="number"
                min="1"
                max="100"
                value={data.jumlah_pcs_per_porsi || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    onUpdate('jumlah_pcs_per_porsi', '');
                  } else {
                    const numValue = parseInt(value);
                    if (!isNaN(numValue) && numValue > 0) {
                      onUpdate('jumlah_pcs_per_porsi', numValue);
                    }
                  }
                }}
                placeholder="1"
                className={''}
                disabled={isLoading}
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                pcs
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Berapa pieces dalam 1 porsi? (Default: 1 pcs = 1 porsi)
            </p>
            
            {/* Quick suggestion buttons */}
            <div className="flex gap-1 flex-wrap items-center">
              <p className="text-xs text-gray-400 mr-2">Coba:</p>
              {[1, 6, 12, 24].map((pcs) => (
                <button
                  key={pcs}
                  type="button"
                  onClick={() => onUpdate('jumlah_pcs_per_porsi', pcs)}
                  className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded border text-gray-600 hover:text-gray-800 transition-colors"
                  disabled={isLoading}
                >
                  {pcs} pcs
                </button>
              ))}
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
          


          {/* Overhead Cost - keeping existing implementation */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Building className="h-4 w-4 text-gray-500" />
                Biaya Overhead
                <ResponsiveTooltip 
                  content={
                    <div className="space-y-2">
                      <p className="font-semibold text-purple-300">🏢 Biaya Overhead:</p>
                      <p className="leading-relaxed">Biaya tidak langsung yang diperlukan untuk menjalankan operasional produksi tapi tidak terkait langsung dengan bahan baku atau tenaga kerja.</p>
                      
                      <div className="border-t border-gray-700 pt-2">
                        <p className="text-green-300">✅ Termasuk:</p>
                        <p className="text-gray-300 text-xs ml-4">• Listrik, gas, air</p>
                        <p className="text-gray-300 text-xs ml-4">• Sewa tempat/kitchen</p>
                        <p className="text-gray-300 text-xs ml-4">• Peralatan & maintenance</p>
                        <p className="text-gray-300 text-xs ml-4">• Asuransi, ijin usaha</p>
                      </div>
                      
                      <div className="border-t border-gray-700 pt-2">
                        <p className="font-medium text-blue-300">🤖 Mode Auto:</p>
                        <p className="text-gray-300 text-xs">Dihitung otomatis dari data biaya operasional yang sudah diinput di menu Biaya Operasional.</p>
                      </div>
                      
                      <div className="border-t border-gray-700 pt-2">
                        <p className="font-medium text-orange-300">✋ Mode Manual:</p>
                        <p className="text-gray-300 text-xs">Input manual berdasarkan estimasi atau data aktual overhead untuk batch produksi ini.</p>
                      </div>
                    </div>
                  }
                >
                  <Info className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help" />
                </ResponsiveTooltip>
              </Label>
              
              {/* Auto/Manual Toggle */}
              <div className="flex items-center gap-2">
                {overheadManagement.isAuthenticated && (
                  <>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={overheadManagement.refreshOverheadCalculation}
                      disabled={overheadManagement.isCalculating}
                      className="text-xs h-6 px-2"
                    >
                      <RefreshCw className={`h-3 w-3 mr-1 ${overheadManagement.isCalculating ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                    <Button
                      type="button"
                      variant={overheadManagement.isUsingAutoOverhead ? "default" : "outline"}
                      size="sm"
                      onClick={overheadManagement.toggleOverheadMode}
                      className="text-xs h-6 px-2"
                    >
                      {overheadManagement.isUsingAutoOverhead ? (
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
            {overheadManagement.isUsingAutoOverhead && overheadManagement.overheadCalculation && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-2">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">Auto-calculated from Operational Costs</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-green-600">Overhead per Unit:</span>
                    <p className="font-semibold text-green-900">
                      {formatCurrency(overheadManagement.overheadCalculation.overhead_per_unit)}
                    </p>
                  </div>
                  <div>
                    <span className="text-green-600">Total untuk {data.jumlahPorsi} porsi:</span>
                    <p className="font-semibold text-green-900">
                      {formatCurrency(overheadManagement.overheadCalculation.overhead_per_unit * data.jumlahPorsi)}
                    </p>
                  </div>
                  {/* ✅ NEW: Show per-piece overhead if applicable */}
                  {(data.jumlahPcsPerPorsi || 1) > 1 && (
                    <div className="col-span-full">
                      <span className="text-green-600">Overhead per Pcs:</span>
                      <p className="font-semibold text-green-900">
                        {formatCurrency(overheadManagement.overheadCalculation.overhead_per_unit / (data.jumlahPcsPerPorsi || 1))}
                      </p>
                    </div>
                  )}
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
                value={data.biayaOverhead?.toString() || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow empty string for better UX during typing
                  if (value === '') {
                    overheadManagement.setManualOverhead(0);
                  } else {
                    const numValue = parseFloat(value);
                    if (!isNaN(numValue)) {
                      overheadManagement.setManualOverhead(numValue);
                    }
                  }
                }}
                placeholder="0"
                className={`pl-8 ${errors.biayaOverhead ? 'border-red-300 focus:border-red-500' : ''} ${
                  overheadManagement.isUsingAutoOverhead ? 'bg-green-50 border-green-200' : ''
                }`}
                disabled={isLoading}
              />
            </div>

            {errors.biayaOverhead && (
              <p className="text-sm text-red-600">{errors.biayaOverhead}</p>
            )}

            {/* Error/Warning Messages */}
            {overheadManagement.error && (
              <div className="bg-red-50 border border-red-200 rounded p-2">
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {overheadManagement.error}
                </p>
              </div>
            )}

            {!overheadManagement.isAuthenticated && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                <p className="text-xs text-yellow-700">
                  Login untuk menggunakan auto-calculate overhead dari biaya operasional
                </p>
              </div>
            )}

            <p className="text-xs text-gray-500">
              {overheadManagement.isUsingAutoOverhead 
                ? `Dihitung dari biaya operasional per unit × ${data.jumlahPorsi} porsi`
                : "Listrik, gas, sewa tempat, dll. untuk batch ini"
              }
              {/* ✅ Show per-piece context */}
              {(data.jumlahPcsPerPorsi || 1) > 1 && (
                <span className="text-blue-600"> ({totalPieces} pcs total)</span>
              )}
            </p>
          </div>

          {/* Profit Margin - keeping existing enhanced version */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-gray-500" />
              Margin Keuntungan (%)
              <ResponsiveTooltip 
                content={
                  <div className="space-y-2">
                    <p className="font-semibold text-green-300">📈 Margin Keuntungan:</p>
                    <p className="leading-relaxed">Persentase keuntungan yang diinginkan dari total biaya produksi (HPP). Ini akan menentukan harga jual produk Anda.</p>
                    
                    <div className="border-t border-gray-700 pt-2">
                      <p className="font-medium text-blue-300">📊 Contoh Perhitungan:</p>
                      <p className="text-xs bg-gray-800 p-2 rounded mt-1">
                        HPP: Rp 10.000<br/>
                        Margin: 30%<br/>
                        Keuntungan: Rp 3.000<br/>
                        <span className="text-green-300">Harga Jual: Rp 13.000</span>
                      </p>
                    </div>
                    
                    <div className="border-t border-gray-700 pt-2">
                      <p className="text-yellow-300">💡 Rekomendasi Margin:</p>
                      <p className="text-gray-300 text-xs ml-4">• <span className="text-red-300">10-15%</span>: Rendah, risiko rugi</p>
                      <p className="text-gray-300 text-xs ml-4">• <span className="text-yellow-300">15-30%</span>: Wajar untuk F&B</p>
                      <p className="text-gray-300 text-xs ml-4">• <span className="text-green-300">30%+</span>: Ideal, sustainable</p>
                    </div>
                    
                    <div className="border-t border-gray-700 pt-2">
                      <p className="font-medium text-purple-300">🎯 Tips:</p>
                      <p className="text-gray-300 text-xs">Pertimbangkan harga kompetitor dan daya beli target market saat menentukan margin.</p>
                    </div>
                  </div>
                }
              >
                <Info className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help" />
              </ResponsiveTooltip>
            </Label>
            
            {/* Warning Alert - Show when margin is empty */}
            {(!data.marginKeuntunganPersen || data.marginKeuntunganPersen === 0) && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-medium text-amber-800">
                    Margin keuntungan belum diisi!
                  </span>
                </div>
                <p className="text-xs text-amber-700 mt-1">
                  Silakan masukkan persentase margin yang diinginkan untuk menghitung harga jual.
                </p>
              </div>
            )}
            
            <div className="relative">
              <Input
                type="number"
                min="0"
                max="1000"
                step="0.1"
                value={data.marginKeuntunganPersen?.toString() || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow empty string for better UX during typing
                  if (value === '') {
                    onUpdate('marginKeuntunganPersen', 0);
                  } else {
                    const numValue = parseFloat(value);
                    if (!isNaN(numValue)) {
                      onUpdate('marginKeuntunganPersen', numValue);
                    }
                  }
                }}
                placeholder="Contoh: 25"
                className={`pr-8 ${
                  errors.marginKeuntunganPersen ? 'border-red-300 focus:border-red-500' : 
                  (!data.marginKeuntunganPersen || data.marginKeuntunganPersen === 0) ? 'border-amber-300 focus:border-amber-500' : 
                  'border-green-300 focus:border-green-500'
                }`}
                disabled={isLoading}
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                %
              </span>
            </div>
            
            {errors.marginKeuntunganPersen && (
              <p className="text-sm text-red-600">{errors.marginKeuntunganPersen}</p>
            )}
            
            {/* Enhanced help text */}
            <div className="space-y-1">
              <p className="text-xs text-gray-500">
                Persentase keuntungan yang diinginkan dari total biaya produksi
              </p>
              
              {/* Quick suggestion buttons */}
              <div className="flex gap-1 flex-wrap items-center">
                <p className="text-xs text-gray-400 mr-2">Coba:</p>
                {[15, 20, 25, 30, 35].map((percent) => (
                  <button
                    key={percent}
                    type="button"
                    onClick={() => onUpdate('marginKeuntunganPersen', percent)}
                    className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded border text-gray-600 hover:text-gray-800 transition-colors"
                    disabled={isLoading}
                  >
                    {percent}%
                  </button>
                ))}
              </div>
            </div>
            
            {/* Current margin status */}
            {data.marginKeuntunganPersen && data.marginKeuntunganPersen > 0 && (
              <div className={`text-xs p-2 rounded-lg border ${
                data.marginKeuntunganPersen >= 30 ? 'bg-green-50 text-green-700 border-green-200' :
                data.marginKeuntunganPersen >= 15 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                'bg-red-50 text-red-700 border-red-200'
              }`}>
                <div className="flex items-center gap-1">
                  {data.marginKeuntunganPersen >= 30 ? 
                    <>✅ <span className="font-medium">Margin sangat baik!</span> Sustainable untuk jangka panjang.</> :
                   data.marginKeuntunganPersen >= 15 ? 
                    <>⚠️ <span className="font-medium">Margin cukup wajar</span> untuk industri F&B.</> :
                    <>❌ <span className="font-medium">Margin terlalu rendah</span>, pertimbangkan untuk dinaikkan.</>
                  }
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};