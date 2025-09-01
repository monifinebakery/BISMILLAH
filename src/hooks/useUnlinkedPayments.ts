// src/hooks/useUnlinkedPayments.ts - SIMPLIFIED VERSION (removed auth_email)
import { useState, useEffect, useCallback, useRef } from 'react';
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
  
  // ✅ Use refs to avoid circular dependencies
  const currentUserRef = useRef(currentUser);
  const supabaseClientRef = useRef(supabaseClient);
  
  // ✅ Update refs when values change
  useEffect(() => {
    currentUserRef.current = currentUser;
    supabaseClientRef.current = supabaseClient;
  }, [currentUser, supabaseClient]);

  // ✅ SIMPLIFIED: Fetch function without auth_email
  const fetchUnlinkedPayments = useCallback(async () => {
    const client = supabaseClientRef.current;
    const user = currentUserRef.current;
    
    if (!client || !user) {
      logger.debug('useUnlinkedPayments: Skipping fetch - no client or user');
      setUnlinkedPayments([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      logger.debug('useUnlinkedPayments: Fetching webhook payments for user:', user.email);
      
      // ✅ SIMPLIFIED: Query without auth_email
      const fetchPromise = client
        .from('user_payments')
        .select(`
          id,
          user_id,
          order_id,
          name,
          email,
          payment_status,
          is_paid,
          pg_reference_id,
          created_at,
          updated_at
        `)
        .is('user_id', null)
        .eq('is_paid', true)
        .eq('payment_status', 'settled')
        .neq('email', 'pending@webhook.com')
        .order('created_at', { ascending: false })
        .limit(10);

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Fetch timeout')), 15000)
      );

      const { data, error: fetchError } = await Promise.race([fetchPromise, timeoutPromise]) as any;

      if (fetchError) {
        logger.error('useUnlinkedPayments: Database error:', fetchError);
        throw fetchError;
      }

      logger.debug('useUnlinkedPayments: Raw unlinked payments:', data?.length || 0);

      // ✅ SIMPLIFIED: Better webhook detection without auth_email
      const webhookDetectedPayments = (data || []).filter((payment: any) => {
        // Check for webhook patterns
        const hasPaymentReference = payment.pg_reference_id && payment.pg_reference_id.trim() !== '';
        
        const hasWebhookEmail = payment.email && (
          payment.email === 'unlinked@payment.com' ||
          payment.email === 'pending@webhook.com' ||
          payment.email.includes('@payment.com') ||
          payment.email.includes('@webhook.com')
        );
        
        // ✅ SIMPLIFIED: Check if email matches current user (could be auto-linked to this user)
        const emailMatch = payment.email && 
                          user.email && 
                          payment.email.toLowerCase() === user.email.toLowerCase();
        
        const isWebhookPayment = hasPaymentReference || hasWebhookEmail || emailMatch;
        
        // Only check recent if no other indicators
        let isRecentUnlinked = false;
        if (!isWebhookPayment) {
          try {
            const paymentAge = new Date().getTime() - new Date(payment.created_at).getTime();
            isRecentUnlinked = paymentAge < 24 * 60 * 60 * 1000; // 24 hours
          } catch {
            isRecentUnlinked = false;
          }
        }
        
        const shouldInclude = isWebhookPayment || isRecentUnlinked;
        
        if (shouldInclude) {
          logger.debug('useUnlinkedPayments: Including payment:', {
            order_id: payment.order_id,
            hasPaymentReference,
            hasWebhookEmail,
            emailMatch,
            isRecentUnlinked
          });
        }
        
        return shouldInclude;
      });

      logger.debug('useUnlinkedPayments: Filtered webhook payments:', webhookDetectedPayments.length);

      setUnlinkedPayments(webhookDetectedPayments);
      
      // ✅ Auto-show popup logic
      if (webhookDetectedPayments.length > 0 && user) {
        logger.info('useUnlinkedPayments: Found', webhookDetectedPayments.length, 'unlinked payments');
        
        // ✅ Delay popup to avoid blocking initial load
        setTimeout(() => {
          setShowAutoLinkPopup(true);
        }, 2000);
      }

    } catch (err: any) {
      logger.error('useUnlinkedPayments: Error fetching unlinked payments:', err);
      
      // ✅ Better error handling
      if (err.message?.includes('Auth session missing')) {
        setError('Authentication required');
      } else if (err.message?.includes('timeout')) {
        setError('Request timeout - please try again');
      } else {
        setError(err.message || 'Failed to fetch payments');
      }
      
      setUnlinkedPayments([]);
    } finally {
      setIsLoading(false);
    }
  }, []); // ✅ Empty dependency array, use refs instead

  // ✅ Simplified effect for fetching
  useEffect(() => {
    if (currentUser && supabaseClient) {
      logger.debug('useUnlinkedPayments: User available, scheduling fetch');
      
      // ✅ Delay initial fetch to not block app startup
      const timer = setTimeout(() => {
        fetchUnlinkedPayments();
      }, 1000);
      
      return () => clearTimeout(timer);
    } else {
      // Clear state when no user
      logger.debug('useUnlinkedPayments: No user/client, clearing state');
      setUnlinkedPayments([]);
      setShowAutoLinkPopup(false);
      setIsLoading(false);
      setError(null);
    }
  }, [currentUser?.id, currentUser?.email, supabaseClient, fetchUnlinkedPayments]);

  // ✅ SIMPLIFIED: Real-time subscription without auth_email
  useEffect(() => {
    if (!supabaseClient || !currentUser) return;

    logger.debug('useUnlinkedPayments: Setting up real-time subscription');

    let subscription: any;
    let mounted = true;

    try {
      subscription = supabaseClient
        .channel(`webhook-payments-${currentUser.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_payments',
            filter: 'user_id=is.null'
          },
          (payload: any) => {
            if (!mounted) return;
            
            logger.debug('useUnlinkedPayments: Real-time change:', {
              event: payload.eventType,
              order_id: payload.new?.order_id || payload.old?.order_id
            });
            
            try {
              if (payload.eventType === 'INSERT' && payload.new?.is_paid && payload.new?.payment_status === 'settled') {
                const newPayment = payload.new;
                
                // ✅ SIMPLIFIED: Quick webhook detection without auth_email
                const hasPaymentReference = newPayment.pg_reference_id && newPayment.pg_reference_id.trim() !== '';
                const hasWebhookEmail = newPayment.email && (
                  newPayment.email === 'unlinked@payment.com' ||
                  newPayment.email.includes('@payment.com') ||
                  newPayment.email.includes('@webhook.com')
                );
                const emailMatch = newPayment.email && 
                                 currentUser.email && 
                                 newPayment.email.toLowerCase() === currentUser.email.toLowerCase();
                
                if (hasPaymentReference || hasWebhookEmail || emailMatch) {
                  logger.info('useUnlinkedPayments: New webhook payment detected:', newPayment.order_id);
                  
                  setUnlinkedPayments((prev: any[]) => {
                    // ✅ Avoid duplicates
                    const exists = prev.some(p => p.order_id === newPayment.order_id);
                    if (exists) return prev;
                    
                    return [newPayment, ...prev.slice(0, 9)]; // Keep max 10
                  });
                  
                  // ✅ Delay popup for real-time updates
                  setTimeout(() => {
                    if (mounted) {
                      setShowAutoLinkPopup(true);
                    }
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
        .subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            logger.success('useUnlinkedPayments: Real-time subscription active');
          } else if (status === 'SUBSCRIPTION_ERROR') {
            logger.error('useUnlinkedPayments: Real-time subscription failed');
          }
        });
    } catch (error) {
      logger.error('useUnlinkedPayments: Subscription setup failed:', error);
    }

    return () => {
      mounted = false;
      logger.debug('useUnlinkedPayments: Cleaning up subscription');
      try {
        if (subscription) {
          subscription.unsubscribe();
          supabaseClient.removeChannel(subscription);
        }
      } catch (error) {
        logger.error('useUnlinkedPayments: Subscription cleanup failed:', error);
      }
    };
  }, [supabaseClient, currentUser?.id, currentUser?.email]);

  // ✅ Auto-close popup logic
  useEffect(() => {
    if (unlinkedPayments.length === 0 && showAutoLinkPopup) {
      logger.debug('useUnlinkedPayments: No more payments, auto-closing popup');
      setShowAutoLinkPopup(false);
    }
  }, [unlinkedPayments.length, showAutoLinkPopup]);

  // ✅ DEBUG: Simplified logging
  useEffect(() => {
    if (import.meta.env.DEV) {
      logger.debug('useUnlinkedPayments state:', {
        userEmail: currentUser?.email || 'none',
        userId: currentUser?.id || 'none',
        paymentsCount: unlinkedPayments.length,
        isLoading,
        error,
        showPopup: showAutoLinkPopup,
        hasClient: !!supabaseClient
      });
    }
  }, [currentUser?.email, currentUser?.id, unlinkedPayments.length, isLoading, error, showAutoLinkPopup, supabaseClient]);

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