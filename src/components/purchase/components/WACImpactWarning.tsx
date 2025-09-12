// src/components/purchase/components/WACImpactWarning.tsx
// Warning component untuk menampilkan dampak WAC terhadap profit

import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Calculator, 
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { formatCurrency } from '@/utils/formatUtils';
import { PurchaseItem } from '../types/purchase.types';

interface WACImpactData {
  materialName: string;
  currentWAC: number;
  newWAC: number;
  currentStock: number;
  purchaseQty: number;
  purchasePrice: number;
  wacIncrease: number;
  wacIncreasePercentage: number;
  estimatedProfitImpact: number;
}

interface WACImpactWarningProps {
  items: PurchaseItem[];
  onCalculateImpact?: (items: PurchaseItem[]) => Promise<WACImpactData[]>;
  className?: string;
}

const WACImpactWarning: React.FC<WACImpactWarningProps> = ({
  items,
  onCalculateImpact,
  className = ''
}) => {
  const [impactData, setImpactData] = useState<WACImpactData[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [hasSignificantImpact, setHasSignificantImpact] = useState(false);

  // Calculate impact when items change
  useEffect(() => {
    if (items.length === 0) {
      setImpactData([]);
      setHasSignificantImpact(false);
      return;
    }

    const calculateImpact = async () => {
      if (!onCalculateImpact) return;
      
      setIsCalculating(true);
      try {
        const data = await onCalculateImpact(items);
        setImpactData(data);
        
        // Check if any material has significant WAC increase (>10%)
        const hasSignificant = data.some(item => 
          item.wacIncreasePercentage > 10 || 
          Math.abs(item.estimatedProfitImpact) > 50000 // Rp 50,000
        );
        setHasSignificantImpact(hasSignificant);
      } catch (error) {
        console.error('Error calculating WAC impact:', error);
      } finally {
        setIsCalculating(false);
      }
    };

    // Debounce calculation
    const timeoutId = setTimeout(calculateImpact, 500);
    return () => clearTimeout(timeoutId);
  }, [items, onCalculateImpact]);

  // Don't show if no items or no significant impact
  if (items.length === 0 || (!hasSignificantImpact && !isCalculating)) {
    return null;
  }

  const totalProfitImpact = impactData.reduce((sum, item) => sum + item.estimatedProfitImpact, 0);
  const highestImpactItem = impactData.reduce((max, item) => 
    Math.abs(item.estimatedProfitImpact) > Math.abs(max.estimatedProfitImpact) ? item : max,
    impactData[0] || {} as WACImpactData
  );

  const getImpactSeverity = () => {
    if (Math.abs(totalProfitImpact) > 100000) return 'high'; // > Rp 100,000
    if (Math.abs(totalProfitImpact) > 50000) return 'medium'; // > Rp 50,000
    return 'low';
  };

  const severity = getImpactSeverity();

  const getAlertStyle = () => {
    switch (severity) {
      case 'high':
        return 'border-red-200 bg-red-50';
      case 'medium':
        return 'border-orange-200 bg-orange-50';
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  const getIconColor = () => {
    switch (severity) {
      case 'high':
        return 'text-red-500';
      case 'medium':
        return 'text-orange-500';
      default:
        return 'text-blue-500';
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <Alert className={getAlertStyle()}>
        <div className="flex items-center gap-2">
          {isCalculating ? (
            <Calculator className={`h-4 w-4 ${getIconColor()} animate-spin`} />
          ) : totalProfitImpact < 0 ? (
            <TrendingDown className={`h-4 w-4 ${getIconColor()}`} />
          ) : (
            <TrendingUp className={`h-4 w-4 ${getIconColor()}`} />
          )}
          {severity === 'high' && <AlertTriangle className="h-4 w-4 text-red-500" />}
        </div>
        
        <AlertDescription>
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <span className="font-semibold text-gray-800">
                  {isCalculating ? (
                    '🧮 Menghitung dampak WAC...'
                  ) : (
                    `⚠️ Dampak Pembelian terhadap Profit`
                  )}
                </span>
                {!isCalculating && (
                  <p className="text-sm mt-1">
                    Pembelian ini akan {totalProfitImpact < 0 ? 'menurunkan' : 'meningkatkan'} profit sebesar{' '}
                    <strong className={totalProfitImpact < 0 ? 'text-red-700' : 'text-green-700'}>
                      {formatCurrency(Math.abs(totalProfitImpact))}
                    </strong>
                  </p>
                )}
              </div>
              
              {!isCalculating && impactData.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-xs h-7"
                >
                  {showDetails ? (
                    <><ChevronUp className="w-3 h-3 mr-1" /> Sembunyikan</>
                  ) : (
                    <><ChevronDown className="w-3 h-3 mr-1" /> Detail</>
                  )}
                </Button>
              )}
            </div>

            {/* Quick Summary */}
            {!isCalculating && highestImpactItem.materialName && (
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline" className="text-xs">
                  Dampak Terbesar
                </Badge>
                <span>
                  <strong>{highestImpactItem.materialName}</strong> - WAC naik{' '}
                  <strong>{highestImpactItem.wacIncreasePercentage.toFixed(1)}%</strong>
                </span>
              </div>
            )}

            {/* Detailed Breakdown */}
            {showDetails && !isCalculating && (
              <div className="mt-4 space-y-3">
                <div className="text-sm font-medium text-gray-700 border-b pb-2">
                  📊 Rincian Dampak per Bahan:
                </div>
                
                <div className="space-y-2">
                  {impactData.map((item, index) => (
                    <div key={index} className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-medium text-gray-800">{item.materialName}</div>
                        <Badge 
                          variant={item.estimatedProfitImpact < 0 ? "destructive" : "default"}
                          className="text-xs"
                        >
                          {item.estimatedProfitImpact < 0 ? '📉' : '📈'} {formatCurrency(Math.abs(item.estimatedProfitImpact))}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
                        <div>
                          <span className="block">WAC Saat Ini:</span>
                          <span className="font-medium">{formatCurrency(item.currentWAC)}</span>
                        </div>
                        <div>
                          <span className="block">WAC Baru:</span>
                          <span className="font-medium">{formatCurrency(item.newWAC)}</span>
                        </div>
                        <div>
                          <span className="block">Stok Saat Ini:</span>
                          <span className="font-medium">{item.currentStock.toLocaleString('id-ID')}</span>
                        </div>
                        <div>
                          <span className="block">Pembelian:</span>
                          <span className="font-medium">{item.purchaseQty.toLocaleString('id-ID')} @ {formatCurrency(item.purchasePrice)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Recommendations */}
            {!isCalculating && severity === 'high' && (
              <div className="mt-3 p-3 bg-white rounded-lg border border-red-200">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <div className="font-medium text-red-800 mb-1">💡 Rekomendasi:</div>
                    <ul className="text-red-700 space-y-1 text-xs">
                      <li>• Pertimbangkan menaikkan harga jual produk</li>
                      <li>• Cari supplier dengan harga lebih kompetitif</li>
                      <li>• Review margin profit target</li>
                      <li>• Evaluasi efisiensi penggunaan bahan</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default WACImpactWarning;