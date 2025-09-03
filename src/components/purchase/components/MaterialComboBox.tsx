// src/components/purchase/components/MaterialComboBox.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { Check, ChevronsUpDown, Package, Plus, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { MaterialsHistoryService, MaterialHistory } from '../services/materialsHistoryService';
import { supabase } from '@/integrations/supabase/client';

export interface MaterialComboBoxProps {
  value: string;
  onValueChange: (materialName: string, suggestedSatuan?: string) => void;
  onSatuanSuggestion?: (satuan: string) => void;
  disabled?: boolean;
  placeholder?: string;
  hasError?: boolean;
  className?: string;
}

const MaterialComboBox: React.FC<MaterialComboBoxProps> = ({
  value,
  onValueChange,
  onSatuanSuggestion,
  disabled = false,
  placeholder = 'Pilih atau tulis nama bahan baku',
  hasError = false,
  className = '',
}) => {
  const [open, setOpen] = useState(false);
  const [materialsHistory, setMaterialsHistory] = useState<MaterialHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState(value || '');
  
  // Get current user ID
  const [userId, setUserId] = useState<string | null>(null);
  
  useEffect(() => {
    const getCurrentUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    getCurrentUserId();
  }, []);

  // Load materials history when component mounts or user changes
  const loadMaterialsHistory = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const history = await MaterialsHistoryService.getMaterialsHistory(userId);
      setMaterialsHistory(history);
      logger.info('Materials history loaded:', { count: history.length });
    } catch (error) {
      logger.error('Failed to load materials history:', error);
      toast.error('Gagal memuat riwayat bahan baku');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      loadMaterialsHistory();
    }
  }, [userId, loadMaterialsHistory]);

  // Filter materials based on search
  const filteredMaterials = useMemo(() => {
    if (!searchValue.trim()) {
      return materialsHistory.slice(0, 10); // Show top 10 most used materials
    }
    
    return MaterialsHistoryService.searchMaterials(materialsHistory, searchValue).slice(0, 20);
  }, [materialsHistory, searchValue]);

  // Check if current value is in history
  const isExistingMaterial = useMemo(() => {
    return materialsHistory.some(material => 
      material.nama.toLowerCase() === value.toLowerCase()
    );
  }, [materialsHistory, value]);

  const handleSelect = useCallback((materialName: string) => {
    const material = materialsHistory.find(m => m.nama === materialName);
    
    setSearchValue(materialName);
    onValueChange(materialName, material?.satuan);
    
    // Suggest satuan if available
    if (material?.satuan && onSatuanSuggestion) {
      onSatuanSuggestion(material.satuan);
      toast.success(`Satuan "${material.satuan}" disarankan berdasarkan riwayat`, {
        description: `Bahan "${materialName}" biasanya menggunakan satuan ${material.satuan}`
      });
    }
    
    setOpen(false);
  }, [materialsHistory, onValueChange, onSatuanSuggestion]);

  const handleManualInput = useCallback((inputValue: string) => {
    if (inputValue.trim() && !isExistingMaterial) {
      setSearchValue(inputValue);
      onValueChange(inputValue.trim());
      setOpen(false);
      toast.info('Bahan baku baru akan ditambahkan ke riwayat setelah disimpan');
    }
  }, [isExistingMaterial, onValueChange]);

  // Update search value when external value changes
  useEffect(() => {
    setSearchValue(value || '');
  }, [value]);

  const formatFrequency = (frequency: number) => {
    return frequency === 1 ? '1x' : `${frequency}x`;
  };

  const formatLastUsed = (lastUsed: Date) => {
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - lastUsed.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hari ini';
    if (diffDays === 1) return '1 hari lalu';
    if (diffDays < 7) return `${diffDays} hari lalu`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} minggu lalu`;
    return `${Math.floor(diffDays / 30)} bulan lalu`;
  };

  return (
    <div className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "h-11 w-full justify-between border-gray-200 text-left font-normal hover:bg-gray-50 focus:border-orange-500 focus:ring-orange-500/20",
              !value && "text-muted-foreground",
              hasError && "border-red-300 focus:border-red-500 focus:ring-red-500/20",
              disabled && "cursor-not-allowed opacity-50"
            )}
            disabled={disabled}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Package className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="truncate">
                {value || placeholder}
              </span>
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 flex-shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-full p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Cari atau ketik nama bahan baku baru..."
              value={searchValue}
              onValueChange={setSearchValue}
              className="h-11"
            />
            <CommandList className="max-h-[300px]">
              {loading ? (
                <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500 mr-2"></div>
                  Memuat riwayat...
                </div>
              ) : (
                <>
                  {filteredMaterials.length > 0 && (
                    <CommandGroup heading={searchValue.trim() ? "Hasil pencarian" : "Sering digunakan"}>
                      {filteredMaterials.map((material) => (
                        <CommandItem
                          key={material.nama}
                          value={material.nama}
                          onSelect={() => handleSelect(material.nama)}
                          className="flex items-center justify-between py-3 cursor-pointer hover:bg-orange-50"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Check
                              className={cn(
                                "h-4 w-4 flex-shrink-0",
                                value === material.nama ? "opacity-100 text-orange-600" : "opacity-0"
                              )}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 truncate">
                                {material.nama}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{formatFrequency(material.frequency)}</span>
                                {material.satuan && (
                                  <>
                                    <span>•</span>
                                    <span className="text-orange-600 font-medium">{material.satuan}</span>
                                  </>
                                )}
                                <span>•</span>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{formatLastUsed(material.lastUsed)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {searchValue.trim() && !filteredMaterials.some(m => 
                    m.nama.toLowerCase() === searchValue.toLowerCase().trim()
                  ) && (
                    <CommandGroup heading="Bahan baku baru">
                      <CommandItem
                        value={searchValue.trim()}
                        onSelect={() => handleManualInput(searchValue)}
                        className="flex items-center gap-3 py-3 cursor-pointer hover:bg-green-50 border-t border-gray-100"
                      >
                        <Plus className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            Tambah "{searchValue.trim()}"
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Klik untuk menambah bahan baku baru
                          </div>
                        </div>
                      </CommandItem>
                    </CommandGroup>
                  )}

                  {!loading && filteredMaterials.length === 0 && !searchValue.trim() && (
                    <CommandEmpty>
                      <div className="text-center py-6">
                        <Package className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Belum ada riwayat bahan baku
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Mulai dengan mengetik nama bahan baku baru
                        </p>
                      </div>
                    </CommandEmpty>
                  )}

                  {!loading && filteredMaterials.length === 0 && searchValue.trim() && (
                    <CommandEmpty>
                      <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground">
                          Tidak ditemukan bahan baku yang cocok
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Tekan Enter atau klik untuk menambah bahan baru
                        </p>
                      </div>
                    </CommandEmpty>
                  )}
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default MaterialComboBox;
