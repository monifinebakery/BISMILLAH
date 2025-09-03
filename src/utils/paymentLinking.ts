// Payment Linking Utilities - Auto-link unlinked payments
import { supabase } from '@/integrations/supabase/client';
import { getCurrentUser, isAuthenticated } from '@/services/auth';
import { logger } from '@/utils/logger';

export interface UnlinkedPayment {
  id: string;
  order_id: string | null;
  email: string | null;
  name: string | null;
  payment_status: string | null;
  is_paid: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Find unlinked payments for current user by email
 */
export async function findUnlinkedPayments(): Promise<UnlinkedPayment[]> {
  try {
    const isAuth = await isAuthenticated();
    if (!isAuth) {
      logger.warn('paymentLinking: User not authenticated');
      return [];
    }

    const user = await getCurrentUser();
    if (!user) {
      logger.warn('paymentLinking: No user found');
      return [];
    }

    logger.info('paymentLinking: Finding unlinked payments for:', user.email);

    const { data, error } = await supabase
      .from('user_payments')
      .select(`
        id,
        order_id,
        email,
        name,
        payment_status,
        is_paid,
        created_at,
        updated_at
      `)
      .is('user_id', null)
      .eq('is_paid', true)
      .eq('payment_status', 'settled')
      .eq('email', user.email)
      .order('updated_at', { ascending: false });

    if (error) {
      logger.error('paymentLinking: Error finding unlinked payments:', error);
      return [];
    }

    logger.success('paymentLinking: Found unlinked payments:', { count: data?.length || 0 });
    return data || [];

  } catch (error) {
    logger.error('paymentLinking: Unexpected error:', error);
    return [];
  }
}

/**
 * Link a specific payment to current user
 */
export async function linkPaymentToUser(paymentId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const isAuth = await isAuthenticated();
    if (!isAuth) {
      return { success: false, error: 'User not authenticated' };
    }

    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'No user found' };
    }

    logger.info('paymentLinking: Linking payment to user:', { paymentId, userId: user.id });

    // First, verify the payment exists and is unlinked
    const { data: payment, error: fetchError } = await supabase
      .from('user_payments')
      .select('*')
      .eq('id', paymentId)
      .is('user_id', null)
      .eq('is_paid', true)
      .eq('payment_status', 'settled')
      .single();

    if (fetchError || !payment) {
      const errorMsg = 'Payment not found or already linked';
      logger.error('paymentLinking: Payment verification failed:', { paymentId, error: fetchError });
      return { success: false, error: errorMsg };
    }

    // Link the payment
    const { data, error } = await supabase
      .from('user_payments')
      .update({ user_id: user.id })
      .eq('id', paymentId)
      .select('*')
      .single();

    if (error) {
      logger.error('paymentLinking: Error linking payment:', error);
      return { success: false, error: error.message };
    }

    logger.success('paymentLinking: Payment linked successfully:', {
      paymentId: data.id,
      orderId: data.order_id,
      userId: data.user_id
    });

    return { success: true };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error('paymentLinking: Unexpected error:', error);
    return { success: false, error: errorMsg };
  }
}

/**
 * Auto-link all unlinked payments for current user
 */
export async function autoLinkAllPayments(): Promise<{ 
  success: boolean; 
  linkedCount: number; 
  errors: string[] 
}> {
  try {
    logger.info('paymentLinking: Auto-linking all payments for current user');

    const unlinkedPayments = await findUnlinkedPayments();
    
    if (unlinkedPayments.length === 0) {
      logger.info('paymentLinking: No unlinked payments found');
      return { success: true, linkedCount: 0, errors: [] };
    }

    const results = await Promise.allSettled(
      unlinkedPayments.map(payment => linkPaymentToUser(payment.id))
    );

    const errors: string[] = [];
    let linkedCount = 0;

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.success) {
        linkedCount++;
      } else if (result.status === 'fulfilled' && !result.value.success) {
        errors.push(`Payment ${unlinkedPayments[index].order_id}: ${result.value.error}`);
      } else {
        errors.push(`Payment ${unlinkedPayments[index].order_id}: ${result.reason}`);
      }
    });

    logger.info('paymentLinking: Auto-link completed:', { 
      total: unlinkedPayments.length, 
      linked: linkedCount, 
      errors: errors.length 
    });

    return { 
      success: linkedCount > 0, 
      linkedCount, 
      errors 
    };

  } catch (error) {
    logger.error('paymentLinking: Auto-link failed:', error);
    return { 
      success: false, 
      linkedCount: 0, 
      errors: [error instanceof Error ? error.message : String(error)]
    };
  }
}

/**
 * Check if user has any unlinked payments and auto-link them
 * This can be called on login or payment status check
 */
export async function checkAndAutoLinkPayments(): Promise<boolean> {
  try {
    logger.info('paymentLinking: Checking for auto-linkable payments');

    const unlinkedPayments = await findUnlinkedPayments();
    
    if (unlinkedPayments.length === 0) {
      return false; // No payments to link
    }

    // Auto-link the most recent valid payment
    const mostRecentPayment = unlinkedPayments[0];
    const result = await linkPaymentToUser(mostRecentPayment.id);

    if (result.success) {
      logger.success('paymentLinking: Auto-linked most recent payment:', {
        orderId: mostRecentPayment.order_id,
        paymentId: mostRecentPayment.id
      });
      return true;
    } else {
      logger.error('paymentLinking: Failed to auto-link payment:', result.error);
      return false;
    }

  } catch (error) {
    logger.error('paymentLinking: Check and auto-link failed:', error);
    return false;
  }
}

// Development/Debug functions
if (import.meta.env.DEV) {
  // @ts-ignore
  window.__DEBUG_PAYMENT_LINKING__ = {
    findUnlinkedPayments,
    linkPaymentToUser,
    autoLinkAllPayments,
    checkAndAutoLinkPayments
  };
}
