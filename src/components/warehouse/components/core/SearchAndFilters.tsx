import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, CheckSquare, X } from 'lucide-react';

interface SearchAndFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  itemsPerPage: number;
  onItemsPerPageChange: (value: number) => void;
  isSelectionMode: boolean;
  onToggleSelectionMode: () => void;
}

const SearchAndFilters: React.FC<SearchAndFiltersProps> = ({
  searchTerm,
  onSearchChange,
  itemsPerPage,
  onItemsPerPageChange,
  isSelectionMode,
  onToggleSelectionMode
}) => {
  return (
    <div className="p-4 sm:p-6 border-b border-gray-200 bg-gray-50/50">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Label htmlFor="show-entries" className="whitespace-nowrap font-medium">Show</Label>
            <Select 
              value={String(itemsPerPage)} 
              onValueChange={(value) => onItemsPerPageChange(Number(value))}
            >
              <SelectTrigger className="w-20 border-gray-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <span className="font-medium">entries</span>
          </div>

          <Button
            variant={isSelectionMode ? "default" : "outline"}
            size="sm"
            onClick={onToggleSelectionMode}
            className={isSelectionMode ? "bg-blue-600 hover:bg-blue-700" : "border-blue-300 text-blue-600 hover:bg-blue-50"}
            aria-label={isSelectionMode ? "Keluar Mode Pilih" : "Masuk Mode Pilih"}
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

        <div className="w-full lg:w-auto relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Cari bahan baku, kategori, atau supplier..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 border-gray-300 rounded-lg shadow-sm focus:border-orange-500 focus:ring-orange-500 w-full lg:w-80"
            aria-label="Cari Bahan Baku"
          />
        </div>
      </div>
    </div>
  );
};

export default SearchAndFilters;