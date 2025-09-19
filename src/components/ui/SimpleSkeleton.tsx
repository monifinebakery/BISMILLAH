// src/components/ui/SimpleSkeleton.tsx
// Simplified skeleton system - faster rendering, less complexity

import React from 'react';
import { cn } from "@/lib/utils";

interface SimpleSkeletonProps {
  className?: string;
  width?: string;
  height?: string;
}

// ✅ Single, lightweight skeleton component
export const SimpleSkeleton: React.FC<SimpleSkeletonProps> = ({ 
  className, 
  width, 
  height 
}) => (
  <div 
    className={cn("bg-gray-200 rounded animate-pulse", className)}
    style={{ width, height }}
  />
);

// ✅ Pre-built common patterns - faster than dynamic generation
export const QuickSkeletons = {
  // Fast text line
  TextLine: () => <SimpleSkeleton className="h-4 rounded" />,
  
  // Fast button
  Button: () => <SimpleSkeleton className="h-10 w-24 rounded-md" />,
  
  // Fast table row
  TableRow: () => (
    <div className="flex space-x-4 py-3">
      <SimpleSkeleton className="h-4 flex-1" />
      <SimpleSkeleton className="h-4 w-20" />
      <SimpleSkeleton className="h-4 w-16" />
    </div>
  ),
  
  // Fast card
  Card: () => (
    <div className="p-4 space-y-3 border rounded-lg">
      <SimpleSkeleton className="h-6 w-1/2" />
      <SimpleSkeleton className="h-4 w-full" />
      <SimpleSkeleton className="h-4 w-3/4" />
    </div>
  )
};

// ✅ Minimal loading state - no complex animations
export const MinimalLoader: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn("flex items-center justify-center p-4", className)}>
    <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
  </div>
);

export default SimpleSkeleton;