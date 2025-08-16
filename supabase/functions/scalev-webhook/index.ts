// IMPROVED webhook - Added security, performance optimizations, better error handling
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { getCorsHeaders, handleOptions } from '../_shared/cors.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '', 
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// ✅ Webhook signature verification for security
async function verifyWebhookSignature(req: Request, payload: any): Promise<boolean> {
  try {
    const webhookSecret = Deno.env.get('WEBHOOK_SECRET');
    if (!webhookSecret) {
      console.log('⚠️ WEBHOOK_SECRET not configured - skipping signature verification');
      return true; // Allow if not configured for backward compatibility
    }

    const signature = req.headers.get('x-webhook-signature') || 
                     req.headers.get('x-signature') ||
                     req.headers.get('signature');
    
    if (!signature) {
      console.log('❌ No webhook signature found');
      return false;
    }

    // Create expected signature
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(webhookSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const expectedSignature = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(JSON.stringify(payload))
    );
    
    const expectedHex = Array.from(new Uint8Array(expectedSignature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    const receivedSignature = signature.replace(/^sha256=/, '');
    
    if (expectedHex === receivedSignature) {
      console.log('✅ Webhook signature verified');
      return true;
    }
    
    console.log('❌ Webhook signature mismatch');
    return false;
    
  } catch (error) {
    console.error('❌ Webhook signature verification error:', error);
    return false;
  }
}

// ✅ Enhanced email extraction with better validation
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
      // Enhanced email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const cleanEmail = value.toLowerCase().trim();
      
      if (emailRegex.test(cleanEmail)) {
        console.log(`📧 Found valid email in field '${field}':`, cleanEmail);
        return cleanEmail;
      }
    }
  }

  console.log('⚠️ No valid email found in payload');
  return null;
}

