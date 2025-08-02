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

// ✅ UPDATED: Extract customer info based on real Scalev payload
const extractCustomerInfo = (payload) => {
  // Payload bisa berupa direct object (bukan nested di .data)
  const payloadData = payload.data || payload;
  
  // Extract email dari payment_status_history (most reliable source)
  let customerEmail = null;
  let customerName = null;
  
  // Priority 1: From payment_status_history (paling akurat)
  if (payloadData.payment_status_history && payloadData.payment_status_history.length > 0) {
    // Ambil from latest entry
    const latestHistory = payloadData.payment_status_history[payloadData.payment_status_history.length - 1];
    customerEmail = latestHistory.by?.email;
    customerName = latestHistory.by?.name;
  }
  
  // Priority 2: From payment_account_holder
  if (!customerEmail && payloadData.payment_account_holder) {
    // Check if payment_account_holder contains email format
    if (payloadData.payment_account_holder.includes('@')) {
      customerEmail = payloadData.payment_account_holder;
    }
  }
  
  // Priority 3: From direct fields (fallback)
  customerEmail = customerEmail || 
                 payloadData.customer_email || 
                 payloadData.email;
  
  customerName = customerName || 
                payloadData.payment_account_holder || 
                payloadData.customer_name || 
                payloadData.name ||
                'Unknown Customer';
  
  return { customerEmail, customerName };
};

// ✅ UPDATED: Map Scalev payment status to our DB status
const mapPaymentStatus = (scalevStatus) => {
  switch(scalevStatus?.toLowerCase()) {
    case 'paid':
    case 'settled':
    case 'completed':
    case 'settlement':
    case 'capture':
      return 'settled';
    case 'failed':
    case 'deny':
    case 'cancel':
    case 'expire':
    case 'error':
      return 'failed';
    case 'unpaid':
    case 'pending':
    case 'authorization':
    case 'waiting_payment':
    default:
      return 'pending';
  }
};

// ✅ UPDATED: Validate email format
const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  return email.includes('@') && email.includes('.') && email.length > 5;
};

