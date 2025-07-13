import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAppData } from '@/contexts/AppDataContext'; // MODIFIED: useAppData diimpor di sini
import { toast } from 'sonner';

// MODIFIED: Tambahkan interface untuk data yang akan disinkronkan
interface SyncPayload {
  bahanBaku: any[];
  suppliers: any[];
  purchases: any[];
  recipes: any[];
  hppResults: any[];
  activities: any[];
  orders: any[];
  assets: any[];
  financialTransactions: any[];
  userSettings?: any; // user_settings mungkin tidak selalu ada di payload ini
}

export const useSupabaseSync = () => {
  const [isLoading, setIsLoading] = useState(false);
  
  // MODIFIED: useAppData dipanggil di luar try-catch untuk memastikan hook dipanggil di root komponen
  // Namun, kita perlu memastikan AppDataProvider sudah ada di atasnya.
  // Jika ini menyebabkan error "useAppData must be used within an AppDataProvider",
  // maka Anda perlu memastikan AppDataProvider membungkus semua komponen yang menggunakan useSupabaseSync.
  // Untuk tujuan ini, kita akan asumsikan AppDataProvider adalah parent yang tepat.
  const appData = useAppData();

  const { 
    bahanBaku, 
    suppliers, // MODIFIED: Tambahkan suppliers
    purchases, 
    recipes, 
    hppResults, 
    activities,
    orders,
    assets, // MODIFIED: Tambahkan assets
    financialTransactions, // MODIFIED: Tambahkan financialTransactions
  } = appData;


  const syncToSupabase = async (transformedPayload: SyncPayload): Promise<boolean> => { // MODIFIED: Menerima transformedPayload
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Anda harus login untuk menyinkronkan data');
        return false;
      }

      console.log('Starting sync to Supabase...');

      // Gunakan transformedPayload yang sudah diterima
      const { bahanBaku, suppliers, purchases, recipes, hppResults, activities, orders, assets, financialTransactions, userSettings } = transformedPayload;

      // Array of promises for all upsert operations
      const syncPromises = [];

      // Sync bahan_baku
      if (bahanBaku && bahanBaku.length > 0) {
        syncPromises.push(supabase.from('bahan_baku').upsert(bahanBaku, { onConflict: 'id' }));
      } else { // Jika data kosong, hapus semua data user_id
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
        // Activities might be append-only, consider insert or upsert based on your DB setup
        // For simplicity, we'll upsert here. If you only insert, handle duplicates.
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
      } else { // If userSettings is null/undefined, delete existing one for this user
        syncPromises.push(supabase.from('user_settings').delete().eq('user_id', session.user.id));
      }

      // Execute all sync promises
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

  const safeParseDate = (dateValue: any) => {
    try {
      if (!dateValue) return new Date();
      
      if (dateValue instanceof Date) {
        return isNaN(dateValue.getTime()) ? new Date() : dateValue;
      }
      
      const parsed = new Date(dateValue);
      return isNaN(parsed.getTime()) ? new Date() : parsed;
    } catch (error) {
      console.error('Error parsing date:', error, dateValue);
      return new Date();
    }
  };

  const loadFromSupabase = async () => {
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
        supabase.from('hpp_recipes').select('*').eq('user_id', session.user.id),
        supabase.from('hpp_results').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }),
        supabase.from('activities').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }).limit(50),
        supabase.from('orders').select('*').eq('user_id', session.user.id).order('tanggal', { ascending: false }),
        supabase.from('assets').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }),
        supabase.from('financial_transactions').select('*').eq('user_id', session.user.id).order('tanggal', { ascending: false }), // MODIFIED: Order by 'tanggal'
        supabase.from('user_settings').select('*').eq('user_id', session.user.id).single()
      ]);

      // Check for errors and throw if any critical error
      if (bahanBakuRes.error) throw bahanBakuRes.error;
      if (suppliersRes.error) throw suppliersRes.error;
      if (purchasesRes.error) throw purchasesRes.res.error; // Fix: purchasesRes.res.error -> purchasesRes.error
      if (recipesRes.error) throw recipesRes.error;
      if (hppResultsRes.error) throw hppResultsRes.error;
      if (activitiesRes.error) throw activitiesRes.error;
      if (ordersRes.error) throw ordersRes.error;
      if (assetsRes.error) throw assetsRes.error;
      if (financialTransactionsRes.error) throw financialTransactionsRes.error;
      // settingsRes might return PGRST116 (no rows found) which is okay, handle it below

      // Load settings and save to localStorage (handled by useUserSettings hook)
      // We still return it as part of cloudData for AppDataContext to potentially use
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
          recipeCategories: settingsRes.data.recipe_categories || [], // MODIFIED: Load recipe_categories
        };
        localStorage.setItem('appSettings', JSON.stringify(userSettingsData));
      } else if (settingsRes.error && settingsRes.error.code !== 'PGRST116') {
        console.error('Error loading user settings:', settingsRes.error);
        toast.error(`Gagal memuat pengaturan pengguna: ${settingsRes.error.message}`);
      }


      const cloudData = {
        bahanBaku: bahanBakuRes.data?.map((item: any) => ({
          id: item.id,
          nama: item.nama,
          kategori: item.kategori,
          stok: parseFloat(item.stok) || 0,
          satuan: item.satuan,
          minimum: parseFloat(item.minimum) || 0,
          hargaSatuan: parseFloat(item.harga_satuan) || 0,
          supplier: item.supplier,
          tanggalKadaluwarsa: item.tanggal_kadaluwarsa ? safeParseDate(item.tanggal_kadaluwarsa) : undefined,
          user_id: item.user_id, // Pastikan user_id juga dimuat
          created_at: safeParseDate(item.created_at),
          updated_at: safeParseDate(item.updated_at),
        })) || [],
        suppliers: suppliersRes.data?.map((item: any) => ({
          id: item.id,
          nama: item.nama,
          kontak: item.kontak,
          email: item.email,
          telepon: item.telepon,
          alamat: item.alamat,
          catatan: item.catatan,
          user_id: item.user_id, // Pastikan user_id juga dimuat
          createdAt: safeParseDate(item.created_at),
          updatedAt: safeParseDate(item.updated_at),
        })) || [],
        purchases: purchasesRes.data?.map((item: any) => ({
          id: item.id,
          tanggal: safeParseDate(item.tanggal),
          supplier: item.supplier,
          items: item.items || [],
          totalNilai: parseFloat(item.total_nilai) || 0,
          status: item.status,
          metodePerhitungan: item.metode_perhitungan,
          catatan: item.catatan,
          user_id: item.user_id, // Pastikan user_id juga dimuat
          created_at: safeParseDate(item.created_at),
          updated_at: safeParseDate(item.updated_at),
        })) || [],
        recipes: recipesRes.data?.map((item: any) => ({
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
          category: item.category, // MODIFIED: Muat category
          user_id: item.user_id, // Pastikan user_id juga dimuat
          createdAt: safeParseDate(item.created_at),
          updatedAt: safeParseDate(item.updated_at),
        })) || [],
        hppResults: hppResultsRes.data?.map((item: any) => ({
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
          timestamp: safeParseDate(item.created_at), // timestamp is created_at from DB
          user_id: item.user_id, // Pastikan user_id juga dimuat
          created_at: safeParseDate(item.created_at),
          updated_at: safeParseDate(item.updated_at),
        })) || [],
        activities: activitiesRes.data?.map((item: any) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          type: item.type,
          value: item.value,
          timestamp: safeParseDate(item.created_at),
          user_id: item.user_id, // Pastikan user_id juga dimuat
          created_at: safeParseDate(item.created_at),
          updated_at: safeParseDate(item.updated_at),
        })) || [],
        orders: ordersRes.data?.map((item: any) => ({
          id: item.id,
          nomorPesanan: item.nomor_pesanan,
          tanggal: safeParseDate(item.tanggal),
          namaPelanggan: item.nama_pelanggan,
          emailPelanggan: item.email_pelanggan,
          teleponPelanggan: item.telepon_pelanggan,
          alamatPelanggan: item.alamat_pengiriman,
          items: item.items || [],
          subtotal: parseFloat(item.subtotal) || 0,
          pajak: parseFloat(item.pajak) || 0,
          totalPesanan: parseFloat(item.total_pesanan) || 0,
          status: item.status,
          catatan: item.catatan,
          user_id: item.user_id, // Pastikan user_id juga dimuat
          created_at: safeParseDate(item.created_at),
          updated_at: safeParseDate(item.updated_at),
        })) || [],
        assets: assetsRes.data?.map((item: any) => ({
          id: item.id,
          nama: item.nama,
          jenis: item.jenis,
          nilai: parseFloat(item.nilai) || 0,
          umurManfaat: parseFloat(item.umur_manfaat) || 0,
          tanggalPembelian: safeParseDate(item.tanggal_pembelian),
          penyusutanPerBulan: parseFloat(item.penyusutan_per_bulan) || 0,
          nilaiSaatIni: parseFloat(item.nilai_saat_ini) || 0,
          user_id: item.user_id,
          created_at: safeParseDate(item.created_at),
          updated_at: safeParseDate(item.updated_at),
        })) || [],
        financialTransactions: financialTransactionsRes.data?.map((item: any) => ({
          id: item.id,
          tanggal: safeParseDate(item.tanggal),
          jenis: item.jenis,
          deskripsi: item.deskripsi,
          jumlah: parseFloat(item.jumlah) || 0,
          user_id: item.user_id,
          created_at: safeParseDate(item.created_at),
          updated_at: safeParseDate(item.updated_at),
        })) || [],
        userSettings: userSettingsData, // MODIFIED: Sertakan userSettings
      };

      console.log('Data loaded from cloud:', cloudData);
      toast.success('Data berhasil dimuat dari cloud');
      return cloudData; // PENTING: Kembalikan data yang dimuat
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
