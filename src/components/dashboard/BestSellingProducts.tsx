// components/dashboard/BestSellingProducts.tsx
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Package, ChevronLeft, ChevronRight } from "lucide-react";
import { formatCurrency } from '@/utils/formatUtils';
import { generateListKey } from '@/utils/keyUtils';
import { calculatePagination } from '@/components/promoCalculator/utils/promoUtils';

interface Product {
  id: string;
  name: string;
  quantity: number;
  revenue?: number;
}

interface Props {
  products: Product[];
  pagination: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
}

// 🏆 Product Item Component
const ProductItem: React.FC<{
  product: Product;
  rank: number;
  isLoading?: boolean;
}> = ({ product, rank, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="p-4 flex items-center">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 animate-pulse mr-4"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 animate-pulse rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 animate-pulse rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 flex items-center hover:bg-gray-50 transition-colors">
      {/* 🥇 Rank Badge */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 flex items-center justify-center">
        <span className="text-sm font-bold text-white">{rank}</span>
      </div>
      
      {/* 📊 Product Info */}
      <div className="ml-4 flex-1 min-w-0">
        <p className="font-medium text-gray-800 truncate" title={product.name}>
          {product.name}
        </p>
        <div className="flex justify-between mt-1 text-sm">
          <p className="text-gray-500">
            {product.quantity.toLocaleString('id-ID')} terjual
          </p>
          {product.revenue !== undefined && (
            <p className="font-medium text-green-600">
              {formatCurrency(product.revenue)}
            </p>
          )}
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

const BestSellingProducts: React.FC<Props> = ({ 
  products, 
  pagination, 
  onPageChange, 
  isLoading 
}) => {
  const itemsPerPage = 5;

  // 📊 Calculate pagination
  const paginationInfo = useMemo(() => 
    calculatePagination(pagination, products.length, itemsPerPage),
    [pagination, products.length]
  );

  // 📋 Current page products
  const currentProducts = useMemo(() => {
    if (isLoading) {
      // Return skeleton items
      return Array(itemsPerPage).fill(null).map((_, index) => ({
        id: `skeleton-${index}`,
        name: '',
        quantity: 0,
        revenue: 0
      }));
    }
    
    return products.slice(paginationInfo.startIndex, paginationInfo.endIndex);
  }, [products, paginationInfo, isLoading]);

  // 🎯 Handle pagination
  const handlePageChange = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && paginationInfo.hasPrev) {
      onPageChange(paginationInfo.currentPage - 1);
    } else if (direction === 'next' && paginationInfo.hasNext) {
      onPageChange(paginationInfo.currentPage + 1);
    }
  };

  return (
    <Card className="bg-white border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
      {/* 🏆 Header */}
      <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50 border-b border-gray-100 p-4">
        <CardTitle className="flex items-center gap-2 text-gray-800 text-lg">
          <Trophy className="h-5 w-5 text-yellow-600" />
          <span>Produk Terlaris</span>
          {!isLoading && products.length > 0 && (
            <span className="text-sm font-normal text-gray-500">
              ({products.length} produk)
            </span>
          )}
        </CardTitle>
      </CardHeader>

      {/* 📊 Content */}
      <CardContent className="p-0">
        <div className="divide-y divide-gray-200">
          {currentProducts.length > 0 ? (
            currentProducts.map((product, index) => {
              const rank = (paginationInfo.currentPage - 1) * itemsPerPage + index + 1;
              const key = generateListKey('product', product.id, index, 'best');
              
              return (
                <ProductItem
                  key={key}
                  product={product}
                  rank={rank}
                  isLoading={isLoading}
                />
              );
            })
          ) : !isLoading ? (
            // 📭 Empty State
            <div className="p-8 text-center text-gray-500">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="font-medium">Tidak ada data penjualan</p>
              <p className="text-sm mt-1">pada periode yang dipilih.</p>
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