import React from 'react';

const LoadingSpinner = ({ 
  size = 'default', 
  text = 'Memuat...', 
  className = '' 
}: any) => {
  const sizeClasses = {
    small: 'h-4 w-4',
    default: 'h-8 w-8',
    large: 'h-12 w-12'
  };

  const textSizeClasses = {
    small: 'text-sm',
    default: 'text-base',
    large: 'text-lg'
  };

  return (
    <div className={`flex flex-col items-center justify-center space-y-3 ${className}`}>
      <div className="relative">
        <div className={`animate-spin rounded-full border-4 border-orange-200 border-t-orange-500 ${sizeClasses[size]}`}></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`bg-orange-100 rounded-full animate-pulse ${size === 'small' ? 'w-1 h-1' : size === 'large' ? 'w-4 h-4' : 'w-2 h-2'}`}></div>
        </div>
      </div>
      
      {text && (
        <p className={`text-gray-600 font-medium ${textSizeClasses[size]}`}>
          {text}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;