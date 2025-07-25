// components/dashboard/WorstSellingProducts.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown } from "lucide-react";
import { generateListKey } from '@/utils/keyUtils';

interface Product {
  id: string;
  name: string;
  quantity: number;
}

interface Props {
  products: Product[];
  isLoading: boolean;
}

// 📉 Product Item Component
const ProductItem: React.FC<{
  product: Product;
  isLoading?: boolean;
}> = ({ product, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  return (
    <div className="p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-800 truncate" title={product.name}>
            {product.name}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Hanya {product.quantity.toLocaleString('id-ID')} terjual
          </p>
        </div>
        
        {/* 📊 Low Performance Indicator */}
        <div className="ml-3 flex items-center">
          <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
        </div>
      </div>
      
      {/* 📈 Performance Bar */}
      <div className="mt-3">
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div 
            className="h-1.5 rounded-full bg-gradient-to-r from-red-400 to-orange-400 transition-all duration-500"
            style={{ 
              width: `${Math.min(100, Math.max(5, (product.quantity / Math.max(product.quantity, 10)) * 25))}%` 
            }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>Perlu perhatian</span>
          <span>{product.quantity} terjual</span>
        </div>
      </div>
    </div>
  );
};

// 💡 Insights Component
const ProductInsights: React.FC<{ products: Product[] }> = ({ products }) => {
  if (products.length === 0) return null;

  const totalSales = products.reduce((sum, product) => sum + product.quantity, 0);
  const averageSales = Math.round(totalSales / products.length);

  return (
    <div className="px-4 py-3 bg-red-50 border-b border-red-100">
      <div className="flex items-center justify-between text-sm">
        <span className="text-red-700 font-medium">
          Rata-rata: {averageSales.toLocaleString('id-ID')} terjual
        </span>
        <span className="text-red-600 text-xs">
          Perlu strategi promosi
        </span>
      </div>
    </div>
  );
};

const WorstSellingProducts: React.FC<Props> = ({ products, isLoading }) => {
  // 📊 Display items (limit to 5)
  const displayProducts = React.useMemo(() => {
    if (isLoading) {
      return Array(3).fill(null).map((_, index) => ({
        id: `skeleton-${index}`,
        name: '',
        quantity: 0
      }));
    }
    return products.slice(0, 5);
  }, [products, isLoading]);

  const showInsights = !isLoading && products.length > 0;

  return (
    <Card className="bg-white border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
      {/* 📉 Header */}
      <CardHeader className="bg-gradient-to-r from-gray-50 to-red-50 border-b border-gray-100 p-4">
        <CardTitle className="flex items-center gap-2 text-gray-800 text-lg">
          <TrendingDown className="h-5 w-5 text-gray-600" />
          <span>Produk Kurang Laris</span>
          {!isLoading && products.length > 0 && (
            <span className="text-sm font-normal text-gray-500">
              ({products.length} produk)
            </span>
          )}
        </CardTitle>
      </CardHeader>

      {/* 💡 Insights */}
      {showInsights && <ProductInsights products={products} />}

      {/* 📊 Content */}
      <CardContent className="p-0">
        <div className="divide-y divide-gray-200">
          {displayProducts.length > 0 ? (
            displayProducts.map((product, index) => {
              const key = generateListKey('product', product.id, index, 'worst');
              return (
                <ProductItem
                  key={key}
                  product={product}
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

      {/* 💡 Action Suggestion */}
      {!isLoading && products.length > 0 && (
        <div className="px-4 py-3 bg-yellow-50 border-t text-center">
          <p className="text-xs text-yellow-700">
            💡 <strong>Saran:</strong> Pertimbangkan promosi khusus atau evaluasi harga untuk produk ini
          </p>
        </div>
      )}
    </Card>
  );
};

export default WorstSellingProducts;