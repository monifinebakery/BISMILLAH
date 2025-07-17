import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { RecipeIngredient, Recipe } from '@/types/recipe';
import { Supplier } from '@/types/supplier';
import { Order, NewOrder, OrderItem } from '@/types/order';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSupabaseSync, safeParseDate } from '@/hooks/useSupabaseSync'; // MODIFIED: Import useSupabaseSync hook dan safeParseDate

// Interface BahanBaku (diasumsikan sudah sesuai dengan src/types/recipe.ts dan diskusi sebelumnya)
export interface BahanBaku {
  id: string;
  nama: string;
  kategori: string;
  stok: number;
  satuan: string;
  hargaSatuan: number;
  minimum: number;
  supplier: string;
  tanggalKadaluwarsa?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  jumlahBeliKemasan?: number | null;
  satuanKemasan?: string | null;
  hargaTotalBeliKemasan?: number | null;
}

// Interface Purchase (diasumsikan sudah sesuai)
export interface Purchase {
  id: string;
  tanggal: Date;
  supplier: string;
  items: {
    namaBarang: string;
    kategori: string;
    jumlah: number;
    satuan: string;
    hargaSatuan: number;
    totalHarga: number;
  }[];
  totalNilai: number;
  status: 'pending' | 'completed' | 'cancelled';
  metodePerhitungan: 'FIFO' | 'LIFO' | 'Average';
  catatan?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface Activity (diasumsikan sudah sesuai)
export interface Activity {
  id: string;
  title: string;
  description: string;
  timestamp: Date;
  type: 'hpp' | 'stok' | 'resep' | 'purchase' | 'supplier';
  value?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface HPPResult (diasumsikan sudah sesuai)
export interface HPPResult {
  id: string;
  nama: string;
  ingredients: RecipeIngredient[];
  biayaTenagaKerja: number;
  biayaOverhead: number;
  marginKeuntungan: number;
  totalHPP: number;
  hppPerPorsi: number;
  hargaJualPerPorsi: number;
  jumlahPorsi: number;
  timestamp: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface Asset (diasumsikan sudah sesuai)
export interface Asset {
  id: string;
  nama: string;
  jenis: string;
  nilai: number;
  umurManfaat: number;
  tanggalPembelian: Date;
  penyusutanPerBulan: number;
  nilaiSaatIni: number;
  user_id?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface FinancialTransaction (diasumsikan sudah sesuai)
export interface FinancialTransaction {
  id: string;
  user_id: string;
  type: 'pemasukan' | 'pengeluaran';
  category: string;
  amount: number;
  description: string;
  date: Date;
  created_at: Date;
  updated_at: Date;
}


interface AppDataContextType {
  bahanBaku: BahanBaku[];
  addBahanBaku: (bahan: Omit<BahanBaku, 'id'>) => Promise<boolean>;
  updateBahanBaku: (id: string, bahan: Partial<BahanBaku>) => Promise<boolean>;
  deleteBahanBaku: (id: string) => Promise<boolean>;
  getBahanBakuByName: (nama: string) => BahanBaku | undefined;
  reduceStok: (nama: string, jumlah: number) => boolean;

  suppliers: Supplier[];
  addSupplier: (supplier: Omit<Supplier, 'id'>) => Promise<void>;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;

  purchases: Purchase[];
  addPurchase: (purchase: Omit<Purchase, 'id'>) => Promise<void>;
  updatePurchase: (id: string, purchase: Partial<Purchase>) => Promise<void>;
  deletePurchase: (id: string) => Promise<void>;

  recipes: Recipe[];
  addRecipe: (recipe: Omit<Recipe, 'id'>) => Promise<boolean>;
  updateRecipe: (id: string, recipe: Partial<Recipe>) => Promise<boolean>;
  deleteRecipe: (id: string) => Promise<boolean>;

  hppResults: HPPResult[];
  addHPPResult: (result: Omit<HPPResult, 'id'>) => Promise<void>;
  addHPPCalculation: (result: Omit<HPPResult, 'id'>) => void;

  activities: Activity[];
  addActivity: (activity: Omit<Activity, 'id' | 'timestamp'>) => Promise<void>;

  orders: Order[];
  addOrder: (order: NewOrder) => Promise<void>;
  updateOrder: (id: string, order: Partial<Order>) => Promise<boolean>;
  deleteOrder: (id: string) => Promise<boolean>;
  updateOrderStatus: (id: string, status: Order['status']) => void;

