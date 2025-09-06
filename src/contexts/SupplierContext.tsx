// src/contexts/SupplierContext.tsx
// REFACTORED VERSION - Using TanStack Query for better performance and caching

import React, { 
  createContext, 
  useContext, 
  useEffect, 
  ReactNode,
  useCallback,
  useMemo
} from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

// Dependencies
import { useAuth } from './AuthContext';
import { useActivity } from './ActivityContext';
import { useNotification } from './NotificationContext';
import { createNotificationHelper } from '@/utils/notificationHelpers';
import { safeParseDate } from '@/utils/unifiedDateUtils';
// ✅ USING EXISTING TYPES
import { 
  Supplier,
  SupplierDbRow,
  SupplierCreateInput,
  SupplierUpdateInput
} from '@/types/supplier';

// ===========================================
// QUERY KEYS - Centralized for consistency
// ===========================================

export const supplierQueryKeys = {
  all: ['suppliers'] as const,
  lists: () => [...supplierQueryKeys.all, 'list'] as const,
  list: (filters?: any) => [...supplierQueryKeys.lists(), filters] as const,
  detail: (id: string) => [...supplierQueryKeys.all, 'detail', id] as const,
  stats: () => [...supplierQueryKeys.all, 'stats'] as const,
} as const;

// ===========================================
// CONTEXT TYPE
// ===========================================

interface SupplierContextType {
  // State
  suppliers: Supplier[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<Supplier | null>;
  updateSupplier: (id: string, supplier: Partial<Omit<Supplier, 'id' | 'userId'>>) => Promise<Supplier | null>;
  deleteSupplier: (id: string) => Promise<boolean>;
  
  // Utility methods
  getSupplierById: (id: string) => Supplier | undefined;
  refreshSuppliers: () => Promise<void>;
  clearError: () => void;
}

// ===========================================
// CONTEXT SETUP
// ===========================================

const SupplierContext = createContext<SupplierContextType | undefined>(undefined);

// ===========================================
// HELPER FUNCTIONS
// ===========================================

const transformSupplierFromDB = (dbItem: SupplierDbRow): Supplier => ({
  id: dbItem.id,
  nama: dbItem.nama,
  kontak: dbItem.kontak,
  email: dbItem.email || undefined,
  telepon: dbItem.telepon || undefined,
  alamat: dbItem.alamat || undefined,
  catatan: dbItem.catatan || undefined,
  userId: dbItem.user_id,
  createdAt: safeParseDate(dbItem.created_at) || new Date(),
  updatedAt: safeParseDate(dbItem.updated_at) || new Date(),
});

const transformSupplierToDB = (supplier: Partial<Supplier>) => ({
  nama: supplier.nama,
  kontak: supplier.kontak,
  email: supplier.email || null,
  telepon: supplier.telepon || null,
  alamat: supplier.alamat || null,
  catatan: supplier.catatan || null,
});

// ===========================================
// API FUNCTIONS
// ===========================================

/**
 * Fetch all suppliers for current user
 */
const fetchSuppliers = async (userId: string): Promise<Supplier[]> => {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('user_id', userId)
    .order('nama', { ascending: true });
    
  if (error) {
    throw new Error(error.message);
  }
  
  return (data || []).map(transformSupplierFromDB);
};

/**
 * Create new supplier
 */
const createSupplier = async (
  supplierData: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt' | 'userId'>,
  userId: string
): Promise<Supplier> => {
  const supplierToInsert = {
    user_id: userId,
    ...transformSupplierToDB(supplierData),
  };

  const { data, error } = await supabase
    .from('suppliers')
    .insert(supplierToInsert)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error('No data returned from database');
  }

  return transformSupplierFromDB(data);
};

/**
 * Update existing supplier
 */
const updateSupplier = async (
  id: string,
  supplierData: Partial<Omit<Supplier, 'id' | 'userId'>>,
  userId: string
): Promise<Supplier> => {
  const supplierToUpdate = transformSupplierToDB(supplierData);

  const { data, error } = await supabase
    .from('suppliers')
    .update(supplierToUpdate)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error('No data returned from database');
  }

  return transformSupplierFromDB(data);
};

/**
 * Delete supplier
 */
const deleteSupplier = async (id: string, userId: string): Promise<void> => {
  const { error } = await supabase
    .from('suppliers')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    throw new Error(error.message);
  }
};

// ===========================================
// CUSTOM HOOKS FOR QUERY OPERATIONS
// ===========================================

