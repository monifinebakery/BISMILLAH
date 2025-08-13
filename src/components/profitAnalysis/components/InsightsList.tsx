// src/components/profitAnalysis/components/InsightsList.tsx
// ✅ UPDATED - Material Usage Integration Compatible

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  TrendingUp, 
  Info, 
  Eye,
  EyeOff,
  Filter,
  BarChart3,
  Target,
  Lightbulb,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ✅ Import updated types
import { ProfitInsight } from '../types';

interface InsightsListProps {
  insights: ProfitInsight[];
  maxShow?: number;
  showFilters?: boolean;
  showCategories?: boolean;
  showDataQualityInsights?: boolean;
  className?: string;
  onInsightClick?: (insight: ProfitInsight) => void;
}

// ✅ Enhanced insight display component
const InsightCard: React.FC<{
  insight: ProfitInsight;
  onClick?: (insight: ProfitInsight) => void;
  showCategory?: boolean;
}> = ({ insight, onClick, showCategory = true }) => {
  const getIcon = (type: string, category?: string) => {
    // Priority: type-specific icons first, then category icons
    switch (type) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'success': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      default:
        // Use category-specific icons for info type
        switch (category) {
          case 'margin': return <Target className="h-4 w-4 text-blue-500" />;
          case 'cogs': return <BarChart3 className="h-4 w-4 text-blue-500" />;
          case 'efficiency': return <TrendingUp className="h-4 w-4 text-blue-500" />;
          case 'trend': return <Clock className="h-4 w-4 text-blue-500" />;
          default: return <Info className="h-4 w-4 text-blue-500" />;
        }
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'critical': return 'bg-red-50 border-red-200 hover:bg-red-100';
      case 'warning': return 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100';
      case 'success': return 'bg-green-50 border-green-200 hover:bg-green-100';
      default: return 'bg-blue-50 border-blue-200 hover:bg-blue-100';
    }
  };

  const getImpactLabel = (impact: string) => {
    switch (impact) {
      case 'high': return 'Tinggi';
      case 'medium': return 'Sedang';
      case 'low': return 'Rendah';
      default: return impact;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'margin': return 'Margin';
      case 'cogs': return 'HPP';
      case 'opex': return 'OPEX';
      case 'efficiency': return 'Efisiensi';
      case 'trend': return 'Trend';
      default: return category.charAt(0).toUpperCase() + category.slice(1);
    }
  };

  const formatValue = (value?: number) => {
    if (value === undefined || value === null) return null;
    
    // Format as currency if value is large enough (> 1000)
    if (Math.abs(value) >= 1000) {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value);
    }
    
    // Format as percentage if value is small (< 1)
    if (Math.abs(value) < 1) {
      return `${(value * 100).toFixed(1)}%`;
    }
    
    // Format as number
    return value.toLocaleString('id-ID');
  };

  return (
    <Card 
      className={cn(
        "border-l-4 transition-all duration-200",
        getBgColor(insight.type),
        onClick ? "cursor-pointer" : ""
      )}
      onClick={() => onClick?.(insight)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {getIcon(insight.type, insight.category)}
          </div>
          
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <h4 className="font-medium text-sm leading-tight">{insight.title}</h4>
              <div className="flex gap-1 flex-shrink-0">
                {showCategory && (
                  <Badge 
                    variant="outline" 
                    className="text-xs px-1.5 py-0.5"
                  >
                    {getCategoryLabel(insight.category)}
                  </Badge>
                )}
                <Badge 
                  variant={
                    insight.impact === 'high' ? 'destructive' : 
                    insight.impact === 'medium' ? 'default' : 
                    'secondary'
                  }
                  className="text-xs px-1.5 py-0.5"
                >
                  {getImpactLabel(insight.impact)}
                </Badge>
              </div>
            </div>
            
            {/* Message */}
            <p className="text-sm text-gray-600 mb-2 leading-relaxed">
              {insight.message}
            </p>
            
            {/* Value Display */}
            {insight.value !== undefined && (
              <div className="text-xs font-mono bg-white/50 px-2 py-1 rounded mb-2">
                <span className="text-gray-500">Nilai: </span>
                <span className="font-medium">{formatValue(insight.value)}</span>
                {insight.trend && (
                  <span className={cn(
                    "ml-2",
                    insight.trend === 'increasing' ? "text-green-600" :
                    insight.trend === 'decreasing' ? "text-red-600" :
                    "text-gray-600"
                  )}>
                    {insight.trend === 'increasing' ? '↗' :
                     insight.trend === 'decreasing' ? '↘' : '→'}
                  </span>
                )}
              </div>
            )}
            
            {/* Recommendation */}
            {insight.recommendation && (
              <div className="mt-3 p-2 bg-white/50 rounded-md">
                <p className="text-xs text-blue-700 font-medium flex items-start gap-1">
                  <Lightbulb className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  {insight.recommendation}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ✅ Main component
export const InsightsList: React.FC<InsightsListProps> = ({ 
  insights, 
  maxShow,
  showFilters = false,
  showCategories = true,
  showDataQualityInsights = true,
  className,
  onInsightClick
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedImpact, setSelectedImpact] = useState<string>('all');
  const [showAll, setShowAll] = useState(false);

  // ✅ Filter and categorize insights
  const filteredInsights = insights.filter(insight => {
    const categoryMatch = selectedCategory === 'all' || insight.category === selectedCategory;
    const impactMatch = selectedImpact === 'all' || insight.impact === selectedImpact;
    return categoryMatch && impactMatch;
  });

  // ✅ Separate data quality insights
  const dataQualityInsights = filteredInsights.filter(insight => 
    insight.category === 'efficiency' && 
    (insight.message.includes('data') || insight.message.includes('estimasi'))
  );
  
  const businessInsights = filteredInsights.filter(insight => 
    !(insight.category === 'efficiency' && (insight.message.includes('data') || insight.message.includes('estimasi')))
  );

  // ✅ Calculate display counts
  const effectiveMaxShow = showAll ? undefined : maxShow;
  const displayBusinessInsights = effectiveMaxShow ? 
    businessInsights.slice(0, effectiveMaxShow) : 
    businessInsights;

  // ✅ Get unique categories and impacts for filters
  const categories = Array.from(new Set(insights.map(i => i.category)));
  const impacts = Array.from(new Set(insights.map(i => i.impact)));

  // ✅ Empty state
  if (!insights || insights.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-8">
          <div className="text-center text-gray-500">
            <Info className="h-8 w-8 mx-auto mb-3 text-gray-400" />
            <h3 className="font-medium mb-2">Belum Ada Insight</h3>
            <p className="text-sm mb-4">
              Insight akan muncul setelah analisis profit margin selesai
            </p>
            <div className="bg-blue-50 p-3 rounded-lg text-xs text-blue-700">
              <p className="font-medium mb-1">💡 Tips:</p>
              <p>Pastikan sudah ada data transaksi dan biaya operasional untuk mendapatkan insight yang akurat</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Insight Analisis
            <Badge variant="secondary" className="text-xs">
              {filteredInsights.length}
            </Badge>
          </CardTitle>
          
          {/* ✅ Show all toggle */}
          {maxShow && businessInsights.length > maxShow && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowAll(!showAll)}
              className="text-xs"
            >
              {showAll ? (
                <>
                  <EyeOff className="h-3 w-3 mr-1" />
                  Sembunyikan
                </>
              ) : (
                <>
                  <Eye className="h-3 w-3 mr-1" />
                  Lihat Semua ({businessInsights.length})
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* ✅ Filters */}
        {showFilters && (categories.length > 1 || impacts.length > 1) && (
          <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">Filter:</span>
            </div>
            
            {/* Category Filter */}
            {categories.length > 1 && (
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-xs border rounded px-2 py-1"
              >
                <option value="all">Semua Kategori</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            )}
            
            {/* Impact Filter */}
            {impacts.length > 1 && (
              <select 
                value={selectedImpact}
                onChange={(e) => setSelectedImpact(e.target.value)}
                className="text-xs border rounded px-2 py-1"
              >
                <option value="all">Semua Impact</option>
                {impacts.map(impact => (
                  <option key={impact} value={impact}>
                    {impact === 'high' ? 'Tinggi' : impact === 'medium' ? 'Sedang' : 'Rendah'}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* ✅ Data Quality Insights */}
        {showDataQualityInsights && dataQualityInsights.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3 text-gray-700 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Kualitas Data
            </h4>
            <div className="space-y-2">
              {dataQualityInsights.map((insight, index) => (
                <InsightCard
                  key={`data-${index}`}
                  insight={insight}
                  onClick={onInsightClick}
                  showCategory={false}
                />
              ))}
            </div>
          </div>
        )}

        {/* ✅ Business Insights */}
        {businessInsights.length > 0 && (
          <div>
            {showDataQualityInsights && dataQualityInsights.length > 0 && (
              <h4 className="text-sm font-medium mb-3 text-gray-700 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Insight Bisnis
              </h4>
            )}
            <div className="space-y-3">
              {displayBusinessInsights.map((insight, index) => (
                <InsightCard
                  key={`business-${index}`}
                  insight={insight}
                  onClick={onInsightClick}
                  showCategory={showCategories}
                />
              ))}
            </div>
          </div>
        )}

        {/* ✅ Show more indicator */}
        {maxShow && !showAll && businessInsights.length > maxShow && (
          <div className="text-center pt-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowAll(true)}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              +{businessInsights.length - maxShow} insight lainnya
            </Button>
          </div>
        )}

        {/* ✅ No insights after filter */}
        {filteredInsights.length === 0 && insights.length > 0 && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Tidak ada insight yang sesuai dengan filter yang dipilih.
              <Button 
                variant="link" 
                size="sm" 
                className="ml-2 p-0 h-auto"
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedImpact('all');
                }}
              >
                Reset filter
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* ✅ Insight summary */}
        {filteredInsights.length > 0 && (
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-gray-500">Critical</p>
                <p className="font-medium text-red-600">
                  {filteredInsights.filter(i => i.type === 'critical').length}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Warning</p>
                <p className="font-medium text-yellow-600">
                  {filteredInsights.filter(i => i.type === 'warning').length}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Success</p>
                <p className="font-medium text-green-600">
                  {filteredInsights.filter(i => i.type === 'success').length}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ✅ Simplified version for dashboard
export const InsightsSummary: React.FC<{
  insights: ProfitInsight[];
  className?: string;
}> = ({ insights, className }) => {
  const criticalInsights = insights.filter(i => i.type === 'critical' || i.impact === 'high');
  
  if (criticalInsights.length === 0) {
    return (
      <div className={cn("text-center py-4 text-green-600", className)}>
        <CheckCircle2 className="h-6 w-6 mx-auto mb-2" />
        <p className="text-sm font-medium">Profit margin dalam kondisi baik</p>
      </div>
    );
  }
  
  return (
    <div className={className}>
      <InsightsList 
        insights={criticalInsights}
        maxShow={3}
        showCategories={false}
        showDataQualityInsights={false}
      />
    </div>
  );
};

export default InsightsList;