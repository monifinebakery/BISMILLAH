import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { requireAuth } from "../_shared/middleware.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS"
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
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
  }

  try {
    console.log('🤖 Chatbot Edge Function called');
    
    // Require authentication
    const authResult = await requireAuth(req);
    if (authResult instanceof Response) {
      console.log('🤖 Authentication failed');
      return authResult;
    }
    const { user } = authResult;
    console.log('🤖 Authenticated user:', user.id);

    // Create Supabase client with user's context
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: {
            Authorization: req.headers.get("Authorization")
          }
        }
      }
    );

    const { intent, message, context }: ChatbotQueryRequest = await req.json();
    console.log('🤖 Received request:', { intent, message, context });

    // Enhanced intent handling with smart responses
    let result: any = null;

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
      case 'cost':
        result = await handleCostQuery(supabase, user.id, message);
        break;
      case 'purchase':
        // Handle basic purchase queries here, actions go to chatbot-action
        result = await handlePurchaseQuery(supabase, user.id, message);
        break;
      case 'recipe':
        result = await handleRecipeQuery(supabase, user.id, message);
        break;
      case 'promo':
        result = await handlePromoQuery(supabase, user.id, message);
        break;
      default:
        result = { type: 'general', text: 'Maaf, saya tidak mengerti permintaan tersebut.' };
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });

  } catch (error) {
    console.error("Error in chatbot-query:", error);
    return new Response(JSON.stringify({
      error: error.message || "Internal server error",
      type: 'error'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});

// Handler untuk pencarian pesanan
async function handleOrderSearch(supabase: any, userId: string, message: string) {
  try {
    console.log('🤖 Handling order search for user:', userId, 'message:', message);
    // Extract customer name from message
    const customerName = extractCustomerName(message);

    // Query orders table with correct field names
    let query = supabase
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

    if (customerName) {
      query = query.ilike('nama_pelanggan', `%${customerName}%`);
    }

    console.log('🤖 Executing order query...');
    const { data: orders, error } = await query;
    console.log('🤖 Order query result:', { data: orders?.length, error });

    if (error) {
      console.log('🤖 Order query error:', error);
      throw error;
    }

    if (!orders || orders.length === 0) {
      return {
        type: 'orderSearch',
        text: customerName
          ? `🔍 Tidak ditemukan pesanan atas nama "${customerName}".`
          : '🔍 Tidak ada pesanan yang ditemukan.',
        data: []
      };
    }

    const orderList = orders.map((order: any, index: number) => {
      const date = new Date(order.created_at).toLocaleDateString('id-ID');
      const status = getStatusText(order.status);
      const total = formatCurrency(order.total_harga);
      return `${index + 1}. Order ${order.nomor_pesanan} - ${order.nama_pelanggan} - ${total} (${status}) - ${date}`;
    }).join('\n');

    return {
      type: 'orderSearch',
      text: `📋 Ditemukan ${orders.length} pesanan:\n\n${orderList}\n\n⚠️ Manakah yang ingin Anda lihat detailnya?`,
      data: orders
    };

  } catch (error) {
    console.error('Order search error:', error);
    return {
      type: 'error',
      text: 'Maaf, terjadi kesalahan saat mencari pesanan.'
    };
  }
}

// Handler untuk query inventory
async function handleInventoryQuery(supabase: any, userId: string, message: string) {
  try {
    console.log('🤖 Handling inventory query for user:', userId, 'message:', message);
    
    // Extract material name from message
    const materialName = extractMaterialName(message);

    // Query bahan_baku table (correct table name)
    let query = supabase
      .from('bahan_baku')
      .select('id, nama, stok, satuan, minimum, harga, kategori')
      .eq('user_id', userId);

    if (materialName) {
      query = query.ilike('nama', `%${materialName}%`);
    }

    console.log('🤖 Executing inventory query...');
    const { data: inventory, error } = await query;
    console.log('🤖 Inventory query result:', { data: inventory?.length, error });

    if (error) {
      console.log('🤖 Inventory query error:', error);
      throw error;
    }

    if (!inventory || inventory.length === 0) {
      return {
        type: 'inventory',
        text: materialName
          ? `📦 Tidak ditemukan bahan "${materialName}" di warehouse.`
          : '📦 Tidak ada data bahan baku di warehouse.',
        data: []
      };
    }

    // Filter low stock items
    const lowStock = inventory.filter((item: any) => item.stok <= (item.minimum || 0));

    let inventoryList;
    if (materialName) {
      // Show specific material details
      const item = inventory[0];
      const status = item.stok <= (item.minimum || 0) ? '⚠️ PERLU RESTOCK' : '✅ OK';
      const stockInfo = `• ${item.nama}: ${item.stok} ${item.satuan} (${status})`;
      const priceInfo = item.harga ? `\n• Harga per unit: Rp ${item.harga.toLocaleString('id-ID')}` : '';
      const minInfo = item.minimum ? `\n• Stok minimum: ${item.minimum} ${item.satuan}` : '';
      const categoryInfo = item.kategori ? `\n• Kategori: ${item.kategori}` : '';

      inventoryList = stockInfo + priceInfo + minInfo + categoryInfo;
    } else {
      // Show summary of all materials
      inventoryList = inventory.slice(0, 10).map((item: any) => {
        const status = item.stok <= (item.minimum || 0) ? '⚠️ PERLU RESTOCK' : '✅ OK';
        return `• ${item.nama}: ${item.stok} ${item.satuan} (${status})`;
      }).join('\n');
    }

    let text = `📦 ${materialName ? 'Detail Bahan' : 'Status Warehouse Bahan Baku'}:\n\n${inventoryList}`;

    if (lowStock.length > 0 && !materialName) {
      text += `\n\n⚠️ ${lowStock.length} bahan perlu direstock segera!`;
    }

    return {
      type: 'inventory',
      text: text,
      data: inventory
    };

  } catch (error) {
    console.error('Inventory query error:', error);
    return {
      type: 'error',
      text: 'Maaf, terjadi kesalahan saat mengakses data warehouse.'
    };
  }
}

// Handler untuk query laporan
async function handleReportQuery(supabase: any, userId: string, message: string) {
  try {
    console.log('🤖 Handling report query for user:', userId, 'message:', message);
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

    // Get sales data from orders for current month
    console.log('🤖 Querying orders for sales data...');
    const { data: sales, error: salesError } = await supabase
      .from('orders')
      .select('total_harga, created_at')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('created_at', `${currentMonth}-01`)
      .lt('created_at', `${currentMonth}-32`);

    console.log('🤖 Sales query result:', { data: sales?.length, error: salesError });

    if (salesError) {
      console.log('🤖 Sales query error:', salesError);
      throw salesError;
    }

    const totalSales = sales?.reduce((sum, order) => sum + (order.total_harga || 0), 0) || 0;

    // Get cost data from operational_costs
    console.log('🤖 Querying operational costs...');
    const { data: costs, error: costError } = await supabase
      .from('operational_costs')
      .select('amount, date')
      .eq('user_id', userId)
      .gte('date', `${currentMonth}-01`)
      .lt('date', `${currentMonth}-32`);

    console.log('🤖 Costs query result:', { data: costs?.length, error: costError });

    if (costError) {
      console.log('🤖 Costs query error:', costError);
      // Don't throw error for costs, just use 0
    }

    const totalCosts = costs?.reduce((sum, cost) => sum + (cost.amount || 0), 0) || 0;

    const profit = totalSales - totalCosts;
    const profitMargin = totalSales > 0 ? (profit / totalSales) * 100 : 0;

    const monthName = new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

    return {
      type: 'report',
      text: `📊 Laporan ${monthName}\n\n💰 Total Penjualan: ${formatCurrency(totalSales)}\n💸 Total Biaya Operasional: ${formatCurrency(totalCosts)}\n📈 Keuntungan: ${formatCurrency(profit)}\n📊 Margin: ${profitMargin.toFixed(1)}%`,
      data: {
        totalSales,
        totalCosts,
        profit,
        profitMargin,
        period: monthName
      }
    };

  } catch (error) {
    console.error('Report query error:', error);
    return {
      type: 'error',
      text: 'Maaf, terjadi kesalahan saat membuat laporan.'
    };
  }
}

// Handler untuk query cost
async function handleCostQuery(supabase: any, userId: string, message: string) {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7);

    const { data: costs, error } = await supabase
      .from('operational_costs')
      .select('*')
      .eq('user_id', userId)
      .gte('date', `${currentMonth}-01`)
      .lt('date', `${currentMonth}-32`)
      .order('date', { ascending: false })
      .limit(10);

    if (error) throw error;

    if (!costs || costs.length === 0) {
      return {
        type: 'cost',
        text: '💸 Tidak ada data biaya operasional bulan ini.',
        data: []
      };
    }

    const totalCost = costs.reduce((sum, cost) => sum + (cost.amount || 0), 0);

    const costList = costs.map((cost: any) => {
      const date = new Date(cost.date).toLocaleDateString('id-ID');
      return `• ${cost.description}: ${formatCurrency(cost.amount)} (${date})`;
    }).join('\n');

    return {
      type: 'cost',
      text: `💸 Biaya Operasional Bulan Ini: ${formatCurrency(totalCost)}\n\n${costList}`,
      data: costs
    };

  } catch (error) {
    console.error('Cost query error:', error);
    return {
      type: 'error',
      text: 'Maaf, terjadi kesalahan saat mengakses data biaya.'
    };
  }
}

