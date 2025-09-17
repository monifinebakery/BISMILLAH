// src/services/paymentPrefetchService.ts
// Service untuk prefetch dan background sync payment status
import { QueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentUser, isAuthenticated } from '@/services/auth';
import { safeParseDate } from '@/utils/unifiedDateUtils';
import { logger } from '@/utils/logger';

export class PaymentPrefetchService {
  private static instance: PaymentPrefetchService;
  private queryClient: QueryClient;
  private prefetchTimer: NodeJS.Timeout | null = null;
  private syncTimer: NodeJS.Timeout | null = null;

  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient;
  }

  static getInstance(queryClient: QueryClient): PaymentPrefetchService {
    if (!PaymentPrefetchService.instance) {
      PaymentPrefetchService.instance = new PaymentPrefetchService(queryClient);
    }
    return PaymentPrefetchService.instance;
  }

  // ✅ Prefetch payment status saat login
  async prefetchOnLogin(userId?: string): Promise<void> {
    try {
      if (process.env.NODE_ENV === 'development') {
        logger.service('PaymentPrefetch', 'Starting prefetch on login', { userId });
      }

      const isAuth = await isAuthenticated();
      if (!isAuth) return;

      const user = await getCurrentUser();
      if (!user) return;

      // Prefetch dengan priority tinggi
      await this.queryClient.prefetchQuery({
        queryKey: ['paymentStatus'],
        queryFn: () => this.fetchPaymentStatus(user),
        staleTime: 60000,
        cacheTime: 900000,
        // @ts-ignore - prefetch option
        priority: 'high'
      });

      if (process.env.NODE_ENV === 'development') {
        logger.success('Payment status prefetched on login');
      }
    } catch (error) {
      logger.error('Failed to prefetch payment status on login:', error);
    }
  }

  // ✅ Background sync setiap 5 menit
  startBackgroundSync(): void {
    this.stopBackgroundSync(); // Clear existing timer

    this.syncTimer = setInterval(async () => {
      try {
        const isAuth = await isAuthenticated();
        if (!isAuth) return;

        const user = await getCurrentUser();
        if (!user) return;

        // Background fetch tanpa loading state
        this.queryClient.prefetchQuery({
          queryKey: ['paymentStatus'],
          queryFn: () => this.fetchPaymentStatus(user),
          staleTime: 60000
        });

        if (process.env.NODE_ENV === 'development') {
          logger.service('PaymentPrefetch', 'Background sync completed');
        }
      } catch (error) {
        logger.error('Background sync failed:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  // ✅ Stop background sync
  stopBackgroundSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  // ✅ Warm cache dengan predictive loading
  async warmCache(): Promise<void> {
    try {
      const isAuth = await isAuthenticated();
      if (!isAuth) return;

      const user = await getCurrentUser();
      if (!user) return;

      // Set cached data dengan placeholder
      this.queryClient.setQueryData(['paymentStatus'], null);

      // Kemudian fetch real data
      setTimeout(async () => {
        try {
          const paymentStatus = await this.fetchPaymentStatus(user);
          this.queryClient.setQueryData(['paymentStatus'], paymentStatus);

          if (process.env.NODE_ENV === 'development') {
            logger.success('Payment cache warmed successfully');
          }
        } catch (error) {
          logger.error('Failed to warm payment cache:', error);
        }
      }, 100); // Small delay untuk tidak block UI
    } catch (error) {
      logger.error('Failed to warm cache:', error);
    }
  }

  // ✅ Main fetch function (sama dengan usePaymentStatus)
  private async fetchPaymentStatus(user: any): Promise<any> {
    // Check for LINKED payments first
    const { data: linkedPayments, error: linkedError } = await supabase
      .from('user_payments')
      .select('id,user_id,order_id,pg_reference_id,email,payment_status,is_paid,created_at,updated_at,payment_date,amount,currency,customer_name')
      .eq('user_id', user.id)
      .eq('is_paid', true)
      .eq('payment_status', 'settled')
      .order('updated_at', { ascending: false })
      .limit(1);

    if (!linkedError && linkedPayments?.length) {
      const payment = linkedPayments[0];
      return {
        ...payment,
        created_at: safeParseDate(payment.created_at),
        updated_at: safeParseDate(payment.updated_at),
        payment_date: safeParseDate(payment.payment_date),
      };
    }

    // Check for UNLINKED payments
    const { data: unlinkedPayments, error: unlinkedError } = await supabase
      .from('user_payments')
      .select('id,user_id,order_id,pg_reference_id,email,payment_status,is_paid,created_at,updated_at,payment_date,amount,currency,customer_name')
      .is('user_id', null)
      .eq('is_paid', true)
      .eq('payment_status', 'settled')
      .eq('email', user.email)
      .order('updated_at', { ascending: false })
      .limit(1);

    if (!unlinkedError && unlinkedPayments?.length) {
      const payment = unlinkedPayments[0];
      return {
        ...payment,
        created_at: safeParseDate(payment.created_at),
        updated_at: safeParseDate(payment.updated_at),
        payment_date: safeParseDate(payment.payment_date),
      };
    }

    return null;
  }

  // ✅ Cleanup resources
  cleanup(): void {
    this.stopBackgroundSync();
    
    if (this.prefetchTimer) {
      clearTimeout(this.prefetchTimer);
      this.prefetchTimer = null;
    }
  }

  // ✅ Conditional prefetch berdasarkan network condition
  async smartPrefetch(): Promise<void> {
    // Check network connection
    if (navigator.onLine === false) return;

    // Check connection speed (if available)
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection && connection.effectiveType === 'slow-2g') {
        // Skip prefetch on slow connection
        return;
      }
    }

    await this.prefetchOnLogin();
  }
}

// ✅ Factory function untuk ease of use
export const createPaymentPrefetchService = (queryClient: QueryClient) => {
  return PaymentPrefetchService.getInstance(queryClient);
};

// ✅ Helper hooks
export const usePaymentPrefetch = (queryClient: QueryClient) => {
  const service = PaymentPrefetchService.getInstance(queryClient);

  return {
    prefetchOnLogin: service.prefetchOnLogin.bind(service),
    startBackgroundSync: service.startBackgroundSync.bind(service),
    stopBackgroundSync: service.stopBackgroundSync.bind(service),
    warmCache: service.warmCache.bind(service),
    smartPrefetch: service.smartPrefetch.bind(service),
    cleanup: service.cleanup.bind(service)
  };
};