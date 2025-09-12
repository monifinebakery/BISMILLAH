// src/components/purchase/PurchaseImpactPreview.tsx

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Info, 
  Calculator,
  DollarSign,
  Percent,
  BarChart3
} from 'lucide-react';
import { formatCurrency, formatPercentage } from '@/utils/formatters';
// Import hook yang sudah ada
// import { useWACImpactCalculation } from '@/hooks/useWACImpactCalculation.ts';

// ==============================================
// TYPES
// ==============================================

export interface PurchaseItem {
  id: string;
  bahan_baku_id: string;
  nama_bahan?: string;
  quantity: number;
  harga_satuan: number;
  total_harga: number;
}

export interface PurchaseImpactPreviewProps {
  items: PurchaseItem[];
  className?: string;
  onImpactCalculated?: (impact: ProfitImpact) => void;
}

export interface ProfitImpact {
  currentWAC: number;
  newWAC: number;
  wacChange: number;
  wacChangePercentage: number;
  currentMargin: number;
  newMargin: number;
  marginChange: number;
  marginChangePercentage: number;
  impactLevel: 'low' | 'medium' | 'high';
  recommendation: string;
}

// ==============================================
// COMPONENT
// ==============================================

const PurchaseImpactPreview: React.FC<PurchaseImpactPreviewProps> = ({
  items,
  className = '',
  onImpactCalculated
}) => {
  const [impact, setImpact] = useState<ProfitImpact | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Temporary implementation until hook is available
  const calculateWACImpact = async (item: { bahan_baku_id: string; quantity: number; harga_satuan: number }) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 100));
    return {
      currentWAC: Math.random() * 10000 + 5000,
      newWAC: Math.random() * 10000 + 5000
    };
  };
  const isLoading = false;

  // Calculate impact when items change
  useEffect(() => {
    if (items.length === 0) {
      setImpact(null);
      setError(null);
      return;
    }

    calculateImpact();
  }, [items]);

  const calculateImpact = async () => {
    if (items.length === 0) return;

    setIsCalculating(true);
    setError(null);

    try {
      // Calculate WAC impact for each item
      const impactResults = await Promise.all(
        items.map(item => 
          calculateWACImpact({
            bahan_baku_id: item.bahan_baku_id,
            quantity: item.quantity,
            harga_satuan: item.harga_satuan
          })
        )
      );

      // Aggregate results
      const totalCurrentWAC = impactResults.reduce((sum: number, result: any) => sum + (result.currentWAC || 0), 0);
      const totalNewWAC = impactResults.reduce((sum: number, result: any) => sum + (result.newWAC || 0), 0);
      const avgCurrentWAC = totalCurrentWAC / impactResults.length;
      const avgNewWAC = totalNewWAC / impactResults.length;
      
      const wacChange = avgNewWAC - avgCurrentWAC;
      const wacChangePercentage = avgCurrentWAC > 0 ? (wacChange / avgCurrentWAC) * 100 : 0;

      // Estimate margin impact (simplified calculation)
      const currentMargin = 25; // Default margin assumption
      const marginImpact = Math.abs(wacChangePercentage) * 0.5; // Simplified impact factor
      const newMargin = wacChange > 0 ? currentMargin - marginImpact : currentMargin + marginImpact;
      const marginChange = newMargin - currentMargin;
      const marginChangePercentage = currentMargin > 0 ? (marginChange / currentMargin) * 100 : 0;

      // Determine impact level
      let impactLevel: 'low' | 'medium' | 'high' = 'low';
      if (Math.abs(wacChangePercentage) > 10) impactLevel = 'high';
      else if (Math.abs(wacChangePercentage) > 5) impactLevel = 'medium';

      // Generate recommendation
      let recommendation = '';
      if (wacChange > 0) {
        if (impactLevel === 'high') {
          recommendation = 'WAC akan naik signifikan. Pertimbangkan untuk mencari supplier dengan harga lebih baik.';
        } else if (impactLevel === 'medium') {
          recommendation = 'WAC akan naik moderat. Monitor dampak terhadap margin profit.';
        } else {
          recommendation = 'Dampak WAC minimal. Pembelian dapat dilanjutkan.';
        }
      } else {
        recommendation = 'WAC akan turun. Pembelian ini akan meningkatkan margin profit.';
      }

      const calculatedImpact: ProfitImpact = {
        currentWAC: avgCurrentWAC,
        newWAC: avgNewWAC,
        wacChange,
        wacChangePercentage,
        currentMargin,
        newMargin,
        marginChange,
        marginChangePercentage,
        impactLevel,
        recommendation
      };

      setImpact(calculatedImpact);
      onImpactCalculated?.(calculatedImpact);

    } catch (err) {
      console.error('Error calculating purchase impact:', err);
      setError('Gagal menghitung dampak pembelian. Silakan coba lagi.');
    } finally {
      setIsCalculating(false);
    }
  };

  if (items.length === 0) {
    return null;
  }

  if (isCalculating || isLoading) {
    return (
      <Card className={`border-blue-200 bg-blue-50 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Calculator className="h-4 w-4 animate-spin" />
            <span className="text-sm text-blue-700">Menghitung dampak pembelian...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert className={`border-red-200 bg-red-50 ${className}`}>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="text-red-700">
          {error}
          <Button 
            variant="link" 
            size="sm" 
            onClick={calculateImpact}
            className="ml-2 p-0 h-auto text-red-700 underline"
          >
            Coba lagi
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!impact) {
    return null;
  }

  const getImpactColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-red-500" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-green-500" />;
    return <BarChart3 className="h-4 w-4 text-gray-500" />;
  };

  return (
    <Card className={`${getImpactColor(impact.impactLevel)} ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center space-x-2">
          <Calculator className="h-4 w-4" />
          <span>Preview Dampak Pembelian</span>
          <Badge variant="outline" className="ml-auto">
            {impact.impactLevel === 'high' ? 'Tinggi' : 
             impact.impactLevel === 'medium' ? 'Sedang' : 'Rendah'}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* WAC Impact */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-1">
              <DollarSign className="h-3 w-3" />
              <span className="text-xs font-medium">WAC Saat Ini</span>
            </div>
            <p className="text-sm font-semibold">{formatCurrency(impact.currentWAC)}</p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center space-x-1">
              <DollarSign className="h-3 w-3" />
              <span className="text-xs font-medium">WAC Setelah Pembelian</span>
            </div>
            <div className="flex items-center space-x-1">
              <p className="text-sm font-semibold">{formatCurrency(impact.newWAC)}</p>
              {getChangeIcon(impact.wacChange)}
            </div>
          </div>
        </div>

        {/* Margin Impact */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-1">
              <Percent className="h-3 w-3" />
              <span className="text-xs font-medium">Margin Saat Ini</span>
            </div>
            <p className="text-sm font-semibold">{formatPercentage(impact.currentMargin / 100)}</p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center space-x-1">
              <Percent className="h-3 w-3" />
              <span className="text-xs font-medium">Estimasi Margin Baru</span>
            </div>
            <div className="flex items-center space-x-1">
              <p className="text-sm font-semibold">{formatPercentage(impact.newMargin / 100)}</p>
              {getChangeIcon(impact.marginChange)}
            </div>
          </div>
        </div>

        {/* Change Summary */}
        <div className="pt-2 border-t border-current border-opacity-20">
          <div className="flex items-center space-x-2 mb-2">
            <Info className="h-4 w-4" />
            <span className="text-xs font-medium">Perubahan</span>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>WAC:</span>
              <span className={impact.wacChange > 0 ? 'text-red-600' : 'text-green-600'}>
                {impact.wacChange > 0 ? '+' : ''}{formatPercentage(impact.wacChangePercentage / 100)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Margin:</span>
              <span className={impact.marginChange < 0 ? 'text-red-600' : 'text-green-600'}>
                {impact.marginChange > 0 ? '+' : ''}{formatPercentage(impact.marginChangePercentage / 100)}
              </span>
            </div>
          </div>
        </div>

        {/* Recommendation */}
        <Alert className="border-current border-opacity-30 bg-current bg-opacity-10">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            {impact.recommendation}
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default PurchaseImpactPreview;