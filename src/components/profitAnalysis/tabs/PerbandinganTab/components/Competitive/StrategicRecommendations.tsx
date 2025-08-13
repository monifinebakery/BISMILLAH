// src/components/profitAnalysis/tabs/PerbandinganTab/components/Competitive/StrategicRecommendations.tsx

import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BarChart3 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

export const StrategicRecommendations: React.FC = () => {
  const isMobile = useIsMobile();

  return (
    <Alert>
      <BarChart3 className={cn("h-4 w-4", isMobile && "h-3 w-3")} />
      <AlertDescription>
        <strong className={isMobile ? "text-sm" : ""}>Strategic Recommendations:</strong>
        <ul className={cn("mt-2 space-y-1 text-sm", isMobile && "text-xs")}>
          <li>• Benchmark material sourcing dengan top performers</li>
          <li>• Implement advanced material usage tracking</li>
          <li>• Develop supplier partnership untuk cost reduction</li>
          <li>• Focus pada operational efficiency improvements</li>
        </ul>
      </AlertDescription>
    </Alert>
  );
};