/**
 * Hook for fetching suppliers
 */
const useSuppliersQuery = (userId?: string) => {
  return useQuery({
    queryKey: supplierQueryKeys.list(),
    queryFn: () => fetchSuppliers(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error: any) => {
      if (error?.status >= 400 && error?.status < 500) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

/**
 * Hook for supplier mutations
 */
const useSupplierMutations = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { addActivity } = useActivity();
  const { addNotification } = useNotification();

  // Add supplier mutation
  const addMutation = useMutation({
    mutationFn: (data: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => 
      createSupplier(data, user!.id),
    onMutate: async (newSupplier) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ 
        queryKey: supplierQueryKeys.lists() 
      });

      // Snapshot previous value
      const previousSuppliers = queryClient.getQueryData(supplierQueryKeys.list());

      // Optimistically update
      const optimisticSupplier: Supplier = {
        id: `temp-${Date.now()}`,
        userId: user?.id || '',
        createdAt: new Date(),
        updatedAt: new Date(),
        ...newSupplier,
      };

      queryClient.setQueryData(
        supplierQueryKeys.list(),
        (old: Supplier[] = []) => [optimisticSupplier, ...old].sort((a, b) => a.nama.localeCompare(b.nama))
      );

      return { previousSuppliers };
    },
    onError: (error: any, variables, context) => {
      // Rollback on error
      if (context?.previousSuppliers) {
        queryClient.setQueryData(supplierQueryKeys.list(), context.previousSuppliers);
      }
      
      const errorMessage = error.message || 'Terjadi kesalahan sistem';
      
      // Handle duplicate constraint violation with user-friendly message
      let userFriendlyMessage = errorMessage;
      if (errorMessage.includes('duplicate key value violates unique constraint') || 
          errorMessage.includes('suppliers_unique_user_nama')) {
        userFriendlyMessage = `Supplier dengan nama "${variables.nama}" sudah ada. Silakan gunakan nama yang berbeda.`;
        
        // Don't show notification for duplicate - this is a user error, not system error
        toast.error(userFriendlyMessage);
        return;
      }
      
      toast.error(`Gagal menambahkan supplier: ${userFriendlyMessage}`);
      
      addNotification(createNotificationHelper.systemError(
        `Gagal menambahkan supplier ${variables.nama}: ${userFriendlyMessage}`
      ));
    },
    onSuccess: async (newSupplier, variables) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: supplierQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: supplierQueryKeys.stats() });

      // Activity log
      addActivity({
        title: 'Supplier Ditambahkan',
        description: `${variables.nama} telah ditambahkan`,
        type: 'supplier',
        value: null
      });

      // Success notification
      await addNotification({
        title: '🏢 Supplier Baru Ditambahkan!',
        message: `${variables.nama} berhasil ditambahkan ke daftar supplier`,
        type: 'success',
        icon: 'building',
        priority: 2,
        related_type: 'system',
        action_url: '/supplier',
        is_read: false,
        is_archived: false
      });

      toast.success(`${variables.nama} berhasil ditambahkan!`);
    }
  });

  // Update supplier mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<Supplier, 'id' | 'userId'>> }) => 
      updateSupplier(id, data, user!.id),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: supplierQueryKeys.lists() });

      const previousSuppliers = queryClient.getQueryData(supplierQueryKeys.list());

      // Optimistically update
      queryClient.setQueryData(
        supplierQueryKeys.list(),
        (old: Supplier[] = []) =>
          old.map(supplier =>
            supplier.id === id
              ? { ...supplier, ...data, updatedAt: new Date() }
              : supplier
          ).sort((a, b) => a.nama.localeCompare(b.nama))
      );

      return { previousSuppliers };
    },
    onError: (error: any, variables, context) => {
      if (context?.previousSuppliers) {
        queryClient.setQueryData(supplierQueryKeys.list(), context.previousSuppliers);
      }
      
      const errorMessage = error.message || 'Terjadi kesalahan sistem';
      toast.error(`Gagal memperbarui supplier: ${errorMessage}`);
      
      addNotification(createNotificationHelper.systemError(
        `Gagal memperbarui supplier: ${errorMessage}`
      ));
    },
    onSuccess: async (updatedSupplier, { data }) => {
      queryClient.invalidateQueries({ queryKey: supplierQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: supplierQueryKeys.stats() });

      // Success notification
      await addNotification({
        title: '📝 Supplier Diperbarui',
        message: `${data.nama || updatedSupplier.nama} telah diperbarui`,
        type: 'info',
        icon: 'edit',
        priority: 1,
        related_type: 'system',
        action_url: '/supplier',
        is_read: false,
        is_archived: false
      });

      toast.success('Supplier berhasil diperbarui!');
    }
  });

  // Delete supplier mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteSupplier(id, user!.id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: supplierQueryKeys.lists() });

      const previousSuppliers = queryClient.getQueryData(supplierQueryKeys.list()) as Supplier[];
      const supplierToDelete = previousSuppliers?.find(s => s.id === id);

      // Optimistically update
      queryClient.setQueryData(
        supplierQueryKeys.list(),
        (old: Supplier[] = []) => old.filter(s => s.id !== id)
      );

      return { previousSuppliers, supplierToDelete };
    },
    onError: (error: any, id, context) => {
      if (context?.previousSuppliers) {
        queryClient.setQueryData(supplierQueryKeys.list(), context.previousSuppliers);
      }
      
      const errorMessage = error.message || 'Terjadi kesalahan sistem';
      toast.error(`Gagal menghapus supplier: ${errorMessage}`);
      
      addNotification(createNotificationHelper.systemError(
        `Gagal menghapus supplier: ${errorMessage}`
      ));
    },
    onSuccess: async (result, id, context) => {
      queryClient.invalidateQueries({ queryKey: supplierQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: supplierQueryKeys.stats() });

      if (context?.supplierToDelete) {
        // Activity log
        addActivity({
          title: 'Supplier Dihapus',
          description: `${context.supplierToDelete.nama} telah dihapus`,
          type: 'supplier',
          value: null
        });

        // Delete notification
        await addNotification({
          title: '🗑️ Supplier Dihapus',
          message: `${context.supplierToDelete.nama} telah dihapus dari daftar supplier`,
          type: 'warning',
          icon: 'trash-2',
          priority: 2,
          related_type: 'system',
          action_url: '/supplier',
          is_read: false,
          is_archived: false
        });

        toast.success('Supplier berhasil dihapus!');
      }
    }
  });

  return {
    addMutation,
    updateMutation,
    deleteMutation
  };
};

