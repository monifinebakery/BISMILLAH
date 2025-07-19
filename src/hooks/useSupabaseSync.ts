import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { safeParseDate, toSafeISOString } from '@/utils/dateUtils';

// PERBAIKAN: Impor tipe dari file terpusat, bukan dari AppDataContext
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
} from '@/types';

// ===============================================
// INTERFACES UNTUK DATA SUPABASE (snake_case)
// ===============================================
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

interface TransformedAsset {
  id: string;
  nama: string;
  kategori: string | null;
  nilai_awal: number;
  tanggal_beli: string;
  nilai_sekarang: number;
  user_id: string;
  created_at: string;
  updated_at: string;
  kondisi: string | null;
  lokasi: string | null;
  deskripsi: string | null;
  depresiasi: number | null;
  // PERBAIKAN: Menambahkan properti yang hilang agar sesuai dengan logika load
  umur_manfaat: number | null;
  penyusutan_per_bulan: number | null;
}

// (Interface lain yang relevan seperti TransformedSupplier, dll.)

// ===============================================
// PAYLOADS & LOADED DATA INTERFACES
// ===============================================
export interface SyncPayload {
  bahanBaku: TransformedBahanBaku[];
  suppliers: any[];
  purchases: any[];
  recipes: any[];
  hppResults: any[];
  activities: any[];
  orders: any[];
  assets: TransformedAsset[];
  financialTransactions: any[];
  userSettings?: any;
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
  userSettings?: any;
}

// ===============================================
// useSupabaseSync HOOK
// ===============================================

