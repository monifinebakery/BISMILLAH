// HealthScoreCard.tsx - Health score card for profit analysis
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface HealthIndicatorProps {
  label: string;
  value: number;
  target: number;
  type: 'margin' | 'efficiency';
}

const HealthIndicator: React.FC<HealthIndicatorProps> = ({ label, value, target, type }) => {
  const percentage = Math.min((value / target) * 100, 100);
  const status = value >= target ? 'good' : value >= target * 0.75 ? 'warning' : 'danger';
  
  // Neutral progress bar fill for a clean look
  const getStatusColor = () => 'bg-gray-700';

  // Format percentage
  const formatPercentage = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'percent',
      minimumFractionDigits: 0,
      maximumFractionDigits: 1
    }).format(value / 100);
  };

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="font-semibold">
          {formatPercentage(value)}
          <span className="text-muted-foreground ml-1">/ {target}%</span>
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-500 ${getStatusColor()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

interface HealthScoreCardProps {
  metrics: any;
}

const HealthScoreCard: React.FC<HealthScoreCardProps> = ({ metrics }) => {
  const calculateHealthScore = () => {
    const scores = [];
    
    // Gross margin score (target: 60-70% untuk F&B)
    const grossMarginScore = metrics.grossMargin >= 60 ? 100 : 
                             metrics.grossMargin >= 50 ? 75 :
                             metrics.grossMargin >= 40 ? 50 : 25;
    scores.push(grossMarginScore);
    
    // Net margin score (target: 15-20% untuk F&B)
    const netMarginScore = metrics.netMargin >= 15 ? 100 :
                          metrics.netMargin >= 10 ? 75 :
                          metrics.netMargin >= 5 ? 50 : 25;
    scores.push(netMarginScore);
    
    // COGS ratio score (target: <40% untuk F&B)
    const cogsRatio = (metrics.cogs / metrics.revenue) * 100;
    const cogsScore = cogsRatio <= 40 ? 100 :
                      cogsRatio <= 50 ? 75 :
                      cogsRatio <= 60 ? 50 : 25;
    scores.push(cogsScore);
    
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  };

  const healthScore = calculateHealthScore();
  const getHealthColor = () => 'text-gray-900 bg-gray-100';
  
  const getHealthEmoji = () => {
    if (healthScore >= 75) return '🎉';
    if (healthScore >= 50) return '😊';
    return '😟';
  };

  return (
    <Card className={`border border-gray-200 bg-white`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Kesehatan Bisnis</span>
          <span className="text-3xl">{getHealthEmoji()}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center mb-4">
          <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full ${getHealthColor()}`}>
            <span className="text-5xl font-bold">{healthScore}</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {healthScore >= 75 ? 'Mantap! Bisnis kamu sehat 💪' :
             healthScore >= 50 ? 'Lumayan, tapi masih bisa lebih baik 📈' :
             'Perlu perhatian khusus nih 🔧'}
          </p>
        </div>

        <div className="space-y-2">
          <HealthIndicator 
            label="Untung Kotor" 
            value={metrics.grossMargin}
            target={60}
            type="margin"
          />
          <HealthIndicator 
            label="Untung Bersih" 
            value={metrics.netMargin}
            target={15}
            type="margin"
          />
          <HealthIndicator 
            label="Efisiensi Bahan" 
            value={100 - (metrics.cogs / metrics.revenue * 100)}
            target={60}
            type="efficiency"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default HealthScoreCard;
