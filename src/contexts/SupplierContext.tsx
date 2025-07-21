import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Supplier } from '@/types/supplier';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// --- DEPENDENCIES ---
import { useAuth } from './AuthContext';
import { useActivity } from './ActivityContext';
import { safeParseDate } from '@/utils/dateUtils';

// --- INTERFACE & CONTEXT ---
interface SupplierContextType {
  suppliers: Supplier[];
  isLoading: boolean;
  selectedItems: string[];
  isSelectionMode: boolean;
  isBulkDeleting: boolean;
  
  // Basic CRUD operations
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<boolean>;
  updateSupplier: (id: string, supplier: Partial<Omit<Supplier, 'id' | 'userId'>>) => Promise<boolean>;
  deleteSupplier: (id: string) => Promise<boolean>;
  
  // Bulk operations
  bulkDeleteSupplier: (ids: string[]) => Promise<boolean>;
  
  // Selection management
  toggleSelection: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  toggleSelectionMode: () => void;
  isSelected: (id: string) => boolean;
  
  // Utility
  getSelectedItems: () => Supplier[];
  refreshData: () => Promise<void>;
  getSupplierByName: (nama: string) => Supplier | undefined;
}

const SupplierContext = createContext<SupplierContextType | undefined>(undefined);

// --- PROVIDER COMPONENT ---
export const SupplierProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // --- STATE ---
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // --- DEPENDENCIES ---
  const { user } = useAuth();
  const { addActivity } = useActivity();
  
  // --- HELPER FUNCTION ---
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

  // --- FUNGSI UNTUK MENGAMBIL ULANG DATA (REFETCH) ---
  const fetchSuppliers = async () => {
    if (!user) {
      setSuppliers([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    console.log('[SupplierContext] Memulai fetchSuppliers untuk user:', user.id);
    
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('user_id', user.id)
        .order('nama', { ascending: true });

      if (error) {
        console.error('[SupplierContext] Gagal memuat supplier:', error.message);
        toast.error(`Gagal memuat supplier: ${error.message}`);
      } else if (data) {
        const transformedData = data.map(transformSupplierFromDB);
        console.log('[SupplierContext] Data supplier berhasil dimuat:', transformedData.length, 'items');
        setSuppliers(transformedData);
      }
    } catch (err) {
      console.error('[SupplierContext] Error in fetchSuppliers:', err);
      toast.error('Terjadi kesalahan saat memuat data supplier');
    } finally {
      setIsLoading(false);
      console.log('[SupplierContext] fetchSuppliers selesai.');
    }
  };

  // Public refresh function
  const refreshData = async () => {
    await fetchSuppliers();
  };

  // --- EFEK UTAMA: FETCH DATA & REALTIME LISTENER ---
  useEffect(() => {
    console.log('[SupplierContext] useEffect dipicu, user:', user?.id);
    fetchSuppliers();
    
    // Clear selection when user changes
    setSelectedItems([]);
    setIsSelectionMode(false);

    if (!user) {
      return;
    }

    let mounted = true;
    let retryCount = 0;
    const maxRetries = 3;

    // Setup realtime subscription dengan retry mechanism
    const setupRealtime = () => {
      console.log(`[SupplierContext] Setting up realtime subscription (attempt ${retryCount + 1})`);
      
      const channel = supabase
        .channel(`realtime-suppliers-${user.id}-${Date.now()}`)
        .on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'suppliers', 
            filter: `user_id=eq.${user.id}` 
          },
          (payload) => {
            if (!mounted) return;

            console.log('[SupplierContext] Realtime update received:', {
              event: payload.eventType,
              id: payload.new?.id || payload.old?.id,
              data: payload.new || payload.old
            });

            try {
              if (payload.eventType === 'INSERT' && payload.new) {
                const newSupplier = transformSupplierFromDB(payload.new);
                console.log('[SupplierContext] Adding new supplier:', newSupplier);
                
                setSuppliers(current => {
                  const exists = current.find(s => s.id === newSupplier.id);
                  if (exists) {
                    console.log('[SupplierContext] Supplier already exists, skipping');
                    return current;
                  }
                  
                  const updated = [newSupplier, ...current];
                  return updated.sort((a, b) => a.nama.localeCompare(b.nama));
                });
              }
              
              else if (payload.eventType === 'UPDATE' && payload.new) {
                const updatedSupplier = transformSupplierFromDB(payload.new);
                console.log('[SupplierContext] Updating supplier:', updatedSupplier);
                
                setSuppliers(current => {
                  const newSuppliers = current.map(supplier => 
                    supplier.id === updatedSupplier.id ? updatedSupplier : supplier
                  );
                  console.log('[SupplierContext] Suppliers after update:', newSuppliers.length);
                  return newSuppliers.sort((a, b) => a.nama.localeCompare(b.nama));
                });
                
                toast.success(`Supplier ${payload.new.nama} diperbarui`);
              }
              
              else if (payload.eventType === 'DELETE' && payload.old) {
                console.log('[SupplierContext] Deleting supplier:', payload.old.id);
                setSuppliers(current => current.filter(supplier => supplier.id !== payload.old.id));
              }
            } catch (err) {
              console.error('[SupplierContext] Error processing realtime update:', err);
              // Force refresh jika ada error
              setTimeout(() => {
                if (mounted) {
                  console.log('[SupplierContext] Force refreshing due to error');
                  refreshData();
                }
              }, 1000);
            }
          }
        )
        .subscribe((status) => {
          console.log('[SupplierContext] Realtime subscription status:', status);
          
          if (status === 'SUBSCRIBED') {
            console.log('[SupplierContext] Successfully subscribed to realtime suppliers');
            retryCount = 0; // Reset retry count on success
          } else if (status === 'CHANNEL_ERROR' || status === 'CLOSED') {
            console.error('[SupplierContext] Realtime subscription error/closed');
            
            if (retryCount < maxRetries && mounted) {
              retryCount++;
              console.log(`[SupplierContext] Retrying realtime connection (${retryCount}/${maxRetries})`);
              setTimeout(() => {
                if (mounted) {
                  supabase.removeChannel(channel);
                  setupRealtime();
                }
              }, 2000 * retryCount); // Exponential backoff
            } else {
              toast.error('Koneksi realtime terputus, refresh halaman jika data tidak sinkron');
            }
          }
        });

      return channel;
    };

    const realtimeChannel = setupRealtime();

    // Backup polling untuk memastikan sync
    const pollInterval = setInterval(() => {
      if (mounted && !isLoading) {
        console.log('[SupplierContext] Backup polling refresh');
        refreshData();
      }
    }, 60000); // Poll setiap 1 menit sebagai backup

    // Cleanup function
    return () => {
      mounted = false;
      console.log('[SupplierContext] Cleaning up realtime subscription and polling');
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }
      clearInterval(pollInterval);
    };
  }, [user]);

  // --- SELECTION MANAGEMENT ---
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
    setIsSelectionMode(prev => !prev);
    if (isSelectionMode) {
      setSelectedItems([]);
    }
  }, [isSelectionMode]);

  const isSelected = useCallback((id: string) => {
    return selectedItems.includes(id);
  }, [selectedItems]);

  const getSelectedItems = useCallback(() => {
    return suppliers.filter(supplier => selectedItems.includes(supplier.id));
  }, [suppliers, selectedItems]);

  // --- BULK DELETE FUNCTION ---
  const bulkDeleteSupplier = async (ids: string[]): Promise<boolean> => {
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
      // Get items to be deleted for activity log
      const itemsToDelete = suppliers.filter(supplier => ids.includes(supplier.id));
      
      console.log('[SupplierContext] Memulai bulk delete untuk IDs:', ids);
      
      // Optimistic update - remove items from UI first
      const previousSuppliers = [...suppliers];
      setSuppliers(prev => prev.filter(supplier => !ids.includes(supplier.id)));
      
      // Perform bulk delete in database
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .in('id', ids)
        .eq('user_id', user.id); // Extra security check

      if (error) {
        // Rollback optimistic update
        setSuppliers(previousSuppliers);
        console.error('[SupplierContext] Error bulk delete:', error);
        toast.error(`Gagal menghapus supplier: ${error.message}`);
        return false;
      }

      // Log activities for deleted items
      for (const supplier of itemsToDelete) {
        addActivity({
          title: 'Supplier Dihapus (Bulk)',
          description: `${supplier.nama} telah dihapus dalam operasi bulk delete`,
          type: 'supplier',
          value: null
        });
      }

      // Clear selection
      setSelectedItems([]);
      setIsSelectionMode(false);

      toast.success(`${ids.length} supplier berhasil dihapus!`);
      console.log('[SupplierContext] Bulk delete berhasil untuk', ids.length, 'items');
      
      // Refresh data to ensure consistency
      await fetchSuppliers();
      
      return true;
    } catch (err) {
      console.error('[SupplierContext] Unexpected error in bulk delete:', err);
      toast.error('Terjadi kesalahan saat menghapus supplier');
      // Refresh data to restore correct state
      await fetchSuppliers();
      return false;
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // --- FUNGSI-FUNGSI CRUD ---
  const addSupplier = async (supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt' | 'userId'>): Promise<boolean> => {
    if (!user) { 
      toast.error('Anda harus login untuk menambahkan supplier'); 
      return false; 
    }

    try {
      // Optimistic update - tambah supplier sementara ke UI
      const optimisticSupplier: Supplier = {
        id: `temp-${Date.now()}`,
        nama: supplier.nama,
        kontak: supplier.kontak,
        email: supplier.email,
        telepon: supplier.telepon,
        alamat: supplier.alamat,
        catatan: supplier.catatan,
        userId: user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Tambah ke UI dulu (optimistic)
      setSuppliers(current => [optimisticSupplier, ...current].sort((a, b) => a.nama.localeCompare(b.nama)));

      const supplierToInsert = {
        user_id: user.id,
        nama: supplier.nama,
        kontak: supplier.kontak,
        email: supplier.email,
        telepon: supplier.telepon,
        alamat: supplier.alamat,
        catatan: supplier.catatan ?? null,
      };

      const { error } = await supabase.from('suppliers').insert(supplierToInsert);
      
      if (error) {
        // Rollback optimistic update
        setSuppliers(current => current.filter(s => s.id !== optimisticSupplier.id));
        toast.error(`Gagal menambahkan supplier: ${error.message}`);
        return false;
      }

      // Hapus optimistic supplier karena realtime akan handle yang asli
      setSuppliers(current => current.filter(s => s.id !== optimisticSupplier.id));
      
      addActivity({ 
        title: 'Supplier Ditambahkan', 
        description: `${supplier.nama} telah ditambahkan`, 
        type: 'supplier', 
        value: null 
      });
      toast.success(`${supplier.nama} berhasil ditambahkan!`);
      return true;
    } catch (err) {
      // Rollback optimistic update
      setSuppliers(current => current.filter(s => !s.id.startsWith('temp-')));
      console.error('[SupplierContext] Error adding supplier:', err);
      toast.error('Terjadi kesalahan saat menambahkan supplier');
      return false;
    }
  };

  const updateSupplier = async (id: string, updatedData: Partial<Omit<Supplier, 'id' | 'userId'>>): Promise<boolean> => {
    if (!user) { 
      toast.error('Anda harus login untuk memperbarui supplier'); 
      return false; 
    }

    const oldSupplier = suppliers.find(s => s.id === id);
    if (!oldSupplier) {
      toast.error('Supplier tidak ditemukan.');
      return false;
    }

    try {
      // Optimistic update
      const optimisticSupplier = { ...oldSupplier, ...updatedData };
      setSuppliers(current => 
        current.map(supplier => supplier.id === id ? optimisticSupplier : supplier)
          .sort((a, b) => a.nama.localeCompare(b.nama))
      );

      const supplierToUpdate: { [key: string]: any } = {};
      if (updatedData.nama !== undefined) supplierToUpdate.nama = updatedData.nama;
      if (updatedData.kontak !== undefined) supplierToUpdate.kontak = updatedData.kontak;
      if (updatedData.email !== undefined) supplierToUpdate.email = updatedData.email;
      if (updatedData.telepon !== undefined) supplierToUpdate.telepon = updatedData.telepon;
      if (updatedData.alamat !== undefined) supplierToUpdate.alamat = updatedData.alamat;
      if (updatedData.catatan !== undefined) supplierToUpdate.catatan = updatedData.catatan;

      const { error } = await supabase.from('suppliers').update(supplierToUpdate).eq('id', id);
      
      if (error) {
        // Rollback optimistic update
        setSuppliers(current => 
          current.map(supplier => supplier.id === id ? oldSupplier : supplier)
        );
        toast.error(`Gagal memperbarui supplier: ${error.message}`);
        return false;
      }
      
      toast.success(`Supplier berhasil diperbarui!`);
      return true;
    } catch (err) {
      // Rollback optimistic update
      setSuppliers(current => 
        current.map(supplier => supplier.id === id ? oldSupplier : supplier)
      );
      console.error('[SupplierContext] Error updating supplier:', err);
      toast.error('Terjadi kesalahan saat memperbarui supplier');
      return false;
    }
  };

  const deleteSupplier = async (id: string): Promise<boolean> => {
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
      // Optimistic update - hapus dari UI dulu
      setSuppliers(current => current.filter(s => s.id !== id));

      const { error } = await supabase.from('suppliers').delete().eq('id', id);
      
      if (error) {
        // Rollback optimistic update
        setSuppliers(current => {
          const exists = current.find(s => s.id === id);
          if (exists) return current;
          return [...current, supplierToDelete].sort((a, b) => a.nama.localeCompare(b.nama));
        });
        toast.error(`Gagal menghapus supplier: ${error.message}`);
        return false;
      }
      
      addActivity({ 
        title: 'Supplier Dihapus', 
        description: `${supplierToDelete.nama} telah dihapus`, 
        type: 'supplier', 
        value: null 
      });
      toast.success(`Supplier berhasil dihapus!`);
      return true;
    } catch (err) {
      // Rollback optimistic update
      setSuppliers(current => {
        const exists = current.find(s => s.id === id);
        if (exists) return current;
        return [...current, supplierToDelete].sort((a, b) => a.nama.localeCompare(b.nama));
      });
      console.error('[SupplierContext] Error deleting supplier:', err);
      toast.error('Terjadi kesalahan saat menghapus supplier');
      return false;
    }
  };

  // Get supplier by name utility
  const getSupplierByName = useCallback((nama: string): Supplier | undefined => {
    return suppliers.find(supplier => supplier.nama.toLowerCase() === nama.toLowerCase());
  }, [suppliers]);

  const value: SupplierContextType = {
    suppliers,
    isLoading,
    selectedItems,
    isSelectionMode,
    isBulkDeleting,
    
    // Basic CRUD
    addSupplier,
    updateSupplier,
    deleteSupplier,
    
    // Bulk operations
    bulkDeleteSupplier,
    
    // Selection management
    toggleSelection,
    selectAll,
    clearSelection,
    toggleSelectionMode,
    isSelected,
    
    // Utility
    getSelectedItems,
    refreshData,
    getSupplierByName,
  };

  return <SupplierContext.Provider value={value}>{children}</SupplierContext.Provider>;
};

// --- CUSTOM HOOK ---
export const useSupplier = () => {
  const context = useContext(SupplierContext);
  if (context === undefined) {
    throw new Error('useSupplier must be used within a SupplierProvider');
  }
  return context;
};