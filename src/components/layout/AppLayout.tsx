// src/components/layout/AppLayout.tsx - FIXED: No infinite loops
import React, { useState, useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import { useIsMobile } from "@/hooks/use-mobile";
import { usePaymentContext } from "@/contexts/PaymentContext";
import { useAppLayout } from "@/hooks/useAppLayout";
import { MobileLayout } from "./MobileLayout";
import { DesktopLayout } from "./DesktopLayout";
import { AppLoader } from "@/components/loaders";
import { AutoLinkingPopup } from "@/components/popups";
import OrderConfirmationPopup from "@/components/OrderConfirmationPopup";
import { supabase } from "@/integrations/supabase/client";
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
    showOrderPopup,
    setShowOrderPopup,
    refetchPayment,
    unlinkedPaymentCount,
    needsOrderLinking,
    currentUser,
    unlinkedPayments,
    showAutoLinkPopup,
    setShowAutoLinkPopup,
    autoLinkCount,
  } = usePaymentContext();
  
  const {
    handleOrderLinked,
    handleAutoLinked,
    renderOrderLinkButton,
    renderAutoLinkIndicator
  } = useAppLayout({
    isPaid,
    showOrderPopup,
    setShowOrderPopup,
    refetchPayment,
    unlinkedPaymentCount,
    needsOrderLinking,
    currentUser,
    setShowAutoLinkPopup,
    autoLinkCount
  });

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
  }, [isLoading, forceReady]); // ✅ MINIMAL dependencies

  // ✅ THROTTLED debug logging (max once per 2 seconds)
  useEffect(() => {
    const now = Date.now();
    
    if (now - lastLogRef.current > 2000) { // Throttle to 2 seconds
      lastLogRef.current = now;
      
      logger.debug('AppLayout: State update', {
        isLoading,
        forceReady,
        isPaid
      });
    }
  }, [isLoading, forceReady, isPaid]);

  // ✅ Show loading screen - SIMPLE condition
  if (isLoading && !forceReady) {
    return <AppLoader title="Mengecek status pembayaran..." />;
  }

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

      {/* ✅ Popups */}
      <OrderConfirmationPopup
        isOpen={showOrderPopup}
        onClose={() => setShowOrderPopup(false)}
        onSuccess={handleOrderLinked}
      />
      <AutoLinkingPopup
        isOpen={showAutoLinkPopup}
        onClose={() => setShowAutoLinkPopup(false)}
        unlinkedPayments={unlinkedPayments}
        currentUser={currentUser}
        supabaseClient={supabase}
        onSuccess={handleAutoLinked}
      />
    </>
  );
};