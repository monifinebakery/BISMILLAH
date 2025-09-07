// Centralized Supabase client with lazy loading
// This helps reduce bundle size by lazy loading Supabase only when needed

let supabaseClient: any = null;
let supabasePromise: Promise<any> | null = null;

/**
 * Get Supabase client instance with lazy loading
 * This prevents Supabase from being included in the main bundle
 */
export const getSupabaseClient = async () => {
  if (supabaseClient) {
    return supabaseClient;
  }

  if (supabasePromise) {
    return supabasePromise;
  }

  supabasePromise = (async () => {
    try {
      // Dynamic import Supabase
      const { createClient } = await import('@supabase/supabase-js');
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Missing Supabase environment variables');
      }

      supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
      return supabaseClient;
    } catch (error) {
      console.error('Failed to initialize Supabase client:', error);
      throw error;
    }
  })();

  return supabasePromise;
};

/**
 * Synchronous access to Supabase client (for backwards compatibility)
 * Use only after getSupabaseClient() has been called at least once
 */
export const supabase = new Proxy({} as any, {
  get(target, prop) {
    if (!supabaseClient) {
      throw new Error('Supabase client not initialized. Call getSupabaseClient() first.');
    }
    return supabaseClient[prop];
  }
});

/**
 * Preload Supabase client for critical paths
 */
export const preloadSupabaseClient = () => {
  if (!supabaseClient && !supabasePromise) {
    getSupabaseClient();
  }
};
