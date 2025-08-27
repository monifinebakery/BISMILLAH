import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  Copy, 
  X, 
  ChefHat,
  Check,
  AlertCircle,
  Info,
  Users,
  DollarSign
} from 'lucide-react';
import { formatCurrency } from '../services/recipeUtils';
import type { Recipe, DuplicateRecipeDialogProps } from '../types';

const DuplicateRecipeDialog: React.FC<DuplicateRecipeDialogProps> = ({
  isOpen,
  onOpenChange,
  recipe,
  onConfirm,
  isLoading = false,
}) => {
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && recipe) {
      const suggestedName = `${recipe.namaResep} (Copy)`;
      setNewName(suggestedName);
      setError('');
    }
  }, [isOpen, recipe]);

  const validateName = (name: string): string => {
    if (!name.trim()) return 'Nama resep tidak boleh kosong';
    if (name.trim().length < 3) return 'Nama resep minimal 3 karakter';
    if (name.trim().length > 100) return 'Nama resep maksimal 100 karakter';
    if (recipe && name.trim() === recipe.namaResep) return 'Nama resep harus berbeda dari aslinya';
    return '';
  };

  const handleNameChange = (value: string) => {
    setNewName(value);
    const validationError = validateName(value);
    setError(validationError);
  };

  const handleConfirm = async () => {
    const validationError = validateName(newName);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const success = await onConfirm(newName.trim());
      if (success) {
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error duplicating recipe:', error);
      setError('Gagal menduplikasi resep');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !error && newName.trim()) {
      handleConfirm();
    }
  };

  if (!isOpen || !recipe) return null;

  const isValid = !error && newName.trim().length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="dialog-overlay-center">
        <div className="dialog-panel w-full max-w-lg">
          <DialogHeader className="dialog-header-pad border-b border-gray-200 bg-blue-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Copy className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-blue-900">
                  Duplikasi Resep
                </h2>
                <p className="text-sm text-blue-700">
                  Buat salinan resep dengan nama baru
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>

          <div className="dialog-body overflow-y-auto">
          {/* Original Recipe Info */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Resep yang akan diduplikasi:
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <ChefHat className="w-4 h-4 text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 truncate">
                    {recipe.namaResep}
                  </h4>
                  <div className="flex items-center gap-2 mt-2">
                    {recipe.kategoriResep && (
                      <Badge variant="outline" className="text-xs">
                        {recipe.kategoriResep}
                      </Badge>
                    )}
                  </div>
                  {recipe.deskripsi && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                      {recipe.deskripsi}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Users className="w-3 h-3 text-gray-500" />
                    <span className="text-xs text-gray-500">Porsi</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    {recipe.jumlahPorsi}
                  </p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <DollarSign className="w-3 h-3 text-gray-500" />
                    <span className="text-xs text-gray-500">HPP</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    {formatCurrency(recipe.hppPerPorsi)}
                  </p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <ChefHat className="w-3 h-3 text-gray-500" />
                    <span className="text-xs text-gray-500">Bahan</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    {recipe.bahanResep.length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* New Recipe Name Input */}
          <div className="mb-6">
            <Label htmlFor="newRecipeName" className="text-sm font-medium text-gray-700 mb-2 block">
              Nama resep baru *
            </Label>
            <div className="relative">
              <Input
                id="newRecipeName"
                type="text"
                value={newName}
                onChange={(e) => handleNameChange(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Masukkan nama untuk resep baru"
                className={`pr-10 ${
                  error 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                    : isValid 
                    ? 'border-green-300 focus:border-green-500 focus:ring-green-500'
                    : 'border-gray-300'
                }`}
                disabled={isLoading}
                autoFocus
              />
              {isValid && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Check className="w-4 h-4 text-green-500" />
                </div>
              )}
            </div>
            {error && (
              <div className="flex items-center gap-2 mt-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Nama harus unik dan berbeda dari resep aslinya
            </p>
          </div>

          {/* What will be duplicated */}
          <div className="mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Info className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-blue-900 mb-2">
                    Yang akan diduplikasi:
                  </h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Semua informasi resep (kategori, deskripsi, porsi)</li>
                    <li>• Daftar lengkap bahan dan takaran</li>
                    <li>• Kalkulasi biaya dan margin keuntungan</li>
                    <li>• Pengaturan HPP dan harga jual</li>
                  </ul>
                  <p className="text-sm text-blue-700 mt-2 font-medium">
                    Resep asli tetap aman dan tidak berubah
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Name Suggestions */}
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Saran nama alternatif:
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                `${recipe.namaResep} (Versi 2)`,
                `${recipe.namaResep} - Modified`,
                `New ${recipe.namaResep}`,
              ].map((suggestion) => (
                <Button
                  key={suggestion}
                  variant="outline"
                  size="sm"
                  onClick={() => handleNameChange(suggestion)}
                  disabled={isLoading}
                  className="text-xs"
                >
                  {suggestion.length > 25 ? `${suggestion.substring(0, 25)}...` : suggestion}
                </Button>
              ))}
            </div>
          </div>

          </div>

          <DialogFooter className="dialog-footer-pad">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Batal
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!isValid || isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Menduplikasi...
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Duplikasi
                </>
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DuplicateRecipeDialog;