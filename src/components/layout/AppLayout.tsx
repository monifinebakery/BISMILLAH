// src/components/layout/AppLayout.tsx - Enhanced Debug Version
import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useIsMobile } from "@/hooks/use-mobile";
import { usePaymentContext } from "@/contexts/PaymentContext";
import { useAppLayout } from "@/hooks/useAppLayout";
import { useUserSettings } from "@/contexts/UserSettingsContext";
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
  const [debugInfo, setDebugInfo] = useState<any>({});
  
  // ✅ Get UserSettings state for debugging
  const { settings, isLoading: userSettingsLoading } = useUserSettings();
  
  // ✅ Get PaymentContext state
  const { 
    isPaid, 
    isLoading: paymentLoading,
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
    hasAccess,
    accessMessage,
  } = usePaymentContext();
  
  // ✅ Calculate combined loading state
  const isLoading = paymentLoading || userSettingsLoading;
  
  // ✅ Debug all loading states
  useEffect(() => {
    const currentDebugInfo = {
      timestamp: new Date().toISOString(),
      paymentLoading,
      userSettingsLoading,
      combinedIsLoading: isLoading,
      isPaid,
      hasAccess,
      accessMessage,
      currentUser: !!currentUser,
      forceReady,
      autoLinkCount,
      unlinkedPaymentCount
    };
    
    setDebugInfo(currentDebugInfo);
    
    logger.debug('AppLayout: Loading state debug', currentDebugInfo);
    
    // Log specific issues
    if (paymentLoading) {
      logger.warn('AppLayout: PaymentContext still loading');
    }
    
    if (userSettingsLoading) {
      logger.warn('AppLayout: UserSettings still loading');
    }
    
    if (isLoading && !forceReady) {
      logger.info('AppLayout: Showing loader due to loading state');
    }
    
  }, [
    paymentLoading, 
    userSettingsLoading, 
    isLoading, 
    isPaid, 
    hasAccess, 
    accessMessage,
    currentUser,
    forceReady,
    autoLinkCount,
    unlinkedPaymentCount
  ]);
  
  // ✅ Enhanced timeout with more detailed logging
  useEffect(() => {
    let timeoutCount = 0;
    
    const logProgress = () => {
      timeoutCount += 1;
      const secondsElapsed = timeoutCount * 2;
      
      logger.debug(`AppLayout: Loading timeout progress - ${secondsElapsed}s elapsed`, {
        secondsElapsed,
        stillLoading: isLoading,
        paymentLoading,
        userSettingsLoading,
        forceReady
      });
      
      // Force ready after 10 seconds
      if (secondsElapsed >= 10) {
        logger.warn('AppLayout: Forcing ready after 10 seconds timeout', {
          finalState: {
            paymentLoading,
            userSettingsLoading,
            combinedIsLoading: isLoading,
            isPaid,
            hasAccess
          }
        });
        setForceReady(true);
        return;
      }
      
      // Continue logging if still loading
      if (isLoading && !forceReady) {
        setTimeout(logProgress, 2000);
      }
    };
    
    // Start timeout logging if loading
    if (isLoading && !forceReady) {
      logger.info('AppLayout: Starting loading timeout monitoring');
      setTimeout(logProgress, 2000);
    }
    
  }, [isLoading, forceReady, paymentLoading, userSettingsLoading]);
  
  // ✅ Log when we decide to show loader
  useEffect(() => {
    if (isLoading && !forceReady) {
      logger.info('AppLayout: Showing AppLoader', {
        reason: 'Still loading',
        paymentLoading,
        userSettingsLoading,
        timeoutWillTriggerIn: '10 seconds'
      });
    } else {
      logger.info('AppLayout: Not showing loader', {
        isLoading,
        forceReady,
        paymentLoading,
        userSettingsLoading
      });
    }
  }, [isLoading, forceReady, paymentLoading, userSettingsLoading]);
  
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
  
  // ✅ Show loading screen with debug info in development
  if (isLoading && !forceReady) {
    return (
      <AppLoader 
        title="Mengecek status pembayaran..." 
        subtitle={
          process.env.NODE_ENV === 'development' 
            ? `Debug: Payment(${paymentLoading}) | Settings(${userSettingsLoading})`
            : undefined
        }
      />
    );
  }
  
  // ✅ Log when layout is rendered
  useEffect(() => {
    if (!isLoading || forceReady) {
      logger.success('AppLayout: Layout rendered successfully', {
        isMobile,
        isPaid,
        hasAccess,
        forceReady: forceReady || false,
        loadingBypassed: forceReady
      });
    }
  }, [isLoading, forceReady, isMobile, isPaid, hasAccess]);
  
  const layoutProps = {
    isPaid,
    renderOrderLinkButton,
    renderAutoLinkIndicator,
    children: <Outlet />
  };
  
  return (
    <>
      {/* ✅ Debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '8px',
          fontSize: '10px',
          zIndex: 9999,
          maxWidth: '300px'
        }}>
          <div>Loading Debug:</div>
          <div>Payment: {paymentLoading ? '🔄' : '✅'}</div>
          <div>Settings: {userSettingsLoading ? '🔄' : '✅'}</div>
          <div>Force Ready: {forceReady ? '⚡' : '⏳'}</div>
          <div>Access: {hasAccess ? '✅' : '❌'}</div>
        </div>
      )}
      
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

// ===== UNTUK DEBUGGING LEBIH DETAIL =====

// Tambahkan ini ke AppLoader component jika perlu
// src/components/loaders/AppLoader.tsx
/*
interface AppLoaderProps {
  title?: string;
  subtitle?: string; // New prop for debug info
}

export const AppLoader: React.FC<AppLoaderProps> = ({ 
  title = "Loading...", 
  subtitle 
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 text-lg">{title}</p>
        {subtitle && (
          <p className="text-gray-400 text-sm mt-2">{subtitle}</p>
        )}
      </div>
    </div>
  );
};
*/