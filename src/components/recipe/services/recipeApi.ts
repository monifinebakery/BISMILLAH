// src/components/recipe/services/recipeApi.ts - useQuery Optimized
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type { Recipe, RecipeDB, NewRecipe } from '../types';

// ✅ Standardized API Response Types for useQuery
export interface ApiResponse<T> {
  data: T;
  error?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

/**
 * Recipe API Service optimized for useQuery
 */
class RecipeApiService {
  private readonly tableName = 'recipes';

  // ✅ Get current user ID with error handling
  private async getCurrentUserId(): Promise<string> {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      logger.error('RecipeAPI: User not authenticated', error);
      throw new Error('User not authenticated');
    }
    return user.id;
  }

  // Transform database format to frontend format
  private transformFromDB = (data: RecipeDB): Recipe => ({
    id: data.id,
    userId: data.user_id,
    namaResep: data.nama_resep,
    jumlahPorsi: data.jumlah_porsi,
    kategoriResep: data.kategori_resep,
    deskripsi: data.deskripsi,
    fotoUrl: data.foto_url,
    bahanResep: data.bahan_resep,
    biayaTenagaKerja: data.biaya_tenaga_kerja,
    biayaOverhead: data.biaya_overhead,
    marginKeuntunganPersen: data.margin_keuntungan_persen,
    totalHpp: data.total_hpp,
    hppPerPorsi: data.hpp_per_porsi,
    hargaJualPorsi: data.harga_jual_porsi,
    jumlahPcsPerPorsi: data.jumlah_pcs_per_porsi,
    hppPerPcs: data.hpp_per_pcs,
    hargaJualPerPcs: data.harga_jual_per_pcs,
    createdAt: data.created_at ? new Date(data.created_at) : null,
    updatedAt: data.updated_at ? new Date(data.updated_at) : null,
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
   * ✅ useQuery-optimized: Get all recipes
   * Automatically handles auth and throws errors for useQuery
   * This is the specific function called by PromoCalculator.jsx
   */
  async getAllRecipes(): Promise<Recipe[]> {
    // Wrapper for getRecipes without filters to match PromoCalculator's expectation
    return this.getRecipes();
  }

  /**
   * ✅ useQuery-optimized: Get all recipes
   * Automatically handles auth and throws errors for useQuery
   */
  async getRecipes(filters?: {
    category?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<Recipe[]> {
    try {
      const userId = await this.getCurrentUserId();
      logger.debug('RecipeAPI: Fetching recipes with filters:', filters);

      let query = supabase
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId);

      // Apply filters
      if (filters?.category) {
        query = query.eq('kategori_resep', filters.category);
      }
      if (filters?.search) {
        query = query.or(
          `nama_resep.ilike.%${filters.search}%,kategori_resep.ilike.%${filters.search}%,deskripsi.ilike.%${filters.search}%`
        );
      }

      // Apply sorting
      const sortBy = filters?.sortBy || 'nama_resep';
      const ascending = (filters?.sortOrder || 'asc') === 'asc';
      query = query.order(sortBy, { ascending });

      const { data, error } = await query;

      if (error) {
        logger.error('RecipeAPI: Error fetching recipes:', error);
        throw new Error(error.message);
      }

      const transformedData = (data || []).map(this.transformFromDB);
      logger.debug(`RecipeAPI: Successfully fetched ${transformedData.length} recipes`);
      return transformedData;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unexpected error fetching recipes');
    }
  }

  /**
   * ✅ useQuery-optimized: Get single recipe by ID
   */
  async getRecipe(id: string): Promise<Recipe> {
    try {
      const userId = await this.getCurrentUserId();
      logger.debug('RecipeAPI: Fetching recipe by ID:', id);

      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (error) {
        logger.error('RecipeAPI: Error fetching recipe by ID:', error);
        throw new Error(error.message);
      }

      return this.transformFromDB(data);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unexpected error fetching recipe');
    }
  }

  /**
   * ✅ useMutation-optimized: Create new recipe
   */
  async createRecipe(recipe: NewRecipe): Promise<Recipe> {
    try {
      const userId = await this.getCurrentUserId();
      logger.debug('RecipeAPI: Creating new recipe:', recipe.namaResep);

      const dbData = this.transformToDB(recipe);

      const { data, error } = await supabase
        .from(this.tableName)
        .insert({ ...dbData, user_id: userId })
        .select()
        .single();

      if (error) {
        logger.error('RecipeAPI: Error creating recipe:', error);
        throw new Error(error.message);
      }

      const transformedData = this.transformFromDB(data);
      logger.debug('RecipeAPI: Successfully created recipe:', transformedData.id);
      return transformedData;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unexpected error creating recipe');
    }
  }

  /**
   * ✅ useMutation-optimized: Update existing recipe
   */
  async updateRecipe(id: string, updates: Partial<NewRecipe>): Promise<Recipe> {
    try {
      const userId = await this.getCurrentUserId();
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
        throw new Error(error.message);
      }

      const transformedData = this.transformFromDB(data);
      logger.debug('RecipeAPI: Successfully updated recipe:', transformedData.id);
      return transformedData;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unexpected error updating recipe');
    }
  }

  /**
   * ✅ useMutation-optimized: Delete recipe
   */
  async deleteRecipe(id: string): Promise<void> {
    try {
      const userId = await this.getCurrentUserId();
      logger.debug('RecipeAPI: Deleting recipe:', id);

      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        logger.error('RecipeAPI: Error deleting recipe:', error);
        throw new Error(error.message);
      }

      logger.debug('RecipeAPI: Successfully deleted recipe:', id);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unexpected error deleting recipe');
    }
  }

  /**
   * ✅ useMutation-optimized: Duplicate recipe
   */
  async duplicateRecipe(id: string, newName: string): Promise<Recipe> {
    try {
      const userId = await this.getCurrentUserId();
      logger.debug('RecipeAPI: Duplicating recipe:', id, 'with new name:', newName);

      // First, get the original recipe
      const original = await this.getRecipe(id);

      // Create new recipe data
      const duplicateData: NewRecipe = {
        ...original,
        namaResep: newName,
        // Remove IDs and timestamps that shouldn't be copied
      } as unknown as NewRecipe; // Type assertion to avoid issues with readonly/derived fields

      // Create the duplicate
      return await this.createRecipe(duplicateData);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unexpected error duplicating recipe');
    }
  }

  /**
   * ✅ useQuery-optimized: Get unique categories
   */
  async getUniqueCategories(): Promise<string[]> {
    try {
      const userId = await this.getCurrentUserId();
      logger.debug('RecipeAPI: Fetching unique categories');

      const { data, error } = await supabase
        .from(this.tableName)
        .select('kategori_resep')
        .eq('user_id', userId)
        .not('kategori_resep', 'is', null)
        .not('kategori_resep', 'eq', '');

      if (error) {
        logger.error('RecipeAPI: Error fetching categories:', error);
        throw new Error(error.message);
      }

      // Extract unique categories
      const categories = [...new Set((data || []).map(item => item.kategori_resep!).filter(Boolean))].sort();
      logger.debug(`RecipeAPI: Found ${categories.length} unique categories`);
      return categories;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unexpected error fetching categories');
    }
  }

  /**
   * ✅ useMutation-optimized: Bulk delete recipes
   */
  async bulkDeleteRecipes(ids: string[]): Promise<void> {
    try {
      const userId = await this.getCurrentUserId();
      logger.debug('RecipeAPI: Bulk deleting recipes:', ids.length);

      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .in('id', ids)
        .eq('user_id', userId);

      if (error) {
        logger.error('RecipeAPI: Error bulk deleting recipes:', error);
        throw new Error(error.message);
      }

      logger.debug('RecipeAPI: Successfully bulk deleted recipes:', ids.length);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unexpected error bulk deleting recipes');
    }
  }

  /**
   * ✅ useMutation-optimized: Bulk update recipes
   */
  async bulkUpdateRecipes(updates: { id: string; data: Partial<NewRecipe> }[]): Promise<Recipe[]> {
    try {
      const userId = await this.getCurrentUserId();
      logger.debug('RecipeAPI: Bulk updating recipes:', updates.length);

      const results = await Promise.all(
        updates.map(async ({ id, data }) => {
          return await this.updateRecipe(id, data);
        })
      );

      logger.debug('RecipeAPI: Successfully bulk updated recipes:', results.length);
      return results;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unexpected error bulk updating recipes');
    }
  }

  /**
   * ✅ Real-time subscription for useQuery integration
   * Returns subscription cleanup function
   */
  setupRealtimeSubscription(
    onInsert?: (recipe: Recipe) => void,
    onUpdate?: (recipe: Recipe) => void,
    onDelete?: (id: string) => void
  ): () => void {
    logger.debug('RecipeAPI: Setting up real-time subscription');

    const channel = supabase
      .channel('recipes-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: this.tableName,
        },
        async (payload) => {
          logger.debug('RecipeAPI: Real-time event received:', payload.eventType);
          try {
            // Check if the change is for current user
            const userId = await this.getCurrentUserId();
            const changeUserId = (payload.new as RecipeDB)?.user_id || (payload.old as RecipeDB)?.user_id;

            if (changeUserId === userId) {
              switch (payload.eventType) {
                case 'INSERT':
                  if (onInsert) onInsert(this.transformFromDB(payload.new as RecipeDB));
                  break;
                case 'UPDATE':
                  if (onUpdate) onUpdate(this.transformFromDB(payload.new as RecipeDB));
                  break;
                case 'DELETE':
                  if (onDelete) onDelete(payload.old!.id);
                  break;
              }
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

  /**
   * ✅ Health check method for debugging
   */
  async healthCheck(): Promise<{ isConnected: boolean; userAuthenticated: boolean; error?: string }> {
    try {
      // Check Supabase connection
      const { error: connectionError } = await supabase.from(this.tableName).select('count').limit(1);
      if (connectionError) {
        return { isConnected: false, userAuthenticated: false, error: connectionError.message };
      }

      // Check user authentication
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { isConnected: true, userAuthenticated: false };
      }

      return { isConnected: true, userAuthenticated: true };
    } catch (error: any) {
      logger.error('RecipeAPI: Health check failed:', error);
      return {
        isConnected: false,
        userAuthenticated: false,
        error: error.message || 'Unknown error during health check'
      };
    }
  }
}

// Export a singleton instance
const recipeApi = new RecipeApiService();
export default recipeApi;

// Export types for convenience
export type { Recipe, NewRecipe };