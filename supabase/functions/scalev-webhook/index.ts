import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '', 
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const handler = async (req: Request): Promise<Response> => {
  console.log('🎯 SIMPLIFIED: UPDATE PAYMENT STATUS BY ORDER_ID');
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log('📦 Received payload:', JSON.stringify(payload, null, 2));
    
    const payloadData = payload.data || payload;
    
    // ✅ STEP 1: Extract essential payment data
    const orderId = payloadData.order_id;
    const paymentStatus = payloadData.payment_status;
    const pgReferenceId = payloadData.pg_reference_id || 
                         payloadData.reference_id ||
                         payloadData.reference ||
                         payloadData.id ||
                         null;
    
    console.log('📋 Essential payment data extracted:');
    console.log('- Order ID:', orderId);
    console.log('- Payment Status:', paymentStatus);
    console.log('- PG Reference ID:', pgReferenceId);
    
    // ✅ VALIDATION: Must have order_id to proceed
    if (!orderId) {
      console.log('❌ No order_id found, cannot process webhook');
      return new Response(JSON.stringify({
        success: false,
        error: 'order_id is required but not found in payload',
        available_fields: Object.keys(payloadData)
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ✅ STEP 2: Find existing payment record by order_id
    console.log('🔍 Looking for existing payment record...');
    
    const { data: existingPayment, error: findError } = await supabase
      .from('user_payments')
      .select('*')
      .eq('order_id', orderId)
      .maybeSingle();
    
    if (findError && findError.code !== 'PGRST116') {
      console.error('❌ Error finding payment record:', findError);
      throw findError;
    }
    
    if (!existingPayment) {
      console.log('❌ No existing payment record found for order_id:', orderId);
      console.log('🔄 Creating new payment record from webhook...');
      
      // ✅ CREATE new payment record if not exists
      const newPaymentData = {
        order_id: orderId,
        pg_reference_id: pgReferenceId,
        email: 'webhook@auto-created.com', // Placeholder email
        user_id: null, // Will be linked later when user logs in
        payment_status: paymentStatus === 'paid' ? 'settled' : 'pending',
        is_paid: paymentStatus === 'paid',
        amount: payloadData.amount || 0,
        currency: payloadData.currency || 'IDR',
        payment_method: paymentMethod,
        financial_entity: financialEntity,
        payment_account_holder: paymentAccountHolder,
        payment_account_number: paymentAccountNumber,
        paid_time: paidTime,
        transfer_time: transferTime,
        payment_date: paymentStatus === 'paid' ? (paidTime || new Date().toISOString()) : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log('📝 Creating new payment record:', newPaymentData);
      
      const { data: newPayment, error: createError } = await supabase
        .from('user_payments')
        .insert(newPaymentData)
        .select()
        .single();
      
      if (createError) {
        console.error('❌ CREATE FAILED:', createError);
        throw createError;
      }
      
      console.log('✅ NEW PAYMENT RECORD CREATED:', newPayment);
      
      return new Response(JSON.stringify({
        success: true,
        message: 'New payment record created successfully',
        operation: 'CREATE',
        data: {
          id: newPayment.id,
          order_id: newPayment.order_id,
          email: newPayment.email,
          user_id: newPayment.user_id,
          is_paid: newPayment.is_paid,
          payment_status: newPayment.payment_status,
          amount: newPayment.amount,
          payment_date: newPayment.payment_date
        },
        note: 'Payment record created from webhook - will be linked to user when they log in'
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
    console.log('✅ Found existing payment record:', existingPayment.id);
    console.log('Current status:', {
      is_paid: existingPayment.is_paid,
      payment_status: existingPayment.payment_status,
      email: existingPayment.email,
      user_id: existingPayment.user_id
    });

    // ✅ STEP 3: Prepare update data
    const updateData = {
      updated_at: new Date().toISOString()
    };
    
    // Extract additional payment details if available
    const paymentMethod = payloadData.payment_method || null;
    const financialEntity = payloadData.financial_entity?.name || 
                           payloadData.financial_entity || 
                           null;
    const paymentAccountHolder = payloadData.payment_account_holder || null;
    const paymentAccountNumber = payloadData.payment_account_number || null;
    const paidTime = payloadData.paid_time || null;
    const transferTime = payloadData.transfer_time || null;
    const amount = payloadData.amount || existingPayment.amount;
    
    // Update pg_reference_id if provided
    if (pgReferenceId && !existingPayment.pg_reference_id) {
      updateData.pg_reference_id = pgReferenceId;
      console.log('📝 Adding pg_reference_id:', pgReferenceId);
    }
    
    // Update payment method and details if provided
    if (paymentMethod) {
      updateData.payment_method = paymentMethod;
      console.log('📝 Updating payment_method:', paymentMethod);
    }
    
    if (financialEntity) {
      updateData.financial_entity = financialEntity;
      console.log('📝 Updating financial_entity:', financialEntity);
    }
    
    if (paymentAccountHolder) {
      updateData.payment_account_holder = paymentAccountHolder;
    }
    
    if (paymentAccountNumber) {
      updateData.payment_account_number = paymentAccountNumber;
    }
    
    if (paidTime) {
      updateData.paid_time = paidTime;
    }
    
    if (transferTime) {
      updateData.transfer_time = transferTime;
    }
    
    if (amount && amount > 0) {
      updateData.amount = amount;
      console.log('📝 Updating amount:', amount);
    }
    
    // ✅ CORE LOGIC: Update payment status and is_paid
    if (paymentStatus === 'paid') {
      updateData.payment_status = 'settled';
      updateData.is_paid = true;
      updateData.payment_date = paidTime || new Date().toISOString();
      console.log('💰 MARKING AS PAID: payment_status = settled, is_paid = true');
    } else if (paymentStatus === 'unpaid') {
      updateData.payment_status = 'pending';
      updateData.is_paid = false;
      updateData.payment_date = null;
      console.log('⏳ MARKING AS UNPAID: payment_status = pending, is_paid = false');
    } else if (paymentStatus) {
      // For other status values, keep as-is but don't auto-set is_paid
      updateData.payment_status = paymentStatus;
      console.log('📝 Updating payment_status to:', paymentStatus);
    }
    
    console.log('📝 Final update data:', updateData);

    // ✅ STEP 4: Update the payment record
    console.log('🔄 Updating payment record...');
    
    const { data: updatedPayment, error: updateError } = await supabase
      .from('user_payments')
      .update(updateData)
      .eq('id', existingPayment.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ UPDATE FAILED:', updateError);
      throw updateError;
    }
    
    console.log('✅ UPDATE SUCCESS:', updatedPayment);

    // ✅ STEP 5: Return success response
    return new Response(JSON.stringify({
      success: true,
      message: 'Payment status updated successfully',
      operation: 'UPDATE',
      data: {
        id: updatedPayment.id,
        order_id: updatedPayment.order_id,
        email: updatedPayment.email,
        user_id: updatedPayment.user_id,
        is_paid: updatedPayment.is_paid,
        payment_status: updatedPayment.payment_status,
        amount: updatedPayment.amount,
        payment_date: updatedPayment.payment_date
      },
      changes: {
        previous: {
          is_paid: existingPayment.is_paid,
          payment_status: existingPayment.payment_status
        },
        updated: {
          is_paid: updatedPayment.is_paid,
          payment_status: updatedPayment.payment_status
        }
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error('❌ WEBHOOK ERROR:', error.message);
    console.error('Error stack:', error.stack);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Webhook processing failed',
      details: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
};

serve(handler);