import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { RecipeIngredient, Recipe } from '@/types/recipe';
import { Supplier } from '@/types/supplier';
import { Order, NewOrder, OrderItem } from '@/types/order';
import { supabase } from '@/integrations/supabase/client'; // Import supabase client
import { toast } from 'sonner'; // Import toast for notifications

// MODIFIED: BahanBaku interface tetap camelCase, ini adalah representasi data di aplikasi/state
export interface BahanBaku {
  id: string;
  nama: string;
  kategori: string;
  stok: number;
  satuan: string;
  hargaSatuan: number; // Tetap camelCase di interface
  minimum: number;
  supplier: string;
  tanggalKadaluwarsa?: Date; // Tetap camelCase di interface
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
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  timestamp: Date;
  type: 'hpp' | 'stok' | 'resep' | 'purchase' | 'supplier';
  value?: string;
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
}

interface AppDataContextType {
  // Bahan Baku
  bahanBaku: BahanBaku[];
  addBahanBaku: (bahan: Omit<BahanBaku, 'id'>) => Promise<boolean>;
  updateBahanBaku: (id: string, bahan: Partial<BahanBaku>) => Promise<boolean>;
  deleteBahanBaku: (id: string) => Promise<boolean>;
  getBahanBakuByName: (nama: string) => BahanBaku | undefined;
  reduceStok: (nama: string, jumlah: number) => boolean;
  
  // Suppliers
  suppliers: Supplier[];
  addSupplier: (supplier: Omit<Supplier, 'id'>) => Promise<void>;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;
  
  // Purchases
  purchases: Purchase[];
  addPurchase: (purchase: Omit<Purchase, 'id'>) => Promise<void>;
  updatePurchase: (id: string, purchase: Partial<Purchase>) => Promise<void>;
  deletePurchase: (id: string) => Promise<void>;
  
  // Recipes
  recipes: Recipe[];
  addRecipe: (recipe: Omit<Recipe, 'id'>) => Promise<boolean>;
  updateRecipe: (id: string, recipe: Partial<Recipe>) => Promise<boolean>;
  deleteRecipe: (id: string) => Promise<boolean>;
  
  // HPP Results
  hppResults: HPPResult[];
  addHPPResult: (result: Omit<HPPResult, 'id'>) => Promise<void>;
  addHPPCalculation: (result: Omit<HPPResult, 'id'>) => void;
  
  // Activities
  activities: Activity[];
  addActivity: (activity: Omit<Activity, 'id' | 'timestamp'>) => Promise<void>;
  
