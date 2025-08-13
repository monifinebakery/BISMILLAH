// src/components/profitAnalysis/tabs/PerbandinganTab/components/Competitive/CompetitiveTable.tsx

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CompetitiveRow } from '../../types';
import { getBadgeVariant } from '../../utils';

interface CompetitiveTableProps {
  competitiveRows: CompetitiveRow[];
}

export const CompetitiveTable: React.FC<CompetitiveTableProps> = ({
  competitiveRows
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left p-2">Metrik</th>
            <th className="text-center p-2">Your Company</th>
            <th className="text-center p-2">Industry Avg</th>
            <th className="text-center p-2">Top Performers</th>
            <th className="text-center p-2">Gap to Top</th>
          </tr>
        </thead>
        <tbody>
          {competitiveRows.map((row, index) => (
            <tr key={index} className="border-b">
              <td className="p-2 font-medium">{row.key}</td>
              <td className="p-2 text-center">
                <Badge variant={
                  (row.key.includes('Margin') || row.key.includes('Efficiency')) 
                    ? (row.yours >= row.top * 0.9 ? 'default' : row.yours >= row.industry ? 'secondary' : 'destructive')
                    : (row.yours <= row.top * 1.1 ? 'default' : row.yours <= row.industry ? 'secondary' : 'destructive')
                }>
                  {row.yours.toFixed(1)}{row.unit}
                </Badge>
              </td>
              <td className="p-2 text-center text-gray-600">
                {row.industry.toFixed(1)}{row.unit}
              </td>
              <td className="p-2 text-center text-green-600 font-medium">
                {row.top.toFixed(1)}{row.unit}
              </td>
              <td className="p-2 text-center">
                <span className={
                  (row.key.includes('Margin') || row.key.includes('Efficiency'))
                    ? (row.yours >= row.top ? "text-green-600" : "text-red-600")
                    : (row.yours <= row.top ? "text-green-600" : "text-red-600")
                }>
                  {(row.key.includes('Margin') || row.key.includes('Efficiency'))
                    ? (row.top - row.yours > 0 ? `+${(row.top - row.yours).toFixed(1)}` : `${(row.top - row.yours).toFixed(1)}`)
                    : (row.yours - row.top > 0 ? `+${(row.yours - row.top).toFixed(1)}` : `${(row.yours - row.top).toFixed(1)}`)
                  }{row.unit}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};