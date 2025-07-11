import { supabase } from '@/integrations/supabase/client';

// Base API URL for Supabase Edge Functions
const API_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

// Helper function to get auth headers
const getAuthHeaders = async () => {
  const { data } = await supabase.auth.getSession();
  return {
    'Authorization': `Bearer ${data.session?.access_token}`,
    'Content-Type': 'application/json'
  };
};

// API for protected endpoints (requires authentication)
export const protectedApi = {
  // Get user data
  getUserData: async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/protected-api/user-data`, { headers });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch user data');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching user data:', error);
      throw error;
    }
  },
  
  // Get premium data (requires payment)
  getPremiumData: async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/protected-api/premium-data`, { headers });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch premium data');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching premium data:', error);
      throw error;
    }
  }
};

// API for admin endpoints
export const adminApi = {
  // Get all users
  getUsers: async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/admin-api/users`, { headers });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch users');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },
  
  // Get all payments
  getPayments: async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/admin-api/payments`, { headers });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch payments');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching payments:', error);
      throw error;
    }
  },
  
  // Update payment status
  updatePaymentStatus: async (paymentId: string, isPaid: boolean) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/admin-api/payment-status`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ paymentId, isPaid })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update payment status');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }
  },
  
  // Get admin dashboard stats
  getStats: async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/admin-api/stats`, { headers });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch stats');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw error;
    }
  }
};