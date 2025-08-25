import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { PurchaseFilters, PurchaseFiltersProps } from '../types/purchase.types';
import { getStatusDisplayText } from '../utils/purchaseHelpers';

const PurchaseFilters: React.FC<PurchaseFiltersProps> = ({
  filters,
  onChange,
  suppliers = [],
  className = '',
}) => {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...filters, searchQuery: e.target.value });
  };

  const handleStatusChange = (value: string) => {
    onChange({
      ...filters,
      statusFilter: value as PurchaseFilters['statusFilter'],
    });
  };

  const handleSupplierChange = (value: string) => {
    onChange({ ...filters, supplierFilter: value === 'all' ? undefined : value });
  };

  return (
    <div className={`flex flex-col sm:flex-row gap-4 ${className}`}>
      <Input
        placeholder="Cari supplier atau item..."
        value={filters.searchQuery}
        onChange={handleSearchChange}
        className="w-full sm:w-64"
      />

      <Select value={filters.statusFilter} onValueChange={handleStatusChange}>
        <SelectTrigger className="w-full sm:w-40">
          <SelectValue placeholder="Semua Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua Status</SelectItem>
          <SelectItem value="pending">{getStatusDisplayText('pending')}</SelectItem>
          <SelectItem value="completed">{getStatusDisplayText('completed')}</SelectItem>
          <SelectItem value="cancelled">{getStatusDisplayText('cancelled')}</SelectItem>
        </SelectContent>
      </Select>

      {suppliers.length > 0 && (
        <Select
          value={filters.supplierFilter || 'all'}
          onValueChange={handleSupplierChange}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Semua Supplier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Supplier</SelectItem>
            {suppliers.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.nama}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
};

export default PurchaseFilters;
