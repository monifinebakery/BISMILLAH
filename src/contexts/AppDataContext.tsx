import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { RecipeIngredient, Recipe } from '@/types/recipe';
import { Supplier } from '@/types/supplier';
import { Order, NewOrder, OrderItem } from '@/types/order';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSupabaseSync } from '@/hooks/useSupabaseSync';
import { safeParseDate, toSafeISOString } from '@/utils/dateUtils'; 
import { generateUUID } from '@/utils/uuid'; // Tambahkan generateUUID

// =============================================================
// INTERFACES (Definisi tipe utama untuk aplikasi Anda)
// =============================================================
// Pastikan tipe-tipe ini konsisten di seluruh aplikasi Anda.

export interface BahanBaku {
  id: string;
  nama: string;
  kategori: string;
  stok: number;
  satuan: string;
  hargaSatuan: number;
  minimum: number;
  supplier: string;
  tanggalKadaluwarsa: Date | null; // Nullable
  createdAt: Date | null; // Nullable (untuk safety, meskipun DB default now())
  updatedAt: Date | null; // Nullable
  jumlahBeliKemasan?: number | null;
  satuanKemasan?: string | null;
  hargaTotalBeliKemasan?: number | null;
  userId?: string; // Optional
}

export interface Purchase {
  id: string;
  tanggal: Date; // Wajib, akan selalu Date karena ada fallback
  supplier: string;
  items: {
    id?: string | number; // ID ini penting untuk key di React, akan di-generate jika tidak ada
    namaBarang: string; 
    kategori?: string;
    jumlah: number;
    satuan?: string;
    hargaSatuan: number;
    totalHarga: number;
  }[];
  totalNilai: number; // camelCase
  status: 'pending' | 'completed' | 'cancelled';
  metodePerhitungan: 'FIFO' | 'LIFO' | 'Average'; // camelCase
  catatan: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  timestamp: Date; // Wajib, akan selalu Date karena ada fallback
  type: 'hpp' | 'stok' | 'resep' | 'purchase' | 'supplier' | 'aset' | 'keuangan'; 
  value: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
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
  timestamp: Date; // Wajib, akan selalu Date karena ada fallback
  createdAt: Date | null;
  updatedAt: Date | null;
}

// DEFINISI ASSET YANG KOMPREHENSIF DAN KONSISTEN
export interface Asset {
  id: string;
  nama: string;
  kategori: 'Peralatan' | 'Kendaraan' | 'Properti' | 'Teknologi' | null; // Nullable & literal type
  nilaiAwal: number; // camelCase
  nilaiSaatIni: number; // camelCase
  tanggalPembelian: Date | null; // Nullable
  kondisi: 'Baik' | 'Cukup' | 'Buruk' | null; // Nullable & literal type
  lokasi: string | null; // Nullable
  deskripsi: string | null; // Nullable
  depresiasi: number | null; // Nullable
  umurManfaat: number; // Ditambahkan
  penyusutanPerBulan: number; // Ditambahkan
  userId?: string; // Optional
  createdAt: Date | null; // Nullable
  updatedAt: Date | null; // Nullable
}

export interface FinancialTransaction {
  id: string;
  userId: string;
  type: 'pemasukan' | 'pengeluaran'; // Literal type
  category: string | null; // Nullable
  amount: number;
  description: string | null; // Nullable
  date: Date | null; // Nullable
  created_at: Date | null;
  updated_at: Date | null;
}

