import { useState, useEffect } from 'react';
import { 
  linkPaymentToUser, 
  getCurrentUser, 
  verifyOrderExists, 
  getRecentUnlinkedOrders 
} from '@/lib/authService'; // ✅ Updated import path
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

  // ✅ Load recent unlinked orders for suggestions
  useEffect(() => {
    if (isOpen) {
      loadRecentOrders();
      // Reset form when popup opens
      resetForm();
    }
  }, [isOpen]);

  const loadRecentOrders = async () => {
    try {
      const orders = await getRecentUnlinkedOrders();
      setRecentOrders(orders);
      logger.component('OrderConfirmationPopup', 'Recent unlinked orders loaded:', orders);
    } catch (error) {
      console.error('Error loading recent orders:', error);
    }
  };

  // ✅ Enhanced verification with better debouncing
  useEffect(() => {
    if (orderId.trim().length >= 8) { // Lowered minimum to 8 characters
      const debounceTimer = setTimeout(() => {
        verifyOrder();
      }, 500); // 500ms debounce

      return () => clearTimeout(debounceTimer);
    } else {
      setError('');
      setIsVerifying(false);
    }
  }, [orderId]);

  const verifyOrder = async () => {
    setIsVerifying(true);
    setError('');
    
    try {
      logger.component('OrderConfirmationPopup', 'Verifying order:', orderId.trim());
      const exists = await verifyOrderExists(orderId.trim());
      console.log('🔍 Order exists:', exists);
      
      if (!exists) {
        setError('Order ID tidak ditemukan. Silakan periksa kembali atau hubungi admin.');
      }
    } catch (error) {
      console.error('Error verifying order:', error);
      setError('Gagal memverifikasi Order ID. Silakan coba lagi.');
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

    // Don't proceed if there's an error from verification
    if (error && !error.includes('Gagal memverifikasi')) {
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      console.log('🔍 Getting current user...');
      const user = await getCurrentUser();
      
      if (!user) {
        setError('Silakan login terlebih dahulu');
        setIsLoading(false);
        return;
      }

      console.log('🔍 Current user:', user.email);
      console.log('🔍 Attempting to link order:', orderId.trim());

      // Try to link payment
      const linkedPayment = await linkPaymentToUser(orderId.trim(), user);
      
      if (linkedPayment) {
        console.log('✅ Payment linked successfully:', linkedPayment);
        onSuccess?.(linkedPayment);
        onClose();
        resetForm();
      }
      
    } catch (error: any) {
      console.error('❌ Error linking payment:', error);
      
      // More specific error handling
      if (error.message?.includes('tidak ditemukan')) {
        setError('Order ID tidak ditemukan dalam sistem. Pastikan Order ID benar atau hubungi admin.');
      } else if (error.message?.includes('sudah terhubung')) {
        setError('Order ini sudah terhubung dengan akun lain. Silakan hubungi admin jika ini adalah order Anda.');
      } else {
        setError(error.message || 'Terjadi kesalahan. Silakan coba lagi atau hubungi admin.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setOrderId('');
    setError('');
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

  const selectRecentOrder = (order: string) => {
    setOrderId(order);
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Hubungkan Pembayaran Anda</h2>
        
        <p className="text-gray-600 mb-4">
          Masukkan Order ID untuk menghubungkan pembayaran ke akun Anda:
        </p>
        
        {/* ✅ Recent orders suggestions */}
        {recentOrders.length > 0 && (
          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-2">Order terbaru yang belum terhubung:</p>
            <div className="flex flex-wrap gap-2">
              {recentOrders.map((order) => (
                <button
                  key={order}
                  onClick={() => selectRecentOrder(order)}
                  className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
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
            placeholder="Contoh: 250803GKWROPN"
            className={`w-full px-3 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-1 text-base ${
              error ? 'border-red-300 bg-red-50' : 'border-gray-300'
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
          {orderId.length >= 8 && !isVerifying && !error && (
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
        {orderId.length >= 8 && !isVerifying && !error && (
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
            className="flex-1 px-4 py-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-gray-700 font-medium"
            disabled={isLoading}
          >
            Batal
          </button>
          
          <button
            onClick={handleConfirmOrder}
            disabled={isLoading || !orderId.trim() || orderId.length < 8 || isVerifying || (error && !error.includes('Gagal memverifikasi'))}
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
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 text-xs text-gray-400 bg-gray-100 p-2 rounded font-mono">
            Debug: Order="{orderId}" | Length={orderId.length} | Verifying={isVerifying ? 'Yes' : 'No'}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderConfirmationPopup;