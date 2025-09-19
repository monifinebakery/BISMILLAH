import React from 'react';
import { cn } from "@/lib/utils"

// ✅ SIMPLIFIED: Just simple spinner instead of complex skeletons
const SimpleSpinner: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn("flex items-center justify-center p-4", className)}>
    <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
  </div>
);

// ✅ DEPRECATED: Keep these for backwards compatibility but they now just return spinner
const Skeleton = SimpleSpinner;
const TextSkeleton = SimpleSpinner;
const CardSkeleton = SimpleSpinner;
const TableSkeleton = SimpleSpinner;
const LoadingSkeleton = SimpleSpinner;

export { Skeleton, TextSkeleton, CardSkeleton, TableSkeleton, LoadingSkeleton, SimpleSpinner }
