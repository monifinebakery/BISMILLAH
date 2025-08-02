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

    console.log('💾 Inserting minimal data:', insertData);

    // STEP 3: INSERT PAKSA ke database
    const { data: newRecord, error: insertError } = await supabase
      .from('user_payments')
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      console.error('❌ INSERT FAILED:', insertError);
      
      // Coba insert dengan data yang lebih minimal lagi
      console.log('🔄 Trying super minimal insert...');
      
      const superMinimalData = {
        email: customerEmail,
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
          data: minimalRecord
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      
    } else {
      console.log('✅ FULL INSERT SUCCESS:', newRecord);
      
      // Update dengan data tambahan jika ada
      if (payload.data?.payment_status === 'paid') {
        console.log('🔄 Updating to paid status...');
        
        const { data: updatedRecord, error: updateError } = await supabase
          .from('user_payments')
          .update({
            payment_status: 'settled',
            is_paid: true,
            payment_date: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', newRecord.id)
          .select()
          .single();
          
        if (updateError) {
          console.error('⚠️ Update failed but insert succeeded:', updateError);
        } else {
          console.log('✅ UPDATE TO PAID SUCCESS:', updatedRecord);
        }
      }
      
      return new Response(JSON.stringify({
        success: true,
        message: 'Data inserted successfully',
        data: newRecord
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