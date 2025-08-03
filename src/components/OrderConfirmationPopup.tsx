import { useState, useEffect } from 'react';
import { 
  linkPaymentToUser, 
  getCurrentUser, 
  verifyOrderExists, 
  getRecentUnlinkedOrders 
} from '@/services/authService';

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
    }
  }, [isOpen]);

  const loadRecentOrders = async () => {
    try {
      const orders = await getRecentUnlinkedOrders();
      setRecentOrders(orders);
    } catch (error) {
      console.error('Error loading recent orders:', error);
    }
  };

  // ✅ Verify order exists when user types
  useEffect(() => {
    if (orderId.trim().length >= 10) {
      verifyOrder();
    } else {
      setError('');
    }
  }, [orderId]);

  const verifyOrder = async () => {
    setIsVerifying(true);
    setError('');
    
    try {
      const exists = await verifyOrderExists(orderId.trim());
      if (!exists) {
        setError('Order ID tidak ditemukan. Silakan periksa kembali.');
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

    if (orderId.trim().length < 10) {
      setError('Order ID minimal 10 karakter');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      // ✅ Use authService to get current user
      const user = await getCurrentUser();
      
      if (!user) {
        setError('Silakan login terlebih dahulu');
        return;
      }

      // ✅ Use authService helper function
      const linkedPayment = await linkPaymentToUser(orderId.trim(), user);
      
      if (linkedPayment) {
        onSuccess?.(linkedPayment);
        onClose();
        resetForm();
      }
      
    } catch (error: any) {
      setError(error.message || 'Terjadi kesalahan. Silakan coba lagi.');
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
    // Convert to uppercase and limit length
    const cleanValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15);
    setOrderId(cleanValue);
  };

  const selectRecentOrder = (order: string) => {
    setOrderId(order);
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold mb-4">Hubungkan Pembayaran Anda</h2>
        
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
                  className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
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
            placeholder="Contoh: 250803WIJAUFI"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-1 ${
              error ? 'border-red-300' : 'border-gray-300'
            }`}
            disabled={isLoading}
            maxLength={15}
          />
          
          {/* ✅ Verification indicator */}
          {isVerifying && (
            <div className="absolute right-3 top-2">
              <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          )}
        </div>
        
        {/* ✅ Character counter */}
        <div className="text-right text-xs text-gray-400 mb-3">
          {orderId.length}/15
        </div>
        
        {error && (
          <div className="text-red-600 text-sm mb-4 p-2 bg-red-50 rounded">
            {error}
          </div>
        )}
        
        <div className="flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            disabled={isLoading}
          >
            Batal
          </button>
          
          <button
            onClick={handleConfirmOrder}
            disabled={isLoading || !orderId.trim() || !!error || isVerifying}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
            <span className="mr-2">💡</span>
            <div>
              <strong>Tips:</strong>
              <ul className="mt-1 space-y-1">
                <li>• Order ID bisa ditemukan di pesan WhatsApp konfirmasi</li>
                <li>• Order ID biasanya terdiri dari 10-15 karakter</li>
                <li>• Contoh format: 250803WIJAUFI</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmationPopup;