// src/components/promoCalculator/components/PromoNavigation.tsx
// Navigation component for promo wizard

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calculator, 
  Save, 
  RefreshCw,
  Info
} from 'lucide-react';
import type { PromoNavigationProps } from '../types/promo.types';

export const PromoNavigation: React.FC<PromoNavigationProps> = ({
  currentStep,
  totalSteps,
  completedSteps,
  stepErrors,
  isCalculating,
  isSaving,
  calculationResult,
  onPrevStep,
  onNextStep,
  onCalculate,
  onSave
}) => {
  const hasStepErrors = stepErrors[currentStep] && stepErrors[currentStep].length > 0;
  
  return (
    <Card className="sticky top-6">
      <CardHeader>
        <CardTitle>Navigasi</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Step Navigation */}
        <div className="space-y-3">
          {currentStep > 1 && (
            <Button
              onClick={onPrevStep}
              variant="outline"
              className="w-full"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Kembali
            </Button>
          )}

          {currentStep < totalSteps && (
            <Button
              onClick={onNextStep}
              className="w-full"
              disabled={hasStepErrors}
            >
              Lanjut
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}

          {currentStep === totalSteps && (
            <>
              <Button
                onClick={onCalculate}
                disabled={isCalculating || hasStepErrors}
                className="w-full"
                variant="outline"
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

              <Button
                onClick={onSave}
                disabled={isSaving || !calculationResult || hasStepErrors}
                className="w-full bg-orange-500 hover:bg-orange-600"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Simpan Promo
                  </>
                )}
              </Button>
            </>
          )}
        </div>

        {/* Progress Info */}
        <div className="pt-4 border-t">
          <div className="text-sm text-gray-600 mb-2">
            Step {currentStep} dari {totalSteps}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-orange-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Help Text */}
        <div className="pt-4 border-t">
          <div className="text-sm text-gray-600">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 mt-0.5 text-blue-500 flex-shrink-0" />
              <div>
                {currentStep === 1 && "Isi informasi dasar promo seperti nama, tipe, dan periode berlaku."}
                {currentStep === 2 && "Tentukan harga dan pengaturan spesifik sesuai tipe promo yang dipilih."}
                {currentStep === 3 && "Pilih status promo dan review ringkasan sebelum menyimpan."}
                {currentStep === 4 && "Pilih status promo dan review ringkasan sebelum menyimpan."}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};