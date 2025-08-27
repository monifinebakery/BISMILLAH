// src/components/layout/AppLayout.tsx - SIMPLIFIED: Only AutoLinkingPopup
import React, { useState, useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import { useIsMobile } from "@/hooks/use-mobile";
import { usePaymentContext } from "@/contexts/PaymentContext";
import { useAppLayout } from "@/hooks/useAppLayout";
import { MobileLayout } from "./MobileLayout";
import { DesktopLayout } from "./DesktopLayout";
import { AppLoader } from "@/components/loaders";
import { AutoLinkingPopup } from "@/components/popups";
import { PWAStatus } from "@/components/pwa/PWAInstallButton";
import { logger } from "@/utils/logger";

export const AppLayout = () => {
  const isMobile = useIsMobile();
  const [forceReady, setForceReady] = useState(false);
  
  // ✅ Use ref to prevent infinite loops
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastLogRef = useRef<number>(0);
  
  const { 
    isPaid, 
    isLoading,
    refetchPayment,
    unlinkedPaymentCount,
    needsOrderLinking,
    currentUser,
    unlinkedPayments,
    showAutoLinkPopup,
    setShowAutoLinkPopup,
    autoLinkCount,
  } = usePaymentContext();
  
  // Lazy-loaded Supabase client for popup
  const [supabaseClient, setSupabaseClient] = useState<any>(null);
  
  // ✅ SIMPLIFIED: Auto-show AutoLinkingPopup when needed
  useEffect(() => {
    // Show popup if there are unlinked payments OR user needs order linking
    if ((unlinkedPayments.length > 0 || needsOrderLinking) && !showAutoLinkPopup && currentUser) {
      logger.debug('AppLayout: Auto-showing AutoLinkingPopup', {
        unlinkedCount: unlinkedPayments.length,
        needsOrderLinking,
        currentUser: currentUser.email
      });
      
      const timer = setTimeout(async () => {
        try {
          // Dynamically import supabase client only when needed
          if (!supabaseClient) {
            const mod = await import('@/integrations/supabase/client');
            setSupabaseClient(mod.supabase);
          }
          setShowAutoLinkPopup(true);
        } catch (e) {
          logger.error('Failed to load Supabase client for AutoLinkingPopup', e);
        }
      }, 1500); // Small delay to let page load
      
      return () => clearTimeout(timer);
    }
  }, [unlinkedPayments.length, needsOrderLinking, showAutoLinkPopup, currentUser, setShowAutoLinkPopup, supabaseClient]);
  
  // ✅ Handle successful auto-linking
  const handleAutoLinked = (linkedPayments: any[]) => {
    logger.success('AppLayout: Auto-linked payments:', linkedPayments);
    refetchPayment(); // Refresh payment status
    setShowAutoLinkPopup(false);
  };
  
  // ✅ SIMPLIFIED: Only one timeout effect, no recursive dependencies
  useEffect(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Only set timeout if actually loading
    if (isLoading && !forceReady) {
      logger.debug('AppLayout: Starting 10 second timeout for loading state');
      
      timeoutRef.current = setTimeout(() => {
        logger.warn('AppLayout: Forcing ready after 10 seconds timeout');
        setForceReady(true);
      }, 10000);
    }
    
    // Cleanup on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isLoading, forceReady]);
  
  // ✅ THROTTLED debug logging (max once per 2 seconds)
  useEffect(() => {
    const now = Date.now();
    
    if (now - lastLogRef.current > 2000) {
      lastLogRef.current = now;
      
      logger.debug('AppLayout: State update', {
        isLoading,
        forceReady,
        isPaid,
        unlinkedCount: unlinkedPayments.length,
        needsOrderLinking
      });
    }
  }, [isLoading, forceReady, isPaid, unlinkedPayments.length, needsOrderLinking]);
  
  // ✅ Show loading screen - SIMPLE condition
  if (isLoading && !forceReady) {
    return <AppLoader title="Mengecek status pembayaran..." />;
  }
  
  // ✅ Render auto-link indicator in header/sidebar
  const renderAutoLinkIndicator = () => {
    if (autoLinkCount === 0) return null;
    
    return (
      <button
        onClick={() => setShowAutoLinkPopup(true)}
        className="flex items-center gap-2 px-3 py-2 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg transition-colors text-sm font-medium"
        title={`${autoLinkCount} pembayaran webhook terdeteksi`}
      >
        <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
        <span>{autoLinkCount} Webhook</span>
      </button>
    );
  };
  
  // ✅ Render manual link button for users who need to link payments
  const renderOrderLinkButton = () => {
    if (isPaid) return null;
    
    return (
      <button
        onClick={() => setShowAutoLinkPopup(true)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
      >
        <span>Link Pembayaran</span>
      </button>
    );
  };
  
  // ✅ Simple layout props
  const layoutProps = {
    isPaid,
    renderOrderLinkButton,
    renderAutoLinkIndicator,
    children: <Outlet />
  };
  
  return (
    <>
      {/* ✅ Render layout */}
      {isMobile ? (
        <MobileLayout {...layoutProps} />
      ) : (
        <DesktopLayout {...layoutProps} />
      )}
      
      {/* ✅ ONLY AutoLinkingPopup - handles both manual and automatic linking */}
      <AutoLinkingPopup
        isOpen={showAutoLinkPopup}
        onClose={() => setShowAutoLinkPopup(false)}
        unlinkedPayments={unlinkedPayments}
        currentUser={currentUser}
        supabaseClient={supabaseClient}
        onSuccess={handleAutoLinked}
      />
      
      {/* PWA Debug Status */}
      <PWAStatus />
    </>
  );
};