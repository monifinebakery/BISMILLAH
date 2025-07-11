// src/components/ProtectedRoute.tsx

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { usePaymentStatus } from '@/hooks/usePaymentStatus';
import { supabase } from '@/integrations/supabase/client';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requirePayment?: boolean;
  adminOnly?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  requirePayment = false,
  adminOnly = false,
}) => {
  const location = useLocation();
  const { isPaid, isLoading: isPaymentLoading } = usePaymentStatus(); // Rename isLoading for clarity
  const [user, setUser] = React.useState<any>(null);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [checkingAuth, setCheckingAuth] = React.useState(true);

  React.useEffect(() => {
    const checkAuth = async () => {
      setCheckingAuth(true); // Pastikan status loading di awal setiap pemeriksaan
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser(session.user);
          
          // Cek peran admin dari app_metadata JWT (cara yang lebih umum dan direkomendasikan)
          const userRole = session.user.app_metadata?.role;
          setIsAdmin(userRole === 'admin');

          // Alternatif: Cek peran dari tabel user_settings (jika peran admin disimpan di sana)
          // Hati-hati dengan ini karena memerlukan RLS yang benar di user_settings.
          // const { data, error } = await supabase
          //   .from('user_settings')
          //   .select('role')
          //   .eq('user_id', session.user.id)
          //   .single();
          
          // if (error) {
          //   console.error('Error fetching user settings for admin check:', error);
          //   setIsAdmin(false);
          // } else {
          //   setIsAdmin(data?.role === 'admin');
          // }

        } else {
          setUser(null);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Error checking authentication status:', error);
        setUser(null);
        setIsAdmin(false);
      } finally {
        setCheckingAuth(false);
      }
    };
    
    checkAuth();

    // Listener untuk perubahan auth state (misal login/logout)
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
            setUser(session.user);
            setIsAdmin(session.user.app_metadata?.role === 'admin'); // Update admin status on change
        } else {
            setUser(null);
            setIsAdmin(false);
        }
    });

    return () => {
      authListener?.unsubscribe(); // Cleanup listener
    };

  }, []); // Dependensi kosong agar hanya berjalan sekali saat mount

  // Show loading state while checking authentication or payment status
  if (checkingAuth || isPaymentLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Memverifikasi akses...</p>
        </div>
      </div>
    );
  }

  // Redirect ke home jika autentikasi diperlukan tetapi pengguna tidak login
  if (requireAuth && !user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Redirect ke halaman pembayaran jika pembayaran diperlukan tetapi pengguna belum bayar
  if (requirePayment && !isPaid) {
    return <Navigate to="/payment" state={{ from: location }} replace />;
  }

  // Redirect ke home jika akses admin diperlukan tetapi pengguna bukan admin
  if (adminOnly && !isAdmin) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Jika semua pemeriksaan lulus, render children
  return <>{children}</>;
};

export default ProtectedRoute;