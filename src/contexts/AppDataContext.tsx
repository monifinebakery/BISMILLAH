import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { RecipeIngredient, Recipe } from '@/types/recipe';
import { Supplier } from '@/types/supplier';
import { Order, NewOrder, OrderItem } from '@/types/order';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSupabaseSync } from '@/hooks/useSupabaseSync';
import { safeParseDate } from '@/hooks/useSupabaseSync'; // Import safeParseDate

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

export interface FinancialTransaction {
  id: string;
  tanggal: Date;
  jenis: 'pemasukan' | 'pengeluaran';
  deskripsi: string;
  jumlah: number;
  user_id?: string;
  createdAt?: Date;
  updatedAt?: Date;
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
  addFinancialTransaction: (transaction: Omit<FinancialTransaction, 'id'>) => Promise<boolean>;
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
          tanggalPembelian: safeParseDate(item.tanggalPembelian),
        }));
      }
      if (key === STORAGE_KEYS.FINANCIAL_TRANSACTIONS) {
        return parsed.map((item: any) => ({
          ...item,
          tanggal: safeParseDate(item.tanggal) || new Date(),
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
        items: [{ id: 1, nama: 'Kue Coklat', quantity: 2, hargaSatuan: 50000, totalHarga: 100000 }],
        subtotal: 100000,
        pajak: 10000,
        totalPesanan: 110000,
        status: 'pending',
        catatan: 'Kirim sebelum jam 5 sore',
      },
      {
        id: generateUUID(),
        nomorPesanan: 'ORD-002',
        tanggal: new Date('2024-12-27'),
        namaPelanggan: 'Jane Smith',
        emailPelanggan: 'jane@example.com',
        teleponPelanggan: '081234567891',
        alamatPelanggan: 'Jl. Sudirman No. 456, Jakarta',
        items: [{ id: 1, nama: 'Roti Tawar', quantity: 5, hargaSatuan: 15000, totalHarga: 75000 }],
        subtotal: 75000,
        pajak: 7500,
        totalPesanan: 82500,
        status: 'confirmed',
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
        orders.length <= 2 &&
        assets.length === 0 &&
        financialTransactions.length === 0
      ) {
        console.log('Local data appears empty, attempting to load from cloud...');
        const loadedData = await externalLoadFromCloud();
        if (loadedData) replaceAllData(loadedData);
      }
    };

    const timer = setTimeout(checkAndLoadFromCloud, 1000);
    return () => clearTimeout(timer);
  }, [cloudSyncEnabled, externalLoadFromCloud, bahanBaku, suppliers, purchases, recipes, orders, assets, financialTransactions]);

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

  useEffect(() => {
    let channels: any[] = [];
    const setupRealtimeSubscription = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      channels.forEach(channel => supabase.removeChannel(channel));
      channels = [];

      if (!session) {
        console.log('Tidak ada sesi untuk langganan realtime.');
        return;
      }
      const userId = session.user.id;

      const tablesToSubscribe = [
        'bahan_baku', 'suppliers', 'purchases', 'hpp_recipes', 'hpp_results',
        'orders', 'activities', 'assets', 'financial_transactions', 'user_settings',
      ];

      for (const tableName of tablesToSubscribe) {
        const channel = supabase
          .channel(`public:${tableName}_changes_${userId}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: tableName, filter: `user_id=eq.${userId}` },
            (payload) => {
              console.log(`Perubahan realtime terdeteksi di ${tableName}:`, payload);
              externalLoadFromCloud().then(loadedData => {
                if (loadedData) replaceAllData(loadedData);
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
          if (loadedData) replaceAllData(loadedData);
        });
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [externalLoadFromCloud]);

  const syncToCloud = async (): Promise<boolean> => {
    if (!cloudSyncEnabled) return false;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Gagal sinkronisasi: Pengguna tidak terautentikasi.');
        return false;
      }

      const transformedPayload = {
        bahanBaku: bahanBaku.map(item => ({
          id: item.id,
          nama: item.nama,
          kategori: item.kategori,
          stok: item.stok,
          satuan: item.satuan,
          minimum: item.minimum,
          harga_satuan: item.hargaSatuan,
          supplier: item.supplier,
          tanggal_kadaluwarsa: item.tanggalKadaluwarsa?.toISOString() || null,
          user_id: session.user.id,
          created_at: item.createdAt?.toISOString(),
          updated_at: item.updatedAt?.toISOString(),
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
          catatan: item.catatan,
          user_id: session.user.id,
          created_at: item.createdAt?.toISOString(),
          updated_at: item.updatedAt?.toISOString(),
        })),
        purchases: purchases.map(item => ({
          id: item.id,
          tanggal: item.tanggal.toISOString(),
          supplier: item.supplier,
          items: item.items,
          total_nilai: item.totalNilai,
          metode_perhitungan: item.metodePerhitungan,
          catatan: item.catatan,
          user_id: session.user.id,
          created_at: item.createdAt?.toISOString(),
          updated_at: item.updatedAt?.toISOString(),
        })),
        recipes: recipes.map(item => ({
          id: item.id,
          nama_resep: item.namaResep,
          deskripsi: item.deskripsi,
          porsi: item.porsi,
          ingredients: item.ingredients,
          biaya_tenaga_kerja: item.biayaTenagaKerja,
          biaya_overhead: item.biayaOverhead,
          total_hpp: item.totalHPP,
          hpp_per_porsi: item.hppPerPorsi,
          margin_keuntungan: item.marginKeuntungan,
          harga_jual_per_porsi: item.hargaJualPerPorsi,
          category: item.category,
          user_id: session.user.id,
          created_at: item.createdAt?.toISOString(),
          updated_at: item.updatedAt?.toISOString(),
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
          created_at: item.timestamp.toISOString(),
          user_id: session.user.id,
        })),
        activities: activities.map(item => ({
          id: item.id,
          title: item.title,
          description: item.description,
          type: item.type,
          value: item.value,
          created_at: item.timestamp.toISOString(),
          user_id: session.user.id,
        })),
        orders: orders.map(item => ({
          id: item.id,
          nomor_pesanan: item.nomorPesanan,
          tanggal: item.tanggal.toISOString(),
          nama_pelanggan: item.namaPelanggan,
          email_pelanggan: item.emailPelanggan,
          telepon_pelanggan: item.teleponPelanggan,
          alamat_pengiriman: item.alamatPelanggan,
          items: item.items,
          subtotal: item.subtotal,
          pajak: item.pajak,
          total_pesanan: item.totalPesanan,
          status: item.status,
          catatan: item.catatan,
          user_id: session.user.id,
          created_at: item.createdAt?.toISOString(),
          updated_at: item.updatedAt?.toISOString(),
        })),
        assets: assets.map(item => ({
          id: item.id,
          nama: item.nama,
          jenis: item.jenis,
          nilai_awal: item.nilai,
          umur_manfaat: item.umurManfaat,
          tanggal_pembelian: item.tanggalPembelian.toISOString(),
          penyusutan_per_bulan: item.penyusutanPerBulan,
          nilai_sekarang: item.nilaiSaatIni,
          user_id: session.user.id,
          created_at: item.createdAt?.toISOString(),
          updated_at: item.updatedAt?.toISOString(),
        })),
        financialTransactions: financialTransactions.map(item => ({
          id: item.id,
          tanggal: item.tanggal.toISOString(),
          type: item.jenis,
          deskripsi: item.deskripsi,
          amount: item.jumlah,
          user_id: session.user.id,
          created_at: item.createdAt?.toISOString(),
          updated_at: item.updatedAt?.toISOString(),
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
    if (!cloudSyncEnabled) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const loadedData = await externalLoadFromCloud();
      if (loadedData) replaceAllData(loadedData);
      toast.success('Data berhasil dimuat dari cloud!');
    } catch (error) {
      console.error('Load from cloud failed:', error);
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
    if (data.orders) setOrders(data.orders);
    if (data.assets) setAssets(data.assets);
    if (data.financialTransactions) setFinancialTransactions(data.financialTransactions);
    console.log("User settings will be loaded by useUserSettings hook directly.");
  };

  const addBahanBaku = async (bahan: Omit<BahanBaku, 'id'>) => {
    const newBahan: BahanBaku = {
      ...bahan,
      id: generateUUID(),
      userId: (await supabase.auth.getSession()).data.session?.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const bahanToInsert = {
      id: newBahan.id,
      nama: newBahan.nama,
      kategori: newBahan.kategori,
      stok: newBahan.stok,
      satuan: newBahan.satuan,
      harga_satuan: newBahan.hargaSatuan,
      minimum: newBahan.minimum,
      supplier: newBahan.supplier,
      tanggal_kadaluwarsa: newBahan.tanggalKadaluwarsa?.toISOString() || null,
      user_id: newBahan.userId,
      created_at: newBahan.createdAt?.toISOString(),
      updated_at: newBahan.updatedAt?.toISOString(),
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

    setBahanBaku(prev => [...prev, newBahan]);
    await syncToCloud();
    addActivity({
      title: 'Bahan Baku Ditambahkan',
      description: `${bahan.nama} telah ditambahkan ke gudang`,
      type: 'stok',
    });
    toast.success(`${bahan.nama} berhasil ditambahkan!`);
    return true;
  };

  const updateBahanBaku = async (id: string, updatedBahan: Partial<BahanBaku>) => {
    const bahanToUpdate: Partial<any> = {
      updated_at: new Date().toISOString(),
    };

    if (updatedBahan.nama !== undefined) bahanToUpdate.nama = updatedBahan.nama;
    if (updatedBahan.kategori !== undefined) bahanToUpdate.kategori = updatedBahan.kategori;
    if (updatedBahan.stok !== undefined) bahanToUpdate.stok = updatedBahan.stok;
    if (updatedBahan.satuan !== undefined) bahanToUpdate.satuan = updatedBahan.satuan;
    if (updatedBahan.minimum !== undefined) bahanToUpdate.minimum = updatedBahan.minimum;
    if (updatedBahan.supplier !== undefined) bahanToUpdate.supplier = updatedBahan.supplier;
    if (updatedBahan.hargaSatuan !== undefined) bahanToUpdate.harga_satuan = updatedBahan.hargaSatuan;
    if (updatedBahan.tanggalKadaluwarsa !== undefined) {
      bahanToUpdate.tanggal_kadaluwarsa = updatedBahan.tanggalKadaluwarsa?.toISOString() || null;
    } else if (Object.prototype.hasOwnProperty.call(updatedBahan, 'tanggalKadaluwarsa') && updatedBahan.tanggalKadaluwarsa === null) {
      bahanToUpdate.tanggal_kadaluwarsa = null;
    }
    if (updatedBahan.jumlahBeliKemasan !== undefined) {
      bahanToUpdate.jumlah_beli_kemasan = updatedBahan.jumlahBeliKemasan ?? null;
    }
    if (updatedBahan.satuanKemasan !== undefined) {
      bahanToUpdate.satuan_kemasan = updatedBahan.satuanKemasan ?? null;
    }
    if (updatedBahan.hargaTotalBeliKemasan !== undefined) {
      bahanToUpdate.harga_total_beli_kemasan = updatedBahan.hargaTotalBeliKemasan ?? null;
    }

    console.log('Sending to Supabase:', bahanToUpdate);

    const { error, data } = await supabase.from('bahan_baku').update(bahanToUpdate).eq('id', id).select();

    if (error) {
      console.error('Error updating bahan baku in DB:', error);
      toast.error(`Gagal memperbarui bahan baku: ${error.message}`);
      return false;
    }

    if (data && data.length > 0) {
      const updatedItem = data[0];
      setBahanBaku(prev =>
        prev.map(item =>
          item.id === id
            ? {
                ...item,
                ...updatedBahan,
                tanggalKadaluwarsa: safeParseDate(updatedItem.tanggal_kadaluwarsa),
                hargaSatuan: parseFloat(updatedItem.harga_satuan) || 0,
                jumlahBeliKemasan: parseFloat(updatedItem.jumlah_beli_kemasan) || null,
                satuanKemasan: updatedItem.satuan_kemasan || null,
                hargaTotalBeliKemasan: parseFloat(updatedItem.harga_total_beli_kemasan) || null,
                updatedAt: safeParseDate(updatedItem.updated_at),
              }
            : item
        )
      );
    } else {
      console.warn('No data returned from Supabase update, falling back to local update');
      setBahanBaku(prev =>
        prev.map(item =>
          item.id === id ? { ...item, ...updatedBahan, updatedAt: new Date() } : item
        )
      );
    }

    await syncToCloud();
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

    setBahanBaku(prev => prev.filter(b => b.id !== id));
    await syncToCloud();
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

  const reduceStok = (nama: string, jumlah: number): boolean => {
    const bahan = getBahanBakuByName(nama);
    if (!bahan || bahan.stok < jumlah) {
      toast.error(`Stok ${nama} tidak cukup atau tidak ditemukan.`);
      return false;
    }

    updateBahanBaku(bahan.id, { stok: bahan.stok - jumlah });
    addActivity({
      title: 'Stok Berkurang',
      description: `${nama} berkurang ${jumlah} ${bahan.satuan}`,
      type: 'stok',
    });
    return true;
  };

  const addSupplier = async (supplier: Omit<Supplier, 'id'>) => {
    const newSupplier: Supplier = {
      ...supplier,
      id: generateUUID(),
      userId: (await supabase.auth.getSession()).data.session?.user.id,
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
      catatan: newSupplier.catatan,
      user_id: newSupplier.userId,
      created_at: newSupplier.createdAt?.toISOString(),
      updated_at: newSupplier.updatedAt?.toISOString(),
    };

    const { error } = await supabase.from('suppliers').insert([supplierToInsert]);
    if (error) {
      console.error('Error adding supplier to DB:', error);
      toast.error(`Gagal menambahkan supplier: ${error.message}`);
      return;
    }

    setSuppliers(prev => [...prev, newSupplier]);
    await syncToCloud();
    addActivity({
      title: 'Supplier Ditambahkan',
      description: `${supplier.nama} telah ditambahkan`,
      type: 'supplier',
    });
    toast.success(`${supplier.nama} berhasil ditambahkan!`);
  };

  const updateSupplier = async (id: string, updatedSupplier: Partial<Supplier>) => {
    const supplierToUpdate: Partial<any> = {
      ...updatedSupplier,
      updated_at: new Date().toISOString(),
    };
    if (supplierToUpdate.nama) supplierToUpdate.nama = updatedSupplier.nama;
    if (supplierToUpdate.kontak) supplierToUpdate.kontak = updatedSupplier.kontak;
    if (supplierToUpdate.email) supplierToUpdate.email = updatedSupplier.email;
    if (supplierToUpdate.telepon) supplierToUpdate.telepon = updatedSupplier.telepon;
    if (supplierToUpdate.alamat) supplierToUpdate.alamat = updatedSupplier.alamat;
    if (supplierToUpdate.catatan) supplierToUpdate.catatan = updatedSupplier.catatan;
    delete supplierToUpdate.createdAt;

    const { error } = await supabase.from('suppliers').update(supplierToUpdate).eq('id', id);
    if (error) {
      console.error('Error updating supplier in DB:', error);
      toast.error(`Gagal memperbarui supplier: ${error.message}`);
      return;
    }

    setSuppliers(prev =>
      prev.map(supplier =>
        supplier.id === id ? { ...supplier, ...updatedSupplier, updatedAt: new Date() } : supplier
      )
    );
    await syncToCloud();
    toast.success(`Supplier berhasil diperbarui!`);
  };

  const deleteSupplier = async (id: string) => {
    const supplier = suppliers.find(s => s.id === id);

    const { error } = await supabase.from('suppliers').delete().eq('id', id);
    if (error) {
      console.error('Error deleting supplier from DB:', error);
      toast.error(`Gagal menghapus supplier: ${error.message}`);
      return;
    }

    setSuppliers(prev => prev.filter(s => s.id !== id));
    await syncToCloud();
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

  const addPurchase = async (purchase: Omit<Purchase, 'id'>) => {
    const newPurchase: Purchase = {
      ...purchase,
      id: generateUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const purchaseToInsert = {
      id: newPurchase.id,
      tanggal: newPurchase.tanggal.toISOString(),
      supplier: newPurchase.supplier,
      items: newPurchase.items,
      total_nilai: newPurchase.totalNilai,
      metode_perhitungan: newPurchase.metodePerhitungan,
      catatan: newPurchase.catatan,
      user_id: (await supabase.auth.getSession()).data.session?.user.id,
      created_at: newPurchase.createdAt?.toISOString(),
      updated_at: newPurchase.updatedAt?.toISOString(),
    };

    const { error } = await supabase.from('purchases').insert([purchaseToInsert]);
    if (error) {
      console.error('Error adding purchase to DB:', error);
      toast.error(`Gagal menambahkan pembelian: ${error.message}`);
      return;
    }

    setPurchases(prev => [...prev, newPurchase]);
    await syncToCloud();

    purchase.items.forEach(item => {
      const existingBahan = getBahanBakuByName(item.namaBarang);
      if (existingBahan) {
        updateBahanBaku(existingBahan.id, {
          stok: existingBahan.stok + item.jumlah,
          hargaSatuan: item.hargaSatuan,
        });
      } else {
        addBahanBaku({
          nama: item.namaBarang,
          kategori: item.kategori,
          stok: item.jumlah,
          satuan: item.satuan,
          minimum: 10,
          hargaSatuan: item.hargaSatuan,
          supplier: purchase.supplier,
        });
      }
    });

    addActivity({
      title: 'Pembelian Ditambahkan',
      description: `Pembelian dari ${purchase.supplier} senilai Rp ${purchase.totalNilai.toLocaleString()}`,
      type: 'purchase',
    });
    toast.success(`Pembelian berhasil ditambahkan!`);
  };

  const updatePurchase = async (id: string, updatedPurchase: Partial<Purchase>) => {
    const purchaseToUpdate: Partial<any> = {
      ...updatedPurchase,
      total_nilai: updatedPurchase.totalNilai,
      metode_perhitungan: updatedPurchase.metodePerhitungan,
      updated_at: new Date().toISOString(),
    };
    if (purchaseToUpdate.totalNilai) delete purchaseToUpdate.totalNilai;
    if (purchaseToUpdate.metodePerhitungan) delete purchaseToUpdate.metodePerhitungan;
    if (purchaseToUpdate.createdAt) delete purchaseToUpdate.createdAt;

    const { error } = await supabase.from('purchases').update(purchaseToUpdate).eq('id', id);
    if (error) {
      console.error('Error updating purchase in DB:', error);
      toast.error(`Gagal memperbarui pembelian: ${error.message}`);
      return;
    }

    setPurchases(prev =>
      prev.map(purchase =>
        purchase.id === id ? { ...purchase, ...updatedPurchase, updatedAt: new Date() } : purchase
      )
    );
    await syncToCloud();
    toast.success(`Pembelian berhasil diperbarui!`);
  };

  const deletePurchase = async (id: string) => {
    const { error } = await supabase.from('purchases').delete().eq('id', id);
    if (error) {
      console.error('Error deleting purchase from DB:', error);
      toast.error(`Gagal menghapus pembelian: ${error.message}`);
      return;
    }

    setPurchases(prev => prev.filter(p => p.id !== id));
    await syncToCloud();
    toast.success(`Pembelian berhasil dihapus!`);
  };

  const addRecipe = async (recipe: Omit<Recipe, 'id'>) => {
    const newRecipe: Recipe = {
      ...recipe,
      id: generateUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const recipeToInsert = {
      id: newRecipe.id,
      nama_resep: newRecipe.namaResep,
      deskripsi: newRecipe.deskripsi,
      porsi: newRecipe.porsi,
      ingredients: newRecipe.ingredients,
      biaya_tenaga_kerja: newRecipe.biayaTenagaKerja,
      biaya_overhead: newRecipe.biayaOverhead,
      total_hpp: newRecipe.totalHPP,
      hpp_per_porsi: newRecipe.hppPerPorsi,
      margin_keuntungan: newRecipe.marginKeuntungan,
      harga_jual_per_porsi: newRecipe.hargaJualPerPorsi,
      user_id: (await supabase.auth.getSession()).data.session?.user.id,
      created_at: newRecipe.createdAt?.toISOString(),
      updated_at: newRecipe.updatedAt?.toISOString(),
      category: newRecipe.category,
    };

    const { error } = await supabase.from('hpp_recipes').insert([recipeToInsert]);
    if (error) {
      console.error('Error adding recipe to DB:', error);
      toast.error(`Gagal menambahkan resep: ${error.message}`);
      return false;
    }

    setRecipes(prev => [...prev, newRecipe]);
    await syncToCloud();
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
      ...updatedRecipe,
      nama_resep: updatedRecipe.namaResep,
      biaya_tenaga_kerja: updatedRecipe.biayaTenagaKerja,
      biaya_overhead: updatedRecipe.biayaOverhead,
      total_hpp: updatedRecipe.totalHPP,
      hpp_per_porsi: updatedRecipe.hppPerPorsi,
      margin_keuntungan: updatedRecipe.marginKeuntungan,
      harga_jual_per_porsi: updatedRecipe.hargaJualPerPorsi,
      updated_at: new Date().toISOString(),
      category: updatedRecipe.category,
    };
    delete recipeToUpdate.namaResep;
    delete recipeToUpdate.biayaTenagaKerja;
    delete recipeToUpdate.biayaOverhead;
    delete recipeToUpdate.totalHPP;
    delete recipeToUpdate.hppPerPorsi;
    delete recipeToUpdate.marginKeuntungan;
    delete recipeToUpdate.hargaJualPerPorsi;
    delete recipeToUpdate.category;

    const { error } = await supabase.from('hpp_recipes').update(recipeToUpdate).eq('id', id);
    if (error) {
      console.error('Error updating recipe in DB:', error);
      toast.error(`Gagal memperbarui resep: ${error.message}`);
      return false;
    }

    setRecipes(prev =>
      prev.map(recipe =>
        recipe.id === id ? { ...recipe, ...updatedRecipe } : recipe
      )
    );
    await syncToCloud();
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

    setRecipes(prev => prev.filter(r => r.id !== id));
    await syncToCloud();
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

  const addHPPResult = async (result: Omit<HPPResult, 'id'>) => {
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
      user_id: (await supabase.auth.getSession()).data.session?.user.id,
      created_at: newResult.createdAt?.toISOString(),
      updated_at: newResult.updatedAt?.toISOString(),
    };

    const { error } = await supabase.from('hpp_results').insert([resultToInsert]);
    if (error) {
      console.error('Error adding HPP result to DB:', error);
      toast.error(`Gagal menambahkan hasil HPP: ${error.message}`);
      return;
    }

    setHppResults(prev => [...prev, newResult]);
    await syncToCloud();
    addActivity({
      title: 'HPP Dihitung',
      description: `HPP ${result.nama} = Rp ${result.hppPerPorsi.toLocaleString()}/porsi`,
      type: 'hpp',
      value: `HPP: Rp ${result.hppPerPorsi.toLocaleString()}`,
    });
    toast.success(`Hasil HPP ${result.nama} berhasil disimpan!`);
  };

  const addHPPCalculation = (result: Omit<HPPResult, 'id'>) => {
    addHPPResult(result);
  };

  const addOrder = async (order: NewOrder) => {
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
      tanggal: newOrder.tanggal.toISOString(),
      nama_pelanggan: newOrder.namaPelanggan,
      email_pelanggan: newOrder.emailPelanggan,
      telepon_pelanggan: newOrder.teleponPelanggan,
      alamat_pengiriman: newOrder.alamatPelanggan,
      items: newOrder.items,
      subtotal: newOrder.subtotal,
      pajak: newOrder.pajak,
      total_pesanan: newOrder.totalPesanan,
      status: newOrder.status,
      catatan: newOrder.catatan,
      user_id: (await supabase.auth.getSession()).data.session?.user.id,
      created_at: newOrder.createdAt?.toISOString(),
      updated_at: newOrder.updatedAt?.toISOString(),
    };

    const { error } = await supabase.from('orders').insert([orderToInsert]);
    if (error) {
      console.error('Error adding order to DB:', error);
      toast.error(`Gagal menambahkan pesanan: ${error.message}`);
      return;
    }

    setOrders(prev => [...prev, newOrder]);
    await syncToCloud();
    addActivity({
      title: 'Pesanan Baru',
      description: `Pesanan ${newOrder.nomorPesanan} dari ${newOrder.namaPelanggan}`,
      type: 'purchase',
    });
    toast.success(`Pesanan ${newOrder.nomorPesanan} berhasil ditambahkan!`);
  };

  const updateOrder = async (id: string, updatedOrder: Partial<Order>): Promise<boolean> => {
    const orderToUpdate: Partial<any> = {
      ...updatedOrder,
      nomor_pesanan: updatedOrder.nomorPesanan,
      nama_pelanggan: updatedOrder.namaPelanggan,
      email_pelanggan: updatedOrder.emailPelanggan,
      telepon_pelanggan: updatedOrder.teleponPelanggan,
      alamat_pengiriman: updatedOrder.alamatPelanggan,
      total_pesanan: updatedOrder.totalPesanan,
      updated_at: new Date().toISOString(),
    };
    delete orderToUpdate.nomorPesanan;
    delete orderToUpdate.namaPelanggan;
    delete orderToUpdate.emailPelanggan;
    delete orderToUpdate.teleponPelanggan;
    delete orderToUpdate.alamatPelanggan;
    delete orderToUpdate.totalPesanan;
    if (orderToUpdate.createdAt) delete orderToUpdate.createdAt;
    if (updatedOrder.tanggal !== undefined) {
      orderToUpdate.tanggal = updatedOrder.tanggal.toISOString();
    }

    const { error } = await supabase.from('orders').update(orderToUpdate).eq('id', id);
    if (error) {
      console.error('Error updating order in DB:', error);
      toast.error(`Gagal memperbarui pesanan: ${error.message}`);
      return false;
    }

    setOrders(prev =>
      prev.map(order =>
        order.id === id ? { ...order, ...updatedOrder, updatedAt: new Date() } : order
      )
    );
    await syncToCloud();

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

    setOrders(prev => prev.filter(o => o.id !== id));
    await syncToCloud();
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

  const addActivity = async (activity: Omit<Activity, 'id' | 'timestamp'>) => {
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
      value: newActivity.value,
      user_id: (await supabase.auth.getSession()).data.session?.user.id,
      created_at: newActivity.createdAt?.toISOString(),
      updated_at: newActivity.updatedAt?.toISOString(),
    };

    const { error } = await supabase.from('activities').insert([activityToInsert]);
    if (error) {
      console.error('Error adding activity to DB:', error);
      toast.error(`Gagal menambahkan aktivitas: ${error.message}`);
      return;
    }

    setActivities(prev => [newActivity, ...prev].slice(0, 50));
    await syncToCloud();
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