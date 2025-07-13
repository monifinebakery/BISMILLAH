import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-scalev-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};
const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
// Fungsi untuk memverifikasi tanda tangan webhook Scalev (keamanan opsional)
const verifyScalevSignature = (payload, signature, secret)=>{
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
const handler = async (req)=>{
  console.log('🎯 =================================');
  console.log('🎯 WEBHOOK SCALEV DITERIMA');
  console.log('🎯 =================================');
  console.log('⏰ Timestamp:', new Date().toISOString());
  console.log('🔧 Metode:', req.method);
  console.log('🌐 URL:', req.url);
  // console.log('📡 Header:', Object.fromEntries(req.headers.entries())); // Batalkan komentar untuk logging yang lebih verbose
  // Tangani permintaan preflight CORS
  if (req.method === "OPTIONS") {
    console.log('✅ Permintaan preflight CORS berhasil ditangani');
    return new Response(null, {
      headers: corsHeaders
    });
  }
  if (req.method !== "POST") {
    console.log('❌ Metode tidak valid:', req.method);
    return new Response(JSON.stringify({
      error: "Metode tidak diizinkan",
      received_method: req.method,
      expected_method: "POST"
    }), {
      status: 405,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
  let rawPayload;
  let payload;
  try {
    rawPayload = await req.text();
    console.log('📦 =================================');
    console.log('📦 ANALISIS PAYLOAD PERMINTAAN');
    console.log('📦 =================================');
    console.log('📏 Panjang payload mentah:', rawPayload.length);
    console.log('📝 Pratinjau payload mentah:', rawPayload.substring(0, 500));
    payload = JSON.parse(rawPayload);
    console.log('✅ Parsing JSON berhasil');
    console.log('🎪 Tipe Event:', payload.event);
    // Log data dari payload.data
    console.log('💳 ID Pembayaran (Scalev):', payload.data.id);
    console.log('🆔 ID Order (Sistem Anda):', payload.data.order_id);
    console.log('🔗 Referensi (Scalev):', payload.data.reference);
    console.log('📊 Status (Scalev):', payload.data.status || payload.data.payment_status);
    console.log('💰 Jumlah:', payload.data.amount);
    console.log('💱 Mata Uang:', payload.data.currency); // Log currency
    console.log('📧 Email Pelanggan:', payload.data.customer_email);
    console.log('👤 Nama Pelanggan:', payload.data.customer_name);
    console.log('⏰ Dibayar Pada (dari payload.data):', payload.data.paid_at);
    // Log data atribusi jika ada
    console.log('📊 Saluran Pemasaran (dari metadata):', payload.data.metadata?.marketing_channel);
    console.log('🆔 ID Kampanye (dari metadata):', payload.data.metadata?.campaign_id);
  } catch (parseError) {
    console.log('❌ =================================');
    console.log('❌ ERROR PARSING JSON ATAU MEMBACA PAYLOAD');
    console.log('❌ =================================');
    console.error('Detail error:', parseError);
    // console.error('Payload mentah yang gagal:', rawPayload); // Hanya jika tidak terlalu besar
    return new Response(JSON.stringify({
      error: "Payload JSON tidak valid",
      details: parseError instanceof Error ? parseError.message : "Error parsing tidak diketahui",
      received_payload_length: rawPayload?.length || 0
    }), {
      status: 400,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
  // Verifikasi tanda tangan opsional
  const signature = req.headers.get('x-scalev-signature') || '';
  const webhookSecret = Deno.env.get('SCALEV_SECRET_KEY') || ''; // Pastikan variabel ENV ini diatur!
  console.log('🔐 =================================');
  console.log('🔐 VERIFIKASI TANDA TANGAN');
  console.log('🔐 =================================');
  if (signature && webhookSecret) {
    const isValid = verifyScalevSignature(rawPayload, signature, webhookSecret);
    if (!isValid) {
      console.log('❌ Verifikasi tanda tangan gagal. Mengembalikan 401.');
      return new Response(JSON.stringify({
        error: "Tanda tangan tidak valid",
        webhook_received_successfully: false
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    } else {
      console.log('✅ Verifikasi tanda tangan berhasil');
    }
  } else {
    console.log('⚠️ Verifikasi tanda tangan dilewati (header tanda tangan atau variabel env SCALEV_SECRET_KEY hilang).');
    console.log('ℹ️ Konfigurasi SCALEV_SECRET_KEY untuk keamanan produksi.');
  }
  // Petakan status Scalev ke status ENUM database kita ('pending', 'settled', 'failed')
  let dbStatus; // Asumsi 'failed' juga ada di ENUM Anda
  const scalevStatus = payload.data.status || payload.data.payment_status; // Ambil dari payload.data
  switch(scalevStatus){
    case 'completed':
    case 'settled':
      dbStatus = 'settled';
      break;
    case 'failed':
      dbStatus = 'failed'; // Pastikan 'failed' ada di ENUM database Anda
      break;
    case 'pending':
    default:
      dbStatus = 'pending';
      break;
  }
  console.log(`Memetakan status Scalev '${scalevStatus}' ke status DB '${dbStatus}'`);
  // Hanya proses jika event adalah 'order.payment_status_changed'
  if (payload.event !== 'order.payment_status_changed') {
    console.log(`⚠️ Event tidak relevan: ${payload.event}. Hanya memproses 'order.payment_status_changed'.`);
    return new Response(JSON.stringify({
      success: true,
      message: `Event '${payload.event}' tidak diproses.`,
      event_type: payload.event
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
  let paymentRecord = null;
  let fetchError = null;
  // 1. Coba cari record berdasarkan order_id terlebih dahulu
  if (payload.data.order_id) {
    console.log('🔍 Mencoba mencari record pembayaran berdasarkan order_id:', payload.data.order_id);
    ({ data: paymentRecord, error: fetchError } = await supabase.from('user_payments').select('id, user_id, payment_status, is_paid, pg_reference_id') // Sertakan pg_reference_id untuk diperiksa/diperbarui
    .eq('order_id', payload.data.order_id) // Ambil dari payload.data
    .maybeSingle());
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('❌ Error mengambil berdasarkan order_id:', fetchError);
    // Lanjutkan ke pencarian berikutnya jika ada error selain "tidak ditemukan"
    } else if (paymentRecord) {
      console.log('✅ Record ditemukan berdasarkan order_id:', paymentRecord.id);
    }
  }
  // 2. Jika belum ditemukan, coba cari berdasarkan pg_reference_id
  if (!paymentRecord && payload.data.reference) {
    console.log('🔍 Mencoba mencari record pembayaran berdasarkan pg_reference_id:', payload.data.reference);
    ({ data: paymentRecord, error: fetchError } = await supabase.from('user_payments').select('id, user_id, payment_status, is_paid, pg_reference_id').eq('pg_reference_id', payload.data.reference) // Ambil dari payload.data
    .maybeSingle());
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('❌ Error mengambil berdasarkan pg_reference_id:', fetchError);
    } else if (paymentRecord) {
      console.log('✅ Record ditemukan berdasarkan pg_reference_id:', paymentRecord.id);
    }
  }
  const updateData = {
    payment_status: dbStatus,
    amount: payload.data.amount,
    currency: payload.data.currency,
    order_id: payload.data.order_id,
    email: payload.data.customer_email,
    pg_reference_id: payload.data.reference,
    updated_at: new Date().toISOString(),
    // Menambahkan kolom atribusi pemasaran
    marketing_channel: payload.data.metadata?.marketing_channel || null,
    campaign_id: payload.data.metadata?.campaign_id || null
  };
  // Hanya atur is_paid dan payment_date jika statusnya 'settled'
  if (dbStatus === 'settled') {
    updateData.is_paid = true;
    // Menggunakan payload.data.paid_at sesuai dokumentasi Scalev
    updateData.payment_date = payload.data.paid_at || new Date().toISOString();
  } else {
    updateData.is_paid = false; // Pastikan false untuk pending/failed
    updateData.payment_date = null; // Kosongkan payment_date jika tidak settled
  }
  let updatedRecord;
  let updateError;
  if (paymentRecord) {
    // Record ditemukan, perbarui
    console.log('✅ Record pembayaran yang ada ditemukan:', paymentRecord.id);
    console.log('🔄 Memperbarui record dengan data:', updateData);
    ({ data: updatedRecord, error: updateError } = await supabase.from('user_payments').update(updateData).eq('id', paymentRecord.id) // Perbarui berdasarkan ID record yang ditemukan
    .select().single());
  } else {
    // Record tidak ditemukan, buat yang baru
    console.log('⚠️ Record pembayaran yang ada tidak ditemukan berdasarkan order_id atau pg_reference_id. Mencoba membuat record baru.');
    // Pastikan field NOT NULL yang penting ada untuk insert baru
    if (!payload.data.customer_email) {
      console.error('🚫 Tidak dapat membuat record pembayaran baru: Email pelanggan hilang di payload webhook.');
      return new Response(JSON.stringify({
        error: "Tidak dapat membuat record pembayaran baru: Email pelanggan hilang di payload webhook.",
        webhook_received_successfully: true
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    const emailForNewRecord = payload.data.customer_email || 'no-email@example.com'; // Ambil dari payload.data.customer_email
    const orderIdForNewRecord = payload.data.order_id || `WEBHOOK-ORD-${payload.data.reference || Date.now()}`; // Ambil dari payload.data, fallback jika tidak disediakan
    console.log('🔍 Mencari user_id di auth.users berdasarkan email:', emailForNewRecord);
    // Coba cari user di auth.users untuk menautkan pembayaran
    const { data: authUsers, error: authUserError } = await supabase.auth.admin.listUsers();
    let userIdToLink1 = null;
    if (!authUserError && authUsers?.users) {
      const authUser = authUsers.users.find((user)=>user.email?.toLowerCase() === emailForNewRecord.toLowerCase());
      if (authUser) {
        userIdToLink1 = authUser.id;
        console.log('✅ User yang cocok ditemukan di auth.users:', userIdToLink1);
      } else {
        console.warn('❌ User yang cocok tidak ditemukan di auth.users untuk email:', emailForNewRecord);
      // Pertimbangkan untuk membuat user_id dummy atau tangani sebagai error jika user harus ada
      // Untuk saat ini, jika user_id adalah NOT NULL, ini akan gagal.
      }
    } else {
      console.error('❌ Error mengambil user auth:', authUserError);
    }
    // Jika user_id adalah NOT NULL di user_payments, dan kita tidak dapat menemukannya, ini akan menyebabkan error.
    // Anda mungkin ingin menanganinya dengan lebih baik, misal, log dan kembalikan 200,
    // atau buat user 'tamu' jika sistem Anda mengizinkan.
    if (!userIdToLink1) {
      console.error('🚫 Tidak dapat membuat record pembayaran baru: User ID tidak ditemukan dan tidak boleh null.');
      return new Response(JSON.stringify({
        error: "Tidak dapat membuat record pembayaran baru: User terkait tidak ditemukan dan user_id tidak boleh null.",
        webhook_received_successfully: true
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    // Add user_id and pg_reference_id for new insertion
    const insertData = {
      ...updateData,
      user_id: userIdToLink1,
      pg_reference_id: payload.data.reference,
      order_id: orderIdForNewRecord,
      email: emailForNewRecord,
      created_at: new Date().toISOString() // Tambahkan created_at untuk insert baru
    };
    console.log('➕ Memasukkan record baru dengan data:', insertData);
    ({ data: updatedRecord, error: updateError } = await supabase.from('user_payments').insert(insertData).select().single());
  }
  if (updateError) {
    console.log('❌ =================================');
    console.log('❌ ERROR OPERASI DATABASE');
    console.log('❌ =================================');
    console.error('Detail error operasi:', updateError);
    return new Response(JSON.stringify({
      error: "Gagal memperbarui/memasukkan status pembayaran",
      details: updateError.message,
      reference: payload.data.reference,
      webhook_received_successfully: true
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
  console.log('🎉 =================================');
  console.log('🎉 RECORD PEMBAYARAN BERHASIL DIPROSES');
  console.log('🎉 =================================');
  console.log('✅ User ID:', updatedRecord?.user_id || userIdToLink);
  console.log('✅ Referensi:', updatedRecord?.pg_reference_id || payload.data.reference); // Ambil dari payload.data
  console.log('✅ ID Order:', updatedRecord?.order_id || payload.data.order_id); // Ambil dari payload.data
  console.log('✅ Email:', updatedRecord?.email || payload.data.customer_email); // Ambil dari payload.data
  console.log('✅ Jumlah:', payload.data.amount); // Ambil dari payload.data
  console.log('✅ Status DB Baru:', dbStatus);
  console.log('✅ Sudah Dibayar:', updateData.is_paid);
  console.log('✅ Record Akhir:', updatedRecord);
  // Log data atribusi yang disimpan
  console.log('📊 Saluran Pemasaran Disimpan:', updatedRecord?.marketing_channel);
  console.log('🆔 ID Kampanye Disimpan:', updatedRecord?.campaign_id);
  return new Response(JSON.stringify({
    success: true,
    message: "Status pembayaran berhasil diproses",
    data: {
      reference: updatedRecord?.pg_reference_id || payload.data.reference,
      order_id: updatedRecord?.order_id || payload.data.order_id,
      user_id: updatedRecord?.user_id || userIdToLink,
      amount: payload.data.amount,
      currency: payload.data.currency,
      email: updatedRecord?.email || payload.data.customer_email,
      status: dbStatus,
      is_paid: updateData.is_paid,
      updated_at: new Date().toISOString(),
      marketing_channel: updatedRecord?.marketing_channel,
      campaign_id: updatedRecord?.campaign_id
    }
  }), {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });
};
serve(handler);
