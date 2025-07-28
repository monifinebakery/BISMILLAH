import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Recipe } from '@/types/recipe';
import { CategoryBadge } from '../../shared/components/CategoryBadge';
import { PriceDisplay } from '../../shared/components/PriceDisplay';
import { ActionButtons } from '../../shared/components/ActionButtons';
import { formatPercentage } from '../../shared/utils/recipeFormatters';

interface RecipeTableRowProps {
  recipe: Recipe;
  onEdit: (recipe: Recipe) => void;
  onDuplicate: (recipe: Recipe) => void;
  onDelete: (recipe: Recipe) => void;
}

export const RecipeTableRow: React.FC<RecipeTableRowProps> = ({
  recipe,
  onEdit,
  onDuplicate,
  onDelete
}) => {
  const profitPerPorsi = (recipe.hargaJualPorsi || 0) - (recipe.hppPerPorsi || 0);
  const profitPerPcs = (recipe.hargaJualPerPcs || 0) - (recipe.hppPerPcs || 0);
  const marginPercent = (recipe.hargaJualPorsi || 0) > 0 
    ? (profitPerPorsi / (recipe.hargaJualPorsi || 1)) * 100 
    : 0;

  return (
    <TableRow className="hover:bg-gray-50/50 transition-colors">
      <TableCell>
        <div>
          <div className="font-medium text-gray-900">{recipe.namaResep}</div>
          {recipe.deskripsi && (
            <div className="text-sm text-gray-500 truncate max-w-48">
              {recipe.deskripsi}
            </div>
          )}
        </div>
      </TableCell>
      
      <TableCell>
        <CategoryBadge category={recipe.kategoriResep} />
      </TableCell>
      
      <TableCell>{recipe.jumlahPorsi}</TableCell>
      
      <TableCell className="text-right">
        <PriceDisplay 
          amount={recipe.hppPerPorsi || 0} 
          colorClass="text-orange-600"
          className="font-medium" 
        />
      </TableCell>
      
      <TableCell className="text-right">
        {recipe.hppPerPcs ? (
          <PriceDisplay 
            amount={recipe.hppPerPcs} 
            colorClass="text-orange-600"
            className="text-sm" 
          />
        ) : (
          <span className="text-gray-400 text-sm">-</span>
        )}
      </TableCell>
      
      <TableCell className="text-right">
        <PriceDisplay 
          amount={recipe.hargaJualPorsi || 0} 
          colorClass="text-green-600"
          className="font-semibold" 
        />
      </TableCell>
      
      <TableCell className="text-right">
        {recipe.hargaJualPerPcs ? (
          <PriceDisplay 
            amount={recipe.hargaJualPerPcs} 
            colorClass="text-green-600"
            className="text-sm" 
          />
        ) : (
          <span className="text-gray-400 text-sm">-</span>
        )}
      </TableCell>
      
      <TableCell className="text-right">
        <div className="text-right">
          <PriceDisplay 
            amount={profitPerPorsi || 0} 
            className="font-semibold text-sm" 
          />
          <div className="text-xs text-gray-500">
            {formatPercentage((marginPercent || 0) / 100)}
          </div>
        </div>
      </TableCell>
      
      <TableCell className="text-right">
        <div className="flex justify-end">
          <ActionButtons
            onEdit={() => onEdit(recipe)}
            onDuplicate={() => onDuplicate(recipe)}
            onDelete={() => (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <span />
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Anda Yakin?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Resep "{recipe.namaResep}" akan dihapus permanen dan tidak dapat dikembalikan.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => onDelete(recipe)} 
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Ya, Hapus
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            showView={false}
          />
        </div>
      </TableCell>
    </TableRow>
  );
};