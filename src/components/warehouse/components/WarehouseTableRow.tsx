// src/components/warehouse/components/WarehouseTableRow.tsx
import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';
import { warehouseUtils } from '../services/warehouseUtils';
import type { BahanBakuFrontend } from '../types';
import { logger } from '@/utils/logger';
import { useSupplier } from '@/contexts/SupplierContext';

interface WarehouseTableRowProps {
  item: BahanBakuFrontend;
  variant: 'mobile' | 'desktop';
  isSelectionMode: boolean;
  isSelected: boolean;
  onToggleSelection: (id: string) => void;
  searchTerm: string;
  onEdit: (item: BahanBakuFrontend) => void;
  onDelete: (id: string, nama: string) => void;
}

const WarehouseTableRow: React.FC<WarehouseTableRowProps> = ({
  item,
  variant,
  isSelectionMode,
  isSelected,
  onToggleSelection,
  searchTerm,
  onEdit,
  onDelete,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMobileActions, setShowMobileActions] = useState(false);
  const { getSupplierById } = useSupplier();
  const supplierName = useMemo(() => {
    if (!item.supplier) return '-';
    const supplier = getSupplierById(item.supplier);
    return supplier?.nama || item.supplier;
  }, [item.supplier, getSupplierById]);

  const highlightText = (text: string, term: string) => {
    if (!term) return text;
    const parts = text.split(new RegExp(`(${term})`, 'gi'));
    return parts.map((part, idx) =>
      part.toLowerCase() === term.toLowerCase() ? (
        <mark key={idx} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const getStockLevel = (it: BahanBakuFrontend) => {
    const stok = Number(it.stok) || 0;
    const minimum = Number(it.minimum) || 0;
    return warehouseUtils.formatStockLevel(stok, minimum);
  };

  const isExpiringItem = (it: BahanBakuFrontend): boolean => {
    if (!it.expiry) return false;
    const expiryDate = new Date(it.expiry);
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + 7);
    return expiryDate <= threshold && expiryDate > new Date();
  };

  const isLowStockItem = (it: BahanBakuFrontend): boolean => {
    const stok = Number(it.stok) || 0;
    const minimum = Number(it.minimum) || 0;
    return stok <= minimum && stok > 0;
  };

  const isOutOfStockItem = (it: BahanBakuFrontend): boolean => {
    const stok = Number(it.stok) || 0;
    return stok <= 0;
  };

  const stockLevel = getStockLevel(item);
  const isExpiringSoon = isExpiringItem(item);
  const isLowStock = isLowStockItem(item);
  const isOutOfStock = isOutOfStockItem(item);

  if (variant === 'mobile') {
    return (
      <div
        key={item.id}
        className={`
          border rounded-lg overflow-hidden transition-all duration-200
          ${isSelected ? 'border-orange-200 bg-orange-50' : 'border-gray-200 bg-white'}
          ${stockLevel.level === 'out' ? 'border-red-200 bg-red-50' : ''}
          ${stockLevel.level === 'low' ? 'border-yellow-200 bg-yellow-50' : ''}
        `}
      >
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {isSelectionMode && (
                <button
                  onClick={() => {
                    onToggleSelection(item.id);
                    logger.component('WarehouseTableRow', 'Item selection toggled', {
                      itemId: item.id,
                      selected: !isSelected,
                    });
                  }}
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

              <div
                className={`w-3 h-3 rounded-full mt-2 flex-shrink-0 ${
                  stockLevel.level === 'out'
                    ? 'bg-red-500'
                    : stockLevel.level === 'low'
                    ? 'bg-yellow-500'
                    : stockLevel.level === 'medium'
                    ? 'bg-blue-500'
                    : 'bg-green-500'
                }`}
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">
                      {highlightText(item.nama, searchTerm)}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {highlightText(item.kategori, searchTerm)} • {item.stok}{' '}
                      {item.satuan}
                    </p>

                    <div className="flex flex-col gap-1 mt-2">
                      {isExpiringSoon && (
                        <div className="flex items-center gap-1 text-xs text-red-600">
                          <AlertTriangle className="w-3 h-3" />
                          Akan kadaluarsa
                        </div>
                      )}
                      {isOutOfStock && (
                        <div className="flex items-center gap-1 text-xs text-red-600">
                          <AlertTriangle className="w-3 h-3" />
                          Stok habis
                        </div>
                      )}
                      {isLowStock && !isOutOfStock && (
                        <div className="flex items-center gap-1 text-xs text-yellow-600">
                          <AlertTriangle className="w-3 h-3" />
                          Stok hampir habis
                        </div>
                      )}
                    </div>
                  </div>

                  {!isSelectionMode && (
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={() => {
                          const newState = !isExpanded;
                          setIsExpanded(newState);
                          logger.component('WarehouseTableRow', `Item ${item.id} ${newState ? 'expanded' : 'collapsed'}`);
                        }}
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
                        onClick={() => {
                          const newState = !showMobileActions;
                          setShowMobileActions(newState);
                          logger.component('WarehouseTableRow', 'Mobile actions toggled', {
                            itemId: item.id,
                            show: newState,
                          });
                        }}
                        className="p-1 rounded hover:bg-gray-100 transition-colors"
                        aria-label="Show actions"
                      >
                        <MoreVertical className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-4">
                    <div className="text-sm">
                      <span
                        className={`font-medium ${
                          stockLevel.level === 'out'
                            ? 'text-red-600'
                            : stockLevel.level === 'low'
                            ? 'text-yellow-600'
                            : 'text-gray-900'
                        }`}
                      >
                        {item.stok}
                      </span>
                      <span className="text-gray-500 ml-1">{item.satuan}</span>
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {warehouseUtils.formatCurrency(
                        warehouseUtils.getEffectiveUnitPrice(item)
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {showMobileActions && !isSelectionMode && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    logger.component('WarehouseTableRow', 'Edit item clicked', item.id);
                    onEdit(item);
                    setShowMobileActions(false);
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
                    logger.component('WarehouseTableRow', 'Delete item clicked', {
                      id: item.id,
                      nama: item.nama,
                    });
                    onDelete(item.id, item.nama);
                    setShowMobileActions(false);
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

        {isExpanded && (
          <div className="border-t border-gray-200 bg-gray-50 p-4 space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Supplier:</span>
                <div className="font-medium text-gray-900">{supplierName}</div>
              </div>
              <div>
                <span className="text-gray-500">Stok Minimum:</span>
                <div className="font-medium text-gray-900">
                  {item.minimum} {item.satuan}
                </div>
              </div>
              <div>
                <span className="text-gray-500">Harga per {item.satuan}:</span>
                <div className="font-medium text-gray-900">
                  {warehouseUtils.formatCurrency(
                    warehouseUtils.getEffectiveUnitPrice(item)
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  per {item.satuan}
                  {warehouseUtils.isUsingWac(item) ? ' · rata-rata' : ''}
                </div>
              </div>
              <div>
                <span className="text-gray-500">Harga dari Pembelian:</span>
                <div className="font-medium text-gray-900">
                  {item.hargaPerSatuan ? warehouseUtils.formatCurrency(item.hargaPerSatuan) : '-'}
                </div>
                
              </div>
              <div>
                <span className="text-gray-500">Total Nilai Stok:</span>
                <div className="font-medium text-gray-900">
                  {warehouseUtils.formatCurrency(item.stok * warehouseUtils.getEffectiveUnitPrice(item))}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {item.stok} × {warehouseUtils.formatCurrency(warehouseUtils.getEffectiveUnitPrice(item))}
                </div>
              </div>
              <div>
                <span className="text-gray-500">Kadaluarsa:</span>
                <div className={`font-medium ${isExpiringSoon ? 'text-red-600' : 'text-gray-900'}`}>
                  {item.expiry ? warehouseUtils.formatDate(item.expiry) : '-'}
                </div>
              </div>
              
            </div>
          </div>
        )}
      </div>
    );
  }

  // Desktop variant
  return (
    <tr
      key={item.id}
      className={`transition-colors ${isSelectionMode ? 'hover:bg-orange-50' : ''} ${
        isSelected ? 'bg-orange-50' : ''
      }`}
    >
      {isSelectionMode && (
        <td className="px-4 py-4">
          <button
            onClick={() => {
              onToggleSelection(item.id);
              logger.component('WarehouseTableRow', 'Desktop item selection toggled', {
                itemId: item.id,
                selected: !isSelected,
              });
            }}
            className="flex items-center justify-center w-5 h-5 rounded border-2 border-gray-300 hover:border-orange-500 transition-colors"
            aria-label={`${isSelected ? 'Deselect' : 'Select'} ${item.nama}`}
          >
            {isSelected ? (
              <CheckSquare className="w-4 h-4 text-orange-500" />
            ) : (
              <Square className="w-4 h-4 text-gray-400" />
            )}
          </button>
        </td>
      )}

      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded-full ${
              stockLevel.level === 'out'
                ? 'bg-red-500'
                : stockLevel.level === 'low'
                ? 'bg-yellow-500'
                : stockLevel.level === 'medium'
                ? 'bg-blue-500'
                : 'bg-green-500'
            }`}
          />
          <div>
            <div className="font-medium text-gray-900">
              {highlightText(item.nama, searchTerm)}
            </div>

            <div className="flex flex-col gap-1 mt-1">
              {isExpiringSoon && (
                <div className="flex items-center gap-1 text-xs text-red-600">
                  <AlertTriangle className="w-3 h-3" />
                  Akan kadaluarsa
                </div>
              )}
              {isOutOfStock && (
                <div className="flex items-center gap-1 text-xs text-red-600">
                  <AlertTriangle className="w-3 h-3" />
                  Stok habis
                </div>
              )}
              {isLowStock && !isOutOfStock && (
                <div className="flex items-center gap-1 text-xs text-yellow-600">
                  <AlertTriangle className="w-3 h-3" />
                  Stok hampir habis
                </div>
              )}
            </div>
          </div>
        </div>
      </td>

      <td className="px-4 py-4">
        <span className="text-sm text-gray-900">
          {highlightText(item.kategori, searchTerm)}
        </span>
        <div className="text-xs text-gray-500 mt-1">{supplierName}</div>
      </td>

      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          <span
            className={`font-medium ${
              stockLevel.level === 'out'
                ? 'text-red-600'
                : stockLevel.level === 'low'
                ? 'text-yellow-600'
                : 'text-gray-900'
            }`}
          >
            {item.stok}
          </span>
          <span className="text-sm text-gray-500">{item.satuan}</span>
        </div>
        <div className="text-xs text-gray-400">Min: {item.minimum}</div>
      </td>

      <td className="px-4 py-4">
        <span className="text-sm font-medium text-gray-900">
          {warehouseUtils.formatCurrency(warehouseUtils.getEffectiveUnitPrice(item))}
        </span>
        <div className="text-xs text-gray-500">
          per {item.satuan}
          {warehouseUtils.isUsingWac(item) ? ' · rata-rata' : ''}
        </div>
      </td>

      <td className="px-4 py-4">
        <span className="text-sm font-medium text-gray-900">
          {item.hargaPerSatuan ? warehouseUtils.formatCurrency(item.hargaPerSatuan) : '-'}
        </span>
        <div className="text-xs text-gray-500">
          dari pembelian
        </div>
      </td>

      <td className="px-4 py-4">
        <span className="text-sm font-medium text-gray-900">
          {warehouseUtils.formatCurrency(item.stok * warehouseUtils.getEffectiveUnitPrice(item))}
        </span>
        <div className="text-xs text-gray-500">
          {item.stok} × {warehouseUtils.formatCurrency(warehouseUtils.getEffectiveUnitPrice(item))}
        </div>
      </td>

      <td className="px-4 py-4">
        {item.expiry ? (
          <div className={`text-sm ${isExpiringSoon ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
            {warehouseUtils.formatDate(item.expiry)}
          </div>
        ) : (
          <span className="text-sm text-gray-400">-</span>
        )}
      </td>

      <td className="px-4 py-4">
        <div className="text-sm text-gray-900">
          {warehouseUtils.formatDate(item.updatedAt)}
        </div>
      </td>

      {!isSelectionMode && (
        <td className="px-4 py-4 text-right">
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                logger.component('WarehouseTableRow', 'Desktop edit item clicked', item.id);
                onEdit(item);
              }}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <Edit2 className="w-4 h-4" />
              <span className="sr-only">Edit {item.nama}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                logger.component('WarehouseTableRow', 'Desktop delete item clicked', {
                  id: item.id,
                  nama: item.nama,
                });
                onDelete(item.id, item.nama);
              }}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
              <span className="sr-only">Delete {item.nama}</span>
            </Button>
          </div>
        </td>
      )}
    </tr>
  );
};

export default WarehouseTableRow;
