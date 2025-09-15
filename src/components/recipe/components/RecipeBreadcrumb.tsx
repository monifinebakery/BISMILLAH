// src/components/recipe/components/RecipeBreadcrumb.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import { ChevronLeft, ChefHat, Plus, Edit2 } from 'lucide-react';
import type { Recipe } from '../types';

export type RecipeViewMode = 'list' | 'add' | 'edit';

interface RecipeBreadcrumbProps {
  currentView: RecipeViewMode;
  currentRecipe?: Recipe | null;
  onNavigate: (view: RecipeViewMode) => void;
  className?: string;
}

const RecipeBreadcrumb: React.FC<RecipeBreadcrumbProps> = ({
  currentView,
  currentRecipe,
  onNavigate,
  className = '',
}) => {
  const getBreadcrumbItems = () => {
    const items = [
      {
        type: 'clickable' as const,
        label: 'Manajemen Resep',
        onClick: () => onNavigate('list'),
        icon: ChefHat,
      },
    ];

    if (currentView === 'add') {
      items.push({
        type: 'current' as const,
        label: 'Tambah Resep Baru',
        icon: Plus,
      });
    } else if (currentView === 'edit' && currentRecipe) {
      const anyRec: any = currentRecipe as any;
      const nama = (anyRec.nama_resep ?? anyRec.namaResep ?? '') as string;
      items.push({
        type: 'current' as const,
        label: `Edit: ${nama}`,
        icon: Edit2,
      });
    }

    return items;
  };

  const breadcrumbItems = getBreadcrumbItems();

  const handleBackClick = () => {
    onNavigate('list');
  };

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {/* Back Button - Only show when not on list view */}
      {currentView !== 'list' && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBackClick}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Kembali</span>
        </Button>
      )}

      {/* Breadcrumb Navigation */}
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbItems.map((item, index) => (
            <React.Fragment key={index}>
              <BreadcrumbItem>
                {item.type === 'clickable' ? (
                  <BreadcrumbLink asChild>
                    <button
                      onClick={item.onClick}
                      className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-orange-600 transition-colors"
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{item.label}</span>
                      <span className="sm:hidden">Resep</span>
                    </button>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage className="flex items-center gap-2 text-sm font-medium text-gray-900">
                    <item.icon className="h-4 w-4 text-orange-600" />
                    <span className="hidden sm:inline">{item.label}</span>
                    <span className="sm:hidden">
                      {currentView === 'add' ? 'Tambah' : 'Edit'}
                    </span>
                  </BreadcrumbPage>
                )}
              </BreadcrumbItem>
              
              {index < breadcrumbItems.length - 1 && <BreadcrumbSeparator />}
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
};

export default RecipeBreadcrumb;
