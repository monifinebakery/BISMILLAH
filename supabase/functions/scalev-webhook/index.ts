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
  console.log('🎯 PRIORITY: GET DATA INTO DATABASE WITH USER LINKING');
  
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

    // STEP 1: Ambil email APAPUN yang ada (improved extraction)
    let customerEmail = null; // ✅ Changed from fallback email
    
    console.log('🔍 HUNTING FOR CUSTOMER EMAIL...');
    
    // Method 1: Cari di semua level payload untuk email pattern
    function findEmailsInObject(obj, path = '') {
      if (typeof obj === 'string' && obj.includes('@') && obj.includes('.')) {
        console.log(`📧 Found email at ${path}: ${obj}`);
        return obj;
      }
      
      if (typeof obj === 'object' && obj !== null) {
        for (const [key, value] of Object.entries(obj)) {
          const foundEmail = findEmailsInObject(value, path ? `${path}.${key}` : key);
          if (foundEmail && 
              !foundEmail.includes('@scalev.') && 
              !foundEmail.includes('system@') &&
              !foundEmail.includes('unknown@') &&
              !foundEmail.includes('fallback@')) {
            return foundEmail;
          }
        }
      }
      
      return null;
    }
    
    // Cari email di seluruh payload
    const foundEmail = findEmailsInObject(payload);
    if (foundEmail) {
      customerEmail = foundEmail;
      console.log('✅ Found customer email:', customerEmail);
    }
    
    // Method 2: Check specific fields dengan prioritas yang benar
    const emailSources = [
      // ✅ PRIORITAS TINGGI: Customer/buyer emails
      payloadData.customer_email,
      payloadData.buyer_email,
      payloadData.payer_email,
      payloadData.user_email,
      payloadData.client_email,
      payload.customer_email,
      payload.email,
      payloadData.email,
      
      // ✅ MEDIUM PRIORITY: Nested customer info
      payloadData.customer_info?.email,
      payloadData.customer?.email,
      payloadData.buyer?.email,
      payloadData.payer?.email,
      payloadData.user?.email,
      payloadData.billing?.email,
      payloadData.contact?.email,
      
      // ⚠️ LOW PRIORITY: Bisa jadi system email
      payloadData.payment_account_holder,
      
      // Check payment history (last resort)
      ...(payloadData.payment_status_history || []).map(h => h.by?.email).filter(Boolean)
    ];
    
    console.log('📧 All email sources found (in priority order):', emailSources.filter(Boolean));
    
    // Take first valid email that's definitely a customer email
    for (const email of emailSources) {
      if (email && 
          email.includes('@') && 
          email.includes('.') &&
          !email.includes('@scalev.') &&
          !email.includes('system@') &&
          !email.includes('unknown@') &&
          !email.includes('fallback@') &&
          !email.includes('monifinebakery@') && // ✅ EXCLUDE MERCHANT EMAIL
          !email.includes('admin@') &&
          !email.includes('noreply@') &&
          !email.includes('support@')) {
        customerEmail = email;
        console.log('✅ Selected customer email from sources:', customerEmail);
        break;
      }
    }
    
    // ✅ If still no email, we cannot proceed
    if (!customerEmail) {
      console.log('❌ No valid customer email found, cannot create payment record');
      return new Response(JSON.stringify({
        success: false,
        error: 'No valid customer email found in payload',
        available_emails: emailSources.filter(Boolean)
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
    console.log('🎯 Final email to use:', customerEmail);

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

    // ✅ STEP 2.5: TRY TO FIND AND LINK USER_ID
    console.log('🔗 Attempting to find user_id for email:', customerEmail);

    let linkedUserId = null;

    try {
      // Try to find user by email in auth.users
      console.log('🔍 Looking up user in auth.users...');
      
      const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
      
      if (!authError && authData?.users) {
        const matchingUser = authData.users.find(user => 
          user.email?.toLowerCase() === customerEmail.toLowerCase()
        );
        
        if (matchingUser) {
          linkedUserId = matchingUser.id;
          console.log('✅ Found matching user:', { id: linkedUserId, email: matchingUser.email });
        } else {
          console.log('❌ No matching user found in auth.users');
          console.log('Available users:', authData.users.slice(0, 5).map(u => ({ id: u.id, email: u.email })));
        }
      } else {
        console.error('❌ Error fetching auth users:', authError);
      }
    } catch (userLookupError) {
      console.error('❌ Exception during user lookup:', userLookupError);
    }

    // STEP 3: Buat record dengan data lengkap termasuk user_id
    const insertData = {
      user_id: linkedUserId, // ✅ NOW WE INCLUDE USER_ID!
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

    console.log('💾 Preparing data with user_id:', insertData);

    // STEP 4: CHECK IF RECORD EXISTS FIRST (by order_id or pg_reference_id)
    console.log('🔍 Checking if record exists...');
    
    let existingRecord = null;
    
    // Try to find by order_id first
    if (insertData.order_id) {
      const { data: orderRecord, error: orderError } = await supabase
        .from('user_payments')
        .select('*')
        .eq('order_id', insertData.order_id)
        .maybeSingle();
      
      if (!orderError && orderRecord) {
        existingRecord = orderRecord;
        console.log('✅ Found existing record by order_id:', existingRecord.id);
      }
    }
    
    // If not found by order_id, try pg_reference_id
    if (!existingRecord && pgReferenceId) {
      const { data: refRecord, error: refError } = await supabase
        .from('user_payments')
        .select('*')
        .eq('pg_reference_id', pgReferenceId)
        .maybeSingle();
      
      if (!refError && refRecord) {
        existingRecord = refRecord;
        console.log('✅ Found existing record by pg_reference_id:', existingRecord.id);
      }
    }
    
    let finalRecord;
    let operationType;
    
    if (existingRecord) {
      // RECORD EXISTS - UPDATE IT
      console.log('✅ Record exists, UPDATING:', existingRecord.id);
      operationType = 'UPDATE';
      
      // Prepare update data
      const updateData = {
        ...insertData,
        updated_at: new Date().toISOString()
      };
      
      // ✅ Always try to link user_id if we found one and record doesn't have it
      if (linkedUserId && !existingRecord.user_id) {
        console.log('🔗 Linking user_id to existing record');
        updateData.user_id = linkedUserId;
      }
      
      // Keep original email if current email is system email and existing has real email
      if ((customerEmail.includes('monifinebakery@') || 
           customerEmail.includes('@scalev.') || 
           customerEmail.includes('system@')) &&
          existingRecord.email && 
          !existingRecord.email.includes('@scalev.') &&
          !existingRecord.email.includes('system@')) {
        updateData.email = existingRecord.email; // Keep original email
        console.log('📧 Keeping original email:', existingRecord.email);
      }
      
      // Update payment status and additional fields based on payload
      if (payloadData.payment_status === 'paid') {
        updateData.payment_status = 'settled';
        updateData.is_paid = true;
        updateData.payment_date = paidTime || new Date().toISOString();
        console.log('💰 Marking payment as paid/settled');
      }
      
      console.log('🔄 Updating with data:', updateData);
      
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
      console.log('➕ Record doesn\'t exist, INSERTING new record');
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

    // ✅ STEP 5: POST-PROCESS - Try to link user_id if still not linked
    if (finalRecord && !finalRecord.user_id && finalRecord.email && !linkedUserId) {
      console.log('🔗 Post-processing: Attempting late user linking...');
      
      try {
        // Try again to find user (maybe user was just created)
        const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
        
        if (!authError && authData?.users) {
          const matchingUser = authData.users.find(user => 
            user.email?.toLowerCase() === finalRecord.email.toLowerCase()
          );
          
          if (matchingUser) {
            console.log('✅ Found user for post-linking:', matchingUser.id);
            
            // Update the record with user_id
            const { data: linkedRecord, error: linkError } = await supabase
              .from('user_payments')
              .update({ 
                user_id: matchingUser.id,
                updated_at: new Date().toISOString()
              })
              .eq('id', finalRecord.id)
              .select()
              .single();
            
            if (!linkError) {
              console.log('✅ Successfully post-linked user to payment');
              finalRecord = linkedRecord; // Update the final record
            } else {
              console.error('❌ Failed to post-link user:', linkError);
            }
          } else {
            console.log('❌ Still no matching user found for email:', finalRecord.email);
          }
        }
      } catch (linkingError) {
        console.error('❌ Error during post-processing linking:', linkingError);
      }
    }

    // STEP 6: RETURN SUCCESS RESPONSE
    console.log(`✅ ${operationType} SUCCESS:`, finalRecord);
    
    return new Response(JSON.stringify({
      success: true,
      message: `Payment ${operationType.toLowerCase()} successfully`,
      operation: operationType,
      data: finalRecord,
      user_linked: !!finalRecord.user_id,
      email: finalRecord.email
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error('❌ WEBHOOK ERROR:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Webhook processing failed',
      details: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
};

serve(handler);