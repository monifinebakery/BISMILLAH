import { useEffect, ReactNode } from 'react';
import { usePaymentContext } from '@/contexts/PaymentContext'; // ✅ CHANGED: Use context instead of hook
import OrderConfirmationPopup from './OrderConfirmationPopup';

interface PaymentStatusWrapperProps {
  children: ReactNode;
}

const PaymentStatusWrapper = ({ children }: PaymentStatusWrapperProps) => {
  // ✅ FIXED: Use context instead of hook directly
  const { 
    isPaid, 
    needsPayment, 
    isLoading, 
    needsOrderLinking,
    showOrderPopup,
    setShowOrderPopup,
    refetchPayment, // ✅ CHANGED: Use context method name
    hasUnlinkedPayment, // ✅ ADDED: Get this from context
    linkPaymentToUser // ✅ ADDED: Get link function from context
  } = usePaymentContext();

  // ✅ ENHANCED: Auto-show popup with better logic
  useEffect(() => {
    console.log('🔍 PaymentStatusWrapper - State Check:', {
      needsOrderLinking,
      hasUnlinkedPayment,
      showOrderPopup,
      isPaid,
      isLoading
    });

    // ✅ CONDITION 1: User has unlinked payment (higher priority)
    if (hasUnlinkedPayment && !showOrderPopup && !isPaid && !isLoading) {
      console.log('🔄 PaymentStatusWrapper: Auto-showing popup for unlinked payment');
      
      const timer = setTimeout(() => {
        console.log('⏰ PaymentStatusWrapper: Executing auto-show');
        setShowOrderPopup(true);
      }, 2000); // 2 seconds delay
      
      return () => clearTimeout(timer);
    }

    // ✅ CONDITION 2: User needs order linking but no unlinked payment found
    if (needsOrderLinking && !hasUnlinkedPayment && !showOrderPopup && !isPaid && !isLoading) {
      console.log('🔄 PaymentStatusWrapper: Auto-showing popup for manual linking');
      
      const timer = setTimeout(() => {
        console.log('⏰ PaymentStatusWrapper: Executing fallback auto-show');
        setShowOrderPopup(true);
      }, 5000); // 5 seconds delay for fallback
      
      return () => clearTimeout(timer);
    }
  }, [needsOrderLinking, hasUnlinkedPayment, showOrderPopup, isPaid, isLoading, setShowOrderPopup]);

  // ✅ ENHANCED: Handle order linked with better feedback
  const handleOrderLinked = async (payment: any) => {
    console.log('✅ PaymentStatusWrapper: Order linked successfully:', payment);
    
    try {
      // Refresh payment status
      await refetchPayment();
      console.log('✅ PaymentStatusWrapper: Payment status refreshed');
    } catch (error) {
      console.error('❌ PaymentStatusWrapper: Failed to refresh payment status:', error);
    }
  };

  // ✅ DEBUG: Add development info
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('🔍 PaymentStatusWrapper Debug Info:', {
        isPaid,
        needsPayment,
        isLoading,
        needsOrderLinking,
        hasUnlinkedPayment,
        showOrderPopup
      });
    }
  }, [isPaid, needsPayment, isLoading, needsOrderLinking, hasUnlinkedPayment, showOrderPopup]);

  // ✅ Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Memeriksa status pembayaran...</p>
        </div>
      </div>
    );
  }

  // ✅ ENHANCED: Show payment required screen with better UX
  if (needsPayment && !showOrderPopup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            
            <h2 className="text-xl font-bold text-gray-900 mb-2">Pembayaran Diperlukan</h2>
            <p className="text-gray-600 mb-6">
              {hasUnlinkedPayment 
                ? "Kami menemukan pembayaran Anda yang belum terhubung. Silakan hubungkan untuk mengakses aplikasi."
                : "Anda perlu menyelesaikan pembayaran untuk mengakses aplikasi ini."
              }
            </p>
            
            <div className="space-y-3">
              {hasUnlinkedPayment && (
                <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-green-800">
                        <strong>Pembayaran Ditemukan!</strong> Tinggal hubungkan ke akun Anda.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  console.log('🔗 Manual: User clicked connect order button');
                  setShowOrderPopup(true);
                }}
                className={`w-full py-2 px-4 rounded-md transition-colors ${
                  hasUnlinkedPayment 
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {hasUnlinkedPayment 
                  ? 'Hubungkan Pembayaran Saya'
                  : 'Saya Sudah Bayar - Hubungkan Order'
                }
              </button>
              
              {!hasUnlinkedPayment && (
                <button
                  onClick={() => window.location.href = '/checkout'}
                  className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Lakukan Pembayaran
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* ✅ POPUP: Always render popup for this screen */}
        <OrderConfirmationPopup
          isOpen={showOrderPopup}
          onClose={() => {
            console.log('❌ PaymentStatusWrapper: Popup closed (payment required screen)');
            setShowOrderPopup(false);
          }}
          onSuccess={handleOrderLinked}
        />
      </div>
    );
  }

  // ✅ MAIN APP: Show main app if payment confirmed
  if (isPaid) {
    return (
      <>
        {children}
        
        {/* ✅ POPUP: Always render popup for paid users (for manual re-linking if needed) */}
        <OrderConfirmationPopup
          isOpen={showOrderPopup}
          onClose={() => {
            console.log('❌ PaymentStatusWrapper: Popup closed (paid user)');
            setShowOrderPopup(false);
          }}
          onSuccess={handleOrderLinked}
        />
      </>
    );
  }

  // ✅ FALLBACK: Loading state with debug info
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p>Memuat...</p>
        
        {/* ✅ DEBUG: Show state in development */}
        {import.meta.env.DEV && (
          <div className="mt-4 text-xs text-gray-500 bg-gray-100 p-2 rounded">
            Debug: isPaid={isPaid ? 'true' : 'false'}, needsPayment={needsPayment ? 'true' : 'false'}, 
            hasUnlinked={hasUnlinkedPayment ? 'true' : 'false'}
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentStatusWrapper;