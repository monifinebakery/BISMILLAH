// components/dashboard/CriticalStock.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Warehouse } from "lucide-react";
import { generateListKey } from '@/utils/keyUtils';

interface StockItem {
  id: string;
  nama: string;
  stok: number;
  minimum: number;
  satuan: string;
}

interface Props {
  items: StockItem[];
  isLoading: boolean;
}

// 📦 Stock Item Component
const StockItemRow: React.FC<{
  item: StockItem;
  isLoading?: boolean;
}> = ({ item, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="flex justify-between">
          <div className="h-3 bg-gray-200 rounded w-1/3"></div>
          <div className="h-3 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>
    );
  }

  // 🚨 Determine severity level
  const isOutOfStock = item.stok === 0;
  const isCritical = item.stok <= item.minimum * 0.5;
  const isLow = item.stok <= item.minimum;

  let statusColor = 'text-yellow-600';
  let statusBg = 'bg-yellow-50';
  
  if (isOutOfStock) {
    statusColor = 'text-red-600';
    statusBg = 'bg-red-50';
  } else if (isCritical) {
    statusColor = 'text-orange-600';
    statusBg = 'bg-orange-50';
  }

  return (
    <div className={`p-4 hover:${statusBg} transition-colors border-l-4 ${
      isOutOfStock 
        ? 'border-red-500' 
        : isCritical 
          ? 'border-orange-500' 
          : 'border-yellow-500'
    }`}>
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-800 truncate" title={item.nama}>
            {item.nama}
          </p>
          <div className="flex justify-between mt-1 text-sm">
            <p className="text-gray-500">
              Stok: <span className={statusColor}>{item.stok} {item.satuan}</span>
            </p>
            <p className="text-gray-600 font-medium">
              Min: {item.minimum} {item.satuan}
            </p>
          </div>
        </div>
        
        {/* 🚨 Status Indicator */}
        <div className={`ml-3 px-2 py-1 rounded text-xs font-medium ${statusBg} ${statusColor}`}>
          {isOutOfStock ? 'HABIS' : isCritical ? 'KRITIS' : 'RENDAH'}
        </div>
      </div>
      
      {/* 📊 Progress Bar */}
      <div className="mt-3">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              isOutOfStock 
                ? 'bg-red-500' 
                : isCritical 
                  ? 'bg-orange-500' 
                  : 'bg-yellow-500'
            }`}
            style={{ 
              width: `${Math.min(100, Math.max(0, (item.stok / Math.max(item.minimum, 1)) * 100))}%` 
            }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0</span>
          <span>Min: {item.minimum}</span>
        </div>
      </div>
    </div>
  );
};

// 📊 Summary Stats
const StockSummary: React.FC<{ items: StockItem[] }> = ({ items }) => {
  const stats = React.useMemo(() => {
    const outOfStock = items.filter(item => item.stok === 0).length;
    const critical = items.filter(item => item.stok > 0 && item.stok <= item.minimum * 0.5).length;
    const low = items.filter(item => item.stok > item.minimum * 0.5 && item.stok <= item.minimum).length;
    
    return { outOfStock, critical, low };
  }, [items]);

  if (items.length === 0) return null;

  return (
    <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
      <div className="flex gap-4 text-sm">
        {stats.outOfStock > 0 && (
          <span className="text-red-600 font-medium">
            {stats.outOfStock} Habis
          </span>
        )}
        {stats.critical > 0 && (
          <span className="text-orange-600 font-medium">
            {stats.critical} Kritis
          </span>
        )}
        {stats.low > 0 && (
          <span className="text-yellow-600 font-medium">
            {stats.low} Rendah
          </span>
        )}
      </div>
    </div>
  );
};

const CriticalStock: React.FC<Props> = ({ items, isLoading }) => {
  // 📊 Display items (limit to 5 for performance)
  const displayItems = React.useMemo(() => {
    if (isLoading) {
      return Array(3).fill(null).map((_, index) => ({
        id: `skeleton-${index}`,
        nama: '',
        stok: 0,
        minimum: 0,
        satuan: ''
      }));
    }
    return items.slice(0, 5);
  }, [items, isLoading]);

  const showSummary = !isLoading && items.length > 0;

  return (
    <Card className="bg-white border">
      {/* ⚠️ Header */}
      <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 border-b border-gray-100 p-4">
        <CardTitle className="flex items-center gap-2 text-red-600 text-lg">
          <Warehouse className="h-5 w-5" />
          <span>Stok Kritis</span>
          {!isLoading && items.length > 0 && (
            <span className="text-sm font-normal text-red-500">
              ({items.length} item)
            </span>
          )}
        </CardTitle>
      </CardHeader>

      {/* 📊 Summary */}
      {showSummary && <StockSummary items={items} />}

      {/* 📦 Content */}
      <CardContent className="p-0">
        <div className="divide-y divide-gray-200">
          {displayItems.length > 0 ? (
            displayItems.map((item, index) => {
              const key = generateListKey('stock', item.id, index, 'critical');
              return (
                <StockItemRow
                  key={key}
                  item={item}
                  isLoading={isLoading}
                />
              );
            })
          ) : !isLoading ? (
            // ✅ All Good State
            <div className="p-8 text-center text-gray-500">
              <Warehouse className="h-12 w-12 text-green-300 mx-auto mb-3" />
              <p className="font-medium text-green-700">Semua stok aman!</p>
              <p className="text-sm mt-1 text-gray-500">
                Tidak ada item dengan stok di bawah minimum.
              </p>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
};

export default CriticalStock;