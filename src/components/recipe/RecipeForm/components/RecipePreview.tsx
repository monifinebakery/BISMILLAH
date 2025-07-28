import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calculator, TrendingUp, Package, AlertTriangle } from 'lucide-react';
import { formatCurrency, formatPercentage, getProfitColorClass } from '../../shared/utils/recipeFormatters';

interface BahanResep {
  id: string;
  nama: string;
  jumlah: number;
  satuan: string;
  hargaSatuan: number;
  totalHarga: number;
}

interface RecipePreviewProps {
  namaResep: string;
  kategoriResep?: string;
  jumlahPorsi: number;
  jumlahPcsPerPorsi?: number;
  ingredients: BahanResep[];
  totalHpp: number;
  hppPerPorsi: number;
  hppPerPcs?: number;
  hargaJualPorsi: number;
  hargaJualPerPcs?: number;
  profitPerPorsi: number;
  profitPerPcs?: number;
  marginPercentage: number;
  isValid: boolean;
  errors: string[];
}

export const RecipePreview: React.FC<RecipePreviewProps> = ({
  namaResep,
  kategoriResep,
  jumlahPorsi,
  jumlahPcsPerPorsi,
  ingredients,
  totalHpp,
  hppPerPorsi,
  hppPerPcs,
  hargaJualPorsi,
  hargaJualPerPcs,
  profitPerPorsi,
  profitPerPcs,
  marginPercentage,
  isValid,
  errors
}) => {
  const marginDecimal = marginPercentage / 100;
  const profitColorClass = getProfitColorClass(marginDecimal);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Package className="h-5 w-5" />
          Ringkasan Resep
        </CardTitle>
        <p className="text-sm text-gray-600">
          Preview kalkulasi HPP dan profit resep
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Validation Errors */}
        {!isValid && errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-red-800 font-medium mb-2">
              <AlertTriangle className="h-4 w-4" />
              Data Belum Valid
            </div>
            <ul className="text-sm text-red-700 space-y-1">
              {errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Recipe Info */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-semibold text-gray-900">
              {namaResep || 'Nama Resep Belum Diisi'}
            </h3>
            {kategoriResep && (
              <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                {kategoriResep}
              </Badge>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Jumlah Porsi:</span>
              <span className="font-medium ml-2">{jumlahPorsi}</span>
            </div>
            {jumlahPcsPerPorsi && jumlahPcsPerPorsi > 1 && (
              <div>
                <span className="text-gray-600">Pcs per Porsi:</span>
                <span className="font-medium ml-2">{jumlahPcsPerPorsi}</span>
              </div>
            )}
          </div>
        </div>

        {/* Ingredients Summary */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Bahan-bahan ({ingredients.length})</h4>
          <div className="bg-gray-50 p-3 rounded-lg max-h-32 overflow-y-auto">
            {ingredients.length > 0 ? (
              <div className="space-y-1 text-sm">
                {ingredients.map((ingredient, index) => (
                  <div key={index} className="flex justify-between">
                    <span>{ingredient.nama} ({ingredient.jumlah} {ingredient.satuan})</span>
                    <span className="font-medium">{formatCurrency(ingredient.totalHarga)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Belum ada bahan yang ditambahkan</p>
            )}
          </div>
        </div>

        {/* HPP Calculation */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Kalkulasi HPP
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total HPP:</span>
                <span className="font-semibold text-orange-600">
                  {formatCurrency(totalHpp)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">HPP per Porsi:</span>
                <span className="font-semibold text-orange-600">
                  {formatCurrency(hppPerPorsi)}
                </span>
              </div>
              {hppPerPcs && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">HPP per Pcs:</span>
                  <span className="font-semibold text-orange-600">
                    {formatCurrency(hppPerPcs)}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Harga Jual per Porsi:</span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(hargaJualPorsi)}
                </span>
              </div>
              {hargaJualPerPcs && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Harga Jual per Pcs:</span>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(hargaJualPerPcs)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Profit Analysis */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Analisis Keuntungan
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Profit per Porsi:</span>
                <span className={`font-semibold ${profitColorClass}`}>
                  {formatCurrency(profitPerPorsi)}
                </span>
              </div>
              {profitPerPcs !== undefined && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Profit per Pcs:</span>
                  <span className={`font-semibold ${profitColorClass}`}>
                    {formatCurrency(profitPerPcs)}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Margin:</span>
                <span className={`font-semibold ${profitColorClass}`}>
                  {formatPercentage(marginDecimal)}
                </span>
              </div>
            </div>
          </div>

          {/* Profit Status */}
          <div className={`p-3 rounded-lg ${
            profitPerPorsi > 0 
              ? 'bg-green-50 border border-green-200' 
              : profitPerPorsi < 0 
                ? 'bg-red-50 border border-red-200'
                : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <p className={`text-sm ${
              profitPerPorsi > 0 
                ? 'text-green-800' 
                : profitPerPorsi < 0 
                  ? 'text-red-800'
                  : 'text-yellow-800'
            }`}>
              {profitPerPorsi > 0 
                ? '✅ Resep ini menguntungkan'
                : profitPerPorsi < 0 
                  ? '⚠️ Resep ini merugi, pertimbangkan untuk menaikkan harga jual atau mengurangi biaya'
                  : '⚡ Break-even, tidak untung tidak rugi'
              }
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};