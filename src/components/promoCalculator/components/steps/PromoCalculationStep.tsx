// src/components/promoCalculator/components/steps/PromoCalculationStep.tsx
// Step 3: Kalkulasi & Review

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calculator, RefreshCw, Info } from 'lucide-react';
import { PromoCalculationDisplay } from '../PromoCalculationDisplay';
import type { PromoFormData, PromoCalculationResult } from '../../types/promo.types';

interface PromoCalculationStepProps {
  formData: PromoFormData;
  calculationResult: PromoCalculationResult | null;
  isCalculating?: boolean;
  onCalculate: () => void;
}

export const PromoCalculationStep: React.FC<PromoCalculationStepProps> = ({
  formData,
  calculationResult,
  isCalculating,
  onCalculate,
}) => {
  const canCalculate = Boolean(formData.hargaProduk && formData.hpp);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-orange-500" />
          Kalkulasi & Review
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!calculationResult && (
          <div className="p-4 border rounded-lg bg-gray-50">
            <div className="flex items-start gap-2 text-gray-700">
              <Info className="w-4 h-4 mt-0.5 text-blue-500" />
              <p className="text-sm">
                Tekan tombol "Hitung Promo" untuk melihat ringkasan hasil. Pastikan harga jual dan HPP sudah diisi.
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={onCalculate}
            disabled={!canCalculate || Boolean(isCalculating)}
            variant={calculationResult ? 'outline' : 'default'}
            className="sm:w-auto"
            aria-disabled={!canCalculate || Boolean(isCalculating)}
            aria-label="Hitung promo"
          >
            {isCalculating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Menghitung...
              </>
            ) : (
              <>
                <Calculator className="w-4 h-4 mr-2" />
                Hitung Promo
              </>
            )}
          </Button>
        </div>

        {calculationResult && (
          <PromoCalculationDisplay calculationResult={calculationResult} />
        )}
      </CardContent>
    </Card>
  );
};

