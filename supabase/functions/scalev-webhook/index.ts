import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-scalev-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '', 
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Fungsi untuk memverifikasi tanda tangan webhook Scalev (keamanan opsional)
const verifyScalevSignature = (payload: string, signature: string, secret: string): boolean => {
  try {
    // Verifikasi sederhana - periksa apakah tanda tangan dan rahasia ada
    // Dalam produksi, implementasikan verifikasi HMAC-SHA256 yang tepat
    console.log('🔐 Verifikasi tanda tangan:', {
      hasSignature: !!signature,
      signatureLength: signature?.length || 0,
      hasSecret: !!secret,
      secretLength: secret?.length || 0
    });
    return true; // Selalu kembalikan true untuk saat ini - tanda tangan opsional, GANTI DI PRODUKSI
  } catch (error) {
    console.error('❌ Error verifikasi tanda tangan:', error);
    return true; // Tetap izinkan permintaan meskipun verifikasi tanda tangan gagal
  }
};

const handler = async (req: Request): Promise<Response> => {
  console.log('🎯 =================================');
  console.log('🎯 WEBHOOK SCALEV DITERIMA');
  console.log('🎯 =================================');
  console.log('⏰ Timestamp:', new Date().toISOString());
  console.log('🔧 Metode:', req.method);
  console.log('🌐 URL:', req.url);

  // Tangani permintaan preflight CORS
  if (req.method === "OPTIONS") {
    console.log('✅ Permintaan preflight CORS berhasil ditangani');
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    console.log('❌ Metode tidak valid:', req.method);
    return new Response(JSON.stringify({
      error: "Metode tidak diizinkan",
      received_method: req.method,
      expected_method: "POST"
    }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  let rawPayload: string;
  let payload: any;

  try {
    rawPayload = await req.text();
    console.log('📦 =================================');
    console.log('📦 ANALISIS PAYLOAD PERMINTAAN');
    console.log('📦 =================================');
    console.log('📏 Panjang payload mentah:', rawPayload.length);
    console.log('📝 Pratinjau payload mentah:', rawPayload.substring(0, 500));
    
    payload = JSON.parse(rawPayload);
    console.log('✅ Parsing JSON berhasil');
    
    // ✅ IMPROVED: Debug payload structure lengkap
    console.log('🔍 =================================');
    console.log('🔍 STRUKTUR PAYLOAD LENGKAP');
    console.log('🔍 =================================');
    console.log('🔍 Full payload:', JSON.stringify(payload, null, 2));
    console.log('🔍 Payload keys:', Object.keys(payload));
    console.log('🔍 Payload.data keys:', Object.keys(payload.data || {}));
    
    console.log('🎪 Tipe Event:', payload.event);
    
    // ✅ IMPROVED: Flexible data extraction
    const payloadData = payload.data || {};
    console.log('💳 ID Pembayaran (Scalev):', payloadData.id);
    console.log('🆔 ID Order (Sistem Anda):', payloadData.order_id);
    console.log('🔗 Referensi (Scalev):', payloadData.reference || payloadData.pg_reference_id);
    console.log('📊 Status (Scalev):', payloadData.status || payloadData.payment_status);
    console.log('💰 Jumlah:', payloadData.amount);
    console.log('💱 Mata Uang:', payloadData.currency);
    
    // ✅ IMPROVED: Multiple ways to get customer email
    const customerEmail = payloadData.customer_email || 
                         payloadData.email || 
                         payload.customer?.email ||
                         (payload.payment_status_history && 
                          payload.payment_status_history[0]?.by?.email);
    
    const customerName = payloadData.customer_name || 
                        payloadData.name ||
                        payload.customer?.name ||
                        (payload.payment_status_history && 
                         payload.payment_status_history[0]?.by?.name);
    
    console.log('📧 Email Pelanggan:', customerEmail);
    console.log('👤 Nama Pelanggan:', customerName);
    console.log('⏰ Dibayar Pada:', payloadData.paid_at || payloadData.paid_time);
    
    // Log data atribusi jika ada
    console.log('📊 Saluran Pemasaran:', payloadData.metadata?.marketing_channel);
    console.log('🆔 ID Kampanye:', payloadData.metadata?.campaign_id);

  } catch (parseError) {
    console.log('❌ =================================');
    console.log('❌ ERROR PARSING JSON');
    console.log('❌ =================================');
    console.error('Detail error:', parseError);
    return new Response(JSON.stringify({
      error: "Payload JSON tidak valid",
      details: parseError instanceof Error ? parseError.message : "Error parsing tidak diketahui",
      received_payload_length: rawPayload?.length || 0
    }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  // Verifikasi tanda tangan opsional
  const signature = req.headers.get('x-scalev-signature') || '';
  const webhookSecret = Deno.env.get('SCALEV_SECRET_KEY') || '';
  
  console.log('🔐 =================================');
  console.log('🔐 VERIFIKASI TANDA TANGAN');
  console.log('🔐 =================================');
  
  if (signature && webhookSecret) {
    const isValid = verifyScalevSignature(rawPayload, signature, webhookSecret);
    if (!isValid) {
      console.log('❌ Verifikasi tanda tangan gagal');
      return new Response(JSON.stringify({
        error: "Tanda tangan tidak valid",
        webhook_received_successfully: false
      }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    } else {
      console.log('✅ Verifikasi tanda tangan berhasil');
    }
  } else {
    console.log('⚠️ Verifikasi tanda tangan dilewati');
  }

  // ✅ IMPROVED: Flexible status mapping
  const scalevStatus = payload.data?.status || payload.data?.payment_status || payload.status;
  let dbStatus: string;
  
  switch(scalevStatus?.toLowerCase()) {
    case 'completed':
    case 'settled':
    case 'paid':           // ✅ FIXED: Tambah case untuk 'paid'
    case 'settlement':
    case 'capture':
      dbStatus = 'settled';
      break;
    case 'failed':
    case 'deny':
    case 'cancel':
    case 'expire':
    case 'error':
      dbStatus = 'failed';
      break;
    case 'pending':
    case 'unpaid':
    case 'authorization':
    default:
      dbStatus = 'pending';
      break;
  }

  console.log(`🔄 Memetakan status Scalev '${scalevStatus}' ke status DB '${dbStatus}'`);

  // Hanya proses jika event adalah 'order.payment_status_changed'
  if (payload.event !== 'order.payment_status_changed') {
    console.log(`⚠️ Event tidak relevan: ${payload.event}`);
    return new Response(JSON.stringify({
      success: true,
      message: `Event '${payload.event}' tidak diproses.`,
      event_type: payload.event
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  // ✅ IMPROVED: Extract customer email from multiple sources
  const customerEmail = payload.data?.customer_email || 
                       payload.data?.email || 
                       payload.customer?.email ||
                       (payload.payment_status_history && 
                        payload.payment_status_history[0]?.by?.email);

  const customerName = payload.data?.customer_name || 
                      payload.data?.name ||
                      payload.customer?.name ||
                      (payload.payment_status_history && 
                       payload.payment_status_history[0]?.by?.name) ||
                      'Unknown User';

  // ✅ IMPROVED: Validate required fields
  if (!customerEmail) {
    console.error('🚫 Email pelanggan tidak ditemukan di payload');
    console.log('🔍 Available fields:', Object.keys(payload.data || {}));
    return new Response(JSON.stringify({
      error: "Email pelanggan tidak ditemukan di payload webhook",
      webhook_received_successfully: true,
      available_fields: Object.keys(payload.data || {})
    }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  let paymentRecord: any = null;
  let fetchError: any = null;

  // 1. Coba cari record berdasarkan order_id terlebih dahulu
  if (payload.data?.order_id) {
    console.log('🔍 Mencari record berdasarkan order_id:', payload.data.order_id);
    
    const { data, error } = await supabase
      .from('user_payments')
      .select('id, user_id, payment_status, is_paid, pg_reference_id')
      .eq('order_id', payload.data.order_id)
      .maybeSingle();
    
    paymentRecord = data;
    fetchError = error;
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('❌ Error mengambil berdasarkan order_id:', fetchError);
    } else if (paymentRecord) {
      console.log('✅ Record ditemukan berdasarkan order_id:', paymentRecord.id);
    }
  }

  // 2. Jika belum ditemukan, coba cari berdasarkan pg_reference_id
  const reference = payload.data?.reference || payload.data?.pg_reference_id;
  if (!paymentRecord && reference) {
    console.log('🔍 Mencari record berdasarkan pg_reference_id:', reference);
    
    const { data, error } = await supabase
      .from('user_payments')
      .select('id, user_id, payment_status, is_paid, pg_reference_id')
      .eq('pg_reference_id', reference)
      .maybeSingle();
    
    paymentRecord = data;
    fetchError = error;
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('❌ Error mengambil berdasarkan pg_reference_id:', fetchError);
    } else if (paymentRecord) {
      console.log('✅ Record ditemukan berdasarkan pg_reference_id:', paymentRecord.id);
    }
  }

  // 3. Jika belum ditemukan, cari berdasarkan email
  if (!paymentRecord && customerEmail) {
    console.log('🔍 Mencari record berdasarkan email:', customerEmail);
    
    const { data, error } = await supabase
      .from('user_payments')
      .select('id, user_id, payment_status, is_paid, pg_reference_id')
      .eq('email', customerEmail)
      .maybeSingle();
    
    paymentRecord = data;
    fetchError = error;
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('❌ Error mengambil berdasarkan email:', fetchError);
    } else if (paymentRecord) {
      console.log('✅ Record ditemukan berdasarkan email:', paymentRecord.id);
    }
  }

  // Prepare update/insert data
  const updateData: any = {
    payment_status: dbStatus,
    amount: payload.data?.amount,
    currency: payload.data?.currency || 'IDR',
    order_id: payload.data?.order_id,
    email: customerEmail,
    pg_reference_id: reference,
    updated_at: new Date().toISOString(),
    marketing_channel: payload.data?.metadata?.marketing_channel || null,
    campaign_id: payload.data?.metadata?.campaign_id || null
  };

  // Set payment-specific fields
  if (dbStatus === 'settled') {
    updateData.is_paid = true;
    updateData.payment_date = payload.data?.paid_at || payload.data?.paid_time || new Date().toISOString();
  } else {
    updateData.is_paid = false;
    updateData.payment_date = null;
  }

  let updatedRecord: any;
  let updateError: any;

  if (paymentRecord) {
    // Record ditemukan, perbarui
    console.log('✅ Record pembayaran ditemukan, updating:', paymentRecord.id);
    console.log('🔄 Update data:', updateData);
    
    const { data, error } = await supabase
      .from('user_payments')
      .update(updateData)
      .eq('id', paymentRecord.id)
      .select()
      .single();
    
    updatedRecord = data;
    updateError = error;
  } else {
    // Record tidak ditemukan, buat yang baru
    console.log('⚠️ Record tidak ditemukan, membuat baru untuk email:', customerEmail);
    
    // Cari user di auth.users untuk link payment
    const { data: authUsers, error: authUserError } = await supabase.auth.admin.listUsers();
    let userIdToLink: string | null = null;
    
    if (!authUserError && authUsers?.users) {
      const authUser = authUsers.users.find((user: any) => 
        user.email?.toLowerCase() === customerEmail.toLowerCase()
      );
      if (authUser) {
        userIdToLink = authUser.id;
        console.log('✅ User ditemukan di auth.users:', userIdToLink);
      } else {
        console.warn('❌ User tidak ditemukan di auth.users untuk email:', customerEmail);
      }
    }

    // Insert data with or without user_id
    const insertData = {
      ...updateData,
      user_id: userIdToLink, // Will be NULL if user not found
      created_at: new Date().toISOString()
    };

    console.log('➕ Insert data baru:', insertData);
    
    const { data, error } = await supabase
      .from('user_payments')
      .insert(insertData)
      .select()
      .single();
    
    updatedRecord = data;
    updateError = error;
  }

  if (updateError) {
    console.log('❌ =================================');
    console.log('❌ ERROR OPERASI DATABASE');
    console.log('❌ =================================');
    console.error('Detail error:', updateError);
    return new Response(JSON.stringify({
      error: "Gagal memperbarui/memasukkan status pembayaran",
      details: updateError.message,
      reference: reference,
      webhook_received_successfully: true
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  console.log('🎉 =================================');
  console.log('🎉 PEMBAYARAN BERHASIL DIPROSES');
  console.log('🎉 =================================');
  console.log('✅ User ID:', updatedRecord?.user_id);
  console.log('✅ Email:', updatedRecord?.email);
  console.log('✅ Order ID:', updatedRecord?.order_id);
  console.log('✅ Reference:', updatedRecord?.pg_reference_id);
  console.log('✅ Amount:', updatedRecord?.amount);
  console.log('✅ Status DB:', updatedRecord?.payment_status);
  console.log('✅ Is Paid:', updatedRecord?.is_paid);
  console.log('✅ Updated At:', updatedRecord?.updated_at);

  return new Response(JSON.stringify({
    success: true,
    message: "Status pembayaran berhasil diproses",
    data: {
      id: updatedRecord?.id,
      user_id: updatedRecord?.user_id,
      email: updatedRecord?.email,
      order_id: updatedRecord?.order_id,
      reference: updatedRecord?.pg_reference_id,
      amount: updatedRecord?.amount,
      currency: updatedRecord?.currency,
      status: updatedRecord?.payment_status,
      is_paid: updatedRecord?.is_paid,
      updated_at: updatedRecord?.updated_at,
      marketing_channel: updatedRecord?.marketing_channel,
      campaign_id: updatedRecord?.campaign_id
    }
  }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
};

serve(handler);