import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: {
        headers: {
          Authorization: req.headers.get('Authorization')
        }
      }
    });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({
        error: 'Unauthorized'
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Parse request body
    const body = await req.json();
    const { bahanBaku, suppliers, purchases, recipes, hppResults, activities, orders } = body;
    console.log('Received sync request for user:', user.id);
    try {
      // Sync bahan baku
      if (bahanBaku && bahanBaku.length > 0) {
        const bahanBakuData = bahanBaku.map((item)=>({
            id: item.id,
            user_id: user.id,
            nama: item.nama,
            kategori: item.kategori,
            stok: parseFloat(item.stok) || 0,
            satuan: item.satuan,
            minimum: parseFloat(item.minimum) || 0,
            harga_satuan: parseFloat(item.hargaSatuan) || 0,
            supplier: item.supplier,
            tanggal_kadaluwarsa: item.tanggalKadaluwarsa ? new Date(item.tanggalKadaluwarsa).toISOString() : null
          }));
        const { error: bahanBakuError } = await supabase.from('bahan_baku').upsert(bahanBakuData, {
          onConflict: 'id'
        });
        if (bahanBakuError) {
          console.error('Bahan baku sync error:', bahanBakuError);
          throw bahanBakuError;
        }
        console.log(`Synced ${bahanBakuData.length} bahan baku items`);
      }
      // Sync suppliers
      if (suppliers && suppliers.length > 0) {
        const suppliersData = suppliers.map((item)=>({
            id: item.id,
            user_id: user.id,
            nama: item.nama,
            kontak: item.kontak,
            email: item.email,
            telepon: item.telepon,
            alamat: item.alamat,
            catatan: item.catatan
          }));
        const { error: suppliersError } = await supabase.from('suppliers').upsert(suppliersData, {
          onConflict: 'id'
        });
        if (suppliersError) {
          console.error('Suppliers sync error:', suppliersError);
          throw suppliersError;
        }
        console.log(`Synced ${suppliersData.length} suppliers`);
      }
      // Sync purchases
      if (purchases && purchases.length > 0) {
        const purchasesData = purchases.map((item)=>({
            id: item.id,
            user_id: user.id,
            tanggal: new Date(item.tanggal).toISOString(),
            supplier: item.supplier,
            items: item.items,
            total_nilai: parseFloat(item.total_nilai ?? item.totalNilai) || 0,
            status: item.status,
            metode_perhitungan: item.metode_perhitungan ?? item.metodePerhitungan,
            catatan: item.catatan
          }));
        const { error: purchasesError } = await supabase.from('purchases').upsert(purchasesData, {
          onConflict: 'id'
        });
        if (purchasesError) {
          console.error('Purchases sync error:', purchasesError);
          throw purchasesError;
        }
        console.log(`Synced ${purchasesData.length} purchases`);
      }
      // Sync recipes
      if (recipes && recipes.length > 0) {
        const recipesData = recipes.map((item)=>({
            id: item.id,
            user_id: user.id,
            nama_resep: item.namaResep,
            deskripsi: item.deskripsi,
            porsi: parseInt(item.porsi) || 1,
            ingredients: item.ingredients || [],
            biaya_tenaga_kerja: parseFloat(item.biayaTenagaKerja) || 0,
            biaya_overhead: parseFloat(item.biayaOverhead) || 0,
            total_hpp: parseFloat(item.totalHPP) || 0,
            hpp_per_porsi: parseFloat(item.hppPerPorsi) || 0,
            margin_keuntungan: parseFloat(item.marginKeuntungan) || 0,
            harga_jual_porsi: parseFloat(item.hargaJualPorsi) || 0
          }));
        const { error: recipesError } = await supabase.from('hpp_recipes').upsert(recipesData, {
          onConflict: 'id'
        });
        if (recipesError) {
          console.error('Recipes sync error:', recipesError);
          throw recipesError;
        }
        console.log(`Synced ${recipesData.length} recipes`);
      }
      // Sync HPP results
      if (hppResults && hppResults.length > 0) {
        const hppResultsData = hppResults.map((item)=>({
            id: item.id,
            user_id: user.id,
            nama: item.nama,
            ingredients: item.ingredients || [],
            biaya_tenaga_kerja: parseFloat(item.biayaTenagaKerja) || 0,
            biaya_overhead: parseFloat(item.biayaOverhead) || 0,
            margin_keuntungan: parseFloat(item.marginKeuntungan) || 0,
            total_hpp: parseFloat(item.totalHPP) || 0,
            hpp_per_porsi: parseFloat(item.hppPerPorsi) || 0,
            harga_jual_porsi: parseFloat(item.hargaJualPorsi) || 0,
            jumlah_porsi: parseInt(item.jumlahPorsi) || 1
          }));
        const { error: hppResultsError } = await supabase.from('hpp_results').upsert(hppResultsData, {
          onConflict: 'id'
        });
        if (hppResultsError) {
          console.error('HPP results sync error:', hppResultsError);
          throw hppResultsError;
        }
        console.log(`Synced ${hppResultsData.length} HPP results`);
      }
      // Sync orders
      if (orders && orders.length > 0) {
        const ordersData = orders.map((item)=>({
            id: item.id,
            user_id: user.id,
            nomor_pesanan: item.nomorPesanan,
            nama_pelanggan: item.namaPelanggan,
            telepon_pelanggan: item.teleponPelanggan,
            email_pelanggan: item.emailPelanggan,
            alamat_pengiriman: item.alamatPelanggan,
            tanggal: new Date(item.tanggal).toISOString(),
            items: item.items || [],
            total_pesanan: parseFloat(item.totalPesanan) || 0,
            status: item.status,
            catatan: item.catatan
          }));
        const { error: ordersError } = await supabase.from('orders').upsert(ordersData, {
          onConflict: 'id'
        });
        if (ordersError) {
          console.error('Orders sync error:', ordersError);
          throw ordersError;
        }
        console.log(`Synced ${ordersData.length} orders`);
      }
      // Sync activities
      if (activities && activities.length > 0) {
        const activitiesData = activities.map((item)=>({
            id: item.id,
            user_id: user.id,
            title: item.title,
            description: item.description,
            type: item.type,
            value: item.value,
            created_at: new Date(item.timestamp).toISOString()
          }));
        const { error: activitiesError } = await supabase.from('activities').upsert(activitiesData, {
          onConflict: 'id'
        });
        if (activitiesError) {
          console.error('Activities sync error:', activitiesError);
          throw activitiesError;
        }
        console.log(`Synced ${activitiesData.length} activities`);
      }
      console.log('Sync completed successfully for user:', user.id);
      return new Response(JSON.stringify({
        success: true,
        message: 'Data synced successfully',
        syncedData: {
          bahanBaku: bahanBaku?.length || 0,
          suppliers: suppliers?.length || 0,
          purchases: purchases?.length || 0,
          recipes: recipes?.length || 0,
          hppResults: hppResults?.length || 0,
          activities: activities?.length || 0,
          orders: orders?.length || 0
        }
      }), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    } catch (syncError) {
      console.error('Sync operation failed:', syncError);
      return new Response(JSON.stringify({
        error: 'Sync failed: ' + syncError.message
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
  } catch (error) {
    console.error('General error in hpp-data function:', error);
    return new Response(JSON.stringify({
      error: 'Function error: ' + error.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
