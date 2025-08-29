// src/components/assets/api/assetApi.ts

import { supabase } from '@/integrations/supabase/client';
import { 
  Asset, 
  AssetCreateInput, 
  AssetUpdateInput, 
  DatabaseAsset,
  ApiResponse,
  AssetListResponse 
} from '../types';
import { 
  transformAssetFromDB, 
  transformAssetsFromDB, 
  transformAssetForDB, 
  transformAssetUpdateForDB 
} from '../utils';

/**
 * Get all assets for the current user
 */
export const getAssets = async (userId: string): Promise<Asset[]> => {
  const { data, error } = await supabase
    .from('assets')
    .select('id, user_id, nama, lokasi, kategori, kondisi, nilai_awal, nilai_sekarang, depresiasi, tanggal_beli, deskripsi, created_at, updated_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch assets: ${error.message}`);
  }

  if (!data) {
    return [];
  }

  return transformAssetsFromDB(data as DatabaseAsset[]);
};

/**
 * Get single asset by ID
 */
export const getAsset = async (id: string, userId: string): Promise<Asset | null> => {
  const { data, error } = await supabase
    .from('assets')
    .select('id, user_id, nama, lokasi, kategori, kondisi, nilai_awal, nilai_sekarang, depresiasi, tanggal_beli, deskripsi, created_at, updated_at')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Asset not found
    }
    throw new Error(`Failed to fetch asset: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return transformAssetFromDB(data as DatabaseAsset);
};

/**
 * Create new asset
 */
export const createAsset = async (
  userId: string, 
  asset: AssetCreateInput
): Promise<Asset> => {
  const assetToInsert = transformAssetForDB(userId, asset);

  const { data, error } = await supabase
    .from('assets')
    .insert(assetToInsert)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create asset: ${error.message}`);
  }

  if (!data) {
    throw new Error('No data returned from asset creation');
  }

  const transformedAsset = transformAssetFromDB(data as DatabaseAsset);
  
  if (!transformedAsset) {
    throw new Error('Failed to transform created asset');
  }

  return transformedAsset;
};

/**
 * Update asset
 */
export const updateAsset = async (
  id: string,
  userId: string,
  asset: AssetUpdateInput
): Promise<Asset> => {
  const updateData = transformAssetUpdateForDB(asset);

  const { data, error } = await supabase
    .from('assets')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update asset: ${error.message}`);
  }

  if (!data) {
    throw new Error('No data returned from asset update');
  }

  const transformedAsset = transformAssetFromDB(data as DatabaseAsset);
  
  if (!transformedAsset) {
    throw new Error('Failed to transform updated asset');
  }

  return transformedAsset;
};

/**
 * Delete asset with cascade cleanup
 * Cleans up related financial transactions (depreciation, asset sales, etc.)
 */
export const deleteAsset = async (id: string, userId: string): Promise<void> => {
  // First, get the asset info for logging and cleanup
  const { data: existingAsset, error: fetchError } = await supabase
    .from('assets')
    .select('id, nama')
    .eq('id', id)
    .eq('user_id', userId)
    .single();
  
  if (fetchError && fetchError.code !== 'PGRST116') {
    throw new Error(`Failed to fetch asset for deletion: ${fetchError.message}`);
  }
  
  if (!existingAsset) {
    // Asset already deleted or doesn't exist
    return;
  }
  
  try {
    // 🧹 CLEANUP: Delete related financial transactions
    // Look for any financial transactions that might reference this asset
    const { error: cleanupError } = await supabase
      .from('financial_transactions')
      .delete()
      .eq('user_id', userId)
      .eq('related_id', id);
      
    if (cleanupError) {
      console.warn('Warning: Failed to clean up financial transactions for asset:', cleanupError.message);
      // Continue with asset deletion even if cleanup fails
    }
    
    // Delete the asset itself
    const { error: deleteError } = await supabase
      .from('assets')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
  
    if (deleteError) {
      throw new Error(`Failed to delete asset: ${deleteError.message}`);
    }
    
    console.log(`✅ Asset "${existingAsset.nama}" and related data deleted successfully`);
    
  } catch (error: any) {
    throw new Error(`Asset deletion failed: ${error.message}`);
  }
};

/**
 * Search assets
 */
export const searchAssets = async (
  userId: string, 
  searchTerm: string
): Promise<Asset[]> => {
  const { data, error } = await supabase
    .from('assets')
    .select('id, user_id, nama, lokasi, kategori, kondisi, nilai_awal, nilai_sekarang, depresiasi, tanggal_beli, deskripsi, created_at, updated_at')
    .eq('user_id', userId)
    .or(`nama.ilike.%${searchTerm}%,lokasi.ilike.%${searchTerm}%,deskripsi.ilike.%${searchTerm}%`)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to search assets: ${error.message}`);
  }

  if (!data) {
    return [];
  }

  return transformAssetsFromDB(data as DatabaseAsset[]);
};

/**
 * Get assets by category
 */
export const getAssetsByCategory = async (
  userId: string, 
  category: string
): Promise<Asset[]> => {
  const { data, error } = await supabase
    .from('assets')
    .select('id, user_id, nama, lokasi, kategori, kondisi, nilai_awal, nilai_sekarang, depresiasi, tanggal_beli, deskripsi, created_at, updated_at')
    .eq('user_id', userId)
    .eq('kategori', category)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch assets by category: ${error.message}`);
  }

  if (!data) {
    return [];
  }

  return transformAssetsFromDB(data as DatabaseAsset[]);
};

/**
 * Get assets by condition
 */
export const getAssetsByCondition = async (
  userId: string, 
  condition: string
): Promise<Asset[]> => {
  const { data, error } = await supabase
    .from('assets')
    .select('id, user_id, nama, lokasi, kategori, kondisi, nilai_awal, nilai_sekarang, depresiasi, tanggal_beli, deskripsi, created_at, updated_at')
    .eq('user_id', userId)
    .eq('kondisi', condition)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch assets by condition: ${error.message}`);
  }

  if (!data) {
    return [];
  }

  return transformAssetsFromDB(data as DatabaseAsset[]);
};

/**
 * Setup realtime subscription for assets
 */
export const subscribeToAssets = (
  userId: string,
  onInsert?: (asset: Asset) => void,
  onUpdate?: (asset: Asset) => void,
  onDelete?: (assetId: string) => void
) => {
  const channel = supabase
    .channel(`realtime-assets-${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'assets',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        if (payload.new && onInsert) {
          const asset = transformAssetFromDB(payload.new as DatabaseAsset);
          if (asset) {
            onInsert(asset);
          }
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'assets',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        if (payload.new && onUpdate) {
          const asset = transformAssetFromDB(payload.new as DatabaseAsset);
          if (asset) {
            onUpdate(asset);
          }
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'assets',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        if (payload.old?.id && onDelete) {
          onDelete(payload.old.id);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};