import { supabase } from '@/integrations/supabase/client';

// Middleware for checking authentication
export const requireAuth = async (req: Request): Promise<{ user: any } | Response> => {
  try {
    // Get the token from the Authorization header
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify the token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return { user };
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
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
    
    // Check if user has admin role
    const { data, error } = await supabase
      .from('user_settings')
      .select('role')
      .eq('user_id', user.id)
      .single();
    
    if (error || data?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return { user };
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Middleware for checking payment status
export const requirePayment = async (req: Request): Promise<{ user: any } | Response> => {
  try {
    // ✅ Development bypass logic
    const isDev = import.meta.env.MODE === 'development';
    const bypassAuth = isDev && import.meta.env.VITE_DEV_BYPASS_AUTH === 'true';
    
    if (bypassAuth) {
      console.log('[API Middleware] Development bypass active - skipping payment check');
      return { user: { id: 'dev-user', email: 'dev@example.com' } };
    }
    
    // First check authentication
    const authResult = await requireAuth(req);
    
    if (authResult instanceof Response) {
      return authResult;
    }
    
    const { user } = authResult;
    
    // Check if user has paid
    const { data, error } = await supabase
      .from('user_payments')
      .select('is_paid')
      .eq('user_id', user.id)
      .single();
    
    if (error || !data?.is_paid) {
      return new Response(JSON.stringify({ error: 'Payment required' }), {
        status: 402,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return { user };
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};