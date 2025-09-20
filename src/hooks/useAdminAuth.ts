import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client'; // Pastikan path ini benar

export const useAdminAuth = () => {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      setLoading(true); // Pastikan status loading diatur ulang di awal
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session || !session.user) {
          // Jika tidak ada sesi atau pengguna, pasti bukan admin
          setIsAdmin(false);
          return;
        }

        // REKOMENDASI: Cek peran admin dari app_metadata JWT
        const userRole = session.user.app_metadata?.role;
        setIsAdmin(userRole === 'admin');

        // ALTERNATIF (Jika Anda MUTLAK harus membaca dari user_settings):
        // Jika Anda masih ingin membaca dari user_settings, pastikan RLS di user_settings
        // sudah diperbarui dengan benar seperti yang saya berikan sebelumnya.
        // const { data, error } = await supabase
        //   .from('user_settings')
        //   .select('role')
        //   .eq('user_id', session.user.id)
        //   .single();

        // if (error) {
        //   console.error('Error checking admin status from user_settings:', error);
        //   setIsAdmin(false); // Default to not admin on error
        // } else {
        //   setIsAdmin(data?.role === 'admin');
        // }

      } catch (error) {
        console.error('Error in useAdminAuth check:', error);
        setIsAdmin(false); // Default to not admin on error
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();

    // ✅ DISABLED: onAuthStateChange listener to prevent race conditions with AuthContext
    // Admin status will be checked on initial load and when components re-render due to auth changes
    
    return () => {
      // No cleanup needed since we're not subscribing to auth state changes
    };

  }, []); // Dependensi kosong agar hanya berjalan sekali saat mount

  return { isAdmin, loading };
};