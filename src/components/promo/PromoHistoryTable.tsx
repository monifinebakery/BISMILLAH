// components/promo/PromoHistoryTable.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatCurrency, formatPercentage } from '@/utils/currencyUtils';
import { cn } from '@/lib/utils';

interface PromoEstimation {
  id: string;
  promo_name: string;
  promo_type: string;
  base_recipe_name: string;
  original_price: number;
  promo_price_effective: number;
  estimated_margin_percent: number;
}

interface PaginationData {
  totalPages: number;
  paginatedPromos: PromoEstimation[];
  total: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface Props {
  promoHistory: PromoEstimation[];
  selectedPromos: Set<string>;
  setSelectedPromos: (promos: Set<string>) => void;
  currentPage: number;
  onPageChange: (page: number) => void;
  onBulkDelete: () => void;
  paginationData: PaginationData;
}

// 📊 Table Row Component
const PromoTableRow: React.FC<{
  promo: PromoEstimation;
  index: number;
  selectedPromos: Set<string>;
  onToggleSelect: (id: string, checked: boolean) => void;
}> = ({ promo, index, selectedPromos, onToggleSelect }) => {
  const isSelected = selectedPromos.has(promo.id);
  const isNegativeMargin = promo.estimated_margin_percent < 0;

  return (
    <TableRow
      className={cn(
        "hover:bg-orange-50/50 transition-colors",
        index % 2 === 0 ? "bg-white" : "bg-gray-50/30",
        isSelected && "bg-orange-100/50"
      )}
    >
      {/* ✅ Checkbox */}
      <TableCell>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onToggleSelect(promo.id, e.target.checked)}
          className="rounded border-orange-300 text-orange-600 focus:ring-orange-500"
        />
      </TableCell>

      {/* 📝 Promo Name */}
      <TableCell className="font-medium text-gray-800">
        <div className="flex items-center gap-2">
          <span className="truncate max-w-[200px]" title={promo.promo_name}>
            {promo.promo_name}
          </span>
          {isNegativeMargin && (
            <Badge variant="destructive" className="text-xs">
              RUGI
            </Badge>
          )}
        </div>
      </TableCell>

      {/* 📦 Product */}
      <TableCell className="text-gray-700">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <span className="truncate max-w-[150px]" title={promo.base_recipe_name}>
            {promo.base_recipe_name}
          </span>
        </div>
      </TableCell>

      {/* 💰 Original Price */}
      <TableCell className="text-gray-700 font-medium">
        {formatCurrency(promo.original_price)}
      </TableCell>

      {/* 🏷️ Promo Price */}
      <TableCell className="font-semibold text-orange-700">
        {formatCurrency(promo.promo_price_effective)}
      </TableCell>

      {/* 📊 Margin */}
      <TableCell>
        <div className="flex items-center gap-2">
          <span className={cn(
            "font-semibold",
            isNegativeMargin ? 'text-red-600' : 'text-green-600'
          )}>
            {formatPercentage(promo.estimated_margin_percent)}
          </span>
        </div>
      </TableCell>
    </TableRow>
  );
};

// 📄 Pagination Controls
const PaginationControls: React.FC<{
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  total: number;
  onPageChange: (page: number) => void;
}> = ({ currentPage, totalPages, hasNext, hasPrev, total, onPageChange }) => (
  <div className="flex justify-between items-center mt-6 pt-4 border-t border-orange-100">
    <Button
      variant="outline"
      onClick={() => onPageChange(currentPage - 1)}
      disabled={!hasPrev}
      className="text-orange-700 hover:bg-orange-50 border-orange-200 hover:border-orange-300"
    >
      <ChevronLeft className="h-4 w-4 mr-1" />
      Sebelum
    </Button>
    
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600">
        Halaman {currentPage} dari {totalPages}
      </span>
      <Badge variant="secondary" className="bg-orange-100 text-orange-800">
        {total} total
      </Badge>
    </div>

    <Button
      variant="outline"
      onClick={() => onPageChange(currentPage + 1)}
      disabled={!hasNext}
      className="text-orange-700 hover:bg-orange-50 border-orange-200 hover:border-orange-300"
    >
      Sesudah
      <ChevronRight className="h-4 w-4 ml-1" />
    </Button>
  </div>
);

