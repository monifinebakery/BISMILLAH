// src/components/layout/AppLayout.tsx - SIMPLIFIED: Only AutoLinkingPopup

import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useIsMobile } from "@/hooks/use-mobile";
import { usePaymentContext } from "@/contexts/PaymentContext";
import { useAppLayout } from "@/hooks/useAppLayout";
import { MobileLayout } from "./MobileLayout";
import { DesktopLayout } from "./DesktopLayout";
// AppLoader not needed; PaymentGuard handles initial loading UX
import { AutoLinkingPopup } from "@/components/popups";
import { UpdateNotificationBanner, useUpdateNotification } from '@/components/common/UpdateNotificationBanner';
import { logger } from "@/utils/logger";
import { supabase } from '@/integrations/supabase/client';

export const AppLayout = () => {
  const isMobile = useIsMobile();
  const { 
    updateAvailable,
    updateInfo,
    isVisible,
    checkForUpdate,
    dismissUpdateNotification,
    showUpdateNotification,
  } = useUpdateNotification();
  
  // Check for new version periodically
  useEffect(() => {
    const checkVersion = async () => {
      try {
        // If a refresh is already in progress, skip showing update banner
        try {
          if (localStorage.getItem('appUpdateRefreshing') === '1') return;
        } catch (error) {
          console.warn('AppLayout: unable to read appUpdateRefreshing flag', error);
        }

        const response = await fetch('/version.json?t=' + new Date().getTime(), { cache: 'no-store' });
        const data = await response.json();
        const latestCommit = data.commitHash;
        const currentCommit = import.meta.env.VITE_COMMIT_HASH;

        if (latestCommit && currentCommit && latestCommit !== currentCommit) {
          // Only show banner after Vercel deployment is READY (via Supabase polling)
          // Falls back to immediate banner in dev if polling is disabled
          checkForUpdate({ commitHash: latestCommit });
        }
      } catch (error) {
        console.warn('Failed to check for new version:', error);
      }
    };

    const interval = setInterval(checkVersion, 5 * 60 * 1000); // Check every 5 minutes
    checkVersion(); // Initial check

    return () => clearInterval(interval);
  }, [checkForUpdate]);

  // After full load, clear the in-progress flag so future updates can show
  useEffect(() => {
    try {
      localStorage.removeItem('appUpdateRefreshing');
    } catch (error) {
      console.warn('AppLayout: unable to clear appUpdateRefreshing flag', error);
    }
  }, []);

  // ... (rest of the component remains the same)
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
  
  useEffect(() => {
    if ((unlinkedPayments.length > 0 || needsOrderLinking) && !showAutoLinkPopup && currentUser) {
      logger.debug('AppLayout: Auto-showing AutoLinkingPopup', {
        unlinkedCount: unlinkedPayments.length,
        needsOrderLinking,
        currentUser: currentUser.email
      });
      
      const timer = setTimeout(async () => {
        try {
          if (!supabaseClient) {
            setSupabaseClient(supabase);
          }
          setShowAutoLinkPopup(true);
        } catch (e) {
          logger.error('Failed to load Supabase client for AutoLinkingPopup', e);
        }
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [unlinkedPayments.length, needsOrderLinking, showAutoLinkPopup, currentUser, setShowAutoLinkPopup, supabaseClient]);
  
  const handleAutoLinked = (linkedPayments: any[]) => {
    logger.success('AppLayout: Auto-linked payments:', linkedPayments);
    refetchPayment();
    setShowAutoLinkPopup(false);
  };
  
  // Removed AppLayout-level loader to avoid flicker; rely on PaymentGuard for initial gating.
  
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
  
  const renderOrderLinkButton = () => {
    // Avoid flicker: only show when not loading and we have signals
    const shouldShow = !isPaid && !isLoading && (needsOrderLinking || autoLinkCount > 0);
    if (!shouldShow) return null;

    return (
      <button
        onClick={() => setShowAutoLinkPopup(true)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
      >
        <span>Link Pembayaran</span>
      </button>
    );
  };
  
  const layoutProps = {
    isPaid,
    renderOrderLinkButton,
    renderAutoLinkIndicator,
    children: <Outlet />
  };
  
  return (
    <>
      <UpdateNotificationBanner 
        isVisible={isVisible}
        updateInfo={updateInfo}
        onDismiss={dismissUpdateNotification}
      />

      {isMobile ? (
        <MobileLayout {...layoutProps} />
      ) : (
        <DesktopLayout {...layoutProps} />
      )}
      
      <AutoLinkingPopup
        isOpen={showAutoLinkPopup}
        onClose={() => setShowAutoLinkPopup(false)}
        unlinkedPayments={unlinkedPayments}
        currentUser={currentUser}
        supabaseClient={supabaseClient}
        onSuccess={handleAutoLinked}
      />
    </>
  );
};
