// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { useSupabaseSync } from '@/hooks/useSupabaseSync';

interface AuthContextType {
  session: Session | null;
  isLoading: boolean;
  syncToCloud: (data: any) => Promise<boolean>;
  loadFromCloud: () => Promise<any | null>;
  clearAllLocalData: () => void;
  replaceAllData: (data: any) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { syncToSupabase, loadFromSupabase } = useSupabaseSync();

  // Callback untuk di-pass ke konteks lain agar mereka bisa membersihkan state mereka
  const [clearCallbacks, setClearCallbacks] = useState<(() => void)[]>([]);
  const [replaceAllCallbacks, setReplaceAllCallbacks] = useState<((data: any) => void)[]>([]);

  const registerClearCallback = (callback: () => void) => {
    setClearCallbacks(prev => [...prev, callback]);
  };
  
  const registerReplaceAllCallback = (callback: (data: any) => void) => {
    setReplaceAllCallbacks(prev => [...prev, callback]);
  };

  const clearAllLocalData = useCallback(() => {
    console.log("Clearing all local data...");
    clearCallbacks.forEach(cb => cb()); // Panggil semua callback pembersih
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith('hpp_app_')) {
            localStorage.removeItem(key);
        }
    });
    toast.info("Anda telah logout. Semua data lokal dibersihkan.");
  }, [clearCallbacks]);

  const replaceAllData = useCallback((data: any) => {
    replaceAllCallbacks.forEach(cb => cb(data)); // Panggil semua callback pengganti
    // toast.info("Data lokal berhasil diperbarui dari cloud.");
  }, [replaceAllCallbacks]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setIsLoading(false);
      if (_event === 'SIGNED_IN' || _event === 'INITIAL_SESSION') {
          // Aksi login akan ditangani oleh masing-masing konteks
      } else if (_event === 'SIGNED_OUT') {
          clearAllLocalData();
      }
    });

    // Ambil sesi awal
    supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session)
        setIsLoading(false)
    });

    return () => subscription.unsubscribe();
  }, [clearAllLocalData]);
  
  const syncToCloud = async (data: any): Promise<boolean> => {
      if (!session) {
          toast.error("Anda harus login untuk sinkronisasi.");
          return false;
      }
      return await syncToSupabase(data);
  };

  const loadFromCloud = async (): Promise<any | null> => {
      if (!session) return null;
      const data = await loadFromSupabase();
      if (data) {
          replaceAllData(data);
          toast.success("Data berhasil dimuat dari cloud!");
      }
      return data;
  }

  const value = { 
    session, 
    isLoading, 
    syncToCloud, 
    loadFromCloud, 
    clearAllLocalData, 
    replaceAllData,
    // Kita akan pass fungsi registrasi via konteks lain yg lebih spesifik
    // Ini adalah pola yang lebih canggih, untuk sekarang kita fokus pada pemisahan
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};