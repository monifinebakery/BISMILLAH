// components/dashboard/BestSellingProducts.tsx - Enhanced with Multiple Sort Options

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Package, ChevronLeft, ChevronRight, TrendingUp, DollarSign, Hash, Target, BarChart3 } from "lucide-react";
import { formatCurrency, formatCompactCurrency } from '@/lib/shared';
import { generateListKey } from '@/utils/keyUtils';
import { safeNumber, safeMultiply } from '@/utils/safeMath';

// 🔧 Local pagination calculation utility
const calculatePagination = (currentPage: number, totalItems: number, itemsPerPage: number) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  
  return {
    currentPage,
    totalPages,
    startIndex,
    endIndex,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
    totalItems
  };
};

interface Product {
  id: string;
  name: string;
  quantity: number;
  revenue?: number;
  profit?: number;
  avgPrice?: number;
  marginPercent?: number;
}

type SortOption = 'revenue' | 'quantity' | 'profit' | 'hybrid';

interface SortConfig {
  key: SortOption;
  label: string;
  icon: React.ReactNode;
  description: string;
  getValue: (product: Product) => number;
  formatValue: (value: number) => string;
  getSecondaryInfo: (product: Product) => string;
}

const sortConfigs: Record<SortOption, SortConfig> = {
  revenue: {
    key: 'revenue',
    label: 'Total Pendapatan',
    icon: <DollarSign className="h-4 w-4" />,
    description: 'Berdasarkan total uang yang dihasilkan produk',
    getValue: (product) => safeNumber(product.revenue),
    formatValue: (value) => formatCurrency(value),
    getSecondaryInfo: (product) => `${safeNumber(product.quantity)} unit terjual`
  },
  quantity: {
    key: 'quantity', 
    label: 'Jumlah Terjual',
    icon: <Hash className="h-4 w-4" />,
    description: 'Berdasarkan unit yang berhasil terjual',
    getValue: (product) => safeNumber(product.quantity),
    formatValue: (value) => `${value.toLocaleString('id-ID')} unit`,
    getSecondaryInfo: (product) => formatCurrency(safeNumber(product.revenue))
  },
  profit: {
    key: 'profit',
    label: 'Total Keuntungan', 
    icon: <TrendingUp className="h-4 w-4" />,
    description: 'Berdasarkan profit bersih yang dihasilkan',
    getValue: (product) => safeNumber(product.profit),
    formatValue: (value) => formatCurrency(value),
    getSecondaryInfo: (product) => `Margin ${safeNumber(product.marginPercent)}%`
  },
  hybrid: {
    key: 'hybrid',
    label: 'Skor Gabungan',
    icon: <Target className="h-4 w-4" />,
    description: 'Kombinasi volume penjualan dan nilai pendapatan',
    getValue: (product) => {
      // Hybrid score: normalize both metrics and combine
      const revenue = safeNumber(product.revenue);
      const quantity = safeNumber(product.quantity);
      
      // Weight: 40% quantity + 60% revenue
      const normalizedQty = Math.min(quantity / 1000, 1); // Cap at 1000 units
      const normalizedRev = Math.min(revenue / 10000000, 1); // Cap at 10M
      
      return safeMultiply(safeMultiply(normalizedQty, 0.4) + safeMultiply(normalizedRev, 0.6), 100);
    },
    formatValue: (value) => `${isNaN(value) || !isFinite(value) ? '0.0' : value.toFixed(1)} poin`,
    getSecondaryInfo: (product) => `${safeNumber(product.quantity)} unit • ${formatCurrency(safeNumber(product.revenue))}`
  }
};

interface Props {
  products: Product[];
  pagination: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
}

// 🏆 Enhanced Product Item Component
const ProductItem: React.FC<{
  product: Product;
  rank: number;
  sortConfig: SortConfig;
  isLoading?: boolean;
}> = ({ product, rank, sortConfig, isLoading = false }) => {
  if (isLoading) {
    return null;
  }

  // Rank badge styling
  const getRankBadgeStyle = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-gradient-to-r from-yellow-400 to-orange-400'; // Gold
      case 2: return 'bg-gradient-to-r from-gray-400 to-gray-500'; // Silver  
      case 3: return 'bg-gradient-to-r from-orange-400 to-yellow-600'; // Bronze
      default: return 'bg-gradient-to-r from-blue-400 to-blue-500'; // Blue
    }
  };

  const primaryValue = sortConfig.getValue(product);
  const formattedValue = sortConfig.formatValue(primaryValue);
  const secondaryInfo = sortConfig.getSecondaryInfo(product);

  return (
    <div className="p-3 sm:p-4 flex items-center hover:bg-gray-50 transition-colors">
      {/* 🥇 Rank Badge */}
      <div className={`flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${getRankBadgeStyle(rank)}`}>
        <span className="text-xs sm:text-sm font-bold text-white">{rank}</span>
      </div>
      
      {/* 📊 Product Info */}
      <div className="ml-3 sm:ml-4 flex-1 min-w-0">
        <p className="font-medium text-gray-800 text-sm sm:text-base truncate" title={product.name}>
          {product.name}
        </p>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          {secondaryInfo}
        </p>
      </div>

      {/* 💰 Primary Metric */}
      <div className="text-right ml-2 sm:ml-4 flex-shrink-0">
        <p className="font-semibold text-blue-600 text-sm sm:text-base">
          {formattedValue}
        </p>
        <div className="flex items-center justify-end gap-1 text-xs text-gray-400">
          {sortConfig.icon}
          <span className="hidden sm:inline">{sortConfig.label}</span>
        </div>
      </div>
    </div>
  );
};

