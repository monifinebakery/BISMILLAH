// src/components/operational-costs/components/AllocationSettings.tsx

import React, { useState, useEffect } from 'react';
import { Settings, Calculator, Info, cog } from 'lucide-react';
import { AllocationSettings, AllocationFormData, CostSummary } from '../types';
import { validateAllocationForm } from '../utils/costValidation';
import { transformAllocationToForm } from '../utils/costTransformers';
import { formatCurrency } from '../utils/costHelpers';
import { METODE_ALOKASI_OPTIONS, DEFAULT_ALLOCATION_VALUES } from '../constants/allocationMethods';

interface AllocationSettingsProps {
  settings: AllocationSettings | null;
  costSummary: CostSummary;
  onSave: (data: AllocationFormData) => Promise<boolean>;
  loading?: boolean;
  className?: string;
}

const AllocationSettingsComponent: React.FC<AllocationSettingsProps> = ({
  settings,
  costSummary,
  onSave,
  loading = false,
  className = '',
}) => {
  const [formData, setFormData] = useState<AllocationFormData>({
    metode: 'per_unit',
    nilai: DEFAULT_ALLOCATION_VALUES.PER_UNIT,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [materialCostExample, setMaterialCostExample] = useState(50000);

  // Initialize form data
  useEffect(() => {
    if (settings) {
      setFormData(transformAllocationToForm(settings));
    } else {
      setIsEditing(true); // Auto-edit mode if no settings exist
    }
  }, [settings]);

  // Handle input changes
  const handleInputChange = (field: keyof AllocationFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Handle method change
  const handleMethodChange = (method: 'per_unit' | 'persentase') => {
    const defaultValue = method === 'per_unit' 
      ? DEFAULT_ALLOCATION_VALUES.PER_UNIT 
      : DEFAULT_ALLOCATION_VALUES.PERSENTASE;

    setFormData({
      metode: method,
      nilai: defaultValue,
    });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateAllocationForm(formData);
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      setWarnings(validation.warnings);
      return;
    }

    setErrors({});
    setWarnings(validation.warnings);

    try {
      const success = await onSave(formData);
      if (success) {
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error saving allocation settings:', error);
    }
  };

  // Calculate overhead preview
  const calculateOverheadPreview = () => {
    const totalCosts = costSummary.total_biaya_aktif;
    
    if (formData.metode === 'per_unit' && formData.nilai > 0) {
      return totalCosts / formData.nilai;
    } else if (formData.metode === 'persentase') {
      return materialCostExample * (formData.nilai / 100);
    }
    
    return 0;
  };

  const overheadPreview = calculateOverheadPreview();
  const selectedMethod = METODE_ALOKASI_OPTIONS.find(opt => opt.value === formData.metode);

  return (
    <div className={`bg-white rounded-lg border ${className}`}>
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="p-2 bg-orange-50 rounded-full mr-3">
              <Cog className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Pengaturan Alokasi Biaya</h3>
              <p className="text-sm text-gray-500">
                Tentukan metode alokasi untuk menghitung overhead per unit produksi
              </p>
            </div>
          </div>
          
          {settings && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
            >
              Edit
            </button>
          )}
        </div>
      </div>

      <div className="p-6">
        {isEditing ? (
          /* Edit Form */
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Method Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Metode Alokasi <span className="text-red-500">*</span>
              </label>
              <div className="space-y-3">
                {METODE_ALOKASI_OPTIONS.map((option) => (
                  <div key={option.value} className="relative">
                    <label className="flex items-start cursor-pointer">
                      <input
                        type="radio"
                        name="metode"
                        value={option.value}
                        checked={formData.metode === option.value}
                        onChange={(e) => handleMethodChange(e.target.value as 'per_unit' | 'persentase')}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        disabled={loading}
                      />
                      <div className="ml-3 flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {option.label}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {option.description}
                        </div>
                        <div className="text-xs text-gray-400 mt-1 italic">
                          {option.example}
                        </div>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
              {errors.metode && (
                <p className="mt-1 text-sm text-red-600">{errors.metode}</p>
              )}
            </div>

            {/* Value Input */}
            <div>
              <label htmlFor="nilai" className="block text-sm font-medium text-gray-700 mb-1">
                {selectedMethod?.inputLabel} <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="nilai"
                value={formData.nilai || ''}
                onChange={(e) => handleInputChange('nilai', Number(e.target.value))}
                placeholder={selectedMethod?.inputPlaceholder}
                min="0.01"
                step={formData.metode === 'per_unit' ? '1' : '0.01'}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.nilai ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={loading}
              />
              {errors.nilai && (
                <p className="mt-1 text-sm text-red-600">{errors.nilai}</p>
              )}
            </div>

            {/* Material Cost Example for Percentage Method */}
            {formData.metode === 'persentase' && (
              <div className="p-4 bg-blue-50 rounded-md">
                <div className="flex items-start">
                  <InformationCircleIcon className="h-5 w-5 text-blue-400 mt-0.5 mr-2 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-blue-800 mb-2">
                      Contoh perhitungan dengan biaya material:
                    </p>
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-sm text-blue-700">Rp</span>
                      <input
                        type="number"
                        value={materialCostExample}
                        onChange={(e) => setMaterialCostExample(Number(e.target.value))}
                        className="w-32 px-2 py-1 text-sm border border-blue-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                        min="1000"
                        step="1000"
                      />
                      <span className="text-sm text-blue-700">per unit</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Warnings */}
            {warnings.length > 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="text-sm text-yellow-800">
                  <strong>Perhatian:</strong>
                  <ul className="mt-1 list-disc list-inside space-y-1">
                    {warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              {settings && (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  Batal
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading && (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                Simpan Pengaturan
              </button>
            </div>
          </form>
        ) : (
          /* Display Mode */
          <div className="space-y-6">
            {settings ? (
              <>
                {/* Current Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Metode Alokasi</h4>
                    <p className="text-lg font-semibold text-gray-900">
                      {METODE_ALOKASI_OPTIONS.find(opt => opt.value === settings.metode)?.label}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {METODE_ALOKASI_OPTIONS.find(opt => opt.value === settings.metode)?.description}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Nilai Basis</h4>
                    <p className="text-lg font-semibold text-gray-900">
                      {settings.metode === 'per_unit' 
                        ? `${settings.nilai.toLocaleString('id-ID')} unit/bulan`
                        : `${settings.nilai}%`
                      }
                    </p>
                  </div>
                </div>

                {/* Overhead Calculation Preview */}
                {costSummary.total_biaya_aktif > 0 && (
                  <div className="p-4 bg-gray-50 rounded-md">
                    <div className="flex items-center mb-3">
                      <Calculator className="h-5 w-5 text-gray-600 mr-2" />
                      <h4 className="text-sm font-medium text-gray-700">Perhitungan Overhead</h4>
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-2">
                      <div className="flex justify-between">
                        <span>Total Biaya Operasional:</span>
                        <span className="font-medium">{formatCurrency(costSummary.total_biaya_aktif)}</span>
                      </div>
                      
                      {settings.metode === 'per_unit' ? (
                        <>
                          <div className="flex justify-between">
                            <span>Estimasi Produksi:</span>
                            <span className="font-medium">{settings.nilai.toLocaleString('id-ID')} unit/bulan</span>
                          </div>
                          <div className="flex justify-between border-t pt-2 font-semibold text-gray-900">
                            <span>Overhead per Unit:</span>
                            <span>{formatCurrency(costSummary.total_biaya_aktif / settings.nilai)}</span>
                          </div>
                        </>
                      ) : (
                        <div className="text-xs text-gray-500 italic">
                          Overhead = {settings.nilai}% × Biaya Material per Unit
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* No Settings */
              <div className="text-center py-8">
                <Cog className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  Belum Ada Pengaturan Alokasi
                </h4>
                <p className="text-gray-500 mb-4">
                  Atur metode alokasi untuk menghitung overhead per unit produksi
                </p>
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Atur Sekarang
                </button>
              </div>
            )}
          </div>
        )}

        {/* Preview Calculation */}
        {isEditing && costSummary.total_biaya_aktif > 0 && formData.nilai > 0 && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center mb-2">
              <Calculator className="h-5 w-5 text-green-600 mr-2" />
              <h4 className="text-sm font-medium text-green-800">Preview Perhitungan</h4>
            </div>
            <div className="text-sm text-green-700">
              {formData.metode === 'per_unit' ? (
                <p>
                  Overhead per unit: <strong>{formatCurrency(overheadPreview)}</strong>
                  <br />
                  <span className="text-xs">
                    ({formatCurrency(costSummary.total_biaya_aktif)} ÷ {formData.nilai} unit)
                  </span>
                </p>
              ) : (
                <p>
                  Dengan biaya material {formatCurrency(materialCostExample)}/unit:
                  <br />
                  Overhead: <strong>{formatCurrency(overheadPreview)}</strong>
                  <br />
                  <span className="text-xs">
                    ({materialCostExample.toLocaleString('id-ID')} × {formData.nilai}%)
                  </span>
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllocationSettingsComponent;