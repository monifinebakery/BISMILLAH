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
