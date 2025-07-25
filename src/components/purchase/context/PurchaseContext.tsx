// Fixed PurchaseContext.tsx - Enhanced safety and error handling
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Purchase } from '@/types/supplier';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useActivity } from '@/contexts/ActivityContext';
import { safeParseDate, toSafeISOString } from '@/utils/unifiedDateUtils';
import { useFinancial } from '@/components/financial/contexts/FinancialContext';
import { useSupplier } from '@/contexts/SupplierContext';
import { logger } from '@/utils/logger';
import { useLocation } from 'react-router-dom';

// 🔧 FIXED: Import notification context with safe handling
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
  
  // 🔧 FIXED: Safe notification context usage
  const { addNotification } = useNotification();

  // 🔧 FIXED: Enhanced data transformation with error handling
  const transformPurchaseFromDB = (dbItem: any): Purchase => {
    try {
      if (!dbItem || typeof dbItem !== 'object') {
        console.error('Invalid purchase data from DB:', dbItem);
        throw new Error('Invalid purchase data format');
      }

      return {
        id: dbItem.id || '',
        supplier: dbItem.supplier || '',
        totalNilai: Number(dbItem.total_nilai) || 0,
        tanggal: safeParseDate(dbItem.tanggal) || new Date(),
        items: Array.isArray(dbItem.items) ? dbItem.items : [],
        userId: dbItem.user_id || '',
        createdAt: safeParseDate(dbItem.created_at) || new Date(),
        updatedAt: safeParseDate(dbItem.updated_at) || new Date(),
        status: dbItem.status || 'pending',
        metodePerhitungan: dbItem.metode_perhitungan || 'FIFO',
      };
    } catch (error) {
      console.error('Error transforming purchase from DB:', error, dbItem);
      // Return safe fallback
      return {
        id: dbItem?.id || 'error',
        supplier: 'Error',
        totalNilai: 0,
        tanggal: new Date(),
        items: [],
        userId: dbItem?.user_id || '',
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'pending',
        metodePerhitungan: 'FIFO',
      };
    }
  };

  // 🔧 FIXED: Safe helper functions
  const getStatusDisplayText = (status: string): string => {
    try {
      const statusMap: { [key: string]: string } = {
        'pending': 'Menunggu',
        'completed': 'Selesai',
        'cancelled': 'Dibatalkan'
      };
      return statusMap[status] || status;
    } catch (error) {
      console.error('Error getting status display text:', error);
      return status || 'Unknown';
    }
  };

  const getSupplierName = (supplierId: string): string => {
    try {
      if (!supplierId || !Array.isArray(suppliers)) return 'Supplier';
      const supplier = suppliers.find(s => s.id === supplierId);
      return supplier?.nama || 'Supplier';
    } catch (error) {
      console.error('Error getting supplier name:', error);
      return 'Supplier';
    }
  };

  // 🔧 FIXED: Safe notification helper
  const createPurchaseNotification = async (
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
        is_archived: false
      });
    } catch (error) {
      console.error('Error creating purchase notification:', error);
      // Don't throw - notification failure shouldn't break main functionality
    }
  };

  // 🔧 FIXED: Enhanced data fetching with better error handling
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
          
          await createPurchaseNotification(
            '❌ Error Sistem',
            `Gagal memuat data pembelian: ${error.message}`,
            'error',
            4
          );
        } else if (data) {
          // 🔧 FIXED: Safe transformation of array data
          const transformedPurchases = data
            .map(item => {
              try {
                return transformPurchaseFromDB(item);
              } catch (transformError) {
                console.error('Error transforming individual purchase:', transformError, item);
                return null;
              }
            })
            .filter(Boolean) as Purchase[]; // Remove null items

          setPurchases(transformedPurchases);
          logger.context('PurchaseContext', 'Loaded purchases:', transformedPurchases.length);
        }
      } catch (error: any) {
        console.error('Unexpected error:', error);
        toast.error('Terjadi kesalahan saat memuat data pembelian');
        
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

    // 🔧 FIXED: Enhanced real-time subscription with error handling
    const channel = supabase
      .channel(`realtime-purchases-${user.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'purchases', 
        filter: `user_id=eq.${user.id}` 
      }, (payload) => {
        try {
          if (payload.eventType === 'INSERT' && payload.new) {
            const newPurchase = transformPurchaseFromDB(payload.new);
            setPurchases(current => [newPurchase, ...current].sort((a, b) => 
              new Date(b.tanggal!).getTime() - new Date(a.tanggal!).getTime()
            ));
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            const updatedPurchase = transformPurchaseFromDB(payload.new);
            setPurchases(current => current.map(item => 
              item.id === updatedPurchase.id ? updatedPurchase : item
            ));
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

  // 🔧 FIXED: Enhanced addPurchase with comprehensive validation
  const addPurchase = async (purchase: Omit<Purchase, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    if (!user) {
      toast.error('Anda harus login untuk menambahkan pembelian');
      return false;
    }

    // 🔧 FIXED: Enhanced input validation
    if (!purchase || typeof purchase !== 'object') {
      toast.error('Data pembelian tidak valid');
      return false;
    }

    if (!purchase.supplier) {
      toast.error('Supplier harus dipilih');
      return false;
    }

    if (!purchase.totalNilai || purchase.totalNilai <= 0) {
      toast.error('Total nilai pembelian harus lebih dari 0');
      return false;
    }

    if (!Array.isArray(purchase.items) || purchase.items.length === 0) {
      toast.error('Minimal satu item harus ditambahkan');
      return false;
    }

    try {
      const purchaseDataForRPC = {
        user_id: user.id,
        supplier: purchase.supplier,
        total_nilai: purchase.totalNilai,
        tanggal: toSafeISOString(purchase.tanggal) || toSafeISOString(new Date()),
        items: purchase.items,
        status: purchase.status || 'pending',
        metode_perhitungan: purchase.metodePerhitungan || 'FIFO',
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
      if (addActivity && typeof addActivity === 'function') {
        addActivity({ 
          title: 'Pembelian Ditambahkan', 
          description: `Pembelian dari ${supplierName} senilai ${formatCurrency(purchase.totalNilai)}`, 
          type: 'purchase', 
          value: null 
        });
      }

      // Success toast
      toast.success('Pembelian berhasil diproses dan stok telah diperbarui!');

      // Success notification
      await createPurchaseNotification(
        '📦 Pembelian Baru Dibuat!',
        `Pembelian dari ${supplierName} senilai ${formatCurrency(purchase.totalNilai)} dengan ${itemCount} item berhasil dibuat dan stok diperbarui`,
        'success',
        2
      );

      return true;
    } catch (error: any) {
      console.error('Error adding purchase:', error);
      toast.error(`Gagal memproses pembelian: ${error.message || 'Unknown error'}`);

      await createPurchaseNotification(
        '❌ Pembelian Gagal',
        `Gagal memproses pembelian: ${error.message || 'Unknown error'}`,
        'error',
        4
      );

      return false;
    }
  };

  // 🔧 FIXED: Enhanced updatePurchase with validation
  const updatePurchase = async (id: string, updatedData: Partial<Purchase>): Promise<boolean> => {
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
      const purchaseToUpdate: { [key: string]: any } = { 
        updated_at: new Date().toISOString() 
      };

      // Safe property updates
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
                  value: oldPurchase.totalNilai.toString()
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
      console.error('Error updating purchase:', error);
      toast.error(`Gagal memperbarui pembelian: ${error.message || 'Unknown error'}`);

      await createPurchaseNotification(
        '❌ Update Gagal',
        `Gagal memperbarui pembelian dari ${getSupplierName(oldPurchase.supplier)}: ${error.message || 'Unknown error'}`,
        'error',
        4,
        id
      );

      return false;
    }
  };

  // 🔧 FIXED: Enhanced deletePurchase with validation
  const deletePurchase = async (id: string): Promise<boolean> => {
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
          value: null 
        });
      }

      // Success toast
      toast.success('Pembelian berhasil dihapus.');

      // Delete notification
      await createPurchaseNotification(
        '🗑️ Pembelian Dihapus',
        `Pembelian dari ${supplierName} senilai ${formatCurrency(purchaseToDelete.totalNilai)} telah dihapus dari sistem`,
        'warning',
        2
      );

      return true;
    } catch (error: any) {
      console.error('Error deleting purchase:', error);
      toast.error(`Gagal menghapus pembelian: ${error.message || 'Unknown error'}`);

      await createPurchaseNotification(
        '❌ Hapus Gagal',
        `Gagal menghapus pembelian dari ${getSupplierName(purchaseToDelete.supplier)}: ${error.message || 'Unknown error'}`,
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