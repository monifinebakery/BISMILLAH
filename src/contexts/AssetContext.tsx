// src/contexts/AssetContext.tsx
// ✅ FIXED VERSION - Using React Query pattern to prevent fetch loops

import React, { createContext, useContext, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Asset } from '@/types/asset';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

// Dependencies
import { useAuth } from './AuthContext';
import { useActivity } from './ActivityContext';
import { useNotification } from './NotificationContext';
import { createNotificationHelper } from '@/utils/notificationHelpers';
import { supabase } from '@/integrations/supabase/client';
import { UnifiedDateHandler } from '@/utils/unifiedDateHandler';
import { safeParseDate } from '@/utils/unifiedDateUtils'; // Keep for transition
import { enhancedDateUtils } from '@/utils/enhancedDateUtils';

// Interface
interface AssetContextType {
  assets: Asset[];
  addAsset: (asset: Omit<Asset, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  updateAsset: (id: string, asset: Partial<Omit<Asset, 'id' | 'userId'>>) => Promise<boolean>;
  deleteAsset: (id: string) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
  refreshAssets: () => Promise<void>;
}

// ✅ Query Keys
const assetQueryKeys = {
  all: ['assets'] as const,
  lists: () => [...assetQueryKeys.all, 'list'] as const,
  list: (userId?: string) => [...assetQueryKeys.lists(), userId] as const,
} as const;

// ✅ Transform functions (stable, no useCallback needed)
const transformAssetFromDB = (dbAsset: any): Asset | null => {
  try {
    if (!dbAsset || !dbAsset.id) {
      logger.warn('AssetContext - Invalid asset data received from database:', dbAsset);
      return null;
    }

    // Helper function to safely parse dates using enhancedDateUtils
    const safeParseDateUnified = (dateInput: any): Date | null => {
      const result = enhancedDateUtils.parseAndValidateTimestamp(dateInput);
      return result.isValid && result.date ? result.date : null;
    };

    return {
      id: dbAsset.id,
      nama: dbAsset.nama || '',
      kategori: dbAsset.kategori || null,
      nilaiAwal: parseFloat(dbAsset.nilai_awal) || 0,
      nilaiSaatIni: parseFloat(dbAsset.nilai_sekarang) || 0,
      tanggalPembelian: safeParseDateUnified(dbAsset.tanggal_beli),
      kondisi: dbAsset.kondisi || null,
      lokasi: dbAsset.lokasi || '',
      deskripsi: dbAsset.deskripsi || null,
      depresiasi: dbAsset.depresiasi ? parseFloat(dbAsset.depresiasi) : null,
      userId: dbAsset.user_id,
      createdAt: safeParseDateUnified(dbAsset.created_at),
      updatedAt: safeParseDateUnified(dbAsset.updated_at),
    };
  } catch (error) {
    logger.error('AssetContext - Error transforming asset from DB:', error);
    return null;
  }
};

const transformAssetToDB = (asset: Partial<Asset>) => {
  const updateData: { [key: string]: any } = {};
  
  if (asset.nama !== undefined) updateData.nama = asset.nama?.trim();
  if (asset.kategori !== undefined) updateData.kategori = asset.kategori;
  if (asset.nilaiAwal !== undefined) updateData.nilai_awal = asset.nilaiAwal;
  if (asset.nilaiSaatIni !== undefined) updateData.nilai_sekarang = asset.nilaiSaatIni;
  if (asset.tanggalPembelian !== undefined) {
    updateData.tanggal_beli = asset.tanggalPembelian ? enhancedDateUtils.toDatabaseTimestamp(asset.tanggalPembelian) : null;
  }
  if (asset.kondisi !== undefined) updateData.kondisi = asset.kondisi;
  if (asset.lokasi !== undefined) updateData.lokasi = asset.lokasi?.trim();
  if (asset.deskripsi !== undefined) updateData.deskripsi = asset.deskripsi?.trim() || null;
  if (asset.depresiasi !== undefined) updateData.depresiasi = asset.depresiasi;

  return updateData;
};

// ✅ API Functions
const fetchAssets = async (userId: string): Promise<Asset[]> => {
  logger.info('🔄 Fetching assets for user:', userId);
  
  const { data, error } = await supabase
    .from('assets')
    .select('id, user_id, nama, kategori, nilai_awal, nilai_sekarang, tanggal_beli, kondisi, lokasi, deskripsi, depresiasi, created_at, updated_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('❌ Error fetching assets:', error);
    throw new Error(error.message);
  }

  const assets = data
    .map(transformAssetFromDB)
    .filter((asset): asset is Asset => asset !== null);
    
  logger.success('✅ Assets fetched successfully:', assets.length, 'items');
  return assets;
};

const createAsset = async (asset: Omit<Asset, 'id' | 'userId' | 'createdAt' | 'updatedAt'>, userId: string): Promise<Asset> => {
  logger.info('🔄 Creating asset:', asset.nama);
  
  const assetToInsert = {
    user_id: userId,
    nama: asset.nama?.trim(),
    kategori: asset.kategori,
    nilai_awal: asset.nilaiAwal,
    nilai_sekarang: asset.nilaiSaatIni,
    tanggal_beli: asset.tanggalPembelian,
    kondisi: asset.kondisi,
    lokasi: asset.lokasi?.trim(),
    deskripsi: asset.deskripsi?.trim() || null,
    depresiasi: asset.depresiasi,
  };

  const { data, error } = await supabase
    .from('assets')
    .insert(assetToInsert)
    .select()
    .single();
  
  if (error) {
    logger.error('❌ Error creating asset:', error);
    throw new Error(error.message);
  }

  const newAsset = transformAssetFromDB(data);
  if (!newAsset) {
    throw new Error('Failed to transform created asset');
  }

  logger.success('✅ Asset created successfully:', newAsset.id);
  return newAsset;
};

const updateAsset = async (id: string, updates: Partial<Asset>, userId: string): Promise<Asset> => {
  logger.info('🔄 Updating asset:', id, updates);
  
  const updateData = transformAssetToDB(updates);

  const { data, error } = await supabase
    .from('assets')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    logger.error('❌ Error updating asset:', error);
    throw new Error(error.message);
  }

