import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RealtimeChannel, AuthChangeEvent, Session, UserResponse } from '@supabase/supabase-js';

// Import all necessary types from AppDataContext.tsx or your specific types files
// Adjust these paths if your types are structured differently
import {
  BahanBaku,
  Supplier,
  Purchase,
  Recipe,
  HPPResult,
  Activity,
  Order,
  Asset,
  FinancialTransaction,
} from '@/contexts/AppDataContext'; // Assuming types are exported from AppDataContext

// ===============================================
// HELPER FUNCTIONS
// ===============================================

// src/hooks/useSupabaseSync.ts
export const safeParseDate = (dateValue: any): Date | null => {
  try {
    // Jika sudah objek Date, validasi dan kembalikan
    if (dateValue instanceof Date) {
      return isNaN(dateValue.getTime()) ? null : dateValue;
    }

    // Jika null atau undefined, kembalikan null
    if (dateValue === null || dateValue === undefined) {
      return null;
    }

    // BARU: Jika bukan string atau number, anggap tidak valid dan kembalikan null
    // Ini mencegah konstruktor Date dipanggil dengan tipe yang tidak terduga
    if (typeof dateValue !== 'string' && typeof dateValue !== 'number') {
      console.warn('safeParseDate menerima nilai non-string/non-number yang tidak terduga:', dateValue);
      return null;
    }

    const parsed = new Date(dateValue);
    return isNaN(parsed.getTime()) ? null : parsed;
  } catch (error) {
    console.error('Error parsing date:', error, dateValue);
    return null;
  }
};

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

// ===============================================
// INTERFACES FOR SUPABASE DATA (snake_case)
// ===============================================
// These interfaces represent the structure of data AS IT IS STORED IN SUPABASE
// and passed to/from `syncToSupabase` and `loadFromSupabase`.

