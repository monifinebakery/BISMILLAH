import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { BahanBaku } from '@/types/bahanBaku';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// --- DEPENDENCIES ---
import { useAuth } from './AuthContext';
import { useActivity } from './ActivityContext';
import { safeParseDate } from '@/utils/dateUtils';

// --- INTERFACE & CONTEXT ---
interface BahanBakuContextType {
  bahanBaku: BahanBaku[];
  isLoading: boolean;
  selectedItems: string[];
  isSelectionMode: boolean;
  isBulkDeleting: boolean;
  
  // Basic CRUD operations
  addBahanBaku: (bahan: Omit<BahanBaku, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<boolean>;
  updateBahanBaku: (id: string, bahan: Partial<BahanBaku>) => Promise<boolean>;
  deleteBahanBaku: (id: string) => Promise<boolean>;
  getBahanBakuByName: (nama: string) => BahanBaku | undefined;
  reduceStok: (nama: string, jumlah: number) => Promise<boolean>;
  
  // Bulk operations
  bulkDeleteBahanBaku: (ids: string[]) => Promise<boolean>;
  
  // Selection management
  toggleSelection: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  toggleSelectionMode: () => void;
  isSelected: (id: string) => boolean;
  
  // Utility
  getSelectedItems: () => BahanBaku[];
  refreshData: () => Promise<void>;
}

const BahanBakuContext = createContext<BahanBakuContextType | undefined>(undefined);

// --- PROVIDER COMPONENT ---
export const BahanBakuProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // --- STATE ---
  const [bahanBaku, setBahanBaku] = useState<BahanBaku[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // --- DEPENDENCIES ---
  const { user } = useAuth();
  const { addActivity } = useActivity();
  
  // --- HELPER FUNCTION ---
  const transformBahanBakuFromDB = (dbItem: any): BahanBaku => ({
    id: dbItem.id,
    nama: dbItem.nama,
    kategori: dbItem.kategori,
    stok: Number(dbItem.stok) || 0,
    satuan: dbItem.satuan,
    hargaSatuan: Number(dbItem.harga_satuan) || 0,
    minimum: Number(dbItem.minimum) || 0,
    supplier: dbItem.supplier,
    tanggalKadaluwarsa: safeParseDate(dbItem.tanggal_kadaluwarsa),
    userId: dbItem.user_id,
    createdAt: safeParseDate(dbItem.created_at),
    updatedAt: safeParseDate(dbItem.updated_at),
    jumlahBeliKemasan: dbItem.jumlah_beli_kemasan,
    satuanKemasan: dbItem.satuan_kemasan,
    hargaTotalBeliKemasan: dbItem.harga_total_beli_kemasan,
  });

  // --- FUNGSI UNTUK MENGAMBIL ULANG DATA (REFETCH) ---
  const fetchBahanBaku = async () => {
    if (!user) {
      setBahanBaku([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    console.log('[BahanBakuContext] Memulai fetchBahanBaku untuk user:', user.id);
    
    try {
      const { data, error } = await supabase
        .from('bahan_baku')
        .select('*')
        .eq('user_id', user.id)
        .order('nama', { ascending: true });

      if (error) {
        console.error('[BahanBakuContext] Gagal memuat bahan baku:', error.message);
        toast.error(`Gagal memuat bahan baku: ${error.message}`);
      } else if (data) {
        const transformedData = data.map(transformBahanBakuFromDB);
        console.log('[BahanBakuContext] Data bahan baku berhasil dimuat:', transformedData.length, 'items');
        setBahanBaku(transformedData);
      }
    } catch (err) {
      console.error('[BahanBakuContext] Error in fetchBahanBaku:', err);
      toast.error('Terjadi kesalahan saat memuat data bahan baku');
    } finally {
      setIsLoading(false);
      console.log('[BahanBakuContext] fetchBahanBaku selesai.');
    }
  };

  // Public refresh function
  const refreshData = async () => {
    await fetchBahanBaku();
  };

  // --- EFEK UTAMA: FETCH DATA ---
  useEffect(() => {
    console.log('[BahanBakuContext] useEffect dipicu, user:', user?.id);
    fetchBahanBaku();
    
    // Clear selection when user changes
    setSelectedItems([]);
    setIsSelectionMode(false);
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
    setSelectedItems(bahanBaku.map(item => item.id));
  }, [bahanBaku]);

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
    console.log('[BahanBakuContext] getSelectedItems called, bahanBaku:', bahanBaku.length, 'selectedItems:', selectedItems.length);
    return bahanBaku.filter(item => selectedItems.includes(item.id));
  }, [bahanBaku, selectedItems]);

  // --- BULK DELETE FUNCTION ---
  const bulkDeleteBahanBaku = async (ids: string[]): Promise<boolean> => {
  if (!user) {
    toast.error('Anda harus login untuk menghapus bahan baku');
    return false;
  }

  if (ids.length === 0) {
    toast.warning('Tidak ada item yang dipilih untuk dihapus');
    return false;
  }

  setIsBulkDeleting(true);
  
  try {
    const itemsToDelete = bahanBaku.filter(item => ids.includes(item.id));
    
    console.log('[BahanBakuContext] Memulai bulk delete untuk IDs:', ids);
    
    const previousBahanBaku = [...bahanBaku];
    setBahanBaku(prev => prev.filter(item => !ids.includes(item.id)));
    
    const { error } = await supabase
      .from('bahan_baku')
      .delete()
      .in('id', ids)
      .eq('user_id', user.id);

    if (error) {
      setBahanBaku(previousBahanBaku);
      console.error('[BahanBakuContext] Error bulk delete:', error);
      toast.error(`Gagal menghapus bahan baku: ${error.message}`);
      return false;
    }

    // Safeguard: Use indexed loop to avoid scoping issues with 'k'
    itemsToDelete.forEach((item, index) => {
      addActivity({
        title: 'Bahan Baku Dihapus (Bulk)',
        description: `${item.nama} telah dihapus dalam operasi bulk delete`,
        type: 'stok',
        value: null
      });
    });

    setSelectedItems([]);
    setIsSelectionMode(false);

    toast.success(`${ids.length} bahan baku berhasil dihapus!`);
    console.log('[BahanBakuContext] Bulk delete berhasil untuk', ids.length, 'items');
    
    await fetchBahanBaku();
    
    return true;
  } catch (err) {
    console.error('[BahanBakuContext] Unexpected error in bulk delete:', err);
    toast.error('Terjadi kesalahan saat menghapus bahan baku');
    await fetchBahanBaku();
    return false;
  } finally {
    setIsBulkDeleting(false);
  }
};

  // --- FUNGSI-FUNGSI CUD ---
  const addBahanBaku = async (bahan: Omit<BahanBaku, 'id' | 'createdAt' | 'updatedAt' | 'userId'>): Promise<boolean> => {
    if (!user) { 
      toast.error('Anda harus login untuk menambahkan bahan baku'); 
      return false; 
    }
    
    const bahanToInsert = { 
      user_id: user.id, 
      nama: bahan.nama, 
      kategori: bahan.kategori, 
      stok: bahan.stok, 
      satuan: bahan.satuan, 
      harga_satuan: bahan.hargaSatuan, 
      minimum: bahan.minimum, 
      supplier: bahan.supplier, 
      tanggal_kadaluwarsa: bahan.tanggalKadaluwarsa, 
      jumlah_beli_kemasan: bahan.jumlahBeliKemasan, 
      satuan_kemasan: bahan.satuanKemasan, 
      harga_total_beli_kemasan: bahan.hargaTotalBeliKemasan 
    };
    
    console.log('[BahanBakuContext] Mengirim data bahan baku baru:', bahanToInsert);
    
    try {
      const { error } = await supabase.from('bahan_baku').insert(bahanToInsert);
      
      if (error) { 
        toast.error(`Gagal menambahkan bahan baku: ${error.message}`); 
        console.error('[BahanBakuContext] Error menambahkan bahan baku:', error);
        return false; 
      }
      
      addActivity({ 
        title: 'Bahan Baku Ditambahkan', 
        description: `${bahan.nama} telah ditambahkan`, 
        type: 'stok', 
        value: null 
      });
      
      toast.success(`${bahan.nama} berhasil ditambahkan!`);
      console.log('[BahanBakuContext] Bahan baku berhasil ditambahkan di DB, memicu fetchBahanBaku.');
      await fetchBahanBaku();
      return true;
    } catch (err) {
      console.error('[BahanBakuContext] Unexpected error adding bahan baku:', err);
      toast.error('Terjadi kesalahan saat menambahkan bahan baku');
      return false;
    }
  };

  const updateBahanBaku = async (id: string, updatedBahan: Partial<BahanBaku>): Promise<boolean> => {
    if (!user) { 
      toast.error('Anda harus login untuk memperbarui bahan baku'); 
      return false; 
    }
    
    const bahanToUpdate: { [key: string]: any } = {};
    if (updatedBahan.nama !== undefined) bahanToUpdate.nama = updatedBahan.nama;
    if (updatedBahan.kategori !== undefined) bahanToUpdate.kategori = updatedBahan.kategori;
    if (updatedBahan.stok !== undefined) bahanToUpdate.stok = updatedBahan.stok;
    if (updatedBahan.hargaSatuan !== undefined) bahanToUpdate.harga_satuan = updatedBahan.hargaSatuan;
    if (updatedBahan.minimum !== undefined) bahanToUpdate.minimum = updatedBahan.minimum;
    if (updatedBahan.supplier !== undefined) bahanToUpdate.supplier = updatedBahan.supplier;
    if (updatedBahan.tanggalKadaluwarsa !== undefined) bahanToUpdate.tanggal_kadaluwarsa = updatedBahan.tanggalKadaluwarsa;
    if (updatedBahan.jumlahBeliKemasan !== undefined) bahanToUpdate.jumlah_beli_kemasan = updatedBahan.jumlahBeliKemasan;
    if (updatedBahan.satuanKemasan !== undefined) bahanToUpdate.satuan_kemasan = updatedBahan.satuanKemasan;
    if (updatedBahan.hargaTotalBeliKemasan !== undefined) bahanToUpdate.harga_total_beli_kemasan = updatedBahan.hargaTotalBeliKemasan;

    console.log('[BahanBakuContext] Mengirim update bahan baku:', id, bahanToUpdate);
    
    try {
      const { error } = await supabase.from('bahan_baku').update(bahanToUpdate).eq('id', id);
      
      if (error) { 
        toast.error(`Gagal memperbarui bahan baku: ${error.message}`); 
        console.error('[BahanBakuContext] Error memperbarui bahan baku:', error);
        return false; 
      }
      
      toast.success(`Bahan baku berhasil diperbarui!`);
      console.log('[BahanBakuContext] Bahan baku berhasil diperbarui di DB, memicu fetchBahanBaku.');
      await fetchBahanBaku();
      return true;
    } catch (err) {
      console.error('[BahanBakuContext] Unexpected error updating bahan baku:', err);
      toast.error('Terjadi kesalahan saat memperbarui bahan baku');
      return false;
    }
  };
  
  const deleteBahanBaku = async (id: string): Promise<boolean> => {
    if (!user) { 
      toast.error("Anda harus login untuk menghapus bahan baku."); 
      return false; 
    }
    
    const bahanToDelete = bahanBaku.find(b => b.id === id); 
    console.log('[BahanBakuContext] Mengirim perintah hapus bahan baku:', id);
    
    try {
      const { error } = await supabase.from('bahan_baku').delete().eq('id', id);
      
      if (error) {
        toast.error(`Gagal menghapus bahan baku: ${error.message}`);
        console.error('[BahanBakuContext] Error menghapus bahan baku:', error);
        return false;
      }

      if (bahanToDelete) {
        addActivity({ 
          title: 'Bahan Baku Dihapus', 
          description: `${bahanToDelete.nama} telah dihapus.`, 
          type: 'stok', 
          value: null 
        });
      }
      
      toast.success("Bahan baku berhasil dihapus.");
      console.log('[BahanBakuContext] Bahan baku berhasil dihapus dari DB, memicu fetchBahanBaku.');
      await fetchBahanBaku();
      return true;
    } catch (err) {
      console.error('[BahanBakuContext] Unexpected error deleting bahan baku:', err);
      toast.error('Terjadi kesalahan saat menghapus bahan baku');
      return false;
    }
  };

  // Fungsi get dan reduce tidak perlu diubah
  const getBahanBakuByName = useCallback((nama: string): BahanBaku | undefined => {
    return bahanBaku.find(bahan => bahan.nama.toLowerCase() === nama.toLowerCase());
  }, [bahanBaku]);

  const reduceStok = async (nama: string, jumlah: number): Promise<boolean> => {
    const bahan = getBahanBakuByName(nama);
    if (!bahan) { 
      toast.error(`Bahan baku ${nama} tidak ditemukan.`); 
      return false; 
    }
    if (bahan.stok < jumlah) { 
      toast.error(`Stok ${nama} (${bahan.stok}) tidak cukup untuk dikurangi ${jumlah}.`); 
      return false; 
    }
    
    const success = await updateBahanBaku(bahan.id, { stok: bahan.stok - jumlah });
    if (success) { 
      addActivity({ 
        title: 'Stok Berkurang', 
        description: `Stok ${nama} berkurang ${jumlah} ${bahan.satuan}`, 
        type: 'stok', 
        value: null 
      }); 
    }
    return success;
  };
  
  const value: BahanBakuContextType = {
    bahanBaku,
    isLoading,
    selectedItems,
    isSelectionMode,
    isBulkDeleting,
    
    // Basic CRUD
    addBahanBaku,
    updateBahanBaku,
    deleteBahanBaku,
    getBahanBakuByName,
    reduceStok,
    
    // Bulk operations
    bulkDeleteBahanBaku,
    
    // Selection management
    toggleSelection,
    selectAll,
    clearSelection,
    toggleSelectionMode,
    isSelected,
    
    // Utility
    getSelectedItems,
    refreshData,
  };

  return (
    <BahanBakuContext.Provider value={value}>
      {children}
    </BahanBakuContext.Provider>
  );
};

// --- CUSTOM HOOK ---
export const useBahanBaku = () => {
  const context = useContext(BahanBakuContext);
  if (context === undefined) {
    throw new Error('useBahanBaku must be used within a BahanBakuProvider');
  }
  return context;
};