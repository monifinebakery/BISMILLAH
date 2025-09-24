import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { requireAuth } from "../_shared/middleware.ts";

interface ChatbotQueryRequest {
  intent: string;
  message: string;
  context?: {
    currentPage?: string;
    businessName?: string;
  };
}

// Knowledge Base untuk chatbot
const KNOWLEDGE_BASE = {
  business: {
    name: "HPP by Monifine",
    description: "Progressive Web App enterprise-grade untuk menghitung Harga Pokok Produksi (HPP) UMKM kuliner Indonesia",
    mission: "Memberdayakan UMKM kuliner Indonesia dengan teknologi terdepan untuk menghitung HPP secara akurat",
    target_users: "UMKM Kuliner Indonesia (64 juta UMKM, fokus 4.2 juta kuliner)",
    capabilities: [
      "Kalkulasi HPP akurat berdasarkan resep",
      "Manajemen biaya operasional",
      "Offline-first architecture",
      "Progressive Web App (PWA)",
      "Analytics & reporting"
    ]
  },
  hpp_calculation: {
    formula: "HPP = (Σ(Biaya Bahan Baku × Jumlah × Waste Factor) + Biaya Operasional Allocated) / Jumlah Porsi",
    components: {
      bahan_baku: "Biaya per unit dari supplier",
      waste_factor: "Persentase waste bahan baku (default 5-10%)",
      biaya_operasional: "Biaya bulanan yang dialokasikan per resep",
      jumlah_porsi: "Target output porsi"
    },
    allocation_methods: [
      "Per Unit: Total Cost / Monthly Units Produced",
      "Percentage: Cost as % of total production cost",
      "Fixed Amount: Fixed cost per recipe",
      "Staff-Based: Based on staff hours per recipe"
    ]
  },
  operational_costs: {
    types: ["Tetap (fixed costs)", "Variabel (variable costs)"],
    categories: ["Biaya bahan baku", "Biaya tenaga kerja", "Biaya overhead", "Biaya marketing", "Biaya utilitas"],
    tracking: "Monthly cost tracking dengan kategorisasi otomatis",
    allocation: "Auto-allocate ke resep berdasarkan usage patterns"
  },
  recipes: {
    features: [
      "Multi-ingredient support (hingga 50+ bahan per resep)",
      "Portion scaling otomatis",
      "Waste factor calculation",
      "Seasonal pricing support"
    ],
    validation: [
      "Minimum 1 bahan baku wajib",
      "Ukuran porsi harus > 0",
      "Waste factor antara 0-50%",
      "Biaya per unit harus > 0"
    ]
  },
  pwa_features: {
    offline_capabilities: [
      "Full calculator functionality tanpa internet",
      "Recipe creation/editing offline",
      "Cost management dengan local storage",
      "Settings persistence",
      "Calculation history"
    ],
    installation: "Install seperti native app di desktop, tablet, mobile",
    sync: "Intelligent background sync saat koneksi kembali",
    cache: "Advanced caching strategies untuk performa optimal"
  },
  policies: {
    pricing: "Cost-Plus Pricing dengan overhead allocation",
    profit_margin: "Selling Price = HPP × (1 + Target Margin %)",
    waste_management: "Default waste factor 5-10% per bahan",
    data_retention: "7 tahun untuk data finansial, 1 tahun untuk logs",
    backup: "Automated daily backups dengan disaster recovery < 4 jam"
  }
};

