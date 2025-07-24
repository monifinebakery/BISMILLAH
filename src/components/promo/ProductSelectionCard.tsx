// components/promo/ProductSelectionCard.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, TrendingDown, TrendingUp, Sparkles } from 'lucide-react';
import { formatCurrency, formatPercentage } from '@/utils/currencyUtils';

interface Recipe {
  id: string;
  namaResep: string;
  hppPerPorsi: number;
  hargaJualPorsi: number;
}

interface OriginalValues {
  hpp: number;
  price: number;
  marginRp: number;
  marginPercent: number;
}

interface Props {
  recipes: Recipe[];
  selectedRecipeId: string;
  onRecipeSelect: (recipeId: string) => void;
  selectedRecipe: Recipe | null;
  originalValues: OriginalValues;
}

// 📊 Value Display Card
const ValueCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
}> = ({ icon, label, value, bgColor, textColor, borderColor }) => (
  <div className={`p-4 ${bgColor} rounded-xl border ${borderColor} text-center hover:shadow-md transition-shadow`}>
    <div className="flex items-center justify-center gap-2 mb-2">
      <div className={`${textColor}`}>
        {icon}
      </div>
      <span className={`text-xs font-medium ${textColor} uppercase tracking-wide`}>
        {label}
      </span>
    </div>
    <p className={`text-xl font-bold ${textColor}`}>
      {value}
    </p>
  </div>
);

const ProductSelectionCard: React.FC<Props> = ({
  recipes,
  selectedRecipeId,
  onRecipeSelect,
  selectedRecipe,
  originalValues
}) => {
  return (
    <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
      {/* 📦 Header */}
      <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-lg p-6">
        <CardTitle className="text-xl font-semibold flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <Package className="h-5 w-5" />
          </div>
          1. Pilih Produk Promo
        </CardTitle>
        <CardDescription className="text-orange-100">
          Pilih produk yang akan dijadikan promo
        </CardDescription>
      </CardHeader>

      {/* 🎯 Product Selection */}
      <CardContent className="p-6">
        <Select onValueChange={onRecipeSelect} value={selectedRecipeId}>
          <SelectTrigger className="w-full border-orange-200 hover:border-orange-300 transition-colors h-12">
            <SelectValue placeholder="Pilih Produk/Resep..." className="text-gray-600" />
          </SelectTrigger>
          <SelectContent className="bg-white border-orange-200 shadow-xl">
            {recipes.map((recipe) => (
              <SelectItem
                key={recipe.id}
                value={recipe.id}
                className="hover:bg-orange-50 text-gray-800 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-orange-500" />
                  <span className="font-medium">{recipe.namaResep}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
      
      {/* 📊 Original Values Display */}
      {selectedRecipe && (
        <CardContent className="p-6 pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <ValueCard
              icon={<TrendingDown className="h-4 w-4" />}
              label="HPP"
              value={formatCurrency(originalValues.hpp)}
              bgColor="bg-gradient-to-br from-orange-100 to-orange-50"
              textColor="text-orange-800"
              borderColor="border-orange-200"
            />
            
            <ValueCard
              icon={<TrendingUp className="h-4 w-4" />}
              label="Harga Asli"
              value={formatCurrency(originalValues.price)}
              bgColor="bg-gradient-to-br from-red-100 to-red-50"
              textColor="text-red-800"
              borderColor="border-red-200"
            />
            
            <ValueCard
              icon={<Sparkles className="h-4 w-4" />}
              label="Margin"
              value={formatPercentage(originalValues.marginPercent)}
              bgColor="bg-gradient-to-br from-green-100 to-green-50"
              textColor="text-green-800"
              borderColor="border-green-200"
            />
          </div>

          {/* 💡 Additional Info */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 text-blue-700 text-sm">
              <Sparkles className="h-4 w-4 flex-shrink-0" />
              <span>
                <strong>Margin Rp:</strong> {formatCurrency(originalValues.marginRp)} per porsi
              </span>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default ProductSelectionCard;