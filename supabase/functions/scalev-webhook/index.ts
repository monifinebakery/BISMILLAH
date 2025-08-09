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

// ✅ FIXED: Only link user_id, preserve original email
async function attemptUserLinking(paymentData, orderId) {
  try {
    console.log('🔍 Attempting auto-link for paid payment...');
    console.log('🔍 Current payment email:', paymentData.email);
    
    // Strategy 1: Look for users who recently signed up (within 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { data: authData, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (!usersError && authData?.users) {
      // Filter users created in the last hour
      const recentUsers = authData.users.filter(user => 
        user.created_at > oneHourAgo
      );
      
      console.log(`📊 Found ${recentUsers.length} users created in last hour`);
      
      // Only auto-link if there's exactly ONE recent user (high confidence)
      if (recentUsers.length === 1) {
        const userToLink = recentUsers[0];
        const originalEmail = paymentData.email; // 🔧 PRESERVE original email
        
        paymentData.user_id = userToLink.id;
        paymentData.auth_email = userToLink.email; // Store auth email separately
        // 🔧 FIXED: DON'T overwrite user input email
        // paymentData.email = userToLink.email || 'linked@auto.com'; // ❌ REMOVED
        
        console.log(`✅ Auto-linked to recent user: ${userToLink.id}`);
        console.log(`📧 Preserved user input email: ${originalEmail}`);
        console.log(`🔐 Auth email stored separately: ${userToLink.email}`);
        return;
      } else if (recentUsers.length > 1) {
        console.log('⚠️ Multiple recent users found, cannot auto-link safely');
      } else {
        console.log('⚠️ No recent users found for auto-linking');
      }
    }
    
    // Strategy 2: Look for unlinked payments from same time period (fallback)
    const { data: recentPayments, error: paymentsError } = await supabase
      .from('user_payments')
      .select('user_id, email, created_at')
      .not('user_id', 'is', null)
      .not('email', 'eq', 'pending@webhook.com')
      .gte('created_at', oneHourAgo)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (!paymentsError && recentPayments && recentPayments.length > 0) {
      // Check if all recent payments belong to the same user
      const uniqueUsers = [...new Set(recentPayments.map(p => p.user_id))];
      
      if (uniqueUsers.length === 1) {
        const userToLink = recentPayments[0];
        const originalEmail = paymentData.email; // 🔧 PRESERVE original email
        
        paymentData.user_id = userToLink.user_id;
        // 🔧 FIXED: DON'T overwrite user input email
        // paymentData.email = userToLink.email; // ❌ REMOVED
        
        console.log(`✅ Auto-linked based on recent payment pattern: ${userToLink.user_id}`);
        console.log(`📧 Preserved user input email: ${originalEmail}`);
        return;
      }
    }
    
    // No auto-linking possible - will remain unlinked for manual popup linking
    console.log('⚠️ Could not auto-link safely - will require manual linking');
    
  } catch (error) {
    console.error('❌ Error during auto-linking:', error);
    // Continue without linking - better than failing the webhook
  }
}

const handler = async (req: Request): Promise<Response> => {
  console.log('🎯 FIXED: PRESERVE USER INPUT EMAIL');
  
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
      .select('user_id, order_id, pg_reference_id, email, payment_status, is_paid, auth_email')
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
      console.log('Current payment:', existingPayment);
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
        
        // ✅ AUTO-LINK: Only if payment becomes paid AND no user_id yet
        if (!existingPayment.user_id) {
          console.log('🔗 Payment now paid but no user_id, attempting auto-link...');
          console.log('🔗 Current email to preserve:', existingPayment.email);
          
          // 🔧 FIXED: Create temp object with existing email to preserve it
          const tempPaymentData = {
            email: existingPayment.email // Preserve existing email
          };
          
          await attemptUserLinking(tempPaymentData, orderId);
          
          // Only apply user_id and auth_email if linking succeeded
          if (tempPaymentData.user_id) {
            updateData.user_id = tempPaymentData.user_id;
            if (tempPaymentData.auth_email) {
              updateData.auth_email = tempPaymentData.auth_email;
            }
            console.log('🔗 Applied auto-link results:', {
              user_id: updateData.user_id,
              auth_email: updateData.auth_email,
              preserved_email: existingPayment.email
            });
          }
        } else {
          console.log('👤 Payment already has user_id:', existingPayment.user_id);
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
          .select('user_id, order_id, pg_reference_id, email, payment_status, is_paid, auth_email')
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
        user_id: null, // Start as unlinked
        order_id: orderId,
        pg_reference_id: pgReferenceId,
        email: 'unlinked@payment.com', // 🔧 Default placeholder, will be updated by auto-link
        payment_status: paymentStatus === 'paid' ? 'settled' : 'pending',
        is_paid: paymentStatus === 'paid'
      };
      
      // ✅ AUTO-LINK: Only if payment is paid
      if (paymentStatus === 'paid') {
        console.log('🔗 New paid payment, attempting auto-link...');
        await attemptUserLinking(newPaymentData, orderId);
        
        // 🔧 FIXED: If no email was set during linking, keep placeholder
        if (!newPaymentData.email || newPaymentData.email === 'unlinked@payment.com') {
          newPaymentData.email = 'unlinked@payment.com';
        }
      } else {
        console.log('⏳ New unpaid payment, will remain unlinked until paid');
      }
      
      console.log('📝 Creating new payment:', newPaymentData);
      
      const { data: newPayment, error: createError } = await supabase
        .from('user_payments')
        .insert(newPaymentData)
        .select('user_id, order_id, pg_reference_id, email, payment_status, is_paid, auth_email')
        .single();
      
      if (createError) {
        console.error('❌ Create failed:', createError);
        throw createError;
      }
      
      finalRecord = newPayment;
      console.log('✅ Create success');
    }

    // ✅ STEP 3: Return success response with linking status
    const isLinked = !!finalRecord.user_id;
    console.log('🎉 Webhook completed successfully');
    console.log('Final record:', finalRecord);
    
    return new Response(JSON.stringify({
      success: true,
      message: `Payment ${operationType.toLowerCase()} successful`,
      operation: operationType,
      data: finalRecord,
      auto_linked: isLinked,
      requires_manual_linking: !isLinked && finalRecord.is_paid,
      email_preservation: {
        user_input_email: finalRecord.email,
        auth_email: finalRecord.auth_email || null
      }
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