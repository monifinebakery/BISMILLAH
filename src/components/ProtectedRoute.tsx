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
  const { isPaid, isLoading } = usePaymentStatus();
  const [user, setUser] = React.useState<any>(null);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [checkingAuth, setCheckingAuth] = React.useState(true);

  React.useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setUser(session.user);
        
        // Check if user is admin by directly checking the role without complex policy
        try {
          const { data } = await supabase
            .from('user_settings')
            .select('role')
            .eq('user_id', session.user.id)
            .single();
            
          setIsAdmin(data?.role === 'admin');
        } catch (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        }
      }
      
      setCheckingAuth(false);
    };
    
    checkAuth();
  }, []);

  // Show loading state while checking authentication
  if (checkingAuth || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Memverifikasi akses...</p>
        </div>
      </div>
    );
  }

  // Redirect to home if authentication is required but user is not logged in
  // The AuthGuard component will handle showing the login form
  if (requireAuth && !user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Redirect to payment page if payment is required but user hasn't paid
  if (requirePayment && !isPaid) {
    return <Navigate to="/payment" state={{ from: location }} replace />;
  }

  // Redirect to dashboard if admin access is required but user is not an admin
  if (adminOnly && !isAdmin) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // If all checks pass, render the children
  return <>{children}</>;
};

export default ProtectedRoute;