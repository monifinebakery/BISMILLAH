// src/components/warehouse/components/mobile/MobileCard.tsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { 
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  AlertTriangle,
  Calendar,
  Package,
  TrendingDown,
  Clock,
  DollarSign,
  User,
  Tag,
  Hash,
} from 'lucide-react';
import { BahanBaku } from '../../types/warehouse';
import { formatCurrency, formatStock, formatDate, formatDaysUntilExpiry } from '../../utils/formatters';
import { cn } from '@/lib/utils';

interface MobileCardProps {
  item: BahanBaku;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
  className?: string;
  showCompactView?: boolean;
}

const MobileCard: React.FC<MobileCardProps> = ({
  item,
  isSelectionMode = false,
  isSelected = false,
  onToggleSelection,
  onEdit,
  onDelete,
  onView,
  className,
  showCompactView = false,
}) => {
  // Calculate item status
  const isLowStock = item.stok > 0 && item.stok <= item.minimum;
  const isOutOfStock = item.stok === 0;
  const expiryInfo = formatDaysUntilExpiry(item.tanggalKadaluwarsa);
  const isExpiringSoon = expiryInfo.days <= 7 && expiryInfo.days > 0;
  const isExpired = expiryInfo.days <= 0;

  // Determine card status color
  const getStatusColor = () => {
    if (isExpired || isOutOfStock) return 'border-red-200 bg-red-50';
    if (isExpiringSoon || isLowStock) return 'border-orange-200 bg-orange-50';
    return 'border-gray-200 bg-white';
  };

  // Get stock status badge
  const getStockBadge = () => {
    if (isOutOfStock) {
      return (
        <Badge variant="destructive" className="text-xs">
          <AlertTriangle className="h-2 w-2 mr-1" />
          Habis
        </Badge>
      );
    }
    if (isLowStock) {
      return (
        <Badge variant="outline" className="text-xs border-orange-500 text-orange-600">
          <TrendingDown className="h-2 w-2 mr-1" />
          Rendah
        </Badge>
      );
    }
    return null;
  };

  // Get expiry badge
  const getExpiryBadge = () => {
    if (!item.tanggalKadaluwarsa) return null;
    
    if (isExpired) {
      return (
        <Badge variant="destructive" className="text-xs">
          <AlertTriangle className="h-2 w-2 mr-1" />
          Expired
        </Badge>
      );
    }
    if (isExpiringSoon) {
      return (
        <Badge variant="outline" className="text-xs border-red-500 text-red-600">
          <Clock className="h-2 w-2 mr-1" />
          {expiryInfo.text}
        </Badge>
      );
    }
    return null;
  };

  if (showCompactView) {
    return (
      <Card className={cn(
        'transition-all duration-200 hover:shadow-md',
        getStatusColor(),
        isSelected && 'ring-2 ring-orange-500 ring-opacity-50',
        className
      )}>
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {isSelectionMode && onToggleSelection && (
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={onToggleSelection}
                  className="rounded"
                />
              )}
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-sm text-gray-900 truncate">
                    {item.nama}
                  </h4>
                  {getStockBadge()}
                  {getExpiryBadge()}
                </div>
                
                <div className="flex items-center gap-3 text-xs text-gray-600">
                  <span className="flex items-center gap-1">
                    <Hash className="h-2 w-2" />
                    {formatStock(item.stok, item.satuan)}
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-2 w-2" />
                    {formatCurrency(item.hargaSatuan)}
                  </span>
                </div>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onView && (
                  <DropdownMenuItem onClick={onView}>
                    <Eye className="h-4 w-4 mr-2" />
                    Lihat Detail
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <DropdownMenuItem onClick={onEdit}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {onDelete && (
                  <DropdownMenuItem onClick={onDelete} className="text-red-600">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Hapus
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      'transition-all duration-200 hover:shadow-md',
      getStatusColor(),
      isSelected && 'ring-2 ring-orange-500 ring-opacity-50',
      className
    )}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {isSelectionMode && onToggleSelection && (
              <div className="pt-1">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={onToggleSelection}
                  className="rounded"
                />
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="font-semibold text-gray-900 leading-tight">
                  {item.nama}
                </h4>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onView && (
                      <DropdownMenuItem onClick={onView}>
                        <Eye className="h-4 w-4 mr-2" />
                        Lihat Detail
                      </DropdownMenuItem>
                    )}
                    {onEdit && (
                      <DropdownMenuItem onClick={onEdit}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    {onDelete && (
                      <DropdownMenuItem onClick={onDelete} className="text-red-600">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Hapus
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              {/* Status Badges */}
              <div className="flex flex-wrap gap-1 mb-3">
                {getStockBadge()}
                {getExpiryBadge()}
                <Badge variant="secondary" className="text-xs">
                  <Tag className="h-2 w-2 mr-1" />
                  {item.kategori}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          {/* Stock Info */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-gray-500">
              <Package className="h-3 w-3" />
              <span className="text-xs">Stok</span>
            </div>
            <div className="flex items-center gap-1">
              <span className={cn(
                "font-medium",
                isOutOfStock ? "text-red-600" : 
                isLowStock ? "text-orange-600" : "text-green-600"
              )}>
                {formatStock(item.stok, item.satuan)}
              </span>
              {(isLowStock || isOutOfStock) && (
                <AlertTriangle className="h-3 w-3 text-orange-500" />
              )}
            </div>
            <div className="text-xs text-gray-500">
              Min: {formatStock(item.minimum, item.satuan)}
            </div>
          </div>

          {/* Price Info */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-gray-500">
              <DollarSign className="h-3 w-3" />
              <span className="text-xs">Harga</span>
            </div>
            <div className="font-medium">
              {formatCurrency(item.hargaSatuan)}
            </div>
            <div className="text-xs text-gray-500">
              per {item.satuan}
            </div>
          </div>

          {/* Supplier Info */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-gray-500">
              <User className="h-3 w-3" />
              <span className="text-xs">Supplier</span>
            </div>
            <div className="font-medium text-sm truncate">
              {item.supplier || '-'}
            </div>
          </div>

          {/* Expiry Info */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-gray-500">
              <Calendar className="h-3 w-3" />
              <span className="text-xs">Expired</span>
            </div>
            {item.tanggalKadaluwarsa ? (
              <div>
                <div className="font-medium text-sm">
                  {formatDate(item.tanggalKadaluwarsa)}
                </div>
                <div className={cn(
                  "text-xs",
                  isExpired ? 'text-red-600' :
                  isExpiringSoon ? 'text-orange-600' : 
                  'text-gray-500'
                )}>
                  {expiryInfo.text}
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-400">-</div>
            )}
          </div>
        </div>

        {/* Total Value */}
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Total Nilai:</span>
            <span className="font-semibold text-lg">
              {formatCurrency(item.stok * item.hargaSatuan)}
            </span>
          </div>
        </div>

        {/* Quick Actions (Mobile) */}
        {!isSelectionMode && (
          <div className="mt-3 flex gap-2">
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={onEdit}
                className="flex-1 text-xs"
              >
                <Edit className="h-3 w-3 mr-1" />
                Edit
              </Button>
            )}
            {onView && (
              <Button
                variant="outline"
                size="sm"
                onClick={onView}
                className="flex-1 text-xs"
              >
                <Eye className="h-3 w-3 mr-1" />
                Detail
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MobileCard;