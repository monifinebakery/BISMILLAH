import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Supplier } from '@/types/supplier';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import { useActivity } from './ActivityContext';
import { safeParseDate } from '@/utils/dateUtils';

interface SupplierContextType {
  suppliers: Supplier[];
  isLoading: boolean;
  selectedItems: string[];
  isSelectionMode: boolean;
  isBulkDeleting: boolean;
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<boolean>;
  updateSupplier: (id: string, supplier: Partial<Omit<Supplier, 'id' | 'userId'>>) => Promise<boolean>;
  deleteSupplier: (id: string) => Promise<boolean>;
  bulkDeleteSupplier: (ids: string[]) => Promise<boolean>;
  toggleSelection: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  toggleSelectionMode: () => void;
  isSelected: (id: string) => boolean;
  getSelectedItems: () => Supplier[];
  refreshData: () => Promise<void>;
  getSupplierByName: (nama: string) => Supplier | undefined;
}

const SupplierContext = createContext<SupplierContextType | undefined>(undefined);

export const SupplierProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const { user } = useAuth();
  const { addActivity } = useActivity();
  
  const transformSupplierFromDB = (dbItem: any): Supplier => ({
    id: dbItem.id,
    nama: dbItem.nama,
    kontak: dbItem.kontak,
    email: dbItem.email,
    telepon: dbItem.telepon,
    alamat: dbItem.alamat,
    catatan: dbItem.catatan,
    userId: dbItem.user_id,
    createdAt: safeParseDate(dbItem.created_at),
    updatedAt: safeParseDate(dbItem.updated_at),
  });

  const fetchSuppliers = useCallback(async () => {
    if (!user) {
      setSuppliers([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('user_id', user.id)
        .order('nama', { ascending: true });

      if (error) {
        toast.error(`Gagal memuat supplier: ${error.message}`);
      } else if (data) {
        setSuppliers(data.map(transformSupplierFromDB));
      }
    } catch (err) {
      toast.error('Terjadi kesalahan saat memuat data supplier');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const refreshData = useCallback(async () => {
    await fetchSuppliers();
  }, [fetchSuppliers]);

  useEffect(() => {
    if (!user) {
        setSuppliers([]);
        setSelectedItems([]);
        setIsSelectionMode(false);
        return;
    }

    fetchSuppliers();
    
    let mounted = true;
    let retryCount = 0;
    const maxRetries = 3;

    const setupRealtime = () => {
      const channel = supabase
        .channel(`realtime-suppliers-${user.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'suppliers', filter: `user_id=eq.${user.id}` },
          (payload) => {
            if (!mounted) return;
             try {
               if (payload.eventType === 'INSERT' && payload.new) {
                 const newSupplier = transformSupplierFromDB(payload.new);
                 setSuppliers(current => {
                   if (current.find(s => s.id === newSupplier.id)) return current;
                   return [...current, newSupplier].sort((a, b) => a.nama.localeCompare(b.nama));
                 });
               } else if (payload.eventType === 'UPDATE' && payload.new) {
                 const updatedSupplier = transformSupplierFromDB(payload.new);
                 setSuppliers(current => 
                    current.map(s => (s.id === updatedSupplier.id ? updatedSupplier : s))
                    .sort((a, b) => a.nama.localeCompare(b.nama))
                 );
               } else if (payload.eventType === 'DELETE' && payload.old) {
                 setSuppliers(current => current.filter(supplier => supplier.id !== payload.old.id));
               }
             } catch (err) {
               console.error('[SupplierContext] Error processing realtime update:', err);
               setTimeout(() => { if (mounted) refreshData(); }, 1000);
             }
          }
        )
        .subscribe((status, error) => {
          if (status === 'SUBSCRIBED') {
            console.log('[SupplierContext] Successfully subscribed to realtime suppliers');
            retryCount = 0;
          } else if (status === 'CHANNEL_ERROR') {
            console.error('[SupplierContext] Realtime channel error:', error);
            if (retryCount < maxRetries && mounted) {
              retryCount++;
              setTimeout(() => {
                if (mounted) {
                  supabase.removeChannel(channel).then(() => setupRealtime());
                }
              }, 2000 * retryCount);
            } else if (mounted) {
              toast.error('Koneksi realtime terputus, refresh halaman jika data tidak sinkron');
            }
          }
        });
      return channel;
    };

    const realtimeChannel = setupRealtime();

    return () => {
      mounted = false;
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }
    };
  }, [user, fetchSuppliers, refreshData]);

  const toggleSelection = useCallback((id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  }, []);

  const selectAll = useCallback(() => {
    setSelectedItems(suppliers.map(supplier => supplier.id));
  }, [suppliers]);

  const clearSelection = useCallback(() => {
    setSelectedItems([]);
    setIsSelectionMode(false);
  }, []);

  const toggleSelectionMode = useCallback(() => {
    const newMode = !isSelectionMode;
    setIsSelectionMode(newMode);
    if (!newMode) {
      setSelectedItems([]);
    }
  }, [isSelectionMode]);

  const isSelected = useCallback((id: string) => {
    return selectedItems.includes(id);
  }, [selectedItems]);

  const getSelectedItems = useCallback(() => {
    return suppliers.filter(supplier => selectedItems.includes(supplier.id));
  }, [suppliers, selectedItems]);

  const bulkDeleteSupplier = useCallback(async (ids: string[]): Promise<boolean> => {
    if (!user) {
      toast.error('Anda harus login untuk menghapus supplier');
      return false;
    }
    if (ids.length === 0) {
      toast.warning('Tidak ada item yang dipilih untuk dihapus');
      return false;
    }
    setIsBulkDeleting(true);
    try {
      const itemsToDelete = suppliers.filter(supplier => ids.includes(supplier.id));
      const previousSuppliers = [...suppliers];
      setSuppliers(prev => prev.filter(supplier => !ids.includes(supplier.id)));
      
      const { error } = await supabase.from('suppliers').delete().in('id', ids).eq('user_id', user.id);
      if (error) {
        setSuppliers(previousSuppliers);
        toast.error(`Gagal menghapus supplier: ${error.message}`);
        return false;
      }
      for (const supplier of itemsToDelete) {
        addActivity({
          title: 'Supplier Dihapus (Bulk)',
          description: `${supplier.nama} telah dihapus dalam operasi bulk delete`,
          type: 'supplier',
          value: null
        });
      }
      setSelectedItems([]);
      setIsSelectionMode(false);
      toast.success(`${ids.length} supplier berhasil dihapus!`);
      return true;
    } catch (err) {
      toast.error('Terjadi kesalahan saat menghapus supplier');
      await fetchSuppliers();
      return false;
    } finally {
      setIsBulkDeleting(false);
    }
  }, [user, suppliers, addActivity, fetchSuppliers]);

  const addSupplier = useCallback(async (supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt' | 'userId'>): Promise<boolean> => {
    if (!user) { 
      toast.error('Anda harus login untuk menambahkan supplier'); 
      return false; 
    }
    const supplierToInsert = { ...supplier, user_id: user.id, catatan: supplier.catatan ?? null };
    const { error } = await supabase.from('suppliers').insert(supplierToInsert);
    if (error) {
      toast.error(`Gagal menambahkan supplier: ${error.message}`);
      return false;
    }
    addActivity({ title: 'Supplier Ditambahkan', description: `${supplier.nama} telah ditambahkan`, type: 'supplier', value: null });
    toast.success(`${supplier.nama} berhasil ditambahkan!`);
    return true;
  }, [user, addActivity]);

  const updateSupplier = useCallback(async (id: string, updatedData: Partial<Omit<Supplier, 'id' | 'userId'>>): Promise<boolean> => {
    if (!user) { 
      toast.error('Anda harus login untuk memperbarui supplier'); 
      return false; 
    }
    const { error } = await supabase.from('suppliers').update(updatedData).eq('id', id);
    if (error) {
      toast.error(`Gagal memperbarui supplier: ${error.message}`);
      return false;
    }
    toast.success(`Supplier berhasil diperbarui!`);
    return true;
  }, [user]);

  const deleteSupplier = useCallback(async (id: string): Promise<boolean> => {
    if (!user) { 
      toast.error('Anda harus login untuk menghapus supplier'); 
      return false; 
    }
    const supplierToDelete = suppliers.find(s => s.id === id);
    if (!supplierToDelete) {
      toast.error('Supplier tidak ditemukan');
      return false;
    }
    const { error } = await supabase.from('suppliers').delete().eq('id', id);
    if (error) {
      toast.error(`Gagal menghapus supplier: ${error.message}`);
      return false;
    }
    addActivity({ title: 'Supplier Dihapus', description: `${supplierToDelete.nama} telah dihapus`, type: 'supplier', value: null });
    toast.success(`Supplier berhasil dihapus!`);
    return true;
  }, [user, suppliers, addActivity]);

  const getSupplierByName = useCallback((nama: string): Supplier | undefined => {
    return suppliers.find(supplier => supplier.nama.toLowerCase() === nama.toLowerCase());
  }, [suppliers]);

  const value = {
    suppliers, isLoading, selectedItems, isSelectionMode, isBulkDeleting,
    addSupplier, updateSupplier, deleteSupplier, bulkDeleteSupplier,
    toggleSelection, selectAll, clearSelection, toggleSelectionMode,
    isSelected, getSelectedItems, refreshData, getSupplierByName,
  };

  return <SupplierContext.Provider value={value}>{children}</SupplierContext.Provider>;
};

export const useSupplier = () => {
  const context = useContext(SupplierContext);
  if (context === undefined) {
    throw new Error('useSupplier must be used within a SupplierProvider');
  }
  return context;
};