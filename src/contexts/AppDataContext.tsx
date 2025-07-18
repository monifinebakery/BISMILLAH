import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { RecipeIngredient, Recipe } from '@/types/recipe'; // Pastikan ini diimpor dari lokasi yang benar
import { Supplier } from '@/types/supplier'; // Pastikan ini diimpor dari lokasi yang benar
import { Order, NewOrder, OrderItem } from '@/types/order'; // Pastikan ini diimpor dari lokasi yang benar
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
// Mengimpor useSupabaseSync dan safeParseDate dari hooks/useSupabaseSync
import { useSupabaseSync, safeParseDate } from '@/hooks/useSupabaseSync';

// =============================================================
// INTERFACES (Pastikan konsisten dengan tipe yang diproses di useSupabaseSync.ts)
// =============================================================
// Ini adalah definisi tipe data untuk frontend (camelCase, Date objects)
export interface BahanBaku {
  id: string;
  nama: string;
  kategori: string;
  stok: number;
  satuan: string;
  hargaSatuan: number; // camelCase
  minimum: number;
  supplier: string;
  tanggalKadaluwarsa: Date | null; // <-- UBAH KE Date | null
  createdAt: Date | null;          // <-- UBAH KE Date | null
  updatedAt: Date | null;          // <-- UBAH KE Date | null
  jumlahBeliKemasan?: number | null; // Opsional, bisa null
  satuanKemasan?: string | null; // Opsional, bisa null
  hargaTotalBeliKemasan?: number | null; // Opsional, bisa null
  userId?: string; // Pastikan ini ada jika user_id dikelola di frontend
}

export interface Purchase {
  id: string;
  tanggal: Date; // Wajib
  supplier: string;
  items: {
    namaBarang: string;
    kategori: string;
    jumlah: number;
    satuan: string;
    hargaSatuan: number;
    totalHarga: number;
  }[];
  totalNilai: number; // camelCase
  status: 'pending' | 'completed' | 'cancelled';
  metodePerhitungan: 'FIFO' | 'LIFO' | 'Average'; // camelCase
  catatan: string | null; // <-- UBAH KE string | null
  createdAt: Date | null;          // <-- UBAH KE Date | null
  updatedAt: Date | null;          // <-- UBAH KE Date | null
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  timestamp: Date; // Wajib
  type: 'hpp' | 'stok' | 'resep' | 'purchase' | 'supplier';
  value?: string; // Opsional
  createdAt: Date | null;          // <-- UBAH KE Date | null
  updatedAt: Date | null;          // <-- UBAH KE Date | null
}

export interface HPPResult {
  id: string;
  nama: string;
  ingredients: RecipeIngredient[];
  biayaTenagaKerja: number; // camelCase
  biayaOverhead: number; // camelCase
  marginKeuntungan: number; // camelCase
  totalHPP: number; // camelCase
  hppPerPorsi: number; // camelCase
  hargaJualPerPorsi: number; // camelCase
  jumlahPorsi: number; // camelCase
  timestamp: Date; // Tetap Date (karena selalu ada fallback new Date())
  createdAt: Date | null;          // <-- UBAH KE Date | null
  updatedAt: Date | null;          // <-- UBAH KE Date | null
}

export interface Asset {
  id: string;
  nama: string;
  jenis: string | null; // <-- UBAH KE string | null
  nilai: number;
  umurManfaat: number;
  tanggalPembelian: Date; // Tetap Date (karena selalu ada fallback new Date())
  penyusutanPerBulan: number;
  nilaiSaatIni: number;
  userId?: string;
  createdAt: Date | null;          // <-- UBAH KE Date | null
  updatedAt: Date | null;          // <-- UBAH KE Date | null
  kategori: string | null; // <-- UBAH KE string | null
  kondisi: string | null;   // <-- UBAH KE string | null
  lokasi: string | null;    // <-- UBAH KE string | null
  deskripsi: string | null; // <-- UBAH KE string | null
  depresiasi: number | null;
}

export interface FinancialTransaction {
  id: string;
  userId: string; // Pastikan ini ada jika user_id dikelola di frontend
  type: 'pemasukan' | 'pengeluaran'; // `type` di frontend (dan juga di DB)
  category: string;
  amount: number;
  description: string;
  date: Date; // Wajib
  created_at: Date; // Wajib (dari DB `created_at`)
  updated_at: Date; // Wajib (dari DB `updated_at`)
}

