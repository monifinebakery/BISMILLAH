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
  console.log('🎯 MINIMAL: ESSENTIAL PAYMENT COLUMNS ONLY');
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log('📦 Received payload:', JSON.stringify(payload, null, 2));
    
    const payloadData = payload.data || payload;
    
    // ✅ STEP 1: Extract only essential data
    const orderId = payloadData.order_id;
    const paymentStatus = payloadData.payment_status;
    const pgReferenceId = payloadData.pg_reference_id || 
                         payloadData.reference_id ||
                         payloadData.reference ||
                         payloadData.id ||
                         null;
    
    console.log('📋 Essential data extracted:');
    console.log('- Order ID:', orderId);
    console.log('- Payment Status:', paymentStatus);
    console.log('- PG Reference ID:', pgReferenceId);
    
    // ✅ VALIDATION: Must have order_id
    if (!orderId) {
      console.log('❌ No order_id found');
      return new Response(JSON.stringify({
        success: false,
        error: 'order_id is required',
        available_fields: Object.keys(payloadData)
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ✅ STEP 2: Check if payment record exists
    console.log('🔍 Looking for existing payment...');
    
    const { data: existingPayment, error: findError } = await supabase
      .from('user_payments')
      .select('user_id, order_id, pg_reference_id, email, payment_status, is_paid')
      .eq('order_id', orderId)
      .maybeSingle();
    
    if (findError && findError.code !== 'PGRST116') {
      console.error('❌ Error finding payment:', findError);
      throw findError;
    }
    
    let finalRecord;
    let operationType;
    
    if (existingPayment) {
      // ✅ UPDATE EXISTING RECORD
      console.log('✅ Found existing payment, updating...');
      operationType = 'UPDATE';
      
      const updateData = {};
      
      // Update pg_reference_id if not set
      if (pgReferenceId && !existingPayment.pg_reference_id) {
        updateData.pg_reference_id = pgReferenceId;
        console.log('📝 Adding pg_reference_id');
      }
      
      // ✅ CORE: Update payment status and is_paid
      if (paymentStatus === 'paid') {
        updateData.payment_status = 'settled';
        updateData.is_paid = true;
        console.log('💰 MARKING AS PAID');
      } else if (paymentStatus === 'unpaid') {
        updateData.payment_status = 'pending';
        updateData.is_paid = false;
        console.log('⏳ MARKING AS UNPAID');
      } else if (paymentStatus) {
        updateData.payment_status = paymentStatus;
        console.log('📝 Updating status to:', paymentStatus);
      }
      
      // Only update if there are changes
      if (Object.keys(updateData).length === 0) {
        console.log('⚠️ No updates needed');
        finalRecord = existingPayment;
      } else {
        console.log('🔄 Updating with:', updateData);
        
        const { data: updatedPayment, error: updateError } = await supabase
          .from('user_payments')
          .update(updateData)
          .eq('order_id', orderId)
          .select('user_id, order_id, pg_reference_id, email, payment_status, is_paid')
          .single();
        
        if (updateError) {
          console.error('❌ Update failed:', updateError);
          throw updateError;
        }
        
        finalRecord = updatedPayment;
        console.log('✅ Update success');
      }
      
    } else {
      // ✅ CREATE NEW RECORD
      console.log('➕ No existing payment found, creating new...');
      operationType = 'CREATE';
      
      const newPaymentData = {
        user_id: null, // Will be linked later when user logs in
        order_id: orderId,
        pg_reference_id: pgReferenceId,
        email: 'pending@webhook.com', // Placeholder - will be updated when user links
        payment_status: paymentStatus === 'paid' ? 'settled' : 'pending',
        is_paid: paymentStatus === 'paid'
      };
      
      console.log('📝 Creating new payment:', newPaymentData);
      
      const { data: newPayment, error: createError } = await supabase
        .from('user_payments')
        .insert(newPaymentData)
        .select('user_id, order_id, pg_reference_id, email, payment_status, is_paid')
        .single();
      
      if (createError) {
        console.error('❌ Create failed:', createError);
        throw createError;
      }
      
      finalRecord = newPayment;
      console.log('✅ Create success');
    }

    // ✅ STEP 3: Return success response
    console.log('🎉 Webhook completed successfully');
    
    return new Response(JSON.stringify({
      success: true,
      message: `Payment ${operationType.toLowerCase()} successful`,
      operation: operationType,
      data: finalRecord
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error('❌ WEBHOOK ERROR:', error.message);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Webhook failed',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
};

serve(handler);