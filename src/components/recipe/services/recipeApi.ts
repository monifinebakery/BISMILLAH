// src/components/recipe/services/recipeApi.ts

import { supabase } from '@/lib/supabase';
import { logger } from '@/utils/logger';
import type { Recipe, RecipeDB, NewRecipe, RecipeApiResponse } from '../types';

/**
 * Recipe API Service with data transformation
 */
class RecipeApiService {
  private readonly tableName = 'recipes';

  // Transform database format to frontend format
  private transformFromDB = (dbItem: RecipeDB): Recipe => ({
    id: dbItem.id,
    userId: dbItem.user_id,
    createdAt: new Date(dbItem.created_at),
    updatedAt: new Date(dbItem.updated_at),
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
    hargaJualPorsi: Number(dbItem.harga_jual_porsi) || 0,
    jumlahPcsPerPorsi: Number(dbItem.jumlah_pcs_per_porsi) || 1,
    hppPerPcs: Number(dbItem.hpp_per_pcs) || 0,
    hargaJualPerPcs: Number(dbItem.harga_jual_per_pcs) || 0,
  });

  // Transform frontend format to database format
  private transformToDB = (recipe: Partial<NewRecipe>) => ({
    nama_resep: recipe.namaResep,
    jumlah_porsi: recipe.jumlahPorsi,
    kategori_resep: recipe.kategoriResep,
    deskripsi: recipe.deskripsi,
    foto_url: recipe.fotoUrl,
    bahan_resep: recipe.bahanResep,
    biaya_tenaga_kerja: recipe.biayaTenagaKerja || 0,
    biaya_overhead: recipe.biayaOverhead || 0,
    margin_keuntungan_persen: recipe.marginKeuntunganPersen || 0,
    total_hpp: recipe.totalHpp || 0,
    hpp_per_porsi: recipe.hppPerPorsi || 0,
    harga_jual_porsi: recipe.hargaJualPorsi || 0,
    jumlah_pcs_per_porsi: recipe.jumlahPcsPerPorsi || 1,
    hpp_per_pcs: recipe.hppPerPcs || 0,
    harga_jual_per_pcs: recipe.hargaJualPerPcs || 0,
  });

  /**
   * Fetch all recipes for a user
   */
  async fetchRecipes(userId: string): Promise<RecipeApiResponse> {
    try {
      logger.debug('RecipeAPI: Fetching recipes for user:', userId);

      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .order('nama_resep', { ascending: true });

      if (error) {
        logger.error('RecipeAPI: Error fetching recipes:', error);
        return { data: [], error: error.message };
      }

      const transformedData = (data || []).map(this.transformFromDB);
      logger.debug(`RecipeAPI: Successfully fetched ${transformedData.length} recipes`);

      return { data: transformedData };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('RecipeAPI: Unexpected error in fetchRecipes:', error);
      return { data: [], error: errorMessage };
    }
  }

  /**
   * Fetch single recipe by ID
   */
  async fetchRecipeById(id: string, userId: string): Promise<{ data: Recipe | null; error?: string }> {
    try {
      logger.debug('RecipeAPI: Fetching recipe by ID:', id);

      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (error) {
        logger.error('RecipeAPI: Error fetching recipe by ID:', error);
        return { data: null, error: error.message };
      }

      const transformedData = this.transformFromDB(data);
      return { data: transformedData };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('RecipeAPI: Unexpected error in fetchRecipeById:', error);
      return { data: null, error: errorMessage };
    }
  }

