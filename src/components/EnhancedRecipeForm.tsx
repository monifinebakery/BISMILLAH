// src/components/EnhancedRecipeForm.tsx
// 🧮 UPDATED WITH HPP PER PCS CALCULATION SUPPORT

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Calculator, RefreshCw, Package, Users, Info } from "lucide-react";
import { Recipe, NewRecipe, BahanResep } from "@/components/recipe/types";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useBahanBaku } from '@/components/warehouse/context/WarehouseContext';
import { useRecipe } from "@/contexts/RecipeContext";
import { formatCurrency } from "@/utils/formatUtils";

// Auto-Sync HPP Integration (Simplified)
import AutoSyncRecipeDisplay from '@/components/operational-costs/components/AutoSyncRecipeDisplay';
import type { EnhancedHPPCalculationResult } from '@/components/operational-costs/utils/enhancedHppCalculations';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface EnhancedRecipeFormProps {
  initialData?: Recipe | null;
  onSave: (data: NewRecipe) => void;
  onCancel: () => void;
}

const EnhancedRecipeForm = ({ initialData, onSave, onCancel }: EnhancedRecipeFormProps) => {
  // Add defensive check for useBahanBaku
  let bahanBaku: any[] = [];
  try {
    const warehouseContext = useBahanBaku();
    bahanBaku = warehouseContext?.bahanBaku || [];
  } catch (error) {
    console.warn('Failed to get warehouse data in RecipeForm:', error);
    bahanBaku = [];
  }
  const { calculateHPP, validateRecipeData } = useRecipe();
  
  const [formData, setFormData] = useState<NewRecipe>({
    namaResep: "",
    jumlahPorsi: 1,
    kategoriResep: '',
    deskripsi: "",
    fotoUrl: '',
    bahanResep: [],
    biayaTenagaKerja: 0,
    biayaOverhead: 0,
    marginKeuntunganPersen: 30,
    // 🧮 NEW: Per PCS fields
    jumlahPcsPerPorsi: 1,
    // Calculated fields
    totalHpp: 0,
    hppPerPorsi: 0,
    hargaJualPorsi: 0,
    hppPerPcs: 0,
    hargaJualPerPcs: 0,
  });

  const [newIngredient, setNewIngredient] = useState<{
    selectedBahanId: string;
    jumlah: number;
  }>({
    selectedBahanId: "",
    jumlah: 0,
  });

  const [calculationResults, setCalculationResults] = useState<{
    totalHPP: number;
    hppPerPorsi: number;
    hargaJualPorsi: number;
    hppPerPcs: number;
    hargaJualPerPcs: number;
    totalBahanBaku: number;
    biayaTenagaKerja: number;
    biayaOverhead: number;
  } | null>(null);
  const [enhancedHppResult, setEnhancedHppResult] = useState<EnhancedHPPCalculationResult | null>(null);
  // Manual selling prices are now handled directly in the form data
  // No separate manual pricing mode needed

  // Initialize form with existing data
  useEffect(() => {
    if (initialData) {
      const r: any = initialData;
      const normalized = {
        namaResep: r.namaResep ?? r.nama_resep ?? '',
        jumlahPorsi: r.jumlahPorsi ?? r.jumlah_porsi ?? 1,
        kategoriResep: r.kategoriResep ?? r.kategori_resep ?? '',
        deskripsi: r.deskripsi ?? '',
        fotoUrl: r.fotoUrl ?? r.foto_url ?? '',
        bahanResep: Array.isArray(r.bahanResep)
          ? [...r.bahanResep]
          : Array.isArray(r.bahan_resep)
            ? [...r.bahan_resep]
            : [],
        biayaTenagaKerja: r.biayaTenagaKerja ?? r.biaya_tenaga_kerja ?? 0,
        biayaOverhead: r.biayaOverhead ?? r.biaya_overhead ?? 0,
        marginKeuntunganPersen: r.marginKeuntunganPersen ?? r.margin_keuntungan_persen ?? 30,
        jumlahPcsPerPorsi: r.jumlahPcsPerPorsi ?? r.jumlah_pcs_per_porsi ?? 1,
        totalHpp: r.totalHpp ?? r.total_hpp ?? 0,
        hppPerPorsi: r.hppPerPorsi ?? r.hpp_per_porsi ?? 0,
        hargaJualPorsi: r.hargaJualPorsi ?? r.harga_jual_porsi ?? 0,
        hppPerPcs: r.hppPerPcs ?? r.hpp_per_pcs ?? 0,
        hargaJualPerPcs: r.hargaJualPerPcs ?? r.harga_jual_per_pcs ?? 0,
      } as any;
      setFormData(normalized);
    }
  }, [initialData]);

  // Auto-calculate HPP when form data changes (legacy calculation as fallback)
  useEffect(() => {
    // Skip if enhanced HPP result is available (auto-sync takes precedence)
    if (enhancedHppResult) {
      return;
    }
    
    if (formData.bahanResep.length > 0 || formData.biayaTenagaKerja > 0 || formData.biayaOverhead > 0) {
      try {
        const bahanForCalculation = formData.bahanResep.map(bahan => ({
          nama: bahan.nama,
          jumlah: bahan.jumlah,
          satuan: bahan.satuan,
          hargaSatuan: bahan.hargaSatuan,
          totalHarga: bahan.totalHarga,
        }));

        const calculation = calculateHPP(
          bahanForCalculation,
          typeof formData.jumlahPorsi === 'number' ? formData.jumlahPorsi : parseInt(formData.jumlahPorsi) || 1,
          formData.biayaTenagaKerja,
          formData.biayaOverhead,
          formData.marginKeuntunganPersen,
          typeof formData.jumlahPcsPerPorsi === 'number' ? formData.jumlahPcsPerPorsi : parseInt(formData.jumlahPcsPerPorsi as string) || 1
        );

        setCalculationResults(calculation);
        
        // Update form data with calculated HPP values only
        // Selling prices are controlled by the user in the cost calculation step
        setFormData(prev => ({
          ...prev,
          totalHpp: calculation.totalHPP,
          hppPerPorsi: calculation.hppPerPorsi,
          hppPerPcs: calculation.hppPerPcs,
          // Don't override user's selling prices
          hargaJualPorsi: prev.hargaJualPorsi || 0,
          hargaJualPerPcs: prev.hargaJualPerPcs || 0,
        }));

      } catch (error) {
        console.warn('[EnhancedRecipeForm] Calculation error:', error);
        setCalculationResults(null);
      }
    }
  }, [
    formData.bahanResep,
    formData.jumlahPorsi,
    formData.biayaTenagaKerja,
    formData.biayaOverhead,
    formData.marginKeuntunganPersen,
    formData.jumlahPcsPerPorsi,
    calculateHPP,
    isEnhancedHppActive // Add dependency to re-run when enhanced mode changes
  ]);

  // Handle enhanced HPP result updates
  const handleEnhancedHppChange = React.useCallback((result: EnhancedHPPCalculationResult | null) => {
    setEnhancedHppResult(result);
    
    if (result) {
      // Update form data with enhanced results
      setFormData(prev => ({
        ...prev,
        totalHpp: result.totalHPP,
        hppPerPorsi: result.hppPerPorsi,
        hargaJualPorsi: result.hargaJualPerPorsi,
        hppPerPcs: result.hppPerPcs,
        hargaJualPerPcs: result.hargaJualPerPcs,
        biayaOverhead: result.overheadPerPcs * 
          (typeof formData.jumlahPorsi === 'number' ? formData.jumlahPorsi : parseInt(formData.jumlahPorsi) || 1) *
          (typeof formData.jumlahPcsPerPorsi === 'number' ? formData.jumlahPcsPerPorsi : parseInt(formData.jumlahPcsPerPorsi as string) || 1)
      }));
      
      // Update calculation results for display
      setCalculationResults({
        totalHPP: result.totalHPP,
        hppPerPorsi: result.hppPerPorsi,
        hargaJualPorsi: result.hargaJualPerPorsi,
        hppPerPcs: result.hppPerPcs,
        hargaJualPerPcs: result.hargaJualPerPcs,
        totalBahanBaku: result.bahanPerPcs * 
          (typeof formData.jumlahPorsi === 'number' ? formData.jumlahPorsi : parseInt(formData.jumlahPorsi) || 1) *
          (typeof formData.jumlahPcsPerPorsi === 'number' ? formData.jumlahPcsPerPorsi : parseInt(formData.jumlahPcsPerPorsi as string) || 1),
        biayaTenagaKerja: 0, // TKL now included in overhead
        biayaOverhead: result.overheadPerPcs * 
          (typeof formData.jumlahPorsi === 'number' ? formData.jumlahPorsi : parseInt(formData.jumlahPorsi) || 1) *
          (typeof formData.jumlahPcsPerPorsi === 'number' ? formData.jumlahPcsPerPorsi : parseInt(formData.jumlahPcsPerPorsi as string) || 1)
      });
    }
  }, [formData.jumlahPorsi, formData.jumlahPcsPerPorsi]);

  // Note: Enhanced HPP mode is now auto-detected, no manual mode changes needed

  // Memoize recipe data for enhanced HPP integration to prevent infinite re-renders
  const recipeDataForHpp = React.useMemo(() => ({
    bahanResep: formData.bahanResep,
    jumlahPorsi: typeof formData.jumlahPorsi === 'string' ? parseInt(formData.jumlahPorsi) || 1 : formData.jumlahPorsi,
    jumlahPcsPerPorsi: typeof formData.jumlahPcsPerPorsi === 'string' ? parseInt(formData.jumlahPcsPerPorsi) || 1 : (formData.jumlahPcsPerPorsi || 1),
    biayaTenagaKerja: formData.biayaTenagaKerja || 0,
    biayaOverhead: formData.biayaOverhead || 0,
    marginKeuntunganPersen: formData.marginKeuntunganPersen || 0,
  }), [formData.bahanResep, formData.jumlahPorsi, formData.jumlahPcsPerPorsi, formData.biayaTenagaKerja, formData.biayaOverhead, formData.marginKeuntunganPersen]);

  const handleInputChange = (field: keyof NewRecipe, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleIngredientSelectionChange = (bahanId: string) => {
    const selectedBahan = bahanBaku.find(item => item.id === bahanId);
    setNewIngredient({
      selectedBahanId: bahanId,
      jumlah: 0,
    });
    
    if (selectedBahan) {
      toast.info(`${selectedBahan.nama} dipilih - ${formatCurrency(selectedBahan.hargaSatuan)}/${selectedBahan.satuan}`);
    }
  };

  const addIngredient = () => {
    if (!newIngredient.selectedBahanId || newIngredient.jumlah <= 0) {
      toast.error("Pilih bahan dari warehouse dan masukkan jumlah yang valid");
      return;
    }

    const selectedBahan = bahanBaku.find(item => item.id === newIngredient.selectedBahanId);
    if (!selectedBahan) {
      toast.error("Bahan baku tidak ditemukan di warehouse");
      return;
    }

    // Check if ingredient already exists
    const existingIngredient = formData.bahanResep.find(item => item.id === selectedBahan.id);
    if (existingIngredient) {
      toast.error("Bahan sudah ditambahkan. Edit jumlahnya jika diperlukan.");
      return;
    }

    const ingredientToAdd: BahanResep = {
      id: selectedBahan.id,
      nama: selectedBahan.nama,
      jumlah: newIngredient.jumlah,
      satuan: selectedBahan.satuan,
      hargaSatuan: selectedBahan.hargaSatuan,
      totalHarga: selectedBahan.hargaSatuan * newIngredient.jumlah,
    };

    setFormData(prev => ({
      ...prev,
      bahanResep: [...prev.bahanResep, ingredientToAdd],
    }));

    setNewIngredient({
      selectedBahanId: "",
      jumlah: 0,
    });

    toast.success(`${selectedBahan.nama} berhasil ditambahkan`);
  };

  const removeIngredient = (ingredientId: string) => {
    const ingredient = formData.bahanResep.find(item => item.id === ingredientId);
    
    setFormData(prev => ({
      ...prev,
      bahanResep: prev.bahanResep.filter(item => item.id !== ingredientId),
    }));

    if (ingredient) {
      toast.success(`${ingredient.nama} dihapus dari resep`);
    }
  };

  const updateIngredientQuantity = (ingredientId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      toast.error("Jumlah harus lebih dari 0");
      return;
    }

    setFormData(prev => ({
      ...prev,
      bahanResep: prev.bahanResep.map(item => {
        if (item.id === ingredientId) {
          return {
            ...item,
            jumlah: newQuantity,
            totalHarga: item.hargaSatuan * newQuantity
          };
        }
        return item;
      })
    }));
  };

  const refreshIngredientPrices = () => {
    let hasChanges = false;
    const updatedIngredients = formData.bahanResep.map(ingredient => {
      const currentBahan = bahanBaku.find(b => b.id === ingredient.id);
      if (currentBahan && currentBahan.hargaSatuan !== ingredient.hargaSatuan) {
        hasChanges = true;
        return {
          ...ingredient,
          hargaSatuan: currentBahan.hargaSatuan,
          totalHarga: ingredient.jumlah * currentBahan.hargaSatuan,
        };
      }
      return ingredient;
    });

    if (hasChanges) {
      setFormData(prev => ({ ...prev, bahanResep: updatedIngredients }));
      toast.success("Harga bahan baku diperbarui sesuai data gudang");
    } else {
      toast.info("Semua harga sudah menggunakan data terkini");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clean up form data - convert string values to numbers before validation and submission
    const cleanFormData = {
      ...formData,
      jumlahPorsi: typeof formData.jumlahPorsi === 'number' ? formData.jumlahPorsi : parseInt(formData.jumlahPorsi) || 1,
      jumlahPcsPerPorsi: typeof formData.jumlahPcsPerPorsi === 'number' ? formData.jumlahPcsPerPorsi : parseInt(formData.jumlahPcsPerPorsi as string) || 1,
    };
    
    // Validate using context validation
    const validation = validateRecipeData(cleanFormData);
    if (!validation.isValid) {
      toast.error(`Data resep tidak valid: ${validation.errors.join(', ')}`);
      return;
    }

    onSave(cleanFormData);
  };

  const totalPcsProduced = (
    (typeof formData.jumlahPorsi === 'number' ? formData.jumlahPorsi : parseInt(formData.jumlahPorsi) || 1) *
    (typeof formData.jumlahPcsPerPorsi === 'number' ? formData.jumlahPcsPerPorsi : parseInt(formData.jumlahPcsPerPorsi as string) || 1)
  );
  const totalIngredientCost = formData.bahanResep.reduce((sum, item) => sum + item.totalHarga, 0);

  return (
    <div className="space-y-6 recipe-form-mobile">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Informasi Dasar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="namaResep">Nama Resep *</Label>
                <Input
                  id="namaResep"
                  value={formData.namaResep}
                  onChange={(e) => handleInputChange('namaResep', e.target.value)}
                  placeholder="Masukkan nama resep"
                  required
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="kategoriResep">Kategori</Label>
                <Input
                  id="kategoriResep"
                  value={formData.kategoriResep || ''}
                  onChange={(e) => handleInputChange('kategoriResep', e.target.value)}
                  placeholder="Kategori resep (opsional)"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="jumlahPorsi">Jumlah Porsi *</Label>
                <Input
                  id="jumlahPorsi"
                  type="number"
                  min="1"
                  value={formData.jumlahPorsi || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Allow empty string during editing
                    handleInputChange('jumlahPorsi', value === '' ? '' : parseInt(value) || 1);
                  }}
                  onBlur={(e) => {
                    // Ensure we have at least 1 when user finishes editing
                    if (!e.target.value || parseInt(e.target.value) < 1) {
                      handleInputChange('jumlahPorsi', 1);
                    }
                  }}
                  required
                  mobileOptimized
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1 sm:hidden">
                  Gunakan nama yang mudah diingat dan menggambarkan resep
                </p>
              </div>
              
              <div>
                <Label htmlFor="jumlahPcsPerPorsi">
                  Pcs per Porsi *
                  <span className="text-xs text-gray-500 ml-1 hidden sm:inline">(untuk kalkulasi HPP per pcs)</span>
                </Label>
                <Input
                  id="jumlahPcsPerPorsi"
                  type="number"
                  min="1"
                  value={formData.jumlahPcsPerPorsi || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Allow empty string during editing, default to 1 only on blur or if explicitly set to 0
                    handleInputChange('jumlahPcsPerPorsi', value === '' ? '' : parseInt(value) || 1);
                  }}
                  onBlur={(e) => {
                    // Ensure we have at least 1 when user finishes editing
                    if (!e.target.value || parseInt(e.target.value) < 1) {
                      handleInputChange('jumlahPcsPerPorsi', 1);
                    }
                  }}
                  mobileOptimized
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  <span className="sm:hidden">Berapa potongan per porsi (misal: 1 porsi = 6 pcs donat)</span>
                  <span className="hidden sm:inline">Total produksi: {totalPcsProduced} pcs</span>
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="deskripsi">Deskripsi</Label>
              <Textarea
                id="deskripsi"
                value={formData.deskripsi || ''}
                onChange={(e) => handleInputChange('deskripsi', e.target.value)}
                placeholder="Deskripsi resep (opsional)"
                className="mt-1"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Ingredients */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Daftar Bahan ({formData.bahanResep.length})
              </CardTitle>
              {formData.bahanResep.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={refreshIngredientPrices}
                  className="hover:bg-blue-50"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Perbarui Harga
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add Ingredient Form */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-gray-50 rounded-lg">
              <div className="sm:col-span-2 md:col-span-2">
                <Label className="text-sm">Nama Bahan *</Label>
                <Select 
                  value={newIngredient.selectedBahanId} 
                  onValueChange={handleIngredientSelectionChange}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Pilih bahan baku..." />
                  </SelectTrigger>
                  <SelectContent>
                    {bahanBaku
                      .filter(b => !formData.bahanResep.some(item => item.id === b.id))
                      .map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          <div className="flex justify-between items-center w-full">
                            <span>{item.nama}</span>
                            <span className="text-xs text-gray-500 ml-2">
                              {formatCurrency(item.hargaSatuan)}/{item.satuan}
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-sm">Jumlah *</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  value={newIngredient.jumlah || ''}
                  onChange={(e) => setNewIngredient(prev => ({
                    ...prev,
                    jumlah: parseFloat(e.target.value) || 0
                  }))}
                  placeholder="0"
                  mobileOptimized
                  className="mt-1"
                />
              </div>
              
              <div className="flex items-end">
                <Button
                  type="button"
                  onClick={addIngredient}
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="sm"
                  disabled={!newIngredient.selectedBahanId || newIngredient.jumlah <= 0}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah
                </Button>
              </div>
            </div>

            {/* Ingredients Table */}
            {formData.bahanResep.length > 0 ? (
              <div className="border rounded-lg overflow-x-auto">
                <Table className="recipe-ingredients-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama Bahan</TableHead>
                      <TableHead>Jumlah</TableHead>
                      <TableHead>Harga Satuan</TableHead>
                      <TableHead>Total Harga</TableHead>
                      <TableHead className="w-20">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formData.bahanResep.map((ingredient) => (
                      <TableRow key={ingredient.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {ingredient.nama}
                            {/* Always show inventory badge for ingredients */}
                            <Badge variant="secondary" className="text-xs">
                              Inventory
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="0"
                              step="0.1"
                              value={ingredient.jumlah}
                              onChange={(e) => updateIngredientQuantity(ingredient.id!, parseFloat(e.target.value) || 0)}
                              mobileOptimized
                              className="w-20 sm:w-20 min-w-[60px] flex-shrink-0"
                            />
                            <span className="text-sm text-gray-500 flex-shrink-0">{ingredient.satuan}</span>
                          </div>
                        </TableCell>
                        <TableCell>{formatCurrency(ingredient.hargaSatuan)}</TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(ingredient.totalHarga)}
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeIngredient(ingredient.id!)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p>Belum ada bahan yang ditambahkan</p>
              </div>
            )}

            {formData.bahanResep.length > 0 && (
              <div className="flex justify-end">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-sm text-blue-700">
                    <span className="font-medium">Total Biaya Bahan:</span>
                    <span className="font-bold ml-2">{formatCurrency(totalIngredientCost)}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Additional Costs & Calculation Preview */}
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
                  onChange={(e) => handleInputChange('biayaTenagaKerja', parseFloat(e.target.value) || 0)}
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
                  onChange={(e) => handleInputChange('biayaOverhead', parseFloat(e.target.value) || 0)}
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
                  onChange={(e) => handleInputChange('marginKeuntunganPersen', parseFloat(e.target.value) || 0)}
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
                          (typeof formData.jumlahPorsi === 'number' ? formData.jumlahPorsi : parseInt(formData.jumlahPorsi) || 1))}
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

        {/* Enhanced HPP Information */}
        <Alert className="border-green-200 bg-green-50">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-green-800">
            <strong>🤖 Smart HPP Calculator:</strong> Sistem otomatis menghitung HPP menggunakan biaya produksi (overhead + operasional) dari{' '}
            <strong>Biaya Operasional → Kalkulator Biaya Produksi</strong>. Hasil kalkulasi lebih akurat dan real-time!
          </AlertDescription>
        </Alert>

        {/* Auto-Sync HPP Integration */}
        <AutoSyncRecipeDisplay
          recipeData={recipeDataForHpp}
          onResultChange={handleEnhancedHppChange}
        />

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel} 
            size="lg"
            className="w-full sm:w-auto"
          >
            Batal
          </Button>
          <Button 
            type="submit" 
            size="lg"
            disabled={!formData.namaResep || formData.bahanResep.length === 0}
            className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
          >
            {initialData ? 'Update Resep' : 'Simpan Resep'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EnhancedRecipeForm;