// 🔄 Pagination Controls
const PaginationControls: React.FC<{
  currentPage: number;
  totalPages: number;
  onPageChange: (direction: 'prev' | 'next') => void;
  hasNext: boolean;
  hasPrev: boolean;
}> = ({ currentPage, totalPages, onPageChange, hasNext, hasPrev }) => {
  return (
    <CardFooter className="bg-gray-50 border-t border-gray-100 p-3 flex justify-between items-center">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => onPageChange('prev')} 
        disabled={!hasPrev} 
        className="text-gray-600 hover:bg-gray-200 disabled:opacity-50 min-w-[40px] h-8"
      >
        <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
        <span className="ml-1 hidden xs:inline text-xs sm:text-sm">Prev</span>
      </Button>
      
      <span className="text-xs sm:text-sm text-gray-600 font-medium px-2">
        {currentPage} dari {totalPages}
      </span>
      
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => onPageChange('next')} 
        disabled={!hasNext} 
        className="text-gray-600 hover:bg-gray-200 disabled:opacity-50 min-w-[40px] h-8"
      >
        <span className="mr-1 hidden xs:inline text-xs sm:text-sm">Next</span>
        <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
      </Button>
    </CardFooter>
  );
};

const BestSellingProducts: React.FC<Props> = ({
  products,
  pagination,
  onPageChange,
  isLoading, 
}) => {
  const [sortBy, setSortBy] = useState<SortOption>('revenue');
  const itemsPerPage = 5;

  // 📊 Sort products based on selected option
  const sortedProducts = useMemo(() => {
    if (isLoading || !products.length) return products;

    const config = sortConfigs[sortBy];
    return [...products].sort((a, b) => config.getValue(b) - config.getValue(a));
  }, [products, sortBy, isLoading]);

  // 📊 Calculate pagination
  const paginationInfo = useMemo(() => 
    calculatePagination(pagination, sortedProducts.length, itemsPerPage),
    [pagination, sortedProducts.length]
  );

  // 📋 Current page products
  const currentProducts = useMemo(() => {
    if (isLoading) {
      
      return Array(itemsPerPage).fill(null).map((_, index) => ({
        id: `skeleton-${index}`,
        name: '',
        quantity: 0,
        revenue: 0
      }));
    }
    
    return sortedProducts.slice(paginationInfo.startIndex, paginationInfo.endIndex);
  }, [sortedProducts, paginationInfo, isLoading]);

  // 🎯 Handle pagination
  const handlePageChange = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && paginationInfo.hasPrev) {
      onPageChange(paginationInfo.currentPage - 1);
    } else if (direction === 'next' && paginationInfo.hasNext) {
      onPageChange(paginationInfo.currentPage + 1);
    }
  };

  const currentSortConfig = sortConfigs[sortBy];

  return (
    <Card className="bg-white border-1.5 border-gray-200">
      {/* 🏆 Header with Sort Selector */}
      <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50 border-b border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-gray-800 text-lg">
            <Trophy className="h-5 w-5 text-yellow-600" />
            <span className="text-base sm:text-lg">Produk Terlaris</span>
            {!isLoading && sortedProducts.length > 0 && (
              <span className="text-xs sm:text-sm font-normal text-gray-500">
                ({sortedProducts.length} produk)
              </span>
            )}
          </CardTitle>
          
          {/* Sort Selector */}
          {!isLoading && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs sm:text-sm text-gray-600 hidden sm:inline">Urutkan:</span>
              <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                <SelectTrigger className="w-32 sm:w-44 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(sortConfigs).map((config) => (
                    <SelectItem key={config.key} value={config.key}>
                      <div className="flex items-center gap-2">
                        {config.icon}
                        <span className="text-xs sm:text-sm">{config.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        
        {/* Sort Description */}
        {!isLoading && (
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
            <BarChart3 className="h-3 w-3" />
            {currentSortConfig.description}
          </p>
        )}
      </CardHeader>

      {/* 📊 Content */}
      <CardContent className="p-0">
        <div className="divide-y divide-gray-200">
          {currentProducts.length > 0 ? (
            currentProducts.map((product, index) => {
              const rank = (paginationInfo.currentPage - 1) * itemsPerPage + index + 1;
              const key = generateListKey('product', product.id, index);
              
              return (
                <ProductItem
                  key={key}
                  product={product}
                  rank={rank}
                  sortConfig={currentSortConfig}
                  isLoading={isLoading}
                />
              );
            })
          ) : !isLoading ? (
            // 📝 Empty State
            <div className="p-6 sm:p-8 text-center text-gray-500">
              <Package className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 mx-auto mb-3" />
              <p className="font-medium text-sm sm:text-base">Tidak ada data penjualan</p>
              <p className="text-xs sm:text-sm mt-1">pada periode yang dipilih.</p>
            </div>
          ) : null}
        </div>
      </CardContent>

      {/* 🔄 Pagination */}
      {paginationInfo.totalPages > 1 && !isLoading && (
        <PaginationControls
          currentPage={paginationInfo.currentPage}
          totalPages={paginationInfo.totalPages}
          onPageChange={handlePageChange}
          hasNext={paginationInfo.hasNext}
          hasPrev={paginationInfo.hasPrev}
        />
      )}
    </Card>
  );
};

export default BestSellingProducts;