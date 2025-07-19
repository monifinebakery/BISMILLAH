import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RealtimeChannel, AuthChangeEvent, Session, UserResponse } from '@supabase/supabase-js';

// Pastikan import ini BENAR dan fungsi-fungsi ini diekspor dari dateUtils.ts
import { safeParseDate, toSafeISOString } from '@/utils/dateUtils'; 

// Import semua tipe yang dibutuhkan dari AppDataContext.tsx
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
} from '@/contexts/AppDataContext'; // Asumsikan tipe diekspor dari AppDataContext

// ===============================================
// INTERFACES UNTUK DATA SUPABASE (snake_case)
// ===============================================
// Ini adalah representasi data saat berinteraksi dengan Supabase (nama kolom snake_case).
// Disesuaikan agar konsisten dengan skema DB Anda.

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
  items: any[]; // JSONB
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
  ingredients: any[]; // JSONB
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
  ingredients: any[]; // JSONB
  biaya_tenaga_kerja: number;
  biaya_overhead: number;
  margin_keuntungan: number;
  total_hpp: number;
  hpp_per_porsi: number;
  harga_jual_per_porsi: number;
  jumlah_porsi: number;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface TransformedActivity {
  id: string;
  title: string;
  description: string;
  type: string;
  value: string | null;
  user_id: string;
  created_at: string;
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
  items: any[]; // JSONB
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
  kategori: string | null; // Kolom DB 'kategori'
  nilai_awal: number; // Kolom DB 'nilai_awal'
  tanggal_beli: string; // Kolom DB 'tanggal_beli'
  nilai_sekarang: number; // Kolom DB 'nilai_sekarang'
  user_id: string;
  created_at: string;
  updated_at: string;
  kondisi: string | null;
  lokasi: string | null;
  deskripsi: string | null;
  depresiasi: number | null;
  umur_manfaat: number; 
  penyusutan_per_bulan: number;
}

interface TransformedFinancialTransaction {
  id: string;
  user_id: string;
  type: string;
  category: string | null; // Nullable
  amount: number;
  description: string | null; // Nullable
  date: string;
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
  recipe_categories: string[]; // TEXT[]
  financial_categories: string[]; // TEXT[]
}

// ===============================================
// PAYLOADS & LOADED DATA INTERFACES
// ===============================================
// Ini adalah interface yang mendefinisikan struktur data saat disinkronkan ke Supabase (SyncPayload)
// dan dimuat dari Supabase (LoadedData) dalam format frontend (camelCase).

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
  userSettings?: any; // AppDataContext's UserSettings type
}

// ===============================================
// useSupabaseSync HOOK
// ===============================================

