import React, { createContext, useContext, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useActivity } from '@/contexts/ActivityContext';
import { useNotification } from '@/contexts/NotificationContext';
import { logger } from '@/utils/logger';

// PromoContext types
interface Promo {
  id: string;
  userId: string;
  namaPromo: string;
  tipePromo: 'bogo' | 'discount' | 'bundle';
  status: 'aktif' | 'nonaktif' | 'draft';
  dataPromo: any;
  calculationResult: any;
  tanggalMulai?: string;
  tanggalSelesai?: string;
  deskripsi?: string;
  createdAt: string;
  updatedAt: string;
}

interface PromoContextType {
  promos: Promo[];
  isLoading: boolean;
  error: string | null;
  addPromo: (promo: Partial<Promo>) => Promise<boolean>;
  updatePromo: (id: string, updates: Partial<Promo>) => Promise<boolean>;
  deletePromo: (id: string) => Promise<boolean>;
  bulkDeletePromos: (ids: string[]) => Promise<boolean>;
  togglePromoStatus: (id: string, newStatus: string) => Promise<boolean>;
  searchPromos: (query: string) => Promo[];
  getPromosByType: (type: string) => Promo[];
  getPromosByStatus: (status: string) => Promo[];
  refreshPromos: () => Promise<void>;
}

// ✅ Query Keys
const promoQueryKeys = {
  all: ['promos'] as const,
  lists: () => [...promoQueryKeys.all, 'list'] as const,
  list: (userId?: string) => [...promoQueryKeys.lists(), userId] as const,
} as const;

// ✅ Transform functions (stable, no useCallback needed)
const transformFromDB = (dbItem: any): Promo => ({
  id: dbItem.id,
  userId: dbItem.user_id,
  namaPromo: dbItem.nama_promo,
  tipePromo: dbItem.tipe_promo,
  status: dbItem.status,
  dataPromo: dbItem.data_promo,
  calculationResult: dbItem.calculation_result,
  tanggalMulai: dbItem.tanggal_mulai,
  tanggalSelesai: dbItem.tanggal_selesai,
  deskripsi: dbItem.deskripsi,
  createdAt: dbItem.created_at,
  updatedAt: dbItem.updated_at
});

const transformToDB = (promo: Partial<Promo>) => ({
  nama_promo: promo.namaPromo,
  tipe_promo: promo.tipePromo,
  status: promo.status,
  data_promo: promo.dataPromo,
  calculation_result: promo.calculationResult,
  tanggal_mulai: promo.tanggalMulai,
  tanggal_selesai: promo.tanggalSelesai,
  deskripsi: promo.deskripsi
});

