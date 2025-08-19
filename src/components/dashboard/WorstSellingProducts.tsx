// components/dashboard/WorstSellingProducts.tsx - Enhanced with Multiple Sort Options

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  TrendingDown, 
  AlertTriangle, 
  ChevronLeft, 
  ChevronRight, 
  DollarSign, 
  Hash, 
  Target, 
  BarChart3,
  Lightbulb,
  AlertCircle
} from "lucide-react";
import { formatCurrency } from '@/utils/formatUtils';
import { generateListKey } from '@/utils/keyUtils';
import { calculatePagination } from '@/components/promoCalculator/utils/promoUtils';

interface Product {
  id: string;
  name: string;
  quantity: number;
  revenue?: number;
  profit?: number;
  avgPrice?: number;
  marginPercent?: number;
  lastSaleDate?: Date;
}

type SortOption = 'quantity' | 'revenue' | 'profit' | 'hybrid';

interface SortConfig {
  key: SortOption;
  label: string;
  icon: React.ReactNode;
  description: string;
  getValue: (product: Product) => number;
  formatValue: (value: number) => string;
  getSecondaryInfo: (product: Product) => string;
  getWarningLevel: (value: number) => 'high' | 'medium' | 'low';
}

const sortConfigs: Record<SortOption, SortConfig> = {
  quantity: {
    key: 'quantity', 
    label: 'Penjualan Terendah',
    icon: <Hash className="h-4 w-4" />,
    description: 'Produk dengan unit terjual paling sedikit',
    getValue: (product) => product.quantity,
    formatValue: (value) => `${value.toLocaleString('id-ID')} unit`,
    getSecondaryInfo: (product) => formatCurrency(product.revenue || 0),
    getWarningLevel: (value) => value < 5 ? 'high' : value < 20 ? 'medium' : 'low'
  },
  revenue: {
    key: 'revenue',
    label: 'Pendapatan Terendah',
    icon: <DollarSign className="h-4 w-4" />,
    description: 'Produk dengan total pendapatan paling rendah',
    getValue: (product) => product.revenue || 0,
    formatValue: (value) => formatCurrency(value),
    getSecondaryInfo: (product) => `${product.quantity} unit terjual`,
    getWarningLevel: (value) => value < 100000 ? 'high' : value < 500000 ? 'medium' : 'low'
  },
  profit: {
    key: 'profit',
    label: 'Keuntungan Terendah', 
    icon: <TrendingDown className="h-4 w-4" />,
    description: 'Produk dengan profit bersih paling rendah',
    getValue: (product) => product.profit || 0,
    formatValue: (value) => formatCurrency(value),
    getSecondaryInfo: (product) => `Margin ${product.marginPercent || 0}%`,
    getWarningLevel: (value) => value < 50000 ? 'high' : value < 200000 ? 'medium' : 'low'
  },
  hybrid: {
    key: 'hybrid',
    label: 'Performa Terburuk',
    icon: <Target className="h-4 w-4" />,
    description: 'Kombinasi volume dan pendapatan terendah',
    getValue: (product) => {
      const revenue = product.revenue || 0;
      const quantity = product.quantity || 0;
      
      // Lower hybrid score = worse performance
      const normalizedQty = Math.min(quantity / 1000, 1);
      const normalizedRev = Math.min(revenue / 10000000, 1);
      
      return (normalizedQty * 0.4 + normalizedRev * 0.6) * 100;
    },
    formatValue: (value) => `${value.toFixed(1)} poin`,
    getSecondaryInfo: (product) => `${product.quantity} unit • ${formatCurrency(product.revenue || 0)}`,
    getWarningLevel: (value) => value < 10 ? 'high' : value < 30 ? 'medium' : 'low'
  }
};

interface Props {
  products: Product[];
  pagination: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
}

