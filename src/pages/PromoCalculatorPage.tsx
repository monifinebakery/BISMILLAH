import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useRecipe } from '@/contexts/RecipeContext';
import { usePromo } from '@/contexts/PromoContext';
import { formatCurrency, formatPercentage } from '@/utils/currencyUtils';
import { 
  AlertTriangle, 
  Save, 
  Trash2, 
  HelpCircle, 
  ChevronLeft, 
  ChevronRight, 
  Calculator,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Loader2,
  Package,
  Percent,
  Gift
} from 'lucide-react';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const PromoCalculatorPage = () => {
  // Get context values with proper fallbacks
  const recipeContext = useRecipe();
  const promoContext = usePromo();

  const {
    recipes = [],
    loading: recipesLoading = false
  } = recipeContext || {};

  const {
    promoHistory = [],
    addPromoEstimation = () => Promise.resolve(false),
    deletePromoEstimation = () => Promise.resolve(false),
    loading: promoLoading = false
  } = promoContext || {};

  // --- State Management ---
  const [selectedRecipeId, setSelectedRecipeId] = useState('');
  const [promoType, setPromoType] = useState('discount_percent');
  const [discountValue, setDiscountValue] = useState(0);
  const [bogoBuy, setBogoBuy] = useState(2);
  const [bogoGet, setBogoGet] = useState(1);
  const [promoName, setPromoName] = useState('');
  const [selectedPromos, setSelectedPromos] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const itemsPerPage = 5;

  // Safe recipe selection
  const selectedRecipe = useMemo(() => {
    if (!Array.isArray(recipes) || !selectedRecipeId) return null;
    return recipes.find(r => r && r.id === selectedRecipeId) || null;
  }, [recipes, selectedRecipeId]);

  // Calculate original values safely
  const originalValues = useMemo(() => {
    if (!selectedRecipe) {
      return { hpp: 0, price: 0, marginRp: 0, marginPercent: 0 };
    }

    const hpp = selectedRecipe.hppPerPorsi || 0;
    const price = selectedRecipe.hargaJualPorsi || 0;
    const marginRp = price > 0 ? price - hpp : 0;
    const marginPercent = price > 0 ? marginRp / price : 0;

    return { hpp, price, marginRp, marginPercent };
  }, [selectedRecipe]);

  // Calculate promo results
  const promoResult = useMemo(() => {
    if (!selectedRecipe || originalValues.price <= 0) return null;

    let price = 0;
    let details = {};
    
    try {
      switch (promoType) {
        case 'discount_percent': {
          const discPercent = Math.min(100, Math.max(0, discountValue || 0));
          price = originalValues.price * (1 - (discPercent / 100));
          details = { type: '%', value: discPercent };
          break;
        }
        case 'discount_rp': {
          const discRp = Math.max(0, discountValue || 0);
          price = Math.max(0, originalValues.price - discRp);
          details = { type: 'Rp', value: discRp };
          break;
        }
        case 'bogo': {
          const buy = Math.max(1, bogoBuy || 1);
          const get = Math.max(0, bogoGet || 0);
          price = buy === 0 ? 0 : (originalValues.price * buy) / (buy + get);
          details = { buy, get };
          break;
        }
        default:
          return null;
      }

      const marginRp = price - originalValues.hpp;
      const marginPercent = price > 0 ? (marginRp / price) : 0;

      return { 
        price: Math.max(0, price), 
        marginRp, 
        marginPercent, 
        details,
        isNegativeMargin: marginPercent < 0
      };
    } catch (error) {
      console.error('Error calculating promo result:', error);
      return null;
    }
  }, [promoType, discountValue, bogoBuy, bogoGet, selectedRecipe, originalValues]);

  // Handle save with proper error handling
  const handleSave = useCallback(async () => {
    if (!promoName.trim()) {
      toast.error('Nama promo wajib diisi.');
      return;
    }
    if (!selectedRecipe || !promoResult) {
      toast.error('Pilih produk dan pastikan kalkulasi valid.');
      return;
    }

    setIsSaving(true);
    
    try {
      const success = await addPromoEstimation({
        promo_name: promoName.trim(),
        promo_type: promoType,
        base_recipe_id: selectedRecipeId,
        base_recipe_name: selectedRecipe.namaResep || 'Unknown Recipe',
        promo_details: promoResult.details,
        original_price: originalValues.price,
        original_hpp: originalValues.hpp,
        promo_price_effective: promoResult.price,
        estimated_margin_percent: promoResult.marginPercent,
        estimated_margin_rp: promoResult.marginRp,
      });

      if (success) {
        setPromoName('');
        toast.success('Estimasi promo berhasil disimpan!');
      }
    } catch (error) {
      console.error('Error saving promo:', error);
      toast.error('Gagal menyimpan estimasi promo');
    } finally {
      setIsSaving(false);
    }
  }, [promoName, selectedRecipe, promoResult, promoType, selectedRecipeId, originalValues, addPromoEstimation]);

  // Handle bulk delete with proper error handling
  const handleBulkDelete = useCallback(async () => {
    if (selectedPromos.size === 0) {
      toast.warning('Pilih setidaknya satu promo untuk dihapus.');
      return;
    }

    try {
      const deletePromises = Array.from(selectedPromos).map(id => deletePromoEstimation(id));
      await Promise.all(deletePromises);
      setSelectedPromos(new Set());
      toast.success(`${selectedPromos.size} promo berhasil dihapus.`);
    } catch (error) {
      console.error('Error deleting promos:', error);
      toast.error('Gagal menghapus beberapa promo');
    }
  }, [selectedPromos, deletePromoEstimation]);

  // Render promo form based on type
  const renderPromoForm = () => {
    switch (promoType) {
      case 'discount_percent':
        return (
          <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Percent className="h-5 w-5 text-orange-600" />
            </div>
            <div className="flex items-center gap-2 flex-1">
              <Input
                type="number"
                placeholder="10"
                value={discountValue || ''}
                onChange={(e) => setDiscountValue(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                min="0"
                max="100"
                className="w-20 text-center border-orange-200 focus:border-orange-400"
              />
              <span className="font-semibold text-orange-700 text-lg">%</span>
              <span className="text-sm text-gray-600">diskon</span>
            </div>
          </div>
        );
      case 'discount_rp':
        return (
          <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200">
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingDown className="h-5 w-5 text-orange-600" />
            </div>
            <div className="flex items-center gap-2 flex-1">
              <span className="font-semibold text-orange-700">Rp</span>
              <Input
                type="number"
                placeholder="5000"
                value={discountValue || ''}
                onChange={(e) => setDiscountValue(Math.max(0, Number(e.target.value) || 0))}
                min="0"
                className="w-32 text-center border-orange-200 focus:border-orange-400"
              />
              <span className="text-sm text-gray-600">potongan harga</span>
            </div>
          </div>
        );
      case 'bogo':
        return (
          <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Gift className="h-5 w-5 text-orange-600" />
            </div>
            <div className="flex items-center gap-3 flex-1 text-sm">
              <span className="text-gray-700 font-medium">Beli</span>
              <Input
                className="w-16 text-center border-orange-200 focus:border-orange-400"
                type="number"
                value={bogoBuy}
                onChange={(e) => setBogoBuy(Math.max(1, Number(e.target.value) || 1))}
                min="1"
              />
              <span className="text-gray-700 font-medium">Gratis</span>
              <Input
                className="w-16 text-center border-orange-200 focus:border-orange-400"
                type="number"
                value={bogoGet}
                onChange={(e) => setBogoGet(Math.max(0, Number(e.target.value) || 0))}
                min="0"
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Safe pagination calculations
  const paginationData = useMemo(() => {
    const safePromoHistory = Array.isArray(promoHistory) ? promoHistory : [];
    const totalPages = Math.ceil(safePromoHistory.length / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const paginatedPromos = safePromoHistory.slice(start, start + itemsPerPage);
    
    return { totalPages, paginatedPromos, total: safePromoHistory.length };
  }, [promoHistory, currentPage, itemsPerPage]);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(Math.max(1, Math.min(page, paginationData.totalPages)));
  }, [paginationData.totalPages]);

  // Error boundary for missing contexts
  if (!recipeContext || !promoContext) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Context Error</h2>
          <p className="text-gray-600">Recipe atau Promo Context tidak tersedia. Pastikan komponen ini dibungkus dengan provider yang sesuai.</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (recipesLoading || promoLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Memuat data promo calculator...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-orange-100 p-4 sm:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-4 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl shadow-lg">
            <Calculator className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              Kalkulator & Analisis Promo
            </h1>
            <p className="text-gray-600 mt-1">Hitung dampak promo terhadap margin keuntungan Anda</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Kolom Kiri: Input */}
        <div className="space-y-6">
          {/* Step 1: Product Selection */}
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
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
            <CardContent className="p-6">
              <Select onValueChange={setSelectedRecipeId} value={selectedRecipeId}>
                <SelectTrigger className="w-full border-orange-200 hover:border-orange-300 transition-colors h-12">
                  <SelectValue placeholder="Pilih Produk/Resep..." className="text-gray-600" />
                </SelectTrigger>
                <SelectContent className="bg-white border-orange-200 shadow-xl">
                  {recipes.map((r) => (
                    <SelectItem
                      key={r.id}
                      value={r.id}
                      className="hover:bg-orange-50 text-gray-800 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-orange-500" />
                        {r.namaResep}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
            
            {selectedRecipe && (
              <CardContent className="p-6 pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-gradient-to-br from-orange-100 to-orange-50 rounded-xl border border-orange-200 text-center hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <TrendingDown className="h-4 w-4 text-orange-600" />
                      <span className="text-xs font-medium text-orange-700 uppercase tracking-wide">HPP</span>
                    </div>
                    <p className="text-xl font-bold text-orange-800">{formatCurrency(originalValues.hpp)}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-red-100 to-red-50 rounded-xl border border-red-200 text-center hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-red-600" />
                      <span className="text-xs font-medium text-red-700 uppercase tracking-wide">Harga Asli</span>
                    </div>
                    <p className="text-xl font-bold text-red-800">{formatCurrency(originalValues.price)}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-green-100 to-green-50 rounded-xl border border-green-200 text-center hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Sparkles className="h-4 w-4 text-green-600" />
                      <span className="text-xs font-medium text-green-700 uppercase tracking-wide">Margin</span>
                    </div>
                    <p className="text-xl font-bold text-green-800">{formatPercentage(originalValues.marginPercent)}</p>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Step 2: Promo Configuration */}
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-lg p-6">
              <CardTitle className="text-xl font-semibold flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Calculator className="h-5 w-5" />
                </div>
                2. Konfigurasi Promo
              </CardTitle>
              <CardDescription className="text-orange-100">
                Tentukan jenis dan nilai promo
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Jenis Promo</label>
                <Select onValueChange={setPromoType} value={promoType}>
                  <SelectTrigger className="w-full border-orange-200 hover:border-orange-300 transition-colors h-12">
                    <SelectValue className="text-gray-600" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-orange-200 shadow-xl">
                    <SelectItem value="discount_percent" className="hover:bg-orange-50 text-gray-800">
                      <div className="flex items-center gap-2">
                        <Percent className="h-4 w-4 text-orange-500" />
                        Diskon Persentase (%)
                      </div>
                    </SelectItem>
                    <SelectItem value="discount_rp" className="hover:bg-orange-50 text-gray-800">
                      <div className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-red-500" />
                        Diskon Nominal (Rp)
                      </div>
                    </SelectItem>
                    <SelectItem value="bogo" className="hover:bg-orange-50 text-gray-800">
                      <div className="flex items-center gap-2">
                        <Gift className="h-4 w-4 text-green-500" />
                        Beli X Gratis Y (BOGO)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-3 block">Pengaturan Promo</label>
                {selectedRecipe ? (
                  renderPromoForm()
                ) : (
                  <div className="p-6 text-center text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Pilih produk terlebih dahulu untuk mengatur promo</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Kolom Kanan: Results */}
        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
          <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-lg p-6">
            <CardTitle className="text-xl font-semibold flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <TrendingUp className="h-5 w-5" />
              </div>
              3. Hasil Kalkulasi
            </CardTitle>
            <CardDescription className="text-orange-100">
              Lihat dampak promo terhadap keuntungan
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {promoResult ? (
              <div className="space-y-6 animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Effective Price */}
                  <div className="p-6 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl border border-blue-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-200 rounded-lg">
                          <TrendingUp className="h-4 w-4 text-blue-700" />
                        </div>
                        <span className="text-sm font-medium text-blue-700">Harga Efektif</span>
                      </div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle size={16} className="text-blue-600 hover:text-blue-800" />
                          </TooltipTrigger>
                          <TooltipContent className="bg-white text-gray-800 border-blue-200 shadow-lg">
                            <p className="max-w-xs">Harga jual rata-rata per item setelah promo diterapkan</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <p className="text-2xl font-bold text-blue-800">{formatCurrency(promoResult.price)}</p>
                  </div>

                  {/* Margin Result */}
                  <div className={cn(
                    "p-6 rounded-xl border hover:shadow-lg transition-all duration-300 hover:-translate-y-1",
                    promoResult.isNegativeMargin 
                      ? "bg-gradient-to-br from-red-100 to-red-50 border-red-200" 
                      : "bg-gradient-to-br from-green-100 to-green-50 border-green-200"
                  )}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "p-2 rounded-lg",
                          promoResult.isNegativeMargin ? "bg-red-200" : "bg-green-200"
                        )}>
                          {promoResult.isNegativeMargin ? (
                            <TrendingDown className="h-4 w-4 text-red-700" />
                          ) : (
                            <TrendingUp className="h-4 w-4 text-green-700" />
                          )}
                        </div>
                        <span className={cn(
                          "text-sm font-medium",
                          promoResult.isNegativeMargin ? "text-red-700" : "text-green-700"
                        )}>
                          Margin Promo
                        </span>
                      </div>
                      {promoResult.isNegativeMargin && (
                        <Badge variant="destructive" className="text-xs">RUGI</Badge>
                      )}
                    </div>
                    <p className={cn(
                      "text-2xl font-bold",
                      promoResult.isNegativeMargin ? "text-red-800" : "text-green-800"
                    )}>
                      {formatPercentage(promoResult.marginPercent)}
                    </p>
                    <p className={cn(
                      "text-sm mt-1",
                      promoResult.isNegativeMargin ? "text-red-600" : "text-green-600"
                    )}>
                      {formatCurrency(promoResult.marginRp)} per item
                    </p>
                  </div>
                </div>

                {promoResult.isNegativeMargin && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
                      <div>
                        <p className="text-red-800 font-medium">Peringatan: Margin Negatif!</p>
                        <p className="text-red-600 text-sm">Promo ini akan mengurangi keuntungan Anda. Pertimbangkan untuk menyesuaikan nilai promo.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Save Section */}
                <div className="flex gap-3">
                  <Input
                    placeholder="Nama Promo (contoh: Flash Sale Weekend)"
                    value={promoName}
                    onChange={(e) => setPromoName(e.target.value)}
                    className="flex-1 border-orange-200 focus:border-orange-400 h-12"
                  />
                  <Button
                    onClick={handleSave}
                    disabled={!promoName.trim() || !selectedRecipe || !promoResult || isSaving}
                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-6"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 size={16} className="mr-2 animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Save size={16} className="mr-2" />
                        Simpan
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="p-6 bg-gray-50 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                  <Calculator className="h-10 w-10 text-gray-400" />
                </div>
                <p className="text-gray-600 text-lg font-medium mb-2">Hasil Kalkulasi</p>
                <p className="text-gray-500">Pilih produk dan atur promo untuk melihat hasil perhitungan</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* History Table */}
      <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
        <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-lg p-6">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl font-semibold flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Package className="h-5 w-5" />
                </div>
                Riwayat Estimasi Promo
              </CardTitle>
              <CardDescription className="text-orange-100 mt-1">
                {paginationData.total} estimasi promo tersimpan
              </CardDescription>
            </div>
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={selectedPromos.size === 0}
              className="bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Trash2 size={16} className="mr-2" />
              Hapus Terpilih ({selectedPromos.size})
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gradient-to-r from-orange-50 to-red-50">
                <TableRow className="hover:bg-orange-50/50">
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedPromos.size === paginationData.total && paginationData.total > 0}
                      onChange={(e) =>
                        setSelectedPromos(
                          e.target.checked ? new Set(promoHistory.map((p) => p.id)) : new Set()
                        )
                      }
                      className="rounded border-orange-300 text-orange-600 focus:ring-orange-500"
                    />
                  </TableHead>
                  <TableHead className="text-gray-800 font-semibold">Nama Promo</TableHead>
                  <TableHead className="text-gray-800 font-semibold">Produk</TableHead>
                  <TableHead className="text-gray-800 font-semibold">Harga Asli</TableHead>
                  <TableHead className="text-gray-800 font-semibold">Harga Promo</TableHead>
                  <TableHead className="text-gray-800 font-semibold">Margin</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginationData.paginatedPromos.length > 0 ? (
                  paginationData.paginatedPromos.map((p, index) => (
                    <TableRow
                      key={p.id}
                      className={cn(
                        "hover:bg-orange-50/50 transition-colors",
                        index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                      )}
                    >
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedPromos.has(p.id)}
                          onChange={(e) => {
                            const newSelected = new Set(selectedPromos);
                            if (e.target.checked) newSelected.add(p.id);
                            else newSelected.delete(p.id);
                            setSelectedPromos(newSelected);
                          }}
                          className="rounded border-orange-300 text-orange-600 focus:ring-orange-500"
                        />
                      </TableCell>
                      <TableCell className="font-medium text-gray-800">{p.promo_name}</TableCell>
                      <TableCell className="text-gray-700">{p.base_recipe_name}</TableCell>
                      <TableCell className="text-gray-700 font-medium">{formatCurrency(p.original_price)}</TableCell>
                      <TableCell className="font-semibold text-orange-700">{formatCurrency(p.promo_price_effective)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "font-semibold",
                            p.estimated_margin_percent < 0 ? 'text-red-600' : 'text-green-600'
                          )}>
                            {formatPercentage(p.estimated_margin_percent)}
                          </span>
                          {p.estimated_margin_percent < 0 && (
                            <Badge variant="destructive" className="text-xs">RUGI</Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-32">
                      <div className="flex flex-col items-center gap-4">
                        <div className="p-4 bg-gray-100 rounded-full">
                          <Package className="h-8 w-8 text-gray-400" />
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-medium text-gray-600 mb-1">Belum ada riwayat promo</p>
                          <p className="text-gray-500 text-sm">Buat estimasi promo pertama Anda untuk melihat riwayat di sini</p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {paginationData.totalPages > 1 && (
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-orange-100">
              <Button
                variant="outline"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="text-orange-700 hover:bg-orange-50 border-orange-200 hover:border-orange-300"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Sebelumnya
              </Button>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  Halaman {currentPage} dari {paginationData.totalPages}
                </span>
                <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                  {paginationData.total} total
                </Badge>
              </div>

              <Button
                variant="outline"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === paginationData.totalPages}
                className="text-orange-700 hover:bg-orange-50 border-orange-200 hover:border-orange-300"
              >
                Selanjutnya
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PromoCalculatorPage;