// src/components/recipe/components/category/CategoryTable.tsx
import React, { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tag, AlertTriangle } from 'lucide-react';
import { CategoryTableRow } from './CategoryTableRow';

interface CategoryTableProps {
  categories: {
    name: string;
    count: number;
    isCustom: boolean;
    canDelete: boolean;
    canEdit: boolean;
    recipes: any[];
  }[];
  isLoading: boolean;
  onEditCategory: (oldName: string, newName: string) => Promise<void>;
  onDeleteCategory: (categoryName: string) => void;
}

export const CategoryTable: React.FC<CategoryTableProps> = ({
  categories,
  isLoading,
  onEditCategory,
  onDeleteCategory
}) => {
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleStartEdit = (categoryName: string, currentName: string) => {
    setEditingCategory(categoryName);
    setEditName(currentName);
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setEditName('');
  };

  if (categories.length === 0) {
    return (
      <Card className="border-gray-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Tag className="h-5 w-5 text-orange-600" />
            Daftar Kategori
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
              <Tag className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada kategori</h3>
            <p className="text-gray-500 mb-4">
              Mulai dengan menambahkan kategori baru untuk mengorganisir resep Anda.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-gray-200">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Tag className="h-5 w-5 text-orange-600" />
          Daftar Kategori
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-x-auto sm:overflow-visible">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="font-semibold text-gray-700">Nama Kategori</TableHead>
                <TableHead className="font-semibold text-gray-700 text-center hidden sm:table-cell">Jumlah Resep</TableHead>
                <TableHead className="font-semibold text-gray-700 text-right hidden sm:table-cell">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <CategoryTableRow
                  key={category.name}
                  category={category}
                  isEditing={editingCategory === category.name}
                  isLoading={isLoading}
                  onStartEdit={handleStartEdit}
                  onCancelEdit={handleCancelEdit}
                  onEditCategory={onEditCategory}
                  onDeleteCategory={onDeleteCategory}
                />
              ))}
            </TableBody>
          </Table>
        </div>
        
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-yellow-700">
              <span className="font-medium">Catatan:</span> Kategori default tidak dapat dihapus. 
              Hanya kategori yang Anda buat sendiri yang dapat dihapus.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};