  const updatedAsset = transformAssetFromDB(data);
  if (!updatedAsset) {
    throw new Error('Failed to transform updated asset');
  }

  logger.success('✅ Asset updated successfully:', id);
  return updatedAsset;
};

const deleteAsset = async (id: string, userId: string): Promise<void> => {
  logger.info('🔄 Deleting asset:', id);
  
  const { error } = await supabase
    .from('assets')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    logger.error('❌ Error deleting asset:', error);
    throw new Error(error.message);
  }

  logger.success('✅ Asset deleted successfully:', id);
};

const AssetContext = createContext<AssetContextType | undefined>(undefined);

export const AssetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { addActivity } = useActivity();
  const { addNotification } = useNotification();
  const queryClient = useQueryClient();

  logger.debug('🔍 AssetProvider rendered', {
    userId: user?.id,
    timestamp: enhancedDateUtils.getCurrentTimestamp().toISOString()
  });

  // ✅ useQuery for fetching assets
  const {
    data: assets = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: assetQueryKeys.list(user?.id),
    queryFn: () => fetchAssets(user!.id),
    enabled: !!user?.id,
    staleTime: 3 * 60 * 1000, // 3 minutes
    retry: (failureCount, error: any) => {
      if (error?.status >= 400 && error?.status < 500) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // ✅ Mutations for CRUD operations
  const createMutation = useMutation({
    mutationFn: (asset: Omit<Asset, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => 
      createAsset(asset, user!.id),
    onSuccess: (newAsset, variables) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: assetQueryKeys.lists() });

      // Activity log
      addActivity({
        title: 'Aset Ditambahkan',
        description: `${newAsset.nama} telah ditambahkan ke daftar aset.`,
        type: 'aset',
        value: null,
      });

      // Success notification
      addNotification({
        title: '🏢 Aset Baru Ditambahkan!',
        message: `${newAsset.nama} berhasil ditambahkan dengan nilai Rp ${newAsset.nilaiAwal.toLocaleString()}`,
        type: 'success',
        icon: 'package',
        priority: 2,
        related_type: 'system',
        action_url: '/aset',
        is_read: false,
        is_archived: false
      });

      toast.success(`Aset ${newAsset.nama} berhasil ditambahkan!`);
      logger.info('🎉 Create asset mutation success');
    },
    onError: (error: Error, variables) => {
      logger.error('❌ Create asset mutation error:', error.message);
      
      addNotification(createNotificationHelper.systemError(
        `Gagal menambahkan aset ${variables.nama}: ${error.message}`
      ));
      
      toast.error(`Gagal menyimpan aset: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Asset> }) => 
      updateAsset(id, updates, user!.id),
    onSuccess: (updatedAsset, { updates }) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: assetQueryKeys.lists() });

      // Success notification
      addNotification({
        title: '📝 Aset Diperbarui',
        message: `${updatedAsset.nama} telah diperbarui`,
        type: 'info',
        icon: 'edit',
        priority: 1,
        related_type: 'system',
        action_url: '/aset',
        is_read: false,
        is_archived: false
      });

      toast.success(`Aset ${updatedAsset.nama} berhasil diperbarui!`);
      logger.info('🎉 Update asset mutation success');
    },
    onError: (error: Error) => {
      logger.error('❌ Update asset mutation error:', error.message);
      
      addNotification(createNotificationHelper.systemError(
        `Gagal memperbarui aset: ${error.message}`
      ));
      
      toast.error(`Gagal memperbarui aset: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAsset(id, user!.id),
    onMutate: async (id) => {
      // Find asset for activity log
      const assetToDelete = assets.find(a => a.id === id);
      return { assetToDelete };
    },
    onSuccess: (result, id, context) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: assetQueryKeys.lists() });

      if (context?.assetToDelete) {
        // Activity log
        addActivity({
          title: 'Aset Dihapus',
          description: `${context.assetToDelete.nama} telah dihapus.`,
          type: 'aset',
          value: null,
        });

        // Delete notification
        addNotification({
          title: '🗑️ Aset Dihapus',
          message: `${context.assetToDelete.nama} telah dihapus dari daftar aset`,
          type: 'warning',
          icon: 'trash-2',
          priority: 2,
          related_type: 'system',
          action_url: '/aset',
          is_read: false,
          is_archived: false
        });

        toast.success(`Aset ${context.assetToDelete.nama} berhasil dihapus!`);
      }

      logger.info('🎉 Delete asset mutation success');
    },
    onError: (error: Error) => {
      logger.error('❌ Delete asset mutation error:', error.message);
      
      addNotification(createNotificationHelper.systemError(
        `Gagal menghapus aset: ${error.message}`
      ));
      
      toast.error(`Gagal menghapus aset: ${error.message}`);
    },
  });

  // ✅ Real-time subscription using useEffect (stable dependencies)
  React.useEffect(() => {
    if (!user?.id) return;

    logger.info('🔄 Setting up real-time subscription for assets');

    const channel = supabase
      .channel(`realtime-assets-${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'assets',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        logger.info('📡 Real-time asset event received:', payload.eventType);

        // Invalidate queries to refetch fresh data
        queryClient.invalidateQueries({ queryKey: assetQueryKeys.lists() });
      })
      .subscribe();

    return () => {
      logger.debug('🧹 Cleaning up asset real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]); // ✅ Stable dependencies only

  // ✅ Context action functions using mutations
  const addAssetAction = useCallback(async (asset: Omit<Asset, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    if (!user) {
      logger.warn('🔐 Add asset attempted without authentication');
      toast.error('Anda harus login untuk menambah aset.');
      return false;
    }

    try {
      await createMutation.mutateAsync(asset);
      return true;
    } catch (error) {
      logger.error('❌ Add asset failed:', error);
      return false;
    }
  }, [user, createMutation]);

  const updateAssetAction = useCallback(async (id: string, updates: Partial<Omit<Asset, 'id' | 'userId'>>): Promise<boolean> => {
    if (!user) {
      logger.warn('🔐 Update asset attempted without authentication');
      toast.error('Anda harus login untuk memperbarui aset.');
      return false;
    }

    if (!id) {
      toast.error('ID aset tidak valid.');
      return false;
    }

    try {
      await updateMutation.mutateAsync({ id, updates });
      return true;
    } catch (error) {
      logger.error('❌ Update asset failed:', error);
      return false;
    }
  }, [user, updateMutation]);

  const deleteAssetAction = useCallback(async (id: string): Promise<boolean> => {
    if (!user) {
      logger.warn('🔐 Delete asset attempted without authentication');
      toast.error('Anda harus login untuk menghapus aset.');
      return false;
    }

    if (!id) {
      toast.error('ID aset tidak valid.');
      return false;
    }

    try {
      await deleteMutation.mutateAsync(id);
      return true;
    } catch (error) {
      logger.error('❌ Delete asset failed:', error);
      return false;
    }
  }, [user, deleteMutation]);

  const refreshAssets = useCallback(async (): Promise<void> => {
    logger.info('🔄 Manual refresh assets requested');
    await refetch();
  }, [refetch]);

  // ✅ Handle query error with notification
  React.useEffect(() => {
    if (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addNotification(createNotificationHelper.systemError(
        `Gagal memuat data aset: ${errorMessage}`
      ));
    }
  }, [error, addNotification]);

  // ✅ Context value with enhanced state from useQuery
  const value: AssetContextType = {
    assets,
    isLoading: isLoading || createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
    error: error ? (error instanceof Error ? error.message : String(error)) : null,
    addAsset: addAssetAction,
    updateAsset: updateAssetAction,
    deleteAsset: deleteAssetAction,
    refreshAssets,
  };

  logger.debug('🎯 AssetContext value prepared:', {
    assetsCount: assets.length,
    isLoading: value.isLoading,
    hasError: !!value.error
  });

  return (
    <AssetContext.Provider value={value}>
      {children}
    </AssetContext.Provider>
  );
};

export const useAssets = (): AssetContextType => {
  const context = useContext(AssetContext);
  if (context === undefined) {
    throw new Error('useAssets must be used within an AssetProvider');
  }
  return context;
};