// src/components/profitAnalysis/components/RecommendationSystemCard.tsx

import React, { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  TrendingUp,
  Target,
  Lightbulb,
  Clock,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Zap,
  TrendingDown,
  Users,
  Package,
  Settings,
} from 'lucide-react';
import {
  Recommendation,
  RecommendationAnalysis,
  generateBusinessRecommendations,
  analyzeRecommendationImpact,
  getQuickWinRecommendations,
  getHighImpactRecommendations,
} from '../utils/recommendationEngine';
import { RealTimeProfitCalculation } from '../types/profitAnalysis.types';
import { BusinessType } from '../utils/config/profitConfig';
import { formatCurrency } from '@/utils/formatUtils';

// ==============================================
// TYPES
// ==============================================

interface RecommendationSystemCardProps {
  analysis: RealTimeProfitCalculation;
  businessType?: BusinessType;
  className?: string;
}

// ==============================================
// HELPER COMPONENTS
// ==============================================

const CategoryIcon = ({ category }: { category: Recommendation['category'] }) => {
  const iconMap = {
    pricing: DollarSign,
    cost_reduction: TrendingDown,
    efficiency: Zap,
    revenue: TrendingUp,
    inventory: Package,
    operations: Settings,
  };
  
  const Icon = iconMap[category];
  return <Icon className="h-4 w-4" />;
};

const PriorityBadge = ({ priority }: { priority: Recommendation['priority'] }) => {
  const variants = {
    high: 'destructive',
    medium: 'default',
    low: 'secondary',
  } as const;
  
  return (
    <Badge variant={variants[priority]} className="text-xs">
      {priority === 'high' ? 'Tinggi' : priority === 'medium' ? 'Sedang' : 'Rendah'}
    </Badge>
  );
};

const DifficultyBadge = ({ difficulty }: { difficulty: Recommendation['difficulty'] }) => {
  const variants = {
    easy: 'default',
    medium: 'secondary',
    hard: 'outline',
  } as const;
  
  return (
    <Badge variant={variants[difficulty]} className="text-xs">
      {difficulty === 'easy' ? 'Mudah' : difficulty === 'medium' ? 'Sedang' : 'Sulit'}
    </Badge>
  );
};

const TimeframeBadge = ({ timeframe }: { timeframe: Recommendation['impact']['timeframe'] }) => {
  const labels = {
    immediate: 'Segera',
    short_term: 'Jangka Pendek',
    medium_term: 'Jangka Menengah',
    long_term: 'Jangka Panjang',
  };
  
  return (
    <Badge variant="outline" className="text-xs">
      <Clock className="h-3 w-3 mr-1" />
      {labels[timeframe]}
    </Badge>
  );
};

