// src/components/recipe/services/recipeMigrationService.ts
// 🔄 Recipe Migration Service 
// Handles migration from legacy fixed overhead to auto-sync overhead

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { getCurrentAppSettings } from '@/components/operational-costs/utils/enhancedHppCalculations';

export interface RecipeMigrationStatus {
  isLegacyRecipe: boolean;
  hasFixedOverhead: boolean;
  canMigrate: boolean;
  currentOverheadValue: number;
  suggestedAutoOverheadValue: number | null;
  migrationNotes: string[];
}

export interface RecipeMigrationResult {
  recipeId: string;
  recipeName: string;
  success: boolean;
  oldOverheadValue: number;
  newOverheadValue: number;
  migrationDate: string;
  notes: string[];
}

export interface BulkMigrationSummary {
  totalRecipes: number;
  migratedCount: number;
  skippedCount: number;
  failedCount: number;
  results: RecipeMigrationResult[];
  summary: string;
}

/**
 * Check if a recipe is using legacy fixed overhead system
 */
export const checkRecipeMigrationStatus = async (
  recipeId: string
): Promise<RecipeMigrationStatus> => {
  try {
    logger.info('🔍 Checking recipe migration status:', recipeId);

    // Get recipe data
    const { data: recipe, error } = await supabase
      .from('recipes')
      .select('id, nama_resep, biaya_overhead, biaya_tenaga_kerja, updated_at')
      .eq('id', recipeId)
      .single();

    if (error || !recipe) {
      throw new Error(`Failed to fetch recipe: ${error?.message}`);
    }

    const currentOverheadValue = Number(recipe.biaya_overhead) || 0;
    const hasFixedOverhead = currentOverheadValue > 0;

    // Get current auto-sync overhead value for comparison
    let suggestedAutoOverheadValue: number | null = null;
    try {
      const appSettings = await getCurrentAppSettings();
      suggestedAutoOverheadValue = 
        (appSettings?.overhead_per_pcs || 0) + (appSettings?.operasional_per_pcs || 0);
    } catch (error) {
      logger.warn('⚠️ Could not fetch app settings for comparison:', error);
    }

    // Determine if this is a legacy recipe (created before auto-sync era)
    const recipeDate = new Date(recipe.updated_at);
    const autoSyncEraStart = new Date('2025-01-16'); // Update ini dilakukan setelah tanggal ini
    const isLegacyRecipe = recipeDate < autoSyncEraStart;

    // Build migration notes
    const migrationNotes: string[] = [];
    
    if (hasFixedOverhead) {
      migrationNotes.push(
        `Recipe menggunakan biaya overhead tetap: Rp ${currentOverheadValue.toLocaleString('id-ID')}`
      );
    }

    if (suggestedAutoOverheadValue && suggestedAutoOverheadValue > 0) {
      migrationNotes.push(
        `Auto-sync overhead tersedia: Rp ${suggestedAutoOverheadValue.toLocaleString('id-ID')}/pcs`
      );
      
      if (hasFixedOverhead) {
        const difference = Math.abs(currentOverheadValue - suggestedAutoOverheadValue);
        const percentDiff = currentOverheadValue > 0 ? (difference / currentOverheadValue) * 100 : 0;
        
        migrationNotes.push(
          `Selisih: Rp ${difference.toLocaleString('id-ID')} (${percentDiff.toFixed(1)}%)`
        );
      }
    } else {
      migrationNotes.push('Auto-sync overhead belum dikonfigurasi di Biaya Operasional');
    }

    const canMigrate = suggestedAutoOverheadValue !== null && suggestedAutoOverheadValue > 0;

    return {
      isLegacyRecipe,
      hasFixedOverhead,
      canMigrate,
      currentOverheadValue,
      suggestedAutoOverheadValue,
      migrationNotes,
    };

  } catch (error) {
    logger.error('❌ Error checking recipe migration status:', error);
    throw error;
  }
};

/**
 * Migrate a single recipe from fixed overhead to auto-sync
 */
