import { useState, useEffect } from 'react';
import { 
  linkPaymentToUser, 
  getCurrentUser, 
  verifyOrderExists, 
  getRecentUnlinkedOrders 
} from '@/lib/authService'; // ✅ Fixed import path
import { logger } from '@/utils/logger';

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
  const [recentOrders, setRecentOrders] = useState<string[]>([]);
  const [verificationResult, setVerificationResult] = useState<'unknown' | 'valid' | 'invalid'>('unknown');

  // ✅ Load recent unlinked orders for suggestions
  useEffect(() => {
    if (isOpen) {
      loadRecentOrders();
      resetForm();
    }
  }, [isOpen]);

  const loadRecentOrders = async () => {
    try {
      const orders = await getRecentUnlinkedOrders();
      setRecentOrders(orders);
      logger.component('OrderConfirmationPopup', 'Recent unlinked orders loaded:', orders);
    } catch (error) {
      logger.error('Error loading recent orders:', error);
      // Don't show error to user for this, it's just a nice-to-have feature
    }
  };

  // ✅ Enhanced verification with better debouncing and state management
  useEffect(() => {
    if (orderId.trim().length >= 8) {
      const debounceTimer = setTimeout(() => {
        verifyOrder();
      }, 800); // Increased to 800ms for better UX

      return () => clearTimeout(debounceTimer);
    } else {
      setError('');
      setIsVerifying(false);
      setVerificationResult('unknown');
    }
  }, [orderId]);

  const verifyOrder = async () => {
    if (isLoading) return; // Don't verify while linking
    
    setIsVerifying(true);
    setError('');
    setVerificationResult('unknown');
    
    try {
      logger.component('OrderConfirmationPopup', 'Verifying order:', orderId.trim());
      const exists = await verifyOrderExists(orderId.trim());
      logger.debug('Order verification result:', { orderId: orderId.trim(), exists });
      
      if (exists) {
        setVerificationResult('valid');
        setError(''); // Clear any previous errors
      } else {
        setVerificationResult('invalid');
        setError('Order ID tidak ditemukan. Pastikan Order ID benar atau hubungi admin.');
      }
    } catch (error) {
      logger.error('Error verifying order:', error);
      setVerificationResult('invalid');
      setError('Gagal memverifikasi Order ID. Silakan coba lagi atau periksa koneksi internet.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleConfirmOrder = async () => {
    // Basic validation
    if (!orderId.trim()) {
      setError('Silakan masukkan Order ID Anda');
      return;
    }

    if (orderId.trim().length < 8) {
      setError('Order ID minimal 8 karakter');
      return;
    }

    // Don't proceed if verification failed (unless it's a network error)
    if (verificationResult === 'invalid' && !error.includes('Gagal memverifikasi')) {
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      logger.component('OrderConfirmationPopup', 'Getting current user...');
      const user = await getCurrentUser();
      
      if (!user) {
        setError('Sesi Anda sudah berakhir. Silakan login kembali.');
        setIsLoading(false);
        return;
      }

      logger.debug('Current user details:', { email: user.email });
      logger.component('OrderConfirmationPopup', 'Attempting to link order:', orderId.trim());

      // Try to link payment
      const linkedPayment = await linkPaymentToUser(orderId.trim(), user);
      
      if (linkedPayment) {
        logger.success('Payment linked successfully:', linkedPayment);
        
        // Show success message briefly
        setError('');
        
        // Call success callback and close
        onSuccess?.(linkedPayment);
        onClose();
        resetForm();
      }
      
    } catch (error: any) {
      logger.error('❌ Error linking payment:', error);
      
      // ✅ ENHANCED: Better error handling with specific messages
      if (error.message?.includes('tidak ditemukan')) {
        setError('Order ID tidak ditemukan dalam sistem. Pastikan Order ID benar dan pembayaran sudah berhasil.');
      } else if (error.message?.includes('sudah terhubung dengan akun lain')) {
        setError('Order ini sudah terhubung dengan akun lain. Jika ini adalah order Anda, silakan hubungi admin.');
      } else if (error.message?.includes('terdaftar dengan email lain')) {
        setError('Order ini terdaftar dengan email yang berbeda. Pastikan Anda login dengan email yang benar.');
      } else if (error.message?.includes('sudah memiliki pembayaran')) {
        setError('Akun Anda sudah memiliki pembayaran aktif. Silakan hubungi admin jika ada masalah.');
      } else if (error.message?.includes('belum dibayar')) {
        setError('Order ini belum dibayar atau pembayaran belum berhasil diproses.');
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        setError('Koneksi internet bermasalah. Silakan periksa koneksi dan coba lagi.');
      } else {
        setError(error.message || 'Terjadi kesalahan yang tidak diketahui. Silakan coba lagi atau hubungi admin.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setOrderId('');
    setError('');
    setIsVerifying(false);
    setVerificationResult('unknown');
  };

  const handleClose = () => {
    onClose();
    // Reset form after a short delay to avoid visual glitch
    setTimeout(resetForm, 150);
  };

  const handleOrderIdChange = (value: string) => {
    // Clean input: uppercase, alphanumeric only, max 20 chars
    const cleanValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20);
    setOrderId(cleanValue);
    
    // Reset verification state when input changes
    if (cleanValue !== orderId) {
      setVerificationResult('unknown');
      setError('');
    }
  };

  const selectRecentOrder = (order: string) => {
    setOrderId(order);
    setError('');
    setVerificationResult('unknown');
  };

  // ✅ HELPER: Determine if form is ready for submission
  const isFormReady = !isLoading && 
                     !isVerifying && 
                     orderId.trim().length >= 8 && 
                     (verificationResult === 'valid' || error.includes('Gagal memverifikasi'));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">Hubungkan Pembayaran</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <p className="text-gray-600 mb-4">
          Masukkan Order ID untuk menghubungkan pembayaran ke akun Anda:
        </p>
        
        {/* ✅ Recent orders suggestions */}
        {recentOrders.length > 0 && (
          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-2">Order terbaru yang belum terhubung:</p>
            <div className="flex flex-wrap gap-2">
              {recentOrders.slice(0, 3).map((order) => ( // Limit to 3 suggestions
                <button
                  key={order}
                  onClick={() => selectRecentOrder(order)}
                  className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                >
                  {order}
                </button>
              ))}
            </div>
          </div>
        )}
        
        <div className="relative">
          <input
            type="text"
            value={orderId}
            onChange={(e) => handleOrderIdChange(e.target.value)}
            placeholder="Contoh: 250813BFGHUYE"
            className={`w-full px-3 py-3 pr-12 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-1 text-base transition-colors ${
              error ? 'border-red-300 bg-red-50' : 
              verificationResult === 'valid' ? 'border-green-300 bg-green-50' : 
              'border-gray-300'
            }`}
            disabled={isLoading}
            maxLength={20}
            autoFocus
          />
          
          {/* ✅ Status indicators */}
          {isVerifying && (
            <div className="absolute right-3 top-3">
              <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          )}
          
          {!isVerifying && verificationResult === 'valid' && (
            <div className="absolute right-3 top-3">
              <div className="h-5 w-5 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          )}
          
          {!isVerifying && verificationResult === 'invalid' && (
            <div className="absolute right-3 top-3">
              <div className="h-5 w-5 bg-red-500 rounded-full flex items-center justify-center">
                <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
          )}
        </div>
        
        {/* ✅ Character counter */}
        <div className="text-right text-xs text-gray-400 mb-3">
          {orderId.length}/20
        </div>
        
        {/* ✅ Enhanced status messages */}
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
        
        {!error && verificationResult === 'valid' && (
          <div className="text-green-600 text-sm mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center">
              <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Order ID valid! Siap untuk dihubungkan.</span>
            </div>
          </div>
        )}
        
        <div className="flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-gray-700 font-medium disabled:opacity-50"
            disabled={isLoading}
          >
            Batal
          </button>
          
          <button
            onClick={handleConfirmOrder}
            disabled={!isFormReady}
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
        
        {/* ✅ Enhanced tips section */}
        <div className="mt-4 text-xs text-gray-500 bg-gray-50 p-3 rounded-md">
          <div className="flex items-start">
            <span className="mr-2 text-base">💡</span>
            <div>
              <strong>Tips:</strong>
              <ul className="mt-1 space-y-1">
                <li>• Order ID ada di pesan WhatsApp konfirmasi pembayaran</li>
                <li>• Format: 8-15 karakter huruf dan angka (contoh: 250813BFGHUYE)</li>
                <li>• Pastikan pembayaran sudah berhasil sebelum menghubungkan</li>
                <li>• Jika ada masalah, screenshot Order ID dan hubungi admin</li>
              </ul>
            </div>
          </div>
        </div>

        {/* ✅ Debug info (only in development) */}
        {import.meta.env.DEV && (
          <div className="mt-4 text-xs text-gray-400 bg-gray-100 p-2 rounded font-mono">
            <div>Order: "{orderId}" | Length: {orderId.length}</div>
            <div>Status: {isVerifying ? 'Verifying' : verificationResult} | Loading: {isLoading ? 'Yes' : 'No'}</div>
            <div>Form Ready: {isFormReady ? 'Yes' : 'No'}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderConfirmationPopup;