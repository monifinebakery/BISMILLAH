// src/components/shared/filters/types.ts - Filter Types
export interface FilterOption {
  label: string;
  value: string;
}

export interface DateRange {
  start?: string;
  end?: string;
}

export interface BaseFilters {
  search?: string;
  dateRange?: DateRange;
}

export interface OrderFiltersState extends BaseFilters {
  status?: string;
  customer?: string;
  paymentStatus?: string;
}

export interface FilterProps {
  value: string;
  onChange: (value: string) => void;
  options?: FilterOption[];
  placeholder?: string;
  disabled?: boolean;
}

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  debounceMs?: number;
}