  assets: Asset[];
  addAsset: (asset: Omit<Asset, 'id'>) => Promise<boolean>;
  updateAsset: (id: string, asset: Partial<Asset>) => Promise<boolean>;
  deleteAsset: (id: string) => Promise<boolean>;

  financialTransactions: FinancialTransaction[];
  addFinancialTransaction: (transaction: Omit<FinancialTransaction, 'id' | 'created_at' | 'updated_at'>) => Promise<boolean>;
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
  PRIMARY_RECIPES: 'hpp_app_primary_recipes',
  HPP_RESULTS: 'hpp_app_hpp_results',
  ACTIVITIES: 'hpp_app_activities',
  ORDERS: 'hpp_app_orders',
  CLOUD_SYNC: 'hpp_app_cloud_sync',
  ASSETS: 'hpp_app_assets',
  FINANCIAL_TRANSACTIONS: 'hpp_app_financial_transactions',
};

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

const loadFromStorage = (key: string, defaultValue: any = []) => {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Convert date strings back to Date objects for activities
      if (key === STORAGE_KEYS.ACTIVITIES || key === STORAGE_KEYS.HPP_RESULTS) {
        return parsed.map((item: any) => ({
          ...item,
          timestamp: safeParseDate(item.timestamp),
        }));
      }
      if (key === STORAGE_KEYS.PURCHASES) {
        return parsed.map((item: any) => ({
          ...item,
          tanggal: safeParseDate(item.tanggal),
        }));
      }
      if (key === STORAGE_KEYS.BAHAN_BAKU) {
        return parsed.map((item: any) => ({
          ...item,
          tanggalKadaluwarsa: safeParseDate(item.tanggalKadaluwarsa),
        }));
      }
      if (key === STORAGE_KEYS.ORDERS) {
        return parsed.map((item: any) => ({ ...item, tanggal: safeParseDate(item.tanggal) || new Date() }));
      }
      if (key === STORAGE_KEYS.ASSETS) {
        return parsed.map((item: any) => ({
          ...item,
          tanggalBeli: safeParseDate(item.tanggalBeli),
        }));
      }
      if (key === STORAGE_KEYS.FINANCIAL_TRANSACTIONS) {
        return parsed.map((item: any) => ({
          ...item,
          date: safeParseDate(item.date) || new Date(),
          created_at: safeParseDate(item.created_at) || new Date(),
          updated_at: safeParseDate(item.updated_at) || new Date(),
        }));
      }
      return parsed;
    }
    return defaultValue;
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return defaultValue;
  }
};

// NEW: Helper function to safely convert Date or string to ISO string for DB.
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


export const AppDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const {
    syncToSupabase: externalSyncToCloud,
    loadFromSupabase: externalLoadFromCloud,
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
        tanggal: new Date('2024-12-28'),
        namaPelanggan: 'John Doe',
        emailPelanggan: 'john@example.com',
        teleponPelanggan: '081234567890',
        alamatPelanggan: 'Jl. Merdeka No. 123, Jakarta',
        items: [
          {
            id: 1,
            nama: 'Kue Coklat',
            quantity: 2,
            hargaSatuan: 50000,
            totalHarga: 100000
          }
        ],
        subtotal: 100000,
        pajak: 10000,
        totalPesanan: 110000,
        status: 'pending',
        catatan: 'Kirim sebelum jam 5 sore'
      },
      {
        id: generateUUID(),
        nomorPesanan: 'ORD-002',
        tanggal: new Date('2024-12-27'),
        namaPelanggan: 'Jane Smith',
        emailPelanggan: 'jane@example.com',
        teleponPelanggan: '081234567891',
        alamatPelanggan: 'Jl. Sudirman No. 456, Jakarta',
        items: [
          {
            id: 1,
            nama: 'Roti Tawar',
            quantity: 5,
            hargaSatuan: 15000,
            totalHarga: 75000
          }
        ],
        subtotal: 75000,
        pajak: 7500,
        totalPesanan: 82500,
        status: 'confirmed'
      }
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
          orders.length <= 2 &&
          assets.length === 0 &&
          financialTransactions.length === 0
          ) {
        console.log('Local data appears empty, attempting to load from cloud...');
        const loadedData = await externalLoadFromCloud();
        if (loadedData) {
          replaceAllData(loadedData);
        }
      }
    };

    const timer = setTimeout(checkAndLoadFromCloud, 1000);
    return () => clearTimeout(timer);
  }, [cloudSyncEnabled, externalLoadFromCloud, bahanBaku, suppliers, purchases, recipes, orders, assets, financialTransactions]);


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

  useEffect(() => {
    let channels: any[] = [];

    const setupRealtimeSubscription = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      channels.forEach(channel => supabase.removeChannel(channel));
      channels = []; // Reset channels array

      if (!session) {
        console.log('Tidak ada sesi untuk langganan realtime.');
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
              externalLoadFromCloud().then(loadedData => {
                if (loadedData) {
                  replaceAllData(loadedData);
                }
              });
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
    };
  }, [externalLoadFromCloud]);


  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Tab aplikasi terlihat, memeriksa pembaruan...');
        externalLoadFromCloud().then(loadedData => {
          if (loadedData) {
            replaceAllData(loadedData);
          }
        });
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [externalLoadFromCloud]);


  const syncToCloud = async (): Promise<boolean> => {
    if (!cloudSyncEnabled) return false;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Gagal sinkronisasi: Pengguna tidak terautentikasi.');
        return false;
      }

      console.log('Syncing to cloud...');

      const transformedPayload = {
        bahanBaku: bahanBaku.map(item => ({
          id: item.id, nama: item.nama, kategori: item.kategori, stok: item.stok, satuan: item.satuan,
          minimum: item.minimum, harga_satuan: item.hargaSatuan, supplier: item.supplier,
          tanggal_kadaluwarsa: toSafeISOString(item.tanggalKadaluwarsa), user_id: session.user.id,
          created_at: toSafeISOString(item.createdAt), updated_at: toSafeISOString(item.updatedAt),
          jumlah_beli_kemasan: item.jumlahBeliKemasan ?? null,
          satuan_kemasan: item.satuanKemasan ?? null,
          harga_total_beli_kemasan: item.hargaTotalBeliKemasan ?? null,
        })),
        suppliers: suppliers.map(item => ({
          id: item.id, nama: item.nama, kontak: item.kontak, email: item.email, telepon: item.telepon,
          alamat: item.alamat, catatan: item.catatan, user_id: session.user.id,
          created_at: toSafeISOString(item.createdAt), updated_at: toSafeISOString(item.updatedAt),
        })),
        purchases: purchases.map(item => ({
          id: item.id, tanggal: toSafeISOString(item.tanggal), supplier: item.supplier, items: item.items,
          total_nilai: item.totalNilai, metode_perhitungan: item.metodePerhitungan, catatan: item.catatan,
          user_id: session.user.id, created_at: toSafeISOString(item.createdAt), updated_at: toSafeISOString(item.updatedAt),
        })),
        recipes: recipes.map(item => ({
          id: item.id, nama_resep: item.namaResep, deskripsi: item.deskripsi, porsi: item.porsi,
          ingredients: item.ingredients, biaya_tenaga_kerja: item.biayaTenagaKerja,
          biaya_overhead: item.biayaOverhead, total_hpp: item.totalHPP, hpp_per_porsi: item.hppPerPorsi,
          margin_keuntungan: item.marginKeuntungan, harga_jual_per_porsi: item.hargaJualPerPorsi,
          category: item.category,
          user_id: session.user.id, created_at: toSafeISOString(item.createdAt), updated_at: toSafeISOString(item.updatedAt),
        })),
        hppResults: hppResults.map(item => ({
          id: item.id, nama: item.nama, ingredients: item.ingredients,
          biaya_tenaga_kerja: item.biayaTenagaKerja, biaya_overhead: item.biayaOverhead,
          margin_keuntungan: item.marginKeuntungan, total_hpp: item.totalHPP, hpp_per_porsi: item.hppPerPorsi,
          harga_jual_per_porsi: item.hargaJualPerPorsi, jumlah_porsi: item.jumlahPorsi,
          created_at: toSafeISOString(item.createdAt), user_id: session.user.id,
        })),
        activities: activities.map(item => ({
          id: item.id, title: item.title, description: item.description, type: item.type, value: item.value,
          created_at: toSafeISOString(item.createdAt), user_id: session.user.id,
        })),
        orders: orders.map(item => ({
          id: item.id, nomor_pesanan: item.nomorPesanan, tanggal: toSafeISOString(item.tanggal),
          nama_pelanggan: item.namaPelanggan, email_pelanggan: item.emailPelanggan,
          telepon_pelanggan: item.teleponPelanggan, alamat_pengiriman: item.alamatPelanggan,
          items: item.items, subtotal: item.subtotal, pajak: item.pajak,
          total_pesanan: item.totalPesanan, status: item.status, catatan: item.catatan, user_id: session.user.id,
          created_at: toSafeISOString(item.createdAt), updated_at: toSafeISOString(item.updatedAt),
        })),
        assets: assets.map(item => ({
          id: item.id, nama: item.nama, jenis: item.jenis, nilai_awal: item.nilai, // Changed from nilai to nilai_awal
          umur_manfaat: item.umurManfaat, tanggal_pembelian: toSafeISOString(item.tanggalPembelian),
          penyusutan_per_bulan: item.penyusutanPerBulan, nilai_sekarang: item.nilaiSaatIni, // Changed from nilaiSaatIni to nilai_sekarang
          user_id: session.user.id, created_at: toSafeISOString(item.createdAt), updated_at: toSafeISOString(item.updatedAt),
        })),
        financialTransactions: financialTransactions.map(item => ({
          id: item.id, user_id: item.user_id, // Add user_id
          type: item.type, category: item.category, amount: item.amount, description: item.description,
          tanggal: toSafeISOString(item.tanggal), // Changed from date to tanggal
          created_at: toSafeISOString(item.created_at), updated_at: toSafeISOString(item.updatedAt),
        })),
      };

      const success = await externalSyncToCloud(transformedPayload);
      if (!success) return false;
      console.log('Sync successful, data is now on cloud.');
      return true;
    } catch (error: any) {
      console.error('Sync to cloud failed:', error);
      toast.error(`Gagal sinkronisasi ke cloud: ${error.message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const loadFromCloud = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Anda harus login untuk memuat data');
        return;
      }

      console.log('Loading data from Supabase...');

      const [bahanBakuRes, suppliersRes, purchasesRes, recipesRes, hppResultsRes, activitiesRes, ordersRes, assetsRes, financialTransactionsRes, settingsRes] = await Promise.all([
        supabase.from('bahan_baku').select('*').eq('user_id', session.user.id),
        supabase.from('suppliers').select('*').eq('user_id', session.user.id),
        supabase.from('purchases').select('*').eq('user_id', session.user.id),
        supabase.from('hpp_recipes').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }),
        supabase.from('hpp_results').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }),
        supabase.from('activities').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }).limit(50),
        supabase.from('orders').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }),
        supabase.from('assets').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }),
        supabase.from('financial_transactions').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }),
        supabase.from('user_settings').select('*').eq('user_id', session.user.id).maybeSingle()
      ]);

      if (bahanBakuRes.error) throw bahanBakuRes.error;
      if (suppliersRes.error) throw suppliersRes.error;
      if (purchasesRes.error) throw purchasesRes.error;
      if (recipesRes.error) throw recipesRes.error;
      if (hppResultsRes.error) throw hppResultsRes.error;
      if (activitiesRes.error) throw activitiesRes.error;
      if (ordersRes.error) throw ordersRes.error;
      if (assetsRes.error) throw assetsRes.error;
      if (financialTransactionsRes.error) throw financialTransactionsRes.error;

      let userSettingsData = null;
      if (settingsRes.data && !settingsRes.error) {
        userSettingsData = {
          businessName: settingsRes.data.business_name,
          ownerName: settingsRes.data.owner_name,
          email: settingsRes.data.email,
          phone: settingsRes.data.phone,
          address: settingsRes.data.address,
          currency: settingsRes.data.currency,
          language: settingsRes.data.language,
          notifications: settingsRes.data.notifications,
          backup: settingsRes.data.backup_settings,
          security: settingsRes.data.security_settings,
          recipeCategories: settingsRes.data.recipe_categories || [],
          financialCategories: settingsRes.data.financial_categories || defaultSettings.financialCategories,
        };
      } else if (settingsRes.error && settingsRes.error.code !== 'PGRST116') {
        console.error('Error loading user settings:', settingsRes.error);
        toast.error(`Gagal memuat pengaturan pengguna: ${settingsRes.error.message}`);
      }

      const cloudData: LoadedData = {
        bahanBaku: bahanBakuRes.data?.map((item: any) => ({
          id: item.id,
          nama: item.nama,
          kategori: item.kategori || '', // MODIFIED
          stok: parseFloat(item.stok) || 0,
          satuan: item.satuan || '', // MODIFIED
          minimum: parseFloat(item.minimum) || 0,
          hargaSatuan: parseFloat(item.harga_satuan) || 0,
          supplier: item.supplier || '',
          tanggalKadaluwarsa: safeParseDate(item.tanggal_kadaluwarsa),
          user_id: item.user_id,
          createdAt: safeParseDate(item.created_at),
          updatedAt: safeParseDate(item.updated_at),
          jumlahBeliKemasan: parseFloat(item.jumlah_beli_kemasan) || 0, // MODIFIED || 0
          satuanKemasan: item.satuan_kemasan || '', // MODIFIED || ''
          hargaTotalBeliKemasan: parseFloat(item.harga_total_beli_kemasan) || 0, // MODIFIED || 0
        })) || [],
        suppliers: suppliersRes.data?.map((item: any) => ({
          id: item.id,
          nama: item.nama,
          kontak: item.kontak || '', // MODIFIED
          email: item.email || '', // MODIFIED
          telepon: item.telepon || '', // MODIFIED
          alamat: item.alamat || '', // MODIFIED
          catatan: item.catatan || '', // MODIFIED
          user_id: item.user_id,
          createdAt: safeParseDate(item.created_at),
          updatedAt: safeParseDate(item.updated_at),
        })) || [],
        purchases: purchasesRes.data?.map((item: any) => ({
          id: item.id,
          tanggal: safeParseDate(item.tanggal),
          supplier: item.supplier || '', // MODIFIED
          items: item.items || [],
          totalNilai: parseFloat(item.total_nilai) || 0,
          status: item.status || '', // MODIFIED
          metodePerhitungan: item.metode_perhitungan || '', // MODIFIED
          catatan: item.catatan || '', // MODIFIED
          user_id: item.user_id,
          createdAt: safeParseDate(item.created_at),
          updatedAt: safeParseDate(item.updated_at),
        })) || [],
        recipes: recipesRes.data?.map((item: any) => ({
          id: item.id,
          namaResep: item.nama_resep || '', // MODIFIED
          deskripsi: item.deskripsi || '', // MODIFIED
          porsi: parseFloat(item.porsi) || 0, // MODIFIED
          ingredients: item.ingredients || [],
          biayaTenagaKerja: parseFloat(item.biaya_tenaga_kerja) || 0,
          biayaOverhead: parseFloat(item.biaya_overhead) || 0,
          totalHPP: parseFloat(item.total_hpp) || 0,
          hppPerPorsi: parseFloat(item.hpp_per_porsi) || 0,
          marginKeuntungan: parseFloat(item.margin_keuntungan) || 0,
          hargaJualPerPorsi: parseFloat(item.harga_jual_per_porsi) || 0,
          category: item.category || '', // MODIFIED
          user_id: item.user_id,
          createdAt: safeParseDate(item.created_at),
          updatedAt: safeParseDate(item.updated_at),
        })) || [],
        hppResults: hppResultsRes.data?.map((item: any) => ({
          id: item.id,
          nama: item.nama || '', // MODIFIED
          ingredients: item.ingredients || [],
          biayaTenagaKerja: parseFloat(item.biaya_tenaga_kerja) || 0,
          biayaOverhead: parseFloat(item.biaya_overhead) || 0,
          marginKeuntungan: parseFloat(item.margin_keuntungan) || 0,
          totalHPP: parseFloat(item.total_hpp) || 0,
          hppPerPorsi: parseFloat(item.hpp_per_porsi) || 0,
          hargaJualPerPorsi: parseFloat(item.harga_jual_per_porsi) || 0,
          jumlahPorsi: item.jumlah_porsi || 1,
          timestamp: safeParseDate(item.created_at),
          user_id: item.user_id,
          createdAt: safeParseDate(item.created_at),
          updatedAt: safeParseDate(item.updated_at),
        })) || [],
        activities: activitiesRes.data?.map((item: any) => ({
          id: item.id,
          title: item.title || '', // MODIFIED
          description: item.description || '', // MODIFIED
          type: item.type || '', // MODIFIED
          value: item.value || '', // MODIFIED
          timestamp: safeParseDate(item.created_at),
          user_id: item.user_id,
          createdAt: safeParseDate(item.created_at),
          updatedAt: safeParseDate(item.updated_at),
        })) || [],
        orders: ordersRes.data?.map((item: any) => ({
          id: item.id,
          nomorPesanan: item.nomor_pesanan || '', // MODIFIED
          tanggal: safeParseDate(item.tanggal),
          namaPelanggan: item.nama_pelanggan || '', // MODIFIED
          emailPelanggan: item.email_pelanggan || '', // MODIFIED
          teleponPelanggan: item.telepon_pelanggan || '', // MODIFIED
          alamatPelanggan: item.alamat_pengiriman || '', // MODIFIED
          items: item.items || [],
          subtotal: parseFloat(item.subtotal) || 0,
          pajak: parseFloat(item.pajak) || 0,
          totalPesanan: parseFloat(item.total_pesanan) || 0,
          status: item.status || '', // MODIFIED
          catatan: item.catatan || '', // MODIFIED
          user_id: item.user_id,
          createdAt: safeParseDate(item.created_at),
          updatedAt: safeParseDate(item.updated_at),
        })) || [],
        assets: assetsRes.data?.map((item: any) => ({
          id: item.id,
          nama: item.nama || '', // MODIFIED
          kategori: item.kategori || '', // MODIFIED (Changed from jenis to kategori)
          nilaiAwal: parseFloat(item.nilai_awal) || 0,
          nilaiSekarang: parseFloat(item.nilai_sekarang) || 0,
          tanggalBeli: safeParseDate(item.tanggal_beli), // Changed from tanggal_pembelian
          kondisi: item.kondisi || '', // MODIFIED
          lokasi: item.lokasi || '', // MODIFIED
          deskripsi: item.deskripsi || '', // MODIFIED
          depresiasi: parseFloat(item.depresiasi) || 0, // MODIFIED || 0 (from || null)
          user_id: item.user_id,
          createdAt: safeParseDate(item.created_at),
          updatedAt: safeParseDate(item.updated_at),
        })) || [],
        financialTransactions: financialTransactionsRes.data?.map((item: any) => ({
          id: item.id,
          tanggal: safeParseDate(item.tanggal),
          jenis: item.type || '', // MODIFIED (Changed from type to jenis)
          deskripsi: item.description || '', // MODIFIED (Changed from deskripsi)
          jumlah: parseFloat(item.amount) || 0,
          user_id: item.user_id,
          createdAt: safeParseDate(item.created_at),
          updatedAt: safeParseDate(item.updated_at),
          category: item.category || '', // Assuming category exists in DB
        })) || [],
        userSettings: userSettingsData,
      };

      console.log('Data loaded from cloud:', cloudData);
      toast.success('Data berhasil dimuat dari cloud');
      return cloudData;
    } catch (error: any) {
      console.error('Load error:', error);
      toast.error('Gagal memuat data dari cloud');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const getCloudStats = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      const [bahanBakuRes, suppliersRes, purchasesRes, recipesRes, hppResultsRes, ordersRes, assetsRes, financialTransactionsRes] = await Promise.all([
        supabase.from('bahan_baku').select('*', { count: 'exact', head: true }).eq('user_id', session.user.id),
        supabase.from('suppliers').select('*', { count: 'exact', head: true }).eq('user_id', session.user.id),
        supabase.from('purchases').select('*', { count: 'exact', head: true }).eq('user_id', session.user.id),
        supabase.from('hpp_recipes').select('*', { count: 'exact', head: true }).eq('user_id', session.user.id),
        supabase.from('hpp_results').select('*', { count: 'exact', head: true }).eq('user_id', session.user.id),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('user_id', session.user.id),
        supabase.from('assets').select('*', { count: 'exact', head: true }).eq('user_id', session.user.id),
        supabase.from('financial_transactions').select('*', { count: 'exact', head: true }).eq('user_id', session.user.id)
      ]);

      return {
        totalBahanBaku: bahanBakuRes.count || 0,
        totalSuppliers: suppliersRes.count || 0,
        totalPurchases: purchasesRes.count || 0,
        totalRecipes: recipesRes.count || 0,
        totalHppResults: hppResultsRes.count || 0,
        totalOrders: ordersRes.count || 0,
        totalAssets: assetsRes.count || 0,
        totalFinancialTransactions: financialTransactionsRes.count || 0,
      };
    } catch (error: any) {
      console.error('Stats error:', error);
      return null;
    }
  };

  return {
    syncToSupabase,
    loadFromSupabase,
    getCloudStats,
    isLoading
  };
};

export const useAppData = () => {
  const context = useContext(AppDataContext);
  if (context === undefined) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
};
