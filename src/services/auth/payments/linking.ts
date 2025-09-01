// src/services/auth/payments/linking.ts - SIMPLIFIED (removed auth_email and linked_at)
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { toSafeISOString } from '@/utils/unifiedDateUtils';
import { PaymentRecord } from '@/services/auth/types';
import { clearSessionCache } from '../core/session';
import { getCurrentUserValidated } from '@/services/auth/core/authentication';

// ✅ UUID Sanitization function
const sanitizeUserId = (userId: any): string | null => {
  // Handle various "null" representations
  if (userId === null || 
      userId === undefined || 
      userId === 'null' || 
      userId === 'undefined' || 
      userId === '' ||
      userId === 'NULL') {
    return null;
  }
  
  // Ensure it's a valid UUID string
  if (typeof userId === 'string' && userId.length > 0) {
    // Basic UUID validation (36 chars with hyphens)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(userId)) {
      return userId;
    }
  }
  
  logger.warn('Invalid user ID detected:', { userId, type: typeof userId });
  return null;
};

// ✅ Enhanced cache clearing function
const forceRefreshCache = async () => {
  try {
    clearSessionCache();
    
    if (typeof window !== 'undefined' && (window as any).queryClient) {
      const queryClient = (window as any).queryClient;
      await queryClient.invalidateQueries({ queryKey: ['paymentStatus'] });
      await queryClient.refetchQueries({ queryKey: ['paymentStatus'] });
      logger.debug('React Query cache refreshed');
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    logger.success('Cache refresh completed');
  } catch (error) {
    logger.warn('Cache refresh failed:', error);
  }
};

export const linkPaymentToUser = async (orderId: string, user: any): Promise<PaymentRecord> => {
  try {
    // ✅ ENHANCED: Validate user object with sanitization
    if (!user) {
      throw new Error('User not authenticated. Please login first.');
    }
    
    // ✅ CRITICAL: Sanitize user ID before any operations
    const sanitizedUserId = sanitizeUserId(user.id);
    
    if (!sanitizedUserId) {
      logger.error('Invalid user ID detected:', { 
        originalId: user.id, 
        type: typeof user.id,
        email: user.email 
      });
      
      // Try to get fresh user
      try {
        const freshUser = await getCurrentUserValidated();
        const freshUserId = sanitizeUserId(freshUser.id);
        
        if (!freshUserId) {
          throw new Error('Fresh user also has invalid ID');
        }
        
        user = freshUser; // Use fresh user
        logger.info('Got fresh user with valid ID:', { id: freshUserId, email: freshUser.email });
      } catch (freshError) {
        logger.error('Fresh user fetch failed:', freshError);
        throw new Error('Invalid user session. Please logout and login again.');
      }
    }
    
    // ✅ Re-sanitize after potential fresh user fetch
    const finalUserId = sanitizeUserId(user.id);
    if (!finalUserId) {
      throw new Error('Unable to get valid user ID. Please logout and login again.');
    }
    
    if (!user.email) {
      throw new Error('User email is missing. Please logout and login again.');
    }
    
    logger.api('/link-payment', 'Linking order to user with sanitized ID:', { 
      orderId, 
      email: user.email, 
      originalUserId: user.id,
      sanitizedUserId: finalUserId,
      userType: typeof user.id
    });
    
    // ✅ STEP 1: Check if already linked to this user (FIXED)
    const { data: existingLink, error: existingError } = await supabase
      .from('user_payments')
      .select(`
        id,
        user_id,
        order_id,
        email,
        payment_status,
        is_paid,
        created_at,
        updated_at
      `)
      .eq('order_id', orderId.trim())
      .eq('user_id', finalUserId) // ✅ FIXED: Use sanitized ID
      .limit(1);

    if (!existingError && existingLink?.length) {
      logger.success('Payment already linked to this user');
      toast.success('Order sudah terhubung dengan akun Anda!');
      await forceRefreshCache();
      return existingLink[0];
    }

    // ✅ STEP 2: Find unlinked payment
    const { data: payments, error: findError } = await supabase
      .from('user_payments')
      .select(`
        id,
        user_id,
        order_id,
        email,
        payment_status,
        is_paid,
        pg_reference_id,
        created_at
      `)
      .eq('order_id', orderId.trim())
      .is('user_id', null)
      .eq('is_paid', true)
      .eq('payment_status', 'settled')
      .limit(1);

    if (findError) {
      logger.error('Search error:', findError);
      throw new Error('Gagal mencari order. Silakan coba lagi.');
    }

    if (!payments || payments.length === 0) {
      throw new Error('Order ID tidak ditemukan, belum dibayar, atau sudah terhubung dengan akun lain.');
    }

    const payment = payments[0];
    logger.info('Found payment to link:', { orderId: payment.order_id, email: payment.email });

    // ✅ STEP 3: Check for constraint conflicts (FIXED)
    const { data: conflictCheck, error: conflictError } = await supabase
      .from('user_payments')
      .select('id, order_id')
      .eq('email', user.email)
      .eq('user_id', finalUserId) // ✅ FIXED: Use sanitized ID
      .limit(1);

    if (!conflictError && conflictCheck?.length) {
      const existing = conflictCheck[0];
      if (existing.order_id === orderId) {
        logger.success('Same order already linked');
        toast.success('Order sudah terhubung dengan akun Anda!');
        await forceRefreshCache();
        return payment;
      }
      throw new Error(`Akun Anda sudah memiliki pembayaran dengan Order ID: ${existing.order_id}. Satu akun hanya bisa memiliki satu pembayaran aktif.`);
    }

    // ✅ STEP 4: Update payment (SIMPLIFIED - removed auth_email and linked_at)
    const now = toSafeISOString(new Date()) || new Date().toISOString();
    const updateData: any = { 
      user_id: finalUserId, // ✅ Use sanitized ID
      updated_at: now
    };

    // ✅ Enhanced email handling
    if (!payment.email || 
        payment.email.trim() === '' || 
        payment.email.includes('@payment.com') ||
        payment.email.includes('@webhook.com')) {
      updateData.email = user.email;
      logger.info('Updating email to user email');
    }

    logger.info('Updating payment with sanitized user ID:', {
      updateData,
      originalUserId: user.id,
      sanitizedUserId: finalUserId
    });

    const { data: updatedPayment, error: updateError } = await supabase
      .from('user_payments')
      .update(updateData)
      .eq('id', payment.id)
      .select(`
        id,
        user_id,
        order_id,
        email,
        payment_status,
        is_paid,
        created_at,
        updated_at
      `)
      .single();

    if (updateError) {
      logger.error('Update error:', updateError);
      
      // ✅ ENHANCED: Better error detection
      if (updateError.message?.includes('invalid input syntax for type uuid')) {
        logger.error('UUID syntax error with sanitized ID:', {
          finalUserId,
          updateData,
          originalUserId: user.id
        });
        throw new Error('Invalid user ID format. Please logout and login again.');
      }
      
      if (updateError.code === '23505') {
        if (updateError.message.includes('user_payments_email_user_unique')) {
          throw new Error('Akun Anda sudah memiliki pembayaran aktif. Satu akun hanya bisa memiliki satu pembayaran.');
        }
        throw new Error('Data pembayaran sudah ada. Silakan hubungi admin jika ini adalah kesalahan.');
      }
      
      throw new Error('Gagal menghubungkan order. Silakan coba lagi.');
    }

    if (!updatedPayment) {
      throw new Error('Gagal mendapatkan data pembayaran yang diperbarui');
    }

    logger.success('✅ Payment linked successfully:', {
      orderId: updatedPayment.order_id,
      userId: updatedPayment.user_id,
      email: updatedPayment.email
    });

    toast.success('Order berhasil terhubung dengan akun Anda!');
    
    await forceRefreshCache();
    
    return updatedPayment;
    
  } catch (error: any) {
    logger.error('Error linking payment to user:', error);
    toast.error(error.message);
    throw error;
  }
};

// ✅ SIMPLIFIED: Get linking history (removed linked_at reference)
export const getPaymentLinkingHistory = async (userId: string) => {
  try {
    const sanitizedUserId = sanitizeUserId(userId);
    if (!sanitizedUserId) {
      logger.error('Invalid userId for linking history:', userId);
      return [];
    }
    
    const { data, error } = await supabase
      .from('user_payments')
      .select('order_id, email, created_at')
      .eq('user_id', sanitizedUserId) // ✅ Use sanitized ID
      .not('user_id', 'is', null) // ✅ SIMPLIFIED: Check user_id instead of linked_at
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error getting linking history:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    logger.error('Error in getPaymentLinkingHistory:', error);
    return [];
  }
};

// ✅ FIXED: Check user has payment with sanitization
export const checkUserHasPayment = async (email: string, userId: string): Promise<{
  hasPayment: boolean;
  payment?: any;
}> => {
  try {
    const sanitizedUserId = sanitizeUserId(userId);
    if (!sanitizedUserId) {
      logger.error('Invalid userId for payment check:', userId);
      return { hasPayment: false };
    }
    
    const { data, error } = await supabase
      .from('user_payments')
      .select(`
        id,
        user_id,
        order_id,
        email,
        payment_status,
        is_paid,
        created_at
      `)
      .eq('email', email)
      .eq('user_id', sanitizedUserId) // ✅ Use sanitized ID
      .eq('is_paid', true)
      .eq('payment_status', 'settled')
      .limit(1);

    if (error) {
      logger.error('Error checking user payment:', error);
      return { hasPayment: false };
    }

    return {
      hasPayment: data && data.length > 0,
      payment: data?.[0] || null
    };
  } catch (error) {
    logger.error('Error in checkUserHasPayment:', error);
    return { hasPayment: false };
  }
};

export const debugConstraintIssue = async (email: string, userId: string) => {
  try {
    const sanitizedUserId = sanitizeUserId(userId);
    
    logger.debug('DEBUG: Checking constraint for:', { 
      email, 
      originalUserId: userId, 
      sanitizedUserId,
      userIdType: typeof userId
    });
    
    const { data: emailPayments } = await supabase
      .from('user_payments')
      .select(`
        id,
        user_id,
        order_id,
        email,
        created_at
      `)
      .eq('email', email);
    
    // ✅ Use sanitized ID if valid, otherwise skip user query
    let userPayments = null;
    if (sanitizedUserId) {
      const { data } = await supabase
        .from('user_payments')
        .select(`
          id,
          user_id,
          order_id,
          email,
          created_at
        `)
        .eq('user_id', sanitizedUserId);
      userPayments = data;
    }
    
    logger.debug('DEBUG Results:', {
      emailPayments: emailPayments?.length || 0,
      userPayments: userPayments?.length || 0,
      emailPaymentDetails: emailPayments,
      userPaymentDetails: userPayments,
      sanitizedUserId
    });
    
    return { emailPayments, userPayments };
  } catch (error) {
    logger.error('Debug error:', error);
    return null;
  }
};