// src/hooks/useUnlinkedPayments.ts
// Hook to detect webhook-generated unlinked payments (different from manual Order ID linking)
import { useState, useEffect } from 'react';
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

  // Fetch webhook-detected unlinked payments
  const fetchUnlinkedPayments = async () => {
    if (!supabaseClient) return;
    
    setIsLoading(true);
    setError(null);

    try {
      logger.debug('useUnlinkedPayments: Fetching webhook payments...');
      
      // Look for payments that were created by webhook but not linked to any user
      const { data, error: fetchError } = await supabaseClient
        .from('user_payments')
        .select('*')
        .is('user_id', null) // Not linked to any user
        .eq('is_paid', true) // Only paid payments
        .neq('email', 'pending@webhook.com') // Exclude pending webhook entries
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      logger.debug('useUnlinkedPayments: Raw unlinked payments:', data?.length || 0);

      // Filter out payments that look like they need manual Order ID input
      // vs. payments that were auto-detected by webhook
      const webhookDetectedPayments = (data || []).filter((payment: any) => {
        // These are likely webhook-detected if they have:
        // 1. A pg_reference_id (from payment gateway)
        // 2. Auto-generated email or specific webhook email patterns
        // 3. Recent creation (within last 24 hours for auto-detection)
        
        const hasPaymentReference = payment.pg_reference_id && payment.pg_reference_id !== '';
        const hasWebhookEmail = payment.email && (
          payment.email === 'unlinked@payment.com' ||
          payment.email.includes('@payment.com') ||
          payment.email.includes('@webhook.com')
        );
        const isRecent = new Date().getTime() - new Date(payment.created_at).getTime() < 24 * 60 * 60 * 1000; // 24 hours
        
        const isWebhookPayment = hasPaymentReference || hasWebhookEmail || isRecent;
        
        logger.debug('useUnlinkedPayments: Payment filter check:', {
          order_id: payment.order_id,
          hasPaymentReference,
          hasWebhookEmail,
          isRecent,
          isWebhookPayment,
          email: payment.email,
          pg_reference_id: payment.pg_reference_id
        });
        
        return isWebhookPayment;
      });

      logger.debug('useUnlinkedPayments: Filtered webhook payments:', webhookDetectedPayments.length);

      setUnlinkedPayments(webhookDetectedPayments);
      
      // Auto-show popup if there are webhook-detected payments and user is logged in
      if (webhookDetectedPayments && webhookDetectedPayments.length > 0 && currentUser) {
        logger.info('useUnlinkedPayments: Auto-showing popup for', webhookDetectedPayments.length, 'payments');
        setShowAutoLinkPopup(true);
      }

    } catch (err: any) {
      logger.error('useUnlinkedPayments: Error fetching unlinked payments:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-fetch when user logs in
  useEffect(() => {
    if (currentUser) {
      logger.debug('useUnlinkedPayments: User logged in, fetching payments for:', currentUser.email);
      fetchUnlinkedPayments();
    } else {
      // Clear state when user logs out
      logger.debug('useUnlinkedPayments: User logged out, clearing state');
      setUnlinkedPayments([]);
      setShowAutoLinkPopup(false);
    }
  }, [currentUser, supabaseClient]);

  // Real-time subscription for webhook-detected payments
  useEffect(() => {
    if (!supabaseClient) return;

    logger.debug('useUnlinkedPayments: Setting up real-time subscription');

    const subscription = supabaseClient
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
          logger.debug('useUnlinkedPayments: Webhook payment change detected:', {
            event: payload.eventType,
            order_id: payload.new?.order_id || payload.old?.order_id
          });
          
          if (payload.eventType === 'INSERT' && payload.new.is_paid) {
            // New webhook payment detected
            const newPayment = payload.new;
            
            // Check if this looks like a webhook-detected payment
            const hasPaymentReference = newPayment.pg_reference_id && newPayment.pg_reference_id !== '';
            const hasWebhookEmail = newPayment.email && (
              newPayment.email === 'unlinked@payment.com' ||
              newPayment.email.includes('@payment.com') ||
              newPayment.email.includes('@webhook.com')
            );
            
            if (hasPaymentReference || hasWebhookEmail) {
              logger.info('useUnlinkedPayments: New webhook payment detected:', newPayment.order_id);
              setUnlinkedPayments((prev: any[]) => [newPayment, ...prev]);
              if (currentUser) {
                setShowAutoLinkPopup(true);
              }
            }
          } else if (payload.eventType === 'UPDATE') {
            if (payload.new.user_id) {
              // Payment got linked - remove from unlinked list
              logger.info('useUnlinkedPayments: Payment linked, removing from list:', payload.new.order_id);
              setUnlinkedPayments((prev: any[]) => 
                prev.filter((p: any) => p.order_id !== payload.new.order_id)
              );
            } else if (payload.new.is_paid && !payload.old.is_paid) {
              // Payment became paid but still unlinked
              const updatedPayment = payload.new;
              logger.info('useUnlinkedPayments: Payment became paid:', updatedPayment.order_id);
              setUnlinkedPayments((prev: any[]) => {
                const exists = prev.find((p: any) => p.order_id === updatedPayment.order_id);
                if (!exists) {
                  return [updatedPayment, ...prev];
                }
                return prev;
              });
              if (currentUser) {
                setShowAutoLinkPopup(true);
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      logger.debug('useUnlinkedPayments: Cleaning up real-time subscription');
      subscription.unsubscribe();
    };
  }, [supabaseClient, currentUser]);

  // Auto-close popup when no more payments
  useEffect(() => {
    if (unlinkedPayments.length === 0 && showAutoLinkPopup) {
      logger.debug('useUnlinkedPayments: No more payments, auto-closing popup');
      setShowAutoLinkPopup(false);
    }
  }, [unlinkedPayments.length, showAutoLinkPopup]);

  return {
    unlinkedPayments,
    isLoading,
    error,
    showAutoLinkPopup,
    setShowAutoLinkPopup,
    refetch: fetchUnlinkedPayments,
    // Helper to get count for display
    unlinkedCount: unlinkedPayments.length
  };
};