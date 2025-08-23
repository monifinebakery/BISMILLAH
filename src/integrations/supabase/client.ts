// Enhanced Supabase client with JWT token refresh handling
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { logger } from "@/utils/logger";

// Get environment variables (trim biar aman)
const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || "").trim();
const SUPABASE_PUBLISHABLE_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();

// Debug log hanya di DEV
if (import.meta.env.DEV) {
  console.log("🔥 Supabase Client Debug:", {
    VITE_SUPABASE_URL: SUPABASE_URL ? "PRESENT" : "MISSING",
    VITE_SUPABASE_ANON_KEY: SUPABASE_PUBLISHABLE_KEY ? "PRESENT" : "MISSING",
    mode: import.meta.env.MODE,
  });
}

// Validate required environment variables
if (!SUPABASE_URL) {
  console.error("🔥 CRITICAL: SUPABASE_URL is missing or empty", {
    url: SUPABASE_URL,
    env: import.meta.env,
  });
  throw new Error(
    "Missing VITE_SUPABASE_URL environment variable. Set it in .env or Netlify dashboard."
  );
}

if (!SUPABASE_PUBLISHABLE_KEY) {
  console.error("🔥 CRITICAL: SUPABASE_PUBLISHABLE_KEY is missing or empty", {
    key: SUPABASE_PUBLISHABLE_KEY,
    env: import.meta.env,
  });
  throw new Error(
    "Missing VITE_SUPABASE_ANON_KEY environment variable. Set it in .env or Netlify dashboard."
  );
}

// Export client with enhanced auth configuration and JWT handling
export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      // Enhanced error handling for refresh token issues
      debug: import.meta.env.DEV,
      // Storage key for session
      storageKey: 'supabase.auth.token'
    },
    global: {
      headers: {
        'x-application-name': 'BISMILLAH-App',
        'x-client-info': 'BISMILLAH-App/1.0'
      }
    },
    // Enhanced database options for better error handling
    db: {
      schema: 'public'
    },
    // Realtime options for better connection handling
    realtime: {
      params: {
        eventsPerSecond: 10
      },
      heartbeatIntervalMs: 30000,
      reconnectAfterMs: (tries: number) => {
        // Exponential backoff for reconnection
        return Math.min(tries * 1000, 30000);
      }
    }
  }
);

// Enhanced error handling for JWT expiration
let isHandlingJWTError = false;

// Global auth state change handler
supabase.auth.onAuthStateChange(async (event, session) => {
  if (import.meta.env.DEV) {
    console.log('🔄 Supabase Auth State Change:', {
      event,
      sessionExists: !!session,
      userId: session?.user?.id,
      expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : null
    });
  }
  
  // Handle token refresh events
  if (event === 'TOKEN_REFRESHED') {
    console.log('✅ JWT Token refreshed successfully');
    isHandlingJWTError = false;
  }
  
  // Handle sign out events
  if (event === 'SIGNED_OUT') {
    console.log('🚪 User signed out');
    isHandlingJWTError = false;
  }
});

// Enhanced session validation utility
export const validateSupabaseSession = async (): Promise<boolean> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Session validation error:', error);
      return false;
    }
    
    if (!session) {
      console.debug('ℹ️ No active session found');
      return false;
    }
    
    // Check if session is close to expiry (within 5 minutes)
    const expiresAt = session.expires_at;
    if (expiresAt) {
      const expiryTime = expiresAt * 1000; // Convert to milliseconds
      const now = Date.now();
      const timeUntilExpiry = expiryTime - now;
      const fiveMinutes = 5 * 60 * 1000;
      
      if (timeUntilExpiry < fiveMinutes && timeUntilExpiry > 0) {
        console.log('⏰ Session expires soon, triggering refresh...');
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          console.error('❌ Proactive session refresh failed:', refreshError);
          return false;
        }
        console.log('✅ Session refreshed proactively');
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Session validation failed:', error);
    return false;
  }
};

// Optional: expose in dev for easier debugging
if (import.meta.env.DEV) {
  (window as any).supabase = supabase;
  (window as any).validateSupabaseSession = validateSupabaseSession;
}
