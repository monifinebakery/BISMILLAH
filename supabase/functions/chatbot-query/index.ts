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
        result = await handleInventoryQuery(supabase, user.id);
        break;
      case 'orderSearch':
        result = await handleOrderSearch(supabase, user.id);
        break;
      case 'report':
        result = await handleReportQuery(supabase, user.id);
        break;
      case 'rules':
        result = await handleRulesQuery();
        break;
      default:
        result = {
          type: 'general',
          text: `Halo! Saya bisa membantu Anda dengan:
• Cek stok bahan baku: "cek stok bahan baku"
• Cari pesanan: "cari pesanan"  
• Laporan penjualan: "laporan bulan ini"
• Aturan bisnis: "aturan"

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
async function handleInventoryQuery(supabase: any, userId: string) {
  try {
    // Simple query for bahan_baku
    const { data: materials, error } = await supabase
      .from('bahan_baku')
      .select('nama, stok, satuan, harga_satuan')
      .eq('user_id', userId)
      .limit(10);

    if (error) throw error;

    if (!materials || materials.length === 0) {
      return {
        type: 'inventory',
        text: '📦 Belum ada data bahan baku di warehouse Anda.'
      };
    }

    // Simple list
    const list = materials.map((item: any) =>
      `• ${item.nama}: ${item.stok} ${item.satuan}`
    ).join('\n');

    return {
      type: 'inventory',
      text: `📦 Status Bahan Baku:\n\n${list}`,
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
async function handleOrderSearch(supabase: any, userId: string) {
  try {
    // Simple query for orders
    const { data: orders, error } = await supabase
      .from('orders')
      .select('nomor_pesanan, nama_pelanggan, total_harga, status')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) throw error;

    if (!orders || orders.length === 0) {
      return {
        type: 'orderSearch',
        text: '🔍 Tidak ada data pesanan.'
      };
    }

    // Simple list
    const list = orders.map((order: any) =>
      `• ${order.nomor_pesanan}: ${order.nama_pelanggan} - Rp ${order.total_harga.toLocaleString('id-ID')}`
    ).join('\n');

    return {
      type: 'orderSearch',
      text: `📋 Pesanan Terbaru:\n\n${list}`,
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
async function handleReportQuery(supabase: any, userId: string) {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

    // Simple sales query
    const { data: sales, error: salesError } = await supabase
      .from('orders')
      .select('total_harga')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('created_at', `${currentMonth}-01T00:00:00`)
      .lt('created_at', `${currentMonth}-32T00:00:00`);

    if (salesError) throw salesError;

    const totalSales = sales?.reduce((sum, order) => sum + (order.total_harga || 0), 0) || 0;

    return {
      type: 'report',
      text: `📊 Laporan Bulan Ini:\n\n💰 Total Penjualan: Rp ${totalSales.toLocaleString('id-ID')}`,
      data: { totalSales }
    };

  } catch (error: any) {
    console.error('Report query error:', error);
    return {
      type: 'error',
      text: `❌ Gagal membuat laporan: ${error.message}`
    };
  }
}

// Handle rules queries
async function handleRulesQuery() {
  return {
    type: 'rules',
    text: `📋 Aturan Bisnis HPP by Monifine:

1. HPP harus dihitung akurat berdasarkan resep
2. Waste factor minimal 0%, maksimal 50%
3. Biaya operasional dialokasikan proporsional
4. Margin keuntungan minimal 10%
5. Harga jual = HPP × (1 + margin target %)

6. Semua bahan baku wajib ada nama, satuan, harga
7. Stok bahan tidak boleh negatif
8. Update harga supplier minimal bulanan
9. Catat biaya operasional tepat waktu
10. Monitor profit margin per resep

💡 Tips: Fokus pada akurasi data dan efisiensi operasional!`
  };
}
