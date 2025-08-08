import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { verifyCustomerOrder, linkPaymentToUser } from '@/services/auth';
import { logger } from '@/utils/logger';

interface OrderConfirmationPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const OrderConfirmationPopup = ({ isOpen, onClose }: OrderConfirmationPopupProps) => {
  const { user } = useAuth();
  const [orderId, setOrderId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificationResult, setVerificationResult] = useState<{ success: boolean; message?: string } | null>(null);

  const handleOrderIdChange = useCallback((value: string) => {
    setOrderId(value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20));
  }, []);

  const handleConfirmOrder = useCallback(async () => {
    if (!orderId.trim()) {
      setError('Silakan masukkan Order ID Anda');
      return;
    }

    if (orderId.trim().length < 8) {
      setError('Order ID minimal 8 karakter');
      return;
    }

    if (isLoading) {
      setError('Mohon tunggu verifikasi selesai');
      return;
    }

    if (!verificationResult?.success) {
      setError('Silakan verifikasi Order ID terlebih dahulu');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      logger.component('OrderConfirmationPopup', 'Attempting to link payment for user:', { orderId });

      const linkedPayment = await linkPaymentToUser(orderId.trim(), user);

      if (linkedPayment) {
        logger.success('Payment linked successfully:', {
          orderId: linkedPayment.order_id,
          userId: linkedPayment.user_id,
          email: linkedPayment.email
        });
        toast.success('Pembayaran berhasil terhubung ke akun Anda!');
        onClose();
      }

    } catch (error) {
      logger.error('Error linking payment:', error);
      setError('Gagal menghubungkan pembayaran. Silakan coba lagi.');
      setIsLoading(false);
    }
  }, [orderId, isLoading, verificationResult, user, onClose]);

  useEffect(() => {
    if (isOpen) {
      setOrderId('');
      setError('');
      setVerificationResult(null);
    }
  }, [isOpen]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Hubungkan Pembayaran Anda</h2>
        
        <p className="text-gray-600 mb-4">
          Masukkan Order ID untuk menghubungkan pembayaran ke akun Anda:
        </p>
        
        <div className="relative">
          <input
            type="text"
            value={orderId}
            onChange={(e) => handleOrderIdChange(e.target.value)}
            placeholder="Contoh: 250813BFHUYE"
            className={`w-full px-3 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-1 text-base ${
              error ? 'border-red-300 bg-red-50' : ''
            }`}
            disabled={isLoading}
            maxLength={20}
            autoFocus
          />
          
          {/* Error Message */}
          {error && (
            <div className="text-red-600 text-sm mt-2">
              {error}
            </div>
          )}
          
          {/* Verification indicator */}
          {isLoading && (
            <div className="absolute right-3 top-3">
              <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          )}
        </div>
        
        <div className="flex gap-3 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-3 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors font-medium"
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
              !verificationResult?.success
            }
            className="px-4 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors font-medium"
          >
            Hubungkan Pembayaran
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmationPopup;