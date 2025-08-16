// src/components/operational-costs/components/SimpleAllocationSettings.tsx

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Calculator, 
  ArrowLeft, 
  Info, 
  Zap,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { formatCurrency } from '../utils/costHelpers';
import { AllocationSettings, AllocationFormData, CostSummary } from '../types';

interface SimpleAllocationSettingsProps {
  settings: AllocationSettings | null;
  costSummary: CostSummary;
  simpleData?: {
    perProductCost: number;
    monthlyProduction: number;
  };
  onSave: (data: AllocationFormData) => Promise<boolean>;
  onBackToAuto: () => void;
  loading?: boolean;
  className?: string;
}

export const SimpleAllocationSettings: React.FC<SimpleAllocationSettingsProps> = ({
  settings,
  costSummary,
  simpleData,
  onSave,
  onBackToAuto,
  loading = false,
  className = ''
}) => {
  const [currentMode, setCurrentMode] = useState<'simple' | 'advanced'>('simple');
  const [isProcessing, setIsProcessing] = useState(false);

  // Auto-apply simple allocation if we have simple data
  useEffect(() => {
    if (simpleData && !isProcessing) {
      handleApplySimpleAllocation();
    }
  }, [simpleData]);

  const handleApplySimpleAllocation = async () => {
    if (!simpleData) return;

    setIsProcessing(true);
    
    // Convert simple data to allocation format
    const formData: AllocationFormData = {
      metode: 'per_unit',
      nilai: simpleData.monthlyProduction // Use monthly production as the basis
    };

    try {
      await onSave(formData);
    } catch (error) {
      console.error('Error saving simple allocation:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const currentAllocation = settings ? {
    method: settings.metode === 'per_unit' ? 'Bagi rata per produk' : 'Persentase dari bahan baku',
    value: settings.metode === 'per_unit' 
      ? `${settings.nilai.toLocaleString('id-ID')} produk/bulan`
      : `${settings.nilai}%`,
    description: settings.metode === 'per_unit'
      ? 'Biaya operasional dibagi rata ke jumlah produksi bulanan'
      : 'Biaya operasional dihitung sebagai persentase dari biaya bahan baku'
  } : null;

  const overheadPerUnit = costSummary.total_biaya_aktif > 0 && settings
    ? settings.metode === 'per_unit' 
      ? costSummary.total_biaya_aktif / settings.nilai
      : (costSummary.total_biaya_aktif * settings.nilai) / 100
    : simpleData?.perProductCost || 0;

  return (
    <Card className={`${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-50 rounded-lg">
              <Settings className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <CardTitle className="text-lg">⚙️ Pengaturan Alokasi</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Tentukan cara pembagian biaya operasional
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onBackToAuto}
            className="text-xs"
          >
            <ArrowLeft className="h-3 w-3 mr-1" />
            Kembali ke Auto
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Current Settings Display */}
        {currentAllocation && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">Pengaturan Aktif</span>
            </div>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm text-green-700">
                  <strong>Metode:</strong> {currentAllocation.method}
                </p>
                <p className="text-xs text-green-600 mt-1">{currentAllocation.description}</p>
              </div>
              
              <div>
                <p className="text-sm text-green-700">
                  <strong>Nilai Basis:</strong> {currentAllocation.value}
                </p>
              </div>

              {overheadPerUnit > 0 && (
                <div className="border-t border-green-200 pt-3">
                  <p className="text-sm text-green-700">
                    <strong>Biaya operasional per produk:</strong>
                  </p>
                  <div className="text-lg font-bold text-green-800">
                    {formatCurrency(overheadPerUnit)}
                  </div>
                  <p className="text-xs text-green-600 mt-1">per produk yang dibuat</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Simple Mode Recommendation */}
        {simpleData && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">💡 Rekomendasi Auto-Mode</span>
            </div>
            
            <div className="space-y-3">
              <p className="text-sm text-blue-700">
                Berdasarkan perhitungan otomatis, berikut pengaturan yang direkomendasikan:
              </p>
              
              <div className="bg-white rounded-lg p-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-blue-600">Metode:</span>
                    <p className="font-medium text-blue-900">Bagi rata per produk</p>
                  </div>
                  <div>
                    <span className="text-blue-600">Basis:</span>
                    <p className="font-medium text-blue-900">
                      {simpleData.monthlyProduction.toLocaleString()} produk/bulan
                    </p>
                  </div>
                  <div className="col-span-full">
                    <span className="text-blue-600">Biaya per produk:</span>
                    <p className="font-bold text-blue-900 text-lg">
                      {formatCurrency(simpleData.perProductCost)}
                    </p>
                  </div>
                </div>
              </div>

              {!settings && (
                <Button
                  onClick={handleApplySimpleAllocation}
                  disabled={isProcessing || loading}
                  className="w-full"
                  size="sm"
                >
                  {isProcessing ? 'Menerapkan...' : '✓ Gunakan Pengaturan Ini'}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Current Calculation Preview */}
        {costSummary.total_biaya_aktif > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calculator className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Ringkasan Biaya</span>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total biaya operasional/bulan:</span>
                <span className="font-medium">{formatCurrency(costSummary.total_biaya_aktif)}</span>
              </div>
              
              {settings && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {settings.metode === 'per_unit' ? 'Target produksi/bulan:' : 'Persentase alokasi:'}
                    </span>
                    <span className="font-medium">
                      {settings.metode === 'per_unit' 
                        ? `${settings.nilai.toLocaleString()} produk`
                        : `${settings.nilai}%`
                      }
                    </span>
                  </div>
                  
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-600">Biaya per produk:</span>
                    <span className="font-bold text-lg">{formatCurrency(overheadPerUnit)}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Advanced Options */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-700">Opsi Lanjutan</h4>
            <Badge variant="outline" className="text-xs">
              {currentMode === 'simple' ? 'Mode Sederhana' : 'Mode Lanjutan'}
            </Badge>
          </div>

          {currentMode === 'simple' ? (
            <div className="space-y-3">
              <p className="text-xs text-gray-600">
                Saat ini menggunakan mode sederhana yang membagi rata biaya operasional 
                ke semua produk berdasarkan target produksi bulanan.
              </p>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentMode('advanced')}
                  className="text-xs"
                >
                  <Settings className="h-3 w-3 mr-1" />
                  Gunakan Mode Lanjutan
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onBackToAuto}
                  className="text-xs"
                >
                  Kembali ke Auto-Mode
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">Mode Lanjutan</span>
                </div>
                <p className="text-xs text-yellow-700">
                  Mode lanjutan memungkinkan Anda mengatur alokasi berdasarkan persentase 
                  dari biaya bahan baku. Ini lebih kompleks dan cocok untuk bisnis yang sudah 
                  memahami cost accounting.
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentMode('simple')}
                  className="text-xs"
                >
                  Kembali ke Mode Sederhana
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onBackToAuto}
                  className="text-xs"
                >
                  Kembali ke Auto-Mode
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Info className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Cara Kerja</span>
          </div>
          <div className="text-xs text-blue-700 space-y-1">
            <p>
              <strong>Bagi rata per produk:</strong> Total biaya operasional dibagi dengan 
              target produksi bulanan untuk mendapat biaya per produk.
            </p>
            <p className="text-blue-600 mt-2">
              Formula: {formatCurrency(costSummary.total_biaya_aktif)} ÷ {simpleData?.monthlyProduction.toLocaleString() || 'Target Produksi'} = 
              Biaya per produk
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
