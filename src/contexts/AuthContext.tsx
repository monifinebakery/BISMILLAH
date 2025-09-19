import React, { createContext, useContext, type ReactNode } from 'react';

import type { AuthContextValue } from '@/contexts/auth/types';
import { useAuthManager } from '@/contexts/auth/useAuthManagerRefactored';

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
  return context;
};