// 📭 Empty State
const EmptyState: React.FC = () => (
  <TableRow>
    <TableCell colSpan={6} className="text-center h-32">
      <div className="flex flex-col items-center gap-4">
        <div className="p-4 bg-gray-100 rounded-full">
          <Package className="h-8 w-8 text-gray-400" />
        </div>
        <div className="text-center">
          <p className="text-lg font-medium text-gray-600 mb-1">
            Belum ada riwayat promo
          </p>
          <p className="text-gray-500 text-sm">
            Buat estimasi promo pertama Anda untuk melihat riwayat di sini
          </p>
        </div>
      </div>
    </TableCell>
  </TableRow>
);

const PromoHistoryTable: React.FC<Props> = ({
  promoHistory,
  selectedPromos,
  setSelectedPromos,
  currentPage,
  onPageChange,
  onBulkDelete,
  paginationData
}) => {
  // 🎯 Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPromos(new Set(promoHistory.map(p => p.id)));
    } else {
      setSelectedPromos(new Set());
    }
  };

  // ✅ Handle individual select
  const handleToggleSelect = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedPromos);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedPromos(newSelected);
  };

  const isAllSelected = selectedPromos.size === paginationData.total && paginationData.total > 0;

  return (
    <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
      {/* 📋 Header */}
      <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-lg p-6">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-semibold flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Package className="h-5 w-5" />
              </div>
              Riwayat Estimasi Promo
            </CardTitle>
            <CardDescription className="text-orange-100 mt-1">
              {paginationData.total} estimasi promo tersimpan
            </CardDescription>
          </div>
          
          {/* 🗑️ Bulk Delete Button */}
          <Button
            variant="destructive"
            onClick={onBulkDelete}
            disabled={selectedPromos.size === 0}
            className="bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Trash2 size={16} className="mr-2" />
            Hapus Terpilih ({selectedPromos.size})
          </Button>
        </div>
      </CardHeader>

      {/* 📊 Table Content */}
      <CardContent className="p-6">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gradient-to-r from-orange-50 to-red-50">
              <TableRow className="hover:bg-orange-50/50">
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-orange-300 text-orange-600 focus:ring-orange-500"
                  />
                </TableHead>
                <TableHead className="text-gray-800 font-semibold">
                  Nama Promo
                </TableHead>
                <TableHead className="text-gray-800 font-semibold">
                  Produk
                </TableHead>
                <TableHead className="text-gray-800 font-semibold">
                  Harga Asli
                </TableHead>
                <TableHead className="text-gray-800 font-semibold">
                  Harga Promo
                </TableHead>
                <TableHead className="text-gray-800 font-semibold">
                  Margin
                </TableHead>
              </TableRow>
            </TableHeader>
            
            <TableBody>
              {paginationData.paginatedPromos.length > 0 ? (
                paginationData.paginatedPromos.map((promo, index) => (
                  <PromoTableRow
                    key={promo.id}
                    promo={promo}
                    index={index}
                    selectedPromos={selectedPromos}
                    onToggleSelect={handleToggleSelect}
                  />
                ))
              ) : (
                <EmptyState />
              )}
            </TableBody>
          </Table>
        </div>

        {/* 📄 Pagination */}
        {paginationData.totalPages > 1 && (
          <PaginationControls
            currentPage={currentPage}
            totalPages={paginationData.totalPages}
            hasNext={paginationData.hasNext}
            hasPrev={paginationData.hasPrev}
            total={paginationData.total}
            onPageChange={onPageChange}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default PromoHistoryTable;