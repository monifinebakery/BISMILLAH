// src/components/recipe/components/RecipeForm/hooks/useIngredientCalculation.ts

import { useMemo, useCallback } from 'react';
import type { BahanResep, NewRecipe } from '../../../types';
import { formatCurrency } from '../../../services/recipeUtils';
import { logger } from '@/utils/logger';

interface UseIngredientCalculationProps {
  ingredients: BahanResep[];
  recipeData: NewRecipe;
}

export const useIngredientCalculation = ({
  ingredients,
  recipeData
}: UseIngredientCalculationProps) => {
  
  // Calculate total ingredient cost
  const totalIngredientCost = useMemo(() => {
    const total = ingredients.reduce((sum, ingredient) => {
      const cost = ingredient.total_harga || 0;
      logger.debug('useIngredientCalculation: Adding ingredient cost:', {
        ingredient: ingredient.nama,
        cost,
        runningTotal: sum + cost
      });
      return sum + cost;
    }, 0);
    
    logger.debug('useIngredientCalculation: Total ingredient cost calculated:', total);
    return total;
  }, [ingredients]);

  // Calculate cost per portion
  const costPerPortion = useMemo(() => {
    const jumlahPorsi = typeof recipeData.jumlahPorsi === 'string' 
      ? (recipeData.jumlahPorsi === '' ? 1 : parseInt(recipeData.jumlahPorsi)) || 1
      : (recipeData.jumlahPorsi || 1);
    
    const cost = jumlahPorsi > 0 ? totalIngredientCost / jumlahPorsi : 0;
    
    logger.debug('useIngredientCalculation: Cost per portion calculated:', {
      totalCost: totalIngredientCost,
      jumlahPorsi,
      costPerPortion: cost
    });
    
    return cost;
  }, [totalIngredientCost, recipeData.jumlahPorsi]);

  // Calculate cost per piece
  const costPerPiece = useMemo(() => {
    const jumlahPorsi = typeof recipeData.jumlahPorsi === 'string' 
      ? (recipeData.jumlahPorsi === '' ? 1 : parseInt(recipeData.jumlahPorsi)) || 1
      : (recipeData.jumlahPorsi || 1);
      
    const jumlahPcsPerPorsi = typeof recipeData.jumlahPcsPerPorsi === 'string'
      ? (recipeData.jumlahPcsPerPorsi === '' ? 1 : parseInt(recipeData.jumlahPcsPerPorsi)) || 1  
      : (recipeData.jumlahPcsPerPorsi || 1);
    
    const cost = jumlahPorsi > 0 && jumlahPcsPerPorsi > 0 
      ? totalIngredientCost / (jumlahPorsi * jumlahPcsPerPorsi)
      : 0;
      
    logger.debug('useIngredientCalculation: Cost per piece calculated:', {
      totalCost: totalIngredientCost,
      jumlahPorsi,
      jumlahPcsPerPorsi,
      costPerPiece: cost
    });
    
    return cost;
  }, [totalIngredientCost, recipeData.jumlahPorsi, recipeData.jumlahPcsPerPorsi]);

  // Calculate ingredient total when quantity or price changes
  const calculateIngredientTotal = useCallback((
    jumlah: number, 
    hargaSatuan: number
  ): number => {
    const total = jumlah * hargaSatuan;
    logger.debug('useIngredientCalculation: Ingredient total calculated:', {
      jumlah,
      hargaSatuan,
      total
    });
    return total;
  }, []);

  // Update ingredient with recalculated total
  const updateIngredientWithCalculation = useCallback((
    ingredient: BahanResep,
    field: keyof BahanResep,
    value: any
  ): BahanResep => {
    const updated = {
      ...ingredient,
      [field]: value,
    };

    // Recalculate total if quantity or unit price changes
    if (field === 'jumlah' || field === 'harga_satuan') {
      updated.total_harga = calculateIngredientTotal(updated.jumlah, updated.harga_satuan);
      
      logger.debug('useIngredientCalculation: Ingredient updated with recalculation:', {
        field,
        value,
        newTotal: updated.total_harga,
        ingredient: updated.nama
      });
    }

    return updated;
  }, [calculateIngredientTotal]);

  // Validate ingredient for calculation requirements
  const validateIngredientForCalculation = useCallback((
    ingredient: Partial<BahanResep>
  ): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!ingredient.nama?.trim()) {
      errors.push('Nama bahan harus diisi');
    }

    if (!ingredient.satuan?.trim()) {
      errors.push('Satuan harus dipilih');
    }

    if (!ingredient.jumlah || ingredient.jumlah <= 0) {
      errors.push('Jumlah harus lebih dari 0');
    }

    if (!ingredient.harga_satuan || ingredient.harga_satuan <= 0) {
      errors.push('Harga satuan harus lebih dari 0');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }, []);

  // Get formatted cost summaries
  const getCostSummaries = useCallback(() => {
    const jumlahPcsPerPorsi = typeof recipeData.jumlahPcsPerPorsi === 'string'
      ? (recipeData.jumlahPcsPerPorsi === '' ? 1 : parseInt(recipeData.jumlahPcsPerPorsi)) || 1  
      : (recipeData.jumlahPcsPerPorsi || 1);

    return {
      totalCost: formatCurrency(totalIngredientCost),
      costPerPortion: formatCurrency(costPerPortion),
      costPerPiece: formatCurrency(costPerPiece),
      showCostPerPiece: jumlahPcsPerPorsi > 1,
      ingredientCount: ingredients.length
    };
  }, [totalIngredientCost, costPerPortion, costPerPiece, recipeData.jumlahPcsPerPorsi, ingredients.length]);

  // Check if calculations are ready
  const isCalculationReady = useMemo(() => {
    return ingredients.length > 0 && totalIngredientCost > 0;
  }, [ingredients.length, totalIngredientCost]);

  return {
    // Calculated values
    totalIngredientCost,
    costPerPortion,
    costPerPiece,
    
    // Utility functions
    calculateIngredientTotal,
    updateIngredientWithCalculation,
    validateIngredientForCalculation,
    getCostSummaries,
    
    // State
    isCalculationReady,
    
    // Helpers
    formatCurrency
  };
};