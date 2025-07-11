import { createClient } from "npm:@supabase/supabase-js@2";

// Fungsi helper untuk membuat respons JSON error
const errorResponse = (message: string, status: number) => {
  return new Response(JSON.stringify({ error: message }), {
    status: status,
    headers: { "Content-Type": "application/json" },
  });
};

// Fungsi untuk menginisialisasi klien Supabase dengan Service Role Key
// Ini akan digunakan di semua middleware yang memerlukan akses penuh
const getSupabaseServiceRoleClient = () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('ERROR: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not defined for middleware.');
    throw new Error('Missing Supabase URL or Service Role Key.');
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
};

// Middleware for checking authentication
export const requireAuth = async (req: Request): Promise<{ user: any } | Response> => {
  try {
    // Gunakan klien dengan Service Role Key untuk verifikasi token
    const supabase = getSupabaseServiceRoleClient();
    
    // Ambil token dari Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return errorResponse("Unauthorized: Missing or invalid Authorization header.", 401);
    }
    const token = authHeader.split(" ")[1];

    // Verifikasi token. getUser() akan bekerja dengan service_role_key
    // dan akan mengembalikan user jika token valid.
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      console.error('Authentication error in requireAuth:', error?.message || 'User not found.');
      return errorResponse("Unauthorized: Invalid token.", 401);
    }
    
    return { user };
  } catch (error) {
    console.error("Internal server error in requireAuth:", error);
    return errorResponse("Internal server error during authentication.", 500);
  }
};

// Middleware for checking admin role
export const requireAdmin = async (req: Request): Promise<{ user: any } | Response> => {
  try {
    // Pertama cek authentication
    const authResult = await requireAuth(req);
    
    if (authResult instanceof Response) {
      return authResult;
    }
    
    const { user } = authResult;
    
    // REKOMENDASI: Cek peran admin langsung dari app_metadata di JWT
    // Ini lebih cepat dan tidak memerlukan kueri database tambahan.
    const userRole = user.app_metadata?.role;
    
    if (userRole !== 'admin') {
      console.warn(`Forbidden: User ${user.id} (role: ${userRole}) attempted admin access.`);
      return errorResponse('Forbidden: Admin access required.', 403);
    }
    
    // ALTERNATIF (Jika peran admin MUTLAK HANYA disimpan di user_settings dan perlu dikueri):
    // Gunakan klien dengan Service Role Key untuk mengkueri user_settings
    /*
    const supabase = getSupabaseServiceRoleClient();
    const { data, error } = await supabase
      .from("user_settings")
      .select("role")
      .eq("user_id", user.id)
      .single();
    
    if (error || data?.role !== "admin") {
      console.warn(`Forbidden: User ${user.id} (role: ${data?.role}) attempted admin access. Error: ${error?.message}`);
      return errorResponse('Forbidden: Admin access required.', 403);
    }
    */
    
    return { user };
  } catch (error) {
    console.error("Internal server error in requireAdmin:", error);
    return errorResponse("Internal server error during admin check.", 500);
  }
};

// Middleware for checking payment status
export const requirePayment = async (req: Request): Promise<{ user: any } | Response> => {
  try {
    // Pertama cek authentication
    const authResult = await requireAuth(req);
    
    if (authResult instanceof Response) {
      return authResult;
    }
    
    const { user } = authResult;
    
    // REKOMENDASI: Cek status pembayaran dari user_metadata atau app_metadata di JWT
    // Jika 'is_paid' adalah data yang dapat dipercaya di JWT, ini adalah cara tercepat.
    const isPaidInMetadata = user.user_metadata?.is_paid; // Atau app_metadata?.is_paid
    
    if (!isPaidInMetadata) {
      console.warn(`Payment Required: User ${user.id} has no payment status in metadata.`);
      return errorResponse('Payment required: Please complete your payment.', 402);
    }

    // ALTERNATIF (Jika status pembayaran MUTLAK HANYA disimpan di user_payments dan perlu dikueri):
    // Gunakan klien dengan Service Role Key untuk mengkueri user_payments
    /*
    const supabase = getSupabaseServiceRoleClient();
    const { data, error } = await supabase
      .from("user_payments")
      .select("is_paid")
      .eq("user_id", user.id)
      .single();
    
    if (error || !data?.is_paid) {
      console.warn(`Payment Required: User ${user.id} has no valid payment. Error: ${error?.message}`);
      return errorResponse('Payment required: Please complete your payment.', 402);
    }
    */
    
    return { user };
  } catch (error) {
    console.error("Internal server error in requirePayment:", error);
    return errorResponse("Internal server error during payment check.", 500);
  }
};