export const useSupabaseSync = () => {
  const [isLoading, setIsLoading] = useState(false);

  // Fungsi untuk menyinkronkan data dari lokal ke Supabase (overwrite)
  const syncToSupabase = useCallback(async (transformedPayload: SyncPayload): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Anda harus login untuk menyinkronkan data');
        return false;
      }

      console.log('Starting sync to Supabase...');

      // Destructuring payload
      const { bahanBaku, suppliers, purchases, recipes, hppResults, activities, orders, assets, financialTransactions, userSettings } = transformedPayload; 
      const userId = session.user.id;

      // Hapus semua data lama user di Supabase sebelum upload yang baru (full replace strategy)
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

      const deleteResults = await Promise.all(deletePromises);
      for (const res of deleteResults) {
        if (res.error) throw res.error;
      }

      // Upsert (insert or update) data baru ke Supabase
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
        // Activities might be append-only, consider insert or upsert based on your DB setup
        // For simplicity, we'll upsert here. If you only insert, handle duplicates.
        syncPromises.push(supabase.from('activities').upsert(activities, { onConflict: 'id', ignoreDuplicates: false }));
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
      const hasError = results.some(res => res.error);

      if (hasError) {
        console.error('One or more sync operations failed:', upsertResults.filter(res => res.error));
        toast.error(`Gagal menyinkronkan data ke cloud (beberapa item mungkin gagal)`); 
        return false;
      }

      toast.success('Data berhasil disinkronkan ke cloud');
      return true;
    } catch (error: any) {
      console.error('Sync to Supabase failed:', error);
      toast.error(`Gagal menyinkronkan data ke cloud: ${error.message || 'Terjadi kesalahan tidak terduga'}`); 
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []); // Dependensi kosong karena semua variabel dari scope terluar adalah konstanta atau fungsi Supabase yang stabil

  // Fungsi untuk memuat semua data user dari Supabase
  const loadFromSupabase = useCallback(async (): Promise<LoadedData | null> => {
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

      // Tangani error dari setiap query secara individual
      if (bahanBakuRes.error) throw bahanBakuRes.error;
      if (suppliersRes.error) throw suppliersRes.error;
      if (purchasesRes.error) throw purchasesRes.error; 
      if (recipesRes.error) throw recipesRes.error;
      if (hppResultsRes.error) throw hppResultsRes.error;
      if (activitiesRes.error) throw activitiesRes.error;
      if (ordersRes.error) throw ordersRes.error;
      if (assetsRes.error) throw assetsRes.error;
      if (financialTransactionsRes.error) throw financialTransactionsRes.error;

      // Proses user settings
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
          recipeCategories: settingsRes.data.recipe_categories || [], // MODIFIED: Muat recipe_categories
          financialCategories: settingsRes.data.financial_categories || defaultSettings.financialCategories,
        };
      } else if (settingsRes.error && settingsRes.error.code !== 'PGRST116') {
        console.error('Error loading user settings:', settingsRes.error);
        toast.error(`Gagal memuat pengaturan pengguna: ${settingsRes.error.message || 'Error tidak diketahui'}`); 
      }

      // Transformasi data yang dimuat dari Supabase (snake_case) ke format frontend (camelCase)
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
          userId: item.user_id,
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
          userId: item.user_id,
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
          createdAt: safeParseDate(item.created_at),
          updatedAt: safeParseDate(item.updated_at),
        })) || [],
        recipes: recipesRes.data?.map((item: any) => ({
          id: item.id,
          namaResep: item.nama_resep || '',
          deskripsi: item.deskripsi || '',
          porsi: parseFloat(item.porsi) || 0,
          ingredients: item.ingredients || [],
          biayaTenagaKerja: parseFloat(item.biaya_tenaga_kerja) || 0, // KOREKSI: Pastikan nama kolom DB yang benar (biaya_tenaga_kerja)
          biayaOverhead: parseFloat(item.biaya_overhead) || 0,
          totalHPP: parseFloat(item.total_hpp) || 0,
          hppPerPorsi: parseFloat(item.hpp_per_porsi) || 0,
          marginKeuntungan: parseFloat(item.margin_keuntungan) || 0,
          hargaJualPerPorsi: parseFloat(item.harga_jual_per_porsi) || 0,
          category: item.category || '', // MODIFIED: Muat category
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
          timestamp: safeParseDate(item.created_at) || new Date(),
          createdAt: safeParseDate(item.created_at),
          updatedAt: safeParseDate(item.updated_at),
        })) || [],
        activities: activitiesRes.data?.map((item: any) => ({
          id: item.id,
          title: item.title || '',
          description: item.description || '',
          type: item.type || '',
          value: item.value || '',
          timestamp: safeParseDate(item.created_at) || new Date(),
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
          createdAt: safeParseDate(item.created_at),
          updatedAt: safeParseDate(item.updated_at),
        })) || [],
        assets: assetsRes.data?.map((item: any) => ({
          id: item.id,
          nama: item.nama || '',
          kategori: item.kategori || 'Peralatan', // MODIFIED: Fallback ke default, asumsikan ini dari DB `kategori`
          nilaiAwal: parseFloat(item.nilai_awal) || 0,
          nilaiSaatIni: parseFloat(item.nilai_sekarang) || 0,
          tanggalPembelian: safeParseDate(item.tanggal_beli) || new Date('1970-01-01T00:00:00Z'), // Jaminan valid Date
          kondisi: item.kondisi || 'Baik', // Fallback
          lokasi: item.lokasi || '',
          deskripsi: item.deskripsi || null,
          depresiasi: parseFloat(item.depresiasi) || null,
          umurManfaat: parseFloat(item.umur_manfaat) || 0, // Ensure umurManfaat is mapped
          penyusutanPerBulan: parseFloat(item.penyusutan_per_bulan) || 0, // Ensure penyusutanPerBulan is mapped
          userId: item.user_id,
          createdAt: safeParseDate(item.created_at),
          updatedAt: safeParseDate(item.updated_at),
        })) || [],
        financialTransactions: financialTransactionsRes.data?.map((item: any) => ({
          id: item.id,
          userId: item.user_id,
          type: item.type || '',
          category: item.category || '',
          amount: parseFloat(item.amount) || 0,
          description: item.description || '',
          date: safeParseDate(item.date) || new Date(),
          createdAt: safeParseDate(item.created_at),
          updatedAt: safeParseDate(item.updated_at),
        })) || [],
        userSettings: userSettingsData,
      };

      console.log('Data loaded from cloud:', cloudData);
      toast.success('Data berhasil dimuat dari cloud');
      return cloudData;
    } catch (error: any) {
      console.error('Load error:', error);
      toast.error(`Gagal memuat data dari cloud: ${error.message || 'Error tidak diketahui'}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getCloudStats = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;
      const userId = session.user.id;

      const [bahanBakuRes, suppliersRes, purchasesRes, recipesRes, hppResultsRes, activitiesRes, ordersRes, assetsRes, financialTransactionsRes] = await Promise.all([
        supabase.from('bahan_baku').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('suppliers').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('purchases').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('hpp_recipes').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('hpp_results').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('activities').select('*', { count: 'exact', head: true }).eq('user_id', userId),
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
  }, []);

  return {
    syncToSupabase,
    loadFromSupabase,
    getCloudStats,
    isLoading
  };
};