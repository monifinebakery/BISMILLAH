// src/components/assets/components/AssetTable.tsx

import React, { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Building2, Plus, Square, CheckSquare } from 'lucide-react';
import { Asset } from '../types';
import { formatCurrency, formatDateForDisplay } from '../utils';
import { AssetConditionBadge } from './AssetConditionBadge';
import { AssetCategoryBadge } from './AssetCategoryBadge';
import { AssetActions } from './AssetActions';
import BulkActions from './BulkActions';

interface AssetTableProps {
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

export const AssetTable: React.FC<AssetTableProps> = ({
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
  // Check if all current page items are selected
  const allCurrentSelected = assets.length > 0 && assets.every(asset => selectedIds.includes(asset.id));
  const someCurrentSelected = assets.some(asset => selectedIds.includes(asset.id)) && !allCurrentSelected;

  // Toggle select all current page items
  const toggleSelectAllCurrent = () => {
    if (onSelectAll) {
      onSelectAll();
    }
  };

  // Toggle select individual asset
  const toggleSelectAsset = (assetId: string) => {
    if (onSelectionChange) {
      onSelectionChange(assetId);
    }
  };

  if (isLoading) {
    return (
      <ScrollArea className="w-full">
        <div className="min-w-[800px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead className="w-[180px] text-gray-700">Nama Aset</TableHead>
                <TableHead className="text-gray-700">Kategori</TableHead>
                <TableHead className="text-gray-700">Nilai Awal</TableHead>
                <TableHead className="text-gray-700">Nilai Sekarang</TableHead>
                <TableHead className="text-gray-700">Depresiasi (%)</TableHead>
                <TableHead className="text-gray-700">Kondisi</TableHead>
                <TableHead className="text-gray-700">Lokasi</TableHead>
                <TableHead className="text-gray-700">Tanggal Pembelian</TableHead>
                <TableHead className="text-right text-gray-700">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3, 4, 5].map((i) => (
                <TableRow key={i}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((j) => (
                    <TableCell key={j}>
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </ScrollArea>
    );
  }

  return (
    <>
      {/* Bulk Actions */}
      {isSelectionMode && (
        <BulkActions
          selectedCount={selectedIds.length}
          onBulkEdit={() => console.log('Bulk edit not implemented yet')}
          onBulkDelete={() => console.log('Bulk delete not implemented yet')}
          onClearSelection={() => {
            // Clear selection logic would go here
            console.log('Clear selection');
          }}
          isProcessing={false}
        />
      )}
      
      <ScrollArea className="w-full">
        <div className="min-w-[800px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  {isSelectionMode && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleSelectAllCurrent}
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
                  )}
                </TableHead>
                <TableHead className="w-[180px] text-gray-700">Nama Aset</TableHead>
                <TableHead className="text-gray-700">Kategori</TableHead>
                <TableHead className="text-gray-700">Nilai Awal</TableHead>
                <TableHead className="text-gray-700">Nilai Sekarang</TableHead>
                <TableHead className="text-gray-700">Depresiasi (%)</TableHead>
                <TableHead className="text-gray-700">Kondisi</TableHead>
                <TableHead className="text-gray-700">Lokasi</TableHead>
                <TableHead className="text-gray-700">Tanggal Pembelian</TableHead>
                <TableHead className="text-right text-gray-700">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.length > 0 ? (
                assets.map((asset) => (
                  <TableRow 
                    key={asset.id} 
                    className={`hover:bg-gray-50 ${selectedIds.includes(asset.id) ? 'bg-blue-50' : ''}`}
                  >
                    <TableCell>
                      {isSelectionMode && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleSelectAsset(asset.id)}
                          className="h-8 w-8 p-0"
                        >
                          {selectedIds.includes(asset.id) ? (
                            <CheckSquare className="h-4 w-4 text-orange-600" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </TableCell>
                    <TableCell className="font-medium text-gray-900">
                      <div className="max-w-[160px]">
                        <div className="font-medium truncate" title={asset.nama}>
                          {asset.nama}
                        </div>
                        {asset.deskripsi && (
                          <div className="text-xs text-gray-500 truncate mt-1" title={asset.deskripsi}>
                            {asset.deskripsi}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <AssetCategoryBadge category={asset.kategori} />
                    </TableCell>
                    
                    <TableCell className="text-gray-900">
                      {formatCurrency(asset.nilaiAwal)}
                    </TableCell>
                    
                    <TableCell className="text-gray-900">
                      <div className="flex flex-col">
                        <span>{formatCurrency(asset.nilaiSaatIni)}</span>
                        {asset.nilaiSaatIni < asset.nilaiAwal && (
                          <span className="text-xs text-red-600">
                            -{formatCurrency(asset.nilaiAwal - asset.nilaiSaatIni)}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-gray-900">
                      <span className={asset.depresiasi && asset.depresiasi > 0 ? 'text-red-600' : ''}>
                        {asset.depresiasi?.toFixed(1) || 0}%
                      </span>
                    </TableCell>
                    
                    <TableCell>
                      <AssetConditionBadge condition={asset.kondisi} />
                    </TableCell>
                    
                    <TableCell className="text-gray-900">
                      <div className="max-w-[120px] truncate" title={asset.lokasi}>
                        {asset.lokasi}
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-gray-900">
                      {formatDateForDisplay(asset.tanggalPembelian)}
                    </TableCell>
                    
                    <TableCell className="text-right">
                      <AssetActions
                        asset={asset}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        isDeleting={isDeleting}
                      />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-12">
                    <div className="flex flex-col items-center gap-4">
                      <Building2 className="h-16 w-16 text-gray-300" />
                      <div className="text-center">
                        <p className="text-lg font-medium text-gray-600 mb-2">
                          Belum ada aset yang terdaftar
                        </p>
                        <p className="text-gray-500 text-sm mb-4">
                          Klik tombol "Tambah Aset" untuk memulai mengelola aset
                        </p>
                        <Button
                          onClick={onAddNew}
                          className="bg-orange-500 hover:bg-orange-600 text-white"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Tambah Aset Pertama
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </ScrollArea>
    </>
  );
};