// ✅ API Functions
const fetchPromos = async (userId: string): Promise<Promo[]> => {
  logger.info('🔄 Fetching promos for user:', userId);
  
  const { data, error } = await supabase
    .from('promos')
    .select(`\n          id,\n          -- TODO: Add specific columns for unknown\n        `)         id,\n          -- TODO: Add specific columns for unknown\n        `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('❌ Error fetching promos:', error);
    throw new Error(error.message);
  }

  const promos = data.map(transformFromDB);
  logger.success('✅ Promos fetched successfully:', promos.length, 'items');
  return promos;
};

const createPromo = async (promo: Partial<Promo>, userId: string): Promise<Promo> => {
  logger.info('🔄 Creating promo:', promo.namaPromo);
  
  const { data, error } = await supabase
    .from('promos')
    .insert({ ...transformToDB(promo), user_id: userId })
    .select()
    .single();

  if (error) {
    logger.error('❌ Error creating promo:', error);
    throw new Error(error.message);
  }

  const newPromo = transformFromDB(data);
  logger.success('✅ Promo created successfully:', newPromo.id);
  return newPromo;
};

const updatePromo = async (id: string, updates: Partial<Promo>, userId: string): Promise<Promo> => {
  logger.info('🔄 Updating promo:', id, updates);
  
  const { data, error } = await supabase
    .from('promos')
    .update(transformToDB(updates))
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    logger.error('❌ Error updating promo:', error);
    throw new Error(error.message);
  }

  const updatedPromo = transformFromDB(data);
  logger.success('✅ Promo updated successfully:', id);
  return updatedPromo;
};

const deletePromo = async (id: string, userId: string): Promise<void> => {
  logger.info('🔄 Deleting promo:', id);
  
  const { error } = await supabase
    .from('promos')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    logger.error('❌ Error deleting promo:', error);
    throw new Error(error.message);
  }

  logger.success('✅ Promo deleted successfully:', id);
};

const bulkDeletePromos = async (ids: string[], userId: string): Promise<void> => {
  logger.info('🔄 Bulk deleting promos:', ids.length, 'items');
  
  const { error } = await supabase
    .from('promos')
    .delete()
    .in('id', ids)
    .eq('user_id', userId);

  if (error) {
    logger.error('❌ Error bulk deleting promos:', error);
    throw new Error(error.message);
  }

  logger.success('✅ Bulk delete completed:', ids.length, 'items');
};

const PromoContext = createContext<PromoContextType | undefined>(undefined);

export const PromoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { addActivity } = useActivity();
  const { addNotification } = useNotification();
  const queryClient = useQueryClient();

  logger.debug('🔍 PromoProvider rendered', {
    userId: user?.id,
    timestamp: new Date().toISOString()
  });

  // ✅ useQuery for fetching promos
  const {
    data: promos = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: promoQueryKeys.list(user?.id),
    queryFn: () => fetchPromos(user!.id),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes - IMPROVED: Extended for better caching
    gcTime: 10 * 60 * 1000, // 10 minutes - IMPROVED: Added garbage collection time
    retry: (failureCount, error: any) => {
      // Don't retry client errors (4xx)
      if (error?.status >= 400 && error?.status < 500) {
        return false;
      }
      // Limit retries to 2 for better performance
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false, // PERFORMANCE: Prevent unnecessary refetches
    refetchOnReconnect: true, // Maintain data consistency on reconnect
  });

  // ✅ Mutations for CRUD operations
  const createMutation = useMutation({
    mutationFn: (promo: Partial<Promo>) => createPromo(promo, user!.id),
    onSuccess: (newPromo, variables) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: promoQueryKeys.lists() });

      // Activity log
      addActivity({
        title: 'Promo Baru Dibuat',
        description: `Promo "${newPromo.namaPromo}" telah ditambahkan.`,
        type: 'promo',
        value: null
      });

      // Success notification
      addNotification({
        title: '🎯 Promo Baru Dibuat!',
        message: `Promo "${newPromo.namaPromo}" berhasil ditambahkan`,
        type: 'success',
        icon: 'gift',
        priority: 2,
        related_type: 'system',
        action_url: '/promo',
        is_read: false,
        is_archived: false
      });

      toast.success('Promo baru berhasil ditambahkan!');
      logger.info('🎉 Create promo mutation success');
    },
    onError: (error: Error) => {
      logger.error('❌ Create promo mutation error:', error.message);
      toast.error(`Gagal menambah promo: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Promo> }) => 
      updatePromo(id, updates, user!.id),
    onSuccess: (updatedPromo, { updates }) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: promoQueryKeys.lists() });

      addActivity({
        title: 'Promo Diperbarui',
        description: `Promo "${updates.namaPromo || updatedPromo.namaPromo}" telah diperbarui.`,
        type: 'promo',
        value: null
      });

      toast.success('Promo berhasil diperbarui!');
      logger.info('🎉 Update promo mutation success');
    },
    onError: (error: Error) => {
      logger.error('❌ Update promo mutation error:', error.message);
      toast.error(`Gagal memperbarui promo: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePromo(id, user!.id),
    onMutate: async (id) => {
      // Find promo for activity log
      const promoToDelete = promos.find(p => p.id === id);
      return { promoToDelete };
    },
    onSuccess: (result, id, context) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: promoQueryKeys.lists() });

      if (context?.promoToDelete) {
        addActivity({
          title: 'Promo Dihapus',
          description: `Promo "${context.promoToDelete.namaPromo}" telah dihapus.`,
          type: 'promo',
          value: null
        });
      }

      toast.success('Promo berhasil dihapus.');
      logger.info('🎉 Delete promo mutation success');
    },
    onError: (error: Error) => {
      logger.error('❌ Delete promo mutation error:', error.message);
      toast.error(`Gagal menghapus promo: ${error.message}`);
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => bulkDeletePromos(ids, user!.id),
    onSuccess: (result, ids) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: promoQueryKeys.lists() });

      addActivity({
        title: 'Bulk Delete Promo',
        description: `${ids.length} promo telah dihapus.`,
        type: 'promo',
        value: null
      });

      toast.success(`${ids.length} promo berhasil dihapus.`);
      logger.info('🎉 Bulk delete promo mutation success');
    },
    onError: (error: Error) => {
      logger.error('❌ Bulk delete promo mutation error:', error.message);
      toast.error(`Gagal menghapus promo: ${error.message}`);
    },
  });

  // ✅ Real-time subscription using useEffect (stable dependencies)
  React.useEffect(() => {
    if (!user?.id) return;

    logger.info('🔄 Setting up real-time subscription for promos');

    const channel = supabase.channel(`realtime-promos-${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'promos',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        logger.info('📡 Real-time promo event received:', payload.eventType);

        // Invalidate queries to refetch fresh data
        queryClient.invalidateQueries({ queryKey: promoQueryKeys.lists() });
      })
      .subscribe();

    return () => {
      logger.debug('🧹 Cleaning up promo real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]); // ✅ Stable dependencies only

  // ✅ Context action functions using mutations
  const addPromo = useCallback(async (promo: Partial<Promo>): Promise<boolean> => {
    if (!user) {
      logger.warn('🔐 Add promo attempted without authentication');
      toast.error('Anda harus login untuk menambahkan promo.');
      return false;
    }

    try {
      await createMutation.mutateAsync(promo);
      return true;
    } catch (error) {
      logger.error('❌ Add promo failed:', error);
      return false;
    }
  }, [user, createMutation]);

  const updatePromoAction = useCallback(async (id: string, updates: Partial<Promo>): Promise<boolean> => {
    if (!user) {
      logger.warn('🔐 Update promo attempted without authentication');
      toast.error('Anda harus login untuk memperbarui promo.');
      return false;
    }

    try {
      await updateMutation.mutateAsync({ id, updates });
      return true;
    } catch (error) {
      logger.error('❌ Update promo failed:', error);
      return false;
    }
  }, [user, updateMutation]);

  const deletePromoAction = useCallback(async (id: string): Promise<boolean> => {
    if (!user) {
      logger.warn('🔐 Delete promo attempted without authentication');
      toast.error('Anda harus login untuk menghapus promo.');
      return false;
    }

    try {
      await deleteMutation.mutateAsync(id);
      return true;
    } catch (error) {
      logger.error('❌ Delete promo failed:', error);
      return false;
    }
  }, [user, deleteMutation]);

  const bulkDeletePromosAction = useCallback(async (ids: string[]): Promise<boolean> => {
    if (!user) {
      logger.warn('🔐 Bulk delete promos attempted without authentication');
      toast.error('Anda harus login untuk menghapus promo.');
      return false;
    }

    try {
      await bulkDeleteMutation.mutateAsync(ids);
      return true;
    } catch (error) {
      logger.error('❌ Bulk delete promos failed:', error);
      return false;
    }
  }, [user, bulkDeleteMutation]);

  const togglePromoStatus = useCallback(async (id: string, newStatus: string): Promise<boolean> => {
    return await updatePromoAction(id, { status: newStatus });
  }, [updatePromoAction]);

  // ✅ Utility functions (stable with useCallback)
  const searchPromos = useCallback((query: string): Promo[] => {
    if (!query.trim()) return promos;

    const lowercaseQuery = query.toLowerCase();
    return promos.filter(promo =>
      promo.namaPromo.toLowerCase().includes(lowercaseQuery) ||
      promo.tipePromo.toLowerCase().includes(lowercaseQuery) ||
      promo.deskripsi?.toLowerCase().includes(lowercaseQuery)
    );
  }, [promos]);

  const getPromosByType = useCallback((type: string): Promo[] => {
    if (!type.trim()) return promos;
    return promos.filter(promo => promo.tipePromo === type);
  }, [promos]);

  const getPromosByStatus = useCallback((status: string): Promo[] => {
    if (!status.trim()) return promos;
    return promos.filter(promo => promo.status === status);
  }, [promos]);

  const refreshPromos = useCallback(async (): Promise<void> => {
    logger.info('🔄 Manual refresh promos requested');
    await refetch();
  }, [refetch]);

  // ✅ Context value with enhanced state from useQuery
  const value: PromoContextType = {
    promos,
    isLoading: isLoading || createMutation.isPending || updateMutation.isPending || 
               deleteMutation.isPending || bulkDeleteMutation.isPending,
    error: error ? (error instanceof Error ? error.message : String(error)) : null,
    addPromo,
    updatePromo: updatePromoAction,
    deletePromo: deletePromoAction,
    bulkDeletePromos: bulkDeletePromosAction,
    togglePromoStatus,
    searchPromos,
    getPromosByType,
    getPromosByStatus,
    refreshPromos
  };

  logger.debug('🎯 PromoContext value prepared:', {
    promosCount: promos.length,
    isLoading: value.isLoading,
    hasError: !!value.error
  });

  return (
    <PromoContext.Provider value={value}>
      {children}
    </PromoContext.Provider>
  );
};

export const usePromo = () => {
  const context = useContext(PromoContext);
  if (context === undefined) {
    throw new Error('usePromo must be used within a PromoProvider');
  }
  return context;
};