export const migrateRecipeToAutoSync = async (
  recipeId: string,
  options: {
    preserveOriginalOverhead?: boolean;
    addMigrationNote?: boolean;
  } = {}
): Promise<RecipeMigrationResult> => {
  const { preserveOriginalOverhead = false, addMigrationNote = true } = options;

  try {
    logger.info('🔄 Starting recipe migration:', recipeId);

    // First, check migration status
    const migrationStatus = await checkRecipeMigrationStatus(recipeId);
    
    if (!migrationStatus.canMigrate) {
      throw new Error('Cannot migrate: Auto-sync overhead not available');
    }

    const { data: recipe } = await supabase
      .from('recipes')
      .select('nama_resep, biaya_overhead')
      .eq('id', recipeId)
      .single();

    const oldOverheadValue = migrationStatus.currentOverheadValue;
    const newOverheadValue = preserveOriginalOverhead 
      ? oldOverheadValue 
      : 0; // Set to 0 for auto-sync mode

    const migrationNotes: string[] = [];

    // Update recipe to use auto-sync mode
    const updateData: any = {
      biaya_overhead: newOverheadValue,
      updated_at: new Date().toISOString(),
    };

    // Add migration metadata if requested
    if (addMigrationNote) {
      const migrationMetadata = {
        migrated_at: new Date().toISOString(),
        migration_type: 'manual_to_auto_sync',
        original_overhead: oldOverheadValue,
        migrated_to_auto_sync: true,
      };

      // Store migration info in deskripsi or create new field
      const currentDescription = recipe?.deskripsi || '';
      const migrationNote = `\n[MIGRATED] ${new Date().toLocaleDateString('id-ID')}: Switched to auto-sync overhead (was: Rp ${oldOverheadValue.toLocaleString('id-ID')})`;
      
      updateData.deskripsi = currentDescription + migrationNote;
      migrationNotes.push('Migration metadata added to recipe description');
    }

    const { error: updateError } = await supabase
      .from('recipes')
      .update(updateData)
      .eq('id', recipeId);

    if (updateError) {
      throw new Error(`Failed to update recipe: ${updateError.message}`);
    }

    migrationNotes.push('Recipe successfully migrated to auto-sync mode');
    
    if (preserveOriginalOverhead) {
      migrationNotes.push('Original overhead value preserved');
    } else {
      migrationNotes.push('Overhead reset to 0 for auto-sync calculation');
    }

    logger.success('✅ Recipe migration completed:', recipeId);

    return {
      recipeId,
      recipeName: recipe?.nama_resep || 'Unknown Recipe',
      success: true,
      oldOverheadValue,
      newOverheadValue,
      migrationDate: new Date().toISOString(),
      notes: migrationNotes,
    };

  } catch (error) {
    logger.error('❌ Recipe migration failed:', recipeId, error);
    
    return {
      recipeId,
      recipeName: 'Unknown Recipe',
      success: false,
      oldOverheadValue: 0,
      newOverheadValue: 0,
      migrationDate: new Date().toISOString(),
      notes: [`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
    };
  }
};

/**
 * Get all recipes that can be migrated to auto-sync
 */
export const getMigratableRecipes = async (): Promise<{
  recipes: Array<{
    id: string;
    nama_resep: string;
    biaya_overhead: number;
    updated_at: string;
    migrationStatus: RecipeMigrationStatus;
  }>;
  summary: {
    total: number;
    migratable: number;
    hasFixedOverhead: number;
    legacy: number;
  };
}> => {
  try {
    logger.info('🔍 Finding migratable recipes');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get all user's recipes
    const { data: recipes, error } = await supabase
      .from('recipes')
      .select('id, nama_resep, biaya_overhead, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch recipes: ${error.message}`);
    }

    if (!recipes || recipes.length === 0) {
      return {
        recipes: [],
        summary: { total: 0, migratable: 0, hasFixedOverhead: 0, legacy: 0 }
      };
    }

    // Check migration status for each recipe
    const recipesWithStatus = await Promise.all(
      recipes.map(async (recipe) => {
        try {
          const migrationStatus = await checkRecipeMigrationStatus(recipe.id);
          return {
            ...recipe,
            migrationStatus,
          };
        } catch (error) {
          logger.warn(`⚠️ Could not check migration status for recipe ${recipe.id}:`, error);
          return {
            ...recipe,
            migrationStatus: {
              isLegacyRecipe: false,
              hasFixedOverhead: false,
              canMigrate: false,
              currentOverheadValue: 0,
              suggestedAutoOverheadValue: null,
              migrationNotes: ['Could not determine migration status'],
            } as RecipeMigrationStatus,
          };
        }
      })
    );

    // Calculate summary
    const summary = {
      total: recipesWithStatus.length,
      migratable: recipesWithStatus.filter(r => r.migrationStatus.canMigrate).length,
      hasFixedOverhead: recipesWithStatus.filter(r => r.migrationStatus.hasFixedOverhead).length,
      legacy: recipesWithStatus.filter(r => r.migrationStatus.isLegacyRecipe).length,
    };

    logger.success('✅ Migration analysis completed:', summary);

    return {
      recipes: recipesWithStatus,
      summary,
    };

  } catch (error) {
    logger.error('❌ Error finding migratable recipes:', error);
    throw error;
  }
};

