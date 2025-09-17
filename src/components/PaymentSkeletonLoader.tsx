// src/components/PaymentSkeletonLoader.tsx
// Skeleton loading untuk payment verification yang smooth
import React from 'react';

interface PaymentSkeletonLoaderProps {
  variant?: 'card' | 'inline' | 'minimal';
  showHeader?: boolean;
  showProgress?: boolean;
  animate?: boolean;
}

const PaymentSkeletonLoader: React.FC<PaymentSkeletonLoaderProps> = ({
  variant = 'card',
  showHeader = true,
  showProgress = true,
  animate = true
}) => {
  const pulseClass = animate ? 'animate-pulse' : '';

  if (variant === 'minimal') {
    return (
      <div className="flex items-center gap-3 p-4">
        <div className={`w-6 h-6 bg-gray-200 rounded-full ${pulseClass}`}></div>
        <div className={`h-4 bg-gray-200 rounded flex-1 ${pulseClass}`}></div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-4 p-6">
        <div className={`w-12 h-12 bg-gray-200 rounded-full ${pulseClass}`}></div>
        <div className="flex-1 space-y-2">
          <div className={`h-4 bg-gray-200 rounded w-3/4 ${pulseClass}`}></div>
          <div className={`h-3 bg-gray-200 rounded w-1/2 ${pulseClass}`}></div>
        </div>
      </div>
    );
  }

  // Card variant (default)
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-md w-full bg-white/80 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl">
        <div className="p-8">
          {/* Header Skeleton */}
          {showHeader && (
            <div className="text-center mb-6">
              <div className={`mx-auto w-16 h-16 bg-gray-200 rounded-full mb-4 ${pulseClass}`}></div>
              <div className={`h-6 bg-gray-200 rounded mx-auto w-48 mb-2 ${pulseClass}`}></div>
              <div className={`h-4 bg-gray-200 rounded mx-auto w-32 ${pulseClass}`}></div>
            </div>
          )}

          {/* Progress Skeleton */}
          {showProgress && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <div className={`h-3 bg-gray-200 rounded w-16 ${pulseClass}`}></div>
                <div className={`h-3 bg-gray-200 rounded w-12 ${pulseClass}`}></div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div className={`h-2 bg-gray-300 rounded-full w-1/3 ${pulseClass}`}></div>
              </div>
            </div>
          )}

          {/* Info Cards Skeleton */}
          <div className="space-y-3 mb-6">
            <div className={`h-12 bg-gray-200 rounded-lg ${pulseClass}`}></div>
            <div className={`h-12 bg-gray-200 rounded-lg ${pulseClass}`}></div>
            <div className={`h-12 bg-gray-200 rounded-lg ${pulseClass}`}></div>
          </div>

          {/* Bottom Action Skeleton */}
          <div className="text-center">
            <div className={`h-10 bg-gray-200 rounded-lg mb-3 ${pulseClass}`}></div>
            <div className={`h-4 bg-gray-200 rounded mx-auto w-24 ${pulseClass}`}></div>
          </div>

          {/* Stage Indicators */}
          <div className="flex justify-center gap-2 mt-4">
            {[1, 2, 3].map((index) => (
              <div 
                key={index}
                className={`w-2 h-2 bg-gray-200 rounded-full ${pulseClass}`}
                style={{ animationDelay: `${index * 200}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ✅ Komponen khusus untuk different contexts
export const PaymentStatusSkeleton: React.FC = () => (
  <PaymentSkeletonLoader 
    variant="card" 
    showHeader={true} 
    showProgress={true}
  />
);

export const PaymentGuardSkeleton: React.FC = () => (
  <PaymentSkeletonLoader 
    variant="card" 
    showHeader={true} 
    showProgress={false}
  />
);

export const PaymentInlineSkeleton: React.FC = () => (
  <PaymentSkeletonLoader 
    variant="inline" 
    showHeader={false} 
    showProgress={false}
  />
);

export const PaymentMinimalSkeleton: React.FC = () => (
  <PaymentSkeletonLoader 
    variant="minimal" 
    showHeader={false} 
    showProgress={false}
  />
);

export default PaymentSkeletonLoader;