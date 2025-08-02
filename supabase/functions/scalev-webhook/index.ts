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

// ✅ IMPROVED: Whitelist email validation function
function isValidCustomerEmail(email) {
  if (!email || typeof email !== 'string' || !email.includes('@') || !email.includes('.')) {
    return false;
  }
  
  const emailLower = email.toLowerCase().trim();
  
  console.log(`🔍 Validating email: "${emailLower}"`);
  
  // ❌ BLACKLIST: System/admin/merchant emails
  const blacklistedDomains = [
    'scalev.id',
    'scalev.com',
    'monifinebakery.com',
    'monifinebakery@',
    'monifine'
  ];
  
  const blacklistedPrefixes = [
    'system@',
    'admin@',
    'noreply@',
    'no-reply@',
    'support@',
    'info@',
    'hello@',
    'contact@',
    'sales@',
    'billing@'
  ];
  
  // Check blacklisted domains
  for (const domain of blacklistedDomains) {
    if (emailLower.includes(domain)) {
      console.log(`🚫 REJECTED - Blacklisted domain: ${email} contains ${domain}`);
      return false;
    }
  }
  
  // Check blacklisted prefixes
  for (const prefix of blacklistedPrefixes) {
    if (emailLower.startsWith(prefix)) {
      console.log(`🚫 REJECTED - Blacklisted prefix: ${email} starts with ${prefix}`);
      return false;
    }
  }
  
  // ✅ WHITELIST: Common customer email domains
  const whitelistedDomains = [
    'gmail.com',
    'yahoo.com',
    'yahoo.co.id',
    'hotmail.com',
    'outlook.com',
    'outlook.co.id',
    'icloud.com',
    'live.com',
    'me.com',
    'aol.com',
    'protonmail.com',
    'tutanota.com',
    'yandex.com',
    'mail.com',
    'zoho.com'
  ];
  
  // Check if email domain is whitelisted
  for (const domain of whitelistedDomains) {
    if (emailLower.endsWith('@' + domain)) {
      console.log(`✅ APPROVED - Whitelisted customer email: ${email}`);
      return true;
    }
  }
  
  // For other domains, be permissive but exclude obvious system emails
  const emailDomain = emailLower.split('@')[1];
  if (emailDomain && 
      !emailLower.includes('monifinebakery') && 
      !emailLower.includes('monifine') &&
      !emailLower.includes('scalev') &&
      !emailLower.includes('system') &&
      !emailLower.includes('admin')) {
    console.log(`⚠️ APPROVED - Unknown domain but looks like customer email: ${email}`);
    return true;
  }
  
  console.log(`🚫 REJECTED - Email failed validation: ${email}`);
  return false;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('🎯 PRIORITY: GET DATA INTO DATABASE WITH PROPER USER LINKING');
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log('📦 Received payload:', JSON.stringify(payload, null, 2));
    
    // Debug: show all fields in payload.data for reference ID hunting
    const payloadData = payload.data || payload;
    console.log('🔍 HUNTING FOR REFERENCE ID...');
    console.log('Available fields in payload.data:', Object.keys(payloadData));
    console.log('- id:', payloadData.id);
    console.log('- pg_reference_id:', payloadData.pg_reference_id);
    console.log('- reference_id:', payloadData.reference_id);
    console.log('- reference:', payloadData.reference);
    console.log('- unique_id:', payloadData.unique_id);
    console.log('- order_id:', payloadData.order_id);

    // ✅ STEP 1: IMPROVED customer email extraction with whitelist validation
    let customerEmail = null;
    
    console.log('🔍 === CUSTOMER EMAIL EXTRACTION START ===');
    
    // Method 1: Check payment_status_history for customer email (HIGHEST PRIORITY)
    if (payloadData.payment_status_history && Array.isArray(payloadData.payment_status_history)) {
      console.log('📧 Checking payment_status_history...');
      console.log('Payment history entries:', payloadData.payment_status_history.length);
      
      // Log all emails found in history
      payloadData.payment_status_history.forEach((history, index) => {
        if (history.by?.email) {
          console.log(`  History ${index + 1}: ${history.by.email} (status: ${history.status})`);
        }
      });
      
      // Look for valid customer email in history
      for (const history of payloadData.payment_status_history) {
        if (history.by?.email && isValidCustomerEmail(history.by.email)) {
          customerEmail = history.by.email;
          console.log('✅ SELECTED customer email from payment_status_history:', customerEmail);
          break;
        }
      }
    }
    
    // Method 2: Check direct payload fields (MEDIUM PRIORITY)
    if (!customerEmail) {
      console.log('📧 Checking direct payload fields...');
      
      const directEmailSources = [
        payloadData.customer_email,
        payloadData.buyer_email,
        payloadData.payer_email,
        payloadData.user_email,
        payloadData.client_email,
        payload.customer_email,
        payload.email,
        payloadData.email,
        
        // Nested object checks
        payloadData.customer_info?.email,
        payloadData.customer?.email,
        payloadData.buyer?.email,
        payloadData.payer?.email,
        payloadData.user?.email,
        payloadData.billing?.email,
        payloadData.contact?.email
      ];
      
      console.log('Direct email sources found:', directEmailSources.filter(Boolean));
      
      for (const email of directEmailSources) {
        if (email && isValidCustomerEmail(email)) {
          customerEmail = email;
          console.log('✅ SELECTED customer email from direct fields:', customerEmail);
          break;
        }
      }
    }
    
    // Method 3: Deep search in payload (LOWEST PRIORITY)
    if (!customerEmail) {
      console.log('📧 Deep searching for email patterns...');
      
      function findEmailsInObject(obj, path = '') {
        const foundEmails = [];
        
        if (typeof obj === 'string' && obj.includes('@') && obj.includes('.')) {
          console.log(`📧 Found email at ${path}: "${obj}"`);
          if (isValidCustomerEmail(obj)) {
            foundEmails.push(obj);
          }
        }
        
        if (typeof obj === 'object' && obj !== null) {
          for (const [key, value] of Object.entries(obj)) {
            const childEmails = findEmailsInObject(value, path ? `${path}.${key}` : key);
            foundEmails.push(...childEmails);
          }
        }
        
        return foundEmails;
      }
      
      const foundEmails = findEmailsInObject(payload);
      if (foundEmails.length > 0) {
        customerEmail = foundEmails[0]; // Take first valid email
        console.log('✅ SELECTED customer email via deep search:', customerEmail);
      }
    }
    
    // ✅ FINAL VALIDATION: Ensure we have a valid customer email
    if (!customerEmail) {
      console.log('❌ === NO VALID CUSTOMER EMAIL FOUND ===');
      
      // Log all available email-like data for debugging
      console.log('🔍 DEBUG - All email-like data in payload:');
      console.log('- payment_account_holder:', payloadData.payment_account_holder);
      
      if (payloadData.payment_status_history) {
        console.log('- payment_status_history emails:');
        payloadData.payment_status_history.forEach((h, i) => {
          if (h.by?.email) {
            console.log(`  [${i}] ${h.by.email} (${h.status})`);
          }
        });
      }
      
      console.log('🚫 WEBHOOK REJECTED - No valid customer email found');
      
      return new Response(JSON.stringify({
        success: false,
        error: 'No valid customer email found in payload',
        reason: 'All detected emails are system/admin emails',
        order_id: payloadData.order_id,
        debug_info: {
          payment_account_holder: payloadData.payment_account_holder,
          payment_history_emails: payloadData.payment_status_history?.map(h => h.by?.email).filter(Boolean) || []
        }
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
    console.log('🎯 === FINAL CUSTOMER EMAIL SELECTED ===:', customerEmail);

    // STEP 2: Extract additional Scalev data
    const pgReferenceId = payloadData.pg_reference_id || 
                         payloadData.reference_id ||
                         payloadData.reference ||
                         payloadData.id ||
                         null;
    
    const paymentMethod = payloadData.payment_method || null;
    const financialEntity = payloadData.financial_entity?.name || 
                           payloadData.financial_entity || 
                           null;
    const paymentAccountHolder = payloadData.payment_account_holder || null;
    const paymentAccountNumber = payloadData.payment_account_number || null;
    const paidTime = payloadData.paid_time || null;
    const transferTime = payloadData.transfer_time || null;
    const amount = payloadData.amount || 0;
    
    console.log('💳 Payment details extracted:');
    console.log('- PG Reference ID:', pgReferenceId);
    console.log('- Payment Method:', paymentMethod);
    console.log('- Financial Entity:', financialEntity);
    console.log('- Account Holder:', paymentAccountHolder);
    console.log('- Amount:', amount);
    console.log('- Paid Time:', paidTime);

    // ✅ STEP 3: IMPROVED user lookup with detailed logging
    console.log('🔗 === USER LOOKUP START ===');
    console.log('Target email for user lookup:', customerEmail);

    let linkedUserId = null;

    try {
      // Try to find user by email in auth.users
      console.log('🔍 Looking up user in auth.users...');
      
      const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.error('❌ Error fetching auth users:', authError);
      } else if (!authData?.users) {
        console.log('❌ No users data returned from auth.admin.listUsers()');
      } else {
        // 🔍 DEBUG: Log all users for investigation
        console.log(`📊 Total auth users found: ${authData.users.length}`);
        authData.users.forEach((user, index) => {
          console.log(`  ${index + 1}. ID: ${user.id.substring(0, 8)}...`);
          console.log(`     Email: ${user.email}`);
          console.log(`     Created: ${user.created_at}`);
          console.log('     ---');
        });
        
        console.log(`🎯 SEARCHING FOR EXACT EMAIL MATCH: "${customerEmail}"`);
        
        // ✅ CRITICAL: Exact email matching logic with detailed logging
        let foundMatch = false;
        for (const user of authData.users) {
          const userEmail = user.email?.toLowerCase().trim();
          const searchEmail = customerEmail.toLowerCase().trim();
          const isMatch = userEmail === searchEmail;
          
          console.log(`  Comparing: "${userEmail}" === "${searchEmail}" = ${isMatch}`);
          
          if (isMatch) {
            linkedUserId = user.id;
            foundMatch = true;
            console.log('✅ FOUND EXACT MATCH:', {
              id: linkedUserId,
              email: user.email,
              created_at: user.created_at
            });
            break;
          }
        }
        
        if (!foundMatch) {
          console.log('❌ NO EXACT MATCH FOUND for email:', customerEmail);
          console.log('📧 Available auth emails:', authData.users.map(u => u.email));
          console.log('⚠️ Payment will be created without user_id (unlinked)');
        }
      }
    } catch (userLookupError) {
      console.error('❌ Exception during user lookup:', userLookupError);
      linkedUserId = null; // Ensure it stays null on error
    }

    // 🔍 FINAL SAFETY CHECK
    console.log('🎯 === USER LOOKUP RESULT ===');
    console.log('Final linkedUserId decision:', linkedUserId);
    if (linkedUserId && customerEmail) {
      console.log(`✅ WILL LINK: "${customerEmail}" → user_id: ${linkedUserId}`);
    } else {
      console.log('⚠️ NO USER LINKING: Will create unlinked payment record');
    }

    // STEP 4: Build payment record with all data
    const insertData = {
      user_id: linkedUserId, // ✅ NULL if no user found (safe)
      email: customerEmail,
      order_id: payloadData.order_id || `AUTO_${Date.now()}`,
      pg_reference_id: pgReferenceId,
      payment_status: payloadData.payment_status === 'paid' ? 'settled' : 'pending',
      is_paid: payloadData.payment_status === 'paid',
      amount: amount,
      currency: payloadData.currency || 'IDR',
      payment_method: paymentMethod,
      financial_entity: financialEntity,
      payment_account_holder: paymentAccountHolder,
      payment_account_number: paymentAccountNumber,
      paid_time: paidTime,
      transfer_time: transferTime,
      payment_date: payloadData.payment_status === 'paid' ? (paidTime || new Date().toISOString()) : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('💾 === PAYMENT RECORD DATA ===');
    console.log('Preparing payment record:', insertData);

    // STEP 5: CHECK IF RECORD EXISTS (by order_id or pg_reference_id)
    console.log('🔍 === CHECKING FOR EXISTING RECORD ===');
    
    let existingRecord = null;
    
    // Try to find by order_id first
    if (insertData.order_id) {
      console.log('Checking for existing record by order_id:', insertData.order_id);
      const { data: orderRecord, error: orderError } = await supabase
        .from('user_payments')
        .select('*')
        .eq('order_id', insertData.order_id)
        .maybeSingle();
      
      if (!orderError && orderRecord) {
        existingRecord = orderRecord;
        console.log('✅ Found existing record by order_id:', existingRecord.id);
      } else if (orderError && orderError.code !== 'PGRST116') {
        console.error('❌ Error checking order_id:', orderError);
      }
    }
    
    // If not found by order_id, try pg_reference_id
    if (!existingRecord && pgReferenceId) {
      console.log('Checking for existing record by pg_reference_id:', pgReferenceId);
      const { data: refRecord, error: refError } = await supabase
        .from('user_payments')
        .select('*')
        .eq('pg_reference_id', pgReferenceId)
        .maybeSingle();
      
      if (!refError && refRecord) {
        existingRecord = refRecord;
        console.log('✅ Found existing record by pg_reference_id:', existingRecord.id);
      } else if (refError && refError.code !== 'PGRST116') {
        console.error('❌ Error checking pg_reference_id:', refError);
      }
    }
    
    let finalRecord;
    let operationType;
    
    if (existingRecord) {
      // RECORD EXISTS - UPDATE IT
      console.log('✅ === UPDATING EXISTING RECORD ===');
      console.log('Existing record ID:', existingRecord.id);
      operationType = 'UPDATE';
      
      // Prepare update data
      const updateData = {
        ...insertData,
        updated_at: new Date().toISOString()
      };
      
      // ✅ Smart user_id linking logic
      if (linkedUserId && !existingRecord.user_id) {
        console.log('🔗 Linking user_id to existing record');
        updateData.user_id = linkedUserId;
      } else if (existingRecord.user_id && !linkedUserId) {
        console.log('👤 Keeping existing user_id:', existingRecord.user_id);
        updateData.user_id = existingRecord.user_id;
      } else if (linkedUserId && existingRecord.user_id && linkedUserId !== existingRecord.user_id) {
        console.log('⚠️ User ID conflict - keeping existing:', existingRecord.user_id);
        updateData.user_id = existingRecord.user_id;
      }
      
      // Smart email handling
      if (isValidCustomerEmail(existingRecord.email) && !isValidCustomerEmail(customerEmail)) {
        console.log('📧 Keeping existing customer email:', existingRecord.email);
        updateData.email = existingRecord.email;
      }
      
      // Update payment status if payload indicates paid
      if (payloadData.payment_status === 'paid') {
        updateData.payment_status = 'settled';
        updateData.is_paid = true;
        updateData.payment_date = paidTime || new Date().toISOString();
        console.log('💰 Updating payment status to paid/settled');
      }
      
      console.log('🔄 Final update data:', updateData);
      
      const { data: updatedRecord, error: updateError } = await supabase
        .from('user_payments')
        .update(updateData)
        .eq('id', existingRecord.id)
        .select()
        .single();
      
      if (updateError) {
        console.error('❌ UPDATE FAILED:', updateError);
        throw updateError;
      } else {
        console.log('✅ UPDATE SUCCESS:', updatedRecord);
        finalRecord = updatedRecord;
      }
      
    } else {
      // RECORD DOESN'T EXIST - INSERT NEW
      console.log('➕ === INSERTING NEW RECORD ===');
      operationType = 'INSERT';
      
      const { data: newRecord, error: insertError } = await supabase
        .from('user_payments')
        .insert(insertData)
        .select()
        .single();
      
      if (insertError) {
        console.error('❌ INSERT FAILED:', insertError);
        throw insertError;
      } else {
        console.log('✅ INSERT SUCCESS:', newRecord);
        finalRecord = newRecord;
      }
    }

    // STEP 6: RETURN SUCCESS RESPONSE
    console.log(`✅ === ${operationType} COMPLETED SUCCESSFULLY ===`);
    console.log('Final record:', finalRecord);
    
    return new Response(JSON.stringify({
      success: true,
      message: `Payment ${operationType.toLowerCase()} successfully`,
      operation: operationType,
      data: {
        id: finalRecord.id,
        order_id: finalRecord.order_id,
        email: finalRecord.email,
        user_id: finalRecord.user_id,
        is_paid: finalRecord.is_paid,
        payment_status: finalRecord.payment_status,
        amount: finalRecord.amount
      },
      user_linked: !!finalRecord.user_id,
      customer_email: customerEmail
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error('❌ === WEBHOOK ERROR ===');
    console.error('Error message:', error.message);
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