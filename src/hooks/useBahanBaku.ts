// src/hooks/useBahanBaku.ts
import { useState, useEffect } from 'react'; // useState dan useEffect mungkin tidak diperlukan lagi jika tidak ada state internal
import { toast } from 'sonner';

// MODIFIED: Import BahanBaku dari lokasi bersama (src/types/recipe.ts)
import { BahanBaku } from '@/types/recipe';
// MODIFIED: Import useAppData
import { useAppData } from '@/contexts/AppDataContext';

// MODIFIED: safeParseDate mungkin tidak perlu diimpor di sini jika hanya digunakan di useSupabaseSync
// dan data BahanBaku sudah berupa Date objects dari useAppData.
// Jika fungsi add/update/delete BahanBaku masih di hook ini (bukan di useAppData),
// maka safeParseDate dan supabase masih diperlukan.
// Sesuai instruksi, CRUD akan dipindahkan ke useAppData. Jadi, kita hapus impor yang tidak perlu.
// import { safeParseDate } from '@/hooks/useSupabaseSync'; // DIHAPUS

// MODIFIED: useBahanBaku tidak lagi menerima userId karena data akan dari AppDataContext
export const useBahanBaku = () => {
  // MODIFIED: useBahanBaku tidak lagi memiliki state bahanBaku dan loading internal
  // Data bahanBaku akan diterima dari useAppData melalui komponen yang memanggil hook ini.
  const { bahanBaku, addBahanBaku, updateBahanBaku, deleteBahanBaku } = useAppData();

  // MODIFIED: loadBahanBaku dan useEffect-nya dihapus. Data loading ditangani AppDataContext.
  // const [loading, setLoading] = useState(true);
  // const loadBahanBaku = async () => { ... };
  // useEffect(() => { loadBahanBaku(); }, [userId]);
  // useEffect(() => { saveToStorage(STORAGE_KEY, bahanBaku); }, [bahanBaku]);


  // MODIFIED: CRUD functions akan memanggil fungsi dari useAppData
  // Ini adalah fungsi yang akan dipanggil oleh komponen seperti WarehousePage
  const addBahanBakuToApp = async (bahan: Omit<BahanBaku, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    // Validasi atau logika pra-penyimpanan lainnya bisa tetap di sini
    return addBahanBaku(bahan); // Memanggil addBahanBaku dari useAppData
  };

  const updateBahanBakuInApp = async (id: string, updates: Partial<BahanBaku>) => {
    // Validasi atau logika pra-update lainnya
    return updateBahanBaku(id, updates); // Memanggil updateBahanBaku dari useAppData
  };

  const deleteBahanBakuInApp = async (id: string) => {
    // Validasi atau logika pra-hapus lainnya
    return deleteBahanBaku(id); // Memanggil deleteBahanBaku dari useAppData
  };


  const getBahanBakuByName = (nama: string): BahanBaku | undefined => {
    return bahanBaku.find(bahan => bahan.nama.toLowerCase() === nama.toLowerCase());
  };

  const reduceStok = (nama: string, jumlah: number): boolean => {
    const bahan = getBahanBakuByName(nama);
    if (!bahan) {
      toast.error(`Stok ${nama} tidak ditemukan.`);
      return false;
    }
    if (bahan.stok < jumlah) {
      toast.error(`Stok ${nama} tidak cukup. Tersisa ${bahan.stok} ${bahan.satuan}.`);
      return false;
    }
    // MODIFIED: Panggil updateBahanBaku dari useAppData
    updateBahanBaku(bahan.id, { stok: bahan.stok - jumlah });
    return true;
  };

  return {
    bahanBaku, // MODIFIED: bahanBaku kini hanya disediakan, bukan dikelola di sini
    // loading, // DIHAPUS
    // loadBahanBaku, // DIHAPUS
    addBahanBaku: addBahanBakuToApp, // MODIFIED: Ekspor wrapper
    updateBahanBaku: updateBahanBakuInApp, // MODIFIED: Ekspor wrapper
    deleteBahanBaku: deleteBahanBakuInApp, // MODIFIED: Ekspor wrapper
    getBahanBakuByName,
    reduceStok,
    // setBahanBaku, // DIHAPUS
  };
};