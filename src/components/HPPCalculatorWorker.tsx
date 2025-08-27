// src/components/HPPCalculatorWorker.tsx
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useHPPCalculation } from '@/hooks/useWebWorker';
import { formatCurrency } from '@/utils/formatters';
import { AlertCircle, Calculator, Zap, TrendingUp } from 'lucide-react';

interface Ingredient {
  nama_bahan: string;
  jumlah: number;
  satuan: string;
  harga_per_satuan: number;
}

interface Recipe {
  id: string;
  nama_resep: string;
  ingredients: Ingredient[];
  portions: number;
  harga_jual?: number;
}

const HPPCalculatorWorker: React.FC = () => {
  const [recipe, setRecipe] = useState<Recipe>({
    id: '1',
    nama_resep: 'Nasi Goreng Spesial',
    ingredients: [
      { nama_bahan: 'Beras', jumlah: 2, satuan: 'cup', harga_per_satuan: 5000 },
      { nama_bahan: 'Telur', jumlah: 2, satuan: 'butir', harga_per_satuan: 2500 },
      { nama_bahan: 'Ayam', jumlah: 200, satuan: 'gram', harga_per_satuan: 35 },
      { nama_bahan: 'Kecap Manis', jumlah: 3, satuan: 'sdm', harga_per_satuan: 500 },
      { nama_bahan: 'Minyak Goreng', jumlah: 2, satuan: 'sdm', harga_per_satuan: 300 }
    ],
    portions: 4,
    harga_jual: 25000
  });

  const [bulkRecipes, setBulkRecipes] = useState<Recipe[]>([]);
  const [overheadPercentage, setOverheadPercentage] = useState(15);
  const [targetMargin, setTargetMargin] = useState(30);

  const {
    calculateHPP,
    calculateBulkHPP,
    optimizeRecipeCosts,
    hppResult,
    bulkResults,
    optimizationResults,
    isProcessing,
    progress,
    error,
    reset
  } = useHPPCalculation();

  const handleCalculateHPP = useCallback(() => {
    calculateHPP({
      ...recipe,
      overheadPercentage: overheadPercentage / 100
    });
  }, [calculateHPP, recipe, overheadPercentage]);

  const handleBulkCalculation = useCallback(() => {
    if (bulkRecipes.length === 0) {
      // Generate sample bulk recipes for demo
      const sampleRecipes = Array.from({ length: 50 }, (_, i) => ({
        ...recipe,
        id: `recipe_${i + 1}`,
        nama_resep: `${recipe.nama_resep} ${i + 1}`,
        ingredients: recipe.ingredients.map(ing => ({
          ...ing,
          harga_per_satuan: ing.harga_per_satuan * (0.8 + Math.random() * 0.4) // Variasi harga ±20%
        }))
      }));
      setBulkRecipes(sampleRecipes);
      
      calculateBulkHPP({
        recipes: sampleRecipes,
        globalOverhead: overheadPercentage / 100
      });
    } else {
      calculateBulkHPP({
        recipes: bulkRecipes,
        globalOverhead: overheadPercentage / 100
      });
    }
  }, [calculateBulkHPP, bulkRecipes, recipe, overheadPercentage]);

  const handleOptimization = useCallback(() => {
    const recipesToOptimize = bulkRecipes.length > 0 ? bulkRecipes : [recipe];
    optimizeRecipeCosts({
      recipes: recipesToOptimize,
      targetMargin: targetMargin / 100,
      maxPriceIncrease: 0.20
    });
  }, [optimizeRecipeCosts, bulkRecipes, recipe, targetMargin]);

  const updateIngredient = (index: number, field: keyof Ingredient, value: any) => {
    const newIngredients = [...recipe.ingredients];
    newIngredients[index] = { ...newIngredients[index], [field]: value };
    setRecipe({ ...recipe, ingredients: newIngredients });
  };

  const addIngredient = () => {
    setRecipe({
      ...recipe,
      ingredients: [...recipe.ingredients, {
        nama_bahan: '',
        jumlah: 0,
        satuan: '',
        harga_per_satuan: 0
      }]
    });
  };

  const removeIngredient = (index: number) => {
    const newIngredients = recipe.ingredients.filter((_, i) => i !== index);
    setRecipe({ ...recipe, ingredients: newIngredients });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Zap className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold">HPP Calculator dengan Web Workers</h2>
        <Badge variant="secondary">High Performance</Badge>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Progress */}
      {isProcessing && progress && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Memproses...</span>
                <span>{progress.processed}/{progress.total} ({progress.percentage}%)</span>
              </div>
              <Progress value={progress.percentage} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Input Resep
            </CardTitle>
            <CardDescription>
              Masukkan detail resep untuk kalkulasi HPP
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Recipe Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nama_resep">Nama Resep</Label>
                <Input
                  id="nama_resep"
                  value={recipe.nama_resep}
                  onChange={(e) => setRecipe({ ...recipe, nama_resep: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="portions">Porsi</Label>
                <Input
                  id="portions"
                  type="number"
                  value={recipe.portions}
                  onChange={(e) => setRecipe({ ...recipe, portions: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="overhead">Overhead (%)</Label>
                <Input
                  id="overhead"
                  type="number"
                  value={overheadPercentage}
                  onChange={(e) => setOverheadPercentage(parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="harga_jual">Harga Jual</Label>
                <Input
                  id="harga_jual"
                  type="number"
                  value={recipe.harga_jual || ''}
                  onChange={(e) => setRecipe({ ...recipe, harga_jual: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <Separator />

            {/* Ingredients */}
            <div>
              <Label className="text-base font-semibold">Bahan-bahan</Label>
              <div className="space-y-3 mt-2">
                {recipe.ingredients.map((ingredient, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-4">
                      <Input
                        placeholder="Nama bahan"
                        value={ingredient.nama_bahan}
                        onChange={(e) => updateIngredient(index, 'nama_bahan', e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        placeholder="Jumlah"
                        value={ingredient.jumlah}
                        onChange={(e) => updateIngredient(index, 'jumlah', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        placeholder="Satuan"
                        value={ingredient.satuan}
                        onChange={(e) => updateIngredient(index, 'satuan', e.target.value)}
                      />
                    </div>
                    <div className="col-span-3">
                      <Input
                        type="number"
                        placeholder="Harga/satuan"
                        value={ingredient.harga_per_satuan}
                        onChange={(e) => updateIngredient(index, 'harga_per_satuan', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="col-span-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeIngredient(index)}
                        disabled={recipe.ingredients.length <= 1}
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={addIngredient}
                className="mt-2"
              >
                + Tambah Bahan
              </Button>
            </div>

            <Separator />

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button
                onClick={handleCalculateHPP}
                disabled={isProcessing}
                className="w-full"
              >
                {isProcessing ? 'Menghitung...' : 'Hitung HPP'}
              </Button>
              
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={handleBulkCalculation}
                  disabled={isProcessing}
                >
                  Bulk Calculation (50 resep)
                </Button>
                
                <div>
                  <Input
                    type="number"
                    placeholder="Target margin %"
                    value={targetMargin}
                    onChange={(e) => setTargetMargin(parseInt(e.target.value) || 0)}
                    className="mb-1"
                  />
                  <Button
                    variant="outline"
                    onClick={handleOptimization}
                    disabled={isProcessing}
                    className="w-full"
                  >
                    Optimasi Biaya
                  </Button>
                </div>
              </div>
              
              <Button
                variant="ghost"
                onClick={reset}
                className="w-full"
              >
                Reset Hasil
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="space-y-4">
          {/* Single HPP Result */}
          {hppResult && (
            <Card>
              <CardHeader>
                <CardTitle className="text-green-600">Hasil Kalkulasi HPP</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Total Biaya Bahan:</span>
                      <p className="font-semibold">{formatCurrency(hppResult.total_ingredient_cost)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Biaya Overhead:</span>
                      <p className="font-semibold">{formatCurrency(hppResult.overhead_cost)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total Biaya:</span>
                      <p className="font-semibold">{formatCurrency(hppResult.total_cost)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">HPP per Porsi:</span>
                      <p className="font-bold text-lg text-green-600">{formatCurrency(hppResult.hpp_per_portion)}</p>
                    </div>
                  </div>
                  
                  {recipe.harga_jual && (
                    <div className="pt-2 border-t">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Harga Jual:</span>
                          <p className="font-semibold">{formatCurrency(recipe.harga_jual)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Margin:</span>
                          <p className={`font-semibold ${
                            ((recipe.harga_jual - hppResult.hpp_per_portion) / recipe.harga_jual) > 0.2 
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            {(((recipe.harga_jual - hppResult.hpp_per_portion) / recipe.harga_jual) * 100).toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Bulk Results */}
          {bulkResults && (
            <Card>
              <CardHeader>
                <CardTitle className="text-blue-600">Hasil Bulk Calculation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Total Resep:</span>
                      <p className="font-semibold">{bulkResults.summary.total_recipes}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Berhasil:</span>
                      <p className="font-semibold text-green-600">{bulkResults.summary.successful}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Gagal:</span>
                      <p className="font-semibold text-red-600">{bulkResults.summary.failed}</p>
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Biaya Semua Resep:</span>
                    <p className="font-bold text-lg">{formatCurrency(bulkResults.summary.total_cost)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Optimization Results */}
          {optimizationResults && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-600">
                  <TrendingUp className="h-5 w-5" />
                  Hasil Optimasi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Resep Perlu Penyesuaian:</span>
                      <p className="font-semibold">{optimizationResults.summary.recipes_needing_price_adjustment}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Rata-rata Peningkatan Margin:</span>
                      <p className="font-semibold text-green-600">
                        {(optimizationResults.summary.average_margin_improvement * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Potensi Penghematan:</span>
                    <p className="font-bold text-lg text-green-600">
                      {formatCurrency(optimizationResults.summary.total_potential_savings)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default HPPCalculatorWorker;