const RecommendationCard = ({ 
  recommendation, 
  onImplement 
}: { 
  recommendation: Recommendation;
  onImplement: (id: string) => void;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <CategoryIcon category={recommendation.category} />
            <CardTitle className="text-sm font-medium">
              {recommendation.title}
            </CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <PriorityBadge priority={recommendation.priority} />
            <DifficultyBadge difficulty={recommendation.difficulty} />
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground mt-2">
          {recommendation.description}
        </p>
        
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center space-x-4">
            <div className="text-sm">
              <span className="text-muted-foreground">Estimasi Dampak:</span>
              <span className="font-medium ml-1 text-green-600">
                {recommendation.impact.type === 'revenue_increase' && '+'}
                {formatCurrency(recommendation.impact.estimatedValue)}
              </span>
            </div>
            <TimeframeBadge timeframe={recommendation.impact.timeframe} />
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Tutup' : 'Detail'}
          </Button>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-0">
          <Separator className="mb-4" />
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-sm mb-2">Langkah Implementasi:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                {recommendation.actionSteps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            </div>
            
            <div>
              <h4 className="font-medium text-sm mb-2">KPI yang Perlu Dipantau:</h4>
              <div className="flex flex-wrap gap-2">
                {recommendation.kpiToTrack.map((kpi, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    <BarChart3 className="h-3 w-3 mr-1" />
                    {kpi}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-2">
              <div className="text-sm text-muted-foreground">
                Investasi: <span className="font-medium">
                  {recommendation.investmentRequired === 'none' ? 'Tidak Ada' :
                   recommendation.investmentRequired === 'low' ? 'Rendah' :
                   recommendation.investmentRequired === 'medium' ? 'Sedang' : 'Tinggi'}
                </span>
              </div>
              
              <Button
                size="sm"
                onClick={() => onImplement(recommendation.id)}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Tandai Selesai
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

// ==============================================
// MAIN COMPONENT
// ==============================================

export const RecommendationSystemCard: React.FC<RecommendationSystemCardProps> = ({
  analysis,
  businessType = BusinessType.FNB_RESTAURANT,
  className = '',
}) => {
  const [implementedRecommendations, setImplementedRecommendations] = useState<Set<string>>(new Set());
  
  const recommendations = useMemo(() => {
    return generateBusinessRecommendations(analysis, businessType);
  }, [analysis, businessType]);
  
  const recommendationAnalysis = useMemo(() => {
    return analyzeRecommendationImpact(recommendations);
  }, [recommendations]);
  
  const quickWins = useMemo(() => {
    return getQuickWinRecommendations(recommendations);
  }, [recommendations]);
  
  const highImpactRecommendations = useMemo(() => {
    return getHighImpactRecommendations(recommendations);
  }, [recommendations]);
  
  const handleImplementRecommendation = (id: string) => {
    setImplementedRecommendations(prev => new Set([...prev, id]));
  };
  
  const activeRecommendations = recommendations.filter(
    rec => !implementedRecommendations.has(rec.id)
  );
  
  const implementationProgress = recommendations.length > 0 
    ? (implementedRecommendations.size / recommendations.length) * 100 
    : 0;
  
  if (recommendations.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lightbulb className="h-5 w-5" />
            <span>Sistem Rekomendasi</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Tidak ada rekomendasi yang tersedia. Pastikan data profit analysis sudah lengkap.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Lightbulb className="h-5 w-5" />
            <span>Sistem Rekomendasi Otomatis</span>
          </CardTitle>
          
          <Badge variant="outline" className="text-sm">
            {activeRecommendations.length} Rekomendasi Aktif
          </Badge>
        </div>
        
        {/* Progress Implementation */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Progress Implementasi</span>
            <span className="text-sm font-medium">{implementationProgress.toFixed(0)}%</span>
          </div>
          <Progress value={implementationProgress} className="h-2" />
        </div>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {recommendationAnalysis.highPriorityCount}
            </div>
            <div className="text-xs text-muted-foreground">Prioritas Tinggi</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {quickWins.length}
            </div>
            <div className="text-xs text-muted-foreground">Quick Wins</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(recommendationAnalysis.estimatedTotalImpact, { compact: true })}
            </div>
            <div className="text-xs text-muted-foreground">Est. Total Impact</div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">Semua ({activeRecommendations.length})</TabsTrigger>
            <TabsTrigger value="quick-wins">Quick Wins ({quickWins.length})</TabsTrigger>
            <TabsTrigger value="high-impact">High Impact ({highImpactRecommendations.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-4">
            <div className="space-y-4">
              {activeRecommendations.length === 0 ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Selamat! Semua rekomendasi telah diimplementasikan.
                  </AlertDescription>
                </Alert>
              ) : (
                activeRecommendations.map((recommendation) => (
                  <RecommendationCard
                    key={recommendation.id}
                    recommendation={recommendation}
                    onImplement={handleImplementRecommendation}
                  />
                ))
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="quick-wins" className="mt-4">
            <div className="mb-4">
              <Alert>
                <Zap className="h-4 w-4" />
                <AlertDescription>
                  Rekomendasi yang mudah diimplementasikan dengan dampak cepat.
                </AlertDescription>
              </Alert>
            </div>
            
            <div className="space-y-4">
              {quickWins.filter(rec => !implementedRecommendations.has(rec.id)).map((recommendation) => (
                <RecommendationCard
                  key={recommendation.id}
                  recommendation={recommendation}
                  onImplement={handleImplementRecommendation}
                />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="high-impact" className="mt-4">
            <div className="mb-4">
              <Alert>
                <Target className="h-4 w-4" />
                <AlertDescription>
                  Rekomendasi dengan dampak finansial terbesar untuk bisnis Anda.
                </AlertDescription>
              </Alert>
            </div>
            
            <div className="space-y-4">
              {highImpactRecommendations.filter(rec => !implementedRecommendations.has(rec.id)).map((recommendation) => (
                <RecommendationCard
                  key={recommendation.id}
                  recommendation={recommendation}
                  onImplement={handleImplementRecommendation}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default RecommendationSystemCard;