// Business Rules untuk chatbot
const BUSINESS_RULES = {
  hpp_calculation: [
    "HPP harus dihitung berdasarkan resep yang akurat",
    "Waste factor minimal 0%, maksimal 50%",
    "Biaya operasional harus dialokasikan secara proporsional",
    "Margin keuntungan minimal 10% untuk sustainability",
    "Harga jual = HPP × (1 + margin target %)"
  ],
  data_validation: [
    "Semua bahan baku harus memiliki nama, satuan, dan harga",
    "Stok bahan tidak boleh negatif",
    "Tanggal operasional tidak boleh di masa depan",
    "Biaya bulanan harus > 0",
    "Resep minimal memiliki 1 bahan baku"
  ],
  operational_procedures: [
    "Update harga supplier minimal bulanan",
    "Catat biaya operasional tepat waktu",
    "Lakukan inventory check mingguan",
    "Backup data secara berkala",
    "Monitor profit margin per resep"
  ],
  sync_priorities: [
    "User-initiated actions (save, delete) - Prioritas Tertinggi",
    "Critical data (settings, auth) - Prioritas Tinggi",
    "Operational costs - Prioritas Sedang",
    "Recipe calculations - Prioritas Rendah",
    "History/logs - Prioritas Terendah"
  ],
  quality_standards: [
    "HPP accuracy > 95%",
    "Uptime aplikasi 99.9%",
    "Sync success rate > 98%",
    "Load time < 2 detik",
    "Storage usage < 100MB"
  ],
  business_ethics: [
    "Transparansi perhitungan harga",
    "Data pelanggan aman dan terlindungi",
    "Harga kompetitif namun profitable",
    "Dukung pertumbuhan UMKM lokal",
    "Inovasi berkelanjutan untuk industri kuliner"
  ]
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS"
};

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
      case 'knowledge':
        result = await handleKnowledgeQuery(message);
        break;
      case 'rules':
        result = await handleRulesQuery(message);
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

    // Validate user authentication and data access
    if (!userId || userId === 'anonymous' || userId === 'test-user-id') {
      console.log('❌ User not properly authenticated:', { userId, type: typeof userId });
      return {
        type: 'error',
        text: '❌ Akses ditolak: Anda belum login ke aplikasi.\n\n💡 Silakan login terlebih dahulu untuk mengakses fitur chatbot lengkap.',
        data: [],
        debug: { userId, authenticated: false }
      };
    }

    // Validate userId format (should be UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      console.log('❌ Invalid userId format:', userId);
      return {
        type: 'error',
        text: '❌ User ID tidak valid. Silakan login kembali.',
        data: [],
        debug: { userId, format: 'invalid' }
      };
    }

    console.log('✅ User authenticated:', userId);

    // Extract material name from message
    const materialName = extractMaterialName(message);

    // If material name found, validate if it exists in database
    // If not found, treat as "show all materials"
    let validatedMaterialName: string | null = null;
    if (materialName) {
      console.log('🤖 Checking if material exists:', materialName);
      const { data: materialCheck, error: checkError } = await supabase
        .from('bahan_baku')
        .select('nama')
        .eq('user_id', userId)
        .ilike('nama', `%${materialName}%`)
        .limit(1);

      if (!checkError && materialCheck && materialCheck.length > 0) {
        validatedMaterialName = materialName;
        console.log('✅ Material found in database:', materialCheck[0].nama);
      } else {
        console.log('⚠️ Material not found, showing all materials instead');
        validatedMaterialName = null; // Show all materials
      }
    }

    // Query bahan_baku table using validated schema fields with fresh data
    let query = supabase
      .from('bahan_baku')
      .select(`
        id,
        nama,
        stok,
        satuan,
        minimum,
        harga_satuan,
        harga_rata_rata,
        kategori,
        supplier,
        updated_at
      `)
      .eq('user_id', userId);

    if (validatedMaterialName) {
      query = query.ilike('nama', `%${validatedMaterialName}%`);
    }

    console.log('🤖 Executing inventory query...');
    const { data: inventory, error } = await query;
    console.log('🤖 Inventory query result:', { data: inventory?.length, error });

    if (error) {
      console.log('🤖 Inventory query error:', error);
      throw error;
    }

    let result: any = null;
    if (inventory && inventory.length > 0) {
      const accuracyCheck = validateDatabaseQueryAccuracy(inventory, 'inventory', userId);
      if (!accuracyCheck.isAccurate) {
        console.warn('🤖 Data accuracy issues detected:', accuracyCheck.issues);
        // Will be added to result metadata later
      }
    }

    if (!inventory || inventory.length === 0) {
      if (validatedMaterialName) {
        return {
          type: 'inventory',
          text: `📦 Tidak ditemukan bahan "${validatedMaterialName}" di warehouse Anda. Bahan dengan nama tersebut belum terdaftar.`,
          data: []
        };
      } else {
        return {
          type: 'inventory',
          text: `📦 Belum ada data bahan baku di warehouse Anda untuk user ID: ${userId}.\n\n💡 **Kemungkinan penyebab:**\n• Anda belum menambahkan bahan baku apapun ke sistem\n• Data bahan baku ada di user ID yang berbeda\n• Ada masalah sinkronisasi data\n\n**Solusi:**\n1. Buka menu "Warehouse" di aplikasi\n2. Klik tombol "Tambah Bahan Baku"\n3. Masukkan data bahan baku Anda\n\nSetelah menambahkan bahan, coba lagi perintah: "cek stok bahan baku"\n\n**Debug Info:**\n• User ID: ${userId}\n• Query berhasil dieksekusi\n• Database response: empty result set`,
          data: [],
          debug: {
            userId,
            queryExecuted: true,
            resultSet: 'empty',
            suggestion: 'add_materials_via_warehouse_menu'
          }
        };
      }
    }

    // Filter low stock items
    const lowStock = inventory.filter((item: any) => item.stok <= (item.minimum || 0));

    let inventoryList;
    if (validatedMaterialName) {
      // Show specific material details
      const item = inventory[0];
      const status = item.stok <= (item.minimum || 0) ? '⚠️ PERLU RESTOCK' : '✅ OK';
      const stockInfo = `• ${item.nama}: ${formatStockValue(item.stok)} ${item.satuan} (${status})`;
      const priceSource = item.harga_satuan ?? item.harga_rata_rata;
      const priceInfo = priceSource != null ? `\n• Harga per unit: ${formatCurrency(priceSource)}` : '';
      const minInfo = item.minimum ? `\n• Stok minimum: ${formatStockValue(item.minimum)} ${item.satuan}` : '';
      const categoryInfo = item.kategori ? `\n• Kategori: ${item.kategori}` : '';
      const supplierName = item.supplier;
      const supplierInfo = supplierName ? `\n• Supplier: ${supplierName}` : '';

      inventoryList = stockInfo + priceInfo + minInfo + categoryInfo + supplierInfo;
    } else {
      // Show summary of all materials
      inventoryList = inventory.slice(0, 10).map((item: any) => {
        const status = item.stok <= (item.minimum || 0) ? '⚠️ PERLU RESTOCK' : '✅ OK';
        const priceSource = item.harga_satuan ?? item.harga_rata_rata;
        const priceInfo = priceSource != null ? ` - ${formatCurrency(priceSource)}` : '';
        const supplierName = item.supplier;
        const supplierInfo = supplierName ? ` (${supplierName})` : '';
        return `• ${item.nama}: ${item.stok} ${item.satuan} (${status})${priceInfo}${supplierInfo}`;
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

// Handler untuk query knowledge base
async function handleKnowledgeQuery(message: string) {
  try {
    console.log('🤖 Handling knowledge query:', message);

    const lowerMessage = message.toLowerCase();

    // Extract knowledge topic from message
    let topic: string | null = null;
    if (lowerMessage.includes('hpp') || lowerMessage.includes('harga pokok')) {
      topic = 'hpp_calculation';
    } else if (lowerMessage.includes('bisnis') || lowerMessage.includes('aplikasi') || lowerMessage.includes('tentang')) {
      topic = 'business';
    } else if (lowerMessage.includes('biaya') || lowerMessage.includes('operasional') || lowerMessage.includes('cost')) {
      topic = 'operational_costs';
    } else if (lowerMessage.includes('resep') || lowerMessage.includes('recipe')) {
      topic = 'recipes';
    } else if (lowerMessage.includes('pwa') || lowerMessage.includes('offline') || lowerMessage.includes('install')) {
      topic = 'pwa_features';
    } else if (lowerMessage.includes('kebijakan') || lowerMessage.includes('policy')) {
      topic = 'policies';
    }

    if (topic && KNOWLEDGE_BASE[topic]) {
      const knowledge = KNOWLEDGE_BASE[topic];

      let responseText = `📚 **${topic.toUpperCase()} - Knowledge Base**\n\n`;

      if (topic === 'business') {
        responseText += `**Nama:** ${knowledge.name}\n`;
        responseText += `**Deskripsi:** ${knowledge.description}\n`;
        responseText += `**Misi:** ${knowledge.mission}\n`;
        responseText += `**Target Users:** ${knowledge.target_users}\n\n`;
        responseText += `**Capabilities:**\n${knowledge.capabilities.map((cap: string) => `• ${cap}`).join('\n')}`;
      } else if (topic === 'hpp_calculation') {
        responseText += `**Formula HPP:** ${knowledge.formula}\n\n`;
        responseText += `**Komponen:**\n`;
        Object.entries(knowledge.components).forEach(([key, value]) => {
          responseText += `• ${key}: ${value}\n`;
        });
        responseText += `\n**Metode Alokasi:**\n${knowledge.allocation_methods.map((method: string) => `• ${method}`).join('\n')}`;
      } else if (topic === 'operational_costs') {
        responseText += `**Tipe Biaya:** ${knowledge.types.join(', ')}\n`;
        responseText += `**Kategori:** ${knowledge.categories.join(', ')}\n`;
        responseText += `**Tracking:** ${knowledge.tracking}\n`;
        responseText += `**Alokasi:** ${knowledge.allocation}`;
      } else if (topic === 'recipes') {
        responseText += `**Fitur:**\n${knowledge.features.map((feat: string) => `• ${feat}`).join('\n')}\n\n`;
        responseText += `**Validasi:**\n${knowledge.validation.map((val: string) => `• ${val}`).join('\n')}`;
      } else if (topic === 'pwa_features') {
        responseText += `**Offline Capabilities:**\n${knowledge.offline_capabilities.map((cap: string) => `• ${cap}`).join('\n')}\n\n`;
        responseText += `**Instalasi:** ${knowledge.installation}\n`;
        responseText += `**Sinkronisasi:** ${knowledge.sync}\n`;
        responseText += `**Cache:** ${knowledge.cache}`;
      } else if (topic === 'policies') {
        responseText += `**Pricing:** ${knowledge.pricing}\n`;
        responseText += `**Profit Margin:** ${knowledge.profit_margin}\n`;
        responseText += `**Waste Management:** ${knowledge.waste_management}\n`;
        responseText += `**Data Retention:** ${knowledge.data_retention}\n`;
        responseText += `**Backup:** ${knowledge.backup}`;
      }

      return {
        type: 'knowledge',
        text: responseText,
        data: knowledge
      };
    } else {
      // Show all available knowledge topics
      const topics = Object.keys(KNOWLEDGE_BASE);
      const topicList = topics.map(topic => {
        const displayName = topic.replace('_', ' ').toUpperCase();
        return `• ${displayName}`;
      }).join('\n');

      return {
        type: 'knowledge',
        text: `📚 **Knowledge Base HPP by Monifine**\n\n**Topik yang tersedia:**\n${topicList}\n\n💡 **Cara menggunakan:**\nTanyakan "apa itu HPP", "tentang biaya operasional", "bagaimana resep", dll.\n\nContoh: "jelaskan tentang HPP" atau "apa itu PWA"`,
        data: KNOWLEDGE_BASE
      };
    }

  } catch (error) {
    console.error('Knowledge query error:', error);
    return {
      type: 'error',
      text: 'Maaf, terjadi kesalahan saat mengakses knowledge base.'
    };
  }
}

// Handler untuk query business rules
async function handleRulesQuery(message: string) {
  try {
    console.log('🤖 Handling rules query:', message);

    const lowerMessage = message.toLowerCase();

    // Extract rules category from message
    let category: string | null = null;
    if (lowerMessage.includes('hpp') || lowerMessage.includes('harga') || lowerMessage.includes('kalkulasi')) {
      category = 'hpp_calculation';
    } else if (lowerMessage.includes('validasi') || lowerMessage.includes('data')) {
      category = 'data_validation';
    } else if (lowerMessage.includes('operasional') || lowerMessage.includes('prosedur')) {
      category = 'operational_procedures';
    } else if (lowerMessage.includes('sinkronisasi') || lowerMessage.includes('sync') || lowerMessage.includes('prioritas')) {
      category = 'sync_priorities';
    } else if (lowerMessage.includes('kualitas') || lowerMessage.includes('standard')) {
      category = 'quality_standards';
    } else if (lowerMessage.includes('etika') || lowerMessage.includes('bisnis')) {
      category = 'business_ethics';
    }

    if (category && BUSINESS_RULES[category]) {
      const rules = BUSINESS_RULES[category];

      const displayName = category.replace('_', ' ').toUpperCase();
      const rulesList = rules.map((rule: string, index: number) => `${index + 1}. ${rule}`).join('\n');

      return {
        type: 'rules',
        text: `📋 **Business Rules - ${displayName}**\n\n${rulesList}`,
        data: rules
      };
    } else {
      // Show all available rule categories
      const categories = Object.keys(BUSINESS_RULES);
      const categoryList = categories.map(cat => {
        const displayName = cat.replace('_', ' ').toUpperCase();
        return `• ${displayName}`;
      }).join('\n');

      return {
        type: 'rules',
        text: `📋 **Business Rules HPP by Monifine**\n\n**Kategori yang tersedia:**\n${categoryList}\n\n💡 **Cara menggunakan:**\nTanyakan "aturan HPP", "aturan validasi data", "aturan operasional", dll.\n\nContoh: "aturan kalkulasi HPP" atau "aturan etika bisnis"`,
        data: BUSINESS_RULES
      };
    }

  } catch (error) {
    console.error('Rules query error:', error);
    return {
      type: 'error',
      text: 'Maaf, terjadi kesalahan saat mengakses business rules.'
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

  // Let NLP handle all word processing - no exclusion needed
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      const materialName = match[1].toLowerCase().trim();
      // Return any word found - let NLP decide if it's a valid material name
      if (materialName.length > 0) {
        return match[1];
      }
    }
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

function formatStockValue(value: number): string {
  if (Number.isInteger(value)) {
    return value.toString();
  }
  return value.toFixed(2).replace('.', ',');
}

// Data consistency validation function
function validateDatabaseQueryAccuracy(data: any[], queryType: string, userId: string): { isAccurate: boolean, issues: string[] } {
  const issues: string[] = [];
  let isAccurate = true;

  // Validate user_id scoping
  data.forEach((item, index) => {
    if (item.user_id && item.user_id !== userId) {
      issues.push(`Item ${index + 1}: user_id mismatch (${item.user_id} vs ${userId})`);
      isAccurate = false;
    }
  });

  // Validate data integrity based on query type
  switch (queryType) {
    case 'inventory':
      data.forEach((item, index) => {
        if (typeof item.stok !== 'number' || item.stok < 0) {
          issues.push(`Item ${index + 1} (${item.nama}): Invalid stock value (${item.stok})`);
          isAccurate = false;
        }
        if (!item.nama || !item.satuan) {
          issues.push(`Item ${index + 1}: Missing required fields (nama/satuan)`);
          isAccurate = false;
        }
      });
      break;
  }

  return { isAccurate, issues };
}
