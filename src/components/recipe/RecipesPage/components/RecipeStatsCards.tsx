import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, Calculator, Package, TrendingUp } from 'lucide-react';
import { formatCurrency } from '../../shared/utils/recipeFormatters';
import { RecipeStats } from '../hooks/useRecipeStats';

interface RecipeStatsCardsProps {
  stats: RecipeStats;
  isLoading?: boolean;
}

export const RecipeStatsCards: React.FC<RecipeStatsCardsProps> = ({
  stats,
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="animate-pulse flex items-center gap-3">
                <div className="bg-gray-200 p-2 rounded-lg w-9 h-9"></div>
                <div className="space-y-2">
                  <div className="bg-gray-200 h-3 w-20 rounded"></div>
                  <div className="bg-gray-200 h-6 w-16 rounded"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Resep',
      value: stats.totalRecipes.toString(),
      icon: BookOpen,
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-600'
    },
    {
      title: 'Rata-rata HPP/Porsi',
      value: formatCurrency(stats.avgHppPerPorsi),
      icon: Calculator,
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-600'
    },
    {
      title: 'Rata-rata Profit',
      value: formatCurrency(stats.avgProfit),
      icon: TrendingUp,
      bgColor: 'bg-green-100',
      textColor: 'text-green-600'
    },
    {
      title: 'Total HPP',
      value: formatCurrency(stats.totalHPP),
      icon: Package,
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <Card key={index} className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`${card.bgColor} p-2 rounded-lg`}>
                <card.icon className={`h-5 w-5 ${card.textColor}`} />
              </div>
              <div>
                <p className="text-sm text-gray-600">{card.title}</p>
                <p className={`text-2xl font-bold ${card.textColor}`}>
                  {card.value}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};