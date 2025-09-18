// src/components/PaymentStatusWrapper.tsx - SIMPLIFIED: AutoLinkingPopup Only
import { useEffect, ReactNode, useRef } from 'react';
import { usePaymentContext } from '@/contexts/PaymentContext';
import { AutoLinkingPopup } from '@/components/popups';
import PaymentVerificationLoader from '@/components/PaymentVerificationLoader';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

interface PaymentStatusWrapperProps {
  children: ReactNode;
}

const PaymentStatusWrapper = ({ children }: PaymentStatusWrapperProps) => {
  const { 
    isPaid, 
    needsPayment, 
    isLoading, 
    needsOrderLinking,
    unlinkedPayments,
    currentUser,
    showAutoLinkPopup,
    setShowAutoLinkPopup,
    refetchPayment 
  } = usePaymentContext();
  
  const prevUnlinkedCountRef = useRef(0);
  
  // ✅ Auto-show AutoLinkingPopup if user needs to link order OR has unlinked payments
  useEffect(() => {
    const currentUnlinkedCount = unlinkedPayments?.length || 0;
    
    // Only trigger if count actually changed
    if (currentUnlinkedCount !== prevUnlinkedCountRef.current) {
      prevUnlinkedCountRef.current = currentUnlinkedCount;
      
      if ((needsOrderLinking || currentUnlinkedCount > 0) && !showAutoLinkPopup && currentUser) {
        // Small delay to let page load first
        const timer = setTimeout(() => {
          setShowAutoLinkPopup(true);
        }, 1000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [needsOrderLinking, unlinkedPayments?.length, showAutoLinkPopup, currentUser, setShowAutoLinkPopup]);
  
  const handleAutoLinked = (linkedPayments: Array<{ order_id: string }>) => {
    console.log('✅ Payments linked successfully:', linkedPayments);
    refetchPayment(); // Refresh payment status
    setShowAutoLinkPopup(false);
  };
  
  // ✅ Show modern loading state
  if (isLoading) {
    return (
      <PaymentVerificationLoader 
        stage="verifying"
        message="Memeriksa Status Pembayaran"
        timeout={6000}
        onTimeout={() => {
          logger.debug('Payment verification timeout in wrapper');
        }}
      />
    );
  }
  
  // ✅ FIXED: Show payment required screen only if truly no payments available
  const hasUnlinkedPayments = unlinkedPayments && unlinkedPayments.length > 0;
  const shouldShowPaymentRequired = needsPayment && !hasUnlinkedPayments && !showAutoLinkPopup;
  
  if (shouldShowPaymentRequired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-lg border p-6 text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            
            <h2 className="text-xl font-bold text-gray-900 mb-2">Pembayaran Diperlukan</h2>
            <p className="text-gray-600 mb-6">
              Anda perlu menyelesaikan pembayaran untuk mengakses aplikasi ini.
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => setShowAutoLinkPopup(true)}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                Saya Sudah Bayar - Link Pembayaran
              </button>
              
              <button
                onClick={() => window.location.href = '/checkout'}
                className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
              >
                Lakukan Pembayaran
              </button>
            </div>
          </div>
        </div>
        
        {/* ✅ AutoLinkingPopup handles both manual and automatic linking */}
        <AutoLinkingPopup
          isOpen={showAutoLinkPopup}
          onClose={() => setShowAutoLinkPopup(false)}
          unlinkedPayments={unlinkedPayments}
          currentUser={currentUser}
          supabaseClient={supabase}
          onSuccess={handleAutoLinked}
        />
      </div>
    );
  }
  
  // ✅ FIXED: Show main app if payment confirmed OR has linkable payments
  if (isPaid || hasUnlinkedPayments) {
    return (
      <>
        {children}
        
        {/* ✅ AutoLinkingPopup for additional payments */}
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
  }
  
  // ✅ Fallback loading state
  return (
    <PaymentVerificationLoader 
      stage="linking"
      message=""
      showProgress={false}
      timeout={6000}
      onTimeout={() => {
        logger.debug('Final fallback timeout');
      }}
    />
  );
};

export default PaymentStatusWrapper;
