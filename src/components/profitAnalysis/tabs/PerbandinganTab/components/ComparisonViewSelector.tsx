// src/components/profitAnalysis/tabs/PerbandinganTab/components/ComparisonViewSelector.tsx

import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ComparisonView } from '../types';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface ComparisonViewSelectorProps {
  value: ComparisonView;
  onValueChange: (value: ComparisonView) => void;
}

export const ComparisonViewSelector: React.FC<ComparisonViewSelectorProps> = ({
  value,
  onValueChange
}) => {
  const isMobile = useIsMobile();

  return (
    <TabsList className={cn(
      "grid w-full grid-cols-4",
      isMobile && "flex overflow-x-auto whitespace-nowrap"
    )}>
      <TabsTrigger 
        value="cash-vs-real" 
        className={isMobile ? "text-xs px-2" : ""}
      >
        Cash vs Real
      </TabsTrigger>
      <TabsTrigger 
        value="benchmarks" 
        className={isMobile ? "text-xs px-2" : ""}
      >
        Patokan Industri
      </TabsTrigger>
      <TabsTrigger 
        value="competitive" 
        className={isMobile ? "text-xs px-2" : ""}
      >
        Analisis Kompetitif
      </TabsTrigger>
      <TabsTrigger 
        value="improvement" 
        className={isMobile ? "text-xs px-2" : ""}
      >
        Potensi Perbaikan
      </TabsTrigger>
    </TabsList>
  );
};