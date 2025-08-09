// hooks/useUnlinkedPayments.js
// Hook to detect webhook-generated unlinked payments (different from manual Order ID linking)
import { useState, useEffect } from 'react';

export const useUnlinkedPayments = (supabaseClient, currentUser) => {
  const [unlinkedPayments, setUnlinkedPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAutoLinkPopup, setShowAutoLinkPopup] = useState(false);

  // Fetch webhook-detected unlinked payments
  const fetchUnlinkedPayments = async () => {
    if (!supabaseClient) return;
    
    setIsLoading(true);
    setError(null);

    try {
      // Look for payments that were created by webhook but not linked to any user
      const { data, error: fetchError } = await supabaseClient
        .from('user_payments')
        .select('*')
        .is('user_id', null) // Not linked to any user
        .eq('is_paid', true) // Only paid payments
        .neq('email', 'pending@webhook.com') // Exclude pending webhook entries
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Filter out payments that look like they need manual Order ID input
      // vs. payments that were auto-detected by webhook
      const webhookDetectedPayments = (data || []).filter(payment => {
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
        const isRecent = new Date() - new Date(payment.created_at) < 24 * 60 * 60 * 1000; // 24 hours
        
        return hasPaymentReference || hasWebhookEmail || isRecent;
      });

      setUnlinkedPayments(webhookDetectedPayments);
      
      // Auto-show popup if there are webhook-detected payments and user is logged in
      if (webhookDetectedPayments && webhookDetectedPayments.length > 0 && currentUser) {
        setShowAutoLinkPopup(true);
      }

    } catch (err) {
      console.error('Error fetching unlinked payments:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-fetch when user logs in
  useEffect(() => {
    if (currentUser) {
      fetchUnlinkedPayments();
    } else {
      // Clear state when user logs out
      setUnlinkedPayments([]);
      setShowAutoLinkPopup(false);
    }
  }, [currentUser, supabaseClient]);

  // Real-time subscription for webhook-detected payments
  useEffect(() => {
    if (!supabaseClient) return;

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
        (payload) => {
          console.log('🔔 Webhook payment detected:', payload);
          
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
              setUnlinkedPayments(prev => [newPayment, ...prev]);
              if (currentUser) {
                setShowAutoLinkPopup(true);
              }
            }
          } else if (payload.eventType === 'UPDATE') {
            if (payload.new.user_id) {
              // Payment got linked - remove from unlinked list
              setUnlinkedPayments(prev => 
                prev.filter(p => p.order_id !== payload.new.order_id)
              );
            } else if (payload.new.is_paid && !payload.old.is_paid) {
              // Payment became paid but still unlinked
              const updatedPayment = payload.new;
              setUnlinkedPayments(prev => {
                const exists = prev.find(p => p.order_id === updatedPayment.order_id);
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
      subscription.unsubscribe();
    };
  }, [supabaseClient, currentUser]);

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