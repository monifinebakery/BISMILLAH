import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { BahanBaku } from '@/types/recipe'; // Pastikan BahanBaku dari types/recipe
import { generateUUID } from '@/utils/uuid'; // Asumsi generateUUID ada
import { saveToStorage, loadFromStorage } from '@/utils/localStorageHelpers'; // Asumsi ini ada
import { safeParseDate } from '@/hooks/useSupabaseSync'; // safeParseDate sudah ada di sini, biarkan

// MODIFIED: Tambahkan interface untuk data yang akan disinkronkan
interface TransformedBahanBaku {
  id: string;
  nama: string;
  kategori: string;
  stok: number;
  satuan: string;
  minimum: number;
  harga_satuan: number; // snake_case
  supplier: string;
  tanggal_kadaluwarsa: string | null; // snake_case
  user_id: string;
  created_at: string;
  updated_at: string;
  jumlah_beli_kemasan: number | null;
  satuan_kemasan: string | null;
  harga_total_beli_kemasan: number | null;
}

interface TransformedSupplier {
  id: string;
  nama: string;
  kontak: string;
  email: string;
  telepon: string;
  alamat: string;
  catatan?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface TransformedPurchase {
  id: string;
  tanggal: string;
  supplier: string;
  items: any[]; // Sesuaikan jika ada interface OrderItem di DB
  total_nilai: number; // snake_case
  metode_perhitungan: string; // snake_case
  catatan?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface TransformedRecipe {
  id: string;
  nama_resep: string; // snake_case
  deskripsi: string;
  porsi: number;
  ingredients: any[]; // Sesuaikan jika ada interface RecipeIngredient di DB
  biaya_tenaga_kerja: number; // snake_case
  biaya_overhead: number; // snake_case
  total_hpp: number; // snake_case
  hpp_per_porsi: number; // snake_case
  margin_keuntungan: number; // snake_case
  harga_jual_per_porsi: number; // snake_case
  category: string; // snake_case (juga di app, tapi ini kolom DB)
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface TransformedHPPResult {
  id: string;
  nama: string;
  ingredients: any[]; // Sesuaikan jika ada interface RecipeIngredient di DB
  biaya_tenaga_kerja: number; // snake_case
  biaya_overhead: number; // snake_case
  margin_keuntungan: number; // snake_case
  total_hpp: number; // snake_case
  hpp_per_porsi: number; // snake_case
  harga_jual_per_porsi: number; // snake_case
  jumlah_porsi: number; // snake_case
  user_id: string;
  created_at: string;
}

interface TransformedActivity {
  id: string;
  title: string;
  description: string;
  type: string;
  value?: string;
  user_id: string;
  created_at: string;
}

interface TransformedOrder {
  id: string;
  nomor_pesanan: string; // snake_case
  tanggal: string;
  nama_pelanggan: string; // snake_case
  email_pelanggan: string; // snake_case
  telepon_pelanggan: string; // snake_case
  alamat_pengiriman: string; // snake_case
  items: any[]; // Sesuaikan jika ada interface OrderItem di DB
  subtotal: number;
  pajak: number;
  total_pesanan: number; // snake_case
  status: string;
  catatan?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface TransformedAsset {
  id: string;
  nama: string;
  jenis: string; // DB: jenis
  nilai_awal: number; // DB: nilai_awal (local: nilai)
  umur_manfaat: number; // DB: umur_manfaat (local: umurManfaat)
  tanggal_pembelian: string; // DB: tanggal_pembelian (local: tanggalPembelian)
  penyusutan_per_bulan: number; // DB: penyusutan_per_bulan (local: penyusutanPerBulan)
  nilai_sekarang: number; // DB: nilai_sekarang (local: nilaiSaatIni)
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface TransformedFinancialTransaction {
  id: string;
  tanggal: string;
  type: string; // DB: type (local: jenis)
  deskripsi: string;
  amount: number; // DB: amount (local: jumlah)
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface TransformedUserSettings {
  user_id: string;
  business_name: string;
  owner_name: string;
  email?: string;
  phone?: string;
  address?: string;
  currency: string;
  language: string;
  notifications: any;
  backup_settings: any;
  security_settings: any;
  recipe_categories: string[];
}


interface SyncPayload {
  bahanBaku: TransformedBahanBaku[];
  suppliers: TransformedSupplier[];
  purchases: TransformedPurchase[];
  recipes: TransformedRecipe[];
  hppResults: TransformedHPPResult[];
  activities: TransformedActivity[];
  orders: TransformedOrder[];
  assets: TransformedAsset[];
  financialTransactions: TransformedFinancialTransaction[];
  userSettings?: TransformedUserSettings;
}

// MODIFIED: Interface untuk data yang dimuat dari Supabase (camelCase)
interface LoadedData {
  bahanBaku: any[];
  suppliers: any[];
  purchases: any[];
  recipes: any[];
  hppResults: any[];
  activities: any[];
  orders: any[];
  assets: any[];
  financialTransactions: any[];
  userSettings?: any;
}

// safeParseDate sudah ada di sini, biarkan
export const safeParseDate = (dateValue: any): Date | undefined => {
  try {
    if (!dateValue) return undefined;

    if (dateValue instanceof Date) {
      return isNaN(dateValue.getTime()) ? undefined : dateValue;
    }

    const parsed = new Date(dateValue);
    return isNaN(parsed.getTime()) ? undefined : parsed;
  } catch (error) {
    console.error('Error parsing date:', error, dateValue);
    return undefined;
  }
};

// NEW: Helper function to safely convert Date or string to ISO string for DB.
const toSafeISOString = (dateValue: Date | undefined | string | null): string | null => {
  if (!dateValue) return null; // Tangani null, undefined, atau string kosong

  let dateObj: Date;
  if (dateValue instanceof Date) {
    dateObj = dateValue;
  } else if (typeof dateValue === 'string') {
    dateObj = new Date(dateValue);
  } else {
    // Jika tipe tidak terduga, log dan kembalikan null
    console.warn('toSafeISOString received unexpected type:', typeof dateValue, dateValue);
    return null;
  }

  // Pastikan objek Date yang dihasilkan valid
  if (isNaN(dateObj.getTime())) {
    return null; // Invalid Date, kembalikan null
  }
  return dateObj.toISOString();
};


export const useSupabaseSync = () => {
  const [isLoading, setIsLoading] = useState(false);

  const syncToSupabase = async (transformedPayload: SyncPayload): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Anda harus login untuk menyinkronkan data');
        return false;
      }

      console.log('Starting sync to Supabase...');

      const { bahanBaku, suppliers, purchases, recipes, hppResults, activities, orders, assets, financialTransactions, userSettings } = transformedPayload;

      const syncPromises = [];

      // Sync bahan_baku
      if (bahanBaku && bahanBaku.length > 0) {
        syncPromises.push(supabase.from('bahan_baku').upsert(bahanBaku, { onConflict: 'id' }));
      } else {
        syncPromises.push(supabase.from('bahan_baku').delete().eq('user_id', session.user.id));
      }

      // Sync suppliers
      if (suppliers && suppliers.length > 0) {
        syncPromises.push(supabase.from('suppliers').upsert(suppliers, { onConflict: 'id' }));
      } else {
        syncPromises.push(supabase.from('suppliers').delete().eq('user_id', session.user.id));
      }

      // Sync purchases
      if (purchases && purchases.length > 0) {
        syncPromises.push(supabase.from('purchases').upsert(purchases, { onConflict: 'id' }));
      } else {
        syncPromises.push(supabase.from('purchases').delete().eq('user_id', session.user.id));
      }

      // Sync recipes
      if (recipes && recipes.length > 0) {
        syncPromises.push(supabase.from('hpp_recipes').upsert(recipes, { onConflict: 'id' }));
      } else {
        syncPromises.push(supabase.from('hpp_recipes').delete().eq('user_id', session.user.id));
      }

      // Sync hpp_results
      if (hppResults && hppResults.length > 0) {
        syncPromises.push(supabase.from('hpp_results').upsert(hppResults, { onConflict: 'id' }));
      } else {
        syncPromises.push(supabase.from('hpp_results').delete().eq('user_id', session.user.id));
      }

      // Sync activities
      if (activities && activities.length > 0) {
        syncPromises.push(supabase.from('activities').upsert(activities, { onConflict: 'id' }));
      } else {
        syncPromises.push(supabase.from('activities').delete().eq('user_id', session.user.id));
      }

      // Sync orders
      if (orders && orders.length > 0) {
        syncPromises.push(supabase.from('orders').upsert(orders, { onConflict: 'id' }));
      } else {
        syncPromises.push(supabase.from('orders').delete().eq('user_id', session.user.id));
      }

      // Sync assets
      if (assets && assets.length > 0) {
        syncPromises.push(supabase.from('assets').upsert(assets, { onConflict: 'id' }));
      } else {
        syncPromises.push(supabase.from('assets').delete().eq('user_id', session.user.id));
      }

      // Sync financial_transactions
      if (financialTransactions && financialTransactions.length > 0) {
        syncPromises.push(supabase.from('financial_transactions').upsert(financialTransactions, { onConflict: 'id' }));
      } else {
        syncPromises.push(supabase.from('financial_transactions').delete().eq('user_id', session.user.id));
      }

      // Sync user settings (always upsert single record)
      if (userSettings) {
        syncPromises.push(supabase.from('user_settings').upsert(userSettings, { onConflict: 'user_id' }));
      } else {
        syncPromises.push(supabase.from('user_settings').delete().eq('user_id', session.user.id));
      }

      const results = await Promise.all(syncPromises);
      const hasError = results.some(res => res.error);

      if (hasError) {
        console.error('One or more sync operations failed:', results.filter(res => res.error));
        toast.error('Gagal menyinkronkan data ke cloud (beberapa item mungkin gagal)');
        return false;
      }

      toast.success('Data berhasil disinkronkan ke cloud');
      return true;
    } catch (error: any) {
      console.error('Sync to Supabase failed:', error);
      toast.error(`Gagal menyinkronkan data ke cloud: ${error.message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const loadFromSupabase = async (): Promise<LoadedData | null> => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Anda harus login untuk memuat data');
        return null;
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
          category: item.category || '', // MODIFIED
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
