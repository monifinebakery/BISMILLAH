import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Calculator, TrendingUp } from 'lucide-react';
import { formatCurrency, formatPercentage } from '../../shared/utils/recipeFormatters';

interface RecipePricingProps {
  biayaTenagaKerja: number;
  onBiayaTenagaKerjaChange: (value: number) => void;
  biayaOverhead: number;
  onBiayaOverheadChange: (value: number) => void;
  marginKeuntunganPersen: number;
  onMarginKeuntunganPersenChange: (value: number) => void;
  hargaJualPorsi: number;
  onHargaJualPorsiChange: (value: number) => void;
  hargaJualPerPcs?: number;
  onHargaJualPerPcsChange: (value: number) => void;
  recommendedPricePerPorsi?: number;
  recommendedPricePerPcs?: number;
  hasJumlahPcsPerPorsi: boolean;
  errors?: Record<string, string>;
}

export const RecipePricing: React.FC<RecipePricingProps> = ({
  biayaTenagaKerja,
  onBiayaTenagaKerjaChange,
  biayaOverhead,
  onBiayaOverheadChange,
  marginKeuntunganPersen,
  onMarginKeuntunganPersenChange,
  hargaJualPorsi,
  onHargaJualPorsiChange,
  hargaJualPerPcs,
  onHargaJualPerPcsChange,
  recommendedPricePerPorsi,
  recommendedPricePerPcs,
  hasJumlahPcsPerPorsi,
  errors = {}
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Biaya & Harga Jual
        </CardTitle>
        <p className="text-sm text-gray-600">
          Atur biaya tambahan dan tentukan harga jual produk
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Additional Costs */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Biaya Tambahan</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Biaya Tenaga Kerja */}
            <div className="space-y-2">
              <Label htmlFor="biayaTenagaKerja" className="text-sm font-medium">
                Biaya Tenaga Kerja
              </Label>
              <Input
                id="biayaTenagaKerja"
                type="number"
                min="0"
                value={biayaTenagaKerja || ''}
                onChange={(e) => onBiayaTenagaKerjaChange(Number(e.target.value))}
                placeholder="0"
                className={errors.biayaTenagaKerja ? 'border-red-500' : ''}
              />
              <p className="text-xs text-gray-500">
                Biaya untuk membuat resep ini
              </p>
              {errors.biayaTenagaKerja && (
                <div className="flex items-center gap-1 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {errors.biayaTenagaKerja}
                </div>
              )}
            </div>

            {/* Biaya Overhead */}
            <div className="space-y-2">
              <Label htmlFor="biayaOverhead" className="text-sm font-medium">
                Biaya Overhead
              </Label>
              <Input
                id="biayaOverhead"
                type="number"
                min="0"
                value={biayaOverhead || ''}
                onChange={(e) => onBiayaOverheadChange(Number(e.target.value))}
                placeholder="0"
                className={errors.biayaOverhead ? 'border-red-500' : ''}
              />
              <p className="text-xs text-gray-500">
                Listrik, gas, sewa tempat, dll
              </p>
              {errors.biayaOverhead && (
                <div className="flex items-center gap-1 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {errors.biayaOverhead}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Margin */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Target Margin Keuntungan
          </h4>
          <div className="space-y-2">
            <Label htmlFor="marginKeuntunganPersen" className="text-sm font-medium">
              Margin Keuntungan (%)
            </Label>
            <Input
              id="marginKeuntunganPersen"
              type="number"
              min="0"
              max="1000"
              value={marginKeuntunganPersen || ''}
              onChange={(e) => onMarginKeuntunganPersenChange(Number(e.target.value))}
              placeholder="30"
              className={errors.marginKeuntunganPersen ? 'border-red-500' : ''}
            />
            <p className="text-xs text-gray-500">
              Persentase keuntungan yang diinginkan (contoh: 30 untuk 30%)
            </p>
            {errors.marginKeuntunganPersen && (
              <div className="flex items-center gap-1 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                {errors.marginKeuntunganPersen}
              </div>
            )}
          </div>
        </div>

        {/* Recommended Prices */}
        {recommendedPricePerPorsi && recommendedPricePerPorsi > 0 && (
          <div className="bg-blue-50 p-4 rounded-lg space-y-2">
            <h4 className="font-medium text-blue-900">Harga Rekomendasi</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700">Per Porsi: </span>
                <span className="font-semibold text-blue-900">
                  {formatCurrency(recommendedPricePerPorsi)}
                </span>
              </div>
              {hasJumlahPcsPerPorsi && recommendedPricePerPcs && (
                <div>
                  <span className="text-blue-700">Per Pcs: </span>
                  <span className="font-semibold text-blue-900">
                    {formatCurrency(recommendedPricePerPcs)}
                  </span>
                </div>
              )}
            </div>
            <p className="text-xs text-blue-600">
              Berdasarkan HPP + margin {marginKeuntunganPersen}%
            </p>
          </div>
        )}

        {/* Selling Prices */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Harga Jual Aktual</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Harga Jual Per Porsi */}
            <div className="space-y-2">
              <Label htmlFor="hargaJualPorsi" className="text-sm font-medium">
                Harga Jual per Porsi
              </Label>
              <Input
                id="hargaJualPorsi"
                type="number"
                min="0"
                value={hargaJualPorsi || ''}
                onChange={(e) => onHargaJualPorsiChange(Number(e.target.value))}
                placeholder="0"
                className={errors.hargaJualPorsi ? 'border-red-500' : ''}
              />
              {errors.hargaJualPorsi && (
                <div className="flex items-center gap-1 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {errors.hargaJualPorsi}
                </div>
              )}
            </div>

            {/* Harga Jual Per Pcs */}
            {hasJumlahPcsPerPorsi && (
              <div className="space-y-2">
                <Label htmlFor="hargaJualPerPcs" className="text-sm font-medium">
                  Harga Jual per Pcs
                </Label>
                <Input
                  id="hargaJualPerPcs"
                  type="number"
                  min="0"
                  value={hargaJualPerPcs || ''}
                  onChange={(e) => onHargaJualPerPcsChange(Number(e.target.value))}
                  placeholder="0"
                  className={errors.hargaJualPerPcs ? 'border-red-500' : ''}
                />
                {errors.hargaJualPerPcs && (
                  <div className="flex items-center gap-1 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    {errors.hargaJualPerPcs}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};