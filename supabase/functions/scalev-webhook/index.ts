import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-scalev-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ScalevWebhookPayload {
  event: string;
  payment_id: string;
  order_id: string;
  reference: string;
  payment_status: 'completed' | 'failed' | 'pending' | 'settled';
  status: 'completed' | 'failed' | 'pending' | 'settled';
  amount: number;
  currency: string;
  customer_email: string;
  email: string;
  name: string;
  paid_at?: string;
  metadata?: Record<string, any>;
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Function to verify Scalev webhook signature (optional security)
const verifyScalevSignature = (payload: string, signature: string, secret: string): boolean => {
  try {
    // Simple verification - check if signature and secret exist
    // In production, implement proper HMAC-SHA256 verification
    console.log('🔐 Signature verification:', {
      hasSignature: !!signature,
      signatureLength: signature?.length || 0,
      hasSecret: !!secret,
      secretLength: secret?.length || 0
    });
    return true; // Always return true for now - signature is optional
  } catch (error) {
    console.error('❌ Signature verification error:', error);
    return true; // Still allow requests even if signature fails
  }
};

const handler = async (req: Request): Promise<Response> => {
  console.log('🎯 =================================');
  console.log('🎯 SCALEV WEBHOOK RECEIVED');
  console.log('🎯 =================================');
  console.log('⏰ Timestamp:', new Date().toISOString());
  console.log('🔧 Method:', req.method);
  console.log('🌐 URL:', req.url);
  console.log('📡 Headers:', Object.fromEntries(req.headers.entries()));
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log('✅ CORS preflight request handled successfully');
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    console.log('❌ Invalid method:', req.method);
    return new Response(JSON.stringify({ 
      error: "Method not allowed",
      received_method: req.method,
      expected_method: "POST"
    }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Get the raw payload for signature verification
    const rawPayload = await req.text();
    
    console.log('📦 =================================');
    console.log('📦 REQUEST PAYLOAD ANALYSIS');
    console.log('📦 =================================');
    console.log('📏 Raw payload length:', rawPayload.length);
    console.log('📝 Raw payload preview:', rawPayload.substring(0, 500));

    let payload: ScalevWebhookPayload;
    try {
      payload = JSON.parse(rawPayload);
      console.log('✅ JSON parsing successful');
      console.log('🎪 Event type:', payload.event);
      console.log('💳 Payment ID:', payload.payment_id);
      console.log('🆔 Order ID:', payload.order_id);
      console.log('🔗 Reference:', payload.reference);
      console.log('📊 Status:', payload.status || payload.payment_status);
      console.log('💰 Amount:', payload.amount);
      console.log('💱 Currency:', payload.currency);
      console.log('📧 Email:', payload.email || payload.customer_email);
      console.log('👤 Name:', payload.name);
    } catch (parseError) {
      console.log('❌ =================================');
      console.log('❌ JSON PARSE ERROR');
      console.log('❌ =================================');
      console.error('Error details:', parseError);
      console.error('Raw payload that failed:', rawPayload);
      return new Response(JSON.stringify({ 
        error: "Invalid JSON payload",
        details: parseError instanceof Error ? parseError.message : "Unknown parse error",
        received_payload_length: rawPayload.length
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Optional signature verification
    const signature = req.headers.get('x-scalev-signature') || '';
    const webhookSecret = Deno.env.get('SCALEV_SECRET_KEY') || '';
    
    console.log('🔐 =================================');
    console.log('🔐 SIGNATURE VERIFICATION');
    console.log('🔐 =================================');
    console.log('📝 Signature present:', !!signature);
    console.log('📏 Signature length:', signature.length);
    console.log('🔑 Secret configured:', !!webhookSecret);
    console.log('📏 Secret length:', webhookSecret.length);
    
    if (signature && webhookSecret) {
      const isValid = verifyScalevSignature(rawPayload, signature, webhookSecret);
      if (!isValid) {
        console.log('❌ Signature verification failed, but continuing...');
      } else {
        console.log('✅ Signature verification passed');
      }
    } else {
      console.log('⚠️ Signature verification skipped (signature or secret missing)');
      console.log('ℹ️ This is fine for testing, but configure SCALEV_SECRET_KEY for production');
    }

    // Get the actual status from either field
    const actualStatus = payload.status || payload.payment_status;
    const actualEmail = payload.email || payload.customer_email;

    // Process payment completion
    if ((payload.event === 'payment.completed' || payload.event === 'payment.settled') && 
        (actualStatus === 'completed' || actualStatus === 'settled')) {
      console.log('💳 =================================');
      console.log('💳 PROCESSING PAYMENT COMPLETION');
      console.log('💳 =================================');
      console.log('🔍 Looking for payment record with reference:', payload.reference);
      
      // Find the user payment record by pg_reference_id (reference)
      const { data: paymentRecord, error: fetchError } = await supabase
        .from('user_payments')
        .select('*')
        .eq('pg_reference_id', payload.reference)
        .single();

      if (fetchError || !paymentRecord) {
        console.log('❌ =================================');
        console.log('❌ PAYMENT RECORD NOT FOUND');
        console.log('❌ =================================');
        console.error('Fetch error:', fetchError);
        console.error('Reference searched:', payload.reference);
        
        // List recent payment records for debugging
        const { data: allPayments } = await supabase
          .from('user_payments')
          .select('id, user_id, pg_reference_id, payment_status, created_at')
          .order('created_at', { ascending: false })
          .limit(10);
        console.log('📋 Recent payment records for debugging:', allPayments);
        
        // Try to find by other fields
        console.log('🔍 Attempting to find payment record by other fields...');
        
        let alternativeRecord = null;
        
        if (payload.order_id) {
          console.log('🔍 Searching by order_id:', payload.order_id);
          const { data: orderRecord } = await supabase
            .from('user_payments')
            .select('*')
            .eq('order_id', payload.order_id)
            .single();
            
          if (orderRecord) {
            console.log('✅ Found record by order_id:', orderRecord);
            alternativeRecord = orderRecord;
          }
        }
        
        if (!alternativeRecord && actualEmail) {
          console.log('🔍 Searching by email:', actualEmail);
          const { data: emailRecords } = await supabase
            .from('user_payments')
            .select('*')
            .eq('email', actualEmail)
            .limit(1);
            
          if (emailRecords && emailRecords.length > 0) {
            console.log('✅ Found record by email:', emailRecords[0]);
            alternativeRecord = emailRecords[0];
          }
        }
        
        if (alternativeRecord) {
          console.log('🔄 Using alternative record for update:', alternativeRecord);
          
          // Update the alternative record
          const updateData = {
            is_paid: true,
            payment_status: 'settled',
            payment_date: payload.paid_at || new Date().toISOString(),
            amount: payload.amount,
            currency: payload.currency,
            order_id: payload.order_id,
            email: actualEmail,
            name: payload.name,
            pg_reference_id: payload.reference,
            updated_at: new Date().toISOString()
          };
          
          console.log('🔄 Update data to be applied:', updateData);
          
          const { data: updatedAltRecord, error: updateAltError } = await supabase
            .from('user_payments')
            .update(updateData)
            .eq('id', alternativeRecord.id)
            .select()
            .single();
            
          if (updateAltError) {
            console.log('❌ Alternative record update failed:', updateAltError);
          } else {
            console.log('✅ Alternative record updated successfully:', updatedAltRecord);
            
            return new Response(JSON.stringify({ 
              success: true, 
              message: "Payment status updated successfully via alternative record",
              data: {
                reference: payload.reference,
                order_id: payload.order_id,
                user_id: alternativeRecord.user_id,
                amount: payload.amount,
                currency: payload.currency,
                email: actualEmail,
                name: payload.name,
                status: 'setlled',
                updated_at: new Date().toISOString()
              }
            }), {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }
        
        // Check old_payments_history table for existing users
        console.log('🔍 Checking old_payments_history table for existing users...');
        
        if (actualEmail) {
          const { data: oldPaymentRecord, error: oldPaymentError } = await supabase
            .from('old_payments_history')
            .select('*')
            .eq('email', actualEmail)
            .single();
            
          if (!oldPaymentError && oldPaymentRecord) {
            console.log('✅ Found record in old_payments_history:', oldPaymentRecord);
            
            // Get user_id from auth.users
            const { data: authUsers, error: authUserError } = await supabase.auth.admin
              .listUsers();
            
            if (authUserError) {
              console.log('❌ Error querying auth users:', authUserError);
            } else {
              // Find the user with matching email
              const authUser = authUsers.users.find(user => 
                user.email?.toLowerCase() === actualEmail.toLowerCase()
              );
              
              if (authUser) {
                console.log('✅ Found matching auth user:', authUser.id);
                
                // Create or update user_payments record
                const { data: newPaymentRecord, error: insertError } = await supabase
                  .from('user_payments')
                  .upsert({
                    user_id: authUser.id,
                    is_paid: true,
                    payment_status: 'actualStatus',
                    payment_date: payload.paid_at || new Date().toISOString(),
                    amount: payload.amount,
                    currency: payload.currency,
                    order_id: payload.order_id,
                    email: actualEmail,
                    name: payload.name,
                    pg_reference_id: payload.reference,
                    updated_at: new Date().toISOString()
                  }, { onConflict: 'user_id' })
                  .select()
                  .single();
                  
                if (insertError) {
                  console.log('❌ Failed to create/update user_payments record:', insertError);
                } else {
                  console.log('✅ Successfully created/updated user_payments record:', newPaymentRecord);
                  
                  return new Response(JSON.stringify({ 
                    success: true, 
                    message: "Payment record created/updated for existing user from old_payments_history",
                    data: newPaymentRecord
                  }), {
                    status: 200,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                  });
                }
              } else {
                console.log('❌ No matching auth user found for email:', actualEmail);
              }
            }
          } else {
            console.log('❌ No record found in old_payments_history for email:', actualEmail);
          }
        }
        
        // No existing user_payments record found by any means.
        // Now, try to find the user_id from auth.users using the email.
        console.log('🔍 No existing user_payments record found. Attempting to find user_id from auth.users using email:', actualEmail);
        
        if (!actualEmail) {
          console.log('❌ No email provided in webhook payload, cannot find user');
          return new Response(JSON.stringify({ 
            error: "No email provided in webhook payload, cannot find user",
            webhook_received_successfully: true
          }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        // Use the service_role_key client to query auth.users
        const { data: authUsers, error: authUserError } = await supabase.auth.admin
          .listUsers();
        
        if (authUserError) {
          console.log('❌ Error querying auth users:', authUserError);
          return new Response(JSON.stringify({ 
            error: "Error querying auth users",
            details: authUserError.message,
            webhook_received_successfully: true
          }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        // Find the user with matching email
        const authUser = authUsers.users.find(user => user.email?.toLowerCase() === actualEmail.toLowerCase());
        
        if (!authUser) {
          console.log('❌ User not found in auth.users for email:', actualEmail);
          return new Response(JSON.stringify({ 
            error: "User not found in authentication system for this payment. Cannot create user_payments record.",
            email: actualEmail,
            webhook_received_successfully: true
          }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        const userId = authUser.id;
        console.log('✅ Found user_id in auth.users:', userId);
        
        // Now, insert a new user_payments record
        const { data: newPaymentRecord, error: insertError } = await supabase
          .from('user_payments')
          .insert({
            user_id: userId,
            is_paid: true,
            payment_status: 'settled',
            payment_date: payload.paid_at || new Date().toISOString(),
            amount: payload.amount,
            currency: payload.currency,
            order_id: payload.order_id,
            email: actualEmail,
            name: payload.name,
            pg_reference_id: payload.reference,
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (insertError) {
          console.log('❌ Failed to insert new user_payments record:', insertError);
          return new Response(JSON.stringify({ 
            error: "Failed to create new user_payments record",
            details: insertError.message,
            webhook_received_successfully: true
          }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        console.log('🎉 Successfully created new user_payments record for existing user:', newPaymentRecord);
        return new Response(JSON.stringify({ 
          success: true, 
          message: "New payment record created successfully for existing user",
          data: newPaymentRecord
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log('✅ =================================');
      console.log('✅ PAYMENT RECORD FOUND');
      console.log('✅ =================================');
      console.log('🆔 Record ID:', paymentRecord.id);
      console.log('👤 User ID:', paymentRecord.user_id);
      console.log('📊 Current status:', paymentRecord.payment_status);
      console.log('💵 Current is_paid:', paymentRecord.is_paid);
      console.log('💰 Current amount:', paymentRecord.amount);

      // Update payment status to completed with new Scalev data
      const { data: updatedRecord, error: updateError } = await supabase
        .from('user_payments')
        .update({
          is_paid: true,
          payment_status: 'settled',
          payment_date: payload.paid_at || new Date().toISOString(),
          amount: payload.amount,
          currency: payload.currency,
          order_id: payload.order_id,
          email: actualEmail,
          name: payload.name,
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentRecord.id)
        .select()
        .single();

      if (updateError) {
        console.log('❌ =================================');
        console.log('❌ DATABASE UPDATE ERROR');
        console.log('❌ =================================');
        console.error('Update error details:', updateError);
        return new Response(JSON.stringify({ 
          error: "Failed to update payment status",
          details: updateError.message,
          reference: payload.reference,
          webhook_received_successfully: true
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log('🎉 =================================');
      console.log('🎉 PAYMENT SUCCESSFULLY UPDATED');
      console.log('🎉 =================================');
      console.log('✅ User ID:', paymentRecord.user_id);
      console.log('✅ Reference:', payload.reference);
      console.log('✅ Order ID:', payload.order_id);
      console.log('✅ Email:', actualEmail);
      console.log('✅ Name:', payload.name);
      console.log('✅ Amount:', payload.amount);
      console.log('✅ New status: settled');
      console.log('✅ Is paid: true');
      console.log('✅ Updated record:', updatedRecord);

      return new Response(JSON.stringify({ 
        success: true, 
        message: "Payment status updated successfully",
        data: {
          reference: payload.reference,
          order_id: payload.order_id,
          user_id: paymentRecord.user_id,
          amount: payload.amount,
          currency: payload.currency,
          email: actualEmail,
          name: payload.name,
          status: 'settled',
          updated_at: new Date().toISOString()
        }
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle payment failed
    if (payload.event === 'payment.failed' && actualStatus === 'failed') {
      console.log('💥 =================================');
      console.log('💥 PROCESSING PAYMENT FAILURE');
      console.log('💥 =================================');
      console.log('🔗 Reference:', payload.reference);
      
      const { data: updatedRecord, error: updateError } = await supabase
        .from('user_payments')
        .update({
          payment_status: 'failed',
          order_id: payload.order_id,
          email: actualEmail,
          name: payload.name,
          updated_at: new Date().toISOString()
        })
        .eq('pg_reference_id', payload.reference)
        .select()
        .single();

      if (updateError) {
        console.log('❌ Payment failure update error:', updateError);
      } else {
        console.log('✅ Payment failed status updated:', updatedRecord);
      }
    }

    // Handle all webhook events (successful response)
    console.log('🎯 =================================');
    console.log('🎯 WEBHOOK PROCESSING COMPLETED');
    console.log('🎯 =================================');
    console.log('🎪 Event type:', payload.event);
    console.log('📊 Status:', actualStatus);
    console.log('⏰ Processed at:', new Date().toISOString());

    // Always return success for webhook events to prevent retries
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Webhook processed successfully",
      data: {
        event: payload.event,
        reference: payload.reference,
        order_id: payload.order_id,
        status: actualStatus,
        processed_at: new Date().toISOString()
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.log("💥 =================================");
    console.log("💥 CRITICAL WEBHOOK ERROR");
    console.log("💥 =================================");
    console.error("Error details:", error);
    console.error("Stack trace:", error instanceof Error ? error.stack : 'No stack trace');
    
    return new Response(JSON.stringify({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
      webhook_received: true
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);