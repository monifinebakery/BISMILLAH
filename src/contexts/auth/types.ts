import type { Session, User } from '@supabase/supabase-js';

export interface AuthContextValue {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isReady: boolean;
  refreshUser: () => Promise<void>;
  triggerRedirectCheck: () => void;
  validateSession: () => Promise<boolean>;
  debugAuth: () => Promise<unknown>;
}
