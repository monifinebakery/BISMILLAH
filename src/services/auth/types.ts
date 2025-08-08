// ===== 1. src/services/auth/types.ts =====
export interface PaymentRecord {
  id: string;
  order_id: string;
  email: string;
  user_id?: string;
  is_paid: boolean;
  payment_status: string;
  amount?: number;
  created_at: string;
  updated_at: string;
}

export interface UserAccessStatus {
  hasAccess: boolean;
  isAuthenticated: boolean;
  paymentRecord: PaymentRecord | null;
  needsOrderVerification: boolean;
  needsLinking: boolean;
  message: string;