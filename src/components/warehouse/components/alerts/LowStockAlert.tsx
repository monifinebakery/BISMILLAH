// src/components/warehouse/components/alerts/LowStockAlert.tsx
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  X, 
  ChevronDown, 
  ChevronUp,
  Package,
  TrendingDown,
  Clock,
} from 'lucide-react';
import { BahanBaku } from '../../types/warehouse';
import { formatStock, formatDaysUntilExpiry } from '../../utils/formatters';
import { cn } from '@/lib/utils';

interface LowStockAlertProps {
  lowStockItems: BahanBaku[];
  className?: string;
  maxVisible?: number;
  onItemClick?: (item: BahanBaku) => void;
  dismissible?: boolean;
}

const LowStockAlert: React.FC<LowStockAlertProps> = ({
  lowStockItems,
  className,
  maxVisible = 5,
  onItemClick,
  dismissible = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed || lowStockItems.length === 0) {
    return null;
  }

  // Separate out of stock and low stock items
  const outOfStockItems = lowStockItems.filter(item => item.stok === 0);
  const lowStockOnly = lowStockItems.filter(item => item.stok > 0 && item.stok <= item.minimum);

  // Items to display based on expansion state
  const visibleItems = isExpanded ? lowStockItems : lowStockItems.slice(0, maxVisible);
  const hasMoreItems = lowStockItems.length > maxVisible;

  const getAlertLevel = () => {
    if (outOfStockItems.length > 0) return 'critical';
    if (lowStockOnly.length > 3) return 'warning';
    return 'info';
  };

  const alertLevel = getAlertLevel();

  const alertStyles = {
    critical: {
      container: 'bg-red-50 border-red-200',
      icon: 'text-red-600',
      title: 'text-red-900',
      text: 'text-red-800',
    },
    warning: {
      container: 'bg-orange-50 border-orange-200',
      icon: 'text-orange-600',
      title: 'text-orange-900',
      text: 'text-orange-800',
    },
    info: {
      container: 'bg-blue-50 border-blue-200',
      icon: 'text-blue-600',
      title: 'text-blue-900',
      text: 'text-blue-800',
    },
  };

  const styles = alertStyles[alertLevel];

  const renderItemBadge = (item: BahanBaku) => {
    if (item.stok === 0) {
      return <Badge variant="destructive" className="text-xs">Habis</Badge>;
    }
    return <Badge variant="outline" className="text-xs">Rendah</Badge>;
  };

  const getTitle = () => {
    if (outOfStockItems.length > 0 && lowStockOnly.length > 0) {
      return `${outOfStockItems.length} item habis, ${lowStockOnly.length} item stok rendah`;
    } else if (outOfStockItems.length > 0) {
      return `${outOfStockItems.length} item habis`;
    } else {
      return `${lowStockOnly.length} item stok rendah`;
    }
  };

  return (
    <Card className={cn(
      'mb-6 border shadow-md',
      styles.container,
      className
    )}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={cn(
              'flex-shrink-0 p-2 rounded-lg',
              alertLevel === 'critical' ? 'bg-red-100' :
              alertLevel === 'warning' ? 'bg-orange-100' : 'bg-blue-100'
            )}>
              <AlertTriangle className={cn('h-5 w-5', styles.icon)} />
            </div>
            <div>
              <h3 className={cn('font-semibold text-sm', styles.title)}>
                Peringatan Stok Inventory
              </h3>
              <p className={cn('text-sm', styles.text)}>
                {getTitle()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {hasMoreItems && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className={cn('h-8 px-2', styles.text)}
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" />
                    Lebih Sedikit
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" />
                    Lihat Semua ({lowStockItems.length})
                  </>
                )}
              </Button>
            )}
            
            {dismissible && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDismissed(true)}
                className={cn('h-8 w-8 p-0', styles.text)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Items List */}
        <div className="space-y-2">
          {visibleItems.map((item) => {
            const expiryInfo = formatDaysUntilExpiry(item.tanggalKadaluwarsa);
            
            return (
              <div
                key={item.id}
                className={cn(
                  'flex items-center justify-between p-3 rounded-lg border bg-white/50 hover:bg-white/80 transition-colors',
                  onItemClick && 'cursor-pointer hover:shadow-sm'
                )}
                onClick={() => onItemClick?.(item)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Package className={cn('h-4 w-4 flex-shrink-0', styles.icon)} />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900 truncate">
                        {item.nama}
                      </h4>
                      {renderItemBadge(item)}
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-600">
                      <span className="flex items-center gap-1">
                        <TrendingDown className="h-3 w-3" />
                        Stok: {formatStock(item.stok, item.satuan)}
                      </span>
                      
                      <span>Min: {formatStock(item.minimum, item.satuan)}</span>
                      
                      <span>{item.kategori}</span>
                      
                      {item.tanggalKadaluwarsa && expiryInfo.days <= 30 && (
                        <span className={cn(
                          'flex items-center gap-1',
                          expiryInfo.variant === 'destructive' ? 'text-red-600' :
                          expiryInfo.variant === 'warning' ? 'text-orange-600' : 
                          'text-gray-600'
                        )}>
                          <Clock className="h-3 w-3" />
                          {expiryInfo.text}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stock Status Indicator */}
                <div className="flex items-center gap-2">
                  <div className={cn(
                    'h-2 w-2 rounded-full',
                    item.stok === 0 ? 'bg-red-500' : 'bg-orange-500'
                  )} />
                  
                  <div className="text-right">
                    <div className={cn(
                      'text-sm font-medium',
                      item.stok === 0 ? 'text-red-600' : 'text-orange-600'
                    )}>
                      {item.stok === 0 ? 'Habis' : `${item.stok} ${item.satuan}`}
                    </div>
                    <div className="text-xs text-gray-500">
                      dari {item.minimum} min
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200/50">
          <p className={cn('text-xs', styles.text)}>
            Segera lakukan pemesanan untuk menghindari kehabisan stok
          </p>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className={cn(
                'text-xs border-current',
                styles.text
              )}
              onClick={() => {
                // Navigate to purchase/order page
                // This would be implemented based on your routing
                console.log('Navigate to purchase page');
              }}
            >
              Buat Pesanan
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LowStockAlert;