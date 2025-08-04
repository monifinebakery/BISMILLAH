// src/components/warehouse/components/MobileWarehouseCard.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Edit2, 
  Trash2, 
  AlertTriangle,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  Clock
} from 'lucide-react';
import { warehouseUtils } from '../services/warehouseUtils';
import type { BahanBakuFrontend } from '../types';

interface MobileWarehouseCardProps {
  item: BahanBakuFrontend;
  isSelectionMode: boolean;
  searchTerm: string;
  isSelected: boolean;
  onToggleSelection: (id: string) => void;
  onEdit: (item: BahanBakuFrontend) => void;
  onDelete: (id: string, nama: string) => void;
}

/**
 * Mobile Card Component for Warehouse Items
 * 
 * ✅ Updated to use BahanBakuFrontend interface
 * ✅ Fixed field naming consistency (camelCase)
 * ✅ Enhanced with updated warehouseUtils functions
 * 
 * Features:
 * - Expandable details
 * - Touch-friendly actions
 * - Stock level indicators
 * - Last update timestamp
 * - Multiple alert types
 * - Compatible with updated type system
 * 
 * Size: ~4KB
 */
const MobileWarehouseCard: React.FC<MobileWarehouseCardProps> = ({
  item,
  isSelectionMode,
  searchTerm,
  isSelected,
  onToggleSelection,
  onEdit,
  onDelete,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showActions, setShowActions] = useState(false);

  // ✅ Use updated warehouseUtils functions
  const stockLevel = warehouseUtils.getStockLevel(item);
  const isExpiringItem = warehouseUtils.isExpiringItem(item);
  const isLowStockItem = warehouseUtils.isLowStockItem(item);
  const isOutOfStockItem = warehouseUtils.isOutOfStockItem(item);
  const alerts = warehouseUtils.getItemAlerts(item);

  // Highlight search terms
  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm) return text;
    
    const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === searchTerm.toLowerCase() ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  // Format last update time
  const formatLastUpdate = (timestamp?: string | Date) => {
    if (!timestamp) return 'Tidak diketahui';
    return warehouseUtils.formatLastUpdate(timestamp);
  };

  return (
    <div 
      className={`
        border rounded-lg overflow-hidden transition-all duration-200
        ${isSelected ? 'border-orange-200 bg-orange-50' : 'border-gray-200 bg-white'}
        ${stockLevel.level === 'out' ? 'border-red-200 bg-red-50' : ''}
        ${stockLevel.level === 'low' ? 'border-yellow-200 bg-yellow-50' : ''}
      `}
    >
      {/* Card Header */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Selection Checkbox */}
            {isSelectionMode && (
              <button
                onClick={() => onToggleSelection(item.id)}
                className="flex items-center justify-center w-6 h-6 rounded border-2 border-gray-300 hover:border-orange-500 transition-colors mt-1 flex-shrink-0"
                aria-label={`${isSelected ? 'Deselect' : 'Select'} ${item.nama}`}
              >
                {isSelected ? (
                  <CheckSquare className="w-5 h-5 text-orange-500" />
                ) : (
                  <Square className="w-5 h-5 text-gray-400" />
                )}
              </button>
            )}

            {/* Stock Level Indicator */}
            <div className={`w-3 h-3 rounded-full mt-2 flex-shrink-0 ${
              warehouseUtils.getStockLevelColorClass(item)
            }`} 
            title={`Stock Level: ${stockLevel.level}`}
            />

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">
                    {highlightText(item.nama, searchTerm)}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {highlightText(item.kategori, searchTerm)} • {item.stok} {item.satuan}
                  </p>
                  
                  {/* Alert Indicators */}
                  <div className="flex flex-col gap-1 mt-2">
                    {alerts.map((alert, index) => (
                      <div key={index} className={`flex items-center gap-1 text-xs ${alert.color}`}>
                        <AlertTriangle className="w-3 h-3" />
                        {alert.message}
                      </div>
                    ))}
                  </div>

                  {/* Last Update */}
                  <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                    <Clock className="w-3 h-3" />
                    Diperbarui {formatLastUpdate(item.updatedAt)}
                  </div>
                </div>

                {/* Mobile Actions */}
                {!isSelectionMode && (
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="p-1 rounded hover:bg-gray-100 transition-colors"
                      aria-label={`${isExpanded ? 'Collapse' : 'Expand'} details`}
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                      )}
                    </button>
                    <button
                      onClick={() => setShowActions(!showActions)}
                      className="p-1 rounded hover:bg-gray-100 transition-colors"
                      aria-label="Show actions"
                    >
                      <MoreVertical className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                )}
              </div>

              {/* Quick Stock Info */}
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-4">
                  <div className="text-sm">
                    <span className={`font-medium ${
                      stockLevel.level === 'out' ? 'text-red-600' :
                      stockLevel.level === 'low' ? 'text-yellow-600' :
                      'text-gray-900'
                    }`}>
                      {item.stok}
                    </span>
                    <span className="text-gray-500 ml-1">{item.satuan}</span>
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    {warehouseUtils.formatCurrency(Number(item.harga) || 0)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Actions Dropdown */}
        {showActions && !isSelectionMode && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onEdit(item);
                  setShowActions(false);
                }}
                className="flex-1 text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onDelete(item.id, item.nama);
                  setShowActions(false);
                }}
                className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Hapus
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-gray-200 bg-gray-50 p-4 space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Supplier:</span>
              <div className="font-medium text-gray-900">{item.supplier}</div>
            </div>
            <div>
              <span className="text-gray-500">Stok Minimum:</span>
              <div className="font-medium text-gray-900">{item.minimum} {item.satuan}</div>
            </div>
            <div>
              <span className="text-gray-500">Harga per {item.satuan}:</span>
              <div className="font-medium text-gray-900">
                {warehouseUtils.formatCurrency(Number(item.harga) || 0)}
              </div>
            </div>
            <div>
              <span className="text-gray-500">Kadaluarsa:</span>
              <div className={`font-medium ${isExpiringItem ? 'text-red-600' : 'text-gray-900'}`}>
                {item.expiry ? warehouseUtils.formatDate(item.expiry) : '-'}
              </div>
            </div>
            {/* Additional packaging info if available */}
            {item.jumlahBeliKemasan && (
              <>
                <div>
                  <span className="text-gray-500">Jumlah Kemasan:</span>
                  <div className="font-medium text-gray-900">
                    {item.jumlahBeliKemasan} {item.satuanKemasan || 'unit'}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Harga Kemasan:</span>
                  <div className="font-medium text-gray-900">
                    {item.hargaTotalBeliKemasan ? warehouseUtils.formatCurrency(item.hargaTotalBeliKemasan) : '-'}
                  </div>
                </div>
              </>
            )}
            <div className="col-span-2">
              <span className="text-gray-500">Terakhir diperbarui:</span>
              <div className="font-medium text-gray-900">
                {formatLastUpdate(item.updatedAt)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileWarehouseCard;