// 🎯 VirtualAssetTable.tsx - Virtual Scrolling Implementation for Assets
import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Building2, Plus, Square, CheckSquare } from 'lucide-react';
import VirtualTable, { VirtualTableColumn } from '@/components/ui/VirtualTable';
import { Asset } from '../types';
import { formatCurrency, formatDateForDisplay } from '../utils';
import { AssetConditionBadge } from './AssetConditionBadge';
import { AssetCategoryBadge } from './AssetCategoryBadge';
import { AssetActions } from './AssetActions';
import { cn } from '@/lib/utils';

interface VirtualAssetTableProps {
  assets: Asset[];
  onEdit: (asset: Asset) => void;
  onDelete: (id: string, name: string) => void;
  onAddNew: () => void;
  isLoading?: boolean;
  isDeleting?: boolean;
  // Bulk operations props
  selectedIds?: string[];
  onSelectionChange?: (assetId: string) => void;
  isSelectionMode?: boolean;
  onSelectAll?: () => void;
  isAllSelected?: boolean;
}

// Empty State Component
const EmptyState: React.FC<{
  onAddNew: () => void;
}> = ({ onAddNew }) => {
  return (
    <div className="text-center py-12">
      <Building2 className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-sm font-medium text-gray-900">
        Belum ada data aset
      </h3>
      <p className="mt-1 text-sm text-gray-500">
        Mulai dengan menambahkan aset pertama
      </p>
      <div className="mt-6">
        <Button onClick={onAddNew} className="bg-orange-500 hover:bg-orange-600">
          <Plus className="mr-2 h-4 w-4" />
          Tambah Aset Pertama
        </Button>
      </div>
    </div>
  );
};

