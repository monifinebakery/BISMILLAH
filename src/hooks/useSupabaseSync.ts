import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
// Asumsi BahanBaku, Recipe, Supplier, dll. diimpor dari lokasi yang benar
// Pastikan path dan nama tipe ini sesuai dengan struktur proyek Anda
import { RecipeIngredient, Recipe } from '@/types/recipe';
import { Supplier } from '@/types/supplier';
import { Order, NewOrder, OrderItem } from '@/types/order';
import { BahanBaku, Purchase, Activity, HPPResult, Asset, FinancialTransaction } from '@/contexts/AppDataContext'; // Mengimpor dari AppDataContext
import { generateUUID } from '@/utils/uuid'; // Asumsi generateUUID ada
import { saveToStorage, loadFromStorage } from '@/utils/localStorageHelpers'; // Asumsi ini ada

// ===============================================
// HELPER FUNCTIONS (ditambahkan / dimodifikasi)
// ===============================================

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
  if (!dateValue) return null; // Handle null, undefined, atau string kosong

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

  // Periksa apakah objek Date yang dihasilkan valid (bukan "Invalid Date")
  if (isNaN(dateObj.getTime())) {
    return null; // Invalid Date, kembalikan null
  }
  return dateObj.toISOString();
};

// ===============================================
// INTERFACES (sesuaikan jika ada di file types/...)
// ===============================================

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
  catatan: string | null;
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
  catatan: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface TransformedRecipe {
  id: string;
  nama_resep: string; // snake_case
  deskripsi: string | null;
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
  created_at: string; // Menggunakan created_at sebagai timestamp
  updated_at: string; // Ditambahkan
}

interface TransformedActivity {
  id: string;
  title: string;
  description: string;
  type: string;
  value: string | null;
  user_id: string;
  created_at: string; // timestamp di frontend
  updated_at: string; // Ditambahkan
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
  catatan: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface TransformedAsset {
  id: string;
  nama: string;
  jenis: string; // DB: jenis (local: jenis)
  nilai_awal: number; // DB: nilai_awal (local: nilai)
  umur_manfaat: number; // DB: umur_manfaat (local: umurManfaat)
  tanggal_pembelian: string; // DB: tanggal_pembelian (local: tanggalPembelian)
  penyusutan_per_bulan: number; // DB: penyusutan_per_bulan (local: penyusutanPerBulan)
  nilai_sekarang: number; // DB: nilai_sekarang (local: nilaiSaatIni)
  user_id: string;
  created_at: string;
  updated_at: string;
  kategori: string | null; // Tambahan, sesuai diskusi sebelumnya
  kondisi: string | null; // Tambahan
  lokasi: string | null; // Tambahan
  deskripsi: string | null; // Tambahan
  depresiasi: number | null; // Tambahan, bisa null
}

interface TransformedFinancialTransaction {
  id: string;
  date: string; // DB: date (local: date)
  type: string; // DB: type (local: type)
  description: string | null;
  category: string | null;
  amount: number; // DB: amount (local: amount)
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface TransformedUserSettings {
  user_id: string;
  business_name: string | null;
  owner_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  currency: string | null;
  language: string | null;
  notifications: any; // JSONB
  backup_settings: any; // JSONB
  security_settings: any; // JSONB
  recipe_categories: string[];
  financial_categories: string[]; // Tambahan, sesuai di AppDataContext
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
  bahanBaku: BahanBaku[]; // Menggunakan BahanBaku dari AppDataContext
  suppliers: Supplier[];
  purchases: Purchase[];
  recipes: Recipe[];
  hppResults: HPPResult[];
  activities: Activity[];
  orders: Order[];
  assets: Asset[];
  financialTransactions: FinancialTransaction[];
  userSettings?: any; // Tidak ada interface spesifik untuk UserSettings di sini
}

// ===============================================
// useSupabaseSync Hook
// ===============================================

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
      // Menggunakan `upsert` untuk menambahkan/memperbarui,
      // dan `delete` untuk menghapus item yang tidak ada di payload lokal
      const { error: bahanBakuDeleteError } = await supabase.from('bahan_baku').delete().eq('user_id', session.user.id);
      if (bahanBakuDeleteError) throw bahanBakuDeleteError;
      if (bahanBaku && bahanBaku.length > 0) {
        syncPromises.push(supabase.from('bahan_baku').upsert(bahanBaku, { onConflict: 'id', ignoreDuplicates: false }));
      }

