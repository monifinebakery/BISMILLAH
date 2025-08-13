// src/components/financial/profit-analysis/components/MetricCard.tsx
// ✅ KOMPONEN KARTU METRIK - Reusable component

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ComponentType<any>;
  color: 'green' | 'red' | 'blue' | 'purple' | 'orange';
  trend?: number;
  status?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  color, 
  trend,
  status 
}) => {
  const colorClasses = {
    green: 'text-green-600 bg-green-50 border-green-200',
    red: 'text-red-600 bg-red-50 border-red-200',
    blue: 'text-blue-600 bg-blue-50 border-blue-200',
    purple: 'text-purple-600 bg-purple-50 border-purple-200',
    orange: 'text-orange-600 bg-orange-50 border-orange-200'
  };

  return (
    <Card className={cn("border-l-4 hover:shadow-md transition-shadow", colorClasses[color])}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <Icon className={cn("h-5 w-5", `text-${color}-600`)} />
          {trend !== undefined && (
            <div className="flex items-center gap-1">
              {trend > 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : trend < 0 ? (
                <TrendingDown className="h-3 w-3 text-red-500" />
              ) : null}
              <span className={cn(
                "text-xs",
                trend > 0 ? "text-green-600" : trend < 0 ? "text-red-600" : "text-gray-500"
              )}>
                {trend > 0 ? "+" : ""}{trend.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
        
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={cn("text-xl font-bold", `text-${color}-700`)}>{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
          {status && (
            <Badge 
              variant={color === 'green' ? 'default' : 'secondary'}
              className="mt-2 text-xs"
            >
              {status}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};