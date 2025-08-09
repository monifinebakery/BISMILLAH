// Enhanced webhook - Extract email from payment gateway payload
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

// ✅ ENHANCED: Extract email from various payload structures
function extractEmailFromPayload(payload) {
  const possibleEmailFields = [
    'email',
    'customer_email', 
    'user_email',
    'payer_email',
    'billing_email',
    'customer.email',
    'payer.email',
    'billing.email',
    'customer_details.email',
    'billing_details.email'
  ];

  for (const field of possibleEmailFields) {
    // Support nested object access (e.g., 'customer.email')
    const value = field.includes('.') 
      ? field.split('.').reduce((obj, key) => obj?.[key], payload)
      : payload[field];
      
    if (value && typeof value === 'string' && value.includes('@')) {
      console.log(`📧 Found email in field '${field}':`, value);
      return value.toLowerCase().trim();
    }
  }

  console.log('⚠️ No email found in payload');
  console.log('📦 Available fields:', Object.keys(payload));
  return null;
}

// ✅ ENHANCED: Better auto-linking with email
async function attemptUserLinking(paymentData, orderId, extractedEmail) {
  try {
    console.log('🔍 Enhanced auto-link attempt...');
    console.log('🔍 Extracted email:', extractedEmail);
    
    let linkedUser = null;

    // ✅ STRATEGY 1: Direct email match (highest priority)
    if (extractedEmail) {
      console.log('🔍 Looking for user with exact email match...');
      
      const { data: authData, error: usersError } = await supabase.auth.admin.listUsers();
      
      if (!usersError && authData?.users) {
        const matchingUser = authData.users.find(user => 
          user.email?.toLowerCase() === extractedEmail.toLowerCase()
        );
        
        if (matchingUser) {
          linkedUser = matchingUser;
          console.log(`✅ Found exact email match: ${matchingUser.id}`);
        }
      }
    }

    // ✅ STRATEGY 2: Recent user fallback (if no email match)
    if (!linkedUser) {
      console.log('🔍 No email match, trying recent user strategy...');
      
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { data: authData, error: usersError } = await supabase.auth.admin.listUsers();
      
      if (!usersError && authData?.users) {
        const recentUsers = authData.users.filter(user => 
          user.created_at > oneHourAgo
        );
        
        console.log(`📊 Found ${recentUsers.length} users created in last hour`);
        
        // Only auto-link if there's exactly ONE recent user
        if (recentUsers.length === 1) {
          linkedUser = recentUsers[0];
          console.log(`✅ Auto-linked to recent user: ${linkedUser.id}`);
        }
      }
    }

    // ✅ APPLY LINKING if user found
    if (linkedUser) {
      paymentData.user_id = linkedUser.id;
      
      // ✅ ENHANCED: Set both emails properly
      if (extractedEmail) {
        paymentData.email = extractedEmail; // Real email from payment
        paymentData.auth_email = linkedUser.email || extractedEmail;
      } else {
        paymentData.email = linkedUser.email || 'unlinked@payment.com';
        paymentData.auth_email = linkedUser.email;
      }
      
      console.log(`🔗 Linking results:`, {
        user_id: paymentData.user_id,
        email: paymentData.email,
        auth_email: paymentData.auth_email,
        strategy: extractedEmail ? 'email_match' : 'recent_user'
      });
      
      return true;
    }
    
    console.log('⚠️ Could not auto-link - will require manual linking');
    return false;
    
  } catch (error) {
    console.error('❌ Error during auto-linking:', error);
    return false;
  }
}

