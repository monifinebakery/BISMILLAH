// src/components/purchase/context/PurchaseContext.tsx - Fixed Real-time Subscription Spam

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

// ✅ CONSOLIDATED: Core context imports
import { useAuth } from '@/contexts/AuthContext';
import { useActivity } from '@/contexts/ActivityContext';
import { useFinancial } from '@/components/financial/contexts/FinancialContext';
import { useSupplier } from '@/contexts/SupplierContext';
import { useNotification } from '@/contexts/NotificationContext';

// ✅ CONSOLIDATED: Types and utilities
import { Purchase, PurchaseContextType } from '../types/purchase.types';
import { formatCurrency } from '@/utils/formatUtils';

// ✅ CONSOLIDATED: Transform utilities (keep existing imports)
import {
  transformPurchaseFromDB,
  transformPurchaseForDB,
  transformPurchaseUpdateForDB,
  transformPurchasesFromDB,
  transformRealtimePayload,
} from '../utils/purchaseTransformers';

// ✅ CONSOLIDATED: Helper utilities
import {
  validatePurchaseData,
  getStatusDisplayText,
} from '../utils/purchaseHelpers';

// ✅ OPTIMIZED: Context creation
const PurchaseContext = createContext<PurchaseContextType | undefined>(undefined);

// ✅ OPTIMIZED: Provider component with fixed real-time subscription
export const PurchaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // ✅ STATE: Keep existing state structure
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ REFS: For subscription management
  const channelRef = useRef<any>(null);
  const currentUserRef = useRef<any>(null);
  const setupTimeoutRef = useRef<NodeJS.Timeout>();

  // ✅ CONTEXTS: Keep existing context usage
  const { user } = useAuth();
  const { addActivity } = useActivity();
  const { addTransaction } = useFinancial();
  const { suppliers } = useSupplier();
  const { addNotification } = useNotification();

  // ✅ MEMOIZED: Optimize supplier lookup
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

  // ✅ MEMOIZED: Notification creator
  const createPurchaseNotification = useCallback(async (
    title: string,
    message: string,
    type: 'success' | 'info' | 'warning' | 'error' = 'success',
    priority: number = 2,
    purchaseId?: string
  ) => {
    try {
      if (!addNotification || typeof addNotification !== 'function') {
        if (process.env.NODE_ENV === 'development') {
          logger.warn('Notification function not available');
        }
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
  }, [addNotification]);

  // ✅ OPTIMIZED: Data fetching with better error handling
  const fetchPurchases = useCallback(async () => {
    if (!user) {
      setPurchases([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('purchases')
        .select('*')
        .eq('user_id', user.id)
        .order('tanggal', { ascending: false });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      if (data) {
        const transformedPurchases = transformPurchasesFromDB(data);
        setPurchases(transformedPurchases);
        if (process.env.NODE_ENV === 'development') {
          logger.context('PurchaseContext', 'Loaded purchases:', transformedPurchases.length);
        }
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Gagal memuat data pembelian';
      logger.error('Error fetching purchases:', err);
      setError(errorMessage);
      toast.error(`Gagal memuat pembelian: ${errorMessage}`);
      
      await createPurchaseNotification(
        '❌ Error Sistem',
        `Gagal memuat data pembelian: ${errorMessage}`,
        'error',
        4
      );
    } finally {
      setIsLoading(false);
    }
  }, [user, createPurchaseNotification]);

  // ✅ MEMOIZED: Public refresh method
  const refreshPurchases = useCallback(async () => {
    await fetchPurchases();
  }, [fetchPurchases]);

  // ✅ OPTIMIZED: Add purchase with consolidated logic
  const addPurchase = useCallback(async (
    purchase: Omit<Purchase, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<boolean> => {
    if (!user) {
      toast.error('Anda harus login untuk menambahkan pembelian');
      return false;
    }

    // ✅ EARLY VALIDATION
    const validationErrors = validatePurchaseData(purchase);
    if (validationErrors.length > 0) {
      toast.error(validationErrors[0]);
      return false;
    }

    try {
      const purchaseDataForRPC = transformPurchaseForDB(purchase, user.id);

      const { error } = await supabase.rpc('add_purchase_and_update_stock', {
        purchase_data: purchaseDataForRPC,
      });

      if (error) {
        throw new Error(error.message);
      }

      // ✅ CONSOLIDATED: Success handling
      const supplierName = getSupplierName(purchase.supplier);
      const itemCount = purchase.items?.length || 0;
      const totalValue = formatCurrency(purchase.totalNilai);

      // Activity log
      if (addActivity && typeof addActivity === 'function') {
        addActivity({
          title: 'Pembelian Ditambahkan',
          description: `Pembelian dari ${supplierName} senilai ${totalValue}`,
          type: 'purchase',
          value: null,
        });
      }

      // Success feedback
      toast.success('Pembelian berhasil diproses dan stok telah diperbarui!');

      await createPurchaseNotification(
        '📦 Pembelian Baru Dibuat!',
        `Pembelian dari ${supplierName} senilai ${totalValue} dengan ${itemCount} item berhasil dibuat`,
        'success',
        2
      );

      return true;
    } catch (error: any) {
      const errorMessage = error.message || 'Unknown error';
      logger.error('Error adding purchase:', error);
      toast.error(`Gagal memproses pembelian: ${errorMessage}`);

      await createPurchaseNotification(
        '❌ Pembelian Gagal',
        `Gagal memproses pembelian: ${errorMessage}`,
        'error',
        4
      );

      return false;
    }
  }, [user, getSupplierName, addActivity, createPurchaseNotification]);

  // ✅ OPTIMIZED: Update purchase with better status handling
  const updatePurchase = useCallback(async (
    id: string,
    updatedData: Partial<Purchase>
  ): Promise<boolean> => {
    if (!user) {
      toast.error('Anda harus login.');
      return false;
    }

    if (!id || typeof id !== 'string') {
      toast.error('ID pembelian tidak valid');
      return false;
    }

    // ✅ MEMOIZED: Find old purchase
    const oldPurchase = purchases.find(p => p.id === id);
    if (!oldPurchase) {
      toast.error('Data pembelian lama tidak ditemukan.');
      return false;
    }

    try {
      const purchaseToUpdate = transformPurchaseUpdateForDB(updatedData);

      const { error } = await supabase
        .from('purchases')
        .update(purchaseToUpdate)
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      // ✅ CONSOLIDATED: Status change handling
      const supplierName = getSupplierName(oldPurchase.supplier);
      const oldStatus = oldPurchase.status;
      const newStatus = updatedData.status;
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
                '✅ Pembelian Selesai!',
                `Pembelian dari ${supplierName} senilai ${totalValue} telah selesai dan pengeluaran tercatat`,
                'success',
                2,
                id
              );
            } else {
              toast.error('Pembelian diperbarui, tapi gagal mencatat pengeluaran.');

              await createPurchaseNotification(
                '⚠️ Pembelian Diperbarui, Pengeluaran Gagal',
                `Status pembelian dari ${supplierName} berhasil diubah, tetapi gagal mencatat pengeluaran ${totalValue}`,
                'warning',
                3,
                id
              );

              return true;
            }
          }
        } catch (financialError) {
          logger.error('Error recording financial transaction:', financialError);
          toast.warning('Pembelian diperbarui, tapi ada masalah dengan pencatatan keuangan');
        }
      }

      // ✅ CONSOLIDATED: Success notifications
      if (wasExpenseRecorded) {
        toast.success('Status diubah & pengeluaran berhasil dicatat.');
      } else {
        toast.success('Pembelian berhasil diperbarui.');

        // Status change notification
        if (newStatus && oldStatus !== newStatus) {
          await createPurchaseNotification(
            '📝 Status Pembelian Diubah',
            `Pembelian dari ${supplierName} diubah dari "${getStatusDisplayText(oldStatus)}" menjadi "${getStatusDisplayText(newStatus)}"`,
            'info',
            2,
            id
          );
        }
      }

      return true;
    } catch (error: any) {
      const errorMessage = error.message || 'Unknown error';
      logger.error('Error updating purchase:', error);
      toast.error(`Gagal memperbarui pembelian: ${errorMessage}`);

      await createPurchaseNotification(
        '❌ Update Gagal',
        `Gagal memperbarui pembelian dari ${getSupplierName(oldPurchase.supplier)}: ${errorMessage}`,
        'error',
        4,
        id
      );

      return false;
    }
  }, [user, purchases, getSupplierName, addTransaction, addActivity, createPurchaseNotification]);

  // ✅ OPTIMIZED: Delete purchase with consolidated error handling
  const deletePurchase = useCallback(async (id: string): Promise<boolean> => {
    if (!user) {
      toast.error('Anda harus login.');
      return false;
    }

    if (!id || typeof id !== 'string') {
      toast.error('ID pembelian tidak valid');
      return false;
    }

    // ✅ MEMOIZED: Find purchase to delete
    const purchaseToDelete = purchases.find(p => p.id === id);
    if (!purchaseToDelete) {
      toast.error('Data pembelian tidak ditemukan.');
      return false;
    }

    try {
      const { error } = await supabase
        .from('purchases')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      // ✅ CONSOLIDATED: Success handling
      const supplierName = getSupplierName(purchaseToDelete.supplier);
      const totalValue = formatCurrency(purchaseToDelete.totalNilai);

      // Activity log
      if (addActivity && typeof addActivity === 'function') {
        addActivity({
          title: 'Pembelian Dihapus',
          description: `Pembelian dari ${supplierName} telah dihapus.`,
          type: 'purchase',
          value: null,
        });
      }

      // Success feedback
      toast.success('Pembelian berhasil dihapus.');

      await createPurchaseNotification(
        '🗑️ Pembelian Dihapus',
        `Pembelian dari ${supplierName} senilai ${totalValue} telah dihapus dari sistem`,
        'warning',
        2
      );

      return true;
    } catch (error: any) {
      const errorMessage = error.message || 'Unknown error';
      logger.error('Error deleting purchase:', error);
      toast.error(`Gagal menghapus pembelian: ${errorMessage}`);

      await createPurchaseNotification(
        '❌ Hapus Gagal',
        `Gagal menghapus pembelian dari ${getSupplierName(purchaseToDelete.supplier)}: ${errorMessage}`,
        'error',
        4,
        id
      );

      return false;
    }
  }, [user, purchases, getSupplierName, addActivity, createPurchaseNotification]);

  // ✅ EFFECT: Initial data fetch (optimized)
  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  // ✅ FIXED: Real-time subscription - no more spam!
  useEffect(() => {
    let mounted = true;

    const setupSubscription = () => {
      // ✅ Cleanup previous subscription first
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      if (setupTimeoutRef.current) {
        clearTimeout(setupTimeoutRef.current);
      }

      if (!user || !mounted) return;

      // ✅ Check if user changed to prevent duplicate subscriptions
      if (currentUserRef.current?.id === user.id && channelRef.current) {
        return; // Same user, subscription already exists
      }

      currentUserRef.current = user;

      // ✅ Small delay to prevent rapid re-creation
      setupTimeoutRef.current = setTimeout(() => {
        if (!mounted || !user) return;

        const channelName = `realtime-purchases-${user.id}-${Date.now()}`;
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`[PurchaseContext] Setting up subscription: ${channelName}`);
        }

        channelRef.current = supabase
          .channel(channelName)
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'purchases',
            filter: `user_id=eq.${user.id}`,
          }, (payload) => {
            if (!mounted) return;

            try {
              if (process.env.NODE_ENV === 'development') {
                console.log(`[PurchaseContext] Real-time event: ${payload.eventType}`);
              }

              if (payload.eventType === 'INSERT' && payload.new) {
                const newPurchase = transformRealtimePayload(payload);
                if (newPurchase) {
                  setPurchases(current => {
                    // ✅ OPTIMIZED: Prevent duplicates and maintain sort order
                    const exists = current.find(p => p.id === newPurchase.id);
                    if (exists) return current;
                    
                    return [newPurchase, ...current].sort((a, b) =>
                      new Date(b.tanggal!).getTime() - new Date(a.tanggal!).getTime()
                    );
                  });
                }
              } else if (payload.eventType === 'UPDATE' && payload.new) {
                const updatedPurchase = transformRealtimePayload(payload);
                if (updatedPurchase) {
                  setPurchases(current => 
                    current.map(item => 
                      item.id === updatedPurchase.id ? updatedPurchase : item
                    )
                  );
                }
              } else if (payload.eventType === 'DELETE' && payload.old?.id) {
                setPurchases(current => 
                  current.filter(item => item.id !== payload.old.id)
                );
              }
            } catch (error) {
              logger.error('Real-time update error:', error);
              toast.error('Error dalam pembaruan real-time data pembelian');
            }
          })
          .subscribe((status) => {
            if (!mounted) return;

            if (status === 'SUBSCRIBED') {
              if (process.env.NODE_ENV === 'development') {
                console.log('[PurchaseContext] Real-time connected');
              }
            } else if (status === 'SUBSCRIPTION_ERROR') {
              logger.error('PurchaseContext: Real-time subscription failed');
            }
          });
      }, 200);
    };

    setupSubscription();

    return () => {
      mounted = false;
      
      if (setupTimeoutRef.current) {
        clearTimeout(setupTimeoutRef.current);
      }
      
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      
      currentUserRef.current = null;
    };
  }, [user]); // ✅ Only depend on user

  // ✅ MEMOIZED: Context value for better performance
  const contextValue = useMemo<PurchaseContextType>(() => ({
    purchases,
    isLoading,
    error,
    addPurchase,
    updatePurchase,
    deletePurchase,
    refreshPurchases,
  }), [
    purchases,
    isLoading,
    error,
    addPurchase,
    updatePurchase,
    deletePurchase,
    refreshPurchases
  ]);

  return (
    <PurchaseContext.Provider value={contextValue}>
      {children}
    </PurchaseContext.Provider>
  );
};

// ✅ OPTIMIZED: Custom hook with error handling
export const usePurchase = () => {
  const context = useContext(PurchaseContext);
  if (context === undefined) {
    throw new Error('usePurchase must be used within a PurchaseProvider');
  }
  return context;
};