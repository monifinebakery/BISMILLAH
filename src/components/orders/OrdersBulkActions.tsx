// src/components/orders/OrdersBulkActions.tsx
// 🔧 ORDERS BULK ACTIONS COMPONENT - Bulk operations toolbar

import React from 'react';
import { CheckSquare, X, Edit, Trash2, Download, Archive, Users, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export interface OrdersBulkActionsProps {
  // Selection State
  isSelectionMode: boolean;
  selectedOrderIds: string[];
  totalFilteredItems: number;
  
  // Selection Actions
  onToggleSelectionMode: () => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  
  // Bulk Operations
  onBulkEdit: () => void;
  onBulkDelete: () => void;
  onBulkExport?: () => void;
  onBulkArchive?: () => void;
  onBulkAssign?: () => void;
  
  // Display Props
  className?: string;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'default' | 'compact' | 'minimal';
  showAdvancedActions?: boolean;
}

// 🎯 Selection Summary Component
const SelectionSummary: React.FC<{
  selectedCount: number;
  totalItems: number;
  variant: 'default' | 'compact' | 'minimal';
}> = ({ selectedCount, totalItems, variant }) => {
  if (variant === 'minimal') return null;

  const selectionPercentage = totalItems > 0 ? Math.round((selectedCount / totalItems) * 100) : 0;

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <CheckSquare className="h-5 w-5 text-blue-600" />
        <span className="font-medium text-blue-700">
          {variant === 'compact' ? 'Mode Pilih' : 'Mode Pilih Multiple'}
        </span>
      </div>
      
      {selectedCount > 0 && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200 px-3 py-1 font-semibold">
            {selectedCount} item dipilih
          </Badge>
          
          {variant === 'default' && totalItems > 0 && (
            <Badge variant="outline" className="text-xs">
              {selectionPercentage}% dari total
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

// 🔧 Control Buttons Component
const ControlButtons: React.FC<{
  isSelectionMode: boolean;
  selectedCount: number;
  totalItems: number;
  onToggleMode: () => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  loading?: boolean;
  variant: 'default' | 'compact' | 'minimal';
}> = ({ 
  isSelectionMode, 
  selectedCount, 
  totalItems, 
  onToggleMode, 
  onSelectAll, 
  onClearSelection,
  loading,
  variant 
}) => {
  const buttonSize = variant === 'compact' ? 'sm' : 'sm';
  const isAllSelected = selectedCount === totalItems && totalItems > 0;
  
  return (
    <div className="flex items-center gap-2">
      {/* Selection Mode Toggle */}
      <Button
        variant={isSelectionMode ? "default" : "outline"}
        size={buttonSize}
        onClick={onToggleMode}
        disabled={loading}
        className={cn(
          isSelectionMode 
            ? "bg-blue-600 hover:bg-blue-700 text-white" 
            : "border-blue-300 text-blue-600 hover:bg-blue-50"
        )}
      >
        {isSelectionMode ? (
          <>
            <X className="h-4 w-4 mr-2" />
            {variant === 'compact' ? 'Keluar' : 'Keluar Mode'}
          </>
        ) : (
          <>
            <CheckSquare className="h-4 w-4 mr-2" />
            {variant === 'compact' ? 'Pilih' : 'Mode Pilih'}
          </>
        )}
      </Button>

      {/* Select All / Clear */}
      {isSelectionMode && (
        <>
          <Button
            variant="outline"
            size={buttonSize}
            onClick={isAllSelected ? onClearSelection : onSelectAll}
            disabled={loading || totalItems === 0}
            className="border-blue-300 text-blue-600 hover:bg-blue-50"
          >
            <Users className="h-4 w-4 mr-2" />
            {isAllSelected ? 'Batal Semua' : `Pilih Semua (${totalItems})`}
          </Button>
          
          {selectedCount > 0 && !isAllSelected && (
            <Button
              variant="outline"
              size={buttonSize}
              onClick={onClearSelection}
              disabled={loading}
              className="border-gray-300 hover:bg-gray-50"
            >
              <X className="h-4 w-4 mr-2" />
              Reset
            </Button>
          )}
        </>
      )}
    </div>
  );
};

// 🔧 Primary Action Buttons Component
const PrimaryActionButtons: React.FC<{
  selectedCount: number;
  onBulkEdit: () => void;
  onBulkDelete: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant: 'default' | 'compact' | 'minimal';
}> = ({ 
  selectedCount, 
  onBulkEdit, 
  onBulkDelete,
  loading,
  disabled,
  variant 
}) => {
  if (selectedCount === 0) return null;

  const buttonSize = variant === 'compact' ? 'sm' : 'sm';
  const showLabels = variant !== 'minimal';

  return (
    <div className="flex items-center gap-2">
      {/* Edit Button */}
      <Button
        variant="outline"
        size={buttonSize}
        onClick={onBulkEdit}
        disabled={loading || disabled}
        className="border-green-300 text-green-600 hover:bg-green-50"
      >
        <Edit className="h-4 w-4 mr-2" />
        {showLabels ? `Edit ${selectedCount} Item` : 'Edit'}
      </Button>

      {/* Delete Button */}
      <Button
        variant="destructive"
        size={buttonSize}
        onClick={onBulkDelete}
        disabled={loading || disabled}
        className="bg-red-600 hover:bg-red-700"
      >
        <Trash2 className="h-4 w-4 mr-2" />
        {showLabels ? `Hapus ${selectedCount} Item` : 'Hapus'}
      </Button>
    </div>
  );
};

// 🚀 Advanced Action Buttons Component
const AdvancedActionButtons: React.FC<{
  selectedCount: number;
  onBulkExport?: () => void;
  onBulkArchive?: () => void;
  onBulkAssign?: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant: 'default' | 'compact' | 'minimal';
}> = ({ 
  selectedCount, 
  onBulkExport, 
  onBulkArchive, 
  onBulkAssign,
  loading,
  disabled,
  variant 
}) => {
  if (selectedCount === 0) return null;

  const buttonSize = variant === 'compact' ? 'sm' : 'sm';
  const showLabels = variant !== 'minimal';
  
  const actions = [
    onBulkExport && {
      key: 'export',
      icon: Download,
      label: 'Export',
      className: 'border-purple-300 text-purple-600 hover:bg-purple-50',
      onClick: onBulkExport
    },
    onBulkArchive && {
      key: 'archive', 
      icon: Archive,
      label: 'Arsip',
      className: 'border-gray-300 text-gray-600 hover:bg-gray-50',
      onClick: onBulkArchive
    },
    onBulkAssign && {
      key: 'assign',
      icon: Users,
      label: 'Assign',
      className: 'border-orange-300 text-orange-600 hover:bg-orange-50',
      onClick: onBulkAssign
    }
  ].filter(Boolean);

  if (actions.length === 0) return null;

  // If only 1-2 actions, show as buttons
  if (actions.length <= 2) {
    return (
      <div className="flex items-center gap-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.key}
              variant="outline"
              size={buttonSize}
              onClick={action.onClick}
              disabled={loading || disabled}
              className={action.className}
            >
              <Icon className="h-4 w-4 mr-2" />
              {showLabels && `${action.label} ${selectedCount} Item`}
            </Button>
          );
        })}
      </div>
    );
  }

  // If 3+ actions, use dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size={buttonSize}
          disabled={loading || disabled}
          className="border-gray-300 text-gray-600 hover:bg-gray-50"
        >
          <MoreHorizontal className="h-4 w-4 mr-2" />
          Aksi Lainnya
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <React.Fragment key={action.key}>
              <DropdownMenuItem 
                onClick={action.onClick}
                className="cursor-pointer"
              >
                <Icon className="h-4 w-4 mr-2" />
                {action.label} {selectedCount} Item
              </DropdownMenuItem>
              {index < actions.length - 1 && <DropdownMenuSeparator />}
            </React.Fragment>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// 🔧 Main OrdersBulkActions Component
export const OrdersBulkActions: React.FC<OrdersBulkActionsProps> = ({
  isSelectionMode,
  selectedOrderIds,
  totalFilteredItems,
  onToggleSelectionMode,
  onSelectAll,
  onClearSelection,
  onBulkEdit,
  onBulkDelete,
  onBulkExport,
  onBulkArchive,
  onBulkAssign,
  className,
  loading = false,
  disabled = false,
  variant = 'default',
  showAdvancedActions = true
}) => {
  const selectedCount = selectedOrderIds.length;

  // Don't show if not in selection mode and no items selected
  if (!isSelectionMode && selectedCount === 0) {
    return null;
  }

  // 🎨 Variant Styles
  const getVariantStyles = () => {
    switch (variant) {
      case 'compact':
        return {
          card: 'p-3',
          content: 'gap-3'
        };
      case 'minimal':
        return {
          card: 'p-2 bg-blue-50/50 border-blue-100',
          content: 'gap-2'
        };
      default:
        return {
          card: 'p-4',
          content: 'gap-4'
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <Card className={cn(
      "border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg transition-all duration-200",
      variant === 'minimal' && "shadow-sm",
      className
    )}>
      <CardContent className={variantStyles.card}>
        <div className={cn(
          "flex flex-col lg:flex-row items-start lg:items-center justify-between",
          variantStyles.content
        )}>
          {/* Selection Summary */}
          <SelectionSummary 
            selectedCount={selectedCount} 
            totalItems={totalFilteredItems}
            variant={variant} 
          />

          {/* Actions Container */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
            {/* Control Buttons */}
            <ControlButtons
              isSelectionMode={isSelectionMode}
              selectedCount={selectedCount}
              totalItems={totalFilteredItems}
              onToggleMode={onToggleSelectionMode}
              onSelectAll={onSelectAll}
              onClearSelection={onClearSelection}
              loading={loading}
              variant={variant}
            />

            {/* Primary Actions */}
            <PrimaryActionButtons
              selectedCount={selectedCount}
              onBulkEdit={onBulkEdit}
              onBulkDelete={onBulkDelete}
              loading={loading}
              disabled={disabled}
              variant={variant}
            />

            {/* Advanced Actions */}
            {showAdvancedActions && (
              <AdvancedActionButtons
                selectedCount={selectedCount}
                onBulkExport={onBulkExport}
                onBulkArchive={onBulkArchive}
                onBulkAssign={onBulkAssign}
                loading={loading}
                disabled={disabled}
                variant={variant}
              />
            )}
          </div>
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div className="mt-3 pt-3 border-t border-blue-200">
            <div className="flex items-center justify-center gap-2 text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
              <span className="text-sm">Memproses operasi bulk...</span>
            </div>
          </div>
        )}

        {/* Selection Helper Text */}
        {isSelectionMode && selectedCount === 0 && variant === 'default' && (
          <div className="mt-3 pt-3 border-t border-blue-200">
            <p className="text-sm text-blue-600 text-center">
              💡 Klik checkbox pada tabel untuk memilih item, atau gunakan tombol "Pilih Semua" di atas.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OrdersBulkActions;