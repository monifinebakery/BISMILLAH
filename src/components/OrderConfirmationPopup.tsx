// src/components/popups/OrderConfirmationPopup.tsx - ENHANCED VERSION
import { useState, useEffect } from 'react';
import { 
  linkPaymentToUser, 
  getCurrentUser, 
  verifyCustomerOrder 
} from '@/services/auth';
import { logger } from '@/utils/logger';
import { usePaymentContext } from '@/contexts/PaymentContext';

interface OrderConfirmationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (payment: any) => void;
}

const OrderConfirmationPopup = ({ isOpen, onClose, onSuccess }: OrderConfirmationPopupProps) => {
  const [orderId, setOrderId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{success: boolean; message: string; data?: any} | null>(null);

  const { refetchPayment, refreshAccessStatus } = usePaymentContext();

  // ✅ Reset form when popup opens
  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  // ✅ Enhanced verification with debouncing
  useEffect(() => {
    if (orderId.trim().length >= 8) {
      const debounceTimer = setTimeout(() => {
        verifyOrder();
      }, 500);

      return () => clearTimeout(debounceTimer);
    } else {
      setError('');
      setVerificationResult(null);
      setIsVerifying(false);
    }
  }, [orderId]);

  const verifyOrder = async () => {
    setIsVerifying(true);
    setError('');
    
    try {
      const user = await getCurrentUser();
      if (!user) {
        setError('Silakan login terlebih dahulu');
        setIsVerifying(false);
        return;
      }

      logger.component('OrderConfirmationPopup', 'Verifying order for user:', { 
        email: user.email, 
        orderId: orderId.trim() 
      });

      const result = await verifyCustomerOrder(user.email, orderId.trim());
      logger.debug('Order verification result:', result);
      
      if (result.success) {
        setVerificationResult({ 
          success: true, 
          message: result.message || 'Order ID valid! Siap untuk dihubungkan.',
          data: result.data
        });
        setError('');
      } else {
        setError(result.message || 'Order ID tidak ditemukan. Silakan periksa kembali atau hubungi admin.');
        setVerificationResult(null);
      }
    } catch (error) {
      logger.error('Error verifying order:', error);
      setError('Gagal memverifikasi Order ID. Silakan coba lagi.');
      setVerificationResult(null);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleConfirmOrder = async () => {
    if (!orderId.trim()) {
      setError('Silakan masukkan Order ID Anda');
      return;
    }

    if (orderId.trim().length < 8) {
      setError('Order ID minimal 8 karakter');
      return;
    }

    if (isVerifying) {
      setError('Mohon tunggu verifikasi selesai.');
      return;
    }

    if (!verificationResult?.success) {
      setError('Silakan verifikasi Order ID terlebih dahulu.');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      logger.component('OrderConfirmationPopup', 'Starting payment linking process');
      const user = await getCurrentUser();
      
      if (!user) {
        setError('Silakan login terlebih dahulu');
        setIsLoading(false);
        return;
      }

      logger.debug('Current user details:', { email: user.email, userId: user.id });
      logger.component('OrderConfirmationPopup', 'Attempting to link order:', orderId.trim());

      // ✅ Enhanced linking with better error handling
      const linkedPayment = await linkPaymentToUser(orderId.trim(), user);
      
      if (linkedPayment) {
        logger.success('✅ Payment linked successfully in popup:', {
          orderId: linkedPayment.order_id,
          userId: linkedPayment.user_id,
          email: linkedPayment.email
        });

        // ✅ Enhanced refresh sequence
        logger.info('Triggering context refresh...');
        
        // First refresh payment status
        await refetchPayment();
        
        // Then refresh access status
        await refreshAccessStatus();
        
        // Wait a bit more for state propagation
        setTimeout(async () => {
          await refreshAccessStatus();
          logger.info('Final access status refresh completed');
        }, 1000);

        // ✅ Success callbacks
        onSuccess?.(linkedPayment);
        
        // ✅ Auto-close popup after short delay
        setTimeout(() => {
          onClose();
          resetForm();
        }, 500);
      }
      
    } catch (error: any) {
      logger.error('❌ Error linking payment in popup:', error);
      
      // ✅ Enhanced error handling
      if (error.message?.includes('tidak ditemukan')) {
        setError('Order ID tidak ditemukan dalam sistem. Pastikan Order ID benar atau hubungi admin.');
      } else if (error.message?.includes('sudah terhubung')) {
        setError('Order ini sudah terhubung dengan akun lain. Silakan hubungi admin jika ini adalah order Anda.');
      } else if (error.message?.includes('sudah memiliki pembayaran')) {
        setError('Akun Anda sudah memiliki pembayaran aktif. Silakan hubungi admin jika ini adalah order baru Anda.');
      } else {
        setError((error instanceof Error ? error.message : String(error)) || 'Terjadi kesalahan. Silakan coba lagi atau hubungi admin.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setOrderId('');
    setError('');
    setVerificationResult(null);
    setIsVerifying(false);
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  const handleOrderIdChange = (value: string) => {
    // Clean input: uppercase, alphanumeric only, max 20 chars
    const cleanValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20);
    setOrderId(cleanValue);
  };

  if (!isOpen) return null;

  return (
    <div className="dialog-overlay-center">
      <div className="dialog-panel w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="dialog-body">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Hubungkan Pembayaran Anda</h2>
        
        <p className="text-gray-600 mb-4">
          Masukkan Order ID untuk menghubungkan pembayaran ke akun Anda:
        </p>
        
        <div className="relative">
          <input
            type="text"
            value={orderId}
            onChange={(e) => handleOrderIdChange(e.target.value)}
            placeholder="Contoh: 250803GKWROPN"
            className={`w-full px-3 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-1 text-base ${
              error ? 'border-red-300 bg-red-50' : 
              verificationResult?.success ? 'border-green-300 bg-green-50' :
              'border-gray-300'
            }`}
            disabled={isLoading}
            maxLength={20}
            autoFocus
          />
          
          {/* ✅ Verification indicator */}
          {isVerifying && (
            <div className="absolute right-3 top-3">
              <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          )}
          
          {/* ✅ Success indicator */}
          {verificationResult?.success && !isVerifying && (
            <div className="absolute right-3 top-3">
              <div className="h-4 w-4 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          )}
        </div>
        
        {/* ✅ Character counter */}
        <div className="text-right text-xs text-gray-400 mb-3">
          {orderId.length}/20
        </div>
        
        {/* ✅ Enhanced error display */}
        {error && (
          <div className="text-red-600 text-sm mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-start">
              <svg className="w-4 h-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}
        
        {/* ✅ Success state preview */}
        {verificationResult?.success && (
          <div className="text-green-600 text-sm mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center">
              <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>{verificationResult.message}</span>
            </div>
            {verificationResult.data?.order_id && (
              <div className="mt-2 text-xs text-green-700">
                Order ID: {verificationResult.data.order_id}
              </div>
            )}
          </div>
        )}
        
        <div className="flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-gray-700 font-medium"
            disabled={isLoading}
          >
            Batal
          </button>
          
          <button
            onClick={handleConfirmOrder}
            disabled={
              isLoading || 
              !orderId.trim() || 
              orderId.length < 8 || 
              isVerifying || 
              !verificationResult?.success
            }
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Menghubungkan...
              </span>
            ) : (
              'Hubungkan Pembayaran'
            )}
          </button>
        </div>
        
        <div className="mt-4 text-xs text-gray-500 bg-gray-50 p-3 rounded">
          <div className="flex items-start">
            <span className="mr-2 text-base">💡</span>
            <div>
              <strong>Tips:</strong>
              <ul className="mt-1 space-y-1">
                <li>• Order ID bisa ditemukan di pesan WhatsApp konfirmasi pembayaran</li>
                <li>• Order ID biasanya terdiri dari 8-15 karakter huruf dan angka</li>
                <li>• Contoh format: 250803GKWROPN atau 250719VTNIHIQ</li>
                <li>• Pastikan copy-paste dengan benar tanpa spasi</li>
              </ul>
            </div>
          </div>
        </div>

        {/* ✅ Debug info (only in development) */}
        {import.meta.env.DEV && (
          <div className="mt-4 text-xs text-gray-400 bg-gray-100 p-2 rounded font-mono">
            Debug: Order="{orderId}" | Length={orderId.length} | Verifying={isVerifying ? 'Yes' : 'No'} | Verified={verificationResult?.success ? 'Yes' : 'No'} | Loading={isLoading ? 'Yes' : 'No'}
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmationPopup;