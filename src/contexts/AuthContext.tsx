// AuthContext.tsx - Authentication Context Provider
// 
// SINGLE SOURCE OF TRUTH POLICY
// =============================
// This context provides access to authentication state that originates
// exclusively from Supabase as the single source of truth.
// 
// Key principles:
// 1. All auth state comes from Supabase SDK
// 2. Local state is UI cache only, never source of truth
// 3. Never manipulate session data directly in local state
// 4. Always validate against Supabase before trusting session data
// 
// Components consuming this context should:
// - Treat session/user data as potentially stale
// - Use refreshUser() when current data is needed
// - Handle session expiration gracefully
// - Never store auth data independently

import React, { createContext, useContext, type ReactNode } from 'react';

import type { AuthContextValue } from '@/contexts/auth/types';
import { useAuthManager } from '@/contexts/auth/useAuthManager';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const contextValue = useAuthManager();
  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  // Ensure consumers understand this is from Supabase, not local storage
  if (process.env.NODE_ENV === 'development') {
    // @ts-ignore - Development-time warning only
    if (context.user?.id === 'null' || context.user?.id === 'undefined') {
      console.error('🚨 DEVELOPMENT WARNING: Invalid user ID in context!', context.user);
    }
  }
  
  return context;
};
