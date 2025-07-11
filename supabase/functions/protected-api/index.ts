import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { requireAuth, requirePayment } from "../_shared/middleware.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.split("/").pop();
    
    // Determine which middleware to use based on the path
    let authResult;
    
    if (path === "premium-data") {
      // This endpoint requires payment
      authResult = await requirePayment(req);
    } else {
      // This endpoint only requires authentication
      authResult = await requireAuth(req);
    }
    
    if (authResult instanceof Response) {
      return authResult;
    }
    
    const { user } = authResult;
    
    // Create Supabase client with user's context
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );
    
    // Handle different endpoints
    if (path === "user-data") {
      // Get user's data (requires only authentication)
      const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();
      
      if (error) throw error;
      
      return new Response(JSON.stringify({ data }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    if (path === "premium-data") {
      // Get premium data (requires payment)
      // This could be any premium feature data
      const { data: recipes, error: recipesError } = await supabase
        .from("hpp_recipes")
        .select("*")
        .eq("user_id", user.id);
      
      if (recipesError) throw recipesError;
      
      return new Response(JSON.stringify({ data: recipes }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // Default response for unhandled routes
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
    
  } catch (error) {
    console.error("Error in protected-api:", error);
    
    return new Response(JSON.stringify({ error: error.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});