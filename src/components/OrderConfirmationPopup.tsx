import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { linkPaymentToUser } from '@/services/authService'; // Import dari authService

interface OrderConfirmationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (payment: any) => void;
}

const OrderConfirmationPopup = ({ isOpen, onClose, onSuccess }: OrderConfirmationPopupProps) => {
  const [orderId, setOrderId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConfirmOrder = async () => {
    if (!orderId.trim()) {
      setError('Silakan masukkan Order ID Anda');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('Silakan login terlebih dahulu');
        return;
      }

      // ✅ Use authService helper function
      const linkedPayment = await linkPaymentToUser(orderId.trim(), user);
      
      if (linkedPayment) {
        onSuccess?.(linkedPayment);
        onClose();
        setOrderId('');
      }
      
    } catch (error: any) {
      setError(error.message || 'Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold mb-4">Hubungkan Pembayaran Anda</h2>
        
        <p className="text-gray-600 mb-4">
          Masukkan Order ID untuk menghubungkan pembayaran ke akun Anda:
        </p>
        
        <input
          type="text"
          value={orderId}
          onChange={(e) => setOrderId(e.target.value.toUpperCase())}
          placeholder="Contoh: 250803WIJAUFI"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          disabled={isLoading}
        />
        
        {error && (
          <div className="text-red-600 text-sm mb-4">
            {error}
          </div>
        )}
        
        <div className="flex gap-3">
          <button
            onClick={() => {
              onClose();
              setOrderId('');
              setError('');
            }}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            disabled={isLoading}
          >
            Batal
          </button>
          
          <button
            onClick={handleConfirmOrder}
            disabled={isLoading || !orderId.trim()}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Menghubungkan...' : 'Hubungkan Pembayaran'}
          </button>
        </div>
        
        <div className="mt-4 text-xs text-gray-500">
          💡 Order ID Anda bisa ditemukan di pesan WhatsApp konfirmasi pembayaran.
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmationPopup;