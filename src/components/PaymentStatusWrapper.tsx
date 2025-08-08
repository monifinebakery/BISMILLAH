import { useEffect, ReactNode } from 'react';
import { usePaymentStatus } from '@/hooks/usePaymentStatus';
import OrderConfirmationPopup from './OrderConfirmationPopup';

interface PaymentStatusWrapperProps {
  children: ReactNode;
}

const PaymentStatusWrapper = ({ children }: PaymentStatusWrapperProps) => {
  const { 
    isPaid, 
    needsPayment, 
    isLoading, 
    needsOrderLinking,
    showOrderPopup,
    setShowOrderPopup,
    refetch 
  } = usePaymentStatus();

  // ✅ Auto-show popup if user needs to link order
  useEffect(() => {
    if (needsOrderLinking && !showOrderPopup) {
      // Small delay to let page load first
      const timer = setTimeout(() => {
        setShowOrderPopup(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [needsOrderLinking, showOrderPopup, setShowOrderPopup]);

  const handleOrderLinked = (payment: any) => {
    console.log('✅ Order linked successfully:', payment);
    refetch(); // Refresh payment status
  };

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

  // ✅ Show payment required screen
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
              Anda perlu menyelesaikan pembayaran untuk mengakses aplikasi ini.
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => setShowOrderPopup(true)}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                Saya Sudah Bayar - Hubungkan Order
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
        
        <OrderConfirmationPopup
          isOpen={showOrderPopup}
          onClose={() => setShowOrderPopup(false)}
          onSuccess={handleOrderLinked}
        />
      </div>
    );
  }

  // ✅ Show main app if payment confirmed
  if (isPaid) {
    return (
      <>
        {children}
        <OrderConfirmationPopup
          isOpen={showOrderPopup}
          onClose={() => setShowOrderPopup(false)}
          onSuccess={handleOrderLinked}
        />
      </>
    );
  }

  // ✅ Fallback loading state
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p>Memuat...</p>
      </div>
    </div>
  );
};

export default PaymentStatusWrapper;