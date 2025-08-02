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
  console.log('🎯 PRIORITY: GET DATA INTO DATABASE');
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log('📦 Received payload:', JSON.stringify(payload, null, 2));

    // STEP 1: Ambil email APAPUN yang ada (improved extraction)
    let customerEmail = 'unknown@customer.com'; // default fallback
    
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
              !foundEmail.includes('unknown@')) {
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
    } else {
      console.log('❌ No customer email found, using fallback');
    }
    
    // Method 2: Check specific fields
    const emailSources = [
      payload.customer_email,
      payload.email,
      payload.data?.customer_email,
      payload.data?.email,
      payload.data?.payment_account_holder,
      // Check all payment history entries
      ...(payload.data?.payment_status_history || []).map(h => h.by?.email).filter(Boolean)
    ];
    
    console.log('📧 All email sources found:', emailSources);
    
    // Take first valid email that's not system email
    for (const email of emailSources) {
      if (email && 
          email.includes('@') && 
          email.includes('.') &&
          !email.includes('@scalev.') &&
          !email.includes('system@') &&
          !email.includes('unknown@')) {
        customerEmail = email;
        console.log('✅ Selected email from sources:', customerEmail);
        break;
      }
    }
    
    console.log('🎯 Final email to use:', customerEmail);

    // STEP 2: Buat record MINIMAL (hanya kolom required)
    const insertData = {
      email: customerEmail,
      order_id: payload.data?.order_id || `AUTO_${Date.now()}`,
      payment_status: 'pending',
      is_paid: false,
      amount: payload.data?.amount || 0,
      currency: payload.data?.currency || 'IDR',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('💾 Preparing data:', insertData);

    // STEP 3: CHECK IF RECORD EXISTS FIRST (by order_id)
    console.log('🔍 Checking if record exists for order_id:', insertData.order_id);
    
    const { data: existingRecord, error: checkError } = await supabase
      .from('user_payments')
      .select('*')
      .eq('order_id', insertData.order_id)
      .maybeSingle();
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error checking existing record:', checkError);
    }
    
    let finalRecord;
    let operationType;
    
    if (existingRecord) {
      // RECORD EXISTS - UPDATE IT
      console.log('✅ Record exists, UPDATING:', existingRecord.id);
      operationType = 'UPDATE';
      
      // Keep original email if current email is admin email
      const emailToUse = customerEmail.includes('monifinebakery@') || 
                        customerEmail.includes('@scalev.') || 
                        customerEmail.includes('system@') ?
                        existingRecord.email : // Keep original email
                        customerEmail; // Use new email if it's customer email
      
      const updateData = {
        ...insertData,
        email: emailToUse,
        updated_at: new Date().toISOString()
      };
      
      // Set payment status based on payload
      if (payload.data?.payment_status === 'paid') {
        updateData.payment_status = 'settled';
        updateData.is_paid = true;
        updateData.payment_date = new Date().toISOString();
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
        finalRecord = null;
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
        finalRecord = null;
      } else {
        console.log('✅ INSERT SUCCESS:', newRecord);
        finalRecord = newRecord;
      }
    }

    // STEP 4: HANDLE RESULT
    if (!finalRecord) {
      console.error('❌ OPERATION FAILED');
      
      // Coba insert dengan data yang lebih minimal lagi
      console.log('🔄 Trying super minimal insert...');
      
      const superMinimalData = {
        email: customerEmail.includes('monifinebakery@') ? 'fallback@customer.com' : customerEmail,
        order_id: `MINIMAL_${Date.now()}`,
        payment_status: 'pending',
        is_paid: false
      };
      
      const { data: minimalRecord, error: minimalError } = await supabase
        .from('user_payments')
        .insert(superMinimalData)
        .select()
        .single();
        
      if (minimalError) {
        console.error('❌ EVEN MINIMAL INSERT FAILED:', minimalError);
        return new Response(JSON.stringify({
          success: false,
          error: 'Could not insert any data',
          details: minimalError
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      } else {
        console.log('✅ MINIMAL INSERT SUCCESS:', minimalRecord);
        return new Response(JSON.stringify({
          success: true,
          message: 'Minimal data inserted successfully',
          operation: 'MINIMAL_INSERT',
          data: minimalRecord
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      
    } else {
      console.log(`✅ ${operationType} SUCCESS:`, finalRecord);
      
      return new Response(JSON.stringify({
        success: true,
        message: `Data ${operationType.toLowerCase()} successfully`,
        operation: operationType,
        data: finalRecord
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

  } catch (error) {
    console.error('❌ WEBHOOK ERROR:', error);
    
    // Bahkan kalau ada error, coba insert emergency record
    try {
      console.log('🚨 EMERGENCY INSERT...');
      
      const emergencyData = {
        email: 'emergency@webhook.failed',
        order_id: `EMERGENCY_${Date.now()}`,
        payment_status: 'pending',
        is_paid: false
      };
      
      const { data: emergencyRecord } = await supabase
        .from('user_payments')
        .insert(emergencyData)
        .select()
        .single();
        
      console.log('🚨 EMERGENCY RECORD CREATED:', emergencyRecord);
      
    } catch (emergencyError) {
      console.error('🚨 EVEN EMERGENCY FAILED:', emergencyError);
    }
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Webhook processing failed',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
};

serve(handler);