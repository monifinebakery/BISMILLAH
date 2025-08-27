// src/components/recipe/components/category/CategoryTableRow.tsx
import React, { useState } from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tag, Edit, Trash2, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface CategoryTableRowProps {
  category: {
    name: string;
    count: number;
    isCustom: boolean;
    canDelete: boolean;
    canEdit: boolean;
    recipes: any[];
  };
  isEditing: boolean;
  isLoading: boolean;
  onStartEdit: (categoryName: string, currentName: string) => void;
  onCancelEdit: () => void;
  onEditCategory: (oldName: string, newName: string) => Promise<void>;
  onDeleteCategory: (categoryName: string) => void;
}

export const CategoryTableRow: React.FC<CategoryTableRowProps> = ({
  category,
  isEditing,
  isLoading,
  onStartEdit,
  onCancelEdit,
  onEditCategory,
  onDeleteCategory
}) => {
  const [editName, setEditName] = useState(category.name);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      toast.error('Nama kategori tidak boleh kosong');
      return;
    }
    
    if (editName.trim() === category.name) {
      onCancelEdit();
      return;
    }
    
    try {
      await onEditCategory(category.name, editName.trim());
    } catch (error) {
      // Error handling is done in parent component
    }
  };

  return (
    <TableRow className="hover:bg-gray-50">
      {/* Category Name */}
      <TableCell className="font-medium">
        {isEditing ? (
          <form onSubmit={handleEditSubmit} className="flex gap-2">
            <Input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="h-8 border-gray-300"
              maxLength={50}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleEditSubmit(e as any);
                } else if (e.key === 'Escape') {
                  onCancelEdit();
                }
              }}
              autoFocus
            />
            <Button
              size="sm"
              type="submit"
              disabled={isLoading}
              className="h-8 w-8 p-0 bg-orange-500 hover:bg-orange-600"
            >
              <Check className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onCancelEdit}
              disabled={isLoading}
              className="h-8 w-8 p-0 border-gray-300"
            >
              <X className="h-3 w-3" />
            </Button>
          </form>
        ) : (
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-gray-400" />
            <span className="font-medium text-gray-900">{category.name}</span>
            {!category.isCustom && (
              <Badge variant="secondary" className="ml-2 text-xs">
                Default
              </Badge>
            )}
          </div>
        )}
      </TableCell>
      
      {/* Recipe Count */}
      <TableCell className="text-center">
        <Badge 
          variant={category.count > 0 ? "default" : "secondary"} 
          className={
            category.count > 0 
              ? "bg-orange-100 text-orange-700 hover:bg-orange-200" 
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }
        >
          {category.count} resep
        </Badge>
      </TableCell>
      
      {/* Actions */}
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          {category.canEdit && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onStartEdit(category.name, category.name)}
              disabled={isLoading}
              className="h-8 w-8 p-0 border-gray-300 hover:bg-orange-50"
            >
              <Edit className="h-3 w-3 text-gray-600" />
            </Button>
          )}
          {category.canDelete && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                console.log('🗑️ Delete button clicked for category:', category.name, {
                  canDelete: category.canDelete,
                  isCustom: category.isCustom,
                  count: category.count
                });
                onDeleteCategory(category.name);
              }}
              disabled={isLoading}
              className="h-8 w-8 p-0 border-red-300 hover:bg-red-50"
              title={`Hapus kategori "${category.name}"`}
            >
              <Trash2 className="h-3 w-3 text-red-600" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
};