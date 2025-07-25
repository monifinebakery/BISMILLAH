// src/contexts/RecipeContext.tsx
// 🔔 FIXED FUNCTION ORDER - NO REFERENCE ERRORS

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Recipe, NewRecipe } from '@/types/recipe';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import { useActivity } from './ActivityContext';
import { logger } from '@/utils/logger';
// 🔔 ADD NOTIFICATION IMPORTS
import { useNotification } from './NotificationContext';
import { createNotificationHelper } from '../utils/notificationHelpers';
import { safeParseDate } from '@/utils/unifiedDateUtils';

// 🧮 HPP Calculation Interface
interface HPPCalculationResult {
  totalBahanBaku: number;          // Total cost bahan baku
  biayaTenagaKerja: number;        // Labor cost
  biayaOverhead: number;           // Overhead cost
  totalHPP: number;                // Total HPP
  hppPerPorsi: number;             // HPP per serving
  hppPerPcs: number;               // HPP per piece (if applicable)
  marginKeuntungan: number;        // Profit margin amount
  hargaJualPorsi: number;       // Selling price per serving
  hargaJualPerPcs: number;         // Selling price per piece (if applicable)
  profitabilitas: number;          // Profitability percentage
}

interface BahanResep {
  nama: string;
  jumlah: number;
  satuan: string;
  hargaSatuan: number;
  totalHarga: number;
}

interface RecipeContextType {
  recipes: Recipe[];
  isLoading: boolean;
  addRecipe: (recipe: NewRecipe) => Promise<boolean>;
  updateRecipe: (id: string, recipe: Partial<NewRecipe>) => Promise<boolean>;
  deleteRecipe: (id: string) => Promise<boolean>;
  // 🧮 NEW: HPP Calculation functions
  calculateHPP: (
    bahanResep: BahanResep[],
    jumlahPorsi: number,
    biayaTenagaKerja: number,
    biayaOverhead: number,
    marginKeuntunganPersen: number,
    jumlahPcsPerPorsi?: number
  ) => HPPCalculationResult;
  validateRecipeData: (recipe: Partial<NewRecipe>) => { isValid: boolean; errors: string[] };
  duplicateRecipe: (id: string, newName: string) => Promise<boolean>;
  searchRecipes: (query: string) => Recipe[];
  getRecipesByCategory: (category: string) => Recipe[];
  calculateIngredientCost: (bahanResep: BahanResep[]) => number;
}

const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

