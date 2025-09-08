// src/components/profitAnalysis/components/WACStatusIndicator.tsx
// WAC calculation transparency for users

import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calculator, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Refresh,
  TrendingUp,
  Package,
  Info
} from 'lucide-react';
import { formatCurrency } from '@/components/profitAnalysis/utils/profitTransformers';

interface WACStatusIndicatorProps {
  isWACActive: boolean;
  effectiveCogs?: number;
  totalHPP?: number;
  lastWACUpdate?: Date | string | null;
  isCalculating?: boolean;
  wacDataQuality?: 'high' | 'medium' | 'low';
  hppBreakdownCount?: number;
  onRefreshWAC?: () => void;
  onViewDetails?: () => void;
  className?: string;
}

const WACStatusIndicator: React.FC<WACStatusIndicatorProps> = ({
  isWACActive,
  effectiveCogs,
  totalHPP,
  lastWACUpdate,
  isCalculating = false,
  wacDataQuality = 'medium',
  hppBreakdownCount = 0,
  onRefreshWAC,
  onViewDetails,
  className = ''
}) => {
  const formatLastUpdate = (date: Date | string | null): string => {
    if (!date) return 'Belum pernah';
    
    const updateDate = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - updateDate.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMinutes < 1) return 'Baru saja';
    if (diffMinutes < 60) return `${diffMinutes} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays === 1) return 'Kemarin';
    if (diffDays < 7) return `${diffDays} hari lalu`;
    
    return updateDate.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: updateDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const getQualityBadge = () => {
    switch (wacDataQuality) {
      case 'high':
        return (
          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">
            Data Lengkap
          </Badge>
        );
      case 'medium':
        return (
          <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-300">
            Data Terbatas
          </Badge>
        );
      case 'low':
        return (
          <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-300">
            Data Minimal
          </Badge>
        );
      default:
        return null;
    }
  };

  const getQualityDescription = () => {
    switch (wacDataQuality) {
      case 'high':
        return 'Kalkulasi akurat berdasarkan riwayat pembelian lengkap';
      case 'medium':
        return 'Kalkulasi baik dengan beberapa data yang hilang';
      case 'low':
        return 'Kalkulasi dasar, disarankan lengkapi data pembelian';
      default:
        return '';
    }
  };

  if (!isWACActive) {
    return (
      <Alert className={`border-gray-200 bg-gray-50 ${className}`}>
        <Package className="h-4 w-4 text-gray-500" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold text-gray-700">📦 WAC Tidak Aktif</span>
              <p className="text-sm text-gray-600 mt-1">
                Menggunakan data COGS dari transaksi keuangan
              </p>
            </div>
            {onRefreshWAC && (
              <Button variant="outline" size="sm" onClick={onRefreshWAC}>
                Aktifkan WAC
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Main WAC Status */}
      <Alert className="border-green-200 bg-green-50">
        <div className="flex items-center gap-2">
          <Calculator className="h-4 w-4 text-green-600" />
          {isCalculating && <Clock className="h-4 w-4 text-green-600 animate-spin" />}
        </div>
        <AlertDescription>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-green-800">
                  🧮 Harga Rata-rata Aktif (WAC)
                </span>
                <CheckCircle className="w-4 h-4 text-green-600" />
                {getQualityBadge()}
              </div>
              
              <div className="text-sm text-green-700 space-y-1">
                <p>
                  HPP dihitung dari rata-rata tertimbang: <strong>{formatCurrency(effectiveCogs || 0)}/unit</strong>
                </p>
                <p className="text-xs">
                  {getQualityDescription()} • {hppBreakdownCount} jenis bahan
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              {onViewDetails && (
                <Button variant="outline" size="sm" onClick={onViewDetails} className="text-xs h-7">
                  <Info className="w-3 h-3 mr-1" />
                  Detail
                </Button>
              )}
              {onRefreshWAC && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onRefreshWAC}
                  disabled={isCalculating}
                  className="text-xs h-7"
                >
                  <Refresh className={`w-3 h-3 mr-1 ${isCalculating ? 'animate-spin' : ''}`} />
                  {isCalculating ? 'Update...' : 'Refresh'}
                </Button>
              )}
            </div>
          </div>
        </AlertDescription>
      </Alert>

      {/* Detailed Information */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
        <div className="bg-white border border-green-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="font-medium text-gray-700">Total HPP</span>
          </div>
          <p className="text-lg font-bold text-green-800">
            {formatCurrency(totalHPP || 0)}
          </p>
          <p className="text-xs text-gray-600">Per batch produksi</p>
        </div>
        
        <div className="bg-white border border-green-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Package className="w-4 h-4 text-green-600" />
            <span className="font-medium text-gray-700">Bahan Aktif</span>
          </div>
          <p className="text-lg font-bold text-green-800">
            {hppBreakdownCount}
          </p>
          <p className="text-xs text-gray-600">Jenis bahan dalam kalkulasi</p>
        </div>
        
        <div className="bg-white border border-green-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-green-600" />
            <span className="font-medium text-gray-700">Update Terakhir</span>
          </div>
          <p className="text-sm font-semibold text-green-800">
            {formatLastUpdate(lastWACUpdate)}
          </p>
          <p className="text-xs text-gray-600">Data WAC terbaru</p>
        </div>
      </div>

      {/* Data Quality Warning */}
      {wacDataQuality === 'low' && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-500" />
          <AlertDescription>
            <div className="flex items-start justify-between">
              <div>
                <span className="font-semibold text-orange-800">Kualitas Data Minimal</span>
                <p className="text-sm text-orange-700 mt-1">
                  Untuk hasil lebih akurat, lengkapi riwayat pembelian bahan baku di menu Gudang.
                </p>
              </div>
              <Button variant="outline" size="sm" className="text-xs h-7">
                Kelola Gudang
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Info Tip */}
      <div className="text-xs text-blue-600 flex items-start gap-2 px-3">
        <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
        <span>
          💡 <strong>WAC (Weighted Average Cost)</strong> menghitung harga rata-rata bahan berdasarkan 
          semua pembelian dengan bobot sesuai jumlah. Ini memberikan perhitungan HPP yang lebih akurat 
          dibanding harga terakhir saja.
        </span>
      </div>
    </div>
  );
};

export default WACStatusIndicator;
