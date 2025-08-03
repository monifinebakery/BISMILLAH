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

// ✅ AUTO-LINKING FUNCTION: Try to link payment to user
async function attemptUserLinking(paymentData, orderId) {
  try {
    console.log('🔍 Looking for user to link payment to...');
    
    // Strategy 1: Look for recent user sessions or pending payments
    // Check if there's an existing payment for this user that we can match
    const { data: recentPayments, error: recentError } = await supabase
      .from('user_payments')
      .select('user_id, email')
      .not('user_id', 'is', null)
      .not('email', 'eq', 'pending@webhook.com')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (!recentError && recentPayments && recentPayments.length > 0) {
      // For now, we'll use a simple heuristic - but you might want to implement
      // more sophisticated matching logic based on your app's flow
      console.log('📊 Found recent payments with users:', recentPayments.length);
      
      // You could implement more specific matching logic here
      // For example: match by IP, session, or other identifying info
      
      // Simple approach: if there's only one recent user, likely the same person
      const uniqueUsers = [...new Set(recentPayments.map(p => p.user_id))];
      if (uniqueUsers.length === 1) {
        const userToLink = recentPayments[0];
        paymentData.user_id = userToLink.user_id;
        paymentData.email = userToLink.email;
        console.log(`✅ Auto-linked to recent user: ${userToLink.email}`);
        return;
      }
    }
    
    // Strategy 2: Look for users who recently signed up (within 30 minutes)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    
    const { data: recentUsers, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (!usersError && recentUsers?.users) {
      const veryRecentUsers = recentUsers.users.filter(user => 
        user.created_at > thirtyMinutesAgo
      );
      
      if (veryRecentUsers.length === 1) {
        const userToLink = veryRecentUsers[0];
        paymentData.user_id = userToLink.id;
        paymentData.email = userToLink.email;
        console.log(`✅ Auto-linked to recent signup: ${userToLink.email}`);
        return;
      }
    }
    
    console.log('⚠️ Could not auto-link payment - will remain unlinked for manual linking later');
    
  } catch (error) {
    console.error('❌ Error during auto-linking:', error);
    // Continue without linking - better than failing the webhook
  }
}

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
        
        // ✅ AUTO-LINK: Try to find user_id when payment becomes paid
        if (!existingPayment.user_id) {
          console.log('🔗 Payment now paid but no user_id, attempting auto-link...');
          await attemptUserLinking(updateData, orderId);
        }
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
        user_id: null, // Will be linked below if payment is paid
        order_id: orderId,
        pg_reference_id: pgReferenceId,
        email: 'pending@webhook.com', // Placeholder - will be updated when user links
        payment_status: paymentStatus === 'paid' ? 'settled' : 'pending',
        is_paid: paymentStatus === 'paid'
      };
      
      // ✅ AUTO-LINK: If payment is paid, try to link user immediately
      if (paymentStatus === 'paid') {
        console.log('🔗 New paid payment, attempting auto-link...');
        await attemptUserLinking(newPaymentData, orderId);
      }
      
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