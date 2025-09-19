// src/components/AuthGuard.tsx - Simplified
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { logger } from "@/utils/logger";
import { useAuth } from "@/contexts/AuthContext";

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { user, isLoading, isReady } = useAuth();
  const location = useLocation();

  // Development bypass
  if (import.meta.env.DEV && import.meta.env.VITE_DEV_BYPASS_AUTH === "true") {
    logger.info("🔧 [DEV] AuthGuard: Bypassing authentication check");
    return <>{children}</>;
  }

  // While the auth state is loading, show a loading indicator
  if (isLoading || !isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Memuat Autentikasi
          </h2>
          <p className="text-gray-500 text-sm">Memverifikasi sesi...</p>
        </div>
      </div>
    );
  }

  // If the user is not authenticated, redirect to the login page
  if (!user) {
    logger.info(
      `🔒 AuthGuard: No user found, redirecting to /auth from ${location.pathname}`,
    );
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If the user is authenticated, render the children
  logger.info(
    `✅ AuthGuard: User authenticated, rendering protected content at ${location.pathname}`,
  );
  return <>{children}</>;
};

export { AuthGuard };
