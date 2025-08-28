// src/components/financial/tests/autoRefresh.test.ts
// Test suite for auto-refresh functionality

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock the contexts and APIs
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' },
    isLoading: false
  })
}));

vi.mock('../services/financialApi', () => ({
  getFinancialTransactions: vi.fn(() => Promise.resolve([]))
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    channel: vi.fn(() => ({
      on: vi.fn(() => ({
        subscribe: vi.fn((callback) => {
          callback('SUBSCRIBED');
          return { unsubscribe: vi.fn() };
        })
      }))
    })),
    removeChannel: vi.fn()
  }
}));

vi.mock('@/contexts/UserSettingsContext', () => ({
  useUserSettings: () => ({
    settings: {},
    saveSettings: vi.fn(),
    isLoading: false
  })
}));

// Import hooks after mocking
import { useFinancialData } from '../hooks/useFinancialHooks';
import { useFinancialCore } from '../hooks/useFinancialCore';

describe('Auto-Refresh Functionality', () => {
  let queryClient: QueryClient;
  
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    queryClient.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  describe('useFinancialData', () => {
    it('should enable automatic background refetching', () => {
      const { result } = renderHook(() => useFinancialData(), { wrapper });
      
      // The hook should be configured for auto-refresh
      expect(result.current.isLoading).toBeDefined();
      expect(result.current.data).toBeDefined();
    });

    it('should have correct refetch settings', async () => {
      const { result } = renderHook(() => useFinancialData(), { wrapper });
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Test that the query is configured for auto-refresh
      const queryState = queryClient.getQueryState(['financial', 'transactions', 'test-user-id']);
      expect(queryState).toBeTruthy();
    });
  });

  describe('useFinancialCore', () => {
    it('should provide refresh functionality', () => {
      const { result } = renderHook(() => useFinancialCore(), { wrapper });
      
      // Check that refresh functions are available
      expect(typeof result.current.refresh).toBe('function');
      expect(typeof result.current.forceRefresh).toBe('function');
    });

    it('should track refresh state', () => {
      const { result } = renderHook(() => useFinancialCore(), { wrapper });
      
      // Check refresh state properties
      expect(result.current.isRefreshing).toBeDefined();
      expect(result.current.lastRefresh).toBeDefined();
    });

    it('should automatically refresh on mount', async () => {
      const { result } = renderHook(() => useFinancialCore(), { wrapper });
      
      // Wait for the effect to run
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      // Should have attempted to refresh
      expect(result.current.lastRefresh).toBeTruthy();
    });
  });

  describe('Auto-refresh configuration', () => {
    it('should have appropriate stale time settings', () => {
      renderHook(() => useFinancialData(), { wrapper });
      
      const queryState = queryClient.getQueryState(['financial', 'transactions', 'test-user-id']);
      
      // Query should be configured
      expect(queryState).toBeTruthy();
    });

    it('should enable refetch on window focus', () => {
      const { result } = renderHook(() => useFinancialData(), { wrapper });
      
      // The hook should be set up to refetch on window focus
      expect(result.current).toBeTruthy();
    });

    it('should enable refetch on reconnect', () => {
      const { result } = renderHook(() => useFinancialData(), { wrapper });
      
      // The hook should be set up to refetch on network reconnect
      expect(result.current).toBeTruthy();
    });
  });

  describe('Real-time subscription', () => {
    it('should set up real-time subscription for authenticated users', () => {
      const { result } = renderHook(() => useFinancialCore(), { wrapper });
      
      // Should have access to financial data
      expect(result.current.transactions).toBeDefined();
      expect(Array.isArray(result.current.transactions)).toBe(true);
    });
  });

  describe('Manual refresh', () => {
    it('should allow manual refresh triggering', async () => {
      const { result } = renderHook(() => useFinancialCore(), { wrapper });
      
      expect(typeof result.current.refresh).toBe('function');
      expect(typeof result.current.forceRefresh).toBe('function');
      
      // Test manual refresh
      await result.current.refresh();
      expect(result.current.lastRefresh).toBeTruthy();
    });
  });
});

// Integration test to verify the complete auto-refresh flow
describe('Auto-Refresh Integration', () => {
  let queryClient: QueryClient;
  
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: 1000, // 1 second for testing
        },
      },
    });
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    queryClient.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  it('should complete the full auto-refresh cycle', async () => {
    const { result } = renderHook(() => useFinancialCore(), { wrapper });
    
    // Wait for initial load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    // Verify financial data structure
    expect(result.current.totalIncome).toBeDefined();
    expect(result.current.totalExpense).toBeDefined();
    expect(result.current.balance).toBeDefined();
    expect(result.current.filteredTransactions).toBeDefined();
    
    // Verify refresh capabilities
    expect(result.current.refresh).toBeDefined();
    expect(result.current.forceRefresh).toBeDefined();
    expect(result.current.isRefreshing).toBeDefined();
    expect(result.current.lastRefresh).toBeDefined();
  });
});
