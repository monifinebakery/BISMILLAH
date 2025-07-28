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
            showView={false}
          />
          
          {/* Separate delete action with confirmation */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8 text-red-500 hover:text-red-700">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
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
        </div>
      </TableCell>
    </TableRow>
  );
};