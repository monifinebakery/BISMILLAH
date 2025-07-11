import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAppData } from '@/contexts/AppDataContext';
import { toast } from 'sonner';

export const useSupabaseSync = () => {
  const [isLoading, setIsLoading] = useState(false);
  
  let appData;
  try {
    appData = useAppData();
  } catch (error) {
    return {
      syncToSupabase: async () => false,
      loadFromSupabase: async () => null,
      getCloudStats: async () => null,
      isLoading: false
    };
  }

  const { 
    bahanBaku, 
    purchases, 
    recipes, 
    hppResults, 
    activities,
    orders 
  } = appData;

  const syncToSupabase = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Anda harus login untuk menyinkronkan data');
        return false;
      }

      console.log('Starting sync to Supabase...');

      // Sync hpp_results to database
      if (hppResults && hppResults.length > 0) {
        for (const result of hppResults) {
          const { error: hppError } = await supabase
            .from('hpp_results')
            .upsert({
              id: result.id,
              user_id: session.user.id,
              nama: result.nama,
              ingredients: JSON.parse(JSON.stringify(result.ingredients)),
              biaya_tenaga_kerja: result.biayaTenagaKerja,
              biaya_overhead: result.biayaOverhead,
              margin_keuntungan: result.marginKeuntungan,
              total_hpp: result.totalHPP,
              hpp_per_porsi: result.hppPerPorsi,
              harga_jual_per_porsi: result.hargaJualPerPorsi,
              jumlah_porsi: result.jumlahPorsi,
            });

          if (hppError) {
            console.error('Error syncing HPP result:', hppError);
          }
        }
      }

      // Sync recipes to database
      if (recipes && recipes.length > 0) {
        for (const recipe of recipes) {
          const { error: recipeError } = await supabase
            .from('hpp_recipes')
            .upsert({
              id: recipe.id,
              user_id: session.user.id,
              nama_resep: recipe.namaResep,
              deskripsi: recipe.deskripsi,
              porsi: recipe.porsi,
              ingredients: JSON.parse(JSON.stringify(recipe.ingredients)),
              biaya_tenaga_kerja: recipe.biayaTenagaKerja,
              biaya_overhead: recipe.biayaOverhead,
              margin_keuntungan: recipe.marginKeuntungan,
              total_hpp: recipe.totalHPP,
              hpp_per_porsi: recipe.hppPerPorsi,
              harga_jual_per_porsi: recipe.hargaJualPerPorsi,
            });

          if (recipeError) {
            console.error('Error syncing recipe:', recipeError);
          }
        }
      }

      // Sync orders to database
      if (orders && orders.length > 0) {
        for (const order of orders) {
          const { error: orderError } = await supabase
            .from('orders')
            .upsert({
              id: order.id,
              user_id: session.user.id,
              nomor_pesanan: order.nomorPesanan,
              tanggal: order.tanggal.toISOString(),
              nama_pelanggan: order.namaPelanggan,
              email_pelanggan: order.emailPelanggan,
              telepon_pelanggan: order.teleponPelanggan,
              alamat_pengiriman: order.alamatPelanggan,
              items: JSON.parse(JSON.stringify(order.items)),
              total_pesanan: order.totalPesanan,
              status: order.status,
              catatan: order.catatan,
            });

          if (orderError) {
            console.error('Error syncing order:', orderError);
          }
        }
      }

      // Sync user settings
      try {
        const savedSettings = localStorage.getItem('appSettings');
        if (savedSettings) {
          const settings = JSON.parse(savedSettings);
          const { error: settingsError } = await supabase
            .from('user_settings')
            .upsert({
              user_id: session.user.id,
              business_name: settings.businessName || 'Toko Roti Bahagia',
              owner_name: settings.ownerName || 'John Doe',
              email: settings.email,
              phone: settings.phone,
              address: settings.address,
              currency: settings.currency || 'IDR',
              language: settings.language || 'id',
              notifications: settings.notifications || {
                lowStock: true,
                newOrder: true,
                financial: false,
                email: true,
                push: false,
              },
              backup_settings: settings.backup || {
                auto: false,
                frequency: 'daily',
                location: 'cloud',
              },
              security_settings: settings.security || {
                twoFactor: false,
                sessionTimeout: '30',
                passwordRequirement: 'medium',
              },
            }, { onConflict: 'user_id' });

          if (settingsError) {
            console.error('Error syncing settings:', settingsError);
          }
        }
      } catch (settingsError) {
        console.error('Error processing settings sync:', settingsError);
      }

      toast.success('Data berhasil disinkronkan ke cloud');
      return true;
    } catch (error: any) {
      console.error('Sync error:', error);
      toast.error('Gagal menyinkronkan data ke cloud');
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
        supabase.from('financial_transactions').select('*').eq('user_id', session.user.id).order('date', { ascending: false }),
        supabase.from('user_settings').select('*').eq('user_id', session.user.id).single()
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

      // Load settings and save to localStorage
      if (settingsRes.data && !settingsRes.error) {
        const cloudSettings = {
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
        };
        localStorage.setItem('appSettings', JSON.stringify(cloudSettings));
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
          tanggal: safeParseDate(item.tanggal),
          supplier: item.supplier,
          items: item.items || [],
          totalNilai: parseFloat(item.total_nilai) || 0,
          status: item.status,
          metodePerhitungan: item.metode_perhitungan,
          catatan: item.catatan,
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
          timestamp: safeParseDate(item.created_at),
        })) || [],
        activities: activitiesRes.data?.map((item: any) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          type: item.type,
          value: item.value,
          timestamp: safeParseDate(item.created_at),
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
          subtotal: parseFloat(item.total_pesanan) * 0.9 || 0,
          pajak: parseFloat(item.total_pesanan) * 0.1 || 0,
          totalPesanan: parseFloat(item.total_pesanan) || 0,
          status: item.status,
          catatan: item.catatan,
        })) || [],
        assets: assetsRes.data?.map((item: any) => ({
          id: item.id,
          nama: item.nama,
          kategori: item.kategori,
          nilaiAwal: parseFloat(item.nilai_awal) || 0,
          nilaiSekarang: parseFloat(item.nilai_sekarang) || 0,
          tanggalBeli: item.tanggal_beli,
          kondisi: item.kondisi,
          lokasi: item.lokasi,
          deskripsi: item.deskripsi,
          depresiasi: parseFloat(item.depresiasi) || 0,
        })) || [],
        financialTransactions: financialTransactionsRes.data?.map((item: any) => ({
          id: item.id,
          type: item.type as 'income' | 'expense',
          category: item.category,
          amount: parseFloat(item.amount) || 0,
          description: item.description,
          date: safeParseDate(item.date),
          createdAt: safeParseDate(item.created_at),
        })) || []
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
