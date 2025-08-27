// src/components/recipe/dialogs/BulkOperationsDialog.tsx

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ChefHat,
  Edit3,
  Trash2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import { formatCurrency, formatPercentage } from '../services/recipeUtils';
import type { Recipe } from '../types';
import type { RecipeBulkEditData } from '../hooks/useRecipeBulk';

interface BulkOperationsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedRecipes: Recipe[];
  availableCategories: string[];
  onBulkEdit: (editData: RecipeBulkEditData) => Promise<void>;
  onBulkDelete: () => Promise<void>;
  isProcessing: boolean;
  progress: { current: number; total: number };
}

type OperationType = 'edit' | 'delete';

const BulkOperationsDialog: React.FC<BulkOperationsDialogProps> = ({
  isOpen,
  onOpenChange,
  selectedRecipes,
  availableCategories,
  onBulkEdit,
  onBulkDelete,
  isProcessing,
  progress
}) => {
  const [operationType, setOperationType] = useState<OperationType>('edit');
  const [editData, setEditData] = useState<RecipeBulkEditData>({});
  const [errors, setErrors] = useState<string[]>([]);

  const handleSubmit = async () => {
    setErrors([]);
    
    try {
      if (operationType === 'edit') {
        // Validate edit data
        const validationErrors: string[] = [];
        
        if (editData.biayaTenagaKerja !== undefined && editData.biayaTenagaKerja < 0) {
          validationErrors.push('Biaya tenaga kerja tidak boleh negatif');
        }
        
        if (editData.biayaOverhead !== undefined && editData.biayaOverhead < 0) {
          validationErrors.push('Biaya overhead tidak boleh negatif');
        }
        
        if (editData.marginKeuntunganPersen !== undefined) {
          if (editData.marginKeuntunganPersen < 0) {
            validationErrors.push('Margin keuntungan tidak boleh negatif');
          }
          if (editData.marginKeuntunganPersen > 1000) {
            validationErrors.push('Margin keuntungan terlalu tinggi (maksimal 1000%)');
          }
        }
        
        if (Object.keys(editData).length === 0) {
          validationErrors.push('Pilih minimal satu field untuk diedit');
        }
        
        if (validationErrors.length > 0) {
          setErrors(validationErrors);
          return;
        }
        
        await onBulkEdit(editData);
      } else {
        await onBulkDelete();
      }
      
      // Reset form and close dialog
      setEditData({});
      setErrors([]);
      onOpenChange(false);
    } catch (error) {
      console.error('Bulk operation failed:', error);
    }
  };

  const handleReset = () => {
    setEditData({});
    setErrors([]);
  };

  const progressPercentage = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent centerMode="overlay" size="md+">
        <div className="dialog-panel">
          <DialogHeader className="dialog-header">
            <DialogTitle className="flex items-center gap-2">
              {operationType === 'edit' ? (
                <>
                  <Edit3 className="h-5 w-5 text-blue-600" />
                  Edit Massal Resep
                </>
              ) : (
                <>
                  <Trash2 className="h-5 w-5 text-red-600" />
                  Hapus Massal Resep
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {operationType === 'edit'
                ? `Edit ${selectedRecipes.length} resep sekaligus. Perubahan akan diterapkan ke semua resep yang dipilih.`
                : `Hapus ${selectedRecipes.length} resep secara permanen. Tindakan ini tidak dapat dibatalkan.`
              }
            </DialogDescription>
          </DialogHeader>

          <div className="dialog-body">
            <div className="space-y-6">
          {/* Operation Type Selector */}
          <div className="flex gap-2">
            <Button
              variant={operationType === 'edit' ? 'default' : 'outline'}
              onClick={() => setOperationType('edit')}
              disabled={isProcessing}
              className="flex items-center gap-2"
            >
              <Edit3 className="h-4 w-4" />
              Edit Massal
            </Button>
            <Button
              variant={operationType === 'delete' ? 'destructive' : 'outline'}
              onClick={() => setOperationType('delete')}
              disabled={isProcessing}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Hapus Massal
            </Button>
          </div>

          {/* Selected Recipes Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <ChefHat className="h-4 w-4" />
                Resep yang Dipilih ({selectedRecipes.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {selectedRecipes.slice(0, 10).map((recipe) => (
                  <div key={recipe.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <ChefHat className="h-3 w-3 text-orange-500" />
                      <span className="font-medium">{recipe.namaResep}</span>
                      {recipe.kategoriResep && (
                        <Badge variant="secondary" className="text-xs">
                          {recipe.kategoriResep}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      HPP: {formatCurrency(recipe.hppPerPorsi)}
                    </div>
                  </div>
                ))}
                {selectedRecipes.length > 10 && (
                  <p className="text-xs text-gray-500 italic text-center">
                    ... dan {selectedRecipes.length - 10} resep lainnya
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Edit Form */}
          {operationType === 'edit' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Pengaturan Edit Massal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Category */}
                <div className="space-y-2">
                  <Label htmlFor="kategori">Kategori Resep</Label>
                  <Select
                    value={editData.kategoriResep || 'no-change'}
                    onValueChange={(value) => 
                      setEditData(prev => ({ 
                        ...prev, 
                        kategoriResep: value === 'no-change' ? undefined : value 
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kategori (opsional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-change">Tidak mengubah kategori</SelectItem>
                      {availableCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Labor Cost */}
                <div className="space-y-2">
                  <Label htmlFor="biayaTenagaKerja">Biaya Tenaga Kerja</Label>
                  <Input
                    id="biayaTenagaKerja"
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="Kosongkan jika tidak ingin mengubah"
                    value={editData.biayaTenagaKerja || ''}
                    onChange={(e) => 
                      setEditData(prev => ({ 
                        ...prev, 
                        biayaTenagaKerja: e.target.value ? Number(e.target.value) : undefined 
                      }))
                    }
                  />
                </div>

                {/* Overhead Cost */}
                <div className="space-y-2">
                  <Label htmlFor="biayaOverhead">Biaya Overhead</Label>
                  <Input
                    id="biayaOverhead"
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="Kosongkan jika tidak ingin mengubah"
                    value={editData.biayaOverhead || ''}
                    onChange={(e) => 
                      setEditData(prev => ({ 
                        ...prev, 
                        biayaOverhead: e.target.value ? Number(e.target.value) : undefined 
                      }))
                    }
                  />
                </div>

                {/* Profit Margin */}
                <div className="space-y-2">
                  <Label htmlFor="marginKeuntungan">Margin Keuntungan (%)</Label>
                  <Input
                    id="marginKeuntungan"
                    type="number"
                    min="0"
                    max="1000"
                    step="5"
                    placeholder="Kosongkan jika tidak ingin mengubah"
                    value={editData.marginKeuntunganPersen || ''}
                    onChange={(e) => 
                      setEditData(prev => ({ 
                        ...prev, 
                        marginKeuntunganPersen: e.target.value ? Number(e.target.value) : undefined 
                      }))
                    }
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleReset}
                    disabled={isProcessing}
                    className="flex items-center gap-2"
                  >
                    <XCircle className="h-4 w-4" />
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Delete Confirmation */}
          {operationType === 'delete' && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-red-900 mb-1">
                      Peringatan: Tindakan Permanen
                    </h4>
                    <p className="text-sm text-red-700">
                      Semua data resep yang dipilih akan dihapus secara permanen dan tidak dapat dikembalikan.
                      Pastikan Anda telah membackup data jika diperlukan.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Progress */}
          {isProcessing && (
            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm font-medium">
                      {operationType === 'edit' ? 'Memproses edit massal...' : 'Memproses hapus massal...'}
                    </span>
                  </div>
                  <Progress value={progressPercentage} className="w-full" />
                  <p className="text-xs text-gray-600">
                    {progress.current} dari {progress.total} resep telah diproses
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-red-900 mb-2">Kesalahan Validasi:</h4>
                    <ul className="text-sm text-red-700 space-y-1">
                      {errors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
            </div>
          </div>

          <DialogFooter className="dialog-footer">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
              className="w-full sm:w-auto"
            >
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isProcessing}
              variant={operationType === 'delete' ? 'destructive' : 'default'}
              className="w-full sm:w-auto flex items-center gap-2"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : operationType === 'edit' ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              {operationType === 'edit' 
                ? `Edit ${selectedRecipes.length} Resep`
                : `Hapus ${selectedRecipes.length} Resep`
              }
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkOperationsDialog;