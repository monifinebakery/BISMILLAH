// src/components/purchase/context/PurchaseContext.tsx
// ✅ FIXED VERSION - Using React Query pattern to eliminate fetch loops

import React, { createContext, useContext, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

// Core context imports
import { useAuth } from '@/contexts/AuthContext';
import { useActivity } from '@/contexts/ActivityContext';
import { useFinancial } from '@/components/financial/contexts/FinancialContext';
import { useSupplier } from '@/contexts/SupplierContext';
import { useNotification } from '@/contexts/NotificationContext';

// Types and utilities
import { Purchase, PurchaseContextType } from '../types/purchase.types';
import { formatCurrency } from '@/utils/formatUtils';

// Transform utilities
import {
  transformPurchaseFromDB,
  transformPurchaseForDB,
  transformPurchaseUpdateForDB,
  transformPurchasesFromDB,
} from '../utils/purchaseTransformers';

// Helper utilities
import {
  validatePurchaseData,
  getStatusDisplayText,
} from '../utils/purchaseHelpers';

// ✅ Query Keys
const purchaseQueryKeys = {
  all: ['purchases'] as const,
  lists: () => [...purchaseQueryKeys.all, 'list'] as const,
  list: (userId?: string) => [...purchaseQueryKeys.lists(), userId] as const,
} as const;

// ✅ Transform functions (stable, no useCallback needed)
const transformRealtimePayload = (payload: any): Purchase | null => {
  try {
    if (!payload.new) return null;
    return transformPurchaseFromDB(payload.new);
  } catch (error) {
    logger.error('Error transforming realtime payload:', error);
    return null;
  }
};

// ✅ API Functions
const fetchPurchases = async (userId: string): Promise<Purchase[]> => {
  logger.info('🔄 Fetching purchases for user:', userId);
  
  const { data, error } = await supabase
    .from('purchases')
    .select('*')
    .eq('user_id', userId)
    .order('tanggal', { ascending: false });

  if (error) {
    logger.error('❌ Error fetching purchases:', error);
    throw new Error(error.message);
  }

  const purchases = transformPurchasesFromDB(data || []);
  logger.success('✅ Purchases fetched successfully:', purchases.length, 'items');
  return purchases;
};

const createPurchase = async (
  purchase: Omit<Purchase, 'id' | 'userId' | 'createdAt' | 'updatedAt'>, 
  userId: string
): Promise<void> => {
  logger.info('🔄 Creating purchase for supplier:', purchase.supplier);
  
  const purchaseDataForRPC = transformPurchaseForDB(purchase, userId);

  const { error } = await supabase.rpc('add_purchase_and_update_stock', {
    purchase_data: purchaseDataForRPC,
  });

  if (error) {
    logger.error('❌ Error creating purchase:', error);
    throw new Error(error.message);
  }

  logger.success('✅ Purchase created successfully');
};

const updatePurchase = async (
  id: string, 
  updates: Partial<Purchase>
): Promise<void> => {
  logger.info('🔄 Updating purchase:', id);
  
  const purchaseToUpdate = transformPurchaseUpdateForDB(updates);

  const { error } = await supabase
    .from('purchases')
    .update(purchaseToUpdate)
    .eq('id', id);

  if (error) {
    logger.error('❌ Error updating purchase:', error);
    throw new Error(error.message);
  }

  logger.success('✅ Purchase updated successfully:', id);
};

const deletePurchase = async (id: string): Promise<void> => {
  logger.info('🔄 Deleting purchase:', id);
  
  const { error } = await supabase
    .from('purchases')
    .delete()
    .eq('id', id);

  if (error) {
    logger.error('❌ Error deleting purchase:', error);
    throw new Error(error.message);
  }

  logger.success('✅ Purchase deleted successfully:', id);
};

// ✅ Notification helper (stable function)
const createPurchaseNotification = async (
  addNotification: any,
  title: string,
  message: string,
  type: 'success' | 'info' | 'warning' | 'error' = 'success',
  priority: number = 2,
  purchaseId?: string
) => {
  try {
    if (!addNotification || typeof addNotification !== 'function') {
      return;
    }

    await addNotification({
      title,
      message,
      type,
      icon: 'shopping-cart',
      priority,
      related_type: 'purchase',
      related_id: purchaseId,
      action_url: '/pembelian',
      is_read: false,
      is_archived: false,
    });
  } catch (error) {
    logger.error('Error creating purchase notification:', error);
  }
};

const PurchaseContext = createContext<PurchaseContextType | undefined>(undefined);

export const PurchaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { addActivity } = useActivity();
  const { addTransaction } = useFinancial();
  const { suppliers } = useSupplier();
  const { addNotification } = useNotification();
  const queryClient = useQueryClient();

  logger.debug('🔍 PurchaseProvider rendered', {
    userId: user?.id,
    timestamp: new Date().toISOString()
  });

  // ✅ Memoized supplier lookup (stable)
  const getSupplierName = useCallback((supplierId: string): string => {
    try {
      if (!supplierId || !Array.isArray(suppliers)) return 'Supplier';
      const supplier = suppliers.find(s => s.id === supplierId);
      return supplier?.nama || 'Supplier';
    } catch (error) {
      logger.error('Error getting supplier name:', error);
      return 'Supplier';
    }
  }, [suppliers]);

  // ✅ useQuery for fetching purchases
  const {
    data: purchases = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: purchaseQueryKeys.list(user?.id),
    queryFn: () => fetchPurchases(user!.id),
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
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
    mutationFn: (purchase: Omit<Purchase, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => 
      createPurchase(purchase, user!.id),
    onSuccess: async (result, variables) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: purchaseQueryKeys.lists() });

      const supplierName = getSupplierName(variables.supplier);
      const itemCount = variables.items?.length || 0;
      const totalValue = formatCurrency(variables.totalNilai);

      // Activity log
      if (addActivity && typeof addActivity === 'function') {
        addActivity({
          title: 'Pembelian Ditambahkan',
          description: `Pembelian dari ${supplierName} senilai ${totalValue}`,
          type: 'purchase',
          value: null,
        });
      }

      // Success notification
      await createPurchaseNotification(
        addNotification,
        '📦 Pembelian Baru Dibuat!',
        `Pembelian dari ${supplierName} senilai ${totalValue} dengan ${itemCount} item berhasil dibuat`,
        'success',
        2
      );

      toast.success('Pembelian berhasil diproses dan stok telah diperbarui!');
      logger.info('🎉 Create purchase mutation success');
    },
    onError: async (error: Error, variables) => {
      logger.error('❌ Create purchase mutation error:', error.message);
      
      await createPurchaseNotification(
        addNotification,
        '❌ Pembelian Gagal',
        `Gagal memproses pembelian: ${error.message}`,
        'error',
        4
      );
      
      toast.error(`Gagal memproses pembelian: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Purchase> }) => 
      updatePurchase(id, updates),
    onMutate: async ({ id }) => {
      // Find the old purchase for status handling
      const oldPurchase = purchases.find(p => p.id === id);
      return { oldPurchase };
    },
    onSuccess: async (result, { id, updates }, context) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: purchaseQueryKeys.lists() });

      const oldPurchase = context?.oldPurchase;
      if (!oldPurchase) return;

      const supplierName = getSupplierName(oldPurchase.supplier);
      const oldStatus = oldPurchase.status;
      const newStatus = updates.status;
      const totalValue = formatCurrency(oldPurchase.totalNilai);
      let wasExpenseRecorded = false;

      // Handle completion status
      if (oldStatus !== 'completed' && newStatus === 'completed') {
        try {
          if (addTransaction && typeof addTransaction === 'function') {
            const successFinancial = await addTransaction({
              type: 'expense',
              category: 'Pembelian Bahan Baku',
              description: `Pembelian dari ${supplierName}`,
              amount: oldPurchase.totalNilai,
              date: new Date(oldPurchase.tanggal),
              relatedId: oldPurchase.id,
            });

            if (successFinancial) {
              wasExpenseRecorded = true;

              if (addActivity && typeof addActivity === 'function') {
                addActivity({
                  title: 'Pengeluaran Dicatat',
                  description: `Pengeluaran ${totalValue} untuk pembelian dari ${supplierName}.`,
                  type: 'keuangan',
                  value: oldPurchase.totalNilai.toString(),
                });
              }

              await createPurchaseNotification(
                addNotification,
                '✅ Pembelian Selesai!',
                `Pembelian dari ${supplierName} senilai ${totalValue} telah selesai dan pengeluaran tercatat`,
                'success',
                2,
                id
              );
            } else {
              await createPurchaseNotification(
                addNotification,
                '⚠️ Pembelian Diperbarui, Pengeluaran Gagal',
                `Status pembelian dari ${supplierName} berhasil diubah, tetapi gagal mencatat pengeluaran ${totalValue}`,
                'warning',
                3,
                id
              );
            }
          }
        } catch (financialError) {
          logger.error('Error recording financial transaction:', financialError);
        }
      }

      // Success feedback
      if (wasExpenseRecorded) {
        toast.success('Status diubah & pengeluaran berhasil dicatat.');
      } else {
        toast.success('Pembelian berhasil diperbarui.');

        // Status change notification
        if (newStatus && oldStatus !== newStatus) {
          await createPurchaseNotification(
            addNotification,
            '📝 Status Pembelian Diubah',
            `Pembelian dari ${supplierName} diubah dari "${getStatusDisplayText(oldStatus)}" menjadi "${getStatusDisplayText(newStatus)}"`,
            'info',
            2,
            id
          );
        }
      }

      logger.info('🎉 Update purchase mutation success');
    },
    onError: async (error: Error, { id }) => {
      logger.error('❌ Update purchase mutation error:', error.message);
      
      const oldPurchase = purchases.find(p => p.id === id);
      const supplierName = oldPurchase ? getSupplierName(oldPurchase.supplier) : 'Unknown';
      
      await createPurchaseNotification(
        addNotification,
        '❌ Update Gagal',
        `Gagal memperbarui pembelian dari ${supplierName}: ${error.message}`,
        'error',
        4,
        id
      );
      
      toast.error(`Gagal memperbarui pembelian: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePurchase(id),
    onMutate: async (id) => {
      // Find purchase for activity log
      const purchaseToDelete = purchases.find(p => p.id === id);
      return { purchaseToDelete };
    },
    onSuccess: async (result, id, context) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: purchaseQueryKeys.lists() });

      if (context?.purchaseToDelete) {
        const supplierName = getSupplierName(context.purchaseToDelete.supplier);
        const totalValue = formatCurrency(context.purchaseToDelete.totalNilai);

        // Activity log
        if (addActivity && typeof addActivity === 'function') {
          addActivity({
            title: 'Pembelian Dihapus',
            description: `Pembelian dari ${supplierName} telah dihapus.`,
            type: 'purchase',
            value: null,
          });
        }

        // Success notification
        await createPurchaseNotification(
          addNotification,
          '🗑️ Pembelian Dihapus',
          `Pembelian dari ${supplierName} senilai ${totalValue} telah dihapus dari sistem`,
          'warning',
          2
        );

        toast.success('Pembelian berhasil dihapus.');
      }

      logger.info('🎉 Delete purchase mutation success');
    },
    onError: async (error: Error, id) => {
      logger.error('❌ Delete purchase mutation error:', error.message);
      
      const purchaseToDelete = purchases.find(p => p.id === id);
      const supplierName = purchaseToDelete ? getSupplierName(purchaseToDelete.supplier) : 'Unknown';
      
      await createPurchaseNotification(
        addNotification,
        '❌ Hapus Gagal',
        `Gagal menghapus pembelian dari ${supplierName}: ${error.message}`,
        'error',
        4,
        id
      );
      
      toast.error(`Gagal menghapus pembelian: ${error.message}`);
    },
  });

  // ✅ Real-time subscription using useEffect (stable dependencies)
  React.useEffect(() => {
    if (!user?.id) return;

    logger.info('🔄 Setting up real-time subscription for purchases');

    const channel = supabase
      .channel(`realtime-purchases-${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'purchases',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        logger.info('📡 Real-time purchase event received:', payload.eventType);

        // Invalidate queries to refetch fresh data
        queryClient.invalidateQueries({ queryKey: purchaseQueryKeys.lists() });
      })
      .subscribe();

    return () => {
      logger.debug('🧹 Cleaning up purchase real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]); // ✅ Stable dependencies only

  // ✅ Context action functions using mutations
  const addPurchase = useCallback(async (
    purchase: Omit<Purchase, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<boolean> => {
    if (!user) {
      logger.warn('🔐 Add purchase attempted without authentication');
      toast.error('Anda harus login untuk menambahkan pembelian');
      return false;
    }

    // Early validation
    const validationErrors = validatePurchaseData(purchase);
    if (validationErrors.length > 0) {
      toast.error(validationErrors[0]);
      return false;
    }

    try {
      await createMutation.mutateAsync(purchase);
      return true;
    } catch (error) {
      logger.error('❌ Add purchase failed:', error);
      return false;
    }
  }, [user, createMutation]);

  const updatePurchaseAction = useCallback(async (
    id: string,
    updatedData: Partial<Purchase>
  ): Promise<boolean> => {
    if (!user) {
      logger.warn('🔐 Update purchase attempted without authentication');
      toast.error('Anda harus login.');
      return false;
    }

    if (!id || typeof id !== 'string') {
      toast.error('ID pembelian tidak valid');
      return false;
    }

    // Check if purchase exists
    const oldPurchase = purchases.find(p => p.id === id);
    if (!oldPurchase) {
      toast.error('Data pembelian lama tidak ditemukan.');
      return false;
    }

    try {
      await updateMutation.mutateAsync({ id, updates: updatedData });
      return true;
    } catch (error) {
      logger.error('❌ Update purchase failed:', error);
      return false;
    }
  }, [user, purchases, updateMutation]);

  const deletePurchaseAction = useCallback(async (id: string): Promise<boolean> => {
    if (!user) {
      logger.warn('🔐 Delete purchase attempted without authentication');
      toast.error('Anda harus login.');
      return false;
    }

    if (!id || typeof id !== 'string') {
      toast.error('ID pembelian tidak valid');
      return false;
    }

    // Check if purchase exists
    const purchaseToDelete = purchases.find(p => p.id === id);
    if (!purchaseToDelete) {
      toast.error('Data pembelian tidak ditemukan.');
      return false;
    }

    try {
      await deleteMutation.mutateAsync(id);
      return true;
    } catch (error) {
      logger.error('❌ Delete purchase failed:', error);
      return false;
    }
  }, [user, purchases, deleteMutation]);

  const refreshPurchases = useCallback(async (): Promise<void> => {
    logger.info('🔄 Manual refresh purchases requested');
    await refetch();
  }, [refetch]);

  // ✅ Handle query error with notification
  React.useEffect(() => {
    if (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      createPurchaseNotification(
        addNotification,
        '❌ Error Sistem',
        `Gagal memuat data pembelian: ${errorMessage}`,
        'error',
        4
      );
    }
  }, [error, addNotification]);

  // ✅ Context value with enhanced state from useQuery
  const contextValue: PurchaseContextType = {
    purchases,
    isLoading: isLoading || createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
    error: error ? (error as Error).message : null,
    addPurchase,
    updatePurchase: updatePurchaseAction,
    deletePurchase: deletePurchaseAction,
    refreshPurchases,
  };

  logger.debug('🎯 PurchaseContext value prepared:', {
    purchasesCount: purchases.length,
    isLoading: contextValue.isLoading,
    hasError: !!contextValue.error
  });

  return (
    <PurchaseContext.Provider value={contextValue}>
      {children}
    </PurchaseContext.Provider>
  );
};

export const usePurchase = () => {
  const context = useContext(PurchaseContext);
  if (context === undefined) {
    throw new Error('usePurchase must be used within a PurchaseProvider');
  }
  return context;
};