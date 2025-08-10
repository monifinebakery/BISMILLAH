// src/components/assets/components/AssetCard.tsx

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Asset } from '../types';
import { formatCurrency, formatDateForDisplay } from '../utils';
import { AssetConditionBadge } from './AssetConditionBadge';
import { AssetCategoryBadge } from './AssetCategoryBadge';
import { AssetActions } from './AssetActions';

interface AssetCardProps {
  asset: Asset;
  onEdit: (asset: Asset) => void;
  onDelete: (id: string, name: string) => void;
  isDeleting?: boolean;
}

export const AssetCard: React.FC<AssetCardProps> = ({
  asset,
  onEdit,
  onDelete,
  isDeleting = false,
}) => {
  return (
    <Card className="border border-orange-200 hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-sm text-gray-900 line-clamp-2">{asset.nama}</h3>
          <AssetActions
            asset={asset}
            onEdit={onEdit}
            onDelete={onDelete}
            isDeleting={isDeleting}
            size="sm"
          />
        </div>
        
        <div className="space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Kategori:</span>
            <AssetCategoryBadge category={asset.kategori} size="sm" />
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Nilai Awal:</span>
            <span className="font-medium text-gray-900">
              {formatCurrency(asset.nilaiAwal)}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Nilai Sekarang:</span>
            <span className="font-medium text-gray-900">
              {formatCurrency(asset.nilaiSaatIni)}
            </span>
          </div>
          
          {asset.depresiasi !== null && asset.depresiasi !== undefined && (
            <div className="flex justify-between">
              <span className="text-gray-600">Depresiasi:</span>
              <span className="font-medium text-gray-900">{asset.depresiasi}%</span>
            </div>
          )}
          
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Kondisi:</span>
            <AssetConditionBadge condition={asset.kondisi} size="sm" />
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Lokasi:</span>
            <span className="font-medium text-gray-900 text-right max-w-[50%] break-words">
              {asset.lokasi}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Tanggal Beli:</span>
            <span className="font-medium text-gray-900">
              {formatDateForDisplay(asset.tanggalPembelian)}
            </span>
          </div>
          
          {asset.deskripsi && (
            <div className="pt-2 border-t border-gray-100">
              <span className="text-gray-600 text-xs">Deskripsi:</span>
              <p className="text-gray-900 text-xs mt-1 line-clamp-2">
                {asset.deskripsi}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};