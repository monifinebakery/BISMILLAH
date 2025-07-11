import { createClient } from "npm:@supabase/supabase-js@2";

// Middleware for checking authentication
export const requireAuth = async (req: Request): Promise<{ user: any } | Response> => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );
    
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    
    return { user };
  } catch (error) {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

// Middleware for checking admin role
export const requireAdmin = async (req: Request): Promise<{ user: any } | Response> => {
  try {
    // First check authentication
    const authResult = await requireAuth(req);
    
    if (authResult instanceof Response) {
      return authResult;
    }
    
    const { user } = authResult;
    
    // Create Supabase client with admin privileges to check role
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );
    
    // Check if user has admin role
    const { data, error } = await supabase
      .from("user_settings")
      .select("role")
      .eq("user_id", user.id)
      .single();
    
    if (error || data?.role !== "admin") {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
    
    return { user };
  } catch (error) {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

// Middleware for checking payment status
export const requirePayment = async (req: Request): Promise<{ user: any } | Response> => {
  try {
    // First check authentication
    const authResult = await requireAuth(req);
    
    if (authResult instanceof Response) {
      return authResult;
    }
    
    const { user } = authResult;
    
    // Create Supabase client with admin privileges to check payment
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );
    
    // Check if user has paid
    const { data, error } = await supabase
      .from("user_payments")
      .select("is_paid")
      .eq("user_id", user.id)
      .single();
    
    if (error || !data?.is_paid) {
      return new Response(JSON.stringify({ error: "Payment required" }), {
        status: 402,
        headers: { "Content-Type": "application/json" },
      });
    }
    
    return { user };
  } catch (error) {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};