export const RecipeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { addActivity } = useActivity();
  // 🔔 ADD NOTIFICATION CONTEXT
  const { addNotification } = useNotification();

  // Mengubah data dari format database (snake_case) ke format aplikasi (camelCase)
  const transformFromDB = useCallback((dbItem: any): Recipe => ({
    id: dbItem.id,
    userId: dbItem.user_id,
    createdAt: safeParseDate(dbItem.created_at),
    updatedAt: safeParseDate(dbItem.updated_at),
    namaResep: dbItem.nama_resep,
    jumlahPorsi: Number(dbItem.jumlah_porsi),
    kategoriResep: dbItem.kategori_resep,
    deskripsi: dbItem.deskripsi,
    fotoUrl: dbItem.foto_url,
    bahanResep: dbItem.bahan_resep || [],
    biayaTenagaKerja: Number(dbItem.biaya_tenaga_kerja) || 0,
    biayaOverhead: Number(dbItem.biaya_overhead) || 0,
    marginKeuntunganPersen: Number(dbItem.margin_keuntungan_persen) || 0,
    totalHpp: Number(dbItem.total_hpp) || 0,
    hppPerPorsi: Number(dbItem.hpp_per_porsi) || 0,
    hargaJualPorsi: Number(dbItem.harga_jual_porsi) || 0, // 🔧 FIX: Ensure fallback value
    // 🧮 NEW: HPP per PCS fields
    jumlahPcsPerPorsi: Number(dbItem.jumlah_pcs_per_porsi) || 1,
    hppPerPcs: Number(dbItem.hpp_per_pcs) || 0,
    hargaJualPerPcs: Number(dbItem.harga_jual_per_pcs) || 0,
  }), []);
  
  // Mengubah data dari format aplikasi (camelCase) ke format database (snake_case)
  const transformToDB = useCallback((recipe: Partial<NewRecipe>) => ({
    nama_resep: recipe.namaResep,
    jumlah_porsi: recipe.jumlahPorsi,
    kategori_resep: recipe.kategoriResep,
    deskripsi: recipe.deskripsi,
    foto_url: recipe.fotoUrl,
    bahan_resep: recipe.bahanResep,
    biaya_tenaga_kerja: recipe.biayaTenagaKerja,
    biaya_overhead: recipe.biayaOverhead,
    margin_keuntungan_persen: recipe.marginKeuntunganPersen,
    total_hpp: recipe.totalHpp,
    hpp_per_porsi: recipe.hppPerPorsi,
    harga_jual_porsi: recipe.hargaJualPorsi,
    // 🧮 NEW: HPP per PCS fields
    jumlah_pcs_per_porsi: recipe.jumlahPcsPerPorsi || 1,
    hpp_per_pcs: recipe.hppPerPcs || 0,
    harga_jual_per_pcs: recipe.hargaJualPerPcs || 0,
  }), []);

  // 🧮 NEW: Calculate ingredient cost
  const calculateIngredientCost = useCallback((bahanResep: BahanResep[]): number => {
    return bahanResep.reduce((total, bahan) => {
      return total + (bahan.jumlah * bahan.hargaSatuan);
    }, 0);
  }, []);

  // 🧮 NEW: Main HPP calculation function
  const calculateHPP = useCallback((
    bahanResep: BahanResep[],
    jumlahPorsi: number,
    biayaTenagaKerja: number,
    biayaOverhead: number,
    marginKeuntunganPersen: number,
    jumlahPcsPerPorsi: number = 1
  ): HPPCalculationResult => {
    logger.context('RecipeContext', 'Calculating HPP with params:', {
      bahanCount: bahanResep.length,
      jumlahPorsi,
      biayaTenagaKerja,
      biayaOverhead,
      marginKeuntunganPersen,
      jumlahPcsPerPorsi
    });

    // Validate inputs
    if (jumlahPorsi <= 0) {
      throw new Error('Jumlah porsi harus lebih dari 0');
    }
    if (jumlahPcsPerPorsi <= 0) {
      throw new Error('Jumlah pcs per porsi harus lebih dari 0');
    }
    if (marginKeuntunganPersen < 0) {
      throw new Error('Margin keuntungan tidak boleh negatif');
    }

    // 1. Calculate total bahan baku cost
    const totalBahanBaku = calculateIngredientCost(bahanResep);

    // 2. Calculate total HPP
    const totalHPP = totalBahanBaku + biayaTenagaKerja + biayaOverhead;

    // 3. Calculate HPP per porsi
    const hppPerPorsi = totalHPP / jumlahPorsi;

    // 4. Calculate HPP per pcs
    const hppPerPcs = hppPerPorsi / jumlahPcsPerPorsi;

    // 5. Calculate margin amount
    const marginKeuntungan = (totalHPP * marginKeuntunganPersen) / 100;

    // 6. Calculate selling prices
    const hargaJualPorsi = hppPerPorsi + (marginKeuntungan / jumlahPorsi);
    const hargaJualPerPcs = hppPerPcs + (marginKeuntungan / jumlahPorsi / jumlahPcsPerPorsi);

    // 7. Calculate profitability
    const profitabilitas = totalHPP > 0 ? (marginKeuntungan / totalHPP) * 100 : 0;

    const result: HPPCalculationResult = {
      totalBahanBaku,
      biayaTenagaKerja,
      biayaOverhead,
      totalHPP,
      hppPerPorsi,
      hppPerPcs,
      marginKeuntungan,
      hargaJualPorsi,
      hargaJualPerPcs,
      profitabilitas
    };

    logger.context('RecipeContext', 'HPP calculation result:', result);
    return result;
  }, [calculateIngredientCost]);

  // 🧮 NEW: Validate recipe data
  const validateRecipeData = useCallback((recipe: Partial<NewRecipe>): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!recipe.namaResep || recipe.namaResep.trim().length === 0) {
      errors.push('Nama resep wajib diisi');
    }

    if (!recipe.jumlahPorsi || recipe.jumlahPorsi <= 0) {
      errors.push('Jumlah porsi harus lebih dari 0');
    }

    if (!recipe.bahanResep || recipe.bahanResep.length === 0) {
      errors.push('Minimal harus ada 1 bahan resep');
    }

    if (recipe.bahanResep) {
      recipe.bahanResep.forEach((bahan, index) => {
        if (!bahan.nama || bahan.nama.trim().length === 0) {
          errors.push(`Bahan resep ke-${index + 1}: Nama bahan wajib diisi`);
        }
        if (!bahan.jumlah || bahan.jumlah <= 0) {
          errors.push(`Bahan resep ke-${index + 1}: Jumlah harus lebih dari 0`);
        }
        if (!bahan.hargaSatuan || bahan.hargaSatuan <= 0) {
          errors.push(`Bahan resep ke-${index + 1}: Harga satuan harus lebih dari 0`);
        }
      });
    }

    if (recipe.biayaTenagaKerja && recipe.biayaTenagaKerja < 0) {
      errors.push('Biaya tenaga kerja tidak boleh negatif');
    }

    if (recipe.biayaOverhead && recipe.biayaOverhead < 0) {
      errors.push('Biaya overhead tidak boleh negatif');
    }

    if (recipe.marginKeuntunganPersen && recipe.marginKeuntunganPersen < 0) {
      errors.push('Margin keuntungan tidak boleh negatif');
    }

    if (recipe.jumlahPcsPerPorsi && recipe.jumlahPcsPerPorsi <= 0) {
      errors.push('Jumlah pcs per porsi harus lebih dari 0');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }, []);

  // 🧮 NEW: Search recipes
  const searchRecipes = useCallback((query: string): Recipe[] => {
    if (!query.trim()) return recipes;
    
    const lowercaseQuery = query.toLowerCase();
    return recipes.filter(recipe => 
      recipe.namaResep.toLowerCase().includes(lowercaseQuery) ||
      recipe.kategoriResep?.toLowerCase().includes(lowercaseQuery) ||
      recipe.deskripsi?.toLowerCase().includes(lowercaseQuery)
    );
  }, [recipes]);

  // 🧮 NEW: Get recipes by category
  const getRecipesByCategory = useCallback((category: string): Recipe[] => {
    if (!category.trim()) return recipes;
    return recipes.filter(recipe => recipe.kategoriResep === category);
  }, [recipes]);

  // 🔧 MOVED: All CRUD functions defined before duplicateRecipe
  const addRecipe = useCallback(async (recipe: NewRecipe): Promise<boolean> => {
    if (!user) { 
      toast.error('Anda harus login untuk menambahkan resep.');
      return false;
    }
    
    // 🧮 Validate recipe data
    const validation = validateRecipeData(recipe);
    if (!validation.isValid) {
      toast.error(`Data resep tidak valid: ${validation.errors.join(', ')}`);
      return false;
    }
    
    try {
      logger.context('RecipeContext', 'Adding recipe:', recipe);
      
      // 🧮 Calculate HPP if not provided
      if (!recipe.totalHpp || !recipe.hppPerPorsi) {
        const calculation = calculateHPP(
          recipe.bahanResep || [],
          recipe.jumlahPorsi || 1,
          recipe.biayaTenagaKerja || 0,
          recipe.biayaOverhead || 0,
          recipe.marginKeuntunganPersen || 0,
          recipe.jumlahPcsPerPorsi || 1
        );
        
        recipe.totalHpp = calculation.totalHPP;
        recipe.hppPerPorsi = calculation.hppPerPorsi;
        recipe.hargaJualPorsi = calculation.hargaJualPorsi;
        recipe.hppPerPcs = calculation.hppPerPcs;
        recipe.hargaJualPerPcs = calculation.hargaJualPerPcs;
      }

      const { error } = await supabase
        .from('recipes')
        .insert({ ...transformToDB(recipe), user_id: user.id });

      if (error) {
        logger.error('RecipeContext - Error adding recipe:', error);
        throw new Error(error.message);
      }

      // Activity log
      addActivity({ 
        title: 'Resep Baru Dibuat', 
        description: `Resep "${recipe.namaResep}" telah ditambahkan.`,
        type: 'resep',
        value: null
      });

      // Success toast
      toast.success('Resep baru berhasil ditambahkan!');

      // 🔔 CREATE SUCCESS NOTIFICATION
      await addNotification({
        title: '👨‍🍳 Resep Baru Dibuat!',
        message: `Resep "${recipe.namaResep}" berhasil ditambahkan dengan HPP Rp ${recipe.hppPerPorsi?.toLocaleString()}/porsi${recipe.hppPerPcs ? ` (Rp ${recipe.hppPerPcs.toLocaleString()}/pcs)` : ''}`,
        type: 'success',
        icon: 'chef-hat',
        priority: 2,
        related_type: 'system',
        action_url: '/resep',
        is_read: false,
        is_archived: false
      });

      return true;
    } catch (error) {
      logger.error('RecipeContext - Error in addRecipe:', error);
      toast.error(`Gagal menambah resep: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // 🔔 CREATE ERROR NOTIFICATION
      await addNotification(createNotificationHelper.systemError(
        `Gagal menambahkan resep "${recipe.namaResep}": ${error instanceof Error ? error.message : 'Unknown error'}`
      ));
      
      return false;
    }
  }, [user, validateRecipeData, calculateHPP, transformToDB, addActivity, addNotification]);

  const updateRecipe = useCallback(async (id: string, recipe: Partial<NewRecipe>): Promise<boolean> => {
    if (!user) {
      toast.error('Anda harus login untuk memperbarui resep.');
      return false;
    }
    
    try {
      logger.context('RecipeContext', 'Updating recipe:', id, recipe);
      
      // 🧮 Recalculate HPP if relevant data changed
      const existingRecipe = recipes.find(r => r.id === id);
      if (existingRecipe && (
        recipe.bahanResep || 
        recipe.jumlahPorsi !== undefined || 
        recipe.biayaTenagaKerja !== undefined || 
        recipe.biayaOverhead !== undefined || 
        recipe.marginKeuntunganPersen !== undefined ||
        recipe.jumlahPcsPerPorsi !== undefined
      )) {
        const updatedBahanResep = recipe.bahanResep || existingRecipe.bahanResep;
        const updatedJumlahPorsi = recipe.jumlahPorsi !== undefined ? recipe.jumlahPorsi : existingRecipe.jumlahPorsi;
        const updatedBiayaTenagaKerja = recipe.biayaTenagaKerja !== undefined ? recipe.biayaTenagaKerja : existingRecipe.biayaTenagaKerja;
        const updatedBiayaOverhead = recipe.biayaOverhead !== undefined ? recipe.biayaOverhead : existingRecipe.biayaOverhead;
        const updatedMarginKeuntunganPersen = recipe.marginKeuntunganPersen !== undefined ? recipe.marginKeuntunganPersen : existingRecipe.marginKeuntunganPersen;
        const updatedJumlahPcsPerPorsi = recipe.jumlahPcsPerPorsi !== undefined ? recipe.jumlahPcsPerPorsi : (existingRecipe.jumlahPcsPerPorsi || 1);
        
        const calculation = calculateHPP(
          updatedBahanResep,
          updatedJumlahPorsi,
          updatedBiayaTenagaKerja,
          updatedBiayaOverhead,
          updatedMarginKeuntunganPersen,
          updatedJumlahPcsPerPorsi
        );
        
        recipe.totalHpp = calculation.totalHPP;
        recipe.hppPerPorsi = calculation.hppPerPorsi;
        recipe.hargaJualPorsi = calculation.hargaJualPorsi;
        recipe.hppPerPcs = calculation.hppPerPcs;
        recipe.hargaJualPerPcs = calculation.hargaJualPerPcs;
      }

      const { error } = await supabase
        .from('recipes')
        .update(transformToDB(recipe))
        .eq('id', id);

      if (error) {
        logger.error('RecipeContext - Error updating recipe:', error);
        throw new Error(error.message);
      }
      
      // Activity log
      addActivity({ 
        title: 'Resep Diperbarui', 
        description: `Resep "${recipe.namaResep || '...'}" telah diperbarui.`,
        type: 'resep',
        value: null
      });

      // Success toast
      toast.success('Resep berhasil diperbarui!');

      // 🔔 CREATE UPDATE NOTIFICATION
      await addNotification({
        title: '📝 Resep Diperbarui',
        message: `Resep "${recipe.namaResep || 'resep'}" telah diperbarui${recipe.hppPerPorsi ? ` dengan HPP Rp ${recipe.hppPerPorsi.toLocaleString()}/porsi` : ''}`,
        type: 'info',
        icon: 'edit',
        priority: 1,
        related_type: 'system',
        action_url: '/resep',
        is_read: false,
        is_archived: false
      });

      return true;
    } catch (error) {
      logger.error('RecipeContext - Error in updateRecipe:', error);
      toast.error(`Gagal memperbarui resep: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // 🔔 CREATE ERROR NOTIFICATION
      await addNotification(createNotificationHelper.systemError(
        `Gagal memperbarui resep: ${error instanceof Error ? error.message : 'Unknown error'}`
      ));
      
      return false;
    }
  }, [user, recipes, calculateHPP, transformToDB, addActivity, addNotification]);

  const deleteRecipe = useCallback(async (id: string): Promise<boolean> => {
    if (!user) {
      toast.error('Anda harus login untuk menghapus resep.');
      return false;
    }
    
    try {
      const recipeToDelete = recipes.find(r => r.id === id);
      if (!recipeToDelete) {
        toast.error('Resep tidak ditemukan');
        return false;
      }

      logger.context('RecipeContext', 'Deleting recipe:', id);
      const { error } = await supabase.from('recipes').delete().eq('id', id);

      if (error) {
        logger.error('RecipeContext - Error deleting recipe:', error);
        throw new Error(error.message);
      }
      
      // Activity log
      addActivity({ 
        title: 'Resep Dihapus', 
        description: `Resep "${recipeToDelete.namaResep}" telah dihapus.`,
        type: 'resep',
        value: null
      });

      // Success toast
      toast.success('Resep berhasil dihapus.');

      // 🔔 CREATE DELETE NOTIFICATION
      await addNotification({
        title: '🗑️ Resep Dihapus',
        message: `Resep "${recipeToDelete.namaResep}" telah dihapus dari koleksi`,
        type: 'warning',
        icon: 'trash-2',
        priority: 2,
        related_type: 'system',
        action_url: '/resep',
        is_read: false,
        is_archived: false
      });

      return true;
    } catch (error) {
      logger.error('RecipeContext - Error in deleteRecipe:', error);
      toast.error(`Gagal menghapus resep: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // 🔔 CREATE ERROR NOTIFICATION
      await addNotification(createNotificationHelper.systemError(
        `Gagal menghapus resep: ${error instanceof Error ? error.message : 'Unknown error'}`
      ));
      
      return false;
    }
  }, [user, recipes, addActivity, addNotification]);

  // 🧮 NEW: Duplicate recipe (NOW PROPERLY PLACED AFTER addRecipe)
  const duplicateRecipe = useCallback(async (id: string, newName: string): Promise<boolean> => {
    if (!user) {
      toast.error('Anda harus login untuk menduplikasi resep.');
      return false;
    }

    try {
      const originalRecipe = recipes.find(r => r.id === id);
      if (!originalRecipe) {
        toast.error('Resep tidak ditemukan');
        return false;
      }

      const duplicatedRecipe: NewRecipe = {
        namaResep: newName,
        jumlahPorsi: originalRecipe.jumlahPorsi,
        kategoriResep: originalRecipe.kategoriResep,
        deskripsi: originalRecipe.deskripsi,
        fotoUrl: originalRecipe.fotoUrl,
        bahanResep: [...originalRecipe.bahanResep],
        biayaTenagaKerja: originalRecipe.biayaTenagaKerja,
        biayaOverhead: originalRecipe.biayaOverhead,
        marginKeuntunganPersen: originalRecipe.marginKeuntunganPersen,
        totalHpp: originalRecipe.totalHpp,
        hppPerPorsi: originalRecipe.hppPerPorsi,
        hargaJualPorsi: originalRecipe.hargaJualPorsi || 0, // 🔧 FIX: Ensure fallback value
        jumlahPcsPerPorsi: originalRecipe.jumlahPcsPerPorsi || 1,
        hppPerPcs: originalRecipe.hppPerPcs || 0,
        hargaJualPerPcs: originalRecipe.hargaJualPerPcs || 0,
      };

      const success = await addRecipe(duplicatedRecipe);
      if (success) {
        await addNotification({
          title: '📋 Resep Diduplikasi',
          message: `Resep "${newName}" berhasil diduplikasi dari "${originalRecipe.namaResep}"`,
          type: 'success',
          icon: 'copy',
          priority: 2,
          related_type: 'system',
          action_url: '/resep',
          is_read: false,
          is_archived: false
        });
      }

      return success;
    } catch (error) {
      logger.error('RecipeContext - Error duplicating recipe:', error);
      toast.error('Gagal menduplikasi resep');
      return false;
    }
  }, [user, recipes, addRecipe, addNotification]);

  // Data fetching and real-time setup
  useEffect(() => {
    if (!user) {
      setRecipes([]);
      setIsLoading(false);
      return;
    }

    const fetchRecipes = async () => {
      setIsLoading(true);
      
      try {
        logger.context('RecipeContext', 'Fetching recipes for user:', user.id);
        const { data, error } = await supabase
          .from('recipes')
          .select('*')
          .eq('user_id', user.id)
          .order('nama_resep', { ascending: true });

        if (error) {
          logger.error('RecipeContext - Error fetching recipes:', error);
          toast.error(`Gagal memuat resep: ${error.message}`);
          
          // 🔔 CREATE ERROR NOTIFICATION
          await addNotification(createNotificationHelper.systemError(
            `Gagal memuat data resep: ${error.message}`
          ));
        } else {
          setRecipes(data.map(transformFromDB));
          logger.context('RecipeContext', `Loaded ${data.length} recipes`);
        }
      } catch (error) {
        logger.error('RecipeContext - Unexpected error:', error);
        await addNotification(createNotificationHelper.systemError(
          `Error tidak terduga saat memuat resep: ${error instanceof Error ? error.message : 'Unknown error'}`
        ));
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRecipes();
    
    const channel = supabase.channel(`realtime-recipes-${user.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'recipes', 
        filter: `user_id=eq.${user.id}` 
      }, (payload) => {
        logger.context('RecipeContext', 'Real-time event received:', payload);
        
        if (payload.eventType === 'INSERT') {
          setRecipes(current => [transformFromDB(payload.new), ...current].sort((a,b) => a.namaResep.localeCompare(b.namaResep)));
        }
        if (payload.eventType === 'UPDATE') {
          setRecipes(current => current.map(r => r.id === payload.new.id ? transformFromDB(payload.new) : r));
        }
        if (payload.eventType === 'DELETE') {
          setRecipes(current => current.filter(r => r.id !== payload.old.id));
        }
      })
      .subscribe();
      
    return () => {
      logger.context('RecipeContext', 'Cleaning up real-time channel');
      supabase.removeChannel(channel);
    };
  }, [user, addNotification, transformFromDB]);

  const value: RecipeContextType = {
    recipes,
    isLoading,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    // 🧮 NEW HPP calculation functions
    calculateHPP,
    validateRecipeData,
    duplicateRecipe,
    searchRecipes,
    getRecipesByCategory,
    calculateIngredientCost,
  };

  return (
    <RecipeContext.Provider value={value}>
      {children}
    </RecipeContext.Provider>
  );
};

export const useRecipe = () => {
  const context = useContext(RecipeContext);
  if (context === undefined) {
    throw new Error('useRecipe must be used within a RecipeProvider');
  }
  return context;
};