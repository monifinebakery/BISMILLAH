// src/components/promoCalculator/PromoFullCalculator.tsx
// Refactored PromoFullCalculator using modular components

import React from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, AlertCircle } from 'lucide-react';

// Refactored components and hooks
import { usePromoForm } from './hooks/usePromoForm';
import { 
  PromoWizard,
  PromoCalculationDisplay,
  PromoNavigation,
  PromoBasicInfoStep,
  PromoSettingsStep,
  PromoStatusStep,
  PromoCalculationStep
} from './components';
import { Card, CardContent } from '@/components/ui/card';

const PromoFullCalculator = () => {
  const [showCreatorHint, setShowCreatorHint] = React.useState<boolean>(false);
  React.useEffect(() => {
    try {
      const dismissed = localStorage.getItem('promoCreatorHintDismissed');
      setShowCreatorHint(!dismissed);
    } catch {}
  }, []);
  const dismissCreatorHint = () => {
    try { localStorage.setItem('promoCreatorHintDismissed', '1'); } catch {}
    setShowCreatorHint(false);
  };
  const { id } = useParams();
  const {
    // Form state
    formData,
    handleInputChange,
    handleSelectChange,
    
    // Wizard state
    steps,
    currentStep,
    completedSteps,
    stepErrors,
    goToStep,
    nextStep,
    prevStep,
    
    // Calculation
    calculationResult,
    isCalculating,
    calculate,
    
    // Save
    isSaving,
    handleSave,
    handleGoBack,
    
    // Query states
    isLoading,
    isError,
    error,
    isEditMode
  } = usePromoForm(id);

  // Render function for step content
  const renderStepContent = () => {
    const stepProps = {
      formData,
      stepErrors: stepErrors?.[currentStep] || [],
      onInputChange: handleInputChange,
      onSelectChange: handleSelectChange,
    };

    switch (currentStep) {
      case 1:
        return <PromoBasicInfoStep {...stepProps} />;
      case 2:
        return <PromoSettingsStep {...stepProps} />;
      case 3:
        return (
          <PromoCalculationStep
            formData={formData}
            calculationResult={calculationResult}
            isCalculating={isCalculating}
            onCalculate={() => calculate && formData && calculate(formData)}
          />
        );
      case 4:
        return <PromoStatusStep {...stepProps} />;
      default:
        return <PromoBasicInfoStep {...stepProps} />;
    }
  };

  // Loading state
  if (isEditMode && isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
        <Skeleton className="h-12 w-32" />
      </div>
    );
  }

  // Error state
  if (isEditMode && isError) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Gagal Memuat Data Promo
            </h2>
            <p className="text-gray-600 mb-4">
              {error?.message || 'Terjadi kesalahan saat memuat data promo untuk diedit.'}
            </p>
            <Button onClick={() => window.history.back()} variant="outline">
              Kembali ke Daftar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button onClick={handleGoBack} variant="outline" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditMode ? 'Edit Promo' : 'Buat Promo Baru'}
          </h1>
          <div></div>
        </div>

        {/* Wizard */}
        {steps && (
          <PromoWizard
            steps={steps}
            currentStep={currentStep}
            completedSteps={completedSteps || []}
            stepErrors={stepErrors || {}}
            onStepClick={goToStep}
          />
        )}

        {/* Guided Hint (one-time) */}
        {showCreatorHint && currentStep === 1 && (
          <Card className="mb-4 border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-2">Cara kerja wizard:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Isi Informasi Dasar.</li>
                  <li>Atur Pengaturan Promo (harga, diskon/BOGO/bundle).</li>
                  <li>Hitung promo di langkah Kalkulasi.</li>
                  <li>Pilih Status dan Simpan.</li>
                </ol>
                <div className="mt-3">
                  <Button size="sm" variant="outline" onClick={dismissCreatorHint}>Mengerti</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Section */}
          <div className="lg:col-span-2 space-y-6">
            {renderStepContent()}

            {/* Calculation Results */}
            {currentStep !== 3 && calculationResult && (
              <PromoCalculationDisplay calculationResult={calculationResult} />
            )}
          </div>

          {/* Navigation Panel */}
          <div className="lg:col-span-1">
            {steps && (
              <PromoNavigation
                currentStep={currentStep}
                totalSteps={steps.length}
                completedSteps={completedSteps || []}
                stepErrors={stepErrors || {}}
                isCalculating={isCalculating || false}
                isSaving={isSaving || false}
                calculationResult={calculationResult}
                onPrevStep={prevStep}
                onNextStep={nextStep}
                onCalculate={() => calculate && formData && calculate(formData)}
                onSave={handleSave}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromoFullCalculator;