  /**
   * Add new recipe
   */
  async addRecipe(recipe: NewRecipe, userId: string): Promise<{ success: boolean; error?: string; data?: Recipe }> {
    try {
      logger.debug('RecipeAPI: Adding new recipe:', recipe.namaResep);

      const dbData = this.transformToDB(recipe);
      const { data, error } = await supabase
        .from(this.tableName)
        .insert({ ...dbData, user_id: userId })
        .select()
        .single();

      if (error) {
        logger.error('RecipeAPI: Error adding recipe:', error);
        return { success: false, error: error.message };
      }

      const transformedData = this.transformFromDB(data);
      logger.debug('RecipeAPI: Successfully added recipe:', transformedData.id);

      return { success: true, data: transformedData };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('RecipeAPI: Unexpected error in addRecipe:', error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Update existing recipe
   */
  async updateRecipe(
    id: string, 
    updates: Partial<NewRecipe>, 
    userId: string
  ): Promise<{ success: boolean; error?: string; data?: Recipe }> {
    try {
      logger.debug('RecipeAPI: Updating recipe:', id);

      const dbUpdates = this.transformToDB(updates);
      const { data, error } = await supabase
        .from(this.tableName)
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        logger.error('RecipeAPI: Error updating recipe:', error);
        return { success: false, error: error.message };
      }

      const transformedData = this.transformFromDB(data);
      logger.debug('RecipeAPI: Successfully updated recipe:', transformedData.id);

      return { success: true, data: transformedData };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('RecipeAPI: Unexpected error in updateRecipe:', error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Delete recipe
   */
  async deleteRecipe(id: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      logger.debug('RecipeAPI: Deleting recipe:', id);

      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        logger.error('RecipeAPI: Error deleting recipe:', error);
        return { success: false, error: error.message };
      }

      logger.debug('RecipeAPI: Successfully deleted recipe:', id);
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('RecipeAPI: Unexpected error in deleteRecipe:', error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Bulk delete recipes
   */
  async bulkDeleteRecipes(ids: string[], userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      logger.debug('RecipeAPI: Bulk deleting recipes:', ids.length);

      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .in('id', ids)
        .eq('user_id', userId);

      if (error) {
        logger.error('RecipeAPI: Error bulk deleting recipes:', error);
        return { success: false, error: error.message };
      }

      logger.debug('RecipeAPI: Successfully bulk deleted recipes:', ids.length);
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('RecipeAPI: Unexpected error in bulkDeleteRecipes:', error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Search recipes by text
   */
  async searchRecipes(
    query: string, 
    userId: string
  ): Promise<RecipeApiResponse> {
    try {
      logger.debug('RecipeAPI: Searching recipes with query:', query);

      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .or(`nama_resep.ilike.%${query}%,kategori_resep.ilike.%${query}%,deskripsi.ilike.%${query}%`)
        .order('nama_resep', { ascending: true });

      if (error) {
        logger.error('RecipeAPI: Error searching recipes:', error);
        return { data: [], error: error.message };
      }

      const transformedData = (data || []).map(this.transformFromDB);
      logger.debug(`RecipeAPI: Found ${transformedData.length} recipes matching query`);

      return { data: transformedData };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('RecipeAPI: Unexpected error in searchRecipes:', error);
      return { data: [], error: errorMessage };
    }
  }

  /**
   * Get recipes by category
   */
  async getRecipesByCategory(
    category: string, 
    userId: string
  ): Promise<RecipeApiResponse> {
    try {
      logger.debug('RecipeAPI: Fetching recipes by category:', category);

      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .eq('kategori_resep', category)
        .order('nama_resep', { ascending: true });

      if (error) {
        logger.error('RecipeAPI: Error fetching recipes by category:', error);
        return { data: [], error: error.message };
      }

      const transformedData = (data || []).map(this.transformFromDB);
      logger.debug(`RecipeAPI: Found ${transformedData.length} recipes in category ${category}`);

      return { data: transformedData };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('RecipeAPI: Unexpected error in getRecipesByCategory:', error);
      return { data: [], error: errorMessage };
    }
  }

  /**
   * Setup real-time subscription
   */
  setupRealtimeSubscription(
    userId: string,
    onInsert?: (recipe: Recipe) => void,
    onUpdate?: (recipe: Recipe) => void,
    onDelete?: (id: string) => void
  ) {
    logger.debug('RecipeAPI: Setting up real-time subscription for user:', userId);

    const channel = supabase
      .channel(`recipes-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: this.tableName,
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          logger.debug('RecipeAPI: Real-time event received:', payload.eventType);

          try {
            switch (payload.eventType) {
              case 'INSERT':
                if (payload.new && onInsert) {
                  const transformedData = this.transformFromDB(payload.new as RecipeDB);
                  onInsert(transformedData);
                }
                break;
              case 'UPDATE':
                if (payload.new && onUpdate) {
                  const transformedData = this.transformFromDB(payload.new as RecipeDB);
                  onUpdate(transformedData);
                }
                break;
              case 'DELETE':
                if (payload.old && onDelete) {
                  onDelete((payload.old as RecipeDB).id);
                }
                break;
            }
          } catch (error) {
            logger.error('RecipeAPI: Error processing real-time event:', error);
          }
        }
      )
      .subscribe();

    return () => {
      logger.debug('RecipeAPI: Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }
}

// Export singleton instance
export const recipeApi = new RecipeApiService();