      // Sync suppliers
      const { error: suppliersDeleteError } = await supabase.from('suppliers').delete().eq('user_id', session.user.id);
      if (suppliersDeleteError) throw suppliersDeleteError;
      if (suppliers && suppliers.length > 0) {
        syncPromises.push(supabase.from('suppliers').upsert(suppliers, { onConflict: 'id', ignoreDuplicates: false }));
      }

      // Sync purchases
      const { error: purchasesDeleteError } = await supabase.from('purchases').delete().eq('user_id', session.user.id);
      if (purchasesDeleteError) throw purchasesDeleteError;
      if (purchases && purchases.length > 0) {
        syncPromises.push(supabase.from('purchases').upsert(purchases, { onConflict: 'id', ignoreDuplicates: false }));
      }

      // Sync recipes
      const { error: recipesDeleteError } = await supabase.from('hpp_recipes').delete().eq('user_id', session.user.id);
      if (recipesDeleteError) throw recipesDeleteError;
      if (recipes && recipes.length > 0) {
        syncPromises.push(supabase.from('hpp_recipes').upsert(recipes, { onConflict: 'id', ignoreDuplicates: false }));
      }

      // Sync hpp_results
      const { error: hppResultsDeleteError } = await supabase.from('hpp_results').delete().eq('user_id', session.user.id);
      if (hppResultsDeleteError) throw hppResultsDeleteError;
      if (hppResults && hppResults.length > 0) {
        syncPromises.push(supabase.from('hpp_results').upsert(hppResults, { onConflict: 'id', ignoreDuplicates: false }));
      }

      // Sync activities
      const { error: activitiesDeleteError } = await supabase.from('activities').delete().eq('user_id', session.user.id);
      if (activitiesDeleteError) throw activitiesDeleteError;
      if (activities && activities.length > 0) {
        syncPromises.push(supabase.from('activities').upsert(activities, { onConflict: 'id', ignoreDuplicates: false }));
      }

      // Sync orders
      const { error: ordersDeleteError } = await supabase.from('orders').delete().eq('user_id', session.user.id);
      if (ordersDeleteError) throw ordersDeleteError;
      if (orders && orders.length > 0) {
        syncPromises.push(supabase.from('orders').upsert(orders, { onConflict: 'id', ignoreDuplicates: false }));
      }

      // Sync assets
      const { error: assetsDeleteError } = await supabase.from('assets').delete().eq('user_id', session.user.id);
      if (assetsDeleteError) throw assetsDeleteError;
      if (assets && assets.length > 0) {
        syncPromises.push(supabase.from('assets').upsert(assets, { onConflict: 'id', ignoreDuplicates: false }));
      }

      // Sync financial_transactions
      const { error: financialTransactionsDeleteError } = await supabase.from('financial_transactions').delete().eq('user_id', session.user.id);
      if (financialTransactionsDeleteError) throw financialTransactionsDeleteError;
      if (financialTransactions && financialTransactions.length > 0) {
        syncPromises.push(supabase.from('financial_transactions').upsert(financialTransactions, { onConflict: 'id', ignoreDuplicates: false }));
      }

