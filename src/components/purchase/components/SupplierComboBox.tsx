// src/components/purchase/components/SupplierComboBox.tsx

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Check, ChevronsUpDown, Plus, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Supplier } from '@/types/supplier';
import { useSupplierAutoSave } from '../hooks/useSupplierAutoSave';

interface SupplierComboBoxProps {
  /**
   * Current selected value (supplier name or ID)
   */
  value: string;
  
  /**
   * Callback when supplier selection changes
   * @param supplierName - Selected supplier name
   * @param supplierId - Selected supplier ID (if existing supplier)
   */
  onValueChange: (supplierName: string, supplierId?: string) => void;
  
  /**
   * List of existing suppliers
   */
  suppliers: Supplier[];
  
  /**
   * Whether the component is disabled
   */
  disabled?: boolean;
  
  /**
   * Placeholder text
   */
  placeholder?: string;
  
  /**
   * Class name for styling
   */
  className?: string;
  
  /**
   * Whether to show validation error state
   */
  hasError?: boolean;
}

export const SupplierComboBox: React.FC<SupplierComboBoxProps> = ({
  value,
  onValueChange,
  suppliers,
  disabled = false,
  placeholder = "Pilih atau tulis nama supplier",
  className,
  hasError = false,
}) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const { findSupplierByName } = useSupplierAutoSave();

  // Get current supplier info
  const currentSupplier = useMemo(() => {
    // Try to find by ID first
    const byId = suppliers.find(s => s.id === value);
    if (byId) return byId;
    
    // Try to find by name
    const byName = findSupplierByName(value);
    if (byName) return byName;
    
    // Return null if not found (probably new supplier name)
    return null;
  }, [value, suppliers, findSupplierByName]);

  // Filter suppliers based on search
  const filteredSuppliers = useMemo(() => {
    if (!searchValue.trim()) return suppliers;
    
    const search = searchValue.toLowerCase().trim();
    return suppliers.filter(supplier =>
      supplier.nama.toLowerCase().includes(search) ||
      (supplier.kontak && supplier.kontak.toLowerCase().includes(search)) ||
      (supplier.email && supplier.email.toLowerCase().includes(search))
    );
  }, [suppliers, searchValue]);

  // Display value in the trigger button
  const displayValue = useMemo(() => {
    if (currentSupplier) {
      return currentSupplier.nama;
    }
    return value || '';
  }, [currentSupplier, value]);

  // Handle selection
  const handleSelect = useCallback((selectedValue: string, supplierId?: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    if (supplier) {
      // Existing supplier selected
      onValueChange(supplier.nama, supplier.id);
    } else {
      // New supplier name entered
      onValueChange(selectedValue);
    }
    setOpen(false);
    setSearchValue('');
  }, [suppliers, onValueChange]);

  // Handle manual input (when user types new supplier name)
  const handleManualInput = useCallback((inputValue: string) => {
    const trimmedValue = inputValue.trim();
    if (trimmedValue) {
      // Check if it matches an existing supplier
      const existingSupplier = findSupplierByName(trimmedValue);
      if (existingSupplier) {
        onValueChange(existingSupplier.nama, existingSupplier.id);
      } else {
        // New supplier name
        onValueChange(trimmedValue);
      }
      setOpen(false);
      setSearchValue('');
    }
  }, [findSupplierByName, onValueChange]);

  // Reset search when dialog opens
  useEffect(() => {
    if (open) {
      setSearchValue('');
    }
  }, [open]);

  // Whether current value is a new supplier (not in existing list)
  const isNewSupplier = !currentSupplier && value.trim();

  return (
    <div className={cn("relative", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "h-11 w-full justify-between border-gray-200 focus:border-orange-500 focus:ring-orange-500/20 text-left font-normal",
              !displayValue && "text-muted-foreground",
              hasError && "border-red-300 focus:border-red-500 focus:ring-red-500/20",
              disabled && "cursor-not-allowed opacity-50"
            )}
            disabled={disabled}
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Building2 className={cn(
                "h-4 w-4 flex-shrink-0",
                displayValue ? "text-gray-600" : "text-gray-400"
              )} />
              <span className="truncate">
                {displayValue || placeholder}
              </span>
              {isNewSupplier && (
                <Badge variant="outline" className="ml-auto flex-shrink-0 bg-green-50 text-green-700 border-green-200">
                  <Plus className="h-3 w-3 mr-1" />
                  Baru
                </Badge>
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Cari atau ketik nama supplier baru..."
              value={searchValue}
              onValueChange={setSearchValue}
              className="h-10"
            />
            <CommandList className="max-h-[200px] overflow-auto">
              {/* Show manual input option when search has value */}
              {searchValue.trim() && (
                <CommandGroup>
                  <CommandItem
                    value={`new-supplier-${searchValue}`}
                    onSelect={() => handleManualInput(searchValue)}
                    className="flex items-center gap-2 cursor-pointer hover:bg-green-50"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Plus className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span className="text-green-700 font-medium truncate">
                        Tambah "{searchValue.trim()}"
                      </span>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex-shrink-0">
                      Baru
                    </Badge>
                  </CommandItem>
                </CommandGroup>
              )}

              {/* Existing suppliers */}
              {filteredSuppliers.length > 0 ? (
                <CommandGroup heading="Supplier Tersedia">
                  {filteredSuppliers.map((supplier) => (
                    <CommandItem
                      key={supplier.id}
                      value={supplier.nama}
                      onSelect={() => handleSelect(supplier.nama, supplier.id)}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Building2 className="h-4 w-4 text-gray-600 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium">
                            {supplier.nama}
                          </div>
                          {supplier.kontak && (
                            <div className="truncate text-xs text-gray-500">
                              {supplier.kontak}
                            </div>
                          )}
                        </div>
                      </div>
                      <Check
                        className={cn(
                          "h-4 w-4 flex-shrink-0",
                          (currentSupplier?.id === supplier.id || 
                           (currentSupplier?.nama === supplier.nama && !currentSupplier.id))
                            ? "opacity-100 text-orange-600"
                            : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : searchValue.trim() ? null : (
                <CommandEmpty>Belum ada supplier tersimpan</CommandEmpty>
              )}

              {/* Empty state when search doesn't match anything */}
              {searchValue.trim() && filteredSuppliers.length === 0 && (
                <CommandEmpty>
                  <div className="text-center py-4">
                    <Building2 className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">
                      Tidak ditemukan supplier yang cocok
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Gunakan opsi "Tambah" di atas untuk membuat supplier baru
                    </p>
                  </div>
                </CommandEmpty>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Helper text for new supplier */}
      {isNewSupplier && (
        <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
          <Plus className="h-3 w-3" />
          Supplier baru akan otomatis tersimpan
        </p>
      )}
    </div>
  );
};

export default SupplierComboBox;
