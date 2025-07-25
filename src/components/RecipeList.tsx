// src/components/RecipeList.tsx
// 🧮 UPDATED WITH HPP PER PCS CALCULATION SUPPORT

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Edit, Trash2, ChefHat, Users, DollarSign, Package, Calculator, TrendingUp } from "lucide-react";
import { Recipe } from "@/types/recipe";
import { formatCurrency, formatPercentage } from '@/utils/formatUtils';
import { formatDateForDisplay } from '@/utils/unifiedDateUtils';

interface RecipeListProps {
  recipes: Recipe[];
  onEdit: (recipe: Recipe) => void;
  onDelete: (id: string) => void;
  onDuplicate?: (recipe: Recipe) => void;
}

const RecipeList = ({ recipes, onEdit, onDelete, onDuplicate }: RecipeListProps) => {
  if (recipes.length === 0) {
    return (
      <div className="text-center py-12">
        <ChefHat className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Resep</h3>
        <p className="text-gray-500 mb-6">Mulai dengan membuat resep pertama Anda</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
      {recipes.map((recipe) => {
        // Calculate metrics with safe fallbacks
        const profitPerPorsi = (recipe.hargaJualPorsi || 0) - (recipe.hppPerPorsi || 0);
        const profitPerPcs = (recipe.hargaJualPerPcs || 0) - (recipe.hppPerPcs || 0);
        const marginPercent = (recipe.hargaJualPorsi || 0) > 0 ? (profitPerPorsi / (recipe.hargaJualPorsi || 1)) * 100 : 0;
        const hasPerPcsData = recipe.hppPerPcs && recipe.hargaJualPerPcs && recipe.jumlahPcsPerPorsi;

        return (
          <Card
            key={recipe.id}
            className="shadow-lg border-0 bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            {/* Header */}
            <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg font-semibold mb-2 line-clamp-2 break-words">
                    {recipe.namaResep}
                  </CardTitle>
                  <div className="flex items-center gap-4 text-orange-100 text-sm">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      <span>{recipe.jumlahPorsi} porsi</span>
                    </div>
                    {hasPerPcsData && (
                      <div className="flex items-center">
                        <Package className="h-4 w-4 mr-1" />
                        <span>{recipe.jumlahPcsPerPorsi} pcs/porsi</span>
                      </div>
                    )}
                  </div>
                </div>
                <ChefHat className="h-6 w-6 text-orange-100 flex-shrink-0 ml-2" />
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-4">
              {/* Category & Description */}
              <div className="space-y-2">
                {recipe.kategoriResep && (
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-xs">
                    {recipe.kategoriResep}
                  </Badge>
                )}
                {recipe.deskripsi && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {recipe.deskripsi}
                  </p>
                )}
              </div>

              {/* Ingredients Count */}
              <div className="text-sm text-gray-500">
                <span className="font-medium">{recipe.bahanResep?.length || 0}</span> bahan resep
              </div>

              <Separator />

              {/* Financial Info - Per Porsi */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Calculator className="h-4 w-4" />
                  <span>Per Porsi</span>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="space-y-1">
                    <span className="text-gray-600">Total HPP:</span>
                    <div className="font-medium text-blue-600">
                      {formatCurrency(recipe.totalHpp || 0)}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-gray-600">HPP/Porsi:</span>
                    <div className="font-medium text-blue-600">
                      {formatCurrency(recipe.hppPerPorsi || 0)}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-gray-600">Harga Jual:</span>
                    <div className="font-semibold text-green-600">
                      {formatCurrency(recipe.hargaJualPorsi || 0)}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-gray-600">Profit:</span>
                    <div className="font-semibold text-green-600">
                      {formatCurrency(profitPerPorsi)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial Info - Per PCS (if available) */}
              {hasPerPcsData && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Package className="h-4 w-4" />
                      <span>Per Pcs</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="space-y-1">
                        <span className="text-gray-600">HPP/Pcs:</span>
                        <div className="font-medium text-blue-600">
                          {formatCurrency(recipe.hppPerPcs || 0)}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-gray-600">Harga Jual:</span>
                        <div className="font-semibold text-green-600">
                          {formatCurrency(recipe.hargaJualPerPcs || 0)}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-gray-600">Profit/Pcs:</span>
                        <div className="font-semibold text-green-600">
                          {formatCurrency(profitPerPcs)}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-gray-600">Total Pcs:</span>
                        <div className="font-medium text-gray-700">
                          {(recipe.jumlahPorsi || 1) * (recipe.jumlahPcsPerPorsi || 1)} pcs
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <Separator />

              {/* Margin & Profitability */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg border border-green-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-green-700 font-medium flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    Profitabilitas
                  </span>
                  <Badge 
                    variant={marginPercent >= 30 ? "default" : marginPercent >= 20 ? "secondary" : "destructive"}
                    className={
                      marginPercent >= 30 
                        ? "bg-green-500 hover:bg-green-600" 
                        : marginPercent >= 20 
                        ? "bg-yellow-500 hover:bg-yellow-600" 
                        : "bg-red-500 hover:bg-red-600"
                    }
                  >
                    {formatPercentage(marginPercent / 100)}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-green-700">
                    <span className="font-medium">Margin:</span> {recipe.marginKeuntunganPersen}%
                  </div>
                  <div className="text-green-700">
                    <span className="font-medium">ROI:</span> {formatPercentage((profitPerPorsi / (recipe.hppPerPorsi || 1)))}
                  </div>
                </div>
              </div>

              {/* Recipe Composition Summary */}
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                <div className="text-sm text-blue-700">
                  <div className="font-medium mb-1">Komposisi Biaya:</div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Bahan Baku:</span>
                      <span className="font-medium">
                        {formatCurrency(Math.max(0, (recipe.totalHpp || 0) - (recipe.biayaTenagaKerja || 0) - (recipe.biayaOverhead || 0)))}
                      </span>
                    </div>
                    {(recipe.biayaTenagaKerja || 0) > 0 && (
                      <div className="flex justify-between">
                        <span>Tenaga Kerja:</span>
                        <span className="font-medium">{formatCurrency(recipe.biayaTenagaKerja || 0)}</span>
                      </div>
                    )}
                    {(recipe.biayaOverhead || 0) > 0 && (
                      <div className="flex justify-between">
                        <span>Overhead:</span>
                        <span className="font-medium">{formatCurrency(recipe.biayaOverhead || 0)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className="text-xs text-gray-400 border-t pt-3 space-y-1">
                <div>Dibuat: {formatDateForDisplay(recipe.createdAt)}</div>
                {recipe.updatedAt && recipe.createdAt && recipe.updatedAt.getTime() !== recipe.createdAt.getTime() && (
                  <div>Diupdate: {formatDateForDisplay(recipe.updatedAt)}</div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(recipe)}
                  className="flex-1 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-colors"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                
                {onDuplicate && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDuplicate(recipe)}
                    className="hover:bg-green-50 hover:text-green-600 hover:border-green-300 transition-colors"
                  >
                    <Package className="h-4 w-4" />
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(recipe.id)}
                  className="hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default RecipeList;