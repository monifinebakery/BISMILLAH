// src/components/financial/components/TransactionFilters.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Filter, X, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TransactionFilters, UseTransactionFiltersReturn } from '../hooks/useTransactionFilters';

interface TransactionFiltersProps {
  filters: TransactionFilters;
  availableCategories: string[];
  hasActiveFilters: boolean;
  onUpdateFilters: (filters: Partial<TransactionFilters>) => void;
  onClearFilters: () => void;
  className?: string;
}

const TransactionFiltersComponent: React.FC<TransactionFiltersProps> = ({
  filters,
  availableCategories,
  hasActiveFilters,
  onUpdateFilters,
  onClearFilters,
  className
}) => {
  return (
    <Card className={cn("mb-4", className)}>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cari berdasarkan deskripsi atau kategori..."
              value={filters.search}
              onChange={(e) => onUpdateFilters({ search: e.target.value })}
              className="pl-10"
            />
          </div>

          {/* Type Filter */}
          <div className="min-w-[140px]">
            <Select
              value={filters.type}
              onValueChange={(value: 'all' | 'income' | 'expense') => 
                onUpdateFilters({ type: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Semua Tipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tipe</SelectItem>
                <SelectItem value="income">Pemasukan</SelectItem>
                <SelectItem value="expense">Pengeluaran</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category Filter */}
          <div className="min-w-[160px]">
            <Select
              value={filters.category}
              onValueChange={(value: string) => 
                onUpdateFilters({ category: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Semua Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {availableCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearFilters}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Bersihkan
            </Button>
          )}
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="text-sm text-gray-500">Filter aktif:</span>
            
            {filters.search && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Search className="h-3 w-3" />
                "{filters.search}"
                <button
                  onClick={() => onUpdateFilters({ search: '' })}
                  className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            
            {filters.type !== 'all' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {filters.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                <button
                  onClick={() => onUpdateFilters({ type: 'all' })}
                  className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            
            {filters.category !== 'all' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {filters.category}
                <button
                  onClick={() => onUpdateFilters({ category: 'all' })}
                  className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionFiltersComponent;
