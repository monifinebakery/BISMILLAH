// 🎯 30 lines - Page skeleton
import React from 'react';

const PageLoading: React.FC = () => {
  return (
    <div className="container mx-auto p-4 sm:p-8">
      {/* Header Skeleton */}
      <div className="bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl p-6 mb-8 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-300 rounded-xl"></div>
            <div>
              <div className="h-6 bg-gray-300 rounded w-48 mb-2"></div>
              <div className="h-4 bg-gray-300 rounded w-64"></div>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="h-10 bg-gray-300 rounded w-32"></div>
            <div className="h-10 bg-gray-300 rounded w-32"></div>
          </div>
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="bg-white rounded-xl shadow-xl border border-gray-200/80 p-6">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PageLoading;