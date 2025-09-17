// src/components/promoCalculator/components/PromoWizard.tsx
// Wizard component for step navigation

import React from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';
import type { PromoWizardProps } from '../types/promo.types';

export const PromoWizard: React.FC<PromoWizardProps> = ({
  steps,
  currentStep,
  completedSteps,
  stepErrors,
  onStepClick
}) => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div 
              className={`flex items-center justify-center w-10 h-10 rounded-full border-2 cursor-pointer transition-all ${
                currentStep === step.id 
                  ? 'bg-orange-500 border-orange-500 text-white' 
                  : completedSteps.includes(step.id)
                  ? 'bg-green-500 border-green-500 text-white'
                  : 'bg-white border-gray-300 text-gray-500'
              }`}
              onClick={() => onStepClick(step.id)}
            >
              {completedSteps.includes(step.id) ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <span className="text-sm font-semibold">{step.id}</span>
              )}
            </div>
            {index < steps.length - 1 && (
              <div className={`w-16 h-0.5 mx-2 ${
                completedSteps.includes(step.id) ? 'bg-green-500' : 'bg-gray-300'
              }`} />
            )}
          </div>
        ))}
      </div>
      <div className="mt-4 text-center">
        <h2 className="text-xl font-semibold text-gray-900">
          {steps[currentStep - 1].title}
        </h2>
        <p className="text-gray-600 mt-1">
          {steps[currentStep - 1].description}
        </p>
        {stepErrors[currentStep] && stepErrors[currentStep].length > 0 && (
          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Mohon perbaiki kesalahan berikut:</span>
            </div>
            <ul className="mt-1 text-sm text-red-600 list-disc list-inside">
              {stepErrors[currentStep].map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};