interface AppDataContextType {
  // Bahan Baku
  bahanBaku: BahanBaku[];
  addBahanBaku: (bahan: Omit<BahanBaku, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<boolean>;
  updateBahanBaku: (id: string, bahan: Partial<BahanBaku>) => Promise<boolean>;
  deleteBahanBaku: (id: string) => Promise<boolean>;
  getBahanBakuByName: (nama: string) => BahanBaku | undefined;
  reduceStok: (nama: string, jumlah: number) => Promise<boolean>;
  
  // Suppliers
  suppliers: Supplier[];
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<boolean>;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => Promise<boolean>;
  deleteSupplier: (id: string) => Promise<boolean>;
  
  // Purchases
  purchases: Purchase[];
  addPurchase: (purchase: Omit<Purchase, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  updatePurchase: (id: string, purchase: Partial<Purchase>) => Promise<boolean>;
  deletePurchase: (id: string) => Promise<boolean>;
  
  // Recipes
  recipes: Recipe[];
  addRecipe: (recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  updateRecipe: (id: string, recipe: Partial<Recipe>) => Promise<boolean>;
  deleteRecipe: (id: string) => Promise<boolean>;
  
  // HPP Results
  hppResults: HPPResult[];
  addHPPResult: (result: Omit<HPPResult, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  addHPPCalculation: (result: Omit<HPPResult, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  
  // Activities
  activities: Activity[];
  addActivity: (activity: Omit<Activity, 'id' | 'timestamp' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  
  // Orders
  orders: Order[];
  addOrder: (order: Omit<NewOrder, 'id' | 'tanggal' | 'createdAt' | 'updatedAt' | 'nomorPesanan' | 'status'>) => Promise<boolean>;
  updateOrder: (id: string, order: Partial<Order>) => Promise<boolean>;
  deleteOrder: (id: string) => Promise<boolean>;
  updateOrderStatus: (id: string, status: Order['status']) => Promise<void>;

  // Assets
  assets: Asset[];
  addAsset: (asset: Omit<Asset, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'penyusutanPerBulan' | 'nilaiSaatIni'>) => Promise<boolean>;
  updateAsset: (id: string, asset: Partial<Asset>) => Promise<boolean>;
  deleteAsset: (id: string) => Promise<boolean>;

  // Financial Transactions
  financialTransactions: FinancialTransaction[];
  addFinancialTransaction: (transaction: Omit<FinancialTransaction, 'id' | 'userId' | 'created_at' | 'updated_at'>) => Promise<boolean>;
  updateFinancialTransaction: (id: string, transaction: Partial<FinancialTransaction>) => Promise<boolean>;
  deleteFinancialTransaction: (id: string) => Promise<boolean>;
  
  // Statistics
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

  // Cloud sync
  cloudSyncEnabled: boolean;
  setCloudSyncEnabled: (enabled: boolean) => void;
  
  // Manual sync functions
  syncToCloud: () => Promise<boolean>;
  loadFromCloud: () => Promise<void>;
  replaceAllData: (data: any) => void;
  clearAllLocalData: () => void; // Membersihkan semua data lokal (misal saat logout)
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

// Local Storage keys
const STORAGE_KEYS = {
  BAHAN_BAKU: 'hpp_app_bahan_baku',
  SUPPLIERS: 'hpp_app_suppliers',
  PURCHASES: 'hpp_app_purchases',
  RECIPES: 'hpp_app_recipes',
  PRIMARY_RECIPES: 'hpp_app_primary_recipes', // Tambahkan jika ada
  HPP_RESULTS: 'hpp_app_hpp_results',
  ACTIVITIES: 'hpp_app_activities',
  ORDERS: 'hpp_app_orders',
  CLOUD_SYNC: 'hpp_app_cloud_sync',
  ASSETS: 'hpp_app_assets',
  FINANCIAL_TRANSACTIONS: 'hpp_app_financial_transactions',
};

// Helper function to generate UUID (DIJAGA LOKAL DI SINI KARENA SERING DIGUNAKAN DI ADD METHODS)
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Helper untuk menyimpan data ke localStorage
const saveToStorage = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving to localStorage for key ${key}:`, error);
  }
};

// Helper untuk memuat data dari localStorage, termasuk parsing tanggal dan jaminan ID unik
const loadFromStorage = (key: string, defaultValue: any = []) => {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Logic khusus untuk parsing dan jaminan ID unik per jenis data
      switch (key) {
        case STORAGE_KEYS.ACTIVITIES:
        case STORAGE_KEYS.HPP_RESULTS:
          return parsed.map((item: any) => ({
            ...item,
            timestamp: safeParseDate(item.timestamp),
            createdAt: safeParseDate(item.createdAt),
            updatedAt: safeParseDate(item.updatedAt),
          }));
        case STORAGE_KEYS.PURCHASES:
          return parsed.map((item: any) => ({
            ...item,
            tanggal: safeParseDate(item.tanggal),
            createdAt: safeParseDate(item.createdAt),
            updatedAt: safeParseDate(item.updatedAt),
          }));
        case STORAGE_KEYS.BAHAN_BAKU:
          return parsed.map((item: any) => ({
            ...item,
            tanggalKadaluwarsa: safeParseDate(item.tanggalKadaluwarsa),
            createdAt: safeParseDate(item.createdAt),
            updatedAt: safeParseDate(item.updatedAt),
          }));
        case STORAGE_KEYS.ORDERS: 
          return parsed.map((item: any) => {
            const parsedTanggal = safeParseDate(item.tanggal);
            const parsedCreatedAt = safeParseDate(item.createdAt || item.created_at);
            const parsedUpdatedAt = safeParseDate(item.updatedAt || item.updated_at);
            
            return {
              ...item,
              tanggal: (parsedTanggal instanceof Date && !isNaN(parsedTanggal.getTime())) ? parsedTanggal : new Date(),
              createdAt: (parsedCreatedAt instanceof Date && !isNaN(parsedCreatedAt.getTime())) ? parsedCreatedAt : null,
              updatedAt: (parsedUpdatedAt instanceof Date && !isNaN(parsedUpdatedAt.getTime())) ? parsedUpdatedAt : null,
              items: item.items ? item.items.map((orderItem: any) => ({
                ...orderItem,
                id: orderItem.id || generateUUID(), 
              })) : [],
            };
          });
        case STORAGE_KEYS.ASSETS: // MODIFIED: Tambahkan parsing tanggal yang benar untuk ASSETS
          return parsed.map((item: any) => {
            const parsedTanggalPembelian = safeParseDate(item.tanggalPembelian || item.tanggal_beli);
            const parsedCreatedAt = safeParseDate(item.createdAt || item.created_at);
            const parsedUpdatedAt = safeParseDate(item.updatedAt || item.updated_at);
            
            return {
              ...item, 
              id: item.id, 
              nama: item.nama || '',
              kategori: item.kategori || item.jenis || null, // Coba kedua nama jika ada inkonsistensi
              nilaiAwal: parseFloat(item.nilaiAwal || item.nilai_awal) || 0, 
              nilaiSaatIni: parseFloat(item.nilaiSaatIni || item.nilai_sekarang) || 0,
              umurManfaat: parseFloat(item.umurManfaat || item.umur_manfaat || 0), // Default 0
              penyusutanPerBulan: parseFloat(item.penyusutanPerBulan || item.penyusutan_per_bulan || 0), // Default 0
              tanggalPembelian: (parsedTanggalPembelian instanceof Date && !isNaN(parsedTanggalPembelian.getTime()))
                                  ? parsedTanggalPembelian
                                  : new Date('1970-01-01T00:00:00Z'), // Jaminan Date valid
              kondisi: item.kondisi || null,
              lokasi: item.lokasi || '',
              deskripsi: item.deskripsi || null,
              depresiasi: parseFloat(item.depresiasi) ?? null,
              userId: item.userId || item.user_id || null, // Default null
              createdAt: (parsedCreatedAt instanceof Date && !isNaN(parsedCreatedAt.getTime()))
                         ? parsedCreatedAt
                         : new Date(), 
              updatedAt: (parsedUpdatedAt instanceof Date && !isNaN(parsedUpdatedAt.getTime()))
                         ? parsedUpdatedAt
                         : new Date(), 
            };
          });
        case STORAGE_KEYS.FINANCIAL_TRANSACTIONS:
          return parsed.map((item: any) => ({
            ...item,
            date: safeParseDate(item.date),
            created_at: safeParseDate(item.created_at),
            updated_at: safeParseDate(item.updated_at),
          }));
        default:
          return parsed;
      }
    }
    return defaultValue;
  } catch (error) {
    console.error(`Error loading from localStorage for key ${key}:`, error);
    return defaultValue;
  }
};

export const AppDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const {
    syncToSupabase: externalSyncToCloud,
    loadFromSupabase: externalLoadFromCloud,
    isLoading: isSyncingCloud, // State loading dari useSupabaseSync
  } = useSupabaseSync();

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
  const [orders, setOrders] = useState<Order[]>(() =>
    loadFromStorage(STORAGE_KEYS.ORDERS, [
      {
        id: generateUUID(),
        nomorPesanan: 'ORD-001',
        tanggal: new Date('2024-12-28T10:00:00Z'),
        namaPelanggan: 'John Doe',
        emailPelanggan: 'john@example.com',
        teleponPelanggan: '081234567890',
        alamatPelanggan: 'Jl. Merdeka No. 123, Jakarta',
        items: [{ id: generateUUID(), namaBarang: 'Kue Coklat', quantity: 2, hargaSatuan: 50000, totalHarga: 100000 }],
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
        items: [{ id: generateUUID(), namaBarang: 'Roti Tawar', quantity: 5, hargaSatuan: 15000, totalHarga: 75000 }],
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

  useEffect(() => {
    const checkAndLoadFromCloud = async () => {
      if (cloudSyncEnabled && 
          bahanBaku.length === 0 && 
          suppliers.length === 0 && 
          purchases.length === 0 && 
          recipes.length === 0 && 
          orders.length <= 2 && // Menganggap 2 item default sebagai 'kosong' untuk trigger load
          assets.length === 0 && 
          financialTransactions.length === 0 
          ) { 
        console.log('Local data appears empty, attempting to load from cloud...');
        await externalLoadFromCloud(); 
      }
    };

    const timer = setTimeout(checkAndLoadFromCloud, 1000);
    return () => clearTimeout(timer);
  }, [cloudSyncEnabled, externalLoadFromCloud, bahanBaku, suppliers, purchases, recipes, orders, assets, financialTransactions]);


  // Save to localStorage whenever data changes
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.BAHAN_BAKU, bahanBaku);
  }, [bahanBaku]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SUPPLIERS, suppliers);
  }, [suppliers]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.PURCHASES, purchases);
  }, [purchases]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.RECIPES, recipes);
  }, [recipes]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.HPP_RESULTS, hppResults);
  }, [hppResults]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.ACTIVITIES, activities);
  }, [activities]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.ORDERS, orders);
  }, [orders]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.ASSETS, assets); 
  }, [assets]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.FINANCIAL_TRANSACTIONS, financialTransactions); 
  }, [financialTransactions]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.CLOUD_SYNC, cloudSyncEnabled);
  }, [cloudSyncEnabled]);

  // Pendengar Realtime Supabase untuk sinkronisasi otomatis
  useEffect(() => {
    let channels: RealtimeChannel[] = []; 

    const setupRealtimeSubscription = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      channels.forEach(channel => supabase.removeChannel(channel));
      channels = []; // Reset channels array

      if (!session) {
        console.log('No session, skipping real-time subscriptions setup.');
        return;
      }
      const userId = session.user.id;
      
      const tablesToSubscribe = [
        'bahan_baku', 'suppliers', 'purchases', 'hpp_recipes', 'hpp_results',
        'orders', 'activities', 'assets', 'financial_transactions', 'user_settings'
      ];
      
      console.log(`Menyiapkan langganan realtime untuk user_id: ${userId}`);

      for (const tableName of tablesToSubscribe) {
        const channel = supabase
          .channel(`public:${tableName}_changes_${userId}`) 
          .on(
            'postgres_changes',
            {
              event: '*', 
              schema: 'public',
              table: tableName,
              filter: `user_id=eq.${userId}` 
            },
            (payload) => {
              console.log(`Perubahan realtime terdeteksi di ${tableName}:`, payload);
              // Picu pemuatan ulang semua data untuk konsistensi antar tab/device
              externalLoadFromCloud(); 
            }
          )
          .subscribe();
        channels.push(channel);
      }
    };

    setupRealtimeSubscription();

    return () => {
      console.log('Membersihkan langganan realtime.');
      channels.forEach(channel => supabase.removeChannel(channel));
      channels = []; // Pastikan array channels kosong
    };
  }, [externalLoadFromCloud]); 


  // Pendengar untuk memuat data saat aplikasi kembali fokus
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) { 
          console.log('Tab aplikasi terlihat dan user login, memeriksa pembaruan dari cloud (visibilitychange)...');
          await externalLoadFromCloud(); 
        } else {
          console.log('Tab aplikasi terlihat, tapi user tidak login. Tidak ada pembaruan dari cloud.');
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [externalLoadFromCloud]); 


  // Enhanced manual cloud sync functions
  const syncToCloud = async (): Promise<boolean> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error('Anda harus login untuk menyinkronkan data');
      return false;
    }
    
    console.log('Syncing to cloud...');

    const transformedPayload = {
      bahanBaku: bahanBaku.map(item => ({
        id: item.id, nama: item.nama, kategori: item.kategori, stok: item.stok, satuan: item.satuan, minimum: item.minimum, harga_satuan: item.hargaSatuan, supplier: item.supplier, tanggal_kadaluwarsa: toSafeISOString(item.tanggalKadaluwarsa), user_id: session.user.id, created_at: toSafeISOString(item.createdAt || new Date()), updated_at: toSafeISOString(item.updatedAt || new Date()), jumlah_beli_kemasan: item.jumlahBeliKemasan ?? null, satuan_kemasan: item.satuanKemasan ?? null, harga_total_beli_kemasan: item.hargaTotalBeliKemasan ?? null,
      })),
      suppliers: suppliers.map(item => ({
        id: item.id, nama: item.nama, kontak: item.kontak, email: item.email, telepon: item.telepon, alamat: item.alamat, catatan: item.catatan ?? null, user_id: session.user.id, created_at: toSafeISOString(item.createdAt || new Date()), updated_at: toSafeISOString(item.updatedAt || new Date()),
      })),
      purchases: purchases.map(item => ({
        id: item.id, tanggal: toSafeISOString(item.tanggal || new Date()), supplier: item.supplier, items: item.items, total_nilai: item.totalNilai, metode_perhitungan: item.metodePerhitungan, catatan: item.catatan ?? null, user_id: session.user.id, created_at: toSafeISOString(item.createdAt), updated_at: toSafeISOString(item.updatedAt),
      })),
      recipes: recipes.map(item => ({
        id: item.id, nama_resep: item.namaResep, deskripsi: item.deskripsi ?? null, porsi: item.porsi, ingredients: item.ingredients, biaya_tenaga_kerja: item.biayaTenagaKerja, biaya_overhead: item.biayaOverhead, total_hpp: item.totalHPP, hpp_per_porsi: item.hppPerPorsi, margin_keuntungan: item.marginKeuntungan, harga_jual_per_porsi: item.hargaJualPerPorsi, category: item.category, user_id: session.user.id, created_at: toSafeISOString(item.createdAt || new Date()), updated_at: toSafeISOString(item.updatedAt || new Date()),
      })),
      hppResults: hppResults.map(item => ({
        id: item.id, nama: item.nama, ingredients: item.ingredients, biaya_tenaga_kerja: item.biayaTenagaKerja, biaya_overhead: item.biayaOverhead, margin_keuntungan: item.marginKeuntungan, total_hpp: item.totalHPP, hpp_per_porsi: item.hppPerPorsi, harga_jual_per_porsi: item.hargaJualPerPorsi, jumlah_porsi: item.jumlahPorsi, user_id: session.user.id, created_at: toSafeISOString(item.timestamp || new Date()), updated_at: toSafeISOString(item.updatedAt || new Date()),
      })),
      activities: activities.map(item => ({
        id: item.id, title: item.title, description: item.description, type: item.type, value: item.value ?? null, user_id: session.user.id, created_at: toSafeISOString(item.timestamp || new Date()), updated_at: toSafeISOString(item.updatedAt || new Date()),
      })),
      orders: orders.map(item => ({
        id: item.id, nomor_pesanan: item.nomorPesanan, tanggal: toSafeISOString(item.tanggal || new Date()), nama_pelanggan: item.namaPelanggan, email_pelanggan: item.emailPelanggan, telepon_pelanggan: item.teleponPelanggan, alamat_pengiriman: item.alamatPelanggan, items: item.items, subtotal: item.subtotal, pajak: item.pajak, total_pesanan: item.totalPesanan, status: item.status, catatan: item.catatan ?? null, user_id: session.user.id, created_at: toSafeISOString(item.createdAt), updated_at: toSafeISOString(item.updatedAt),
      })),
      assets: assets.map(item => ({
        id: item.id, nama: item.nama, kategori: item.kategori ?? null, nilai_awal: item.nilaiAwal, nilai_sekarang: item.nilaiSaatIni, tanggal_beli: toSafeISOString(item.tanggalPembelian), kondisi: item.kondisi ?? null, lokasi: item.lokasi ?? null, deskripsi: item.deskripsi ?? null, depresiasi: item.depresiasi ?? null, umur_manfaat: item.umurManfaat, penyusutan_per_bulan: item.penyusutanPerBulan, user_id: session.user.id, created_at: toSafeISOString(item.createdAt || new Date()), updated_at: toSafeISOString(item.updatedAt || new Date()),
      })),
      financialTransactions: financialTransactions.map(item => ({
        id: item.id, user_id: session.user.id, type: item.type, category: item.category ?? null, amount: item.amount, description: item.description ?? null, date: toSafeISOString(item.date || new Date()), created_at: toSafeISOString(item.created_at), updated_at: toSafeISOString(item.updatedAt || new Date()),
      })),
    };

    const success = await externalSyncToCloud(transformedPayload);
    if (!success) {
      return false;
    }
    console.log('Sync successful, data is now on cloud and local state will update via realtime/loadFromCloud.');
    return true;
  };

  const loadFromCloud = async (): Promise<void> => {
    // MODIFIED: Jangan mencegah loadFromCloud jika isSyncingCloud true, itu dikelola internal oleh useSupabaseSync
    // if (!isSyncingCloud) return; 
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return;
      }

      console.log('Loading from cloud via AppDataContext...');

      const loadedData = await externalLoadFromCloud(); 
      if (loadedData) {
        replaceAllData(loadedData); 
        toast.success('Data berhasil dimuat dari cloud!');
      }
    } catch (error) {
      console.error('Load from cloud failed in AppDataContext:', error);
      toast.error(`Gagal memuat dari cloud: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const replaceAllData = (data: any) => {
    if (data.bahanBaku) setBahanBaku(data.bahanBaku);
    if (data.suppliers) setSuppliers(data.suppliers);
    if (data.purchases) setPurchases(data.purchases);
    if (data.recipes) setRecipes(data.recipes);
    if (data.hppResults) setHppResults(data.hppResults);
    if (data.activities) setActivities(data.activities);
    if (data.orders) setOrders(data.orders.map((order: any) => ({
      ...order,
      items: order.items ? order.items.map((orderItem: any) => ({
        ...orderItem,
        id: orderItem.id || generateUUID(), 
      })) : [],
    })));
    if (data.assets) setAssets(data.assets);
    if (data.financialTransactions) setFinancialTransactions(data.financialTransactions);
    // User settings akan dimuat oleh useUserSettings hook secara terpisah
    // if (data.userSettings) { console.log("User settings loaded, assuming handled by useUserSettings hook directly."); }
    toast.info('Data lokal diperbarui dengan data cloud.');
  };

  const clearAllLocalData = () => {
    Object.values(STORAGE_KEYS).forEach(key => {
      if (key.startsWith('hpp_app_')) { 
        localStorage.removeItem(key);
      }
    });
    setBahanBaku([]);
    setSuppliers([]);
    setPurchases([]);
    setRecipes([]);
    setHppResults([]);
    setActivities([]);
    setOrders([]);
    setAssets([]);
    setFinancialTransactions([]);
    toast.info('Data lokal berhasil dibersihkan.');
  };

  // Bahan Baku functions
  const addBahanBaku = async (bahan: Omit<BahanBaku, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    const session = (await supabase.auth.getSession()).data.session;
    const newBahanTempId = generateUUID(); 
    const now = new Date();

    const newBahanWithTempId: BahanBaku = {
      ...bahan,
      id: newBahanTempId,
      userId: session?.user.id,
      createdAt: now,
      updatedAt: now,
    };

    setBahanBaku(prev => [...prev, newBahanWithTempId].sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)));

    const bahanToInsert = {
      id: newBahanTempId, 
      user_id: session?.user.id,
      nama: newBahan.nama,
      kategori: newBahan.kategori,
      stok: newBahan.stok,
      satuan: newBahan.satuan,
      harga_satuan: newBahan.hargaSatuan, 
      minimum: newBahan.minimum,
      supplier: newBahan.supplier,
      tanggal_kadaluwarsa: toSafeISOString(newBahan.tanggalKadaluwarsa), 
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      jumlah_beli_kemasan: newBahan.jumlahBeliKemasan ?? null,
      satuan_kemasan: newBahan.satuanKemasan ?? null,
      harga_total_beli_kemasan: newBahan.hargaTotalBeliKemasan ?? null,
    };

    const { error } = await supabase.from('bahan_baku').insert([bahanToInsert]);

    if (error) {
      console.error('Error adding bahan baku to DB:', error);
      toast.error(`Gagal menambahkan bahan baku: ${error.message}`);
      setBahanBaku(prev => prev.filter(b => b.id !== newBahanTempId)); 
      return false;
    }

    addActivity({
      title: 'Bahan Baku Ditambahkan',
      description: `${bahan.nama} telah ditambahkan ke gudang`,
      type: 'stok',
    });
    toast.success(`${bahan.nama} berhasil ditambahkan!`);
    return true;
  };

  const updateBahanBaku = async (id: string, updatedBahan: Partial<BahanBaku>) => {
    const session = (await supabase.auth.getSession()).data.session; 
    if (!session) { toast.error('Anda harus login untuk memperbarui bahan baku'); return false; }

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
    } else if (Object.prototype.hasOwnProperty.call(updatedBahan, 'tanggalKadaluwarsa') && updatedBahan.tanggalKadaluwarsa === null) {
      bahanToUpdate.tanggal_kadaluwarsa = null;
    }
    if ('jumlahBeliKemasan' in updatedBahan) {
      bahanToUpdate.jumlah_beli_kemasan = updatedBahan.jumlahBeliKemasan; 
    }
    if ('satuanKemasan' in updatedBahan) {
      bahanToUpdate.satuan_kemasan = updatedBahan.satuanKemasan;        
    }
    if ('hargaTotalBeliKemasan' in updatedBahan) {
      bahanToUpdate.harga_total_beli_kemasan = updatedBahan.hargaTotalBeliKemasan; 
    }

    setBahanBaku(prev => prev.map(item => item.id === id ? { ...item, ...updatedBahan, updatedAt: new Date() } : item));

    const { error } = await supabase.from('bahan_baku').update(bahanToUpdate).eq('id', id).eq('user_id', session.user.id);
    if (error) {
      console.error('Error updating bahan baku in DB:', error);
      toast.error(`Gagal memperbarui bahan baku: ${error.message}`);
      return false;
    }

    toast.success(`Bahan baku berhasil diperbarui!`);
    return true;
  };

  const deleteBahanBaku = async (id: string) => {
    const bahan = bahanBaku.find(b => b.id === id);
    const session = (await supabase.auth.getSession()).data.session; 
    if (!session) { toast.error('Anda harus login untuk menghapus bahan baku'); return false; }

    setBahanBaku(prev => prev.filter(b => b.id !== id));

    const { error } = await supabase.from('bahan_baku').delete().eq('id', id).eq('user_id', session.user.id);
    if (error) {
      console.error('Error deleting bahan baku from DB:', error);
      toast.error(`Gagal menghapus bahan baku: ${error.message}`);
      if (bahan) setBahanBaku(prev => [...prev, bahan]); 
      return false;
    }

    toast.success(`Bahan baku berhasil dihapus!`);
    return true;
  };

  const getBahanBakuByName = (nama: string): BahanBaku | undefined => {
    return bahanBaku.find(bahan => bahan.nama.toLowerCase() === nama.toLowerCase());
  };

  const reduceStok = async (nama: string, jumlah: number): Promise<boolean> => {
    const bahan = getBahanBakuByName(nama);
    if (!bahan) {
      toast.error(`Stok ${nama} tidak ditemukan.`);
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

    setSuppliers(prev => [...prev, newSupplier]);

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
      setSuppliers(prev => prev.filter(s => s.id !== newSupplier.id)); 
      return false;
    }

    addActivity({
      title: 'Supplier Ditambahkan',
      description: `${supplier.nama} telah ditambahkan`,
      type: 'supplier',
    });
    toast.success(`${supplier.nama} berhasil ditambahkan!`);
    return true;
  };

  const updateSupplier = async (id: string, updatedSupplier: Partial<Supplier>) => {
    const session = (await supabase.auth.getSession()).data.session; 
    if (!session) { toast.error('Anda harus login untuk memperbarui supplier'); return false; }

    const supplierToUpdate: Partial<any> = {
      updated_at: toSafeISOString(new Date()),
    };
    if (updatedSupplier.nama !== undefined) supplierToUpdate.nama = updatedSupplier.nama;
    if (updatedSupplier.kontak !== undefined) supplierToUpdate.kontak = updatedSupplier.kontak;
    if (updatedSupplier.email !== undefined) supplierToUpdate.email = updatedSupplier.email;
    if (updatedSupplier.telepon !== undefined) supplierToUpdate.telepon = updatedSupplier.telepon;
    if (updatedSupplier.alamat !== undefined) supplierToUpdate.alamat = updatedSupplier.alamat;
    if (updatedSupplier.catatan !== undefined) supplierToUpdate.catatan = updatedSupplier.catatan ?? null;

    setSuppliers(prev => prev.map(s => s.id === id ? { ...s, ...updatedSupplier, updatedAt: new Date() } : s));

    const { error } = await supabase.from('suppliers').update(supplierToUpdate).eq('id', id).eq('user_id', session.user.id);
    if (error) {
      console.error('Error updating supplier in DB:', error);
      toast.error(`Gagal memperbarui supplier: ${error.message}`);
      return false;
    }

    toast.success(`Supplier berhasil diperbarui!`);
    return true;
  };

  const deleteSupplier = async (id: string) => {
    const supplier = suppliers.find(s => s.id === id);
    const { data: { session } } = await supabase.auth.getSession(); 
    if (!session) { toast.error('Anda harus login untuk menghapus supplier'); return false; }

    setSuppliers(prev => prev.filter(s => s.id !== id));

    const { error } = await supabase.from('suppliers').delete().eq('id', id).eq('user_id', session.user.id);
    if (error) {
      console.error('Error deleting supplier from DB:', error);
      toast.error(`Gagal menghapus supplier: ${error.message}`);
      if (supplier) setSuppliers(prev => [...prev, supplier]); 
      return false;
    }

    toast.success(`Supplier berhasil dihapus!`);
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

    setPurchases(prev => [...prev, newPurchase]);

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
      setPurchases(prev => prev.filter(p => p.id !== newPurchase.id)); 
      return false;
    }

    await Promise.all(purchase.items.map(async item => {
      if (!item.namaBarang) {
        console.warn('Purchase item missing namaBarang, skipping stock update for:', item);
        return;
      }
      const existingBahan = getBahanBakuByName(item.namaBarang);
      if (existingBahan) {
        updateBahanBaku(existingBahan.id, { 
          stok: existingBahan.stok + item.jumlah,
          hargaSatuan: item.hargaSatuan 
        });
      } else {
        addBahanBaku({
          nama: item.namaBarang,
          kategori: item.kategori || '',
          stok: item.jumlah,
          satuan: item.satuan || '',
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
    const session = (await supabase.auth.getSession()).data.session; 
    if (!session) { toast.error('Anda harus login untuk memperbarui pembelian'); return false; }

    const purchaseToUpdate: Partial<any> = {
      updated_at: toSafeISOString(new Date()),
    };
    if (updatedPurchase.tanggal !== undefined) purchaseToUpdate.tanggal = toSafeISOString(updatedPurchase.tanggal);
    if (updatedPurchase.supplier !== undefined) purchaseToUpdate.supplier = updatedPurchase.supplier;
    if (updatedPurchase.items !== undefined) purchaseToUpdate.items = updatedPurchase.items;
    if (updatedPurchase.totalNilai !== undefined) purchaseToUpdate.total_nilai = updatedPurchase.totalNilai;
    if (updatedPurchase.metodePerhitungan !== undefined) purchaseToUpdate.metode_perhitungan = updatedPurchase.metodePerhitungan;
    if (updatedPurchase.catatan !== undefined) purchaseToUpdate.catatan = updatedPurchase.catatan ?? null;

    const { error } = await supabase.from('purchases').update(purchaseToUpdate).eq('id', id).eq('user_id', session.user.id);
    if (error) {
      console.error('Error updating purchase in DB:', error);
      toast.error(`Gagal memperbarui pembelian: ${error.message}`);
      return false;
    }

    setPurchases(prev => prev.map(p => p.id === id ? { ...p, ...updatedPurchase, updatedAt: new Date() } : p));
    toast.success(`Pembelian berhasil diperbarui!`);
    return true;
  };

  const deletePurchase = async (id: string) => {
    const { data: { session } } = await supabase.auth.getSession(); 
    if (!session) { toast.error('Anda harus login untuk menghapus pembelian'); return false; }

    setPurchases(prev => prev.filter(p => p.id !== id));

    const { error } = await supabase.from('purchases').delete().eq('id', id).eq('user_id', session.user.id);
    if (error) {
      console.error('Error deleting purchase from DB:', error);
      toast.error(`Gagal menghapus pembelian: ${error.message}`);
      return false;
    }

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

    setRecipes(prev => [...prev, newRecipe]);
    addActivity({
      title: 'Resep Ditambahkan',
      description: `Resep ${recipe.namaResep} telah disimpan`,
      type: 'resep',
    });
    toast.success(`Resep ${recipe.namaResep} berhasil ditambahkan!`);
    return true;
  };

  const updateRecipe = async (id: string, updatedRecipe: Partial<Recipe>) => {
    const session = (await supabase.auth.getSession()).data.session; 
    if (!session) { toast.error('Anda harus login untuk memperbarui resep'); return false; }

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

    const { error } = await supabase.from('hpp_recipes').update(recipeToUpdate).eq('id', id).eq('user_id', session.user.id);
    if (error) {
      console.error('Error updating recipe in DB:', error);
      toast.error(`Gagal memperbarui resep: ${error.message}`);
      return false;
    }

    setRecipes(prev => prev.map(r => r.id === id ? { ...r, ...updatedRecipe, updatedAt: new Date() } : r));
    toast.success(`Resep berhasil diperbarui!`);
    return true;
  };

  const deleteRecipe = async (id: string) => {
    const recipe = recipes.find(r => r.id === id);
    const { data: { session } } = await supabase.auth.getSession(); 
    if (!session) { toast.error('Anda harus login untuk menghapus resep'); return false; }

    setRecipes(prev => prev.filter(r => r.id !== id));

    const { error } = await supabase.from('hpp_recipes').delete().eq('id', id).eq('user_id', session.user.id);
    if (error) {
      console.error('Error deleting recipe from DB:', error);
      toast.error(`Gagal menghapus resep: ${error.message}`);
      if (recipe) setRecipes(prev => [...prev, recipe]); 
      return false;
    }

    toast.success(`Resep berhasil dihapus!`);
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

    setHppResults(prev => [...prev, newResult]);

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
      setHppResults(prev => prev.filter(r => r.id !== newResult.id)); 
      return false;
    }

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

    setOrders(prev => [...prev, newOrder].sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)));

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
      setOrders(prev => prev.filter(o => o.id !== newOrder.id)); 
      return false;
    }

    addActivity({
      title: 'Pesanan Baru',
      description: `Pesanan ${newOrder.nomorPesanan} dari ${newOrder.namaPelanggan}`,
      type: 'purchase',
    });
    toast.success(`Pesanan ${newOrder.nomorPesanan} berhasil ditambahkan!`);
    return true;
  };

  const updateOrder = async (id: string, updatedOrder: Partial<Order>): Promise<boolean> => {
    const session = (await supabase.auth.getSession()).data.session; 
    if (!session) { toast.error('Anda harus login untuk memperbarui pesanan'); return false; }

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

    setOrders(prev => prev.map(o => o.id === id ? { ...o, ...updatedOrder, updatedAt: new Date() } : o));

    const { error } = await supabase.from('orders').update(orderToUpdate).eq('id', id).eq('user_id', session.user.id);
    if (error) {
      console.error('Error updating order in DB:', error);
      toast.error(`Gagal memperbarui pesanan: ${error.message}`);
      return false;
    }

    toast.success(`Pesanan berhasil diperbarui!`);
    return true;
  };

  const deleteOrder = async (id: string): Promise<boolean> => {
    const order = orders.find(o => o.id === id);
    const { data: { session } } = await supabase.auth.getSession(); 
    if (!session) { toast.error('Anda harus login untuk menghapus pesanan'); return false; }

    setOrders(prev => prev.filter(o => o.id !== id));

    const { error } = await supabase.from('orders').delete().eq('id', id).eq('user_id', session.user.id);
    if (error) {
      console.error('Error deleting order from DB:', error);
      toast.error(`Gagal menghapus pesanan: ${error.message}`);
      if (order) setOrders(prev => [...prev, order]); 
      return false;
    }

    toast.success(`Pesanan berhasil dihapus!`);
    return true;
  };

  const updateOrderStatus = (id: string, status: Order['status']) => {
    updateOrder(id, { status });
    const order = orders.find(o => o.id === id);
    if (order) {
      addActivity({
        title: 'Status Pesanan Diubah',
        description: `Pesanan ${order.nomorPesanan} diubah ke ${status}`,
        type: 'purchase',
      });
    }
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

    setActivities(prev => [newActivity, ...prev].slice(0, 50));

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
      setActivities(prev => prev.filter(a => a.id !== newActivity.id)); 
      return;
    }

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
    syncToCloud, 
    loadFromCloud, 
    replaceAllData,
    clearAllLocalData, 
    getStatistics,
    getDashboardStats,
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