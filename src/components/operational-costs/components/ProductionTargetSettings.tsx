// src/components/operational-costs/components/ProductionTargetSettings.tsx

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Target, Calculator, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useOperationalCostRefactored } from '../context/OperationalCostContextRefactored';
import { productionOutputApi } from '../services/productionOutputApi';
import { logger } from '@/utils/logger';

interface ProductionTargetSettingsProps {
  className?: string;
  onTargetChanged?: (newTarget: number) => void;
}

const ProductionTargetSettings: React.FC<ProductionTargetSettingsProps> = ({
  className = '',
  onTargetChanged,
}) => {
  const { actions } = useOperationalCostRefactored();
  const [targetPcs, setTargetPcs] = useState<number>(1000);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCurrent, setIsLoadingCurrent] = useState(true);
  const [hasChanged, setHasChanged] = useState(false);
  const [lastSavedTarget, setLastSavedTarget] = useState<number>(1000);

  // Load current production target on component mount
  useEffect(() => {
    const loadCurrentTarget = async () => {
      setIsLoadingCurrent(true);
      try {
        const response = await productionOutputApi.getCurrentProductionTarget();
        if (response.data && response.data > 0) {
          setTargetPcs(response.data);
          setLastSavedTarget(response.data);
          logger.debug('✅ Current production target loaded:', response.data);
        } else {
          logger.warn('⚠️ No production target found, using default 1000');
        }
      } catch (error) {
        logger.error('❌ Error loading production target:', error);
        toast.error('Gagal memuat target produksi saat ini');
      } finally {
        setIsLoadingCurrent(false);
      }
    };

    loadCurrentTarget();
  }, []);

  // Check if value has changed
  useEffect(() => {
    setHasChanged(targetPcs !== lastSavedTarget && targetPcs > 0);
  }, [targetPcs, lastSavedTarget]);

  const handleSave = async () => {
    if (targetPcs <= 0) {
      toast.error('Target produksi harus lebih dari 0');
      return;
    }

    setIsLoading(true);
    try {
      logger.info('🎯 Saving production target:', targetPcs);

      // Update production target using context (which will auto-invalidate overhead)
      const success = await actions.updateProductionTarget(targetPcs);

      if (success) {
        setLastSavedTarget(targetPcs);
        setHasChanged(false);
        
        // ✅ Additional manual invalidation to ensure all components update
        actions.invalidateOverheadCalculations();
        
        // ✅ Notify parent component if callback provided
        onTargetChanged?.(targetPcs);
        
        toast.success(
          `Target produksi berhasil diubah menjadi ${targetPcs.toLocaleString('id-ID')} pcs/bulan`,
          {
            description: 'Semua perhitungan biaya overhead akan otomatis terupdate'
          }
        );
        
        logger.success('✅ Production target saved and all related calculations invalidated');
      } else {
        throw new Error('Gagal menyimpan target produksi');
      }
    } catch (error) {
      logger.error('❌ Error saving production target:', error);
      toast.error('Gagal menyimpan target produksi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setTargetPcs(lastSavedTarget);
    setHasChanged(false);
  };

  const handleRecalculateOverhead = () => {
    logger.info('🔄 Manually triggering overhead recalculation');
    actions.invalidateOverheadCalculations();
    toast.success('Perhitungan overhead akan diperbarui', {
      description: 'Semua kalkulasi biaya overhead akan dikalkulasi ulang'
    });
  };

  if (isLoadingCurrent) {
    return (
      <Card className={`${className}`}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">Target Produksi Bulanan</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-10 bg-gray-200 rounded w-full"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">Target Produksi Bulanan</CardTitle>
          </div>
          {hasChanged && (
            <div className="flex items-center gap-1 text-orange-600">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Belum Disimpan</span>
            </div>
          )}
          {!hasChanged && !isLoading && (
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Tersimpan</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label htmlFor="targetPcs" className="text-sm font-medium text-gray-700">
              Target Produksi (pcs/bulan) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="targetPcs"
              type="number"
              value={targetPcs || ''}
              onChange={(e) => setTargetPcs(Number(e.target.value) || 0)}
              placeholder="Masukkan target produksi bulanan"
              min="1"
              max="1000000"
              className="mt-1"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Target ini akan digunakan untuk menghitung biaya overhead per unit
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <div className="flex gap-2 flex-1">
              {hasChanged && (
                <Button
                  onClick={handleReset}
                  variant="outline"
                  disabled={isLoading}
                  className="flex-1 sm:flex-none"
                >
                  Reset
                </Button>
              )}
              <Button
                onClick={handleSave}
                disabled={!hasChanged || isLoading || targetPcs <= 0}
                className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Target className="mr-2 h-4 w-4" />
                    Simpan Target
                  </>
                )}
              </Button>
            </div>
            
            {/* Manual Recalculate Button */}
            <Button
              onClick={handleRecalculateOverhead}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
            >
              <Calculator className="h-4 w-4" />
              Kalkulasi Ulang
            </Button>
          </div>

          {/* Information */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">
              💡 Informasi Auto-Sync
            </h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Perubahan target akan otomatis memperbarui biaya overhead per unit</li>
              <li>• Semua kalkulasi HPP yang menggunakan overhead akan terupdate</li>
              <li>• Target saat ini: <strong>{lastSavedTarget.toLocaleString('id-ID')} pcs/bulan</strong></li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductionTargetSettings;