// components/promo/PromoLoadingSkeleton.tsx
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Loader2, Calculator, Package, TrendingUp } from 'lucide-react';

// 🎨 Base Skeleton Component
const SkeletonBox: React.FC<{
  className?: string;
  animate?: boolean;
}> = ({ className = "", animate = true }) => (
  <div 
    className={`bg-gray-200 rounded ${animate ? 'animate-pulse' : ''} ${className}`}
  />
);

// 📊 Skeleton for metrics/stats
const MetricSkeleton: React.FC = () => (
  <div className="p-4 bg-gradient-to-br from-gray-100 to-gray-50 rounded-xl border border-gray-200">
    <div className="flex items-center justify-center gap-2 mb-2">
      <SkeletonBox className="w-4 h-4 rounded" />
      <SkeletonBox className="w-16 h-3" />
    </div>
    <SkeletonBox className="w-20 h-6 mx-auto" />
  </div>
);

// 🏠 Header Loading Skeleton  
export const PromoHeaderSkeleton: React.FC = () => (
  <div className="mb-8">
    <div className="flex items-center gap-4 mb-4">
      <div className="p-4 bg-gradient-to-r from-gray-300 to-gray-400 rounded-xl animate-pulse">
        <Calculator className="h-8 w-8 text-gray-500" />
      </div>
      <div className="space-y-2">
        <SkeletonBox className="w-80 h-8" />
        <SkeletonBox className="w-60 h-4" />
      </div>
    </div>
  </div>
);

// 📦 Product Selection Loading
export const ProductSelectionSkeleton: React.FC = () => (
  <Card className="border-0 shadow-xl bg-white/90">
    <CardHeader className="bg-gradient-to-r from-gray-400 to-gray-500 text-white rounded-t-lg p-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-white/20 rounded-lg">
          <Package className="h-5 w-5" />
        </div>
        <SkeletonBox className="w-40 h-6 bg-white/30" animate={false} />
      </div>
      <SkeletonBox className="w-56 h-4 bg-white/20 mt-2" animate={false} />
    </CardHeader>
    
    <CardContent className="p-6 space-y-4">
      {/* Select skeleton */}
      <SkeletonBox className="w-full h-12 rounded-md" />
      
      {/* Metrics skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricSkeleton />
        <MetricSkeleton />
        <MetricSkeleton />
      </div>
    </CardContent>
  </Card>
);

// ⚙️ Configuration Loading
export const PromoConfigurationSkeleton: React.FC = () => (
  <Card className="border-0 shadow-xl bg-white/90">
    <CardHeader className="bg-gradient-to-r from-gray-400 to-gray-500 text-white rounded-t-lg p-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-white/20 rounded-lg">
          <Calculator className="h-5 w-5" />
        </div>
        <SkeletonBox className="w-48 h-6 bg-white/30" animate={false} />
      </div>
    </CardHeader>
    
    <CardContent className="p-6 space-y-6">
      <div>
        <SkeletonBox className="w-20 h-4 mb-2" />
        <SkeletonBox className="w-full h-12 rounded-md" />
      </div>
      
      <div>
        <SkeletonBox className="w-32 h-4 mb-3" />
        <div className="p-4 bg-gray-100 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <SkeletonBox className="w-10 h-10 rounded-lg" />
            <div className="flex items-center gap-2 flex-1">
              <SkeletonBox className="w-20 h-10" />
              <SkeletonBox className="w-8 h-6" />
              <SkeletonBox className="w-16 h-4" />
            </div>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

// 📈 Results Loading
export const ResultsSkeleton: React.FC = () => (
  <Card className="border-0 shadow-xl bg-white/90">
    <CardHeader className="bg-gradient-to-r from-gray-400 to-gray-500 text-white rounded-t-lg p-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-white/20 rounded-lg">
          <TrendingUp className="h-5 w-5" />
        </div>
        <SkeletonBox className="w-36 h-6 bg-white/30" animate={false} />
      </div>
    </CardContent>
    
    <CardContent className="p-6 space-y-6">
      {/* Metrics grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-6 bg-gradient-to-br from-gray-100 to-gray-50 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <SkeletonBox className="w-8 h-8 rounded-lg" />
              <SkeletonBox className="w-20 h-4" />
            </div>
            <SkeletonBox className="w-4 h-4 rounded" />
          </div>
          <SkeletonBox className="w-24 h-8" />
        </div>
        
        <div className="p-6 bg-gradient-to-br from-gray-100 to-gray-50 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <SkeletonBox className="w-8 h-8 rounded-lg" />
              <SkeletonBox className="w-24 h-4" />
            </div>
          </div>
          <SkeletonBox className="w-16 h-8" />
          <SkeletonBox className="w-28 h-3 mt-1" />
        </div>
      </div>
      
      {/* Save section */}
      <div className="flex gap-3">
        <SkeletonBox className="flex-1 h-12 rounded-md" />
        <SkeletonBox className="w-28 h-12 rounded-md" />
      </div>
    </CardContent>
  </Card>
);

// 📋 Table Loading  
export const PromoHistorySkeleton: React.FC = () => (
  <Card className="border-0 shadow-xl bg-white/90">
    <CardHeader className="bg-gradient-to-r from-gray-400 to-gray-500 text-white rounded-t-lg p-6">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/20 rounded-lg">
              <Package className="h-5 w-5" />
            </div>
            <SkeletonBox className="w-48 h-6 bg-white/30" animate={false} />
          </div>
          <SkeletonBox className="w-40 h-4 bg-white/20" animate={false} />
        </div>
        <SkeletonBox className="w-32 h-10 bg-red-400 rounded" animate={false} />
      </div>
    </CardHeader>
    
    <CardContent className="p-6">
      <div className="space-y-4">
        {/* Table header */}
        <div className="grid grid-cols-6 gap-4 p-4 bg-gradient-to-r from-gray-100 to-gray-50 rounded">
          <SkeletonBox className="w-6 h-4" />
          <SkeletonBox className="w-20 h-4" />
          <SkeletonBox className="w-16 h-4" />
          <SkeletonBox className="w-20 h-4" />
          <SkeletonBox className="w-24 h-4" />
          <SkeletonBox className="w-16 h-4" />
        </div>
        
        {/* Table rows */}
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="grid grid-cols-6 gap-4 p-4 border-b border-gray-100">
            <SkeletonBox className="w-4 h-4" />
            <SkeletonBox className="w-32 h-4" />
            <SkeletonBox className="w-24 h-4" />
            <SkeletonBox className="w-20 h-4" />
            <SkeletonBox className="w-24 h-4" />
            <SkeletonBox className="w-16 h-4" />
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

// 🎯 Comprehensive Loading State
export const PromoCalculatorSkeleton: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-orange-100 p-4 sm:p-6">
    <PromoHeaderSkeleton />
    
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <div className="space-y-6">
        <ProductSelectionSkeleton />
        <PromoConfigurationSkeleton />
      </div>
      
      <div className="space-y-6">
        <ResultsSkeleton />
      </div>
    </div>
    
    <PromoHistorySkeleton />
  </div>
);

// 🚀 Smart Loading Component with messages
export const SmartPromoLoader: React.FC<{
  message?: string;
  showProgress?: boolean;
  size?: 'sm' | 'md' | 'lg';
}> = ({ 
  message = "Memuat kalkulator promo...", 
  showProgress = false,
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'h-32',
    md: 'h-64', 
    lg: 'h-96'
  };

  const iconSizes = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className={`${sizeClasses[size]} bg-white/90 rounded-lg shadow-md flex items-center justify-center`}>
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <Loader2 className={`animate-spin text-orange-500 ${iconSizes[size]}`} />
          <Calculator className={`text-orange-400 ${iconSizes[size]}`} />
        </div>
        
        <div className="space-y-2">
          <p className="text-gray-700 font-medium">{message}</p>
          {showProgress && (
            <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-orange-400 to-red-400 rounded-full animate-pulse" 
                   style={{ width: '60%' }}></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 🎨 Skeleton variants for specific use cases
export const FormFieldSkeleton: React.FC<{ 
  hasLabel?: boolean; 
  width?: string 
}> = ({ hasLabel = true, width = "w-full" }) => (
  <div className="space-y-2">
    {hasLabel && <SkeletonBox className="w-20 h-4" />}
    <SkeletonBox className={`${width} h-10 rounded-md`} />
  </div>
);

export const ButtonSkeleton: React.FC<{ 
  variant?: 'primary' | 'secondary';
  width?: string;
}> = ({ variant = 'primary', width = "w-24" }) => (
  <SkeletonBox 
    className={`${width} h-10 rounded-md ${
      variant === 'primary' ? 'bg-orange-200' : 'bg-gray-200'
    }`} 
  />
);

export default PromoCalculatorSkeleton;