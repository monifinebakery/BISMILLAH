// src/components/financial/profit-analysis/components/LoadingSkeleton.tsx
// ✅ KOMPONEN LOADING SKELETON

import React from 'react';

export const AnalysisSkeleton: React.FC = () => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-gray-200 rounded h-20 animate-pulse" />
      <div className="bg-gray-200 rounded h-20 animate-pulse" />
    </div>
    <div className="bg-gray-200 rounded h-32 animate-pulse" />
    <div className="space-y-2">
      <div className="bg-gray-200 rounded h-4 animate-pulse" />
      <div className="bg-gray-200 rounded h-4 w-3/4 animate-pulse" />
    </div>
  </div>
);

export const MetricSkeleton: React.FC = () => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="bg-gray-200 rounded h-24 animate-pulse" />
    ))}
  </div>
);