interface TransformedBahanBaku {
  id: string;
  nama: string;
  kategori: string;
  stok: number;
  satuan: string;
  minimum: number;
  harga_satuan: number;
  supplier: string;
  tanggal_kadaluwarsa: string | null;
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
  items: any[];
  total_nilai: number;
  metode_perhitungan: string;
  catatan: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface TransformedRecipe {
  id: string;
  nama_resep: string;
  deskripsi: string | null;
  porsi: number;
  ingredients: any[];
  biaya_tenaga_kerja: number;
  biaya_overhead: number;
  total_hpp: number;
  hpp_per_porsi: number;
  margin_keuntungan: number;
  harga_jual_per_porsi: number;
  category: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface TransformedHPPResult {
  id: string;
  nama: string;
  ingredients: any[];
  biaya_tenaga_kerja: number;
  biaya_overhead: number;
  margin_keuntungan: number;
  total_hpp: number;
  hpp_per_porsi: number;
  harga_jual_per_porsi: number;
  jumlah_porsi: number;
  user_id: string;
  created_at: string; // `timestamp` dari frontend akan disimpan di sini
  updated_at: string;
}

interface TransformedActivity {
  id: string;
  title: string;
  description: string;
  type: string;
  value: string | null;
  user_id: string;
  created_at: string; // `timestamp` dari frontend akan disimpan di sini
  updated_at: string;
}

interface TransformedOrder {
  id: string;
  nomor_pesanan: string;
  tanggal: string;
  nama_pelanggan: string;
  email_pelanggan: string;
  telepon_pelanggan: string;
  alamat_pengiriman: string;
  items: any[];
  subtotal: number;
  pajak: number;
  total_pesanan: number;
  status: string;
  catatan: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface TransformedAsset {
  id: string;
  nama: string;
  jenis: string | null; // Corresponds to `Asset.jenis` (camelCase)
  nilai_awal: number; // Corresponds to `Asset.nilai`
  umur_manfaat: number; // Corresponds to `Asset.umurManfaat`
  tanggal_pembelian: string; // Corresponds to `Asset.tanggalPembelian`
  penyusutan_per_bulan: number;
  nilai_sekarang: number; // Corresponds to `Asset.nilaiSaatIni`
  user_id: string;
  created_at: string;
  updated_at: string;
  kategori: string | null;
  kondisi: string | null;
  lokasi: string | null;
  deskripsi: string | null;
  depresiasi: number | null;
}

interface TransformedFinancialTransaction {
  id: string;
  user_id: string;
  type: string; // Corresponds to `FinancialTransaction.type`
  category: string;
  amount: number;
  description: string;
  date: string; // Corresponds to `FinancialTransaction.date`
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
  notifications: any;
  backup_settings: any;
  security_settings: any;
  recipe_categories: string[];
  financial_categories: string[];
}

// ===============================================
// PAYLOADS & LOADED DATA INTERFACES
// ===============================================

// This interface is for data sent TO `syncToSupabase`
export interface SyncPayload {
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

// This interface is for data returned FROM `loadFromSupabase`
// Uses camelCase and Date objects as expected by frontend
export interface LoadedData {
  bahanBaku: BahanBaku[];
  suppliers: Supplier[];
  purchases: Purchase[];
  recipes: Recipe[];
  hppResults: HPPResult[];
  activities: Activity[];
  orders: Order[];
  assets: Asset[];
  financialTransactions: FinancialTransaction[];
  userSettings?: any; // Consider creating a specific interface for UserSettings if complex
}

// ===============================================
// useSupabaseSync HOOK
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
      const userId = session.user.id;

      // Use a batch update strategy: delete all user-specific data, then upsert new data
      // This ensures data consistency (items deleted locally are also deleted in cloud)
      const deletePromises = [
        supabase.from('bahan_baku').delete().eq('user_id', userId),
        supabase.from('suppliers').delete().eq('user_id', userId),
        supabase.from('purchases').delete().eq('user_id', userId),
        supabase.from('hpp_recipes').delete().eq('user_id', userId),
        supabase.from('hpp_results').delete().eq('user_id', userId),
        supabase.from('activities').delete().eq('user_id', userId),
        supabase.from('orders').delete().eq('user_id', userId),
        supabase.from('assets').delete().eq('user_id', userId),
        supabase.from('financial_transactions').delete().eq('user_id', userId),
        // user_settings is typically not deleted, but upserted
      ];

      // Execute all delete operations concurrently
      const deleteResults = await Promise.all(deletePromises);
      for (const res of deleteResults) {
        if (res.error) throw res.error; // Throw on any delete error
      }

      const upsertPromises = [];

      if (bahanBaku && bahanBaku.length > 0) {
        upsertPromises.push(supabase.from('bahan_baku').upsert(bahanBaku, { onConflict: 'id', ignoreDuplicates: false }));
      }
      if (suppliers && suppliers.length > 0) {
        upsertPromises.push(supabase.from('suppliers').upsert(suppliers, { onConflict: 'id', ignoreDuplicates: false }));
      }
      if (purchases && purchases.length > 0) {
        upsertPromises.push(supabase.from('purchases').upsert(purchases, { onConflict: 'id', ignoreDuplicates: false }));
      }
      if (recipes && recipes.length > 0) {
        upsertPromises.push(supabase.from('hpp_recipes').upsert(recipes, { onConflict: 'id', ignoreDuplicates: false }));
      }
      if (hppResults && hppResults.length > 0) {
        upsertPromises.push(supabase.from('hpp_results').upsert(hppResults, { onConflict: 'id', ignoreDuplicates: false }));
      }
      if (activities && activities.length > 0) {
        upsertPromises.push(supabase.from('activities').upsert(activities, { onConflict: 'id', ignoreDuplicates: false }));
      }
      if (orders && orders.length > 0) {
        upsertPromises.push(supabase.from('orders').upsert(orders, { onConflict: 'id', ignoreDuplicates: false }));
      }
      if (assets && assets.length > 0) {
        upsertPromises.push(supabase.from('assets').upsert(assets, { onConflict: 'id', ignoreDuplicates: false }));
      }
      if (financialTransactions && financialTransactions.length > 0) {
        upsertPromises.push(supabase.from('financial_transactions').upsert(financialTransactions, { onConflict: 'id', ignoreDuplicates: false }));
      }

      if (userSettings) {
        upsertPromises.push(supabase.from('user_settings').upsert(userSettings, { onConflict: 'user_id' }));
      }

      const upsertResults = await Promise.all(upsertPromises);
      const hasError = upsertResults.some(res => res.error);

      if (hasError) {
        console.error('One or more sync operations failed:', upsertResults.filter(res => res.error));
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
      const userId = session.user.id;

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
        supabase.from('bahan_baku').select('*').eq('user_id', userId),
        supabase.from('suppliers').select('*').eq('user_id', userId),
        supabase.from('purchases').select('*').eq('user_id', userId),
        supabase.from('hpp_recipes').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('hpp_results').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('activities').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50),
        supabase.from('orders').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('assets').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('financial_transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('user_settings').select('*').eq('user_id', userId).maybeSingle()
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

      // Placeholder for default settings
      const defaultSettings = { financialCategories: [] };

      let userSettingsData = null;
      if (settingsRes.data && !settingsRes.error) {
        userSettingsData = {
          businessName: settingsRes.data.business_name || '',
          ownerName: settingsRes.data.owner_name || '',
          email: settingsRes.data.email || '',
          phone: settingsRes.data.phone || '',
          address: settingsRes.data.address || '',
          currency: settingsRes.data.currency || 'IDR',
          language: settingsRes.data.language || 'id',
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
          nama: item.nama || '',
          kategori: item.kategori || '',
          stok: parseFloat(item.stok) || 0,
          satuan: item.satuan || '',
          minimum: parseFloat(item.minimum) || 0,
          hargaSatuan: parseFloat(item.harga_satuan) || 0,
          supplier: item.supplier || '',
          tanggalKadaluwarsa: safeParseDate(item.tanggal_kadaluwarsa),
          userId: item.user_id, // Map DB user_id to frontend userId
          createdAt: safeParseDate(item.created_at),
          updatedAt: safeParseDate(item.updated_at),
          jumlahBeliKemasan: item.jumlah_beli_kemasan !== null ? parseFloat(item.jumlah_beli_kemasan) : null,
          satuanKemasan: item.satuan_kemasan || null,
          hargaTotalBeliKemasan: item.harga_total_beli_kemasan !== null ? parseFloat(item.harga_total_beli_kemasan) : null,
        })) || [],
        suppliers: suppliersRes.data?.map((item: any) => ({
          id: item.id,
          nama: item.nama || '',
          kontak: item.kontak || '',
          email: item.email || '',
          telepon: item.telepon || '',
          alamat: item.alamat || '',
          catatan: item.catatan || '',
          userId: item.user_id, // Map DB user_id to frontend userId
          createdAt: safeParseDate(item.created_at),
          updatedAt: safeParseDate(item.updated_at),
        })) || [],
        purchases: purchasesRes.data?.map((item: any) => ({
          id: item.id,
          tanggal: safeParseDate(item.tanggal) || new Date(),
          supplier: item.supplier || '',
          items: item.items || [],
          totalNilai: parseFloat(item.total_nilai) || 0,
          status: item.status || '',
          metodePerhitungan: item.metode_perhitungan || '',
          catatan: item.catatan || '',
          // No user_id in frontend Purchase interface (it's handled by AppDataContext)
          createdAt: safeParseDate(item.created_at),
          updatedAt: safeParseDate(item.updated_at),
        })) || [],
        recipes: recipesRes.data?.map((item: any) => ({
          id: item.id,
          namaResep: item.nama_resep || '',
          deskripsi: item.deskripsi || '',
          porsi: parseFloat(item.porsi) || 0,
          ingredients: item.ingredients || [],
          biayaTenagaKerja: parseFloat(item.biaya_tenaga_kerja) || 0,
          biayaOverhead: parseFloat(item.biaya_overhead) || 0,
          totalHPP: parseFloat(item.total_hpp) || 0,
          hppPerPorsi: parseFloat(item.hpp_per_porsi) || 0,
          marginKeuntungan: parseFloat(item.margin_keuntungan) || 0,
          hargaJualPerPorsi: parseFloat(item.harga_jual_per_porsi) || 0,
          category: item.category || '',
          // No user_id in frontend Recipe interface
          createdAt: safeParseDate(item.created_at),
          updatedAt: safeParseDate(item.updated_at),
        })) || [],
        hppResults: hppResultsRes.data?.map((item: any) => ({
          id: item.id,
          nama: item.nama || '',
          ingredients: item.ingredients || [],
          biayaTenagaKerja: parseFloat(item.biaya_tenaga_kerja) || 0,
          biayaOverhead: parseFloat(item.biaya_overhead) || 0,
          marginKeuntungan: parseFloat(item.margin_keuntungan) || 0,
          totalHPP: parseFloat(item.total_hpp) || 0,
          hppPerPorsi: parseFloat(item.hpp_per_porsi) || 0,
          hargaJualPerPorsi: parseFloat(item.harga_jual_per_porsi) || 0,
          jumlahPorsi: parseFloat(item.jumlah_porsi) || 1,
          timestamp: safeParseDate(item.created_at) || new Date(), // Using created_at for timestamp
          // No user_id in frontend HPPResult interface
          createdAt: safeParseDate(item.created_at),
          updatedAt: safeParseDate(item.updated_at),
        })) || [],
        activities: activitiesRes.data?.map((item: any) => ({
          id: item.id,
          title: item.title || '',
          description: item.description || '',
          type: item.type || '',
          value: item.value || '',
          timestamp: safeParseDate(item.created_at) || new Date(), // Using created_at for timestamp
          // No user_id in frontend Activity interface
          createdAt: safeParseDate(item.created_at),
          updatedAt: safeParseDate(item.updated_at),
        })) || [],
        orders: ordersRes.data?.map((item: any) => ({
          id: item.id,
          nomorPesanan: item.nomor_pesanan || '',
          tanggal: safeParseDate(item.tanggal) || new Date(),
          namaPelanggan: item.nama_pelanggan || '',
          emailPelanggan: item.email_pelanggan || '',
          teleponPelanggan: item.telepon_pelanggan || '',
          alamatPelanggan: item.alamat_pengiriman || '',
          items: item.items || [],
          subtotal: parseFloat(item.subtotal) || 0,
          pajak: parseFloat(item.pajak) || 0,
          totalPesanan: parseFloat(item.total_pesanan) || 0,
          status: item.status || '',
          catatan: item.catatan || '',
          // No user_id in frontend Order interface
          createdAt: safeParseDate(item.created_at),
          updatedAt: safeParseDate(item.updated_at),
        })) || [],
        assets: assetsRes.data?.map((item: any) => ({
          id: item.id,
          nama: item.nama || '',
          jenis: item.jenis || '', // Corresponds to DB `jenis`
          nilai: parseFloat(item.nilai_awal) || 0, // Corresponds to DB `nilai_awal`
          umurManfaat: parseFloat(item.umur_manfaat) || 0,
          tanggalPembelian: safeParseDate(item.tanggal_pembelian) || new Date(),
          penyusutanPerBulan: parseFloat(item.penyusutan_per_bulan) || 0,
          nilaiSaatIni: parseFloat(item.nilai_sekarang) || 0,
          userId: item.user_id, // Map DB user_id to frontend userId
          createdAt: safeParseDate(item.created_at),
          updatedAt: safeParseDate(item.updated_at),
          kategori: item.kategori || '',
          kondisi: item.kondisi || '',
          lokasi: item.lokasi || '',
          deskripsi: item.deskripsi || '',
          depresiasi: parseFloat(item.depresiasi) ?? null,
        })) || [],
        financialTransactions: financialTransactionsRes.data?.map((item: any) => ({
          id: item.id,
          userId: item.user_id, // Map DB user_id to frontend userId
          type: item.type || '', // Corresponds to DB `type`
          category: item.category || '',
          amount: parseFloat(item.amount) || 0,
          description: item.description || '',
          date: safeParseDate(item.date) || new Date(),
          created_at: safeParseDate(item.created_at) || new Date(),
          updated_at: safeParseDate(item.updated_at) || new Date(),
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
      const userId = session.user.id;

      const [bahanBakuRes, suppliersRes, purchasesRes, recipesRes, hppResultsRes, ordersRes, assetsRes, financialTransactionsRes] = await Promise.all([
        supabase.from('bahan_baku').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('suppliers').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('purchases').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('hpp_recipes').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('hpp_results').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('assets').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('financial_transactions').select('*', { count: 'exact', head: true }).eq('user_id', userId)
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