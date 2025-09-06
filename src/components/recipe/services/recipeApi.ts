// src/components/recipe/services/recipeApi.ts - useQuery Optimized
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { Recipe, RecipeDB, NewRecipe } from '../types';
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
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      throw new Error(`Authentication error: ${error.message}`);
    }
    if (!session?.user) {
      throw new Error('User not authenticated');
    }
    return session.user.id;
  }
  // Transform database format to frontend format
  private transformFromDB(dbItem: RecipeDB): Recipe {
    return {
    id: dbItem.id,
    userId: dbItem.user_id,
    createdAt: new Date(dbItem.created_at),
    updatedAt: new Date(dbItem.updated_at),
    namaResep: dbItem.nama_resep,
    jumlahPorsi: Number(dbItem.jumlah_porsi),
    kategoriResep: dbItem.kategori_resep,
    deskripsi: dbItem.deskripsi,
    fotoUrl: dbItem.foto_url,
    fotoBase64: dbItem.foto_base64,
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
    };
  }

  // Transform frontend format to database format
  private transformToDB(recipe: Partial<NewRecipe>) {
    return {
      nama_resep: recipe.namaResep,
      jumlah_porsi: recipe.jumlahPorsi,
      kategori_resep: recipe.kategoriResep,
      deskripsi: recipe.deskripsi,
      foto_url: recipe.fotoUrl,
      foto_base64: recipe.fotoBase64,
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
    };
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
        .select('id, user_id, created_at, updated_at, nama_resep, jumlah_porsi, kategori_resep, deskripsi, foto_url, bahan_resep, biaya_tenaga_kerja, biaya_overhead, margin_keuntungan_persen, total_hpp, hpp_per_porsi, harga_jual_porsi, jumlah_pcs_per_porsi, hpp_per_pcs, harga_jual_per_pcs')
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
      const transformedData = (data || []).map((item) => {
         const dbItem: RecipeDB = {
           ...item,
           kategori_resep: item.kategori_resep || undefined,
           bahan_resep: (item.bahan_resep as any) || []
         } as RecipeDB;
         return this.transformFromDB(dbItem);
       });
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
        .select('id, user_id, created_at, updated_at, nama_resep, jumlah_porsi, kategori_resep, deskripsi, foto_url, bahan_resep, biaya_tenaga_kerja, biaya_overhead, margin_keuntungan_persen, total_hpp, hpp_per_porsi, harga_jual_porsi, jumlah_pcs_per_porsi, hpp_per_pcs, harga_jual_per_pcs')
        .eq('id', id)
        .eq('user_id', userId)
        .single();
      if (error) {
        logger.error('RecipeAPI: Error fetching recipe by ID:', error);
        throw new Error(error.message);
      }
      const dbItem: RecipeDB = {
        ...data,
        kategori_resep: data.kategori_resep || undefined,
        bahan_resep: (data.bahan_resep as any) || []
      } as RecipeDB;
      return this.transformFromDB(dbItem);
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
        .insert({
          ...dbData,
          user_id: userId,
          bahan_resep: dbData.bahan_resep as any
        })
        .select()
        .single();

      if (error) {
        logger.error('RecipeAPI: Error creating recipe:', error);
        throw new Error(error.message);
      }

      // ✅ TAMBAHKAN: Validasi data dari Supabase
      if (!data) {
        const errorMsg = 'Gagal membuat resep: Data tidak diterima dari database';
        logger.error('RecipeAPI: No data returned from Supabase after creating recipe');
        throw new Error(errorMsg);
      }
      
      if (!data.id) {
        const errorMsg = 'Gagal membuat resep: ID tidak ditemukan dalam data dari database';
        logger.error('RecipeAPI: Created recipe data missing ID:', data);
        throw new Error(errorMsg);
      }

      const dbItem: RecipeDB = {
        ...data,
        kategori_resep: data.kategori_resep || undefined,
        bahan_resep: (data.bahan_resep as any) || []
      } as RecipeDB;
      const transformedData = this.transformFromDB(dbItem);
      
      // ✅ TAMBAHKAN: Validasi hasil transformasi
      if (!transformedData.id) {
        const errorMsg = 'Gagal membuat resep: ID tidak valid setelah transformasi';
        logger.error('RecipeAPI: Transformed recipe data missing ID:', transformedData);
        throw new Error(errorMsg);
      }

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
        .update({
          ...dbUpdates,
          bahan_resep: dbUpdates.bahan_resep as any
        })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        logger.error('RecipeAPI: Error updating recipe:', error);
        throw new Error(error.message);
        throw new Error(errorMsg);
      }
        .insert({
          ...dbData,
          user_id: userId,
          bahan_resep: dbData.bahan_resep as any
        })
      if (!data.id) {
        const errorMsg = 'Gagal memperbarui resep: ID tidak ditemukan dalam data dari database';
        logger.error('RecipeAPI: Updated recipe data missing ID:', data);
        throw new Error(errorMsg);
      }

      const dbItem: RecipeDB = {
        ...data,
        kategori_resep: data.kategori_resep || undefined,
        bahan_resep: (data.bahan_resep as any) || []
      } as RecipeDB;
      const transformedData = this.transformFromDB(dbItem);

      // ✅ TAMBAHKAN: Validasi hasil transformasi
      if (!transformedData.id) {
        const errorMsg = 'Gagal memperbarui resep: ID tidak valid setelah transformasi';
        logger.error('RecipeAPI: Transformed recipe data missing ID:', transformedData);
        throw new Error(errorMsg);
      }

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
      };
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
      const categories = [...new Set(
        (data || [])
          .map(item => item.kategori_resep)
          .filter(Boolean)
      )].sort();
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
      logger.debug('RecipeAPI: Duplicating recipe:', id, 'with new name:', newName);
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
          .filter(Boolean)
          logger.debug('RecipeAPI: Real-time event received:', payload.eventType);
          try {
            // Check if the change is for current user
            const userId = await this.getCurrentUserId();
            const changeUserId = (payload.new as RecipeDB)?.user_id || (payload.old as RecipeDB)?.user_id;
            if (changeUserId !== userId) {
              return; // Ignore changes for other users
            }
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
      try {
        await this.getCurrentUserId();
        return { isConnected: true, userAuthenticated: true };
      } catch (authError) {
        return { isConnected: true, userAuthenticated: false, error: authError instanceof Error ? authError.message : String(authError) };
      }
    } catch (error) {
      return { 
        isConnected: false, 
        userAuthenticated: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}
// Export singleton instance
export const recipeApi = new RecipeApiService();

// Export paginated function for direct use
export const getRecipesPaginated = recipeApi.getRecipesPaginated.bind(recipeApi);
// ✅ Export additional types for useQuery integration
export type RecipeFilters = {
  category?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

export type PaginationParams = {
  page?: number;
  limit?: number;
  offset?: number;
};

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type BulkUpdateData = {
  id: string;
  data: Partial<NewRecipe>;
};