// ✅ OPTIMIZED: Email-based user lookup with caching potential
async function attemptSimpleEmailLinking(extractedEmail, orderId) {
  try {
    if (!extractedEmail) {
      console.log('⚠️ No email to attempt linking');
      return null;
    }

    console.log('🔍 Attempting optimized email linking for:', extractedEmail);
    
    // ✅ PERFORMANCE: More efficient user lookup
    // Note: If you have a user_profiles table with email, use that instead
    const { data: authData, error: usersError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000 // Limit to prevent memory issues
    });
    
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

// ✅ Enhanced validation function
function validatePayload(payloadData) {
  const errors = [];
  
  if (!payloadData.order_id) {
    errors.push({
      field: 'order_id',
      code: 'MISSING_REQUIRED_FIELD',
      message: 'order_id is required'
    });
  }
  
  // Add more validations as needed
  if (payloadData.order_id && typeof payloadData.order_id !== 'string') {
    errors.push({
      field: 'order_id',
      code: 'INVALID_FIELD_TYPE',
      message: 'order_id must be a string'
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// ✅ PERFORMANCE: UPSERT-based processing to prevent race conditions
async function processPaymentUpsert(paymentData, autoLinkedUserId) {
  console.log('🔄 Processing payment with UPSERT approach');
  
  const upsertData = {
    order_id: paymentData.orderId,
    pg_reference_id: paymentData.pgReferenceId,
    email: paymentData.extractedEmail || 'unlinked@payment.com',
    payment_status: paymentData.paymentStatus === 'paid' ? 'settled' : 'pending',
    is_paid: paymentData.paymentStatus === 'paid',
    updated_at: new Date().toISOString()
  };
  
  // Add user_id if auto-linked
  if (autoLinkedUserId) {
    upsertData.user_id = autoLinkedUserId;
  }
  
  // ✅ Use UPSERT to handle race conditions
  const { data, error } = await supabase
    .from('user_payments')
    .upsert(upsertData, {
      onConflict: 'order_id',
      ignoreDuplicates: false // Update existing records
    })
    .select('user_id, order_id, pg_reference_id, email, payment_status, is_paid')
    .single();
  
  if (error) {
    console.error('❌ UPSERT failed:', error);
    throw error;
  }
  
  console.log('✅ UPSERT success');
  return data;
}

const handler = async (req: Request): Promise<Response> => {
  const startTime = Date.now();
  console.log('🎯 IMPROVED WEBHOOK: SECURITY + PERFORMANCE + RACE CONDITION PROTECTION');
  
  if (req.method === "OPTIONS") {
    return handleOptions(req);
  }

  try {
    const payload = await req.json();
    
    // ✅ SECURITY: Verify webhook signature
    const isValidSignature = await verifyWebhookSignature(req, payload);
    if (!isValidSignature) {
      console.log('❌ Webhook signature verification failed');
      const origin = req.headers.get('origin') || '';
      return new Response(JSON.stringify({
        success: false,
        error_code: 'INVALID_SIGNATURE',
        error: 'Webhook signature verification failed'
      }), {
        status: 401,
        headers: { ...getCorsHeaders(origin), "Content-Type": "application/json" }
      });
    }
    
    console.log('📦 Received verified payload:', JSON.stringify(payload, null, 2));
    
    const payloadData = payload.data || payload;
    
    // ✅ VALIDATION: Enhanced payload validation
    const validation = validatePayload(payloadData);
    if (!validation.isValid) {
      console.log('❌ Payload validation failed:', validation.errors);
      const origin = req.headers.get('origin') || '';
      return new Response(JSON.stringify({
        success: false,
        error_code: 'VALIDATION_FAILED',
        error: 'Payload validation failed',
        validation_errors: validation.errors,
        available_fields: Object.keys(payloadData)
      }), {
        status: 400,
        headers: { ...getCorsHeaders(origin), "Content-Type": "application/json" }
      });
    }
    
    // ✅ STEP 1: Extract essential data (keeping original logic)
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
    
    let autoLinkAttempted = false;
    let autoLinkedUserId = null;
    
    // ✅ SIMPLIFIED AUTO-LINK: Only if payment is paid and we have email
    if (paymentStatus === 'paid' && extractedEmail) {
      console.log('🔗 Payment is paid with email, attempting simple auto-link...');
      autoLinkAttempted = true;
      autoLinkedUserId = await attemptSimpleEmailLinking(extractedEmail, orderId);
      
      if (autoLinkedUserId) {
        console.log('🔗 Auto-linked to user:', autoLinkedUserId);
      }
    }
    
    // ✅ STEP 2: Process payment with UPSERT (prevents race conditions)
    const finalRecord = await processPaymentUpsert({
      orderId,
      paymentStatus,
      extractedEmail,
      pgReferenceId
    }, autoLinkedUserId);
    
    // ✅ STEP 3: Determine operation type for response
    const operationType = finalRecord.created_at === finalRecord.updated_at ? 'CREATE' : 'UPDATE';
    
    // ✅ STEP 4: Return enhanced response with performance metrics
    const isLinked = !!finalRecord.user_id;
    const processingTime = Date.now() - startTime;
    
    console.log('🎉 Improved webhook completed successfully');
    console.log('Final record:', finalRecord);
    console.log('Processing time:', processingTime, 'ms');
    
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
      },
      performance: {
        processing_time_ms: processingTime,
        timestamp: new Date().toISOString()
      }
    }), {
      status: 200,
      headers: { ...getCorsHeaders(origin), "Content-Type": "application/json" }
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('❌ IMPROVED WEBHOOK ERROR:', error.message);
    console.error('Error details:', error);
    
    // ✅ Enhanced error categorization
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let statusCode = 500;
    
    if (error.message?.includes('duplicate key')) {
      errorCode = 'DUPLICATE_ORDER_ID';
      statusCode = 409;
    } else if (error.message?.includes('foreign key')) {
      errorCode = 'FOREIGN_KEY_VIOLATION';
      statusCode = 400;
    } else if (error.message?.includes('permission')) {
      errorCode = 'PERMISSION_DENIED';
      statusCode = 403;
    }
    
    const origin = req.headers.get('origin') || '';
    return new Response(JSON.stringify({
      success: false,
      error_code: errorCode,
      error: 'Webhook processing failed',
      details: error.message,
      performance: {
        processing_time_ms: processingTime,
        timestamp: new Date().toISOString()
      }
    }), {
      status: statusCode,
      headers: { ...getCorsHeaders(origin), "Content-Type": "application/json" }
    });
  }
};

serve(handler);