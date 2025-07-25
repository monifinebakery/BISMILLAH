import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Purchase } from '@/types/supplier';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import { useActivity } from './ActivityContext';
import { safeParseDate, toSafeISOString } from '@/utils/dashboardUtils';
import { useFinancial } from './FinancialContext';
import { useSupplier } from './SupplierContext';
import { logger } from '@/utils/logger';
import { useLocation } from 'react-router-dom';

// 🎯 TARGETED FIX: Import notification context with restrictions
import { useNotification } from '@/contexts/NotificationContext';
import { createNotificationHelper } from '@/utils/notificationHelpers';
import { formatCurrency } from '@/utils/formatUtils';

interface PurchaseContextType {
  purchases: Purchase[];
  isLoading: boolean;
  addPurchase: (purchase: Omit<Purchase, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  updatePurchase: (id: string, purchase: Partial<Purchase>) => Promise<boolean>;
  deletePurchase: (id: string) => Promise<boolean>;
}

const PurchaseContext = createContext<PurchaseContextType | undefined>(undefined);

export const PurchaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { addActivity } = useActivity();
  const { addFinancialTransaction } = useFinancial();
  const { suppliers } = useSupplier();
  const location = useLocation();
  
  // 🎯 CRITICAL FIX: Restricted notification context for purchase
  const { addNotification } = useNotification();

  const transformPurchaseFromDB = (dbItem: any): Purchase => ({
    id: dbItem.id,
    supplier: dbItem.supplier,
    totalNilai: Number(dbItem.total_nilai) || 0,
    tanggal: safeParseDate(dbItem.tanggal),
    items: dbItem.items || [],
    userId: dbItem.user_id,
    createdAt: safeParseDate(dbItem.created_at),
    updatedAt: safeParseDate(dbItem.updated_at),
    status: dbItem.status,
    metodePerhitungan: dbItem.metode_perhitungan || 'FIFO',
  });

  // 🎯 HELPER: Get supplier name safely
  const getStatusDisplayText = (status: string): string => {
    const statusMap: { [key: string]: string } = {
      'pending': 'Menunggu',
      'completed': 'Selesai',
      'cancelled': 'Dibatalkan'
    };
    return statusMap[status] || status;
  };

  // 🎯 HELPER: Get supplier name safely
  const getSupplierName = (supplierId: string): string => {
    const supplier = suppliers.find(s => s.id === supplierId);
    return supplier?.nama || 'Supplier';
  };