export const VirtualAssetTable: React.FC<VirtualAssetTableProps> = ({
  assets,
  onEdit,
  onDelete,
  onAddNew,
  isLoading = false,
  isDeleting = false,
  selectedIds = [],
  onSelectionChange,
  isSelectionMode = false,
  onSelectAll,
  isAllSelected = false,
}) => {
  // Handle selection changes
  const handleSelectionChange = (assetId: string) => {
    onSelectionChange?.(assetId);
  };

  const handleSelectAll = () => {
    onSelectAll?.();
  };

  // Check if all current page items are selected
  const allCurrentSelected = assets.length > 0 && assets.every(asset => selectedIds.includes(asset.id));
  const someCurrentSelected = assets.some(asset => selectedIds.includes(asset.id)) && !allCurrentSelected;

  // Define columns for virtual table
  const columns: VirtualTableColumn<Asset>[] = useMemo(() => {
    const baseColumns: VirtualTableColumn<Asset>[] = [
      {
        key: 'nama',
        header: 'Nama Aset',
        width: 180,
        render: (asset: Asset) => (
          <div className="max-w-[160px]">
            <div className="font-medium truncate text-gray-900" title={asset.nama}>
              {asset.nama}
            </div>
            {asset.deskripsi && (
              <div className="text-xs text-gray-500 truncate mt-1" title={asset.deskripsi}>
                {asset.deskripsi}
              </div>
            )}
          </div>
        )
      },
      {
        key: 'kategori',
        header: 'Kategori',
        width: 120,
        render: (asset: Asset) => (
          <AssetCategoryBadge category={asset.kategori} />
        )
      },
      {
        key: 'nilaiAwal',
        header: 'Nilai Awal',
        width: 120,
        align: 'right' as const,
        render: (asset: Asset) => (
          <div className="text-gray-900 font-medium">
            {formatCurrency(asset.nilaiAwal)}
          </div>
        )
      },
      {
        key: 'nilaiSaatIni',
        header: 'Nilai Sekarang',
        width: 140,
        align: 'right' as const,
        render: (asset: Asset) => (
          <div className="flex flex-col text-right">
            <span className="text-gray-900 font-medium">{formatCurrency(asset.nilaiSaatIni)}</span>
            {asset.nilaiSaatIni < asset.nilaiAwal && (
              <span className="text-xs text-red-600">
                -{formatCurrency(asset.nilaiAwal - asset.nilaiSaatIni)}
              </span>
            )}
          </div>
        )
      },
      {
        key: 'depresiasi',
        header: 'Depresiasi (%)',
        width: 120,
        align: 'center' as const,
        render: (asset: Asset) => (
          <span className={cn(
            "font-medium",
            asset.depresiasi && asset.depresiasi > 0 ? 'text-red-600' : 'text-gray-900'
          )}>
            {asset.depresiasi?.toFixed(1) || 0}%
          </span>
        )
      },
      {
        key: 'kondisi',
        header: 'Kondisi',
        width: 120,
        align: 'center' as const,
        render: (asset: Asset) => (
          <AssetConditionBadge condition={asset.kondisi} />
        )
      },
      {
        key: 'lokasi',
        header: 'Lokasi',
        width: 120,
        render: (asset: Asset) => (
          <div className="text-sm text-gray-700 truncate" title={asset.lokasi}>
            {asset.lokasi}
          </div>
        )
      },
      {
        key: 'tanggalPembelian',
        header: 'Tanggal Pembelian',
        width: 140,
        align: 'center' as const,
        render: (asset: Asset) => (
          <div className="text-sm text-gray-700">
            {formatDateForDisplay(asset.tanggalPembelian)}
          </div>
        )
      },
      {
        key: 'actions',
        header: 'Aksi',
        width: 80,
        align: 'right' as const,
        render: (asset: Asset) => (
          !isSelectionMode ? (
            <AssetActions
              asset={asset}
              onEdit={() => onEdit(asset)}
              onDelete={() => onDelete(asset.id, asset.nama)}
              isDeleting={isDeleting}
            />
          ) : null
        )
      }
    ];

    // Add selection column if in selection mode
    if (isSelectionMode) {
      return [
        {
          key: 'selection',
          header: (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSelectAll}
              className="h-8 w-8 p-0"
            >
              {allCurrentSelected ? (
                <CheckSquare className="h-4 w-4 text-orange-600" />
              ) : someCurrentSelected ? (
                <div className="h-3 w-3 bg-orange-500 rounded-sm"></div>
              ) : (
                <Square className="h-4 w-4" />
              )}
            </Button>
          ) as any,
          width: 50,
          render: (asset: Asset) => (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSelectionChange(asset.id)}
              className="h-8 w-8 p-0"
            >
              {selectedIds.includes(asset.id) ? (
                <CheckSquare className="h-4 w-4 text-orange-600" />
              ) : (
                <Square className="h-4 w-4" />
              )}
            </Button>
          )
        },
        ...baseColumns
      ];
    }

    return baseColumns;
  }, [isSelectionMode, selectedIds, allCurrentSelected, someCurrentSelected, onEdit, onDelete, isDeleting]);

  // Handle row click
  const handleRowClick = (asset: Asset) => {
    if (isSelectionMode) {
      handleSelectionChange(asset.id);
    }
  };

  if (assets.length === 0 && !isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200/80 overflow-hidden">
        <EmptyState onAddNew={onAddNew} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bulk Actions */}
      {isSelectionMode && selectedIds.length > 0 && (
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-sm text-blue-700">
            <span className="font-medium">{selectedIds.length}</span> aset dipilih
          </p>
        </div>
      )}
      
      <div className="bg-white rounded-xl border border-gray-200/80 overflow-hidden">
        <VirtualTable
          data={assets}
          columns={columns}
          loading={isLoading}
          itemHeight={70}
          containerHeight={600}
          onRowClick={handleRowClick}
          className="w-full"
          emptyMessage="Tidak ada aset"
          hoverable={true}
          striped={true}
          getItemId={(asset) => asset.id}
        />
      </div>
    </div>
  );
};

export default VirtualAssetTable;