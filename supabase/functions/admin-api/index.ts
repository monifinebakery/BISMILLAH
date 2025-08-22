import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { requireAdmin } from "../_shared/middleware.ts";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS"
};
serve(async (req)=>{
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
  }
  try {
    // Check if user is admin
    const authResult = await requireAdmin(req);
    if (authResult instanceof Response) {
      return authResult;
    }
    const { user } = authResult;
    // Create Supabase client with admin privileges
    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
    const url = new URL(req.url);
    const path = url.pathname.split("/").pop();
    // Handle different admin endpoints
    if (req.method === "GET") {
      if (path === "users") {
        // Get all users with their payment status
        const { data, error } = await supabase.from("user_settings").select(`
            *,
            user_payments(*)
          `);
        if (error) throw error;
        return new Response(JSON.stringify({
          data
        }), {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        });
      }
      if (path === "payments") {
        // Get all payments
        const { data, error } = await supabase.from("user_payments").select("*").order("created_at", {
          ascending: false
        });
        if (error) throw error;
        return new Response(JSON.stringify({
          data
        }), {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        });
      }
      if (path === "stats") {
        // Get dashboard stats
        const [usersResult, paymentsResult, totalPaidResult] = await Promise.all([
          supabase.from("user_settings").select("*", {
            count: "exact"
          }),
          supabase.from("user_payments").select("*", {
            count: "exact"
          }),
          supabase.from("user_payments").select("amount").eq("is_paid", true)
        ]);
        const totalRevenue = totalPaidResult.data?.reduce((sum, payment)=>sum + (parseFloat(payment.amount) || 0), 0) || 0;
        const stats = {
          totalUsers: usersResult.count || 0,
          totalPayments: paymentsResult.count || 0,
          paidUsers: totalPaidResult.data?.length || 0,
          totalRevenue
        };
        return new Response(JSON.stringify({
          data: stats
        }), {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        });
      }

      if (path === "fix-applied-at") {
        // Fix applied_at field issue
        console.log('🔧 Starting applied_at field database cleanup...');
        
        // Test a simple update operation first to see the current error
        const { data: testPurchases } = await supabase
          .from('purchases')
          .select('id, status, user_id')
          .limit(1);

        let testResult = null;
        if (testPurchases && testPurchases.length > 0) {
          const testPurchase = testPurchases[0];
          const { error: testError } = await supabase
            .from('purchases')
            .update({ status: testPurchase.status })
            .eq('id', testPurchase.id)
            .eq('user_id', testPurchase.user_id);

          testResult = {
            success: !testError,
            error: testError?.message || null,
            stillHasAppliedAtIssue: testError?.message?.includes('applied_at') || false
          };
        }

        // Check if applied_at column still exists
        const { data: columns, error: columnsError } = await supabase
          .from('information_schema.columns')
          .select('column_name')
          .eq('table_name', 'purchases')
          .eq('column_name', 'applied_at');

        const hasAppliedAt = columns && columns.length > 0;
        console.log(`Applied_at column exists: ${hasAppliedAt}`);

        // Try to execute a direct column drop if it exists
        let dropResult = null;
        if (hasAppliedAt) {
          try {
            const { error: dropError } = await supabase.sql`
              ALTER TABLE purchases DROP COLUMN IF EXISTS applied_at CASCADE;
            `;
            dropResult = {
              success: !dropError,
              error: dropError?.message || null
            };
          } catch (err) {
            dropResult = {
              success: false,
              error: String(err)
            };
          }
        }

        const response = {
          success: true,
          message: 'Database cleanup check completed',
          appliedAtColumnExists: hasAppliedAt,
          testUpdate: testResult,
          dropColumnResult: dropResult,
          timestamp: new Date().toISOString()
        };

        console.log('🎉 Cleanup check completed:', response);

        return new Response(JSON.stringify({ data: response }), {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        });
      }
    }
    if (req.method === "PUT" && path === "payment-status") {
      // Update payment status
      const { paymentId, isPaid } = await req.json();
      if (!paymentId) {
        return new Response(JSON.stringify({
          error: "Payment ID is required"
        }), {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        });
      }
      const { data, error } = await supabase.from("user_payments").update({
        is_paid: isPaid
      }).eq("id", paymentId).select().single();
      if (error) throw error;
      return new Response(JSON.stringify({
        data
      }), {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    // Default response for unhandled routes
    return new Response(JSON.stringify({
      error: "Not found"
    }), {
      status: 404,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error("Error in admin-api:", error);
    return new Response(JSON.stringify({
      error: error.message || "Internal server error"
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});