// 📉 Enhanced Product Item Component
const ProductItem: React.FC<{
  product: Product;
  rank: number;
  sortConfig: SortConfig;
  isLoading?: boolean;
}> = ({ product, rank, sortConfig, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="p-4 flex items-center">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 animate-pulse mr-4"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 animate-pulse rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 animate-pulse rounded w-1/2"></div>
        </div>
        <div className="w-20 h-8 bg-gray-200 animate-pulse rounded"></div>
      </div>
    );
  }

  const primaryValue = sortConfig.getValue(product);
  const formattedValue = sortConfig.formatValue(primaryValue);
  const secondaryInfo = sortConfig.getSecondaryInfo(product);
  const warningLevel = sortConfig.getWarningLevel(primaryValue);

  // Warning indicator styling
  const getWarningStyle = (level: 'high' | 'medium' | 'low') => {
    switch (level) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-orange-500';
    }
  };

  const getWarningIcon = (level: 'high' | 'medium' | 'low') => {
    switch (level) {
      case 'high': return <AlertCircle className="h-3 w-3 text-red-600" />;
      case 'medium': return <AlertTriangle className="h-3 w-3 text-yellow-600" />;
      case 'low': return <TrendingDown className="h-3 w-3 text-orange-600" />;
    }
  };

  // Performance bar calculation (inverted for worst products)
  const maxExpected = sortConfig.key === 'quantity' ? 100 : 
                     sortConfig.key === 'revenue' ? 1000000 : 
                     sortConfig.key === 'profit' ? 500000 : 50;
  const performancePercent = Math.min(100, Math.max(5, (primaryValue / maxExpected) * 100));

  return (
    <div className="p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center">
        {/* ⚠️ Warning Level Indicator */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-4">
          {getWarningIcon(warningLevel)}
        </div>
        
        {/* 📊 Product Info */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-800 truncate" title={product.name}>
            {product.name}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {secondaryInfo}
          </p>
        </div>

        {/* 📉 Primary Metric */}
        <div className="text-right ml-4">
          <p className="font-semibold text-red-600">
            {formattedValue}
          </p>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            {sortConfig.icon}
            <span>Rank #{rank}</span>
          </div>
        </div>
      </div>

      {/* 📈 Performance Bar */}
      <div className="mt-3">
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div 
            className={`h-1.5 rounded-full transition-all duration-500 ${
              warningLevel === 'high' ? 'bg-gradient-to-r from-red-400 to-red-500' :
              warningLevel === 'medium' ? 'bg-gradient-to-r from-yellow-400 to-orange-400' :
              'bg-gradient-to-r from-orange-400 to-yellow-500'
            }`}
            style={{ width: `${performancePercent}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>
            {warningLevel === 'high' ? 'Butuh perhatian serius' : 
             warningLevel === 'medium' ? 'Perlu peningkatan' : 
             'Bisa diperbaiki'}
          </span>
          <span className={`font-medium ${
            warningLevel === 'high' ? 'text-red-500' :
            warningLevel === 'medium' ? 'text-yellow-600' :
            'text-orange-500'
          }`}>
            {warningLevel === 'high' ? 'Kritis' : 
             warningLevel === 'medium' ? 'Sedang' : 
             'Rendah'}
          </span>
        </div>
      </div>
    </div>
  );
};

// 💡 Enhanced Insights Component
const ProductInsights: React.FC<{ 
  products: Product[]; 
  sortConfig: SortConfig;
}> = ({ products, sortConfig }) => {
  if (products.length === 0) return null;

  const values = products.map(p => sortConfig.getValue(p));
  const total = values.reduce((sum, val) => sum + val, 0);
  const average = total / values.length;
  const criticalCount = values.filter(val => sortConfig.getWarningLevel(val) === 'high').length;

  return (
    <div className="px-4 py-3 bg-red-50 border-b border-red-100">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
        <div className="text-center">
          <p className="text-red-700 font-medium">
            {sortConfig.formatValue(average)}
          </p>
          <p className="text-red-600 text-xs">Rata-rata</p>
        </div>
        <div className="text-center">
          <p className="text-red-700 font-medium">
            {criticalCount}
          </p>
          <p className="text-red-600 text-xs">Produk kritis</p>
        </div>
        <div className="text-center">
          <p className="text-red-700 font-medium">
            {Math.round((criticalCount / products.length) * 100)}%
          </p>
          <p className="text-red-600 text-xs">Perlu aksi</p>
        </div>
      </div>
    </div>
  );
};

// 🔄 Pagination Controls (same as BestSelling)
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
        className="text-gray-600 hover:bg-gray-200 disabled:opacity-50"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      <span className="text-sm text-gray-600 font-medium">
        {currentPage} dari {totalPages}
      </span>
      
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => onPageChange('next')} 
        disabled={!hasNext} 
        className="text-gray-600 hover:bg-gray-200 disabled:opacity-50"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </CardFooter>
  );
};

const WorstSellingProducts: React.FC<Props> = ({ 
  products, 
  pagination, 
  onPageChange, 
  isLoading 
}) => {
  const [sortBy, setSortBy] = useState<SortOption>('quantity');
  const itemsPerPage = 5;

  // 📊 Sort products based on selected option (ascending for worst)
  const sortedProducts = useMemo(() => {
    if (isLoading || !products.length) return products;
    
    const config = sortConfigs[sortBy];
    return [...products].sort((a, b) => config.getValue(a) - config.getValue(b)); // Ascending for worst
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
    <Card className="bg-white border-1.5 border-gray-200 hover:border-gray-300 transition-colors duration-300">
      {/* 📉 Header with Sort Selector */}
      <CardHeader className="bg-gradient-to-r from-gray-50 to-red-50 border-b border-gray-100 p-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-gray-800 text-lg">
            <TrendingDown className="h-5 w-5 text-red-600" />
            <span>Produk Kurang Laris</span>
            {!isLoading && sortedProducts.length > 0 && (
              <span className="text-sm font-normal text-gray-500">
                ({sortedProducts.length} produk)
              </span>
            )}
          </CardTitle>
          
          {/* Sort Selector */}
          {!isLoading && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Urutkan:</span>
              <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                <SelectTrigger className="w-44 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(sortConfigs).map((config) => (
                    <SelectItem key={config.key} value={config.key}>
                      <div className="flex items-center gap-2">
                        {config.icon}
                        <span>{config.label}</span>
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

      {/* 💡 Insights */}
      {!isLoading && sortedProducts.length > 0 && (
        <ProductInsights 
          products={sortedProducts} 
          sortConfig={currentSortConfig}
        />
      )}

      {/* 📊 Content */}
      <CardContent className="p-0">
        <div className="divide-y divide-gray-200">
          {currentProducts.length > 0 ? (
            currentProducts.map((product, index) => {
              const rank = (paginationInfo.currentPage - 1) * itemsPerPage + index + 1;
              const key = generateListKey('product', product.id, index, 'worst');
              
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
            // 📭 Empty State
            <div className="p-8 text-center text-gray-500">
              <TrendingDown className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="font-medium">Tidak ada data</p>
              <p className="text-sm mt-1">untuk ditampilkan pada periode ini.</p>
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

      {/* 💡 Action Suggestions */}
      {!isLoading && sortedProducts.length > 0 && (
        <div className="px-4 py-3 bg-yellow-50 border-t">
          <div className="flex items-start gap-2">
            <Lightbulb className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-yellow-700">
              <p className="font-medium mb-1">Saran Perbaikan:</p>
              <ul className="space-y-1 text-yellow-600">
                <li>• Buat promosi khusus atau diskon untuk produk berperforma rendah</li>
                <li>• Evaluasi harga dan margin keuntungan</li>
                <li>• Pertimbangkan bundling dengan produk laris</li>
                <li>• Review positioning dan strategi marketing</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default WorstSellingProducts;