// src/contexts/AuthContext.tsx

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Ambil sesi awal saat aplikasi dimuat
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    // Dengarkan perubahan status otentikasi (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (_event === 'SIGNED_OUT') {
        // Hapus semua data dari localStorage saat logout
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('hpp_app_')) {
                localStorage.removeItem(key);
            }
        });
        // Reload halaman untuk memastikan semua state kembali ke awal
        window.location.reload();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = { session, isLoading };

  // Jangan render apapun sampai status loading selesai
  if (isLoading) {
    return <div>Loading...</div>; // Atau tampilkan komponen splash screen
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};