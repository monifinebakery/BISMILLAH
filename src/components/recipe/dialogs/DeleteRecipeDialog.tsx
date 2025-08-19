// src/components/recipe/dialogs/DeleteRecipeDialog.tsx

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  Trash2, 
  X, 
  ChefHat,
  DollarSign,
  Users,
  Calendar
} from 'lucide-react';
import { formatCurrency, formatPercentage } from '../services/recipeUtils';
import type { Recipe, DeleteRecipeDialogProps } from '../types';

const DeleteRecipeDialog: React.FC<DeleteRecipeDialogProps> = ({
  isOpen,
  onOpenChange,
  recipe,
  onConfirm,
  isLoading = false,
}) => {
  const [confirmText, setConfirmText] = useState('');
  const [isConfirmEnabled, setIsConfirmEnabled] = useState(false);

  const expectedConfirmText = 'HAPUS';

  React.useEffect(() => {
    setIsConfirmEnabled(confirmText.toUpperCase() === expectedConfirmText);
  }, [confirmText]);

  React.useEffect(() => {
    if (isOpen) {
      setConfirmText('');
      setIsConfirmEnabled(false);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    if (!isConfirmEnabled || !recipe) return;
    
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting recipe:', error);
    }
  };

  if (!isOpen || !recipe) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-white border">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-red-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-red-900">
                Hapus Resep
              </h2>
              <p className="text-sm text-red-700">
                Tindakan ini tidak dapat dibatalkan
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
        </div>

        <CardContent className="p-6">
          
          {/* Warning Message */}
          <div className="mb-6">
            <p className="text-gray-700 mb-2">
              Anda akan menghapus resep berikut secara permanen:
            </p>
            
            {/* Recipe Summary Card */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <ChefHat className="w-4 h-4 text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {recipe.namaResep}
                  </h3>
                  
                  {recipe.kategoriResep && (
                    <Badge variant="outline" className="mt-1 text-xs">
                      {recipe.kategoriResep}
                    </Badge>
                  )}
                  
                  {recipe.deskripsi && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                      {recipe.deskripsi}
                    </p>
                  )}
                </div>
              </div>

              {/* Recipe Stats */}
              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">Porsi</p>
                    <p className="text-sm font-medium text-gray-900">
                      {recipe.jumlahPorsi}
                      {recipe.jumlahPcsPerPorsi > 1 && ` (${recipe.jumlahPcsPerPorsi} pcs)`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">HPP/Porsi</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatCurrency(recipe.hppPerPorsi)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-green-500"></div>
                  <div>
                    <p className="text-xs text-gray-500">Margin</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatPercentage(recipe.marginKeuntunganPersen)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">Dibuat</p>
                    <p className="text-sm font-medium text-gray-900">
                      {recipe.createdAt.toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Ingredients Count */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">{recipe.bahanResep.length}</span> bahan akan ikut terhapus
                </p>
              </div>
            </div>
          </div>

          {/* Impact Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-900 mb-1">
                  Data yang akan hilang:
                </h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• Semua informasi resep dan bahan-bahan</li>
                  <li>• Kalkulasi HPP dan analisis biaya</li>
                  <li>• Riwayat pembuatan dan update resep</li>
                  <li>• Data tidak dapat dikembalikan</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Confirmation Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ketik <code className="bg-gray-100 px-2 py-1 rounded text-red-600 font-mono">
                {expectedConfirmText}
              </code> untuk mengonfirmasi:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Ketik HAPUS untuk mengonfirmasi"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                confirmText === '' 
                  ? 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  : isConfirmEnabled
                  ? 'border-green-300 focus:ring-green-500 focus:border-green-500 bg-green-50'
                  : 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50'
              }`}
              disabled={isLoading}
              autoComplete="off"
            />
            {confirmText && !isConfirmEnabled && (
              <p className="text-sm text-red-600 mt-1">
                Teks konfirmasi tidak sesuai
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="flex-1"
            >
              Batal
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!isConfirmEnabled || isLoading}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Menghapus...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Hapus Resep
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeleteRecipeDialog;