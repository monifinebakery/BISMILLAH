import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

      // Find payment by order_id
      const { data: payment, error: findError } = await supabase
        .from('user_payments')
        .select('*')
        .eq('order_id', orderId.trim())
        .single();

      if (findError || !payment) {
        setError('Order ID tidak ditemukan. Silakan periksa kembali.');
        return;
      }

      if (payment.user_id && payment.user_id !== user.id) {
        setError('Order ini sudah terhubung dengan akun lain.');
        return;
      }

      // Link payment to current user
      const { error: updateError } = await supabase
        .from('user_payments')
        .update({
          user_id: user.id,
          email: user.email
        })
        .eq('order_id', orderId.trim());

      if (updateError) {
        setError('Gagal menghubungkan order. Silakan coba lagi.');
        return;
      }

      onSuccess?.(payment);
      onClose();
      setOrderId('');
      
    } catch (error) {
      setError('Terjadi kesalahan. Silakan coba lagi.');
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