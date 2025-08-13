// src/components/profitAnalysis/tabs/PerbandinganTab/components/Competitive/CompetitivePositionCards.tsx

import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface CompetitivePositionCardsProps {
  strengths: string[];
  improvements: string[];
  shortTermTargets: string[];
}

export const CompetitivePositionCards: React.FC<CompetitivePositionCardsProps> = ({
  strengths,
  improvements,
  shortTermTargets
}) => {
  const isMobile = useIsMobile();

  return (
    <div className={cn("grid grid-cols-1 gap-4", !isMobile && "md:grid-cols-3")}>
      <div className="bg-green-50 p-4 rounded">
        <h5 className={cn("font-medium text-green-800 mb-2", isMobile && "text-sm")}>✅ Kekuatan</h5>
        <ul className={cn("text-sm text-green-700 space-y-1", isMobile && "text-xs")}>
          {strengths.map((strength, index) => (
            <li key={index}>• {strength}</li>
          ))}
        </ul>
      </div>

      <div className="bg-yellow-50 p-4 rounded">
        <h5 className={cn("font-medium text-yellow-800 mb-2", isMobile && "text-sm")}>⚠️ Area Perbaikan</h5>
        <ul className={cn("text-sm text-yellow-700 space-y-1", isMobile && "text-xs")}>
          {improvements.map((improvement, index) => (
            <li key={index}>• {improvement}</li>
          ))}
        </ul>
      </div>

      <div className="bg-blue-50 p-4 rounded">
        <h5 className={cn("font-medium text-blue-800 mb-2", isMobile && "text-sm")}>🎯 Target Jangka Pendek</h5>
        <ul className={cn("text-sm text-blue-700 space-y-1", isMobile && "text-xs")}>
          {shortTermTargets.map((target, index) => (
            <li key={index}>• {target}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};