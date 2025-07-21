import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Purchase } from '@/types/supplier';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import { useActivity } from './ActivityContext';
import { safeParseDate, toSafeISOString } from '@/utils/dateUtils';
import { useFinancial } from './FinancialContext';
import { useSupplier } from './SupplierContext';
import { formatCurrency } from '@/utils/currencyUtils';

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

  useEffect(() => {
    if (!user) {
      setPurchases([]);
      setIsLoading(false);
      return;
    }
    const fetchInitialPurchases = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('purchases')
        .select('*')
        .eq('user_id', user.id)
        .order('tanggal', { ascending: false });
      if (error) {
        toast.error(`Gagal memuat pembelian: ${error.message}`);
      } else if (data) {
        setPurchases(data.map(transformPurchaseFromDB));
      }
      setIsLoading(false);
    };
    fetchInitialPurchases();
    const channel = supabase
      .channel(`realtime-purchases-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'purchases', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const transform = transformPurchaseFromDB;
          if (payload.eventType === 'INSERT') {
            setPurchases(current => [transform(payload.new), ...current].sort((a, b) => new Date(b.tanggal!).getTime() - new Date(a.tanggal!).getTime()));
          } else if (payload.eventType === 'UPDATE') {
            setPurchases(current => current.map(item => item.id === payload.new.id ? transform(payload.new) : item));
          } else if (payload.eventType === 'DELETE') {
            setPurchases(current => current.filter(item => item.id !== payload.old.id));
          }
        }
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const addPurchase = async (purchase: Omit<Purchase, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    if (!user) {
      toast.error('Anda harus login untuk menambahkan pembelian');
      return false;
    }
    const purchaseDataForRPC = {
      user_id: user.id,
      supplier: purchase.supplier,
      total_nilai: purchase.totalNilai,
      tanggal: toSafeISOString(purchase.tanggal),
      items: purchase.items,
      status: purchase.status,
      metode_perhitungan: purchase.metodePerhitungan,
    };
    const { error } = await supabase.rpc('add_purchase_and_update_stock', { purchase_data: purchaseDataForRPC });
    if (error) {
      toast.error(`Gagal memproses pembelian: ${error.message}`);
      return false;
    }
    const supplier = suppliers.find(s => s.id === purchase.supplier);
    addActivity({ title: 'Pembelian Ditambahkan', description: `Pembelian dari ${supplier?.nama || ''} senilai ${formatCurrency(purchase.totalNilai)}`, type: 'purchase', value: null });
    toast.success('Pembelian berhasil diproses dan stok telah diperbarui!');
    return true;
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
    const purchaseToUpdate: { [key: string]: any } = { updated_at: new Date().toISOString() };
    if (updatedData.supplier !== undefined) purchaseToUpdate.supplier = updatedData.supplier;
    if (updatedData.totalNilai !== undefined) purchaseToUpdate.total_nilai = updatedData.totalNilai;
    if (updatedData.tanggal !== undefined) purchaseToUpdate.tanggal = toSafeISOString(updatedData.tanggal);
    if (updatedData.items !== undefined) purchaseToUpdate.items = updatedData.items;
    if (updatedData.status !== undefined) purchaseToUpdate.status = updatedData.status;
    if (updatedData.metodePerhitungan !== undefined) purchaseToUpdate.metode_perhitungan = updatedData.metodePerhitungan;

    const { error } = await supabase.from('purchases').update(purchaseToUpdate).eq('id', id);
    if (error) {
      toast.error(`Gagal memperbarui pembelian: ${error.message}`);
      return false;
    }

    let wasExpenseRecorded = false;
    if (oldPurchase.status !== 'completed' && updatedData.status === 'completed') {
      const supplier = suppliers.find(s => s.id === oldPurchase.supplier);
      const supplierName = supplier?.nama || 'Supplier';
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
      } else {
        toast.error('Pembelian diperbarui, tapi gagal mencatat pengeluaran.');
        return true;
      }
    }

    if (wasExpenseRecorded) {
      toast.success('Status diubah & pengeluaran berhasil dicatat.');
    } else {
      toast.success('Pembelian berhasil diperbarui.');
    }
    return true;
  };

  const deletePurchase = async (id: string): Promise<boolean> => {
    if (!user) {
      toast.error('Anda harus login.');
      return false;
    }
    const purchaseToDelete = purchases.find(p => p.id === id);
    const { error } = await supabase.from('purchases').delete().eq('id', id);
    if (error) {
      toast.error(`Gagal menghapus pembelian: ${error.message}`);
      return false;
    }
    if (purchaseToDelete) {
      const supplier = suppliers.find(s => s.id === purchaseToDelete.supplier);
      addActivity({ title: 'Pembelian Dihapus', description: `Pembelian dari ${supplier?.nama || ''} telah dihapus.`, type: 'purchase', value: null });
    }
    toast.success('Pembelian berhasil dihapus.');
    return true;
  };

  const value: PurchaseContextType = { purchases, isLoading, addPurchase, updatePurchase, deletePurchase };
  return <PurchaseContext.Provider value={value}>{children}</PurchaseContext.Provider>;
};

export const usePurchase = () => {
  const context = useContext(PurchaseContext);
  if (context === undefined) {
    throw new Error('usePurchase must be used within a PurchaseProvider');
  }
  return context;
};