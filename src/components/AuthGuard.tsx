import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Navigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { User, Session } from '@supabase/supabase-js';
import PaymentGuard from './PaymentGuard';
import { cleanupAuthState, validateAuthSession } from '@/lib/authUtils';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [redirectToAuth, setRedirectToAuth] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session and validate it
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          // No session found, clean up any stale auth data
          cleanupAuthState();
          setSession(null);
          setUser(null);
        } else {
          // Session exists, validate it
          const isValid = await validateAuthSession();
        }
      } catch (error) {
        console.error('Error checking session:', error);
        cleanupAuthState();
        setSession(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkSession();

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Handle redirect logic in useEffect to prevent infinite re-renders
  useEffect(() => {
    if (!user && location.pathname !== '/auth' && !loading && !redirectToAuth) {
      setRedirectToAuth(true);
    }
  }, [user, location.pathname, loading, redirectToAuth]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (redirectToAuth) {
    // Redirect to the email auth page
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
};

export default AuthGuard;