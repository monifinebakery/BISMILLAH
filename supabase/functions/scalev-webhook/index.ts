// SIMPLIFIED webhook - Removed auth_email, simplified auto-linking
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { getCorsHeaders, handleOptions } from '../_shared/cors.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '', 
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// ✅ Extract email from various payload structures
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
  return null;
}

// ✅ SIMPLIFIED: Only auto-link by exact email match
async function attemptSimpleEmailLinking(extractedEmail, orderId) {
  try {
    if (!extractedEmail) {
      console.log('⚠️ No email to attempt linking');
      return null;
    }

    console.log('🔍 Attempting simple email linking for:', extractedEmail);
    
    // Find user with exact email match
    const { data: authData, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError || !authData?.users) {
      console.log('❌ Could not fetch users:', usersError);
      return null;
    }

    const matchingUser = authData.users.find(user => 
      user.email?.toLowerCase() === extractedEmail.toLowerCase()
    );
    
    if (matchingUser) {
      console.log(`✅ Found exact email match: ${matchingUser.id}`);
      return matchingUser.id;
    }

    console.log('⚠️ No user found with email:', extractedEmail);
    return null;
    
  } catch (error) {
    console.error('❌ Error during email linking:', error);
    return null;
  }
}

const handler = async (req: Request): Promise<Response> => {
  console.log('🎯 SIMPLIFIED WEBHOOK: EMAIL EXTRACTION + SIMPLE AUTO-LINKING');
  
  if (req.method === "OPTIONS") {
    return handleOptions(req);
  }

  try {
    const payload = await req.json();
    console.log('📦 Received payload:', JSON.stringify(payload, null, 2));
    
    const payloadData = payload.data || payload;
    
    // ✅ STEP 1: Extract essential data
    const orderId = payloadData.order_id;
    const paymentStatus = payloadData.payment_status;
    const extractedEmail = extractEmailFromPayload(payloadData);
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
      const origin = req.headers.get('origin') || '';
      return new Response(JSON.stringify({
        success: false,
        error: 'order_id is required',
        available_fields: Object.keys(payloadData)
      }), {
        status: 400,
        headers: { ...getCorsHeaders(origin), "Content-Type": "application/json" }
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
    let autoLinkAttempted = false;
    let autoLinkedUserId = null;
    
    if (existingPayment) {
      // ✅ UPDATE EXISTING RECORD
      console.log('✅ Found existing payment, updating...');
      console.log('Current payment:', existingPayment);
      operationType = 'UPDATE';
      
      const updateData = {};
      
      // ✅ Update email if we extracted one and current is placeholder
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
        
        // ✅ SIMPLIFIED AUTO-LINK: Only if payment becomes paid AND no user_id yet
        if (!existingPayment.user_id && extractedEmail) {
          console.log('🔗 Payment now paid but no user_id, attempting simple auto-link...');
          autoLinkAttempted = true;
          autoLinkedUserId = await attemptSimpleEmailLinking(extractedEmail, orderId);
          
          if (autoLinkedUserId) {
            updateData.user_id = autoLinkedUserId;
            console.log('🔗 Auto-linked to user:', autoLinkedUserId);
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
        user_id: null,
        order_id: orderId,
        pg_reference_id: pgReferenceId,
        email: extractedEmail || 'unlinked@payment.com',
        payment_status: paymentStatus === 'paid' ? 'settled' : 'pending',
        is_paid: paymentStatus === 'paid'
      };
      
      // ✅ SIMPLIFIED AUTO-LINK: Only if payment is paid and we have email
      if (paymentStatus === 'paid' && extractedEmail) {
        console.log('🔗 New paid payment, attempting simple auto-link...');
        autoLinkAttempted = true;
        autoLinkedUserId = await attemptSimpleEmailLinking(extractedEmail, orderId);
        
        if (autoLinkedUserId) {
          newPaymentData.user_id = autoLinkedUserId;
          console.log('🔗 Auto-linked new payment to user:', autoLinkedUserId);
        }
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

    // ✅ STEP 3: Return simplified response
    const isLinked = !!finalRecord.user_id;
    console.log('🎉 Simplified webhook completed successfully');
    console.log('Final record:', finalRecord);
    
    const origin = req.headers.get('origin') || '';
    return new Response(JSON.stringify({
      success: true,
      message: `Payment ${operationType.toLowerCase()} successful`,
      operation: operationType,
      data: finalRecord,
      auto_linked: isLinked,
      requires_manual_linking: !isLinked && finalRecord.is_paid,
      email_extraction: {
        found: !!extractedEmail,
        extracted_email: extractedEmail || null,
        final_email: finalRecord.email
      },
      auto_linking: {
        attempted: autoLinkAttempted,
        success: !!autoLinkedUserId,
        linked_user_id: autoLinkedUserId
      }
    }), {
      status: 200,
      headers: { ...getCorsHeaders(origin), "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error('❌ SIMPLIFIED WEBHOOK ERROR:', error.message);
    
    const origin = req.headers.get('origin') || '';
    return new Response(JSON.stringify({
      success: false,
      error: 'Simplified webhook failed',
      details: error.message
    }), {
      status: 500,
      headers: { ...getCorsHeaders(origin), "Content-Type": "application/json" }
    });
  }
};

serve(handler);