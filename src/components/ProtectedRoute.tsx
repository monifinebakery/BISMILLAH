// src/components/ProtectedRoute.tsx - FIXED DUPLICATE AUTH LOGIC
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { usePaymentStatus } from '@/hooks/usePaymentStatus';
import { useAuth } from '@/contexts/AuthContext'; // ✅ Use AuthContext instead of direct Supabase

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
  const { isPaid, isLoading: isPaymentLoading } = usePaymentStatus();
  
  // ✅ FIXED: Use AuthContext instead of direct Supabase calls
  const { user, session, isLoading: isAuthLoading, isReady } = useAuth();
  
  // ✅ DEV BYPASS: Bypass untuk pengembangan
  const isDev = import.meta.env.DEV;
  const devBypassAuth = isDev && import.meta.env.VITE_DEV_BYPASS_AUTH === 'true';
  const devBypassPayment = isDev && import.meta.env.VITE_DEV_BYPASS_PAYMENT === 'true';
  
  const effectiveUser = devBypassAuth ? { id: 'dev-user' } : user;
  const effectiveIsPaid = devBypassPayment || isPaid;
  
  const [isAdmin, setIsAdmin] = React.useState(false);

  // ✅ SIMPLIFIED: Only check admin role when user changes
  React.useEffect(() => {
    if (user && session) {
      // Check admin role from app_metadata JWT
      const userRole = session.user?.app_metadata?.role || user.app_metadata?.role;
      setIsAdmin(userRole === 'admin');
    } else {
      setIsAdmin(false);
    }
  }, [user, session]); // Only depend on user and session from AuthContext

  // ✅ REMOVED: Duplicate auth state listener and manual session checking
  // AuthContext already handles all auth state management

  // ✅ SIMPLIFIED: Show loading state
  if (!isReady || isAuthLoading || isPaymentLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">
            {!isReady ? 'Memuat sistem...' :
             isAuthLoading ? 'Memverifikasi autentikasi...' :
             'Memverifikasi akses...'}
          </p>
        </div>
      </div>
    );
  }

  // ✅ FIXED: Redirect logic using AuthContext user
  if (requireAuth && !user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Redirect to payment page if payment required but user hasn't paid
  if (requirePayment && !isPaid) {
    return <Navigate to="/payment" state={{ from: location }} replace />;
  }

  // Redirect to home if admin access required but user is not admin
  if (adminOnly && !isAdmin) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // All checks passed, render children
  return <>{children}</>;
};

export default ProtectedRoute;