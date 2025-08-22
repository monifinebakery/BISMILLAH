import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { handleAuthError, isRefreshTokenError } from '@/utils/authErrorHandler';

// Base API URL for Supabase Edge Functions
const API_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

// Cache for auth session token
let cachedToken: string | null = null;
let tokenExpiry: number | null = null;

const refreshToken = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      logger.error('Error getting session for token refresh:', error);
      
      // Handle refresh token errors
      if (isRefreshTokenError(error)) {
        await handleAuthError(error);
        cachedToken = null;
        tokenExpiry = null;
        return;
      }
    }
    
    cachedToken = data.session?.access_token ?? null;
    tokenExpiry = data.session?.expires_at ?? null;
    
    if (!cachedToken) {
      logger.warn('No access token available after refresh');
    }
  } catch (error) {
    logger.error('Exception during token refresh:', error);
    
    // Handle potential refresh token errors
    if (isRefreshTokenError(error)) {
      await handleAuthError(error);
    }
    
    cachedToken = null;
    tokenExpiry = null;
  }
};

// Helper function to get auth headers with cached token
const getAuthHeaders = async () => {
  const now = Math.floor(Date.now() / 1000);
  if (!cachedToken || !tokenExpiry || tokenExpiry <= now) {
    await refreshToken();
  }
  return {
    'Authorization': `Bearer ${cachedToken}`,
    'Content-Type': 'application/json'
  };
};

// Fetch wrapper that retries once on unauthorized
const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  try {
    const headers = await getAuthHeaders();
    let response = await fetch(url, { ...options, headers: { ...headers, ...(options.headers || {}) } });

    if (response.status === 401) {
      logger.warn('401 Unauthorized, attempting token refresh and retry...');
      
      // Clear cached token and try refresh
      cachedToken = null;
      
      try {
        await refreshToken();
        
        // Retry with new token
        const retryHeaders = await getAuthHeaders();
        response = await fetch(url, { ...options, headers: { ...retryHeaders, ...(options.headers || {}) } });
        
        // If still 401 after retry, might be a session issue
        if (response.status === 401) {
          logger.error('Still 401 after token refresh, possible session expired');
          const sessionError = new Error('Session expired or invalid');
          await handleAuthError(sessionError);
        }
      } catch (refreshError) {
        logger.error('Error during token refresh:', refreshError);
        
        // Handle potential refresh token errors
        if (isRefreshTokenError(refreshError)) {
          await handleAuthError(refreshError);
        }
        
        throw refreshError;
      }
    }

    return response;
  } catch (error) {
    logger.error('Error in fetchWithAuth:', error);
    
    // Handle potential auth errors
    if (isRefreshTokenError(error)) {
      await handleAuthError(error);
    }
    
    throw error;
  }
};

// API for protected endpoints (requires authentication)
export const protectedApi = {
  // Get user data
  getUserData: async () => {
    try {
      const response = await fetchWithAuth(`${API_URL}/protected-api/user-data`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch user data');
      }
      
      return await response.json();
    } catch (error) {
      logger.error('API Error - getUserData:', error);
      throw error;
    }
  },
  
  // Get premium data (requires payment)
  getPremiumData: async () => {
    try {
      const response = await fetchWithAuth(`${API_URL}/protected-api/premium-data`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch premium data');
      }
      
      return await response.json();
    } catch (error) {
      logger.error('API Error - getPremiumData:', error);
      throw error;
    }
  }
};

// API for admin endpoints
export const adminApi = {
  // Get all users
  getUsers: async () => {
    try {
      const response = await fetchWithAuth(`${API_URL}/admin-api/users`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch users');
      }
      
      return await response.json();
    } catch (error) {
      logger.error('API Error - getUsers:', error);
      throw error;
    }
  },
  
  // Get all payments
  getPayments: async () => {
    try {
      const response = await fetchWithAuth(`${API_URL}/admin-api/payments`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch payments');
      }
      
      return await response.json();
    } catch (error) {
      logger.error('API Error - getPayments:', error);
      throw error;
    }
  },
  
  // Update payment status
  updatePaymentStatus: async (paymentId: string, isPaid: boolean) => {
    try {
      const response = await fetchWithAuth(`${API_URL}/admin-api/payment-status`, {
        method: 'PUT',
        body: JSON.stringify({ paymentId, isPaid })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update payment status');
      }
      
      return await response.json();
    } catch (error) {
      logger.error('API Error - updatePaymentStatus:', error);
      throw error;
    }
  },
  
  // Get admin dashboard stats
  getStats: async () => {
    try {
      const response = await fetchWithAuth(`${API_URL}/admin-api/stats`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch stats');
      }
      
      return await response.json();
    } catch (error) {
      logger.error('API Error - getStats:', error);
      throw error;
    }
  }
};
