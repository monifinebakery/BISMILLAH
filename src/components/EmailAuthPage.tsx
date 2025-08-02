// Example: How to use EmailAuthPage with proper redirect
// File: src/pages/LoginPage.tsx or wherever you use the auth component

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EmailAuthPage from '@/components/EmailAuthPage';
import { isAuthenticated } from '@/lib/authService';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  // ✅ Check if user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await isAuthenticated();
      if (authenticated) {
        // Already logged in, redirect to dashboard
        navigate('/dashboard');
      }
    };
    checkAuth();
  }, [navigate]);

  // ✅ Handle successful login
  const handleLoginSuccess = () => {
    console.log('Login successful, redirecting to dashboard...');
    
    // Redirect to dashboard or main app
    navigate('/dashboard');
    
    // Or redirect to a specific URL
    // window.location.href = 'https://your-app-domain.com/dashboard';
    
    // Or redirect to the URL they were trying to access before login
    // const redirectUrl = new URLSearchParams(window.location.search).get('redirect');
    // navigate(redirectUrl || '/dashboard');
  };

  return (
    <EmailAuthPage
      appName="Sistem HPP"
      appDescription="Hitung Harga Pokok Penjualan dengan mudah"
      primaryColor="#181D31"
      supportEmail="admin@sistemhpp.com"
      onLoginSuccess={handleLoginSuccess} // ✅ This handles redirect after login
    />
  );
};

export default LoginPage;

// ===============================
// Alternative: Using window.location for external redirect
// ===============================

const handleLoginSuccessExternal = () => {
  console.log('Login successful, redirecting to external domain...');
  
  // For external domain redirect
  window.location.href = 'https://kalkulator.monifine.my.id/dashboard';
  
  // Or with a delay
  setTimeout(() => {
    window.location.href = 'https://kalkulator.monifine.my.id';
  }, 1000);
};

// ===============================
// Alternative: Using React Router with search params
// ===============================

const LoginPageWithRedirectParam: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleLoginSuccess = () => {
    const redirectUrl = searchParams.get('redirect') || '/dashboard';
    console.log('Login successful, redirecting to:', redirectUrl);
    
    // Redirect to the intended destination
    navigate(redirectUrl);
  };

  return (
    <EmailAuthPage
      onLoginSuccess={handleLoginSuccess}
    />
  );
};

// Usage: /login?redirect=/settings
// After login, user will be redirected to /settings

// ===============================
// Alternative: Auth Context Integration
// ===============================

import { useAuth } from '@/contexts/AuthContext';

const LoginPageWithAuthContext: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLoginSuccess = async () => {
    console.log('Login successful, updating auth context...');
    
    // Update auth context if needed
    await login();
    
    // Redirect to dashboard
    navigate('/dashboard');
  };

  return (
    <EmailAuthPage
      onLoginSuccess={handleLoginSuccess}
    />
  );
};

// ===============================
// Alternative: Global redirect function
// ===============================

// utils/redirectAfterLogin.ts
export const redirectAfterLogin = () => {
  // Get intended destination from localStorage or URL params
  const intendedUrl = localStorage.getItem('intendedUrl') || '/dashboard';
  
  // Clear the intended URL
  localStorage.removeItem('intendedUrl');
  
  // Redirect
  if (intendedUrl.startsWith('http')) {
    // External URL
    window.location.href = intendedUrl;
  } else {
    // Internal route
    window.location.pathname = intendedUrl;
  }
};

// Usage
const handleLoginSuccess = () => {
  console.log('Login successful, using global redirect...');
  redirectAfterLogin();
};

// ===============================
// For Next.js users
// ===============================

import { useRouter } from 'next/router';

const NextJSLoginPage: React.FC = () => {
  const router = useRouter();

  const handleLoginSuccess = () => {
    console.log('Login successful, redirecting with Next.js router...');
    
    // Next.js redirect
    router.push('/dashboard');
    
    // Or with query params
    // router.push({
    //   pathname: '/dashboard',
    //   query: { welcome: 'true' }
    // });
  };

  return (
    <EmailAuthPage
      onLoginSuccess={handleLoginSuccess}
    />
  );
};