// =============================================================
// AppDataContextType
// =============================================================
interface AppDataContextType {
  bahanBaku: BahanBaku[];
  addBahanBaku: (bahan: Omit<BahanBaku, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<boolean>;
  updateBahanBaku: (id: string, bahan: Partial<BahanBaku>) => Promise<boolean>;
  deleteBahanBaku: (id: string) => Promise<boolean>;
  getBahanBakuByName: (nama: string) => BahanBaku | undefined;
  reduceStok: (nama: string, jumlah: number) => Promise<boolean>;

  suppliers: Supplier[];
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<boolean>;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => Promise<boolean>;
  deleteSupplier: (id: string) => Promise<boolean>;

  purchases: Purchase[];
  addPurchase: (purchase: Omit<Purchase, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  updatePurchase: (id: string, purchase: Partial<Purchase>) => Promise<boolean>;
  deletePurchase: (id: string) => Promise<boolean>;

  recipes: Recipe[];
  addRecipe: (recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  updateRecipe: (id: string, recipe: Partial<Recipe>) => Promise<boolean>;
  deleteRecipe: (id: string) => Promise<boolean>;

  hppResults: HPPResult[];
  addHPPResult: (result: Omit<HPPResult, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  addHPPCalculation: (result: Omit<HPPResult, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;

  activities: Activity[];
  addActivity: (activity: Omit<Activity, 'id' | 'timestamp' | 'createdAt' | 'updatedAt'>) => Promise<void>;

  orders: Order[];
  addOrder: (order: Omit<NewOrder, 'id' | 'tanggal' | 'createdAt' | 'updatedAt' | 'nomorPesanan' | 'status'>) => Promise<boolean>;
  updateOrder: (id: string, order: Partial<Order>) => Promise<boolean>;
  deleteOrder: (id: string) => Promise<boolean>;
  updateOrderStatus: (id: string, status: Order['status']) => Promise<void>;

  assets: Asset[];
  addAsset: (asset: Omit<Asset, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'penyusutanPerBulan' | 'nilaiSaatIni'>) => Promise<boolean>;
  updateAsset: (id: string, asset: Partial<Asset>) => Promise<boolean>;
  deleteAsset: (id: string) => Promise<boolean>;

  financialTransactions: FinancialTransaction[];
  addFinancialTransaction: (transaction: Omit<FinancialTransaction, 'id' | 'userId' | 'created_at' | 'updated_at'>) => Promise<boolean>;
  updateFinancialTransaction: (id: string, transaction: Partial<FinancialTransaction>) => Promise<boolean>;
  deleteFinancialTransaction: (id: string) => Promise<boolean>;

  getStatistics: () => {
    totalBahanBaku: number;
    stokMenipis: number;
    totalSuppliers: number;
    totalPurchases: number;
    totalRecipes: number;
    averageHPP: number;
  };

  getDashboardStats: () => {
    totalProduk: number;
    stokBahanBaku: number;
    hppRataRata: string;
    stokMenurut: number;
  };

  cloudSyncEnabled: boolean;
  setCloudSyncEnabled: (enabled: boolean) => void;

  syncToCloud: () => Promise<boolean>;
  loadFromCloud: () => Promise<void>;
  replaceAllData: (data: any) => void;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

const STORAGE_KEYS = {
  BAHAN_BAKU: 'hpp_app_bahan_baku',
  SUPPLIERS: 'hpp_app_suppliers',
  PURCHASES: 'hpp_app_purchases',
  RECIPES: 'hpp_app_recipes',
  PRIMARY_RECIPES: 'hpp_app_primary_recipes', // Mungkin tidak lagi digunakan?
  HPP_RESULTS: 'hpp_app_hpp_results',
  ACTIVITIES: 'hpp_app_activities',
  ORDERS: 'hpp_app_orders',
  CLOUD_SYNC: 'hpp_app_cloud_sync',
  ASSETS: 'hpp_app_assets',
  FINANCIAL_TRANSACTIONS: 'hpp_app_financial_transactions',
};

// Pastikan generateUUID, saveToStorage, loadFromStorage ada di utils
// Jika tidak, definisikan di sini
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const saveToStorage = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

// loadFromStorage kini lebih sederhana karena parsing tanggal dilakukan di useSupabaseSync
const loadFromStorage = (key: string, defaultValue: any = []) => {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored); // Cukup parse
    }
    return defaultValue;
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return defaultValue;
  }
};


export const AppDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const {
    syncToSupabase: externalSyncToCloud,
    loadFromSupabase: externalLoadFromCloud,
    isLoading: isSyncingCloud, // Dapatkan status loading dari hook sync
  } = useSupabaseSync();

  // Helper untuk mengubah Date atau string ke ISO string untuk DB.
  // Ini diperlukan di AppDataContext untuk fungsi-fungsi CRUD
  const toSafeISOString = (dateValue: Date | undefined | string | null): string | null => {
    if (!dateValue) return null;
    let dateObj: Date;
    if (dateValue instanceof Date) {
      dateObj = dateValue;
    } else if (typeof dateValue === 'string') {
      dateObj = new Date(dateValue);
    } else {
      console.warn('toSafeISOString received unexpected type:', typeof dateValue, dateValue);
      return null;
    }
    if (isNaN(dateObj.getTime())) {
      return null;
    }
    return dateObj.toISOString();
  };

  // Inisialisasi state dari localStorage, tanpa parsing tanggal karena akan ditangani saat load dari cloud
  const [bahanBaku, setBahanBaku] = useState<BahanBaku[]>(() =>
    loadFromStorage(STORAGE_KEYS.BAHAN_BAKU, [])
  );
  const [suppliers, setSuppliers] = useState<Supplier[]>(() =>
    loadFromStorage(STORAGE_KEYS.SUPPLIERS, [])
  );
  const [purchases, setPurchases] = useState<Purchase[]>(() =>
    loadFromStorage(STORAGE_KEYS.PURCHASES, [])
  );
  const [recipes, setRecipes] = useState<Recipe[]>(() =>
    loadFromStorage(STORAGE_KEYS.RECIPES, [])
  );
  const [hppResults, setHppResults] = useState<HPPResult[]>(() =>
    loadFromStorage(STORAGE_KEYS.HPP_RESULTS, [])
  );
  const [activities, setActivities] = useState<Activity[]>(() =>
    loadFromStorage(STORAGE_KEYS.ACTIVITIES, [])
  );
  // Default orders harus konsisten dengan tipe Order.
  // Pastikan tanggal adalah objek Date yang valid
  const [orders, setOrders] = useState<Order[]>(() =>
    loadFromStorage(STORAGE_KEYS.ORDERS, [
      {
        id: generateUUID(),
        nomorPesanan: 'ORD-001',
        tanggal: new Date('2024-12-28T10:00:00Z'), // Gunakan format ISO string untuk default
        namaPelanggan: 'John Doe',
        emailPelanggan: 'john@example.com',
        teleponPelanggan: '081234567890',
        alamatPelanggan: 'Jl. Merdeka No. 123, Jakarta',
        items: [{ id: 1, nama: 'Kue Coklat', quantity: 2, hargaSatuan: 50000, totalHarga: 100000 }],
        subtotal: 100000,
        pajak: 10000,
        totalPesanan: 110000,
        status: 'pending',
        catatan: 'Kirim sebelum jam 5 sore',
        createdAt: new Date('2024-12-28T10:00:00Z'),
        updatedAt: new Date('2024-12-28T10:00:00Z'),
      },
      {
        id: generateUUID(),
        nomorPesanan: 'ORD-002',
        tanggal: new Date('2024-12-27T10:00:00Z'),
        namaPelanggan: 'Jane Smith',
        emailPelanggan: 'jane@example.com',
        teleponPelanggan: '081234567891',
        alamatPelanggan: 'Jl. Sudirman No. 456, Jakarta',
        items: [{ id: 1, nama: 'Roti Tawar', quantity: 5, hargaSatuan: 15000, totalHarga: 75000 }],
        subtotal: 75000,
        pajak: 7500,
        totalPesanan: 82500,
        status: 'confirmed',
        createdAt: new Date('2024-12-27T10:00:00Z'),
        updatedAt: new Date('2024-12-27T10:00:00Z'),
      },
    ])
  );
  const [assets, setAssets] = useState<Asset[]>(() =>
    loadFromStorage(STORAGE_KEYS.ASSETS, [])
  );
  const [financialTransactions, setFinancialTransactions] = useState<FinancialTransaction[]>(() =>
    loadFromStorage(STORAGE_KEYS.FINANCIAL_TRANSACTIONS, [])
  );
  const [cloudSyncEnabled, setCloudSyncEnabled] = useState<boolean>(() =>
    loadFromStorage(STORAGE_KEYS.CLOUD_SYNC, false)
  );

  // useEffect untuk memuat data dari cloud saat pertama kali atau saat cloudSyncEnabled berubah
  useEffect(() => {
    const checkAndLoadFromCloud = async () => {
      if (cloudSyncEnabled) {
        console.log('Cloud sync enabled, attempting to load from cloud...');
        const loadedData = await externalLoadFromCloud();
        // replaceAllData akan dipanggil di dalam externalLoadFromCloud jika sukses
      }
    };

    const timer = setTimeout(checkAndLoadFromCloud, 1000);
    return () => clearTimeout(timer);
  }, [cloudSyncEnabled, externalLoadFromCloud]); // Hapus dependensi array data, agar tidak memicu berulang

  // --- Save to Local Storage ---
  // Ini akan menyimpan data lokal setiap kali state berubah
  useEffect(() => { saveToStorage(STORAGE_KEYS.BAHAN_BAKU, bahanBaku); }, [bahanBaku]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.SUPPLIERS, suppliers); }, [suppliers]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.PURCHASES, purchases); }, [purchases]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.RECIPES, recipes); }, [recipes]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.HPP_RESULTS, hppResults); }, [hppResults]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.ACTIVITIES, activities); }, [activities]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.ORDERS, orders); }, [orders]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.ASSETS, assets); }, [assets]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.FINANCIAL_TRANSACTIONS, financialTransactions); }, [financialTransactions]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.CLOUD_SYNC, cloudSyncEnabled); }, [cloudSyncEnabled]);

  // Realtime Subscriptions
  // Perhatikan: realtime subscription dan loadFromCloud di useEffect useSupabaseSync
  // sudah menangani pembaruan data. AppDataContext ini cukup bergantung pada
  // perubahan state yang dipicu oleh fungsi CRUD atau replaceAllData.
  // useEffect ini di AppDataContext mungkin tidak lagi diperlukan jika useSupabaseSync sudah mengelola realtime secara global.
  // Namun, jika Anda ingin AppDataContext juga memicu update berdasarkan visibility atau auth, biarkan ini.
  // Untuk kesederhanaan dan menghindari potensi duplikasi, saya akan menghapus realtime logic di sini
  // dan mengandalkan `useSupabaseSync` sebagai single source of truth untuk realtime updates.

  // Jika Anda tetap ingin logic visibility change di sini (selain di useSupabaseSync)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Tab aplikasi terlihat, memeriksa pembaruan...');
        externalLoadFromCloud().then(loadedData => {
          // replaceAllData akan dipanggil di dalam externalLoadFromCloud jika sukses
        });
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [externalLoadFromCloud]);


  // Fungsi sinkronisasi utama
  const syncToCloud = async (): Promise<boolean> => {
    if (!cloudSyncEnabled) {
      toast.info('Sinkronisasi cloud dinonaktifkan.');
      return false;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Gagal sinkronisasi: Pengguna tidak terautentikasi.');
        return false;
      }

      const userId = session.user.id;

      const transformedPayload = {
        bahanBaku: bahanBaku.map(item => ({
          id: item.id,
          nama: item.nama,
          kategori: item.kategori,
          stok: item.stok,
          satuan: item.satuan,
          minimum: item.minimum,
          harga_satuan: item.hargaSatuan, // Konversi camelCase ke snake_case
          supplier: item.supplier,
          tanggal_kadaluwarsa: toSafeISOString(item.tanggalKadaluwarsa), // Gunakan helper
          user_id: userId,
          created_at: toSafeISOString(item.createdAt || new Date()),
          updated_at: toSafeISOString(item.updatedAt || new Date()),
          jumlah_beli_kemasan: item.jumlahBeliKemasan ?? null,
          satuan_kemasan: item.satuanKemasan ?? null,
          harga_total_beli_kemasan: item.hargaTotalBeliKemasan ?? null,
        })),
        suppliers: suppliers.map(item => ({
          id: item.id,
          nama: item.nama,
          kontak: item.kontak,
          email: item.email,
          telepon: item.telepon,
          alamat: item.alamat,
          catatan: item.catatan ?? null,
          user_id: userId,
          created_at: toSafeISOString(item.createdAt || new Date()),
          updated_at: toSafeISOString(item.updatedAt || new Date()),
        })),
        purchases: purchases.map(item => ({
          id: item.id,
          tanggal: toSafeISOString(item.tanggal || new Date()),
          supplier: item.supplier,
          items: item.items,
          total_nilai: item.totalNilai,
          metode_perhitungan: item.metodePerhitungan,
          catatan: item.catatan ?? null,
          user_id: userId,
          created_at: toSafeISOString(item.createdAt || new Date()),
          updated_at: toSafeISOString(item.updatedAt || new Date()),
        })),
        recipes: recipes.map(item => ({
          id: item.id,
          nama_resep: item.namaResep,
          deskripsi: item.deskripsi ?? null,
          porsi: item.porsi,
          ingredients: item.ingredients,
          biaya_tenaga_kerja: item.biayaTenagaKerja,
          biaya_overhead: item.biayaOverhead,
          total_hpp: item.totalHPP,
          hpp_per_porsi: item.hppPerPorsi,
          margin_keuntungan: item.marginKeuntungan,
          harga_jual_per_porsi: item.hargaJualPerPorsi,
          category: item.category,
          user_id: userId,
          created_at: toSafeISOString(item.createdAt || new Date()),
          updated_at: toSafeISOString(item.updatedAt || new Date()),
        })),
        hppResults: hppResults.map(item => ({
          id: item.id,
          nama: item.nama,
          ingredients: item.ingredients,
          biaya_tenaga_kerja: item.biayaTenagaKerja,
          biaya_overhead: item.biayaOverhead,
          margin_keuntungan: item.marginKeuntungan,
          total_hpp: item.totalHPP,
          hpp_per_porsi: item.hppPerPorsi,
          harga_jual_per_porsi: item.hargaJualPerPorsi,
          jumlah_porsi: item.jumlahPorsi,
          user_id: userId,
          created_at: toSafeISOString(item.timestamp || new Date()), // Menggunakan timestamp dari frontend untuk created_at
          updated_at: toSafeISOString(item.updatedAt || new Date()),
        })),
        activities: activities.map(item => ({
          id: item.id,
          title: item.title,
          description: item.description,
          type: item.type,
          value: item.value ?? null,
          user_id: userId,
          created_at: toSafeISOString(item.timestamp || new Date()), // Menggunakan timestamp dari frontend untuk created_at
          updated_at: toSafeISOString(item.updatedAt || new Date()),
        })),
        orders: orders.map(item => ({
          id: item.id,
          nomor_pesanan: item.nomorPesanan,
          tanggal: toSafeISOString(item.tanggal || new Date()),
          nama_pelanggan: item.namaPelanggan,
          email_pelanggan: item.emailPelanggan,
          telepon_pelanggan: item.teleponPelanggan,
          alamat_pengiriman: item.alamatPelanggan,
          items: item.items,
          subtotal: item.subtotal,
          pajak: item.pajak,
          total_pesanan: item.totalPesanan,
          status: item.status,
          catatan: item.catatan ?? null,
          user_id: userId,
          created_at: toSafeISOString(item.createdAt || new Date()),
          updated_at: toSafeISOString(item.updatedAt || new Date()),
        })),
        assets: assets.map(item => ({
          id: item.id,
          nama: item.nama,
          jenis: item.jenis ?? null,
          nilai_awal: item.nilai,
          umur_manfaat: item.umurManfaat,
          tanggal_pembelian: toSafeISOString(item.tanggalPembelian || new Date()),
          penyusutan_per_bulan: item.penyusutanPerBulan,
          nilai_sekarang: item.nilaiSaatIni,
          user_id: userId,
          created_at: toSafeISOString(item.createdAt || new Date()),
          updated_at: toSafeISOString(item.updatedAt || new Date()),
          kategori: item.kategori ?? null,
          kondisi: item.kondisi ?? null,
          lokasi: item.lokasi ?? null,
          deskripsi: item.deskripsi ?? null,
          depresiasi: item.depresiasi ?? null,
        })),
        financialTransactions: financialTransactions.map(item => ({
          id: item.id,
          user_id: userId,
          type: item.type,
          category: item.category,
          amount: item.amount,
          description: item.description,
          date: toSafeISOString(item.date || new Date()),
          created_at: toSafeISOString(item.created_at || new Date()),
          updated_at: toSafeISOString(item.updated_at || new Date()),
        })),
      };

      const success = await externalSyncToCloud(transformedPayload);
      // loadFromCloud akan dipanggil di sini jika sync sukses untuk memastikan konsistensi
      if (success) {
        await externalLoadFromCloud(); // Memuat ulang data setelah sync berhasil
      }
      return success;
    } catch (error: any) {
      console.error('Sync to cloud failed:', error);
      toast.error(`Gagal sinkronisasi ke cloud: ${error.message}`);
      return false;
    }
  };

  const loadFromCloud = async (): Promise<void> => {
    if (!cloudSyncEnabled) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const loadedData = await externalLoadFromCloud(); // externalLoadFromCloud sudah mengembalikan LoadedData
      if (loadedData) {
        replaceAllData(loadedData);
        // toast.success('Data berhasil dimuat dari cloud!'); // Toast ini sudah ada di externalLoadFromCloud
      } else {
        toast.info('Tidak ada data baru yang dimuat dari cloud.');
      }
    } catch (error) {
      console.error('Load from cloud failed:', error);
      toast.error(`Gagal memuat dari cloud: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // replaceAllData kini hanya mengatur state, karena data sudah diproses di useSupabaseSync
  const replaceAllData = (data: any) => {
    if (data.bahanBaku) setBahanBaku(data.bahanBaku);
    if (data.suppliers) setSuppliers(data.suppliers);
    if (data.purchases) setPurchases(data.purchases);
    if (data.recipes) setRecipes(data.recipes);
    if (data.hppResults) setHppResults(data.hppResults);
    if (data.activities) setActivities(data.activities);
    if (data.orders) setOrders(data.orders);
    if (data.assets) setAssets(data.assets);
    if (data.financialTransactions) setFinancialTransactions(data.financialTransactions);
    if (data.userSettings) {
      // Ini mungkin perlu penanganan khusus jika userSettings disimpan sebagai state di AppDataContext
      // Jika user_settings ditangani oleh useUserSettings hook, maka tidak perlu di-set di sini
      console.log("User settings loaded, assuming handled by useUserSettings hook directly.");
    }
    toast.info('Data lokal diperbarui dengan data cloud.');
  };

  // =============================================================
  // CRUD FUNCTIONS (memanggil DB API)
  // Catatan: Panggilan `syncToCloud()` telah dihapus dari fungsi-fungsi CRUD ini.
  // Ini karena `useSupabaseSync` memiliki realtime subscription yang akan memicu `loadFromCloud`
  // dan memperbarui state lokal secara otomatis setelah perubahan DB.
  // Jika realtime subscription tidak digunakan, `syncToCloud()` perlu dipanggil setelah setiap operasi.
  // =============================================================

  const addBahanBaku = async (bahan: Omit<BahanBaku, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    const session = (await supabase.auth.getSession()).data.session;
    const newBahan: BahanBaku = {
      ...bahan,
      id: generateUUID(),
      userId: session?.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const bahanToInsert = {
      id: newBahan.id,
      nama: newBahan.nama,
      kategori: newBahan.kategori,
      stok: newBahan.stok,
      satuan: newBahan.satuan,
      harga_satuan: newBahan.hargaSatuan, // Convert to snake_case
      minimum: newBahan.minimum,
      supplier: newBahan.supplier,
      tanggal_kadaluwarsa: toSafeISOString(newBahan.tanggalKadaluwarsa), // Gunakan helper
      user_id: newBahan.userId,
      created_at: toSafeISOString(newBahan.createdAt),
      updated_at: toSafeISOString(newBahan.updatedAt),
      jumlah_beli_kemasan: newBahan.jumlahBeliKemasan ?? null,
      satuan_kemasan: newBahan.satuanKemasan ?? null,
      harga_total_beli_kemasan: newBahan.hargaTotalBeliKemasan ?? null,
    };

    const { error } = await supabase.from('bahan_baku').insert([bahanToInsert]);

    if (error) {
      console.error('Error adding bahan baku to DB:', error);
      toast.error(`Gagal menambahkan bahan baku: ${error.message}`);
      return false;
    }

    // setBahanBaku(prev => [...prev, newBahan]); // Ini akan di-handle oleh realtime subscription
    addActivity({
      title: 'Bahan Baku Ditambahkan',
      description: `${bahan.nama} telah ditambahkan ke gudang`,
      type: 'stok',
    });
    toast.success(`${bahan.nama} berhasil ditambahkan!`);
    return true;
  };

  const updateBahanBaku = async (id: string, updatedBahan: Partial<BahanBaku>) => {
    console.log('=== DEBUG: Starting updateBahanBaku ===');
    console.log('Received updatedBahan:', JSON.stringify(updatedBahan, null, 2));

    const bahanToUpdate: Partial<any> = {
      updated_at: toSafeISOString(new Date()),
    };

    if (updatedBahan.nama !== undefined) bahanToUpdate.nama = updatedBahan.nama;
    if (updatedBahan.kategori !== undefined) bahanToUpdate.kategori = updatedBahan.kategori;
    if (updatedBahan.stok !== undefined) bahanToUpdate.stok = updatedBahan.stok;
    if (updatedBahan.satuan !== undefined) bahanToUpdate.satuan = updatedBahan.satuan;
    if (updatedBahan.minimum !== undefined) bahanToUpdate.minimum = updatedBahan.minimum;
    if (updatedBahan.supplier !== undefined) bahanToUpdate.supplier = updatedBahan.supplier;
    if (updatedBahan.hargaSatuan !== undefined) bahanToUpdate.harga_satuan = updatedBahan.hargaSatuan;
    if (updatedBahan.tanggalKadaluwarsa !== undefined) {
      bahanToUpdate.tanggal_kadaluwarsa = toSafeISOString(updatedBahan.tanggalKadaluwarsa);
    }

    bahanToUpdate.jumlah_beli_kemasan = updatedBahan.jumlahBeliKemasan ?? null;
    bahanToUpdate.satuan_kemasan = updatedBahan.satuanKemasan ?? null;
    bahanToUpdate.harga_total_beli_kemasan = updatedBahan.hargaTotalBeliKemasan ?? null;

    console.log('Prepared bahanToUpdate:', JSON.stringify(bahanToUpdate, null, 2));

    const { error } = await supabase.from('bahan_baku').update(bahanToUpdate).eq('id', id);
    console.log('Supabase update error:', JSON.stringify({ error }, null, 2));


    if (error) {
      console.error('Error updating bahan baku in DB:', error);
      toast.error(`Gagal memperbarui bahan baku: ${error.message}`);
      return false;
    }

    // setBahanBaku(prev => ...); // Ini akan di-handle oleh realtime subscription
    console.log('=== DEBUG: updateBahanBaku completed ===');
    toast.success(`Bahan baku berhasil diperbarui!`);
    return true;
  };

  const deleteBahanBaku = async (id: string) => {
    const bahan = bahanBaku.find(b => b.id === id);

    const { error } = await supabase.from('bahan_baku').delete().eq('id', id);

    if (error) {
      console.error('Error deleting bahan baku from DB:', error);
      toast.error(`Gagal menghapus bahan baku: ${error.message}`);
      return false;
    }

    // setBahanBaku(prev => prev.filter(b => b.id !== id)); // Ini akan di-handle oleh realtime subscription
    if (bahan) {
      addActivity({
        title: 'Bahan Baku Dihapus',
        description: `${bahan.nama} telah dihapus dari gudang`,
        type: 'stok',
      });
      toast.success(`${bahan.nama} berhasil dihapus!`);
    }
    return true;
  };

  const getBahanBakuByName = (nama: string): BahanBaku | undefined => {
    return bahanBaku.find(bahan => bahan.nama.toLowerCase() === nama.toLowerCase());
  };

  const reduceStok = async (nama: string, jumlah: number): Promise<boolean> => {
    const bahan = getBahanBakuByName(nama);
    if (!bahan) {
      toast.error(`Bahan baku ${nama} tidak ditemukan.`);
      return false;
    }
    if (bahan.stok < jumlah) {
      toast.error(`Stok ${nama} (${bahan.stok}) tidak cukup untuk mengurangi ${jumlah}.`);
      return false;
    }

    const success = await updateBahanBaku(bahan.id, { stok: bahan.stok - jumlah });
    if (success) {
      addActivity({
        title: 'Stok Berkurang',
        description: `${nama} berkurang ${jumlah} ${bahan.satuan}`,
        type: 'stok',
      });
    }
    return success;
  };

  const addSupplier = async (supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    const session = (await supabase.auth.getSession()).data.session;
    const newSupplier: Supplier = {
      ...supplier,
      id: generateUUID(),
      userId: session?.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const supplierToInsert = {
      id: newSupplier.id,
      nama: newSupplier.nama,
      kontak: newSupplier.kontak,
      email: newSupplier.email,
      telepon: newSupplier.telepon,
      alamat: newSupplier.alamat,
      catatan: newSupplier.catatan ?? null,
      user_id: newSupplier.userId,
      created_at: toSafeISOString(newSupplier.createdAt),
      updated_at: toSafeISOString(newSupplier.updatedAt),
    };

    const { error } = await supabase.from('suppliers').insert([supplierToInsert]);
    if (error) {
      console.error('Error adding supplier to DB:', error);
      toast.error(`Gagal menambahkan supplier: ${error.message}`);
      return false;
    }

    // setSuppliers(prev => [...prev, newSupplier]); // Ini akan di-handle oleh realtime subscription
    addActivity({
      title: 'Supplier Ditambahkan',
      description: `${supplier.nama} telah ditambahkan`,
      type: 'supplier',
    });
    toast.success(`${supplier.nama} berhasil ditambahkan!`);
    return true;
  };

  const updateSupplier = async (id: string, updatedSupplier: Partial<Supplier>) => {
    const supplierToUpdate: Partial<any> = {
      updated_at: toSafeISOString(new Date()),
    };
    if (updatedSupplier.nama !== undefined) supplierToUpdate.nama = updatedSupplier.nama;
    if (updatedSupplier.kontak !== undefined) supplierToUpdate.kontak = updatedSupplier.kontak;
    if (updatedSupplier.email !== undefined) supplierToUpdate.email = updatedSupplier.email;
    if (updatedSupplier.telepon !== undefined) supplierToUpdate.telepon = updatedSupplier.telepon;
    if (updatedSupplier.alamat !== undefined) supplierToUpdate.alamat = updatedSupplier.alamat;
    if (updatedSupplier.catatan !== undefined) supplierToUpdate.catatan = updatedSupplier.catatan ?? null;

    const { error } = await supabase.from('suppliers').update(supplierToUpdate).eq('id', id);
    if (error) {
      console.error('Error updating supplier in DB:', error);
      toast.error(`Gagal memperbarui supplier: ${error.message}`);
      return false;
    }

    // setSuppliers(prev => ...); // Ini akan di-handle oleh realtime subscription
    toast.success(`Supplier berhasil diperbarui!`);
    return true;
  };

  const deleteSupplier = async (id: string) => {
    const supplier = suppliers.find(s => s.id === id);

    const { error } = await supabase.from('suppliers').delete().eq('id', id);
    if (error) {
      console.error('Error deleting supplier from DB:', error);
      toast.error(`Gagal menghapus supplier: ${error.message}`);
      return false;
    }

    // setSuppliers(prev => prev.filter(s => s.id !== id)); // Ini akan di-handle oleh realtime subscription
    if (supplier) {
      addActivity({
        title: 'Supplier Dihapus',
        description: `${supplier.nama} telah dihapus`,
        type: 'supplier',
      });
      toast.success(`Supplier berhasil dihapus!`);
    }
    return true;
  };

  const addPurchase = async (purchase: Omit<Purchase, 'id' | 'createdAt' | 'updatedAt'>) => {
    const session = (await supabase.auth.getSession()).data.session;
    const newPurchase: Purchase = {
      ...purchase,
      id: generateUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const purchaseToInsert = {
      id: newPurchase.id,
      tanggal: toSafeISOString(newPurchase.tanggal || new Date()),
      supplier: newPurchase.supplier,
      items: newPurchase.items,
      total_nilai: newPurchase.totalNilai,
      metode_perhitungan: newPurchase.metodePerhitungan,
      catatan: newPurchase.catatan ?? null,
      user_id: session?.user.id,
      created_at: toSafeISOString(newPurchase.createdAt),
      updated_at: toSafeISOString(newPurchase.updatedAt),
    };

    const { error } = await supabase.from('purchases').insert([purchaseToInsert]);
    if (error) {
      console.error('Error adding purchase to DB:', error);
      toast.error(`Gagal menambahkan pembelian: ${error.message}`);
      return false;
    }

    // setPurchases(prev => [...prev, newPurchase]); // Ini akan di-handle oleh realtime subscription

    // Logika update/add bahan baku setelah pembelian
    // Ini harus berjalan setelah purchase berhasil disimpan ke DB agar data konsisten
    await Promise.all(purchase.items.map(async item => {
      const existingBahan = getBahanBakuByName(item.namaBarang);
      if (existingBahan) {
        // Hati-hati: updateBahanBaku akan memicu update DB lagi.
        // Jika Anda ingin update stok tanpa memicu realtime atau toast lain,
        // pertimbangkan fungsi internal tanpa side effect toast/activity.
        // Untuk saat ini, kita biarkan saja karena updateBahanBaku sudah aman.
        await updateBahanBaku(existingBahan.id, {
          stok: existingBahan.stok + item.jumlah,
          hargaSatuan: item.hargaSatuan,
        });
      } else {
        await addBahanBaku({
          nama: item.namaBarang,
          kategori: item.kategori,
          stok: item.jumlah,
          satuan: item.satuan,
          minimum: 10,
          hargaSatuan: item.hargaSatuan,
          supplier: purchase.supplier,
        });
      }
    }));


    addActivity({
      title: 'Pembelian Ditambahkan',
      description: `Pembelian dari ${purchase.supplier} senilai Rp ${purchase.totalNilai.toLocaleString('id-ID')}`,
      type: 'purchase',
    });
    toast.success(`Pembelian berhasil ditambahkan!`);
    return true;
  };

  const updatePurchase = async (id: string, updatedPurchase: Partial<Purchase>) => {
    const purchaseToUpdate: Partial<any> = {
      updated_at: toSafeISOString(new Date()),
    };
    if (updatedPurchase.tanggal !== undefined) purchaseToUpdate.tanggal = toSafeISOString(updatedPurchase.tanggal);
    if (updatedPurchase.supplier !== undefined) purchaseToUpdate.supplier = updatedPurchase.supplier;
    if (updatedPurchase.items !== undefined) purchaseToUpdate.items = updatedPurchase.items;
    if (updatedPurchase.totalNilai !== undefined) purchaseToUpdate.total_nilai = updatedPurchase.totalNilai;
    if (updatedPurchase.metodePerhitungan !== undefined) purchaseToUpdate.metode_perhitungan = updatedPurchase.metodePerhitungan;
    if (updatedPurchase.catatan !== undefined) purchaseToUpdate.catatan = updatedPurchase.catatan ?? null;

    const { error } = await supabase.from('purchases').update(purchaseToUpdate).eq('id', id);
    if (error) {
      console.error('Error updating purchase in DB:', error);
      toast.error(`Gagal memperbarui pembelian: ${error.message}`);
      return false;
    }

    // setPurchases(prev => ...); // Ini akan di-handle oleh realtime subscription
    toast.success(`Pembelian berhasil diperbarui!`);
    return true;
  };

  const deletePurchase = async (id: string) => {
    const { error } = await supabase.from('purchases').delete().eq('id', id);
    if (error) {
      console.error('Error deleting purchase from DB:', error);
      toast.error(`Gagal menghapus pembelian: ${error.message}`);
      return false;
    }

    // setPurchases(prev => prev.filter(p => p.id !== id)); // Ini akan di-handle oleh realtime subscription
    toast.success(`Pembelian berhasil dihapus!`);
    return true;
  };

  const addRecipe = async (recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>) => {
    const session = (await supabase.auth.getSession()).data.session;
    const newRecipe: Recipe = {
      ...recipe,
      id: generateUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const recipeToInsert = {
      id: newRecipe.id,
      nama_resep: newRecipe.namaResep,
      deskripsi: newRecipe.deskripsi ?? null,
      porsi: newRecipe.porsi,
      ingredients: newRecipe.ingredients,
      biaya_tenaga_kerja: newRecipe.biayaTenagaKerja,
      biaya_overhead: newRecipe.biayaOverhead,
      total_hpp: newRecipe.totalHPP,
      hpp_per_porsi: newRecipe.hppPerPorsi,
      margin_keuntungan: newRecipe.marginKeuntungan,
      harga_jual_per_porsi: newRecipe.hargaJualPerPorsi,
      category: newRecipe.category,
      user_id: session?.user.id,
      created_at: toSafeISOString(newRecipe.createdAt),
      updated_at: toSafeISOString(newRecipe.updatedAt),
    };

    const { error } = await supabase.from('hpp_recipes').insert([recipeToInsert]);
    if (error) {
      console.error('Error adding recipe to DB:', error);
      toast.error(`Gagal menambahkan resep: ${error.message}`);
      return false;
    }

    // setRecipes(prev => [...prev, newRecipe]); // Ini akan di-handle oleh realtime subscription
    addActivity({
      title: 'Resep Ditambahkan',
      description: `Resep ${recipe.namaResep} telah disimpan`,
      type: 'resep',
    });
    toast.success(`Resep ${recipe.namaResep} berhasil ditambahkan!`);
    return true;
  };

  const updateRecipe = async (id: string, updatedRecipe: Partial<Recipe>) => {
    const recipeToUpdate: Partial<any> = {
      updated_at: toSafeISOString(new Date()),
    };
    if (updatedRecipe.namaResep !== undefined) recipeToUpdate.nama_resep = updatedRecipe.namaResep;
    if (updatedRecipe.deskripsi !== undefined) recipeToUpdate.deskripsi = updatedRecipe.deskripsi ?? null;
    if (updatedRecipe.porsi !== undefined) recipeToUpdate.porsi = updatedRecipe.porsi;
    if (updatedRecipe.ingredients !== undefined) recipeToUpdate.ingredients = updatedRecipe.ingredients;
    if (updatedRecipe.biayaTenagaKerja !== undefined) recipeToUpdate.biaya_tenaga_kerja = updatedRecipe.biayaTenagaKerja;
    if (updatedRecipe.biayaOverhead !== undefined) recipeToUpdate.biaya_overhead = updatedRecipe.biayaOverhead;
    if (updatedRecipe.totalHPP !== undefined) recipeToUpdate.total_hpp = updatedRecipe.totalHPP;
    if (updatedRecipe.hppPerPorsi !== undefined) recipeToUpdate.hpp_per_porsi = updatedRecipe.hppPerPorsi;
    if (updatedRecipe.marginKeuntungan !== undefined) recipeToUpdate.margin_keuntungan = updatedRecipe.marginKeuntungan;
    if (updatedRecipe.hargaJualPerPorsi !== undefined) recipeToUpdate.harga_jual_per_porsi = updatedRecipe.hargaJualPerPorsi;
    if (updatedRecipe.category !== undefined) recipeToUpdate.category = updatedRecipe.category;

    const { error } = await supabase.from('hpp_recipes').update(recipeToUpdate).eq('id', id);
    if (error) {
      console.error('Error updating recipe in DB:', error);
      toast.error(`Gagal memperbarui resep: ${error.message}`);
      return false;
    }

    // setRecipes(prev => ...); // Ini akan di-handle oleh realtime subscription
    toast.success(`Resep berhasil diperbarui!`);
    return true;
  };

  const deleteRecipe = async (id: string) => {
    const recipe = recipes.find(r => r.id === id);

    const { error } = await supabase.from('hpp_recipes').delete().eq('id', id);
    if (error) {
      console.error('Error deleting recipe from DB:', error);
      toast.error(`Gagal menghapus resep: ${error.message}`);
      return false;
    }

    // setRecipes(prev => prev.filter(r => r.id !== id)); // Ini akan di-handle oleh realtime subscription
    if (recipe) {
      addActivity({
        title: 'Resep Dihapus',
        description: `Resep ${recipe.namaResep} telah dihapus`,
        type: 'resep',
      });
      toast.success(`Resep ${recipe.namaResep} berhasil dihapus!`);
    }
    return true;
  };

  const addHPPResult = async (result: Omit<HPPResult, 'id' | 'createdAt' | 'updatedAt'>) => {
    const session = (await supabase.auth.getSession()).data.session;
    const newResult: HPPResult = {
      ...result,
      id: generateUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const resultToInsert = {
      id: newResult.id,
      nama: newResult.nama,
      ingredients: newResult.ingredients,
      biaya_tenaga_kerja: newResult.biayaTenagaKerja,
      biaya_overhead: newResult.biayaOverhead,
      margin_keuntungan: newResult.marginKeuntungan,
      total_hpp: newResult.totalHPP,
      hpp_per_porsi: newResult.hppPerPorsi,
      harga_jual_per_porsi: newResult.hargaJualPerPorsi,
      jumlah_porsi: newResult.jumlahPorsi,
      user_id: session?.user.id,
      created_at: toSafeISOString(newResult.createdAt),
      updated_at: toSafeISOString(newResult.updatedAt),
    };

    const { error } = await supabase.from('hpp_results').insert([resultToInsert]);
    if (error) {
      console.error('Error adding HPP result to DB:', error);
      toast.error(`Gagal menambahkan hasil HPP: ${error.message}`);
      return false;
    }

    // setHppResults(prev => [...prev, newResult]); // Ini akan di-handle oleh realtime subscription
    addActivity({
      title: 'HPP Dihitung',
      description: `HPP ${result.nama} = Rp ${result.hppPerPorsi.toLocaleString('id-ID')}/porsi`,
      type: 'hpp',
      value: `HPP: Rp ${result.hppPerPorsi.toLocaleString('id-ID')}`,
    });
    toast.success(`Hasil HPP ${result.nama} berhasil disimpan!`);
    return true;
  };

  const addHPPCalculation = async (result: Omit<HPPResult, 'id' | 'createdAt' | 'updatedAt'>) => {
    await addHPPResult(result);
  };

  const addOrder = async (order: Omit<NewOrder, 'id' | 'tanggal' | 'createdAt' | 'updatedAt' | 'nomorPesanan' | 'status'>) => {
    const session = (await supabase.auth.getSession()).data.session;
    const newOrder: Order = {
      ...order,
      id: generateUUID(),
      tanggal: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      nomorPesanan: `ORD-${String(Math.max(0, ...orders.map(o => parseInt(o.nomorPesanan.replace('ORD-', '')) || 0)) + 1).padStart(3, '0')}`,
      status: 'pending',
    };

    const orderToInsert = {
      id: newOrder.id,
      nomor_pesanan: newOrder.nomorPesanan,
      tanggal: toSafeISOString(newOrder.tanggal),
      nama_pelanggan: newOrder.namaPelanggan,
      email_pelanggan: newOrder.emailPelanggan,
      telepon_pelanggan: newOrder.teleponPelanggan,
      alamat_pengiriman: newOrder.alamatPelanggan,
      items: newOrder.items,
      subtotal: newOrder.subtotal,
      pajak: newOrder.pajak,
      total_pesanan: newOrder.totalPesanan,
      status: newOrder.status,
      catatan: newOrder.catatan ?? null,
      user_id: session?.user.id,
      created_at: toSafeISOString(newOrder.createdAt),
      updated_at: toSafeISOString(newOrder.updatedAt),
    };

    const { error } = await supabase.from('orders').insert([orderToInsert]);
    if (error) {
      console.error('Error adding order to DB:', error);
      toast.error(`Gagal menambahkan pesanan: ${error.message}`);
      return false;
    }

    // setOrders(prev => [...prev, newOrder]); // Ini akan di-handle oleh realtime subscription
    addActivity({
      title: 'Pesanan Baru',
      description: `Pesanan ${newOrder.nomorPesanan} dari ${newOrder.namaPelanggan}`,
      type: 'purchase',
    });
    toast.success(`Pesanan ${newOrder.nomorPesanan} berhasil ditambahkan!`);
    return true;
  };

  const updateOrder = async (id: string, updatedOrder: Partial<Order>): Promise<boolean> => {
    const orderToUpdate: Partial<any> = {
      updated_at: toSafeISOString(new Date()),
    };
    if (updatedOrder.nomorPesanan !== undefined) orderToUpdate.nomor_pesanan = updatedOrder.nomorPesanan;
    if (updatedOrder.tanggal !== undefined) orderToUpdate.tanggal = toSafeISOString(updatedOrder.tanggal);
    if (updatedOrder.namaPelanggan !== undefined) orderToUpdate.nama_pelanggan = updatedOrder.namaPelanggan;
    if (updatedOrder.emailPelanggan !== undefined) orderToUpdate.email_pelanggan = updatedOrder.emailPelanggan;
    if (updatedOrder.teleponPelanggan !== undefined) orderToUpdate.telepon_pelanggan = updatedOrder.teleponPelanggan;
    if (updatedOrder.alamatPelanggan !== undefined) orderToUpdate.alamat_pengiriman = updatedOrder.alamatPelanggan;
    if (updatedOrder.items !== undefined) orderToUpdate.items = updatedOrder.items;
    if (updatedOrder.subtotal !== undefined) orderToUpdate.subtotal = updatedOrder.subtotal;
    if (updatedOrder.pajak !== undefined) orderToUpdate.pajak = updatedOrder.pajak;
    if (updatedOrder.totalPesanan !== undefined) orderToUpdate.total_pesanan = updatedOrder.totalPesanan;
    if (updatedOrder.status !== undefined) orderToUpdate.status = updatedOrder.status;
    if (updatedOrder.catatan !== undefined) orderToUpdate.catatan = updatedOrder.catatan ?? null;

    const { error } = await supabase.from('orders').update(orderToUpdate).eq('id', id);
    if (error) {
      console.error('Error updating order in DB:', error);
      toast.error(`Gagal memperbarui pesanan: ${error.message}`);
      return false;
    }

    // setOrders(prev => ...); // Ini akan di-handle oleh realtime subscription

    if (updatedOrder.status) {
      const order = orders.find(o => o.id === id);
      if (order && order.status !== updatedOrder.status) {
        addActivity({
          title: 'Status Pesanan Diubah',
          description: `Pesanan ${order.nomorPesanan} diubah ke ${updatedOrder.status}`,
          type: 'purchase',
        });
      }
    }
    toast.success(`Pesanan berhasil diperbarui!`);
    return true;
  };

  const deleteOrder = async (id: string): Promise<boolean> => {
    const order = orders.find(o => o.id === id);

    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (error) {
      console.error('Error deleting order from DB:', error);
      toast.error(`Gagal menghapus pesanan: ${error.message}`);
      return false;
    }

    // setOrders(prev => prev.filter(o => o.id !== id)); // Ini akan di-handle oleh realtime subscription
    if (order) {
      addActivity({
        title: 'Pesanan Dihapus',
        description: `Pesanan ${order.nomorPesanan} telah dihapus`,
        type: 'purchase',
      });
      toast.success(`Pesanan ${order.nomorPesanan} berhasil dihapus!`);
    }
    return true;
  };

  const updateOrderStatus = async (id: string, status: Order['status']) => {
    await updateOrder(id, { status });
  };

  const addActivity = async (activity: Omit<Activity, 'id' | 'timestamp' | 'createdAt' | 'updatedAt'>) => {
    const session = (await supabase.auth.getSession()).data.session;
    const newActivity: Activity = {
      ...activity,
      id: generateUUID(),
      timestamp: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const activityToInsert = {
      id: newActivity.id,
      title: newActivity.title,
      description: newActivity.description,
      type: newActivity.type,
      value: newActivity.value ?? null,
      user_id: session?.user.id,
      created_at: toSafeISOString(newActivity.createdAt),
      updated_at: toSafeISOString(newActivity.updatedAt),
    };

    const { error } = await supabase.from('activities').insert([activityToInsert]);
    if (error) {
      console.error('Error adding activity to DB:', error);
      toast.error(`Gagal menambahkan aktivitas: ${error.message}`);
      return;
    }

    // Batasi jumlah aktivitas yang disimpan secara lokal
    // setActivities(prev => [newActivity, ...prev].slice(0, 50)); // Ini akan di-handle oleh realtime subscription
    toast.success(`Aktivitas berhasil ditambahkan!`);
  };

  const getStatistics = () => {
    const stokMenipis = bahanBaku.filter(bahan => bahan.stok <= bahan.minimum).length;
    const averageHPP = hppResults.length > 0
      ? hppResults.reduce((sum, result) => sum + result.hppPerPorsi, 0) / hppResults.length
      : 0;

    return {
      totalBahanBaku: bahanBaku.length,
      stokMenipis,
      totalSuppliers: suppliers.length,
      totalPurchases: purchases.length,
      totalRecipes: recipes.length,
      averageHPP,
    };
  };

  const getDashboardStats = () => {
    const stokMenipis = bahanBaku.filter(bahan => bahan.stok <= bahan.minimum).length;
    const averageHPP = hppResults.length > 0
      ? hppResults.reduce((sum, result) => sum + result.hppPerPorsi, 0) / hppResults.length
      : 0;

    return {
      totalProduk: recipes.length,
      stokBahanBaku: bahanBaku.length,
      hppRataRata: averageHPP > 0 ? `Rp ${averageHPP.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : 'Rp 0',
      stokMenurut: stokMenipis,
    };
  };

  const addAsset = async (asset: Omit<Asset, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'penyusutanPerBulan' | 'nilaiSaatIni'>) => {
    const session = (await supabase.auth.getSession()).data.session;
    const newAsset: Asset = {
      ...asset,
      id: generateUUID(),
      userId: session?.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      penyusutanPerBulan: asset.nilai / (asset.umurManfaat * 12),
      nilaiSaatIni: asset.nilai,
    };

    const assetToInsert = {
      id: newAsset.id,
      nama: newAsset.nama,
      jenis: newAsset.jenis ?? null,
      nilai_awal: newAsset.nilai,
      umur_manfaat: newAsset.umurManfaat,
      tanggal_pembelian: toSafeISOString(newAsset.tanggalPembelian),
      penyusutan_per_bulan: newAsset.penyusutanPerBulan,
      nilai_sekarang: newAsset.nilaiSaatIni,
      user_id: newAsset.userId,
      created_at: toSafeISOString(newAsset.createdAt),
      updated_at: toSafeISOString(newAsset.updatedAt),
      kategori: newAsset.kategori ?? null,
      kondisi: newAsset.kondisi ?? null,
      lokasi: newAsset.lokasi ?? null,
      deskripsi: newAsset.deskripsi ?? null,
      depresiasi: newAsset.depresiasi ?? null,
    };

    const { error } = await supabase.from('assets').insert([assetToInsert]);
    if (error) {
      console.error('Error adding asset to DB:', error);
      toast.error(`Gagal menambahkan aset: ${error.message}`);
      return false;
    }

    // setAssets(prev => [...prev, newAsset]); // Ini akan di-handle oleh realtime subscription
    addActivity({
      title: 'Aset Ditambahkan',
      description: `${asset.nama} telah ditambahkan`,
      type: 'stok',
    });
    toast.success(`${asset.nama} berhasil ditambahkan!`);
    return true;
  };

  const updateAsset = async (id: string, updatedAsset: Partial<Asset>) => {
    const assetToUpdate: Partial<any> = {
      updated_at: toSafeISOString(new Date()),
    };
    if (updatedAsset.nama !== undefined) assetToUpdate.nama = updatedAsset.nama;
    if (updatedAsset.jenis !== undefined) assetToUpdate.jenis = updatedAsset.jenis ?? null;
    if (updatedAsset.nilai !== undefined) assetToUpdate.nilai_awal = updatedAsset.nilai;
    if (updatedAsset.umurManfaat !== undefined) assetToUpdate.umur_manfaat = updatedAsset.umurManfaat;
    if (updatedAsset.tanggalPembelian !== undefined) {
      assetToUpdate.tanggal_pembelian = toSafeISOString(updatedAsset.tanggalPembelian);
    }
    if (updatedAsset.penyusutanPerBulan !== undefined) assetToUpdate.penyusutan_per_bulan = updatedAsset.penyusutanPerBulan;
    if (updatedAsset.nilaiSaatIni !== undefined) assetToUpdate.nilai_sekarang = updatedAsset.nilaiSaatIni;
    if (updatedAsset.kategori !== undefined) assetToUpdate.kategori = updatedAsset.kategori ?? null;
    if (updatedAsset.kondisi !== undefined) assetToUpdate.kondisi = updatedAsset.kondisi ?? null;
    if (updatedAsset.lokasi !== undefined) assetToUpdate.lokasi = updatedAsset.lokasi ?? null;
    if (updatedAsset.deskripsi !== undefined) assetToUpdate.deskripsi = updatedAsset.deskripsi ?? null;
    if (updatedAsset.depresiasi !== undefined) assetToUpdate.depresiasi = updatedAsset.depresiasi ?? null;

    const { error } = await supabase.from('assets').update(assetToUpdate).eq('id', id);
    if (error) {
      console.error('Error updating asset in DB:', error);
      toast.error(`Gagal memperbarui aset: ${error.message}`);
      return false;
    }

    // setAssets(prev => ...); // Ini akan di-handle oleh realtime subscription
    toast.success(`Aset berhasil diperbarui!`);
    return true;
  };

  const deleteAsset = async (id: string) => {
    const asset = assets.find(a => a.id === id);

    const { error } = await supabase.from('assets').delete().eq('id', id);
    if (error) {
      console.error('Error deleting asset from DB:', error);
      toast.error(`Gagal menghapus aset: ${error.message}`);
      return false;
    }

    // setAssets(prev => prev.filter(a => a.id !== id)); // Ini akan di-handle oleh realtime subscription
    if (asset) {
      addActivity({
        title: 'Aset Dihapus',
        description: `${asset.nama} telah dihapus`,
        type: 'stok',
      });
      toast.success(`Aset ${asset.nama} berhasil dihapus!`);
    }
    return true;
  };

  const addFinancialTransaction = async (transaction: Omit<FinancialTransaction, 'id' | 'userId' | 'created_at' | 'updated_at'>) => {
    const session = (await supabase.auth.getSession()).data.session;
    const newTransaction: FinancialTransaction = {
      ...transaction,
      id: generateUUID(),
      userId: session?.user.id,
      created_at: new Date(),
      updated_at: new Date(),
      date: transaction.date || new Date(),
    };

    const transactionToInsert = {
      id: newTransaction.id,
      user_id: newTransaction.userId,
      type: newTransaction.type,
      category: newTransaction.category,
      amount: newTransaction.amount,
      description: newTransaction.description,
      date: toSafeISOString(newTransaction.date),
      created_at: toSafeISOString(newTransaction.created_at),
      updated_at: toSafeISOString(newTransaction.updated_at),
    };

    const { error } = await supabase.from('financial_transactions').insert([transactionToInsert]);
    if (error) {
      console.error('Error adding financial transaction to DB:', error);
      toast.error(`Gagal menambahkan transaksi keuangan: ${error.message}`);
      return false;
    }

    // setFinancialTransactions(prev => [...prev, newTransaction]); // Ini akan di-handle oleh realtime subscription
    addActivity({
      title: 'Transaksi Keuangan Ditambahkan',
      description: `${transaction.type === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'} Rp ${transaction.amount.toLocaleString('id-ID')}`,
      type: 'stok',
    });
    toast.success(`Transaksi berhasil ditambahkan!`);
    return true;
  };

  const updateFinancialTransaction = async (id: string, updatedTransaction: Partial<FinancialTransaction>) => {
    const transactionToUpdate: Partial<any> = {
      updated_at: toSafeISOString(new Date()),
    };
    if (updatedTransaction.userId !== undefined) transactionToUpdate.user_id = updatedTransaction.userId;
    if (updatedTransaction.type !== undefined) transactionToUpdate.type = updatedTransaction.type;
    if (updatedTransaction.category !== undefined) transactionToUpdate.category = updatedTransaction.category;
    if (updatedTransaction.amount !== undefined) transactionToUpdate.amount = updatedTransaction.amount;
    if (updatedTransaction.description !== undefined) transactionToUpdate.description = updatedTransaction.description;
    if (updatedTransaction.date !== undefined) transactionToUpdate.date = toSafeISOString(updatedTransaction.date);

    const { error } = await supabase.from('financial_transactions').update(transactionToUpdate).eq('id', id);
    if (error) {
      console.error('Error updating financial transaction in DB:', error);
      toast.error(`Gagal memperbarui transaksi keuangan: ${error.message}`);
      return false;
    }

    // setFinancialTransactions(prev => ...); // Ini akan di-handle oleh realtime subscription
    toast.success(`Transaksi berhasil diperbarui!`);
    return true;
  };

  const deleteFinancialTransaction = async (id: string) => {
    const transaction = financialTransactions.find(t => t.id === id);

    const { error } = await supabase.from('financial_transactions').delete().eq('id', id);
    if (error) {
      console.error('Error deleting financial transaction from DB:', error);
      toast.error(`Gagal menghapus transaksi keuangan: ${error.message}`);
      return false;
    }

    // setFinancialTransactions(prev => prev.filter(t => t.id !== id)); // Ini akan di-handle oleh realtime subscription
    if (transaction) {
      addActivity({
        title: 'Transaksi Keuangan Dihapus',
        description: `${transaction.type === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'} Rp ${transaction.amount.toLocaleString('id-ID')} dihapus`,
        type: 'stok',
      });
      toast.success(`Transaksi berhasil dihapus!`);
    }
    return true;
  };

  const value: AppDataContextType = {
    bahanBaku,
    addBahanBaku,
    updateBahanBaku,
    deleteBahanBaku,
    getBahanBakuByName,
    reduceStok,
    suppliers,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    purchases,
    addPurchase,
    updatePurchase,
    deletePurchase,
    recipes,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    hppResults,
    addHPPResult,
    addHPPCalculation,
    activities,
    addActivity,
    orders,
    addOrder,
    updateOrder,
    deleteOrder,
    updateOrderStatus,
    assets,
    addAsset,
    updateAsset,
    deleteAsset,
    financialTransactions,
    addFinancialTransaction,
    updateFinancialTransaction,
    deleteFinancialTransaction,
    getStatistics,
    getDashboardStats,
    cloudSyncEnabled,
    setCloudSyncEnabled,
    syncToCloud,
    loadFromCloud,
    replaceAllData,
  };

  return (
    <AppDataContext.Provider value={value}>
      {children}
    </AppDataContext.Provider>
  );
};

export const useAppData = () => {
  const context = useContext(AppDataContext);
  if (context === undefined) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
};