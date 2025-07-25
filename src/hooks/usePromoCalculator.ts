// hooks/usePromoCalculator.ts
import { useState, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { calculatePromoResult, calculatePagination } from '@/utils/promoUtils';

interface Recipe {
  id: string;
  namaResep: string;
  hppPerPorsi: number;
  hargaJualPorsi: number;
}

interface PromoEstimation {
  id: string;
  promo_name: string;
  promo_type: string;
  base_recipe_id: string;
  base_recipe_name: string;
  promo_details: any;
  original_price: number;
  original_hpp: number;
  promo_price_effective: number;
  estimated_margin_percent: number;
  estimated_margin_rp: number;
}

export const usePromoCalculator = (recipeContext: any, promoContext: any) => {
  // 📊 Extract context data safely
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

  // 🎛️ State Management
  const [selectedRecipeId, setSelectedRecipeId] = useState('');
  const [promoType, setPromoType] = useState('discount_percent');
  const [discountValue, setDiscountValue] = useState(0);
  const [bogoBuy, setBogoBuy] = useState(2);
  const [bogoGet, setBogoGet] = useState(1);
  const [promoName, setPromoName] = useState('');
  const [selectedPromos, setSelectedPromos] = useState(new Set<string>());
  const [currentPage, setCurrentPage] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  const itemsPerPage = 5;

  // 🔍 Safe recipe selection
  const selectedRecipe = useMemo(() => {
    if (!Array.isArray(recipes) || !selectedRecipeId) return null;
    return recipes.find((r: Recipe) => r && r.id === selectedRecipeId) || null;
  }, [recipes, selectedRecipeId]);

  // 💰 Calculate original values safely
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

  // 📊 Calculate promo results
  const promoResult = useMemo(() => {
    if (!selectedRecipe || originalValues.price <= 0) return null;

    return calculatePromoResult({
      promoType,
      discountValue,
      bogoBuy,
      bogoGet,
      originalPrice: originalValues.price,
      originalHpp: originalValues.hpp
    });
  }, [promoType, discountValue, bogoBuy, bogoGet, selectedRecipe, originalValues]);

  // 📄 Safe pagination calculations
  const paginationData = useMemo(() => {
    const safePromoHistory = Array.isArray(promoHistory) ? promoHistory : [];
    return calculatePagination(safePromoHistory, currentPage, itemsPerPage);
  }, [promoHistory, currentPage, itemsPerPage]);

  // 💾 Handle save with proper error handling
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

  // 🗑️ Handle bulk delete with proper error handling
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

  // 📄 Handle pagination
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, paginationData.totalPages)));
  }, [paginationData.totalPages]);

  // 🔄 Loading state
  const isLoading = recipesLoading || promoLoading;

  return {
    // Data
    recipes,
    promoHistory,
    selectedRecipe,
    originalValues,
    promoResult,
    paginationData,
    
    // State
    selectedRecipeId,
    promoType,
    discountValue,
    bogoBuy,
    bogoGet,
    promoName,
    selectedPromos,
    currentPage,
    isSaving,
    isLoading,
    
    // Actions
    setSelectedRecipeId,
    setPromoType,
    setDiscountValue,
    setBogoBuy,
    setBogoGet,
    setPromoName,
    setSelectedPromos,
    handleSave,
    handleBulkDelete,
    handlePageChange
  };
};