const handler = async (req: Request): Promise<Response> => {
  console.log('🎯 =================================');
  console.log('🎯 WEBHOOK SCALEV DITERIMA');
  console.log('🎯 =================================');
  console.log('⏰ Timestamp:', new Date().toISOString());
  console.log('🔧 Metode:', req.method);
  console.log('🌐 URL:', req.url);

  // Handle CORS preflight
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
    console.log('🔍 STRUKTUR PAYLOAD SCALEV');
    console.log('🔍 =================================');
    console.log('🔍 Full payload:', JSON.stringify(payload, null, 2));
    
    // ✅ UPDATED: Handle both nested and direct payload structures
    const payloadData = payload.data || payload;
    
    console.log('🎪 Tipe Event:', payload.event);
    console.log('💳 Payment ID:', payloadData.id);
    console.log('🆔 Order ID:', payloadData.order_id);
    console.log('📊 Payment Status:', payloadData.payment_status);
    console.log('💰 Payment Method:', payloadData.payment_method);
    console.log('🏦 Financial Entity:', payloadData.financial_entity?.name);
    console.log('💳 Account Holder:', payloadData.payment_account_holder);
    console.log('💳 Account Number:', payloadData.payment_account_number);
    console.log('⏰ Paid Time:', payloadData.paid_time);
    console.log('⏰ Transfer Time:', payloadData.transfer_time);
    
    // ✅ UPDATED: Extract customer info using improved function
    const { customerEmail, customerName } = extractCustomerInfo(payload);
    console.log('📧 Extracted Email:', customerEmail);
    console.log('👤 Extracted Name:', customerName);
    
    // Debug payment_status_history
    if (payloadData.payment_status_history) {
      console.log('📜 Payment History:');
      payloadData.payment_status_history.forEach((history, index) => {
        console.log(`  ${index + 1}. ${history.status} at ${history.at} by ${history.by?.email || 'unknown'}`);
      });
    }

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

  // ✅ UPDATED: Handle event type (assume order.payment_status_changed if not specified)
  const eventType = payload.event || 'order.payment_status_changed';
  
  if (eventType !== 'order.payment_status_changed') {
    console.log(`⚠️ Event tidak relevan: ${eventType}`);
    return new Response(JSON.stringify({
      success: true,
      message: `Event '${eventType}' tidak diproses.`,
      event_type: eventType
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  // ✅ UPDATED: Extract customer info using real payload structure
  const payloadData = payload.data || payload;
  const { customerEmail, customerName } = extractCustomerInfo(payload);

  // ✅ IMPROVED: Email validation with better error reporting
  if (!isValidEmail(customerEmail)) {
    console.error('🚫 Email pelanggan tidak valid atau tidak ditemukan');
    console.log('🔍 Available fields:', Object.keys(payloadData));
    console.log('🔍 Payment account holder:', payloadData.payment_account_holder);
    console.log('🔍 Payment status history:', payloadData.payment_status_history);
    
    // Debug all possible email sources
    const possibleEmailFields = {};
    Object.keys(payloadData).forEach(key => {
      const value = payloadData[key];
      if (typeof value === 'string' && value.includes('@')) {
        possibleEmailFields[key] = value;
      }
    });
    
    // Check payment_status_history for emails
    if (payloadData.payment_status_history) {
      payloadData.payment_status_history.forEach((history, index) => {
        if (history.by?.email) {
          possibleEmailFields[`payment_status_history[${index}].by.email`] = history.by.email;
        }
      });
    }
    
    console.log('🔍 Fields yang mungkin berisi email:', possibleEmailFields);
    
    return new Response(JSON.stringify({
      error: "Email pelanggan tidak ditemukan atau tidak valid di payload webhook",
      webhook_received_successfully: true,
      available_fields: Object.keys(payloadData),
      possible_email_fields: possibleEmailFields,
      extracted_email: customerEmail,
      payment_status_history: payloadData.payment_status_history
    }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  // ✅ UPDATED: Map payment status
  const scalevStatus = payloadData.payment_status;
  const dbStatus = mapPaymentStatus(scalevStatus);
  
  console.log(`🔄 Memetakan status Scalev '${scalevStatus}' ke status DB '${dbStatus}'`);

  let paymentRecord: any = null;
  let fetchError: any = null;

  // ✅ STRATEGY 1: Cari berdasarkan order_id terlebih dahulu
  if (payloadData.order_id) {
    console.log('🔍 Mencari record berdasarkan order_id:', payloadData.order_id);
    
    const { data, error } = await supabase
      .from('user_payments')
      .select('*')
      .eq('order_id', payloadData.order_id)
      .maybeSingle();
    
    paymentRecord = data;
    fetchError = error;
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('❌ Error mengambil berdasarkan order_id:', fetchError);
    } else if (paymentRecord) {
      console.log('✅ Record ditemukan berdasarkan order_id:', paymentRecord.id);
    }
  }

  // ✅ STRATEGY 2: Jika belum ditemukan, cari berdasarkan email
  if (!paymentRecord && customerEmail) {
    console.log('🔍 Mencari record berdasarkan email:', customerEmail);
    
    const { data, error } = await supabase
      .from('user_payments')
      .select('*')
      .eq('email', customerEmail)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    paymentRecord = data;
    fetchError = error;
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('❌ Error mengambil berdasarkan email:', fetchError);
    } else if (paymentRecord) {
      console.log('✅ Record ditemukan berdasarkan email:', paymentRecord.id);
    }
  }

  // ✅ UPDATED: Prepare update/insert data based on real Scalev payload
  const updateData: any = {
    payment_status: dbStatus,
    payment_method: payloadData.payment_method,
    sub_payment_method: payloadData.sub_payment_method,
    financial_entity: payloadData.financial_entity?.name || null,
    payment_account_holder: payloadData.payment_account_holder,
    payment_account_number: payloadData.payment_account_number,
    transferproof_url: payloadData.transferproof_url,
    epayment_provider: payloadData.epayment_provider,
    
    // Order info
    order_id: payloadData.order_id,
    email: customerEmail,
    
    // Business info
    business_name: customerName, // Use customer name as business name if not available
    owner_name: customerName,
    
    // Timestamps
    updated_at: new Date().toISOString(),
    unpaid_time: payloadData.unpaid_time,
    paid_time: payloadData.paid_time,
    transfer_time: payloadData.transfer_time,
    settled_time: payloadData.settled_time,
    conflict_time: payloadData.conflict_time
  };

  // ✅ Set payment-specific fields based on status
  if (dbStatus === 'settled') {
    updateData.is_paid = true;
    updateData.payment_date = payloadData.paid_time || payloadData.settled_time || new Date().toISOString();
  } else if (dbStatus === 'failed') {
    updateData.is_paid = false;
    updateData.payment_date = null;
  } else {
    updateData.is_paid = false;
    updateData.payment_date = null;
  }

  let updatedRecord: any;
  let updateError: any;

  if (paymentRecord) {
    // ✅ Record ditemukan, update existing record
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
    // ✅ Record tidak ditemukan, buat yang baru
    console.log('⚠️ Record tidak ditemukan, membuat baru untuk email:', customerEmail);
    
    // ✅ Cari user di auth.users untuk link payment
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

    // ✅ Insert new record with Scalev data
    const insertData = {
      ...updateData,
      user_id: userIdToLink, // Will be NULL if user not found
      created_at: new Date().toISOString(),
      
      // Default values for required fields if not present in Scalev payload
      amount: 0, // You might want to set a default amount or extract from somewhere
      currency: 'IDR'
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
      order_id: payloadData.order_id,
      email: customerEmail,
      webhook_received_successfully: true
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  console.log('🎉 =================================');
  console.log('🎉 PEMBAYARAN BERHASIL DIPROSES');
  console.log('🎉 =================================');
  console.log('✅ Payment ID:', updatedRecord?.id);
  console.log('✅ User ID:', updatedRecord?.user_id);
  console.log('✅ Email:', updatedRecord?.email);
  console.log('✅ Order ID:', updatedRecord?.order_id);
  console.log('✅ Payment Status:', updatedRecord?.payment_status);
  console.log('✅ Is Paid:', updatedRecord?.is_paid);
  console.log('✅ Payment Method:', updatedRecord?.payment_method);
  console.log('✅ Financial Entity:', updatedRecord?.financial_entity);
  console.log('✅ Account Holder:', updatedRecord?.payment_account_holder);
  console.log('✅ Paid Time:', updatedRecord?.paid_time);
  console.log('✅ Updated At:', updatedRecord?.updated_at);

  return new Response(JSON.stringify({
    success: true,
    message: "Status pembayaran berhasil diproses",
    data: {
      id: updatedRecord?.id,
      user_id: updatedRecord?.user_id,
      email: updatedRecord?.email,
      order_id: updatedRecord?.order_id,
      payment_status: updatedRecord?.payment_status,
      is_paid: updatedRecord?.is_paid,
      payment_method: updatedRecord?.payment_method,
      financial_entity: updatedRecord?.financial_entity,
      payment_account_holder: updatedRecord?.payment_account_holder,
      paid_time: updatedRecord?.paid_time,
      updated_at: updatedRecord?.updated_at
    }
  }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
};

serve(handler);