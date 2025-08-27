// src/components/operational-costs/components/AllocationSettings.tsx

import React, { useState, useEffect } from 'react';
import { Settings, Calculator, Info } from 'lucide-react';
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
  const [isEditing, setIsEditing] = useState(!settings);

  // Initialize form data
  useEffect(() => {
    if (settings) {
      setFormData(transformAllocationToForm(settings));
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  }, [settings]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateAllocationForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    const success = await onSave(formData);
    if (success) setIsEditing(false);
  };

  const selectedMethod = METODE_ALOKASI_OPTIONS.find(opt => opt.value === formData.metode);

  return (
    <div className={`bg-white rounded-lg border ${className}`}>
      {/* Header */}
      <div className="p-6 border-b flex items-center justify-between">
        <div className="flex items-center">
          <div className="p-2 bg-orange-50 rounded-full mr-3">
            <Settings className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Pengaturan Alokasi Biaya</h3>
            <p className="text-sm text-gray-500">Tentukan metode alokasi overhead</p>
          </div>
        </div>
        
        {settings && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            Edit
          </button>
        )}
      </div>

      <div className="p-6">
        {isEditing ? (
          /* Form */
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Method Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Metode Alokasi <span className="text-red-500">*</span>
              </label>
              <div className="space-y-3">
                {METODE_ALOKASI_OPTIONS.map((option) => (
                  <label key={option.value} className="flex items-start cursor-pointer">
                    <input
                      type="radio"
                      name="metode"
                      value={option.value}
                      checked={formData.metode === option.value}
                      onChange={(e) => setFormData({
                        metode: e.target.value as 'per_unit' | 'persentase',
                        nilai: e.target.value === 'per_unit' 
                          ? DEFAULT_ALLOCATION_VALUES.PER_UNIT 
                          : DEFAULT_ALLOCATION_VALUES.PERSENTASE
                      })}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-500"
                      disabled={loading}
                    />
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">{option.label}</div>
                      <div className="text-sm text-gray-500">{option.description}</div>
                    </div>
                  </label>
                ))}
              </div>
              {errors.metode && <p className="mt-1 text-sm text-red-600">{errors.metode}</p>}
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
                onChange={(e) => setFormData(prev => ({ ...prev, nilai: Number(e.target.value) }))}
                placeholder={selectedMethod?.inputPlaceholder}
                min={formData.metode === 'per_unit' ? '1' : '0.01'}
                step={formData.metode === 'per_unit' ? '1' : '0.01'}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${
                  errors.nilai ? 'border-red-300' : 'border-gray-500'
                }`}
                disabled={loading}
              />
              {errors.nilai && <p className="mt-1 text-sm text-red-600">{errors.nilai}</p>}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              {settings && (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setErrors({});
                    if (settings) setFormData(transformAllocationToForm(settings));
                  }}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-500 rounded-md hover:bg-gray-50"
                >
                  Batal
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Menyimpan...' : 'Simpan Pengaturan'}
              </button>
            </div>
          </form>
        ) : (
          /* Display */
          <div className="space-y-6">
            {settings ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Metode Alokasi</h4>
                    <p className="text-lg font-semibold text-gray-900">
                      {METODE_ALOKASI_OPTIONS.find(opt => opt.value === settings.metode)?.label}
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

                {/* Overhead Preview */}
                {costSummary.total_biaya_aktif > 0 && (
                  <div className="p-4 bg-gray-50 rounded-md">
                    <div className="flex items-center mb-3">
                      <Calculator className="h-5 w-5 text-gray-600 mr-2" />
                      <h4 className="text-sm font-medium text-gray-700">Perhitungan Overhead</h4>
                    </div>
                    <div className="text-sm text-gray-600 space-y-2">
                      <div className="flex justify-between">
                        <span>Total Biaya:</span>
                        <span className="font-medium">{formatCurrency(costSummary.total_biaya_aktif)}</span>
                      </div>
                      {settings.metode === 'per_unit' && (
                        <div className="flex justify-between border-t pt-2 font-semibold text-gray-900">
                          <span>Overhead per Unit:</span>
                          <span>{formatCurrency(costSummary.total_biaya_aktif / settings.nilai)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <Settings className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Pengaturan</h4>
                <p className="text-gray-500 mb-4">Atur metode alokasi biaya</p>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Atur Sekarang
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AllocationSettingsComponent;