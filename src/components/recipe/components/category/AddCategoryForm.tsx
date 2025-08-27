// src/components/recipe/components/category/AddCategoryForm.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';

interface AddCategoryFormProps {
  isLoading: boolean;
  onAddCategory: (name: string) => Promise<void>;
}

export const AddCategoryForm: React.FC<AddCategoryFormProps> = ({
  isLoading,
  onAddCategory
}) => {
  const [newCategoryName, setNewCategoryName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      toast.error('Nama kategori tidak boleh kosong');
      return;
    }
    
    try {
      await onAddCategory(newCategoryName);
      setNewCategoryName('');
    } catch (error) {
      // Error handling is done in parent component
    }
  };

  return (
    <Card className="border-gray-500">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Plus className="h-5 w-5 text-orange-600" />
          Tambah Kategori Baru
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="flex-1">
            <Label htmlFor="newCategory" className="sr-only">
              Nama Kategori
            </Label>
            <Input
              id="newCategory"
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Contoh: Makanan Pembuka, Minuman Segar..."
              className="h-10 border-gray-500"
              maxLength={50}
              disabled={isLoading}
            />
          </div>
          <Button 
            type="submit" 
            className="h-10 bg-orange-500 hover:bg-orange-600"
            disabled={isLoading || !newCategoryName.trim()}
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah
          </Button>
        </form>
        
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Lightbulb className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-700">
              <span className="font-medium">Tips:</span> Gunakan nama yang deskriptif dan konsisten. 
              Kategori akan muncul di daftar resep Anda.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};