/**
 * Bulk migrate multiple recipes to auto-sync
 */
export const bulkMigrateRecipes = async (
  recipeIds: string[],
  options: {
    preserveOriginalOverhead?: boolean;
    addMigrationNote?: boolean;
    batchSize?: number;
  } = {}
): Promise<BulkMigrationSummary> => {
  const { batchSize = 10 } = options;

  try {
    logger.info('🔄 Starting bulk recipe migration:', recipeIds.length, 'recipes');

    const results: RecipeMigrationResult[] = [];
    let migratedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    // Process recipes in batches to avoid overwhelming the system
    for (let i = 0; i < recipeIds.length; i += batchSize) {
      const batch = recipeIds.slice(i, i + batchSize);
      
      logger.info(`📦 Processing batch ${Math.floor(i / batchSize) + 1}:`, batch.length, 'recipes');

      const batchResults = await Promise.all(
        batch.map(async (recipeId) => {
          try {
            // Check if migration is needed
            const status = await checkRecipeMigrationStatus(recipeId);
            
            if (!status.canMigrate) {
              skippedCount++;
              return {
                recipeId,
                recipeName: 'Unknown Recipe',
                success: false,
                oldOverheadValue: status.currentOverheadValue,
                newOverheadValue: status.currentOverheadValue,
                migrationDate: new Date().toISOString(),
                notes: ['Skipped: Cannot migrate - ' + status.migrationNotes.join(', ')],
              };
            }

            if (!status.hasFixedOverhead) {
              skippedCount++;
              return {
                recipeId,
                recipeName: 'Unknown Recipe',
                success: false,
                oldOverheadValue: 0,
                newOverheadValue: 0,
                migrationDate: new Date().toISOString(),
                notes: ['Skipped: Already using auto-sync or no overhead set'],
              };
            }

            const result = await migrateRecipeToAutoSync(recipeId, options);
            
            if (result.success) {
              migratedCount++;
            } else {
              failedCount++;
            }

            return result;

          } catch (error) {
            failedCount++;
            return {
              recipeId,
              recipeName: 'Unknown Recipe', 
              success: false,
              oldOverheadValue: 0,
              newOverheadValue: 0,
              migrationDate: new Date().toISOString(),
              notes: [`Error: ${error instanceof Error ? error.message : 'Unknown error'}`],
            };
          }
        })
      );

      results.push(...batchResults);

      // Small delay between batches
      if (i + batchSize < recipeIds.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    const summary = `Migration completed: ${migratedCount} migrated, ${skippedCount} skipped, ${failedCount} failed out of ${recipeIds.length} total recipes.`;

    logger.success('✅ Bulk migration completed:', {
      total: recipeIds.length,
      migrated: migratedCount,
      skipped: skippedCount,
      failed: failedCount,
    });

    return {
      totalRecipes: recipeIds.length,
      migratedCount,
      skippedCount,
      failedCount,
      results,
      summary,
    };

  } catch (error) {
    logger.error('❌ Bulk migration failed:', error);
    throw error;
  }
};

/**
 * Create backup of recipe data before migration
 */
export const createRecipeBackup = async (recipeIds: string[]): Promise<{
  backupId: string;
  backupData: any[];
  backupDate: string;
}> => {
  try {
    logger.info('💾 Creating recipe backup for migration');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Fetch all recipe data
    const { data: recipes, error } = await supabase
      .from('recipes')
      .select('*')
      .in('id', recipeIds)
      .eq('user_id', user.id);

    if (error) {
      throw new Error(`Failed to fetch recipes for backup: ${error.message}`);
    }

    const backupId = `recipe-backup-${Date.now()}`;
    const backupDate = new Date().toISOString();

    // Store backup in local storage as fallback
    try {
      localStorage.setItem(backupId, JSON.stringify({
        backupDate,
        userId: user.id,
        recipes: recipes || [],
      }));
      logger.info('💾 Backup stored in localStorage:', backupId);
    } catch (storageError) {
      logger.warn('⚠️ Could not store backup in localStorage:', storageError);
    }

    logger.success('✅ Recipe backup created:', backupId);

    return {
      backupId,
      backupData: recipes || [],
      backupDate,
    };

  } catch (error) {
    logger.error('❌ Failed to create recipe backup:', error);
    throw error;
  }
};

export const recipeMigrationService = {
  checkRecipeMigrationStatus,
  migrateRecipeToAutoSync,
  getMigratableRecipes,
  bulkMigrateRecipes,
  createRecipeBackup,
};

export default recipeMigrationService;