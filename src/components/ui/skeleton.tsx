import React from 'react';
import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

function Skeleton({
  className,
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse',
  ...props
}: SkeletonProps) {
  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-md'
  };
  
  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200',
    none: ''
  };
  
  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;
  
  return (
    <div
      className={cn(
        "bg-muted",
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
      style={style}
      {...props}
    />
  )
}

// Komponen skeleton khusus untuk berbagai use case
const TextSkeleton: React.FC<{ lines?: number; className?: string }> = ({ 
  lines = 1, 
  className 
}) => (
  <div className={cn('space-y-2', className)}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton 
        key={i} 
        variant="text" 
        className={i === lines - 1 ? 'w-3/4' : 'w-full'} 
      />
    ))}
  </div>
);

const CardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('p-4 border rounded-lg space-y-3', className)}>
    <Skeleton variant="text" className="w-1/2" />
    <TextSkeleton lines={2} />
    <div className="flex space-x-2">
      <Skeleton variant="rounded" width={80} height={32} />
      <Skeleton variant="rounded" width={80} height={32} />
    </div>
  </div>
);

const TableSkeleton: React.FC<{ 
  rows?: number; 
  columns?: number; 
  className?: string 
}> = ({ rows = 5, columns = 4, className }) => (
  <div className={cn('space-y-3', className)}>
    {/* Header */}
    <div className="flex space-x-4">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} variant="text" className="flex-1" />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="flex space-x-4">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton key={colIndex} variant="text" className="flex-1" />
        ))}
      </div>
    ))}
  </div>
);

const LoadingSkeleton: React.FC<{ 
  type?: 'page' | 'card' | 'table' | 'form' | 'list';
  className?: string;
}> = ({ type = 'page', className }) => {
  switch (type) {
    case 'page':
      return (
        <div className={cn('space-y-6 p-6', className)}>
          <Skeleton variant="text" className="w-1/3 h-8" />
          <TextSkeleton lines={3} />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </div>
      );
    
    case 'card':
      return <CardSkeleton className={className} />;
    
    case 'table':
      return <TableSkeleton className={className} />;
    
    case 'form':
      return (
        <div className={cn('space-y-4', className)}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton variant="text" className="w-1/4" />
              <Skeleton variant="rounded" className="w-full h-10" />
            </div>
          ))}
          <div className="flex space-x-2">
            <Skeleton variant="rounded" width={100} height={36} />
            <Skeleton variant="rounded" width={100} height={36} />
          </div>
        </div>
      );
    
    case 'list':
      return (
        <div className={cn('space-y-3', className)}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-3 p-3 border rounded">
              <Skeleton variant="circular" width={32} height={32} />
              <div className="flex-1 space-y-1">
                <Skeleton variant="text" className="w-3/4" />
                <Skeleton variant="text" className="w-1/2" />
              </div>
              <Skeleton variant="rounded" width={100} height={36} />
            </div>
          ))}
        </div>
      );
    
    default:
      return <Skeleton className={className} />;
  }
};

export { Skeleton, TextSkeleton, CardSkeleton, TableSkeleton, LoadingSkeleton }