const handler = async (req: Request): Promise<Response> => {
  console.log('🎯 ENHANCED: EMAIL EXTRACTION + AUTO-LINKING');
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log('📦 Received payload:', JSON.stringify(payload, null, 2));
    
    const payloadData = payload.data || payload;
    
    // ✅ STEP 1: Extract essential data + email
    const orderId = payloadData.order_id;
    const paymentStatus = payloadData.payment_status;
    const extractedEmail = extractEmailFromPayload(payloadData); // ✅ NEW
    const pgReferenceId = payloadData.pg_reference_id || 
                         payloadData.reference_id ||
                         payloadData.reference ||
                         payloadData.id ||
                         null;
    
    console.log('📋 Essential data extracted:');
    console.log('- Order ID:', orderId);
    console.log('- Payment Status:', paymentStatus);
    console.log('- Extracted Email:', extractedEmail || 'NOT_FOUND');
    console.log('- PG Reference ID:', pgReferenceId);
    
    // ✅ VALIDATION: Must have order_id
    if (!orderId) {
      console.log('❌ No order_id found');
      return new Response(JSON.stringify({
        success: false,
        error: 'order_id is required',
        available_fields: Object.keys(payloadData),
        email_extraction_attempted: true,
        found_email: !!extractedEmail
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
    let autoLinkAttempted = false;
    let autoLinkSuccess = false;
    
    if (existingPayment) {
      // ✅ UPDATE EXISTING RECORD
      console.log('✅ Found existing payment, updating...');
      console.log('Current payment:', existingPayment);
      operationType = 'UPDATE';
      
      const updateData = {};
      
      // ✅ ENHANCED: Update email if we extracted one and current is placeholder
      if (extractedEmail && 
          (!existingPayment.email || 
           existingPayment.email.includes('@payment.com') || 
           existingPayment.email.includes('@webhook.com'))) {
        updateData.email = extractedEmail;
        console.log('📧 Updating email to extracted value');
      }
      
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
          console.log('🔗 Payment now paid but no user_id, attempting enhanced auto-link...');
          autoLinkAttempted = true;
          
          const tempPaymentData = {
            email: updateData.email || existingPayment.email
          };
          
          autoLinkSuccess = await attemptUserLinking(tempPaymentData, orderId, extractedEmail);
          
          if (autoLinkSuccess) {
            updateData.user_id = tempPaymentData.user_id;
            updateData.email = tempPaymentData.email;
            updateData.auth_email = tempPaymentData.auth_email;
            console.log('🔗 Applied enhanced auto-link results');
          }
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
        user_id: null,
        order_id: orderId,
        pg_reference_id: pgReferenceId,
        email: extractedEmail || 'unlinked@payment.com', // ✅ Use extracted email
        payment_status: paymentStatus === 'paid' ? 'settled' : 'pending',
        is_paid: paymentStatus === 'paid',
        auth_email: null
      };
      
      // ✅ AUTO-LINK: Only if payment is paid
      if (paymentStatus === 'paid') {
        console.log('🔗 New paid payment, attempting enhanced auto-link...');
        autoLinkAttempted = true;
        autoLinkSuccess = await attemptUserLinking(newPaymentData, orderId, extractedEmail);
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

    // ✅ STEP 3: Return enhanced response
    const isLinked = !!finalRecord.user_id;
    console.log('🎉 Enhanced webhook completed successfully');
    console.log('Final record:', finalRecord);
    
    return new Response(JSON.stringify({
      success: true,
      message: `Payment ${operationType.toLowerCase()} successful`,
      operation: operationType,
      data: finalRecord,
      auto_linked: isLinked,
      requires_manual_linking: !isLinked && finalRecord.is_paid,
      email_extraction: {
        attempted: true,
        found: !!extractedEmail,
        extracted_email: extractedEmail || null,
        final_email: finalRecord.email,
        auth_email: finalRecord.auth_email || null
      },
      auto_linking: {
        attempted: autoLinkAttempted,
        success: autoLinkSuccess,
        strategy: autoLinkSuccess ? (extractedEmail ? 'email_match' : 'recent_user') : null
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error('❌ ENHANCED WEBHOOK ERROR:', error.message);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Enhanced webhook failed',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
};

serve(handler);