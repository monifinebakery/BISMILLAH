// src/components/financial/components/TransactionFilters.tsx - Using Shared Filter Components
import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Filter, X, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
// ✅ USING SHARED FILTER COMPONENTS
import { SearchInput, StatusFilter } from '@/components/shared/filters';
import type { FilterOption } from '@/components/shared/filters/types';
import type { TransactionFilters, UseTransactionFiltersReturn } from '../hooks/useTransactionFilters';

interface TransactionFiltersProps {
  filters: TransactionFilters;
  availableCategories: string[];
  hasActiveFilters: boolean;
  onUpdateFilters: (filters: Partial<TransactionFilters>) => void;
  onClearFilters: () => void;
  className?: string;
}

// Transaction type options
const TRANSACTION_TYPE_OPTIONS: FilterOption[] = [
  { label: 'Pemasukan', value: 'income' },
  { label: 'Pengeluaran', value: 'expense' }
];

const TransactionFiltersComponent: React.FC<TransactionFiltersProps> = ({
  filters,
  availableCategories,
  hasActiveFilters,
  onUpdateFilters,
  onClearFilters,
  className
}) => {
  // Convert categories to FilterOption format
  const categoryOptions = useMemo(() => {
    return availableCategories.map(cat => ({
      label: cat,
      value: cat
    }));
  }, [availableCategories]);

  const activeFiltersCount = Object.values(filters).filter(value => {
    if (value === 'all' || value === '') return false;
    return true;
  }).length;

  return (
    <Card className={cn("mb-6", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Transaksi
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount}
              </Badge>
            )}
          </CardTitle>
          
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearFilters}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Search */}
        <div>
          <SearchInput
            value={filters.search}
            onChange={(value) => onUpdateFilters({ search: value })}
            placeholder="Cari berdasarkan deskripsi atau kategori..."
          />
        </div>
        
        {/* Type and Category Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Tipe Transaksi</label>
            <StatusFilter
              value={filters.type === 'all' ? '' : filters.type}
              onChange={(value) => onUpdateFilters({ type: value === '' ? 'all' : value as 'income' | 'expense' })}
              options={TRANSACTION_TYPE_OPTIONS}
              placeholder="Semua Tipe"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Kategori</label>
            <StatusFilter
              value={filters.category === 'all' ? '' : filters.category}
              onChange={(value) => onUpdateFilters({ category: value === '' ? 'all' : value })}
              options={categoryOptions}
              placeholder="Semua Kategori"
            />
          </div>
        </div>
      </CardContent>

    </Card>
  );
};

export default TransactionFiltersComponent;
