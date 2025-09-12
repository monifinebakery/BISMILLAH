import React from 'react';

const LoadingSpinner = ({ 
  size = 'default', 
  className = '' 
}: {
  size?: 'small' | 'default' | 'large';
  className?: string;
}) => {
  const sizeClasses = {
    small: 'h-4 w-4',
    default: 'h-8 w-8',
    large: 'h-12 w-12'
  };

  const textSizeClasses = {
    small: 'h-2 w-12',
    default: 'h-3 w-16',
    large: 'h-4 w-20'
  };

  return (
    <div className={`flex flex-col items-center justify-center space-y-3 ${className}`}>
      <div className={`bg-gray-200 rounded-full animate-pulse ${sizeClasses[size]}`}></div>
      <div className={`bg-gray-200 rounded animate-pulse ${textSizeClasses[size]}`}></div>
    </div>
  );
};

export default LoadingSpinner;