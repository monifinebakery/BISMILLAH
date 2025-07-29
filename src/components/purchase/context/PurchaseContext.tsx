// src/components/purchase/context/PurchaseContext.tsx

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Purchase, PurchaseContextType } from '../types/purchase.types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useActivity } from '@/contexts/ActivityContext';
import { useFinancial } from '@/components/financial/contexts/FinancialContext';
import { useSupplier } from '@/contexts/SupplierContext';
import { useNotification } from '@/contexts/NotificationContext';
import { formatCurrency } from '@/utils/formatUtils';
import { logger } from '@/utils/logger';

import {
  transformPurchaseFromDB,
  transformPurchaseForDB,
  transformPurchaseUpdateForDB,
  transformPurchasesFromDB,
  transformRealtimePayload,
} from '../utils/purchaseTransformers';

import {
  validatePurchaseData,
  getStatusDisplayText,
} from '../utils/purchaseHelpers';

// Create context
const PurchaseContext = createContext<PurchaseContextType | undefined>(undefined);

// Provider component
export const PurchaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // State
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dependencies
  const { user } = useAuth();
  const { addActivity } = useActivity();
  const { addFinancialTransaction } = useFinancial();
  const { suppliers } = useSupplier();
  const { addNotification } = useNotification();

  // Helper functions
  const getSupplierName = useCallback((supplierId: string): string => {
    try {
      if (!supplierId || !Array.isArray(suppliers)) return 'Supplier';
      const supplier = suppliers.find(s => s.id === supplierId);
      return supplier?.nama || 'Supplier';
    } catch (error) {
      console.error('Error getting supplier name:', error);
      return 'Supplier';
    }
  }, [suppliers]);

  const createPurchaseNotification = useCallback(async (
    title: string,
    message: string,
    type: 'success' | 'info' | 'warning' | 'error' = 'success',
    priority: number = 2,
    purchaseId?: string
  ) => {
    try {
      if (!addNotification || typeof addNotification !== 'function') {
        console.warn('Notification function not available');
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
      console.error('Error creating purchase notification:', error);
    }
  }, [addNotification]);

  // Fetch purchases
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
        logger.context('PurchaseContext', 'Loaded purchases:', transformedPurchases.length);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Gagal memuat data pembelian';
      console.error('Error fetching purchases:', err);
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

  // Refresh purchases (public method)
  const refreshPurchases = useCallback(async () => {
    await fetchPurchases();
  }, [fetchPurchases]);

  // Add purchase
  const addPurchase = useCallback(async (
    purchase: Omit<Purchase, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<boolean> => {
    if (!user) {
      toast.error('Anda harus login untuk menambahkan pembelian');
      return false;
    }

    // Validate input
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

      const supplierName = getSupplierName(purchase.supplier);
      const itemCount = purchase.items?.length || 0;

      // Activity log
      if (addActivity && typeof addActivity === 'function') {
        addActivity({
          title: 'Pembelian Ditambahkan',
          description: `Pembelian dari ${supplierName} senilai ${formatCurrency(purchase.totalNilai)}`,
          type: 'purchase',
          value: null,
        });
      }

      // Success feedback
      toast.success('Pembelian berhasil diproses dan stok telah diperbarui!');

      await createPurchaseNotification(
        '📦 Pembelian Baru Dibuat!',
        `Pembelian dari ${supplierName} senilai ${formatCurrency(purchase.totalNilai)} dengan ${itemCount} item berhasil dibuat`,
        'success',
        2
      );

      return true;
    } catch (error: any) {
      const errorMessage = error.message || 'Unknown error';
      console.error('Error adding purchase:', error);
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

  // Update purchase
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

      const supplierName = getSupplierName(oldPurchase.supplier);
      const oldStatus = oldPurchase.status;
      const newStatus = updatedData.status;
      let wasExpenseRecorded = false;

      // Handle status change to completed
      if (oldStatus !== 'completed' && newStatus === 'completed') {
        try {
          if (addFinancialTransaction && typeof addFinancialTransaction === 'function') {
            const successFinancial = await addFinancialTransaction({
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
                  description: `Pengeluaran ${formatCurrency(oldPurchase.totalNilai)} untuk pembelian dari ${supplierName}.`,
                  type: 'keuangan',
                  value: oldPurchase.totalNilai.toString(),
                });
              }

              await createPurchaseNotification(
                '✅ Pembelian Selesai!',
                `Pembelian dari ${supplierName} senilai ${formatCurrency(oldPurchase.totalNilai)} telah selesai dan pengeluaran tercatat`,
                'success',
                2,
                id
              );
            } else {
              toast.error('Pembelian diperbarui, tapi gagal mencatat pengeluaran.');

              await createPurchaseNotification(
                '⚠️ Pembelian Diperbarui, Pengeluaran Gagal',
                `Status pembelian dari ${supplierName} berhasil diubah, tetapi gagal mencatat pengeluaran ${formatCurrency(oldPurchase.totalNilai)}`,
                'warning',
                3,
                id
              );

              return true;
            }
          }
        } catch (financialError) {
          console.error('Error recording financial transaction:', financialError);
          toast.warning('Pembelian diperbarui, tapi ada masalah dengan pencatatan keuangan');
        }
      }

      // Success notifications
      if (wasExpenseRecorded) {
        toast.success('Status diubah & pengeluaran berhasil dicatat.');
      } else {
        toast.success('Pembelian berhasil diperbarui.');

        // Status change notification (if status changed)
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
      console.error('Error updating purchase:', error);
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
  }, [user, purchases, getSupplierName, addFinancialTransaction, addActivity, createPurchaseNotification]);

  // Delete purchase
  const deletePurchase = useCallback(async (id: string): Promise<boolean> => {
    if (!user) {
      toast.error('Anda harus login.');
      return false;
    }

    if (!id || typeof id !== 'string') {
      toast.error('ID pembelian tidak valid');
      return false;
    }

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

      const supplierName = getSupplierName(purchaseToDelete.supplier);

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
        `Pembelian dari ${supplierName} senilai ${formatCurrency(purchaseToDelete.totalNilai)} telah dihapus dari sistem`,
        'warning',
        2
      );

      return true;
    } catch (error: any) {
      const errorMessage = error.message || 'Unknown error';
      console.error('Error deleting purchase:', error);
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

  // Initial data fetch
  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`realtime-purchases-${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'purchases',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        try {
          if (payload.eventType === 'INSERT' && payload.new) {
            const newPurchase = transformRealtimePayload(payload);
            if (newPurchase) {
              setPurchases(current => [newPurchase, ...current].sort((a, b) =>
                new Date(b.tanggal!).getTime() - new Date(a.tanggal!).getTime()
              ));
            }
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            const updatedPurchase = transformRealtimePayload(payload);
            if (updatedPurchase) {
              setPurchases(current => current.map(item =>
                item.id === updatedPurchase.id ? updatedPurchase : item
              ));
            }
          } else if (payload.eventType === 'DELETE' && payload.old?.id) {
            setPurchases(current => current.filter(item => item.id !== payload.old.id));
          }
        } catch (error) {
          console.error('Real-time update error:', error);
          toast.error('Error dalam pembaruan real-time data pembelian');
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Context value
  const value: PurchaseContextType = {
    purchases,
    isLoading,
    error,
    addPurchase,
    updatePurchase,
    deletePurchase,
    refreshPurchases,
  };

  return (
    <PurchaseContext.Provider value={value}>
      {children}
    </PurchaseContext.Provider>
  );
};

// Custom hook
export const usePurchase = () => {
  const context = useContext(PurchaseContext);
  if (context === undefined) {
    throw new Error('usePurchase must be used within a PurchaseProvider');
  }
  return context;
};