import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy } from 'lucide-react';
import { Recipe } from '@/types/recipe';
import { ButtonLoadingState } from '../../shared/components/LoadingStates';

interface DuplicateRecipeDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  recipe: Recipe | null;
  onConfirm: (newName: string) => Promise<boolean>;
  isLoading?: boolean;
}

export const DuplicateRecipeDialog: React.FC<DuplicateRecipeDialogProps> = ({
  isOpen,
  onOpenChange,
  recipe,
  onConfirm,
  isLoading = false
}) => {
  const [newName, setNewName] = useState('');

  // Reset form when dialog opens/closes
  React.useEffect(() => {
    if (isOpen && recipe) {
      setNewName(`${recipe.namaResep} (Copy)`);
    } else if (!isOpen) {
      setNewName('');
    }
  }, [isOpen, recipe]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const success = await onConfirm(newName.trim());
    if (success) {
      onOpenChange(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading && newName.trim()) {
      handleSubmit(e as any);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Duplikasi Resep</DialogTitle>
          <DialogDescription>
            Buat salinan dari resep "{recipe?.namaResep}" dengan nama baru
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="duplicate-name">Nama Resep Baru</Label>
            <Input
              id="duplicate-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Masukkan nama resep baru..."
              disabled={isLoading}
              autoFocus
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button 
              type="button"
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Batal
            </Button>
            <Button 
              type="submit"
              disabled={!newName.trim() || isLoading}
            >
              {isLoading ? (
                <ButtonLoadingState>Menduplikasi...</ButtonLoadingState>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplikasi
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};