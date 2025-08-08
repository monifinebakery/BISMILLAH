// src/services/auth/index.ts
// Main export barrel file - Export all public functions

// Core exports
export { getCurrentSession, refreshSession } from './core/session';
export { isAuthenticated, getCurrentUser, signOut, onAuthStateChange, hasValidSession, onAuthStateChangeWithPaymentLinking } from './core/authentication';
export { sendEmailOtp, verifyEmailOtp } from './core/otp';

// Payment exports
export { verifyOrderExists, verifyCustomerOrder } from './payments/verification'; // ✅ Pastikan ini ada
export { linkPaymentToUser, checkUserHasPayment, debugConstraintIssue } from './payments/linking';
export { getUserAccessStatus, hasAppAccess, getUserPaymentStatus } from './payments/access';

// Type exports
export type { PaymentRecord, UserAccessStatus } from './types';

// Utility exports
export { validateEmail, getErrorMessage } from './utils';

// Deprecated exports (for backward compatibility)
export {
  autoLinkUserPayments,
  checkUnlinkedPayments,
  getRecentUnlinkedOrders,
  sendMagicLink,
  sendAuth,
  handleMagicLinkCallback,
  checkUserExists,
  checkEmailVerificationStatus,
  sendPasswordResetEmail
} from './deprecated/legacy';

// Export supabase client
export { supabase } from '@/integrations/supabase/client';