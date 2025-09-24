import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

interface ChatbotQueryRequest {
  intent: string;
  message: string;
  context?: {
    currentPage?: string;
    businessName?: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: req.headers.get('Authorization') ?? ''
          }
        }
      }
    );

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({
        error: 'Unauthorized',
        type: 'error'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Parse request
    const { intent, message }: ChatbotQueryRequest = await req.json();

    let result: any = null;

    // Simple intent routing
    switch (intent) {
      case 'inventory':
        result = await handleInventoryQuery(supabase, user.id, message);
        break;
      case 'orderSearch':
        result = await handleOrderSearch(supabase, user.id, message);
        break;
      case 'report':
        result = await handleReportQuery(supabase, user.id, message);
        break;
      default:
        result = {
          type: 'general',
          text: `Halo! Saya bisa membantu Anda dengan:
• Cek stok bahan baku: "cek stok bahan baku"
• Cari pesanan: "cari pesanan"
• Laporan penjualan: "laporan bulan ini"

Coba ketik salah satu perintah di atas! 😊`
        };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Chatbot error:', error);
    return new Response(JSON.stringify({
      error: error.message || 'Internal server error',
      type: 'error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Handle inventory queries
async function handleInventoryQuery(supabase: any, userId: string, message: string) {
  try {
    // Query bahan_baku table
    const { data: materials, error } = await supabase
      .from('bahan_baku')
      .select('id, nama, stok, satuan, minimum, harga_satuan, kategori, supplier')
      .eq('user_id', userId)
      .order('nama');

    if (error) throw error;

    if (!materials || materials.length === 0) {
      return {
        type: 'inventory',
        text: '📦 Belum ada data bahan baku di warehouse Anda.\n\n💡 Untuk menambah bahan baku:\n1. Buka menu "Warehouse"\n2. Klik "Tambah Bahan Baku"\n3. Isi data bahan baku Anda'
      };
    }

    // Format inventory list
    const inventoryList = materials.map((item: any) => {
      const status = item.stok <= (item.minimum || 0) ? '⚠️ PERLU RESTOCK' : '✅ OK';
      const price = item.harga_satuan ? ` - Rp ${item.harga_satuan.toLocaleString('id-ID')}` : '';
      const supplier = item.supplier ? ` (${item.supplier})` : '';
      return `• ${item.nama}: ${item.stok} ${item.satuan} ${status}${price}${supplier}`;
    }).join('\n');

    const lowStock = materials.filter((item: any) => item.stok <= (item.minimum || 0));

    let text = `📦 Status Warehouse Bahan Baku:\n\n${inventoryList}`;

    if (lowStock.length > 0) {
      text += `\n\n⚠️ ${lowStock.length} bahan perlu direstock segera!`;
    }

    return {
      type: 'inventory',
      text: text,
      data: materials
    };

  } catch (error: any) {
    console.error('Inventory query error:', error);
    return {
      type: 'error',
      text: `❌ Gagal mengakses data warehouse: ${error.message}`
    };
  }
}

// Handle order search queries
async function handleOrderSearch(supabase: any, userId: string, message: string) {
  try {
    // Query orders table
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id,
        nomor_pesanan,
        nama_pelanggan,
        total_harga,
        status,
        created_at,
        order_items (
          nama_produk,
          jumlah,
          harga_satuan,
          total_harga
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) throw error;

    if (!orders || orders.length === 0) {
      return {
        type: 'orderSearch',
        text: '🔍 Tidak ada data pesanan ditemukan.'
      };
    }

    // Format order list
    const orderList = orders.map((order: any) => {
      const date = new Date(order.created_at).toLocaleDateString('id-ID');
      const status = getOrderStatusText(order.status);
      const total = `Rp ${order.total_harga.toLocaleString('id-ID')}`;
      return `• ${order.nomor_pesanan}: ${order.nama_pelanggan} - ${total} (${status}) - ${date}`;
    }).join('\n');

    return {
      type: 'orderSearch',
      text: `📋 Data Pesanan Terbaru:\n\n${orderList}\n\n💡 Ketik "detail pesanan [nomor]" untuk info lengkap`,
      data: orders
    };

  } catch (error: any) {
    console.error('Order search error:', error);
    return {
      type: 'error',
      text: `❌ Gagal mencari data pesanan: ${error.message}`
    };
  }
}

// Handle report queries
async function handleReportQuery(supabase: any, userId: string, message: string) {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

    // Get sales data
    const { data: sales, error: salesError } = await supabase
      .from('orders')
      .select('total_harga')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('created_at', `${currentMonth}-01T00:00:00`)
      .lt('created_at', `${currentMonth}-32T00:00:00`);

    if (salesError) throw salesError;

    // Get costs data
    const { data: costs, error: costError } = await supabase
      .from('operational_costs')
      .select('amount')
      .eq('user_id', userId)
      .gte('date', `${currentMonth}-01`)
      .lt('date', `${currentMonth}-32`);

    // Calculate totals
    const totalSales = sales?.reduce((sum, order) => sum + (order.total_harga || 0), 0) || 0;
    const totalCosts = costs?.reduce((sum, cost) => sum + (cost.amount || 0), 0) || 0;
    const profit = totalSales - totalCosts;
    const profitMargin = totalSales > 0 ? (profit / totalSales) * 100 : 0;

    const monthName = new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

    return {
      type: 'report',
      text: `📊 Laporan ${monthName}\n\n💰 Total Penjualan: Rp ${totalSales.toLocaleString('id-ID')}\n💸 Total Biaya Operasional: Rp ${totalCosts.toLocaleString('id-ID')}\n📈 Keuntungan: Rp ${profit.toLocaleString('id-ID')}\n📊 Margin: ${profitMargin.toFixed(1)}%`,
      data: {
        totalSales,
        totalCosts,
        profit,
        profitMargin,
        period: monthName
      }
    };

  } catch (error: any) {
    console.error('Report query error:', error);
    return {
      type: 'error',
      text: `❌ Gagal membuat laporan: ${error.message}`
    };
  }
}

// Helper functions
function getOrderStatusText(status: string): string {
  const statusMap: { [key: string]: string } = {
    'pending': 'Menunggu',
    'confirmed': 'Dikonfirmasi',
    'preparing': 'Sedang Dipersiapkan',
    'ready': 'Siap Diambil',
    'completed': 'Selesai',
    'cancelled': 'Dibatalkan'
  };
  return statusMap[status] || status;
}
