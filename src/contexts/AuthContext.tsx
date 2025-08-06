// src/contexts/AuthContext.tsx

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';

// PERBAIKAN: Menambahkan 'user' untuk kemudahan akses
interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Ambil sesi awal untuk memeriksa apakah pengguna sudah login sebelumnya.
    // Ini penting agar pengguna tidak perlu login setiap kali membuka aplikasi.
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false); // Selesaikan loading setelah sesi awal diperiksa
    });

    // Dengarkan perubahan status otentikasi (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log(`[AuthContext] Auth state changed: ${_event}`, session);
      setSession(session);
      setUser(session?.user ?? null);
      
      // PERBAIKAN: Hapus `window.location.reload()` dan pembersihan localStorage manual.
      // Reset state di context lain (seperti AssetContext) akan ditangani secara otomatis
      // karena mereka bergantung pada `user` yang sekarang menjadi `null`.
    });

    // Cleanup listener saat komponen di-unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value = { session, user, isLoading };

  // PERBAIKAN: Provider HARUS SELALU me-render children-nya.
  // Jangan pernah melakukan render kondisional yang bisa meng-unmount children.
  // Logika untuk menampilkan loading screen/spinner dipindahkan ke komponen UI.
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};