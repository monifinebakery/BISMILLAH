// Search and filter controls for supplier table - Using Shared Filter Components

import React, { useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, X, Filter, Settings } from 'lucide-react';
// ✅ USING SHARED FILTER COMPONENTS
import { SearchInput, StatusFilter } from '@/components/shared/filters';
import type { FilterOption } from '@/components/shared/filters/types';

interface SupplierFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  itemsPerPage: number;
  onItemsPerPageChange: (count: number) => void;
  isSelectionMode: boolean;
  onSelectionModeChange: (enabled: boolean) => void;
}

// Items per page options
const ITEMS_PER_PAGE_OPTIONS: FilterOption[] = [
  { label: '5', value: '5' },
  { label: '10', value: '10' },
  { label: '20', value: '20' },
  { label: '50', value: '50' }
];

const SupplierFilters: React.FC<SupplierFiltersProps> = ({
  searchTerm,
  onSearchChange,
  itemsPerPage,
  onItemsPerPageChange,
  isSelectionMode,
  onSelectionModeChange
}) => {
  const hasActiveFilters = searchTerm !== '';
  
  const handleClearFilters = () => {
    onSearchChange('');
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Supplier
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2">
                1
              </Badge>
            )}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {/* Selection mode toggle */}
            <Button
              variant={isSelectionMode ? "default" : "outline"}
              size="sm"
              onClick={() => onSelectionModeChange(!isSelectionMode)}
              className={isSelectionMode ? "bg-blue-600 hover:bg-blue-700" : ""}
            >
              {isSelectionMode ? (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Keluar Mode Pilih
                </>
              ) : (
                <>
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Mode Pilih
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Search */}
        <div>
          <SearchInput
            value={searchTerm}
            onChange={onSearchChange}
            placeholder="Cari Nama Supplier / Kontak..."
          />
        </div>
        
        {/* Items per Page */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-gray-500" />
            <Label className="text-sm font-medium text-gray-700">Tampilkan per halaman:</Label>
          </div>
          
          <div className="w-24">
            <StatusFilter
              value={String(itemsPerPage)}
              onChange={(value) => onItemsPerPageChange(Number(value))}
              options={ITEMS_PER_PAGE_OPTIONS}
              placeholder="10"
            />
          </div>
        </div>
        
        {/* Clear filters if active */}
        {hasActiveFilters && (
          <div className="flex justify-end border-t pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Bersihkan Filter
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SupplierFilters;