  // Orders
  orders: Order[];
  addOrder: (order: NewOrder) => Promise<void>;
  updateOrder: (id: string, order: Partial<Order>) => Promise<boolean>;
  deleteOrder: (id: string) => Promise<boolean>;
  updateOrderStatus: (id: string, status: Order['status']) => void;
  
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
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

// Local Storage keys
const STORAGE_KEYS = {
  BAHAN_BAKU: 'hpp_app_bahan_baku',
  SUPPLIERS: 'hpp_app_suppliers',
  PURCHASES: 'hpp_app_purchases',
  RECIPES: 'hpp_app_recipes',
  HPP_RESULTS: 'hpp_app_hpp_results',
  ACTIVITIES: 'hpp_app_activities',
  ORDERS: 'hpp_app_orders',
  CLOUD_SYNC: 'hpp_app_cloud_sync',
};

// Helper function to generate UUID
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Helper functions for localStorage
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
          timestamp: new Date(item.timestamp),
        }));
      }
      if (key === STORAGE_KEYS.PURCHASES) {
        return parsed.map((item: any) => ({
          ...item,
          tanggal: new Date(item.tanggal),
        }));
      }
      if (key === STORAGE_KEYS.BAHAN_BAKU) {
        return parsed.map((item: any) => ({
          ...item,
          tanggalKadaluwarsa: item.tanggalKadaluwarsa ? new Date(item.tanggalKadaluwarsa) : undefined,
        }));
      }
      if (key === STORAGE_KEYS.ORDERS) {
        return parsed.map((item: any) => ({ ...item, tanggal: item.tanggal ? new Date(item.tanggal) : new Date() }));
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
  // Load initial data from localStorage
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
  const [cloudSyncEnabled, setCloudSyncEnabled] = useState<boolean>(() => 
    loadFromStorage(STORAGE_KEYS.CLOUD_SYNC, false)
  );

  // Auto-load from cloud when data is empty and cloud sync is enabled
  useEffect(() => {
    const checkAndLoadFromCloud = async () => {
      if (cloudSyncEnabled && 
          bahanBaku.length === 0 && 
          suppliers.length === 0 && 
          purchases.length === 0 && 
          recipes.length === 0 && 
          orders.length <= 2) { // Only default orders
        console.log('Local data appears empty, attempting to load from cloud...');
        await loadFromCloud();
      }
    };

    // Small delay to ensure component is mounted
    const timer = setTimeout(checkAndLoadFromCloud, 1000);
    return () => clearTimeout(timer);
  }, [cloudSyncEnabled]);

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
    saveToStorage(STORAGE_KEYS.CLOUD_SYNC, cloudSyncEnabled);
  }, [cloudSyncEnabled]);

  // Enhanced manual cloud sync functions
  const syncToCloud = async (): Promise<boolean> => {
    if (!cloudSyncEnabled) return false;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Gagal sinkronisasi: Pengguna tidak terautentikasi.');
        return false;
      }

      console.log('Syncing to cloud...');

      // MODIFIED: Transform data from camelCase to snake_case before sending
      const transformedPayload = {
        bahanBaku: bahanBaku.map(item => ({
          id: item.id,
          nama: item.nama,
          kategori: item.kategori,
          stok: item.stok,
          satuan: item.satuan,
          minimum: item.minimum,
          harga_satuan: item.hargaSatuan, // Transform hargaSatuan to harga_satuan
          supplier: item.supplier,
          tanggal_kadaluwarsa: item.tanggalKadaluwarsa?.toISOString(), // Transform tanggalKadaluwarsa to tanggal_kadaluwarsa
          user_id: session.user.id // Tambahkan user_id
        })),
        suppliers: suppliers.map(item => ({
          ...item,
          created_at: item.createdAt?.toISOString(),
          updated_at: item.updatedAt?.toISOString(),
          user_id: session.user.id // Tambahkan user_id
        })),
        purchases: purchases.map(item => ({
          ...item,
          total_nilai: item.totalNilai,
          metode_perhitungan: item.metodePerhitungan,
          user_id: session.user.id // Tambahkan user_id
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
          created_at: item.createdAt?.toISOString(),
          updated_at: item.updatedAt?.toISOString(),
          user_id: session.user.id // Tambahkan user_id
        })),
        hppResults: hppResults.map(item => ({
          ...item,
          biaya_tenaga_kerja: item.biayaTenagaKerja,
          biaya_overhead: item.biayaOverhead,
          margin_keuntungan: item.marginKeuntungan,
          total_hpp: item.totalHPP,
          hpp_per_porsi: item.hppPerPorsi,
          harga_jual_per_porsi: item.hargaJualPerPorsi,
          jumlah_porsi: item.jumlahPorsi,
          created_at: item.timestamp.toISOString(),
          user_id: session.user.id // Tambahkan user_id
        })),
        activities: activities.map(item => ({
          ...item,
          created_at: item.timestamp.toISOString(),
          user_id: session.user.id // Tambahkan user_id
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
          user_id: session.user.id // Tambahkan user_id
        }))
      };

      const { data, error } = await supabase.functions.invoke('hpp-data', {
        body: transformedPayload
      });

      if (error) {
        console.error('Sync error:', error);
        toast.error(`Gagal sinkronisasi ke cloud: ${error.message}`);
        return false;
      }

      console.log('Sync successful:', data);
      toast.success('Data berhasil disinkronkan ke cloud!');
      return true;
    } catch (error) {
      console.error('Sync to cloud failed:', error);
      toast.error(`Gagal sinkronisasi ke cloud: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  };

  const loadFromCloud = async (): Promise<void> => {
    if (!cloudSyncEnabled) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Gagal memuat dari cloud: Pengguna tidak terautentikasi.');
        return;
      }

      console.log('Loading from cloud...');

      // Load data from each table including orders
      const [bahanBakuRes, suppliersRes, purchasesRes, recipesRes, hppResultsRes, activitiesRes, ordersRes] = await Promise.all([
        supabase.from('bahan_baku').select('*').eq('user_id', session.user.id),
        supabase.from('suppliers').select('*').eq('user_id', session.user.id),
        supabase.from('purchases').select('*').eq('user_id', session.user.id),
        supabase.from('hpp_recipes').select('*').eq('user_id', session.user.id),
        supabase.from('hpp_results').select('*').eq('user_id', session.user.id),
        supabase.from('activities').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }).limit(50),
        supabase.from('orders').select('*').eq('user_id', session.user.id).order('tanggal', { ascending: false })
      ]);

      if (bahanBakuRes.data && !bahanBakuRes.error) {
        const transformedBahanBaku = bahanBakuRes.data.map((item: any) => ({
          id: item.id,
          nama: item.nama,
          kategori: item.kategori,
          stok: parseFloat(item.stok) || 0,
          satuan: item.satuan,
          minimum: parseFloat(item.minimum) || 0,
          hargaSatuan: parseFloat(item.harga_satuan) || 0, // Transform harga_satuan to hargaSatuan
          supplier: item.supplier,
          tanggalKadaluwarsa: item.tanggal_kadaluwarsa ? new Date(item.tanggal_kadaluwarsa) : undefined, // Transform tanggal_kadaluwarsa to tanggalKadaluwarsa
        }));
        setBahanBaku(transformedBahanBaku);
        console.log('Loaded bahan baku:', transformedBahanBaku.length);
      } else if (bahanBakuRes.error) {
        console.error('Error loading bahan baku:', bahanBakuRes.error);
        toast.error(`Gagal memuat bahan baku: ${bahanBakuRes.error.message}`);
      }

      if (suppliersRes.data && !suppliersRes.error) {
        const transformedSuppliers = suppliersRes.data.map((item: any) => ({
          id: item.id,
          nama: item.nama,
          kontak: item.kontak,
          email: item.email,
          telepon: item.telepon,
          alamat: item.alamat,
          catatan: item.catatan,
          createdAt: new Date(item.created_at),
          updatedAt: new Date(item.updated_at),
        }));
        setSuppliers(transformedSuppliers);
        console.log('Loaded suppliers:', transformedSuppliers.length);
      } else if (suppliersRes.error) {
        console.error('Error loading suppliers:', suppliersRes.error);
        toast.error(`Gagal memuat supplier: ${suppliersRes.error.message}`);
      }

      if (purchasesRes.data && !purchasesRes.error) {
        const transformedPurchases = purchasesRes.data.map((item: any) => ({
          id: item.id,
          tanggal: new Date(item.tanggal),
          supplier: item.supplier,
          items: item.items || [],
          totalNilai: parseFloat(item.total_nilai) || 0,
          status: item.status,
          metodePerhitungan: item.metode_perhitungan,
          catatan: item.catatan,
        }));
        setPurchases(transformedPurchases);
        console.log('Loaded purchases:', transformedPurchases.length);
      } else if (purchasesRes.error) {
        console.error('Error loading purchases:', purchasesRes.error);
        toast.error(`Gagal memuat pembelian: ${purchasesRes.error.message}`);
      }

      if (recipesRes.data && !recipesRes.error) {
        const transformedRecipes = recipesRes.data.map((item: any) => ({
          id: item.id,
          namaResep: item.nama_resep,
          deskripsi: item.deskripsi,
          porsi: item.porsi,
          ingredients: item.ingredients || [],
          biayaTenagaKerja: parseFloat(item.biaya_tenaga_kerja) || 0,
          biayaOverhead: parseFloat(item.biaya_overhead) || 0,
          totalHPP: parseFloat(item.total_hpp) || 0,
          hppPerPorsi: parseFloat(item.hpp_per_porsi) || 0,
          marginKeuntungan: parseFloat(item.margin_keuntungan) || 0,
          hargaJualPerPorsi: parseFloat(item.harga_jual_per_porsi) || 0,
          createdAt: new Date(item.created_at),
          updatedAt: new Date(item.updated_at),
        }));
        setRecipes(transformedRecipes);
        console.log('Loaded recipes:', transformedRecipes.length);
      } else if (recipesRes.error) {
        console.error('Error loading recipes:', recipesRes.error);
        toast.error(`Gagal memuat resep: ${recipesRes.error.message}`);
      }

      if (hppResultsRes.data && !hppResultsRes.error) {
        const transformedHppResults = hppResultsRes.data.map((item: any) => ({
          id: item.id,
          nama: item.nama,
          ingredients: item.ingredients || [],
          biayaTenagaKerja: parseFloat(item.biaya_tenaga_kerja) || 0,
          biayaOverhead: parseFloat(item.biaya_overhead) || 0,
          marginKeuntungan: parseFloat(item.margin_keuntungan) || 0,
          totalHPP: parseFloat(item.total_hpp) || 0,
          hppPerPorsi: parseFloat(item.hpp_per_porsi) || 0,
          hargaJualPerPorsi: parseFloat(item.harga_jual_per_porsi) || 0,
          jumlahPorsi: item.jumlah_porsi || 1,
          timestamp: new Date(item.created_at),
        }));
        setHppResults(transformedHppResults);
        console.log('Loaded HPP results:', transformedHppResults.length);
      } else if (hppResultsRes.error) {
        console.error('Error loading HPP results:', hppResultsRes.error);
        toast.error(`Gagal memuat hasil HPP: ${hppResultsRes.error.message}`);
      }

      if (activitiesRes.data && !activitiesRes.error) {
        const transformedActivities = activitiesRes.data.map((item: any) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          type: item.type,
          value: item.value,
          timestamp: new Date(item.created_at),
        }));
        setActivities(transformedActivities);
        console.log('Loaded activities:', transformedActivities.length);
      } else if (activitiesRes.error) {
        console.error('Error loading activities:', activitiesRes.error);
        toast.error(`Gagal memuat aktivitas: ${activitiesRes.error.message}`);
      }

      // Transform orders data from database format to app format - Fixed field name mapping
      if (ordersRes.data && !ordersRes.error) {
        const transformedOrders = ordersRes.data.map((item: any) => ({
          id: item.id,
          nomorPesanan: item.nomor_pesanan,
          tanggal: new Date(item.tanggal),
          namaPelanggan: item.nama_pelanggan,
          emailPelanggan: item.email_pelanggan,
          teleponPelanggan: item.telepon_pelanggan, // Fixed: correct field name
          alamatPelanggan: item.alamat_pengiriman,
          items: item.items || [],
          subtotal: parseFloat(item.subtotal) || 0,
          pajak: parseFloat(item.pajak) || 0,
          totalPesanan: parseFloat(item.total_pesanan) || 0,
          status: item.status,
          catatan: item.catatan,
        }));
        setOrders(transformedOrders);
        console.log('Loaded orders:', transformedOrders.length);
      } else if (ordersRes.error) {
        console.error('Error loading orders:', ordersRes.error);
        toast.error(`Gagal memuat pesanan: ${ordersRes.error.message}`);
      }

      console.log('Load from cloud completed successfully');
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
  };

  // Bahan Baku functions
  const addBahanBaku = async (bahan: Omit<BahanBaku, 'id'>) => {
    const newBahan: BahanBaku = {
      ...bahan,
      id: generateUUID(),
    };
    
    // MODIFIED: Transform to snake_case for Supabase insert
    const bahanToInsert = {
      id: newBahan.id,
      nama: newBahan.nama,
      kategori: newBahan.kategori,
      stok: newBahan.stok,
      satuan: newBahan.satuan,
      harga_satuan: newBahan.hargaSatuan, // Transform
      minimum: newBahan.minimum,
      supplier: newBahan.supplier,
      tanggal_kadaluwarsa: newBahan.tanggalKadaluwarsa?.toISOString() || null, // Transform & handle null
      user_id: (await supabase.auth.getSession()).data.session?.user.id, // Ambil user_id dari sesi
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('bahan_baku').insert([bahanToInsert]);

    if (error) {
      console.error('Error adding bahan baku to DB:', error);
      toast.error(`Gagal menambahkan bahan baku: ${error.message}`);
      return false;
    }

    setBahanBaku(prev => [...prev, newBahan]); // Update local state with camelCase
    await syncToCloud(); // Sync all data (redundant for single item, but follows existing pattern)
    addActivity({
      title: 'Bahan Baku Ditambahkan',
      description: `${bahan.nama} telah ditambahkan ke gudang`,
      type: 'stok',
    });
    toast.success(`${bahan.nama} berhasil ditambahkan!`); // Konfirmasi berhasil
    return true;
  };

  const updateBahanBaku = async (id: string, updatedBahan: Partial<BahanBaku>) => {
    // MODIFIED: Transform to snake_case for Supabase update
    const bahanToUpdate: Partial<any> = {
      ...updatedBahan,
      harga_satuan: updatedBahan.hargaSatuan, // Transform
      tanggal_kadaluwarsa: updatedBahan.tanggalKadaluwarsa?.toISOString() || null, // Transform & handle null
      updated_at: new Date().toISOString(),
    };
    // Hapus properti camelCase yang tidak ada di DB
    delete bahanToUpdate.hargaSatuan;
    delete bahanToUpdate.tanggalKadaluwarsa;

    const { error } = await supabase.from('bahan_baku').update(bahanToUpdate).eq('id', id);

    if (error) {
      console.error('Error updating bahan baku in DB:', error);
      toast.error(`Gagal memperbarui bahan baku: ${error.message}`);
      return false;
    }

    setBahanBaku(prev => 
      prev.map(bahan => 
        bahan.id === id ? { ...bahan, ...updatedBahan } : bahan
      )
    );
    await syncToCloud(); // Sync all data
    addActivity({
      title: 'Bahan Baku Diperbarui',
      description: `Data bahan baku telah diperbarui`,
      type: 'stok',
    });
    toast.success(`Bahan baku berhasil diperbarui!`); // Konfirmasi berhasil
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
    await syncToCloud(); // Sync all data
    if (bahan) {
      addActivity({
        title: 'Bahan Baku Dihapus',
        description: `${bahan.nama} telah dihapus dari gudang`,
        type: 'stok',
      });
      toast.success(`${bahan.nama} berhasil dihapus!`); // Konfirmasi berhasil
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

    // Panggil updateBahanBaku yang akan sync ke cloud
    updateBahanBaku(bahan.id, { stok: bahan.stok - jumlah });
    addActivity({
      title: 'Stok Berkurang',
      description: `${nama} berkurang ${jumlah} ${bahan.satuan}`,
      type: 'stok',
    });
    return true;
  };

  // Supplier functions
  const addSupplier = async (supplier: Omit<Supplier, 'id'>) => {
    const newSupplier: Supplier = {
      ...supplier,
      id: generateUUID(),
    };
    
    const supplierToInsert = {
      ...newSupplier,
      created_at: newSupplier.createdAt?.toISOString(),
      updated_at: newSupplier.updatedAt?.toISOString(),
      user_id: (await supabase.auth.getSession()).data.session?.user.id,
    };
    delete supplierToInsert.createdAt; // Hapus properti camelCase
    delete supplierToInsert.updatedAt;

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
    if (supplierToUpdate.createdAt) delete supplierToUpdate.createdAt; // Hapus jika ada

    const { error } = await supabase.from('suppliers').update(supplierToUpdate).eq('id', id);
    if (error) {
      console.error('Error updating supplier in DB:', error);
      toast.error(`Gagal memperbarui supplier: ${error.message}`);
      return;
    }

    setSuppliers(prev => 
      prev.map(supplier => 
        supplier.id === id ? { ...supplier, ...updatedSupplier } : supplier
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
      toast.success(`${supplier.nama} berhasil dihapus!`);
    }
  };

  // Purchase functions
  const addPurchase = async (purchase: Omit<Purchase, 'id'>) => {
    const newPurchase: Purchase = {
      ...purchase,
      id: generateUUID(),
    };
    
    const purchaseToInsert = {
      ...newPurchase,
      total_nilai: newPurchase.totalNilai,
      metode_perhitungan: newPurchase.metodePerhitungan,
      user_id: (await supabase.auth.getSession()).data.session?.user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    delete purchaseToInsert.totalNilai;
    delete purchaseToInsert.metodePerhitungan;

    const { error } = await supabase.from('purchases').insert([purchaseToInsert]);
    if (error) {
      console.error('Error adding purchase to DB:', error);
      toast.error(`Gagal menambahkan pembelian: ${error.message}`);
      return;
    }

    setPurchases(prev => [...prev, newPurchase]);
    await syncToCloud();
    
    // Update stock for each purchased item
    purchase.items.forEach(item => {
      const existingBahan = getBahanBakuByName(item.namaBarang);
      if (existingBahan) {
        updateBahanBaku(existingBahan.id, { 
          stok: existingBahan.stok + item.jumlah,
          hargaSatuan: item.hargaSatuan 
        });
      } else {
        // MODIFIED: Ensure new bahan baku added here also uses snake_case for DB
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

    const { error } = await supabase.from('purchases').update(purchaseToUpdate).eq('id', id);
    if (error) {
      console.error('Error updating purchase in DB:', error);
      toast.error(`Gagal memperbarui pembelian: ${error.message}`);
      return;
    }

    setPurchases(prev => 
      prev.map(purchase => 
        purchase.id === id ? { ...purchase, ...updatedPurchase } : purchase
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

  // Recipe functions
  const addRecipe = async (recipe: Omit<Recipe, 'id'>) => {
    const newRecipe: Recipe = {
      ...recipe,
      id: generateUUID(),
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
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
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
    };
    // Hapus properti camelCase
    delete recipeToUpdate.namaResep;
    delete recipeToUpdate.biayaTenagaKerja;
    delete recipeToUpdate.biayaOverhead;
    delete recipeToUpdate.totalHPP;
    delete recipeToUpdate.hppPerPorsi;
    delete recipeToUpdate.marginKeuntungan;
    delete recipeToUpdate.hargaJualPerPorsi;

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

  // HPP Result functions
  const addHPPResult = async (result: Omit<HPPResult, 'id'>) => {
    const newResult: HPPResult = {
      ...result,
      id: generateUUID(),
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
      created_at: newResult.timestamp.toISOString(),
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
      value: `HPP: Rp ${result.hppPerPorsi.toLocaleString()}`
    });
    toast.success(`Hasil HPP ${result.nama} berhasil disimpan!`);
  };

  const addHPPCalculation = (result: Omit<HPPResult, 'id'>) => {
    addHPPResult(result);
  };

  // Order functions
  const addOrder = async (order: NewOrder) => {
    const orderItems: OrderItem[] = order.items.map((item, index) => ({
      id: index + 1, // Keep as number for items
      nama: item.nama,
      quantity: item.quantity,
      hargaSatuan: item.hargaSatuan,
      totalHarga: item.quantity * item.hargaSatuan
    }));

    const newOrder: Order = {
      ...order,
      id: generateUUID(),
      nomorPesanan: `ORD-${String(Math.max(0, ...orders.map(o => parseInt(o.nomorPesanan.replace('ORD-', '')) || 0)) + 1).padStart(3, '0')}`,
      tanggal: new Date(),
      items: orderItems,
      // subtotal, pajak, totalPesanan langsung dari order param
      status: 'pending'
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
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
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
    // Hapus properti camelCase
    delete orderToUpdate.nomorPesanan;
    delete orderToUpdate.namaPelanggan;
    delete orderToUpdate.emailPelanggan;
    delete orderToUpdate.teleponPelanggan;
    delete orderToUpdate.alamatPelanggan;
    delete orderToUpdate.totalPesanan;

    const { error } = await supabase.from('orders').update(orderToUpdate).eq('id', id);
    if (error) {
      console.error('Error updating order in DB:', error);
      toast.error(`Gagal memperbarui pesanan: ${error.message}`);
      return false;
    }

    setOrders(prev => 
      prev.map(order => 
        order.id === id ? { ...order, ...updatedOrder } : order
      )
    );
    await syncToCloud();
    
    // Add activity for status change if status is included in the update
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

  // Activity functions
  const addActivity = async (activity: Omit<Activity, 'id' | 'timestamp'>) => {
    const newActivity: Activity = {
      ...activity,
      id: generateUUID(),
      timestamp: new Date(),
    };
    
    const activityToInsert = {
      id: newActivity.id,
      title: newActivity.title,
      description: newActivity.description,
      type: newActivity.type,
      value: newActivity.value,
      user_id: (await supabase.auth.getSession()).data.session?.user.id,
      created_at: newActivity.timestamp.toISOString(),
    };

    const { error } = await supabase.from('activities').insert([activityToInsert]);
    if (error) {
      console.error('Error adding activity to DB:', error);
      toast.error(`Gagal menambahkan aktivitas: ${error.message}`);
      return;
    }

    setActivities(prev => [newActivity, ...prev].slice(0, 50)); // Keep only latest 50
    await syncToCloud();
    toast.success(`Aktivitas berhasil ditambahkan!`);
  };

  // Statistics
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
