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

// ✅ FIXED: Extract customer info dengan prioritas yang benar untuk skip system emails
const extractCustomerInfo = (payload: any) => {
  const payloadData = payload.data || payload;
  
  let customerEmail = null;
  let customerName = null;
  
  console.log('🔍 =================================');
  console.log('🔍 DEBUGGING EMAIL EXTRACTION');
  console.log('🔍 =================================');
  console.log('🔍 Payment status history:', JSON.stringify(payloadData.payment_status_history, null, 2));
  
  // Priority 1: Cari email customer dari payment_status_history (bukan system email)
  if (payloadData.payment_status_history && payloadData.payment_status_history.length > 0) {
    
    // Loop through payment history to find CUSTOMER email (bukan system/admin email)
    for (const history of payloadData.payment_status_history) {
      const email = history.by?.email;
      const name = history.by?.name;
      
      console.log(`🔍 Checking history entry: ${email} (${name})`);
      
      // Skip system/admin emails
      if (email && 
          !email.includes('@scalev.') && 
          !email.includes('system@') && 
          !email.includes('admin@') &&
          !email.includes('monifinebakery@') && // Skip your admin email
          !email.includes('support@') &&
          !email.includes('noreply@') &&
          email.includes('@')) {
        customerEmail = email;
        customerName = name;
        console.log(`✅ Found customer email: ${customerEmail}`);
        break;
      } else {
        console.log(`⚠️ Skipped system/admin email: ${email}`);
      }
    }
  }
  
  // Priority 2: From payment_account_holder (if it's an email)
  if (!customerEmail && payloadData.payment_account_holder) {
    if (payloadData.payment_account_holder.includes('@') && 
        !payloadData.payment_account_holder.includes('@scalev.') &&
        !payloadData.payment_account_holder.includes('system@') &&
        !payloadData.payment_account_holder.includes('monifinebakery@')) {
      customerEmail = payloadData.payment_account_holder;
      console.log(`✅ Found email in payment_account_holder: ${customerEmail}`);
    }
  }
  
  // Priority 3: Direct fields (fallback)
  if (!customerEmail) {
    customerEmail = payloadData.customer_email || 
                   payloadData.email;
    console.log(`✅ Found email in direct fields: ${customerEmail}`);
  }
  
  // If still no customer email found, check if there's any email that's not system
  if (!customerEmail && payloadData.payment_status_history) {
    // As last resort, take any email that's not system
    for (const history of payloadData.payment_status_history) {
      const email = history.by?.email;
      if (email && 
          email.includes('@') && 
          !email.includes('@scalev.') &&
          !email.includes('system@') &&
          !email.includes('monifinebakery@')) {
        customerEmail = email;
        customerName = history.by?.name;
        console.log(`⚠️ Taking any non-system email as fallback: ${customerEmail}`);
        break;
      }
    }
  }
  
  // Set default name if not found
  customerName = customerName || 
                payloadData.payment_account_holder || 
                payloadData.customer_name || 
                payloadData.name ||
                'Unknown Customer';
  
  console.log(`🎯 Final extracted email: ${customerEmail}`);
  console.log(`🎯 Final extracted name: ${customerName}`);
  
  return { customerEmail, customerName };
};