// ===========================================
// PROVIDER COMPONENT
// ===========================================

export const SupplierProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch suppliers using React Query
  const {
    data: suppliers = [],
    isLoading,
    error,
    refetch
  } = useSuppliersQuery(user?.id);

  // Get mutations
  const { addMutation, updateMutation, deleteMutation } = useSupplierMutations();

  // ===========================================
  // REAL-TIME SUBSCRIPTION
  // ===========================================

  useEffect(() => {
    if (!user?.id) return;

    logger.context('SupplierContext', 'Setting up real-time subscription for user:', user.id);

    // Setup realtime subscription
    const channel = supabase.channel(`realtime-suppliers-${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'suppliers',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        logger.context('SupplierContext', 'Real-time event received:', payload);

        // Instead of manually updating state, invalidate queries
        queryClient.invalidateQueries({
          queryKey: supplierQueryKeys.lists()
        });
        queryClient.invalidateQueries({
          queryKey: supplierQueryKeys.stats()
        });
      })
      .subscribe();

    // Cleanup function
    return () => {
      logger.context('SupplierContext', 'Cleaning up real-time channel');
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  // ===========================================
  // CONTEXT FUNCTIONS
  // ===========================================

  const addSupplier = useCallback(async (
    supplierData: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt' | 'userId'>
  ): Promise<Supplier | null> => {
    if (!user) {
      toast.error('Anda harus login untuk menambahkan supplier');
      return null;
    }

    try {
      const newSupplier = await addMutation.mutateAsync(supplierData);
      return newSupplier;
    } catch (error) {
      return null;
    }
  }, [user, addMutation]);

  const updateSupplierFn = useCallback(async (
    id: string,
    supplierData: Partial<Omit<Supplier, 'id' | 'userId'>>
  ): Promise<Supplier | null> => {
    if (!user) {
      toast.error('Anda harus login untuk memperbarui supplier');
      return null;
    }

    const existingSupplier = suppliers.find(s => s.id === id);
    if (!existingSupplier) {
      toast.error('Supplier tidak ditemukan');
      return null;
    }

    try {
      const updated = await updateMutation.mutateAsync({ id, data: supplierData });
      return updated;
    } catch (error) {
      return null;
    }
  }, [user, suppliers, updateMutation]);

  const deleteSupplierFn = useCallback(async (id: string): Promise<boolean> => {
    if (!user) {
      toast.error('Anda harus login untuk menghapus supplier');
      return false;
    }

    const supplierToDelete = suppliers.find(s => s.id === id);
    if (!supplierToDelete) {
      toast.error('Supplier tidak ditemukan');
      return false;
    }

    try {
      await deleteMutation.mutateAsync(id);
      return true;
    } catch (error) {
      return false;
    }
  }, [user, suppliers, deleteMutation]);

  // ===========================================
  // UTILITY METHODS
  // ===========================================

  const getSupplierById = useCallback((id: string) => {
    return suppliers.find(s => s.id === id);
  }, [suppliers]);

  const refreshSuppliers = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const clearError = useCallback(() => {
    // Error handling is managed by React Query
  }, []);

  // ===========================================
  // CONTEXT VALUE
  // ===========================================

  const contextValue = useMemo<SupplierContextType>(() => ({
    // State
    suppliers,
    isLoading: isLoading || addMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
    error: error ? (error instanceof Error ? error.message : String(error)) : null,
    
    // Actions
    addSupplier,
    updateSupplier: updateSupplierFn,
    deleteSupplier: deleteSupplierFn,
    
    // Utility methods
    getSupplierById,
    refreshSuppliers,
    clearError,
  }), [
    suppliers,
    isLoading,
    error,
    addMutation.isPending,
    updateMutation.isPending,
    deleteMutation.isPending,
    addSupplier,
    updateSupplierFn,
    deleteSupplierFn,
    getSupplierById,
    refreshSuppliers,
    clearError,
  ]);

  return (
    <SupplierContext.Provider value={contextValue}>
      {children}
    </SupplierContext.Provider>
  );
};

// ===========================================
// CUSTOM HOOK
// ===========================================

export const useSupplier = (): SupplierContextType => {
  const context = useContext(SupplierContext);
  
  if (context === undefined) {
    throw new Error('useSupplier must be used within a SupplierProvider');
  }
  
  return context;
};

// ===========================================
// ADDITIONAL HOOKS FOR SPECIFIC USE CASES
// ===========================================

// Hook for getting a specific supplier
export const useSupplierById = (id: string | undefined): Supplier | undefined => {
  const { getSupplierById } = useSupplier();
  return useMemo(() => {
    return id ? getSupplierById(id) : undefined;
  }, [id, getSupplierById]);
};

// Hook for filtered suppliers
export const useFilteredSuppliers = (searchTerm: string = ''): Supplier[] => {
  const { suppliers } = useSupplier();
  
  return useMemo(() => {
    if (!searchTerm.trim()) {
      return suppliers;
    }
    
    const term = searchTerm.toLowerCase();
    return suppliers.filter(supplier =>
      supplier.nama.toLowerCase().includes(term) ||
      supplier.kontak.toLowerCase().includes(term) ||
      (supplier.email && supplier.email.toLowerCase().includes(term))
    );
  }, [suppliers, searchTerm]);
};

// Hook for supplier statistics
export const useSupplierStats = () => {
  const { suppliers } = useSupplier();
  
  return useMemo(() => {
    const total = suppliers.length;
    const withEmail = suppliers.filter(s => s.email).length;
    const withPhone = suppliers.filter(s => s.telepon).length;
    const withAddress = suppliers.filter(s => s.alamat).length;
    
    return {
      total,
      withEmail,
      withPhone,
      withAddress,
      completionRate: total > 0 ? Math.round((withEmail / total) * 100) : 0,
    };
  }, [suppliers]);
};

// ===========================================
// ADDITIONAL HOOKS FOR REACT QUERY UTILITIES
// ===========================================

/**
 * Hook for accessing React Query specific functions
 */
export const useSupplierQuery = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const invalidateSuppliers = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: supplierQueryKeys.lists() });
    queryClient.invalidateQueries({ queryKey: supplierQueryKeys.stats() });
  }, [queryClient]);

  const prefetchSuppliers = useCallback(() => {
    if (user?.id) {
      queryClient.prefetchQuery({
        queryKey: supplierQueryKeys.list(),
        queryFn: () => fetchSuppliers(user.id),
        staleTime: 5 * 60 * 1000,
      });
    }
  }, [queryClient, user?.id]);

  return {
    invalidateSuppliers,
    prefetchSuppliers,
  };
};