
// Simple loading untuk payment verification
import React from 'react';

interface PaymentLoaderProps {
  variant?: 'card' | 'inline' | 'minimal';
  showHeader?: boolean;
  showProgress?: boolean;
  animate?: boolean;
}

const PaymentLoader: React.FC<PaymentLoaderProps> = ({
  variant = 'card'
}) => {
  if (variant === 'minimal') {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
        <span className="ml-2 text-sm text-gray-600">Loading...</span>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
        <span className="ml-3 text-gray-700">Memuat payment...</span>
      </div>
    );
  }

  // Card variant (default) - simplified
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-6" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Memverifikasi Pembayaran</h2>
        <p className="text-gray-600">Mohon tunggu sebentar...</p>
      </div>
    </div>
  );
};

// ✅ Simple components for different contexts
export const PaymentStatusLoader: React.FC = () => (
  <div className="flex items-center justify-center p-4">
    <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
  </div>
);

export const PaymentGuardLoader: React.FC = () => (
  <div className="flex items-center justify-center p-4">
    <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
  </div>
);

export const PaymentInlineLoader: React.FC = () => (
  <div className="flex items-center justify-center p-4">
    <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
  </div>
);

export const PaymentMinimalLoader: React.FC = () => (
  <div className="flex items-center justify-center p-4">
    <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
  </div>
);

export default PaymentLoader;
