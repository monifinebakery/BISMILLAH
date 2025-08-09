// src/hooks/useUnlinkedPayments.ts - OPTIMIZED VERSION
import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/utils/logger';

interface UnlinkedPaymentsHook {
  unlinkedPayments: any[];
  isLoading: boolean;
  error: string | null;
  showAutoLinkPopup: boolean;
  setShowAutoLinkPopup: (show: boolean) => void;
  refetch: () => void;
  unlinkedCount: number;
}

export const useUnlinkedPayments = (
  supabaseClient: any, 
  currentUser: any
): UnlinkedPaymentsHook => {
  const [unlinkedPayments, setUnlinkedPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAutoLinkPopup, setShowAutoLinkPopup] = useState(false);

  // ✅ OPTIMIZED: Fetch with timeout and better error handling
  const fetchUnlinkedPayments = useCallback(async () => {
    if (!supabaseClient || !currentUser) {
      logger.debug('useUnlinkedPayments: Skipping fetch - no client or user');
      setUnlinkedPayments([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      logger.debug('useUnlinkedPayments: Fetching webhook payments for user:', currentUser.email);
      
      // ✅ ADD TIMEOUT to prevent hanging
      const fetchPromise = supabaseClient
        .from('user_payments')
        .select('*')
        .is('user_id', null)
        .eq('is_paid', true)
        .neq('email', 'pending@webhook.com')
        .order('created_at', { ascending: false })
        .limit(10); // ✅ LIMIT results to prevent large queries

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Fetch timeout')), 5000) // 5 second timeout
      );

      const { data, error: fetchError } = await Promise.race([fetchPromise, timeoutPromise]) as any;

      if (fetchError) throw fetchError;

      logger.debug('useUnlinkedPayments: Raw unlinked payments:', data?.length || 0);

      // ✅ OPTIMIZED: Simplified filter logic
      const webhookDetectedPayments = (data || []).filter((payment: any) => {
        // Quick checks for webhook patterns
        const hasPaymentReference = payment.pg_reference_id && payment.pg_reference_id !== '';
        const hasWebhookEmail = payment.email && (
          payment.email === 'unlinked@payment.com' ||
          payment.email.includes('@payment.com') ||
          payment.email.includes('@webhook.com')
        );
        
        // ✅ SIMPLIFIED: Only check recent if no other indicators
        let isRecent = false;
        if (!hasPaymentReference && !hasWebhookEmail) {
          try {
            isRecent = new Date().getTime() - new Date(payment.created_at).getTime() < 24 * 60 * 60 * 1000;
          } catch {
            isRecent = false;
          }
        }
        
        return hasPaymentReference || hasWebhookEmail || isRecent;
      });

      logger.debug('useUnlinkedPayments: Filtered webhook payments:', webhookDetectedPayments.length);

      setUnlinkedPayments(webhookDetectedPayments);
      
      // ✅ OPTIMIZED: Only auto-show popup if there are payments AND user is ready
      if (webhookDetectedPayments.length > 0 && currentUser && !isLoading) {
        logger.info('useUnlinkedPayments: Auto-showing popup for', webhookDetectedPayments.length, 'payments');
        // ✅ DELAY popup to avoid blocking initial load
        setTimeout(() => {
          setShowAutoLinkPopup(true);
        }, 2000);
      }

    } catch (err: any) {
      logger.error('useUnlinkedPayments: Error fetching unlinked payments:', err);
      setError(err.message);
      setUnlinkedPayments([]); // ✅ Clear on error
    } finally {
      setIsLoading(false);
    }
  }, [supabaseClient, currentUser, isLoading]);

  // ✅ OPTIMIZED: Only fetch when user is actually available
  useEffect(() => {
    if (currentUser) {
      logger.debug('useUnlinkedPayments: User available, fetching payments');
      // ✅ DELAY initial fetch to not block app startup
      const timer = setTimeout(() => {
        fetchUnlinkedPayments();
      }, 1000);
      
      return () => clearTimeout(timer);
    } else {
      // Clear state when no user
      logger.debug('useUnlinkedPayments: No user, clearing state');
      setUnlinkedPayments([]);
      setShowAutoLinkPopup(false);
      setIsLoading(false);
    }
  }, [currentUser, fetchUnlinkedPayments]);

  // ✅ OPTIMIZED: Real-time subscription with better error handling
  useEffect(() => {
    if (!supabaseClient || !currentUser) return;

    logger.debug('useUnlinkedPayments: Setting up real-time subscription');

    let subscription: any;

    try {
      subscription = supabaseClient
        .channel('webhook-payments')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_payments',
            filter: 'user_id=is.null'
          },
          (payload: any) => {
            logger.debug('useUnlinkedPayments: Real-time change:', {
              event: payload.eventType,
              order_id: payload.new?.order_id || payload.old?.order_id
            });
            
            try {
              if (payload.eventType === 'INSERT' && payload.new?.is_paid) {
                const newPayment = payload.new;
                
                // Quick webhook detection
                const hasPaymentReference = newPayment.pg_reference_id && newPayment.pg_reference_id !== '';
                const hasWebhookEmail = newPayment.email && (
                  newPayment.email === 'unlinked@payment.com' ||
                  newPayment.email.includes('@payment.com') ||
                  newPayment.email.includes('@webhook.com')
                );
                
                if (hasPaymentReference || hasWebhookEmail) {
                  logger.info('useUnlinkedPayments: New webhook payment detected:', newPayment.order_id);
                  setUnlinkedPayments((prev: any[]) => [newPayment, ...prev.slice(0, 9)]); // Keep max 10
                  
                  // ✅ DELAY popup for real-time updates
                  setTimeout(() => {
                    setShowAutoLinkPopup(true);
                  }, 1000);
                }
              } else if (payload.eventType === 'UPDATE' && payload.new?.user_id) {
                // Payment got linked
                logger.info('useUnlinkedPayments: Payment linked, removing:', payload.new.order_id);
                setUnlinkedPayments((prev: any[]) => 
                  prev.filter((p: any) => p.order_id !== payload.new.order_id)
                );
              }
            } catch (error) {
              logger.error('useUnlinkedPayments: Real-time handler error:', error);
            }
          }
        )
        .subscribe();
    } catch (error) {
      logger.error('useUnlinkedPayments: Subscription setup failed:', error);
    }

    return () => {
      logger.debug('useUnlinkedPayments: Cleaning up subscription');
      try {
        subscription?.unsubscribe();
      } catch (error) {
        logger.error('useUnlinkedPayments: Subscription cleanup failed:', error);
      }
    };
  }, [supabaseClient, currentUser]);

  // ✅ OPTIMIZED: Auto-close popup logic
  useEffect(() => {
    if (unlinkedPayments.length === 0 && showAutoLinkPopup) {
      logger.debug('useUnlinkedPayments: No more payments, auto-closing popup');
      setShowAutoLinkPopup(false);
    }
  }, [unlinkedPayments.length, showAutoLinkPopup]);

  // ✅ DEBUG: Log state for debugging
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      logger.debug('useUnlinkedPayments state:', {
        userEmail: currentUser?.email,
        paymentsCount: unlinkedPayments.length,
        isLoading,
        error,
        showPopup: showAutoLinkPopup
      });
    }
  }, [currentUser?.email, unlinkedPayments.length, isLoading, error, showAutoLinkPopup]);

  return {
    unlinkedPayments,
    isLoading,
    error,
    showAutoLinkPopup,
    setShowAutoLinkPopup,
    refetch: fetchUnlinkedPayments,
    unlinkedCount: unlinkedPayments.length
  };
};