  // 🎯 CRITICAL FIX: Purchase-specific notification helper
  const createPurchaseNotification = async (
    title: string, 
    message: string, 
    type: 'success' | 'info' | 'warning' | 'error' = 'success',
    priority: number = 2,
    purchaseId?: string
  ) => {
    // Only create purchase-related notifications, never inventory
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
      is_archived: false
    });
  };

  useEffect(() => {
    if (!user) {
      setPurchases([]);
      setIsLoading(false);
      return;
    }

    const fetchInitialPurchases = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('purchases')
          .select('*')
          .eq('user_id', user.id)
          .order('tanggal', { ascending: false });

        if (error) {
          console.error('Error fetching purchases:', error);
          toast.error(`Gagal memuat pembelian: ${error.message}`);
          
          // 🎯 FIX: Only create purchase-related system errors
          await createPurchaseNotification(
            '❌ Error Sistem',
            `Gagal memuat data pembelian: ${error.message}`,
            'error',
            4
          );
        } else if (data) {
          setPurchases(data.map(transformPurchaseFromDB));
          logger.context('PurchaseContext', 'Loaded purchases:', data.length);
        }
      } catch (error: any) {
        console.error('Unexpected error:', error);
        await createPurchaseNotification(
          '❌ Error Sistem',
          `Error tidak terduga saat memuat pembelian: ${error.message}`,
          'error',
          4
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialPurchases();

    const channel = supabase
      .channel(`realtime-purchases-${user.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'purchases', 
        filter: `user_id=eq.${user.id}` 
      }, (payload) => {
        const transform = transformPurchaseFromDB;
        try {
          if (payload.eventType === 'INSERT') {
            setPurchases(current => [transform(payload.new), ...current].sort((a, b) => 
              new Date(b.tanggal!).getTime() - new Date(a.tanggal!).getTime()
            ));
          } else if (payload.eventType === 'UPDATE') {
            setPurchases(current => current.map(item => 
              item.id === payload.new.id ? transform(payload.new) : item
            ));
          } else if (payload.eventType === 'DELETE') {
            setPurchases(current => current.filter(item => item.id !== payload.old.id));
          }
        } catch (error) {
          console.error('Real-time update error:', error);
          toast.error(`Error handling real-time update: ${error.message}`);
        }
      })
      .subscribe();

    return () => { 
      supabase.removeChannel(channel); 
    };
  }, [user]);

  const addPurchase = async (purchase: Omit<Purchase, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    if (!user) {
      toast.error('Anda harus login untuk menambahkan pembelian');
      return false;
    }

    try {
      const purchaseDataForRPC = {
        user_id: user.id,
        supplier: purchase.supplier,
        total_nilai: purchase.totalNilai,
        tanggal: toSafeISOString(purchase.tanggal),
        items: purchase.items,
        status: purchase.status,
        metode_perhitungan: purchase.metodePerhitungan,
      };

      const { error } = await supabase.rpc('add_purchase_and_update_stock', { 
        purchase_data: purchaseDataForRPC 
      });

      if (error) {
        throw new Error(error.message);
      }

      const supplierName = getSupplierName(purchase.supplier);
      const itemCount = purchase.items?.length || 0;

      // Activity log
      addActivity({ 
        title: 'Pembelian Ditambahkan', 
        description: `Pembelian dari ${supplierName} senilai ${formatCurrency(purchase.totalNilai)}`, 
        type: 'purchase', 
        value: null 
      });

      // Success toast
      toast.success('Pembelian berhasil diproses dan stok telah diperbarui!');

      // 🎯 CRITICAL FIX: Only create purchase notifications, never inventory
      await createPurchaseNotification(
        '📦 Pembelian Baru Dibuat!',
        `Pembelian dari ${supplierName} senilai ${formatCurrency(purchase.totalNilai)} dengan ${itemCount} item berhasil dibuat dan stok diperbarui`,
        'success',
        2
      );

      return true;
    } catch (error: any) {
      console.error('Error adding purchase:', error);
      toast.error(`Gagal memproses pembelian: ${error.message}`);

      // 🎯 FIX: Purchase-specific error notification
      await createPurchaseNotification(
        '❌ Pembelian Gagal',
        `Gagal memproses pembelian: ${error.message}`,
        'error',
        4
      );

      return false;
    }
  };

  const updatePurchase = async (id: string, updatedData: Partial<Purchase>): Promise<boolean> => {
    if (!user) {
      toast.error('Anda harus login.');
      return false;
    }

    const oldPurchase = purchases.find(p => p.id === id);
    if (!oldPurchase) {
      toast.error('Data pembelian lama tidak ditemukan.');
      return false;
    }

    try {
      const purchaseToUpdate: { [key: string]: any } = { 
        updated_at: new Date().toISOString() 
      };

      if (updatedData.supplier !== undefined) purchaseToUpdate.supplier = updatedData.supplier;
      if (updatedData.totalNilai !== undefined) purchaseToUpdate.total_nilai = updatedData.totalNilai;
      if (updatedData.tanggal !== undefined) purchaseToUpdate.tanggal = toSafeISOString(updatedData.tanggal);
      if (updatedData.items !== undefined) purchaseToUpdate.items = updatedData.items;
      if (updatedData.status !== undefined) purchaseToUpdate.status = updatedData.status;
      if (updatedData.metodePerhitungan !== undefined) purchaseToUpdate.metode_perhitungan = updatedData.metodePerhitungan;

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
          addActivity({
            title: 'Pengeluaran Dicatat',
            description: `Pengeluaran ${formatCurrency(oldPurchase.totalNilai)} untuk pembelian dari ${supplierName}.`,
            type: 'keuangan',
            value: oldPurchase.totalNilai.toString()
          });

          // 🎯 FIX: Purchase completed notification
          await createPurchaseNotification(
            '✅ Pembelian Selesai!',
            `Pembelian dari ${supplierName} senilai ${formatCurrency(oldPurchase.totalNilai)} telah selesai dan pengeluaran tercatat`,
            'success',
            2,
            id
          );
        } else {
          toast.error('Pembelian diperbarui, tapi gagal mencatat pengeluaran.');
          
          // 🎯 FIX: Purchase warning notification
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

      // Success notifications
      if (wasExpenseRecorded) {
        toast.success('Status diubah & pengeluaran berhasil dicatat.');
      } else {
        toast.success('Pembelian berhasil diperbarui.');

        // 🎯 FIX: Status change notification (if status changed)
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
      console.error('Error updating purchase:', error);
      toast.error(`Gagal memperbarui pembelian: ${error.message}`);

      // 🎯 FIX: Purchase error notification
      await createPurchaseNotification(
        '❌ Update Gagal',
        `Gagal memperbarui pembelian dari ${getSupplierName(oldPurchase.supplier)}: ${error.message}`,
        'error',
        4,
        id
      );

      return false;
    }
  };

  const deletePurchase = async (id: string): Promise<boolean> => {
    if (!user) {
      toast.error('Anda harus login.');
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
      addActivity({ 
        title: 'Pembelian Dihapus', 
        description: `Pembelian dari ${supplierName} telah dihapus.`, 
        type: 'purchase', 
        value: null 
      });

      // Success toast
      toast.success('Pembelian berhasil dihapus.');

      // 🎯 FIX: Purchase delete notification
      await createPurchaseNotification(
        '🗑️ Pembelian Dihapus',
        `Pembelian dari ${supplierName} senilai ${formatCurrency(purchaseToDelete.totalNilai)} telah dihapus dari sistem`,
        'warning',
        2
      );

      return true;
    } catch (error: any) {
      console.error('Error deleting purchase:', error);
      toast.error(`Gagal menghapus pembelian: ${error.message}`);

      // 🎯 FIX: Purchase delete error notification
      await createPurchaseNotification(
        '❌ Hapus Gagal',
        `Gagal menghapus pembelian dari ${getSupplierName(purchaseToDelete.supplier)}: ${error.message}`,
        'error',
        4,
        id
      );

      return false;
    }
  };

  const value: PurchaseContextType = { 
    purchases, 
    isLoading, 
    addPurchase, 
    updatePurchase, 
    deletePurchase 
  };

  return (
    <PurchaseContext.Provider value={value}>
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