import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

// Base API URL for Supabase Edge Functions
const API_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

// Cache for auth session token
let cachedToken: string | null = null;
let tokenExpiry: number | null = null;

const refreshToken = async () => {
  const { data } = await supabase.auth.getSession();
  cachedToken = data.session?.access_token ?? null;
  tokenExpiry = data.session?.expires_at ?? null;
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
  const headers = await getAuthHeaders();
  let response = await fetch(url, { ...options, headers: { ...headers, ...(options.headers || {}) } });

  if (response.status === 401) {
    cachedToken = null;
    await refreshToken();
    const retryHeaders = await getAuthHeaders();
    response = await fetch(url, { ...options, headers: { ...retryHeaders, ...(options.headers || {}) } });
  }

  return response;
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
