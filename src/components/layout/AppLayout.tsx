// src/components/layout/AppLayout.tsx - Main Layout Controller
import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useIsMobile } from "@/hooks/use-mobile";
import { usePaymentContext } from "@/contexts/PaymentContext";
import { useAppLayout } from "@/hooks/useAppLayout";
import { MobileLayout } from "./MobileLayout";
import { DesktopLayout } from "./DesktopLayout";
import { AppLoader } from "@/components/loaders";
import { AutoLinkingPopup } from "@/components/popups";
import OrderConfirmationPopup from "@/components/OrderConfirmationPopup"; // ✅ KEEP: Existing location
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";

export const AppLayout = () => {
  const isMobile = useIsMobile();
  const [forceReady, setForceReady] = useState(false);
  
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

  // ✅ Force ready after 10 seconds (reduced from 15)
  useEffect(() => {
    const timer = setTimeout(() => {
      logger.warn('AppLayout: Forcing ready after 10 seconds timeout');
      setForceReady(true);
    }, 10000); // Reduced to 10 seconds
    
    return () => clearTimeout(timer);
  }, []);

  // ✅ Debug loading state
  useEffect(() => {
    if (isLoading) {
      logger.debug('AppLayout: Loading state active, time:', new Date().toISOString());
    }
  }, [isLoading]);

  // ✅ Show loading screen only if really loading and not force ready
  if (isLoading && !forceReady) {
    return <AppLoader title="Mengecek status pembayaran..." />;
  }

  const layoutProps = {
    isPaid,
    renderOrderLinkButton,
    renderAutoLinkIndicator,
    children: <Outlet />
  };

  return (
    <>
      {/* ✅ Render appropriate layout based on device */}
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