export const useSupabaseSync = () => {
  const [isLoading, setIsLoading] = useState(false);

  const syncToSupabase = useCallback(async (transformedPayload: SyncPayload): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Anda harus login untuk menyinkronkan data');
        return false;
      }

      const { bahanBaku, suppliers, purchases, recipes, hppResults, activities, orders, assets, financialTransactions, userSettings } = transformedPayload;
      const userId = session.user.id;

      // Hapus semua data lama user
      const tablesToDelete = ['bahan_baku', 'suppliers', 'purchases', 'hpp_recipes', 'hpp_results', 'activities', 'orders', 'assets', 'financial_transactions'];
      const deletePromises = tablesToDelete.map(table => supabase.from(table).delete().eq('user_id', userId));
      
      const deleteResults = await Promise.all(deletePromises);
      for (const res of deleteResults) {
        if (res.error) throw res.error;
      }

      // Upsert (insert atau update) data baru
      const upsertPromises = [];
      if (bahanBaku?.length > 0) upsertPromises.push(supabase.from('bahan_baku').upsert(bahanBaku));
      if (suppliers?.length > 0) upsertPromises.push(supabase.from('suppliers').upsert(suppliers));
      if (purchases?.length > 0) upsertPromises.push(supabase.from('purchases').upsert(purchases));
      if (recipes?.length > 0) upsertPromises.push(supabase.from('hpp_recipes').upsert(recipes));
      if (hppResults?.length > 0) upsertPromises.push(supabase.from('hpp_results').upsert(hppResults));
      // PERBAIKAN: Variabel `syncPromises` diubah menjadi `upsertPromises`
      if (activities?.length > 0) upsertPromises.push(supabase.from('activities').upsert(activities));
      if (orders?.length > 0) upsertPromises.push(supabase.from('orders').upsert(orders));
      if (assets?.length > 0) upsertPromises.push(supabase.from('assets').upsert(assets));
      if (financialTransactions?.length > 0) upsertPromises.push(supabase.from('financial_transactions').upsert(financialTransactions));
      if (userSettings) upsertPromises.push(supabase.from('user_settings').upsert(userSettings, { onConflict: 'user_id' }));

      const upsertResults = await Promise.all(upsertPromises);
      // PERBAIKAN: Variabel `results` diubah menjadi `upsertResults`
      const hasError = upsertResults.some(res => res.error);

      if (hasError) {
        console.error('Satu atau lebih operasi sinkronisasi gagal:', upsertResults.filter(res => res.error));
        toast.error('Gagal menyinkronkan sebagian data ke cloud.');
        return false;
      }

      toast.success('Data berhasil disinkronkan ke cloud');
      return true;
    } catch (error: any) {
      console.error('Sinkronisasi ke Supabase gagal:', error);
      toast.error(`Gagal menyinkronkan data: ${error.message || 'Error tidak diketahui'}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadFromSupabase = useCallback(async (): Promise<LoadedData | null> => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Anda harus login untuk memuat data');
        return null;
      }

      const userId = session.user.id;
      const results = await Promise.all([
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

      const [
        bahanBakuRes, suppliersRes, purchasesRes, recipesRes, hppResultsRes, 
        activitiesRes, ordersRes, assetsRes, financialTransactionsRes, settingsRes
      ] = results;

      for (const res of results) {
        if (res.error && res.error.code !== 'PGRST116') { // Abaikan error 'not found' untuk settings
          throw res.error;
        }
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
          createdAt: safeParseDate(item.created_at),
          updatedAt: safeParseDate(item.updated_at),
          jumlahBeliKemasan: item.jumlah_beli_kemasan,
          satuanKemasan: item.satuan_kemasan,
          hargaTotalBeliKemasan: item.harga_total_beli_kemasan,
        })) || [],
        suppliers: suppliersRes.data?.map((item: any) => ({
          id: item.id,
          nama: item.nama,
          kontak: item.kontak,
          email: item.email,
          telepon: item.telepon,
          alamat: item.alamat,
          catatan: item.catatan,
          createdAt: safeParseDate(item.created_at),
          updatedAt: safeParseDate(item.updated_at),
        })) || [],
        purchases: purchasesRes.data?.map((item: any) => ({
          id: item.id,
          tanggal: safeParseDate(item.tanggal) || new Date(),
          supplier: item.supplier,
          items: item.items || [],
          totalNilai: parseFloat(item.total_nilai) || 0,
          status: item.status,
          metodePerhitungan: item.metode_perhitungan,
          catatan: item.catatan,
          createdAt: safeParseDate(item.created_at),
          updatedAt: safeParseDate(item.updated_at),
        })) || [],
        recipes: recipesRes.data?.map((item: any) => ({
            id: item.id,
            namaResep: item.nama_resep,
            deskripsi: item.deskripsi,
            porsi: item.porsi,
            ingredients: item.ingredients || [],
            biayaTenagaKerja: item.biaya_tenaga_kerja,
            biayaOverhead: item.biaya_overhead,
            totalHPP: item.total_hpp,
            hppPerPorsi: item.hpp_per_porsi,
            marginKeuntungan: item.margin_keuntungan,
            hargaJualPerPorsi: item.harga_jual_per_porsi,
            category: item.category,
            createdAt: safeParseDate(item.created_at),
            updatedAt: safeParseDate(item.updated_at),
        })) || [],
        hppResults: hppResultsRes.data?.map((item: any) => ({
            id: item.id,
            nama: item.nama,
            ingredients: item.ingredients || [],
            biayaTenagaKerja: item.biaya_tenaga_kerja,
            biayaOverhead: item.biaya_overhead,
            marginKeuntungan: item.margin_keuntungan,
            totalHPP: item.total_hpp,
            hppPerPorsi: item.hpp_per_porsi,
            hargaJualPerPorsi: item.harga_jual_per_porsi,
            jumlahPorsi: item.jumlah_porsi,
            timestamp: safeParseDate(item.created_at) || new Date(),
            createdAt: safeParseDate(item.created_at),
            updatedAt: safeParseDate(item.updated_at),
        })) || [],
        activities: activitiesRes.data?.map((item: any) => ({
            id: item.id,
            title: item.title,
            description: item.description,
            type: item.type,
            value: item.value,
            timestamp: safeParseDate(item.created_at) || new Date(),
            createdAt: safeParseDate(item.created_at),
            updatedAt: safeParseDate(item.updated_at),
        })) || [],
        orders: ordersRes.data?.map((item: any) => ({
            id: item.id,
            nomorPesanan: item.nomor_pesanan,
            tanggal: safeParseDate(item.tanggal) || new Date(),
            namaPelanggan: item.nama_pelanggan,
            emailPelanggan: item.email_pelanggan,
            teleponPelanggan: item.telepon_pelanggan,
            alamatPelanggan: item.alamat_pengiriman,
            items: item.items || [],
            subtotal: item.subtotal,
            pajak: item.pajak,
            totalPesanan: item.total_pesanan,
            status: item.status,
            catatan: item.catatan,
            createdAt: safeParseDate(item.created_at),
            updatedAt: safeParseDate(item.updated_at),
        })) || [],
        assets: assetsRes.data?.map((item: any) => ({
            id: item.id,
            nama: item.nama,
            kategori: item.kategori,
            nilaiAwal: item.nilai_awal,
            nilaiSaatIni: item.nilai_sekarang,
            tanggalPembelian: safeParseDate(item.tanggal_beli) || new Date(),
            kondisi: item.kondisi,
            lokasi: item.lokasi,
            deskripsi: item.deskripsi,
            depresiasi: item.depresiasi,
            umurManfaat: item.umur_manfaat,
            penyusutanPerBulan: item.penyusutan_per_bulan,
            createdAt: safeParseDate(item.created_at),
            updatedAt: safeParseDate(item.updated_at),
        })) || [],
        financialTransactions: financialTransactionsRes.data?.map((item: any) => ({
            id: item.id,
            userId: item.user_id,
            type: item.type,
            category: item.category,
            amount: item.amount,
            description: item.description,
            date: safeParseDate(item.date) || new Date(),
            createdAt: safeParseDate(item.created_at),
            updatedAt: safeParseDate(item.updated_at),
        })) || [],
        userSettings: settingsRes.data || null,
      };

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

      const responses = await Promise.all([
        supabase.from('bahan_baku').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('suppliers').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('purchases').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('hpp_recipes').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('assets').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('financial_transactions').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      ]);

      return {
        totalBahanBaku: responses[0].count || 0,
        totalSuppliers: responses[1].count || 0,
        totalPurchases: responses[2].count || 0,
        totalRecipes: responses[3].count || 0,
        totalOrders: responses[4].count || 0,
        totalAssets: responses[5].count || 0,
        totalFinancialTransactions: responses[6].count || 0,
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