// src/components/shared/filters/StatusFilter.tsx - Reusable Status Filter
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { FilterProps } from './types';

export const StatusFilter: React.FC<FilterProps> = ({
  value,
  onChange,
  options = [],
  placeholder = "Semua Status",
  disabled = false
}) => {
  // Handle empty value by using special value for "all"
  const handleValueChange = (newValue: string) => {
    // Convert "__all__" back to empty string for the parent component
    onChange(newValue === "__all__" ? "" : newValue);
  };
  
  // Convert empty value to special value for Select component
  const selectValue = value === "" ? "__all__" : value;
  
  return (
    <Select value={selectValue} onValueChange={handleValueChange} disabled={disabled}>
      <SelectTrigger className="w-full sm:w-[180px]">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__all__">{placeholder}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
