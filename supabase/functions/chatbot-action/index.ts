import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { requireAuth } from "../_shared/middleware.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS"
};

interface ChatbotActionRequest {
  intent: string;
  message: string;
  userId: string; // Add userId field
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

  const requestStartTime = Date.now();

  try {
    console.log('🤖 Chatbot Action Edge Function called');
    console.log('Request details:', {
      method: req.method,
      url: req.url,
      userAgent: req.headers.get('User-Agent'),
      timestamp: new Date().toISOString()
    });

    // Require authentication with timeout
    const authStartTime = Date.now();
    const authResult = await requireAuth(req);
    const authTime = Date.now() - authStartTime;

    if (authResult instanceof Response) {
      console.log('🤖 Authentication failed in', authTime, 'ms');
      return authResult;
    }
    const { user } = authResult;
    console.log('🤖 Authenticated user:', user.id, 'in', authTime, 'ms');

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

    const { intent, message, userId, context }: ChatbotActionRequest = await req.json();
    console.log('🤖 Received action request:', { intent, message, userId, context });

    // Validate input parameters
    if (!intent || !intent.trim()) {
      return new Response(JSON.stringify({
        type: 'error',
        text: '❌ Intent tidak boleh kosong.'
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (!userId || !userId.trim()) {
      return new Response(JSON.stringify({
        type: 'error',
        text: '❌ User ID tidak boleh kosong.'
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    let result: any = null;
    const actionStartTime = Date.now();

    // Execute action based on intent
    switch (intent) {
      case 'purchase':
        result = await handlePurchaseCreate(supabase, userId, message);
        break;
      case 'orderCreate':
        result = await handleOrderCreate(supabase, userId, message);
        break;
      case 'orderDelete':
        result = await handleOrderDelete(supabase, userId, message);
        break;
      case 'inventoryUpdate':
        result = await handleInventoryUpdate(supabase, userId, message);
        break;
      case 'recipeCreate':
        result = await handleRecipeCreate(supabase, userId, message);
        break;
      case 'promoCreate':
        result = await handlePromoCreate(supabase, userId, message);
        break;
      default:
        result = {
          type: 'error',
          text: `❌ Aksi "${intent}" tidak dikenali. Aksi yang tersedia: purchase, orderCreate, orderDelete, inventoryUpdate, recipeCreate, promoCreate.`
        };
    }

    const actionTime = Date.now() - actionStartTime;
    const totalTime = Date.now() - requestStartTime;

    console.log('🤖 Action completed:', {
      intent,
      userId,
      resultType: result?.type,
      actionTime: `${actionTime}ms`,
      totalTime: `${totalTime}ms`,
      success: result?.type === 'success'
    });

    // Add performance metadata to successful responses
    if (result && result.type === 'success' && !result.metadata) {
      result.metadata = {
        actionTime: `${actionTime}ms`,
        totalTime: `${totalTime}ms`
      };
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "X-Response-Time": `${totalTime}ms`,
        "X-Action-Time": `${actionTime}ms`
      }
    });

  } catch (error) {
    const totalTime = Date.now() - requestStartTime;
    console.error("Error in chatbot-action:", error, 'Total time:', totalTime, 'ms');

    // Provide specific error responses based on error type
    let errorMessage = '❌ Terjadi kesalahan internal server.';
    let statusCode = 500;

    if (error.message?.includes('authentication') || error.message?.includes('unauthorized')) {
      errorMessage = '❌ Autentikasi gagal. Silakan login kembali.';
      statusCode = 401;
    } else if (error.message?.includes('timeout')) {
      errorMessage = '⏱️ Permintaan timeout. Sistem sedang sibuk, coba lagi nanti.';
      statusCode = 504;
    } else if (error.message?.includes('network') || error.message?.includes('connection')) {
      errorMessage = '🌐 Masalah koneksi. Periksa koneksi internet Anda.';
      statusCode = 503;
    }

    return new Response(JSON.stringify({
      error: error.message || "Internal server error",
      type: 'error',
      text: errorMessage,
      metadata: {
        totalTime: `${totalTime}ms`
      }
    }), {
      status: statusCode,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "X-Response-Time": `${totalTime}ms`
      }
    });
  }
});

// Handler untuk membuat pembelian bahan baku
async function handlePurchaseCreate(supabase: any, userId: string, message: string) {
  try {
    console.log('🤖 Handling purchase create for user:', userId, 'message:', message);

    // Extract purchase info from message
    const purchaseInfo = extractPurchaseInfo(message);
    if (!purchaseInfo.supplier || !purchaseInfo.totalValue) {
      return {
        type: 'error',
        text: '❌ Informasi pembelian tidak lengkap. Format: "tambah pembelian [supplier] senilai [jumlah]"'
      };
    }

    // Create purchase record
    const { data: purchase, error } = await supabase
      .from('purchases')
      .insert({
        user_id: userId,
        supplier: purchaseInfo.supplier,
        total_nilai: purchaseInfo.totalValue,
        tanggal: new Date().toISOString(),
        status: 'pending'
      })
      .select()
      .single();

    console.log('🤖 Purchase create result:', { data: purchase, error });

    if (error) {
      console.log('🤖 Purchase create error:', error);
      throw error;
    }

    return {
      type: 'success',
      text: `✅ Pembelian berhasil dibuat!\n\n📦 Supplier: ${purchase.supplier}\n💰 Total: ${formatCurrency(purchase.total_nilai)}\n📅 Tanggal: ${new Date(purchase.tanggal).toLocaleDateString('id-ID')}\n📊 Status: ${getPurchaseStatusText(purchase.status)}\n\nPembelian akan diproses oleh tim purchasing.`
    };

  } catch (error) {
    console.error('Purchase create error:', error);
    return {
      type: 'error',
      text: '❌ Gagal membuat pembelian bahan baku.'
    };
  }
}

// Handler untuk membuat pesanan baru
async function handleOrderCreate(supabase: any, userId: string, message: string) {
  try {
    console.log('🤖 Handling order create for user:', userId, 'message:', message);
    const startTime = Date.now();

    // Extract order info from message
    const orderInfo = extractOrderInfo(message);
    if (!orderInfo.customerName || !orderInfo.totalAmount) {
      console.log('🤖 Missing required info. Customer:', orderInfo.customerName, 'Amount:', orderInfo.totalAmount);
      return {
        type: 'error',
        text: 'Waduh Kak 😅, informasi pesanan kurang lengkap nih. Coba sebut nama customer dan harganya ya! \n\nContoh yang benar:\n• "Buat pesanan donat untuk Bu Ani 5000 rupiah"\n• "Tambah pesanan roti untuk Pak Budi senilai 10rb"\n\nAtau ada detail lain yang mau ditambahin? 🤔'
      };
    }

    // Enhanced validation
    if (typeof orderInfo.totalAmount !== 'number' || isNaN(orderInfo.totalAmount)) {
      return {
        type: 'error',
        text: '❌ Jumlah harga harus berupa angka yang valid.'
      };
    }

    if (orderInfo.totalAmount <= 0) {
      return {
        type: 'error',
        text: '❌ Total pesanan harus lebih dari 0.'
      };
    }

    if (orderInfo.totalAmount > 10000000) { // 10 million limit
      return {
        type: 'error',
        text: '❌ Total pesanan terlalu besar. Pastikan jumlah yang dimasukkan benar.'
      };
    }

    // Generate order number with date and timestamp for uniqueness
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
    const timeStr = now.toISOString().slice(11, 19).replace(/:/g, ''); // HHMMSS
    const orderNumber = `ORD-${dateStr}-${timeStr.slice(-4)}`; // ORD-20250924-2100

    console.log('🤖 Creating order with data:', {
      userId,
      orderNumber,
      customerName: orderInfo.customerName,
      totalAmount: orderInfo.totalAmount,
      product: orderInfo.product
    });

    // Create order record with retry mechanism
    let orderResult, orderError;
    const maxRetries = 2;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const result = await supabase
        .from('orders')
        .insert({
          user_id: userId,
          nomor_pesanan: `${orderNumber}-${attempt}`, // Add attempt suffix for uniqueness
          nama_pelanggan: orderInfo.customerName,
          total_pesanan: orderInfo.totalAmount,
          status: 'pending',
          catatan: orderInfo.product ? `Produk: ${orderInfo.product}` : null,
          telepon_pelanggan: '',
          alamat_pengiriman: 'Jakarta (jika ada detail lebih lanjut seperti RT/RW atau landmark, silakan beri tahu untuk kemudahan pengiriman)',
          items: [{
            name: orderInfo.product || 'Produk bakery',
            quantity: 1,
            price: orderInfo.totalAmount,
            total: orderInfo.totalAmount
          }],
          subtotal: orderInfo.totalAmount,
          pajak: 0
        })
        .select()
        .single();

      orderResult = result.data;
      orderError = result.error;

      if (!orderError || attempt === maxRetries) break;

      // Retry on connection issues or duplicate key errors
      if (orderError.message?.includes('connection') ||
          orderError.message?.includes('timeout') ||
          orderError.code === '23505') {
        console.log(`🤖 Order create attempt ${attempt + 1} failed, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      } else {
        break;
      }
    }

    const queryTime = Date.now() - startTime;
    console.log('🤖 Order create result:', {
      orderNumber: orderResult?.nomor_pesanan,
      customer: orderResult?.nama_pelanggan,
      amount: orderResult?.total_pesanan,
      queryTime: `${queryTime}ms`,
      error: orderError
    });

    if (orderError) {
      console.log('🤖 Order create error:', orderError);

      // Provide specific error messages
      if (orderError.code === '23505') {
        return {
          type: 'error',
          text: '❌ Nomor pesanan duplikat. Sistem sedang memproses pesanan serupa.'
        };
      } else if (orderError.message?.includes('permission')) {
        return {
          type: 'error',
          text: '❌ Tidak memiliki izin untuk membuat pesanan. Silakan hubungi administrator.'
        };
      }

      return {
        type: 'error',
        text: '❌ Gagal membuat pesanan baru. Pastikan format pesan sudah benar.'
      };
    }

    return {
      type: 'success',
      text: `Sip Kak! 🎉 Pesanan berhasil dibuat nih!\n\n📋 Nomor Pesanan: ${orderResult.nomor_pesanan}\n👤 Customer: ${orderResult.nama_pelanggan}\n🛒 Produk: ${orderInfo.product || 'Produk bakery'}\n💰 Total: ${formatCurrency(orderResult.total_pesanan)}\n📊 Status: ${getStatusText(orderResult.status)}\n🏠 Alamat: ${orderResult.alamat_pengiriman}\n📅 Dibuat: ${now.toLocaleDateString('id-ID')} ${now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}\n⏱️ Waktu proses: ${queryTime}ms\n\nPesanan udah tersimpan di sistem dan siap diproses ya Kak! Ada lagi yang bisa dibantu? 😊`,
      metadata: {
        orderNumber: orderResult.nomor_pesanan,
        customerName: orderResult.nama_pelanggan,
        totalAmount: orderResult.total_pesanan,
        queryTime: `${queryTime}ms`
      }
    };

  } catch (error) {
    console.error('Order create error:', error);
    return {
      type: 'error',
      text: '❌ Gagal membuat pesanan baru. Pastikan format pesan sudah benar.'
    };
  }
}

// Handler untuk menghapus pesanan
async function handleOrderDelete(supabase: any, userId: string, message: string) {
  try {
    console.log('🤖 Handling order delete for user:', userId, 'message:', message);

    // Extract order info from message
    const orderInfo = extractOrderDeleteInfo(message);
    if (!orderInfo.orderId && !orderInfo.customerName) {
      return {
        type: 'error',
        text: '❌ Informasi pesanan tidak lengkap. Format: "hapus pesanan [nomor pesanan]" atau "hapus pesanan customer [nama]"'
      };
    }

    let query = supabase
      .from('orders')
      .delete()
      .eq('user_id', userId);

    if (orderInfo.orderId) {
      query = query.eq('nomor_pesanan', orderInfo.orderId);
    } else if (orderInfo.customerName) {
      query = query.ilike('nama_pelanggan', `%${orderInfo.customerName}%`);
    }

    const { data: deletedOrders, error } = await query.select();

    console.log('🤖 Order delete result:', { data: deletedOrders, error });

    if (error) {
      console.log('🤖 Order delete error:', error);
      throw error;
    }

    if (!deletedOrders || deletedOrders.length === 0) {
      return {
        type: 'error',
        text: '❌ Pesanan tidak ditemukan atau sudah dihapus.'
      };
    }

    const deletedOrder = deletedOrders[0];
    return {
      type: 'success',
      text: `✅ Pesanan berhasil dihapus!\n\n📋 Nomor Pesanan: ${deletedOrder.nomor_pesanan}\n👤 Customer: ${deletedOrder.nama_pelanggan}\n💰 Total: ${formatCurrency(deletedOrder.total_pesanan)}\n\nPesanan telah dibatalkan.`
    };

  } catch (error) {
    console.error('Order delete error:', error);
    return {
      type: 'error',
      text: '❌ Gagal menghapus pesanan.'
    };
  }
}

// Handler untuk update inventory/stok
async function handleInventoryUpdate(supabase: any, userId: string, message: string) {
  try {
    console.log('🤖 Handling inventory update for user:', userId, 'message:', message);
    const startTime = Date.now();

    // Extract inventory update info
    const updateInfo = extractInventoryUpdateInfo(message);
    if (!updateInfo.materialName || updateInfo.newStock === undefined) {
      return {
        type: 'error',
        text: '❌ Informasi update stok tidak lengkap. Format: "update stok [nama bahan] jadi [jumlah]"'
      };
    }

    // Enhanced validation
    if (typeof updateInfo.newStock !== 'number' || isNaN(updateInfo.newStock)) {
      return {
        type: 'error',
        text: '❌ Jumlah stok harus berupa angka yang valid.'
      };
    }

    if (updateInfo.newStock < 0) {
      return {
        type: 'error',
        text: '❌ Stok tidak boleh negatif. Pastikan jumlah stok yang dimasukkan benar.'
      };
    }

    // Find the material first with retry mechanism
    let findResult, findError;
    const maxRetries = 2;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const result = await supabase
        .from('bahan_baku')
        .select('id, nama, stok, minimum, updated_at')
        .eq('user_id', userId)
        .ilike('nama', `%${updateInfo.materialName}%`)
        .single();

      findResult = result.data;
      findError = result.error;

      if (!findError || attempt === maxRetries) break;

      // Retry on connection issues
      if (findError.message?.includes('connection') || findError.message?.includes('timeout')) {
        console.log(`🤖 Material search attempt ${attempt + 1} failed, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      } else {
        break;
      }
    }

    if (findError || !findResult) {
      console.log('🤖 Material not found:', updateInfo.materialName, 'error:', findError);

      // Provide specific error messages
      if (findError?.code === 'PGRST116') {
        return {
          type: 'error',
          text: '❌ Tidak dapat mengakses data warehouse. Pastikan Anda sudah login dengan benar.'
        };
      }

      return {
        type: 'error',
        text: `❌ Bahan "${updateInfo.materialName}" tidak ditemukan di warehouse. Periksa nama bahan dan coba lagi.`
      };
    }

    // Additional validation against existing data
    const existingStock = findResult.stok || 0;
    const changeRatio = existingStock > 0 ? Math.abs(updateInfo.newStock - existingStock) / existingStock : Math.abs(updateInfo.newStock);

    if (changeRatio > 1000) {
      return {
        type: 'error',
        text: `❌ Perubahan stok terlalu drastis (${existingStock} → ${updateInfo.newStock}). Pastikan nilai yang dimasukkan benar.`
      };
    }

    // Update the stock with retry mechanism
    let updateResult, updateError;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const result = await supabase
        .from('bahan_baku')
        .update({
          stok: updateInfo.newStock,
          updated_at: new Date().toISOString()
        })
        .eq('id', findResult.id)
        .select()
        .single();

      updateResult = result.data;
      updateError = result.error;

      if (!updateError || attempt === maxRetries) break;

      // Retry on connection issues
      if (updateError.message?.includes('connection') || updateError.message?.includes('timeout')) {
        console.log(`🤖 Stock update attempt ${attempt + 1} failed, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      } else {
        break;
      }
    }

    const queryTime = Date.now() - startTime;
    console.log('🤖 Inventory update result:', {
      material: findResult.nama,
      oldStock: existingStock,
      newStock: updateInfo.newStock,
      queryTime: `${queryTime}ms`,
      error: updateError
    });

    if (updateError) {
      console.log('🤖 Inventory update error:', updateError);

      // Provide specific error messages
      if (updateError.code === '23505') {
        return {
          type: 'error',
          text: '❌ Konflik data. Bahan ini sedang diperbarui oleh proses lain.'
        };
      } else if (updateError.message?.includes('permission')) {
        return {
          type: 'error',
          text: '❌ Tidak memiliki izin untuk mengupdate stok. Silakan hubungi administrator.'
        };
      }

      return {
        type: 'error',
        text: '❌ Gagal mengupdate stok bahan baku. Silakan coba lagi.'
      };
    }

    // Log activity with proper user scoping
    await supabase.from('activities').insert({
      id: crypto.randomUUID(),
      user_id: userId,
      title: 'Stok Diperbarui via Chatbot',
      description: `Stok ${findResult.nama} diubah dari ${existingStock} menjadi ${updateInfo.newStock}`,
      type: 'stok',
      value: (updateInfo.newStock - existingStock).toString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    return {
      type: 'success',
      text: `Sip Kak! ✅ Stok berhasil diupdate nih!\n\n📦 Bahan: ${updateResult.nama}\n📊 Perubahan: ${existingStock} → ${updateResult.stok}\n🔄 Selisih: ${updateResult.stok - existingStock > 0 ? '+' : ''}${updateResult.stok - existingStock}\n⏱️ Waktu proses: ${queryTime}ms\n\nWarehouse udah diperbarui ya Kak! Mau update stok yang lain? 😊`,
      metadata: {
        materialName: findResult.nama,
        oldStock: existingStock,
        newStock: updateResult.stok,
        queryTime: `${queryTime}ms`
      }
    };

  } catch (error) {
    console.error('Inventory update error:', error);
    return {
      type: 'error',
      text: '❌ Gagal mengupdate stok bahan baku.'
    };
  }
}

// Handler untuk membuat resep baru
async function handleRecipeCreate(supabase: any, userId: string, message: string) {
  try {
    console.log('🤖 Handling recipe create for user:', userId, 'message:', message);

    // Extract recipe info from message
    const recipeInfo = extractRecipeInfo(message);
    if (!recipeInfo.name || !recipeInfo.price) {
      return {
        type: 'error',
        text: '❌ Informasi resep tidak lengkap. Format: "tambah resep [nama resep] dengan harga [jumlah]"'
      };
    }

    // Create recipe record
    const { data: recipe, error } = await supabase
      .from('recipes')
      .insert({
        user_id: userId,
        nama: recipeInfo.name,
        harga_jual: recipeInfo.price,
        kategori: recipeInfo.category || 'Umum'
      })
      .select()
      .single();

    console.log('🤖 Recipe create result:', { data: recipe, error });

    if (error) {
      console.log('🤖 Recipe create error:', error);
      throw error;
    }

    return {
      type: 'success',
      text: `✅ Resep berhasil dibuat!\n\n🍽️ Nama Resep: ${recipe.nama}\n💰 Harga Jual: ${formatCurrency(recipe.harga_jual)}\n📂 Kategori: ${recipe.kategori}\n\nResep telah ditambahkan ke katalog produk.`
    };

  } catch (error) {
    console.error('Recipe create error:', error);
    return {
      type: 'error',
      text: '❌ Gagal membuat resep baru.'
    };
  }
}

// Handler untuk membuat promo baru
async function handlePromoCreate(supabase: any, userId: string, message: string) {
  try {
    console.log('🤖 Handling promo create for user:', userId, 'message:', message);

    // Extract promo info from message
    const promoInfo = extractPromoInfo(message);
    if (!promoInfo.name) {
      return {
        type: 'error',
        text: '❌ Informasi promo tidak lengkap. Format: "tambah promo [nama promo] diskon [persen]%"'
      };
    }

    // Create promo record
    const { data: promo, error } = await supabase
      .from('promos')
      .insert({
        user_id: userId,
        nama_promo: promoInfo.name, // Changed from 'nama' to 'nama_promo' to match schema
        diskon_persen: promoInfo.discountPercent,
        diskon_rupiah: promoInfo.discountAmount,
        tanggal_mulai: promoInfo.startDate || new Date().toISOString(),
        tanggal_selesai: promoInfo.endDate,
        status: 'active'
      })
      .select()
      .single();

    console.log('🤖 Promo create result:', { data: promo, error });

    if (error) {
      console.log('🤖 Promo create error:', error);
      throw error;
    }

    const discountText = promo.diskon_persen
      ? `${promo.diskon_persen}%`
      : formatCurrency(promo.diskon_rupiah);

    return {
      type: 'success',
      text: `✅ Promo berhasil dibuat!\n\n🎉 Nama Promo: ${promo.nama_promo}\n💰 Diskon: ${discountText}\n📅 Mulai: ${new Date(promo.tanggal_mulai).toLocaleDateString('id-ID')}\n📅 Selesai: ${new Date(promo.tanggal_selesai).toLocaleDateString('id-ID')}\n📊 Status: ${getPromoStatusText(promo.status)}\n\nPromo telah aktif dan siap digunakan.`
    };

  } catch (error) {
    console.error('Promo create error:', error);
    return {
      type: 'error',
      text: '❌ Gagal membuat promo baru.'
    };
  }
}

// Utility functions for extracting information from messages
function extractPurchaseInfo(message: string): { supplier?: string; totalValue?: number } {
  const supplierMatch = message.match(/(?:beli|pembelian|supplier)\s+([a-zA-Z\s]+)/i);
  const valueMatch = message.match(/(?:senilai|nilai|total|harga)\s+Rp?\s?([\d,]+)/i);

  return {
    supplier: supplierMatch ? supplierMatch[1].trim() : undefined,
    totalValue: valueMatch ? parseInt(valueMatch[1].replace(/,/g, '')) : undefined
  };
}

function extractOrderInfo(message: string): { customerName?: string; totalAmount?: number; product?: string } {
  console.log('🤖 Extracting order info from:', message);

  // More flexible customer name extraction
  const customerPatterns = [
    /(?:untuk|customer|pelanggan|nama)\s+([a-zA-Z\s]+)/i,
    /(?:pesanan|order)\s+([a-zA-Z\s]+?)(?:\s+senilai|\s+harga|\s+donat|\s+roti|\s+kue)/i,
    /([A-Z][a-z]+\s+[A-Z][a-z]+)/  // Name pattern like "Bu Rika"
  ];

  let customerName;
  for (const pattern of customerPatterns) {
    const match = message.match(pattern);
    if (match) {
      customerName = match[1].trim();
      break;
    }
  }

  // More flexible amount extraction
  const amountPatterns = [
    /(?:senilai|nilai|total|harga|rp)\s+([\d,]+)/i,
    /([\d,]+)(?:\s+ribu|\s+rb)?(?:\s+rupiah)?/i,
    /rp?\s?([\d,]+)/i
  ];

  let totalAmount;
  for (const pattern of amountPatterns) {
    const match = message.match(pattern);
    if (match) {
      totalAmount = parseInt(match[1].replace(/,/g, ''));
      break;
    }
  }

  // Extract product information
  const productMatch = message.match(/(?:pesanan|order|beli)\s+([a-zA-Z\s]+?)(?:\s+untuk|\s+senilai|\s+harga|$)/i);
  const product = productMatch ? productMatch[1].trim() : 'Produk bakery';

  const result = {
    customerName,
    totalAmount,
    product
  };

  console.log('🤖 Extracted order info:', result);
  return result;
}

function extractOrderDeleteInfo(message: string): { orderId?: string; customerName?: string } {
  const orderIdMatch = message.match(/(?:pesanan|order)\s+([A-Z0-9-]+)/i);
  const customerMatch = message.match(/(?:customer|pelanggan)\s+([a-zA-Z\s]+)/i);

  return {
    orderId: orderIdMatch ? orderIdMatch[1].trim() : undefined,
    customerName: customerMatch ? customerMatch[1].trim() : undefined
  };
}

function extractInventoryUpdateInfo(message: string): { materialName?: string; newStock?: number } {
  const materialMatch = message.match(/(?:stok|bahan)\s+([a-zA-Z\s]+?)(?:\s+jadi|\s+menjadi)/i);
  const stockMatch = message.match(/(?:jadi|menjadi|ke)\s+(\d+)/i);

  return {
    materialName: materialMatch ? materialMatch[1].trim() : undefined,
    newStock: stockMatch ? parseInt(stockMatch[1]) : undefined
  };
}

function extractRecipeInfo(message: string): { name?: string; price?: number; category?: string } {
  const nameMatch = message.match(/(?:resep)\s+([a-zA-Z\s]+?)(?:\s+dengan|\s+harga)/i);
  const priceMatch = message.match(/(?:harga|senilai)\s+Rp?\s?([\d,]+)/i);

  return {
    name: nameMatch ? nameMatch[1].trim() : undefined,
    price: priceMatch ? parseInt(priceMatch[1].replace(/,/g, '')) : undefined
  };
}

function extractPromoInfo(message: string): { name?: string; discountPercent?: number; discountAmount?: number; startDate?: string; endDate?: string } {
  const nameMatch = message.match(/(?:promo)\s+([a-zA-Z\s]+?)(?:\s+diskon)/i);
  const percentMatch = message.match(/diskon\s+(\d+)%/i);
  const amountMatch = message.match(/diskon\s+Rp?\s?([\d,]+)/i);

  return {
    name: nameMatch ? nameMatch[1].trim() : undefined,
    discountPercent: percentMatch ? parseInt(percentMatch[1]) : undefined,
    discountAmount: amountMatch ? parseInt(amountMatch[1].replace(/,/g, '')) : undefined,
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
  };
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
    'pending': 'Menunggu Konfirmasi',
    'confirmed': 'Dikonfirmasi',
    'preparing': 'Sedang Dipersiapkan',
    'ready': 'Siap Diambil',
    'delivered': 'Sudah Dikirim',
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
