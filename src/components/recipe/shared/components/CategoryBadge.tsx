// src/components/recipe/shared/components/CategoryBadge.tsx

import React from 'react';
import { Badge } from '@/components/ui/badge';

interface CategoryBadgeProps {
  category?: string;
  variant?: 'default' | 'secondary' | 'outline' | 'destructive';
  className?: string;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({ 
  category, 
  variant = 'secondary', 
  className = '' 
}) => {
  if (!category) {
    return <span className="text-gray-400 text-sm">-</span>;
  }

  return (
    <Badge 
      variant={variant} 
      className={`bg-orange-100 text-orange-800 hover:bg-orange-200 ${className}`}
    >
      {category}
    </Badge>
  );
};
