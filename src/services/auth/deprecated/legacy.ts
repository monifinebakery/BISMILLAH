// src/services/auth/deprecated/legacy.ts
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { sendEmailOtp } from '@/services/auth/core/otp';

// DEPRECATED FUNCTIONS - Return empty/default values untuk backward compatibility
export const autoLinkUserPayments = async (): Promise<number> => {
  logger.warn('[authService] autoLinkUserPayments is deprecated and removed');
  return 0;
};

export const checkUnlinkedPayments = async (): Promise<{ hasUnlinked: boolean; count: number }> => {
  logger.warn('[authService] checkUnlinkedPayments is deprecated and removed');
  return { hasUnlinked: false, count: 0 };
};

export const getRecentUnlinkedOrders = async (): Promise<string[]> => {
  logger.warn('[authService] getRecentUnlinkedOrders is deprecated and removed');
  return [];
};

export const sendMagicLink = async (
  email: string, 
  captchaToken: string | null = null,
  allowSignup: boolean = true
): Promise<boolean> => {
  logger.warn('[authService] sendMagicLink is deprecated and removed');
  toast.error('Magic link authentication tidak tersedia. Gunakan OTP.');
  return false;
};

export const sendAuth = async (
  email: string, 
  method: 'otp' | 'magic' = 'otp', 
  captchaToken: string | null = null,
  allowSignup: boolean = true,
  skipCaptcha: boolean = false
): Promise<boolean> => {
  logger.warn('[authService] sendAuth is deprecated, use sendEmailOtp directly');
  if (method === 'otp') {
    return await sendEmailOtp(email, captchaToken, allowSignup, skipCaptcha);
  } else {
    toast.error('Magic link authentication tidak tersedia. Gunakan OTP.');
    return false;
  }
};

export const handleMagicLinkCallback = async (code: string) => {
  logger.warn('[authService] handleMagicLinkCallback is deprecated and removed');
  throw new Error('Magic link callback feature has been removed');
};

export const checkUserExists = async (email: string): Promise<boolean> => {
  logger.warn('[authService] checkUserExists is deprecated and removed');
  return true; // Assume user exists for backward compatibility
};

import { getCurrentSession } from '@/services/auth/core/session';

export const checkEmailVerificationStatus = async () => {
  const session = await getCurrentSession();
  if (!session?.user) return { isVerified: false, needsVerification: false };
  
  const isVerified = !!session.user.email_confirmed_at;
  return { isVerified, needsVerification: !isVerified && !!session.user.email };
};

import { supabase } from '@/integrations/supabase/client';
import { validateEmail, getErrorMessage } from '@/services/auth/utils';

export const sendPasswordResetEmail = async (email: string): Promise<boolean> => {
  
  try {
    if (!validateEmail(email)) {
      toast.error('Format email tidak valid');
      return false;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      const errorMsg = getErrorMessage(error);
      toast.error(errorMsg);
      return false;
    }

    toast.success('Link reset password telah dikirim ke email Anda');
    return true;
  } catch (error) {
    logger.error('Error sending password reset:', error);
    toast.error('Terjadi kesalahan saat mengirim link reset password');
    return false;
  }
};