// Handler untuk query purchases
async function handlePurchaseQuery(supabase: any, userId: string, message: string) {
  try {
    console.log('🤖 Handling purchase query for user:', userId, 'message:', message);

    // Query purchases table
    const { data: purchases, error } = await supabase
      .from('purchases')
      .select('id, supplier, total_nilai, tanggal, status, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    console.log('🤖 Purchase query result:', { data: purchases?.length, error });

    if (error) {
      console.log('🤖 Purchase query error:', error);
      throw error;
    }

    if (!purchases || purchases.length === 0) {
      return {
        type: 'purchase',
        text: '📦 Tidak ada data pembelian yang ditemukan.',
        data: []
      };
    }

    const purchaseList = purchases.map((purchase: any, index: number) => {
      const date = new Date(purchase.tanggal || purchase.created_at).toLocaleDateString('id-ID');
      const total = formatCurrency(purchase.total_nilai);
      const status = getPurchaseStatusText(purchase.status);
      return `${index + 1}. ${purchase.supplier} - ${total} (${status}) - ${date}`;
    }).join('\n');

    const totalPurchases = purchases.reduce((sum, p) => sum + (p.total_nilai || 0), 0);

    return {
      type: 'purchase',
      text: `📦 Riwayat Pembelian:\n\n${purchaseList}\n\n💰 Total Pembelian: ${formatCurrency(totalPurchases)}`,
      data: purchases
    };

  } catch (error) {
    console.error('Purchase query error:', error);
    return {
      type: 'error',
      text: 'Maaf, terjadi kesalahan saat mengakses data pembelian.'
    };
  }
}

// Handler untuk query assets
async function handleAssetQuery(supabase: any, userId: string, message: string) {
  try {
    console.log('🤖 Handling asset query for user:', userId, 'message:', message);

    // Query assets table
    const { data: assets, error } = await supabase
      .from('assets')
      .select('id, nama, nilai_perolehan, nilai_sekarang, status, tanggal_perolehan, depresiasi_per_tahun')
      .eq('user_id', userId)
      .order('tanggal_perolehan', { ascending: false })
      .limit(10);

    console.log('🤖 Asset query result:', { data: assets?.length, error });

    if (error) {
      console.log('🤖 Asset query error:', error);
      throw error;
    }

    if (!assets || assets.length === 0) {
      return {
        type: 'asset',
        text: '🏢 Tidak ada data aset yang ditemukan.',
        data: []
      };
    }

    const assetList = assets.map((asset: any) => {
      const acquisitionValue = formatCurrency(asset.nilai_perolehan);
      const currentValue = formatCurrency(asset.nilai_sekarang || asset.nilai_perolehan);
      const date = new Date(asset.tanggal_perolehan).toLocaleDateString('id-ID');
      return `• ${asset.nama}: ${currentValue} (Perolehan: ${acquisitionValue}) - ${date}`;
    }).join('\n');

    const totalValue = assets.reduce((sum, asset) => sum + (asset.nilai_sekarang || asset.nilai_perolehan || 0), 0);

    return {
      type: 'asset',
      text: `🏢 Daftar Aset:\n\n${assetList}\n\n💰 Total Nilai Aset: ${formatCurrency(totalValue)}`,
      data: assets
    };

  } catch (error) {
    console.error('Asset query error:', error);
    return {
      type: 'error',
      text: 'Maaf, terjadi kesalahan saat mengakses data aset.'
    };
  }
}

// Handler untuk query recipes
async function handleRecipeQuery(supabase: any, userId: string, message: string) {
  try {
    console.log('🤖 Handling recipe query for user:', userId, 'message:', message);

    // Extract recipe name from message
    const recipeName = extractRecipeName(message);

    // Query recipes table
    let query = supabase
      .from('recipes')
      .select('id, nama, harga_jual, kategori, created_at')
      .eq('user_id', userId);

    if (recipeName) {
      query = query.ilike('nama', `%${recipeName}%`);
    }

    const { data: recipes, error } = await query
      .order('created_at', { ascending: false })
      .limit(recipeName ? 5 : 10);

    console.log('🤖 Recipe query result:', { data: recipes?.length, error });

    if (error) {
      console.log('🤖 Recipe query error:', error);
      throw error;
    }

    if (!recipes || recipes.length === 0) {
      return {
        type: 'recipe',
        text: recipeName
          ? `🍽️ Tidak ditemukan resep "${recipeName}".`
          : '🍽️ Tidak ada data resep yang ditemukan.',
        data: []
      };
    }

    const recipeList = recipes.map((recipe: any) => {
      const price = formatCurrency(recipe.harga_jual);
      const category = recipe.kategori || 'Umum';
      return `• ${recipe.nama}: ${price} (${category})`;
    }).join('\n');

    return {
      type: 'recipe',
      text: `🍽️ ${recipeName ? 'Detail Resep' : 'Daftar Resep'}:\n\n${recipeList}`,
      data: recipes
    };

  } catch (error) {
    console.error('Recipe query error:', error);
    return {
      type: 'error',
      text: 'Maaf, terjadi kesalahan saat mengakses data resep.'
    };
  }
}

// Handler untuk query promos
async function handlePromoQuery(supabase: any, userId: string, message: string) {
  try {
    console.log('🤖 Handling promo query for user:', userId, 'message:', message);

    // Query promos table
    const { data: promos, error } = await supabase
      .from('promos')
      .select('id, nama, diskon_persen, diskon_rupiah, tanggal_mulai, tanggal_selesai, status, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    console.log('🤖 Promo query result:', { data: promos?.length, error });

    if (error) {
      console.log('🤖 Promo query error:', error);
      throw error;
    }

    if (!promos || promos.length === 0) {
      return {
        type: 'promo',
        text: '🎉 Tidak ada data promo yang ditemukan.',
        data: []
      };
    }

    const promoList = promos.map((promo: any) => {
      const discount = promo.diskon_persen
        ? `${promo.diskon_persen}%`
        : formatCurrency(promo.diskon_rupiah);
      const startDate = new Date(promo.tanggal_mulai).toLocaleDateString('id-ID');
      const endDate = new Date(promo.tanggal_selesai).toLocaleDateString('id-ID');
      const status = getPromoStatusText(promo.status);

      return `• ${promo.nama}: Diskon ${discount} (${startDate} - ${endDate}) [${status}]`;
    }).join('\n');

    return {
      type: 'promo',
      text: `🎉 Daftar Promo Aktif:\n\n${promoList}`,
      data: promos
    };

  } catch (error) {
    console.error('Promo query error:', error);
    return {
      type: 'error',
      text: 'Maaf, terjadi kesalahan saat mengakses data promo.'
    };
  }
}

// Enhanced handler for smart responses using database functions
async function handleSmartResponse(supabase: any, userId: string, message: string, intent: string) {
  try {
    console.log('🤖 Handling smart response for user:', userId, 'intent:', intent);

    // Use the new get_chatbot_response function
    const { data: smartResponse, error } = await supabase
      .rpc('get_chatbot_response', {
        p_user_id: userId,
        p_message: message,
        p_intent: intent
      });

    console.log('🤖 Smart response result:', { data: smartResponse, error });

    if (error) {
      console.log('🤖 Smart response error:', error);
      // Fallback to regular response
      return await handleFallbackResponse(supabase, userId, message, intent);
    }

    if (smartResponse) {
      return smartResponse;
    }

    // Fallback if no smart response
    return await handleFallbackResponse(supabase, userId, message, intent);

  } catch (error) {
    console.error('Smart response error:', error);
    return await handleFallbackResponse(supabase, userId, message, intent);
  }
}

// Fallback response handler
async function handleFallbackResponse(supabase: any, userId: string, message: string, intent: string) {
  const responses = {
    greeting: {
      type: 'greeting',
      text: '👋 Halo! Saya asisten AI untuk bisnis bakery Anda. Saya bisa membantu dengan informasi stok, penjualan, dan operasional sehari-hari.'
    },
    help: {
      type: 'help',
      text: '💡 Saya bisa membantu Anda dengan:\n• Cek status stok bahan baku\n• Cari dan kelola pesanan\n• Lihat laporan penjualan\n• Tambah biaya operasional\n• Dan masih banyak lagi!'
    },
    default: {
      type: 'general',
      text: '🤔 Saya mengerti permintaan Anda. Untuk informasi lebih detail, coba tanyakan tentang stok, pesanan, atau laporan penjualan.'
    }
  };

  return responses[intent] || responses.default;
}
function extractCustomerName(message: string): string | null {
  // Simple extraction - can be enhanced with better NLP
  const patterns = [
    /pesanan\s+(?:bu|bapak|pak|nyonya|ibu)\s+(\w+)/i,
    /cari\s+(?:bu|bapak|pak|nyonya|ibu)\s+(\w+)/i,
    /lihat\s+(?:bu|bapak|pak|nyonya|ibu)\s+(\w+)/i,
    /nama\s+(\w+)/i,
    /pelanggan\s+(\w+)/i
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function extractMaterialName(message: string): string | null {
  const patterns = [
    /stok\s+(\w+)/i,
    /cek\s+(\w+)/i,
    /warehouse\s+(\w+)/i,
    /gudang\s+(\w+)/i,
    /bahan\s+(\w+)/i,
    /inventory\s+(\w+)/i
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function extractRecipeName(message: string): string | null {
  const patterns = [
    /resep\s+(\w+)/i,
    /recipe\s+(\w+)/i,
    /produk\s+(\w+)/i
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) return match[1];
  }
  return null;
}
function getPurchaseStatusText(status: string): string {
  const statusMap: { [key: string]: string } = {
    'draft': 'Draft',
    'pending': 'Menunggu',
    'approved': 'Disetujui',
    'ordered': 'Dipesan',
    'received': 'Diterima',
    'cancelled': 'Dibatalkan'
  };
  return statusMap[status] || status;
}

function getPromoStatusText(status: string): string {
  const statusMap: { [key: string]: string } = {
    'active': 'Aktif',
    'inactive': 'Tidak Aktif',
    'expired': 'Kadaluarsa',
    'scheduled': 'Terjadwal'
  };
  return statusMap[status] || status;
}

function getStatusText(status: string): string {
  const statusMap: { [key: string]: string } = {
    'pending': 'Menunggu',
    'confirmed': 'Dikonfirmasi',
    'preparing': 'Dipersiapkan',
    'ready': 'Siap Ambil',
    'completed': 'Selesai',
    'cancelled': 'Dibatalkan'
  };
  return statusMap[status] || status;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
}
