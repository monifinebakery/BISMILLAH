import React from 'react';
import { usePaymentContext } from '@/contexts/PaymentContext';
import MandatoryUpgradeModal from '@/components/MandatoryUpgradeModal';
import { logger } from '@/utils/logger';

interface PaymentGuardProps {
  children: React.ReactNode;
}

const PaymentGuard: React.FC<PaymentGuardProps> = ({ children }) => {
  const { paymentStatus, isLoading, isPaid, error, hasAccess, accessMessage } = usePaymentContext();

  // Error state
  if (error) {
    logger.error('PaymentGuard: Payment status error:', error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-xl border border-orange-200">
          <div className="p-6 text-center">
            <div className="mx-auto flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
              <span className="text-orange-600 text-2xl">💳</span>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Masalah Status Pembayaran
            </h1>
            <p className="text-gray-600 mb-6">
              Tidak dapat memuat status pembayaran. Silakan coba lagi.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => window.location.reload()}
                className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
              >
                Coba Lagi
              </button>
              <button
                onClick={() => window.location.href = '/auth'}
                className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3 rounded-lg transition-colors"
              >
                Kembali ke Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    logger.debug('PaymentGuard: Loading payment status...');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Mengecek Status Pembayaran</h2>
          <p className="text-gray-500">Sedang memverifikasi akses Anda...</p>
        </div>
      </div>
    );
  }

  logger.debug('PaymentGuard: Payment status checked', { paymentStatus, isPaid, hasAccess });

  // Allow access for users with preview access or paid users
  if (hasAccess || isPaid) {
    return (
      <>
        {children}
        <MandatoryUpgradeModal />
      </>
    );
  }

  // If user doesn't have access and isn't paid, show error
  logger.warn('PaymentGuard: User does not have access', { isPaid, hasAccess, accessMessage });
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-xl border border-orange-200">
        <div className="p-6 text-center">
          <div className="mx-auto flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
            <span className="text-orange-600 text-2xl">🔒</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Akses Dibatasi
          </h1>
          <p className="text-gray-600 mb-6">
            {accessMessage || 'Anda tidak memiliki akses ke aplikasi ini.'}
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => window.location.reload()}
              className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
            >
              Coba Lagi
            </button>
            <button
              onClick={() => window.location.href = '/auth'}
              className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3 rounded-lg transition-colors"
            >
              Kembali ke Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentGuard;