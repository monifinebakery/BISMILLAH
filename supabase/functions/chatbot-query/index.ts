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
    // Require authentication
    const authResult = await requireAuth(req);
    if (authResult instanceof Response) {
      return authResult;
    }
    const { user } = authResult;

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

    let result: any = null;

    switch (intent) {
      case 'orderSearch':
        result = await handleOrderSearch(supabase, user.id, message);
        break;
      case 'inventory':
        result = await handleInventoryQuery(supabase, user.id, message);
        break;
      case 'report':
        result = await handleReportQuery(supabase, user.id, message);
        break;
      case 'cost':
        result = await handleCostQuery(supabase, user.id, message);
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
    // Extract customer name from message
    const customerName = extractCustomerName(message);

    let query = supabase
      .from('orders')
      .select(`
        id,
        customer_name,
        total_amount,
        status,
        created_at,
        order_items (
          product_name,
          quantity,
          unit_price
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (customerName) {
      query = query.ilike('customer_name', `%${customerName}%`);
    }

    const { data: orders, error } = await query;

    if (error) throw error;

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
      const total = formatCurrency(order.total_amount);
      return `${index + 1}. Order #${order.id.slice(-6)} - ${order.customer_name} - ${total} (${status}) - ${date}`;
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
    // Extract material name from message
    const materialName = extractMaterialName(message);

    let query = supabase
      .from('inventory')
      .select('*')
      .eq('user_id', userId);

    if (materialName) {
      query = query.ilike('material_name', `%${materialName}%`);
    }

    const { data: inventory, error } = await query;

    if (error) throw error;

    if (!inventory || inventory.length === 0) {
      return {
        type: 'inventory',
        text: materialName
          ? `📦 Tidak ditemukan stok untuk "${materialName}".`
          : '📦 Tidak ada data inventory.',
        data: []
      };
    }

    // Filter low stock items
    const lowStock = inventory.filter((item: any) => item.current_stock <= item.min_stock_level);

    const inventoryList = inventory.slice(0, 10).map((item: any) => {
      const status = item.current_stock <= item.min_stock_level ? '⚠️ PERLU RESTOCK' : '✅ OK';
      return `• ${item.material_name}: ${item.current_stock} ${item.unit} (${status})`;
    }).join('\n');

    let text = `📦 Status Inventory:\n\n${inventoryList}`;

    if (lowStock.length > 0) {
      text += `\n\n⚠️ ${lowStock.length} item perlu direstock segera!`;
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
      text: 'Maaf, terjadi kesalahan saat mengakses inventory.'
    };
  }
}

// Handler untuk query laporan
async function handleReportQuery(supabase: any, userId: string, message: string) {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

    // Get sales data for current month
    const { data: sales, error: salesError } = await supabase
      .from('orders')
      .select('total_amount, created_at')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('created_at', `${currentMonth}-01`)
      .lt('created_at', `${currentMonth}-32`);

    if (salesError) throw salesError;

    const totalSales = sales?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

    // Get cost data
    const { data: costs, error: costError } = await supabase
      .from('operational_costs')
      .select('amount')
      .eq('user_id', userId)
      .gte('date', `${currentMonth}-01`)
      .lt('date', `${currentMonth}-32`);

    if (costError) throw costError;

    const totalCosts = costs?.reduce((sum, cost) => sum + (cost.amount || 0), 0) || 0;

    const profit = totalSales - totalCosts;
    const profitMargin = totalSales > 0 ? (profit / totalSales) * 100 : 0;

    const monthName = new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

    return {
      type: 'report',
      text: `📊 Laporan ${monthName}\n\n💰 Total Penjualan: ${formatCurrency(totalSales)}\n💸 Total Biaya: ${formatCurrency(totalCosts)}\n📈 Keuntungan: ${formatCurrency(profit)}\n📊 Margin: ${profitMargin.toFixed(1)}%`,
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

// Utility functions
function extractCustomerName(message: string): string | null {
  // Simple extraction - can be enhanced with better NLP
  const patterns = [
    /pesanan\s+(?:bu|bapak|pak|nyonya|ibu)\s+(\w+)/i,
    /cari\s+(?:bu|bapak|pak|nyonya|ibu)\s+(\w+)/i,
    /lihat\s+(?:bu|bapak|pak|nyonya|ibu)\s+(\w+)/i,
    /nama\s+(\w+)/i
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
    /inventory\s+(\w+)/i
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) return match[1];
  }
  return null;
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