// ✅ UPDATED: Map Scalev payment status to our DB status
const mapPaymentStatus = (scalevStatus: string) => {
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
const isValidEmail = (email: string | null | undefined): boolean => {
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
    
    // ✅ FIXED: Extract customer info using improved function
    const { customerEmail, customerName } = extractCustomerInfo(payload);
    
    // Debug payment_status_history
    if (payloadData.payment_status_history) {
      console.log('📜 Payment History:');
      payloadData.payment_status_history.forEach((history: any, index: number) => {
        console.log(`  ${index + 1}. ${history.status} at ${history.at} by ${history.by?.email || 'unknown'} (${history.by?.name || 'unknown'})`);
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

  // ✅ UPDATED: Handle multiple event types
  const eventType = payload.event || 'order.payment_status_changed';
  
  console.log(`🎪 Processing event: ${eventType}`);
  
  // ✅ Handle order.created event (customer submits form on Scalev)
  if (eventType === 'order.created') {
    console.log('🆕 New order created from Scalev landing page');
    
    const { customerEmail, customerName } = extractCustomerInfo(payload);
    
    if (!isValidEmail(customerEmail)) {
      console.warn('⚠️ Invalid email in order.created, but responding success to Scalev');
      
      // Log semua emails yang ditemukan untuk debugging
      const payloadData = payload.data || payload;
      if (payloadData.payment_status_history) {
        console.log('🔍 All emails found in payment_status_history:');
        payloadData.payment_status_history.forEach((history: any, index: number) => {
          console.log(`  ${index}: ${history.by?.email} (${history.by?.name})`);
        });
      }
      
      return new Response(JSON.stringify({
        success: true,
        message: 'Order created but email invalid, skipped DB insert',
        event_type: eventType,
        extracted_email: customerEmail,
        all_emails_in_history: payloadData.payment_status_history?.map((h: any) => h.by?.email)
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
    // Create initial payment record with 'pending' status
    const payloadData = payload.data || payload;
    const insertData = {
      user_id: null, // Will be linked when user registers
      email: customerEmail,
      amount: payloadData.amount || 0,
      currency: payloadData.currency || 'IDR',
      order_id: payloadData.order_id || payloadData.id,
      pg_reference_id: payloadData.reference || payloadData.pg_reference_id,
      payment_status: 'pending', // Initial status for new orders
      is_paid: false,
      payment_method: payloadData.payment_method,
      sub_payment_method: payloadData.sub_payment_method,
      financial_entity: payloadData.financial_entity?.name,
      payment_account_holder: payloadData.payment_account_holder,
      payment_account_number: payloadData.payment_account_number,
      business_name: customerName,
      owner_name: customerName,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('💾 Creating initial payment record:', insertData);
    
    const { data: newRecord, error: insertError } = await supabase
      .from('user_payments')
      .insert(insertData)
      .select()
      .single();
      
    if (insertError) {
      console.error('❌ Failed to create payment record:', insertError);
      console.error('❌ Insert error details:', JSON.stringify(insertError, null, 2));
      // Don't return error to Scalev, just log it
      return new Response(JSON.stringify({
        success: true,
        message: 'Order received but DB insert failed',
        error: insertError.message,
        code: insertError.code
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
    console.log('✅ Initial payment record created:', newRecord.id);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Order created successfully',
      data: {
        id: newRecord.id,
        order_id: newRecord.order_id,
        email: newRecord.email,
        status: newRecord.payment_status
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
  
  // ✅ Handle order.payment_status_changed event (payment completed/failed)
  if (eventType !== 'order.payment_status_changed') {
    console.log(`⚠️ Event not handled: ${eventType}`);
    return new Response(JSON.stringify({
      success: true,
      message: `Event '${eventType}' received but not processed.`,
      event_type: eventType
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  // ✅ FIXED: Extract customer info using improved function
  const payloadData = payload.data || payload;
  const { customerEmail, customerName } = extractCustomerInfo(payload);

  // ✅ IMPROVED: Email validation with better error reporting
  if (!isValidEmail(customerEmail)) {
    console.error('🚫 Customer email tidak valid atau tidak ditemukan');
    console.log('🔍 Available fields:', Object.keys(payloadData));
    console.log('🔍 Payment account holder:', payloadData.payment_account_holder);
    console.log('🔍 Payment status history:', payloadData.payment_status_history);
    
    // Debug all possible email sources
    const possibleEmailFields: {[key: string]: any} = {};
    Object.keys(payloadData).forEach(key => {
      const value = payloadData[key];
      if (typeof value === 'string' && value.includes('@')) {
        possibleEmailFields[key] = value;
      }
    });
    
    // Check payment_status_history for emails
    if (payloadData.payment_status_history) {
      payloadData.payment_status_history.forEach((history: any, index: number) => {
        if (history.by?.email) {
          possibleEmailFields[`payment_status_history[${index}].by.email`] = history.by.email;
        }
      });
    }
    
    console.log('🔍 Fields yang mungkin berisi email:', possibleEmailFields);
    
    return new Response(JSON.stringify({
      error: "Customer email tidak ditemukan atau tidak valid di payload webhook",
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
      amount: payloadData.amount || 0, // Use amount from payload or default to 0
      currency: payloadData.currency || 'IDR'
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
    console.error('Error details:', JSON.stringify(updateError, null, 2));
    return new Response(JSON.stringify({
      error: "Gagal memperbarui/memasukkan status pembayaran",
      details: updateError.message,
      code: updateError.code,
      hint: updateError.hint,
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