      // Sync user settings (always upsert single record)
      // Disini kita tidak menghapus user_settings jika userSettings null, karena ini adalah pengaturan,
      // bukan koleksi data yang bisa kosong. Jika null, mungkin berarti tidak ada perubahan atau default.
      if (userSettings) {
        syncPromises.push(supabase.from('user_settings').upsert(userSettings, { onConflict: 'user_id' }));
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

      const [
        bahanBakuRes,
        suppliersRes,
        purchasesRes,
        recipesRes,
        hppResultsRes,
        activitiesRes,
        ordersRes,
        assetsRes,
        financialTransactionsRes,
        settingsRes
      ] = await Promise.all([
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
      // Asumsi defaultSettings diimpor atau didefinisikan di tempat lain jika diperlukan
      const defaultSettings = { financialCategories: [] }; // Placeholder, sesuaikan dengan definisi nyata

      if (settingsRes.data && !settingsRes.error) {
        userSettingsData = {
          businessName: settingsRes.data.business_name || '',
          ownerName: settingsRes.data.owner_name || '',
          email: settingsRes.data.email || '',
          phone: settingsRes.data.phone || '',
          address: settingsRes.data.address || '',
          currency: settingsRes.data.currency || 'IDR', // Default nilai
          language: settingsRes.data.language || 'id', // Default nilai
          notifications: settingsRes.data.notifications || {},
          backup: settingsRes.data.backup_settings || {},
          security: settingsRes.data.security_settings || {},
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
          nama: item.nama || '', // Ditambahkan || ''
          kategori: item.kategori || '', // Ditambahkan || ''
          stok: parseFloat(item.stok) || 0, // Ditambahkan || 0
          satuan: item.satuan || '', // Ditambahkan || ''
          minimum: parseFloat(item.minimum) || 0, // Ditambahkan || 0
          hargaSatuan: parseFloat(item.harga_satuan) || 0, // Ditambahkan || 0
          supplier: item.supplier || '', // Ditambahkan || ''
          tanggalKadaluwarsa: safeParseDate(item.tanggal_kadaluwarsa),
          user_id: item.user_id,
          createdAt: safeParseDate(item.created_at),
          updatedAt: safeParseDate(item.updated_at),
          jumlahBeliKemasan: item.jumlah_beli_kemasan !== null ? parseFloat(item.jumlah_beli_kemasan) : null,
          satuanKemasan: item.satuan_kemasan || null,
          hargaTotalBeliKemasan: item.harga_total_beli_kemasan !== null ? parseFloat(item.harga_total_beli_kemasan) : null,
        })) || [],
        suppliers: suppliersRes.data?.map((item: any) => ({
          id: item.id,
          nama: item.nama || '', // Ditambahkan || ''
          kontak: item.kontak || '', // Ditambahkan || ''
          email: item.email || '', // Ditambahkan || ''
          telepon: item.telepon || '', // Ditambahkan || ''
          alamat: item.alamat || '', // Ditambahkan || ''
          catatan: item.catatan || '', // Ditambahkan || ''
          user_id: item.user_id,
          createdAt: safeParseDate(item.created_at),
          updatedAt: safeParseDate(item.updated_at),
        })) || [],
        purchases: purchasesRes.data?.map((item: any) => ({
          id: item.id,
          tanggal: safeParseDate(item.tanggal) || new Date(), // Ditambahkan || new Date()
          supplier: item.supplier || '', // Ditambahkan || ''
          items: item.items || [],
          totalNilai: parseFloat(item.total_nilai) || 0, // Ditambahkan || 0
          status: item.status || '', // Ditambahkan || ''
          metodePerhitungan: item.metode_perhitungan || '', // Ditambahkan || ''
          catatan: item.catatan || '', // Ditambahkan || ''
          user_id: item.user_id,
          createdAt: safeParseDate(item.created_at),
          updatedAt: safeParseDate(item.updated_at),
        })) || [],
        recipes: recipesRes.data?.map((item: any) => ({
          id: item.id,
          namaResep: item.nama_resep || '', // Ditambahkan || ''
          deskripsi: item.deskripsi || '', // Ditambahkan || ''
          porsi: parseFloat(item.porsi) || 0, // Ditambahkan || 0
          ingredients: item.ingredients || [],
          biayaTenagaKerja: parseFloat(item.biaya_tenaga_kerja) || 0, // Ditambahkan || 0
          biayaOverhead: parseFloat(item.biaya_overhead) || 0, // Ditambahkan || 0
          totalHPP: parseFloat(item.total_hpp) || 0, // Ditambahkan || 0
          hppPerPorsi: parseFloat(item.hpp_per_porsi) || 0, // Ditambahkan || 0
          marginKeuntungan: parseFloat(item.margin_keuntungan) || 0, // Ditambahkan || 0
          hargaJualPerPorsi: parseFloat(item.harga_jual_per_porsi) || 0, // Ditambahkan || 0
          category: item.category || '', // Ditambahkan || ''
          user_id: item.user_id,
          createdAt: safeParseDate(item.created_at),
          updatedAt: safeParseDate(item.updated_at),
        })) || [],
        hppResults: hppResultsRes.data?.map((item: any) => ({
          id: item.id,
          nama: item.nama || '', // Ditambahkan || ''
          ingredients: item.ingredients || [],
          biayaTenagaKerja: parseFloat(item.biaya_tenaga_kerja) || 0, // Ditambahkan || 0
          biayaOverhead: parseFloat(item.biaya_overhead) || 0, // Ditambahkan || 0
          marginKeuntungan: parseFloat(item.margin_keuntungan) || 0, // Ditambahkan || 0
          totalHPP: parseFloat(item.total_hpp) || 0, // Ditambahkan || 0
          hppPerPorsi: parseFloat(item.hpp_per_porsi) || 0, // Ditambahkan || 0
          hargaJualPerPorsi: parseFloat(item.harga_jual_per_porsi) || 0, // Ditambahkan || 0
          jumlahPorsi: parseFloat(item.jumlah_porsi) || 1, // Ditambahkan || 1
          timestamp: safeParseDate(item.created_at) || new Date(), // Menggunakan created_at sebagai timestamp, ditambahkan || new Date()
          user_id: item.user_id,
          createdAt: safeParseDate(item.created_at),
          updatedAt: safeParseDate(item.updated_at),
        })) || [],
        activities: activitiesRes.data?.map((item: any) => ({
          id: item.id,
          title: item.title || '', // Ditambahkan || ''
          description: item.description || '', // Ditambahkan || ''
          type: item.type || '', // Ditambahkan || ''
          value: item.value || '', // Ditambahkan || ''
          timestamp: safeParseDate(item.created_at) || new Date(), // Menggunakan created_at sebagai timestamp, ditambahkan || new Date()
          user_id: item.user_id,
          createdAt: safeParseDate(item.created_at),
          updatedAt: safeParseDate(item.updated_at),
        })) || [],
        orders: ordersRes.data?.map((item: any) => ({
          id: item.id,
          nomorPesanan: item.nomor_pesanan || '', // Ditambahkan || ''
          tanggal: safeParseDate(item.tanggal) || new Date(), // Ditambahkan || new Date()
          namaPelanggan: item.nama_pelanggan || '', // Ditambahkan || ''
          emailPelanggan: item.email_pelanggan || '', // Ditambahkan || ''
          teleponPelanggan: item.telepon_pelanggan || '', // Ditambahkan || ''
          alamatPelanggan: item.alamat_pengiriman || '', // Ditambahkan || ''
          items: item.items || [],
          subtotal: parseFloat(item.subtotal) || 0, // Ditambahkan || 0
          pajak: parseFloat(item.pajak) || 0, // Ditambahkan || 0
          totalPesanan: parseFloat(item.total_pesanan) || 0, // Ditambahkan || 0
          status: item.status || '', // Ditambahkan || ''
          catatan: item.catatan || '', // Ditambahkan || ''
          user_id: item.user_id,
          createdAt: safeParseDate(item.created_at),
          updatedAt: safeParseDate(item.updated_at),
        })) || [],
        assets: assetsRes.data?.map((item: any) => ({
          id: item.id,
          nama: item.nama || '', // Ditambahkan || ''
          jenis: item.jenis || '', // Ditambahkan || ''
          nilai: parseFloat(item.nilai_awal) || 0, // Menggunakan nilai_awal
          umurManfaat: parseFloat(item.umur_manfaat) || 0, // Menggunakan umur_manfaat
          tanggalPembelian: safeParseDate(item.tanggal_pembelian) || new Date(), // Menggunakan tanggal_pembelian, ditambahkan || new Date()
          penyusutanPerBulan: parseFloat(item.penyusutan_per_bulan) || 0, // Menggunakan penyusutan_per_bulan
          nilaiSaatIni: parseFloat(item.nilai_sekarang) || 0, // Menggunakan nilai_sekarang
          user_id: item.user_id,
          createdAt: safeParseDate(item.created_at),
          updatedAt: safeParseDate(item.updated_at),
          kategori: item.kategori || '', // Tambahan, asumsi ada di DB
          kondisi: item.kondisi || '', // Tambahan
          lokasi: item.lokasi || '', // Tambahan
          deskripsi: item.deskripsi || '', // Tambahan
          depresiasi: parseFloat(item.depresiasi) || null, // Tambahan, bisa null
        })) || [],
        financialTransactions: financialTransactionsRes.data?.map((item: any) => ({
          id: item.id,
          user_id: item.user_id,
          type: item.type || '', // Ditambahkan || ''
          category: item.category || '', // Ditambahkan || ''
          amount: parseFloat(item.amount) || 0, // Ditambahkan || 0
          description: item.description || '', // Ditambahkan || ''
          date: safeParseDate(item.date) || new Date(), // Ditambahkan || new Date()
          created_at: safeParseDate(item.created_at) || new Date(), // Ditambahkan || new Date()
          updated_at: safeParseDate(item.updated_at) || new Date(), // Ditambahkan || new Date()
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