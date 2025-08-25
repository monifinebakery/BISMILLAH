// src/components/operational-costs/components/CostForm.tsx

import React, { useState, useEffect } from 'react';
import { CostFormData, OperationalCost } from '../types';
import { validateCostForm, sanitizeCostForm } from '../utils/costValidation';
import { transformCostToForm } from '../utils/costTransformers';
import { JENIS_BIAYA_OPTIONS, STATUS_BIAYA_OPTIONS, DEFAULT_COST_NAMES } from '../constants/costCategories';
import { formatCurrency } from '../utils/costHelpers';
import { logger } from '@/utils/logger';

interface CostFormProps {
  initialData?: OperationalCost;
  onSubmit: (data: CostFormData) => Promise<boolean>;
  onCancel?: () => void;
  loading?: boolean;
  className?: string;
}

const CostForm: React.FC<CostFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
  className = '',
}) => {
  const [formData, setFormData] = useState<CostFormData>({
    nama_biaya: '',
    jumlah_per_bulan: 0,
    jenis: 'tetap',
    status: 'aktif',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [warnings, setWarnings] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // ✅ NEW: State for staff type selection
  const [showStaffTypeModal, setShowStaffTypeModal] = useState(false);
  const [isProductionStaff, setIsProductionStaff] = useState<boolean | null>(null);

  // Initialize form data
  useEffect(() => {
    if (initialData) {
      setFormData(transformCostToForm(initialData));
    }
  }, [initialData]);

  // ✅ Check if cost name is salary-related
  const isSalaryRelated = (costName: string): boolean => {
    const salaryKeywords = [
      'gaji', 'salary', 'upah', 'honor', 'honorarium', 
      'tunjangan', 'insentif', 'bonus', 'karyawan', 
      'pegawai', 'staff', 'pekerja', 'tenaga kerja'
    ];
    
    return salaryKeywords.some(keyword => 
      costName.toLowerCase().includes(keyword.toLowerCase())
    );
  };

  // Handle input changes
  const handleInputChange = (field: keyof CostFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // ✅ Check if this is a salary-related cost name
    if (field === 'nama_biaya' && isSalaryRelated(value) && !initialData) {
      setShowStaffTypeModal(true);
      setIsProductionStaff(null);
    }

    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // ✅ Handle staff type selection
  const handleStaffTypeSelection = (isProduction: boolean) => {
    setIsProductionStaff(isProduction);
    setShowStaffTypeModal(false);
    
    // Add warning/info based on selection
    if (isProduction) {
      setWarnings(prev => [
        ...prev.filter(w => !w.includes('staf produksi')),
        '💡 Gaji staf produksi ini akan digunakan dalam kalkulasi HPP resep sebagai biaya tenaga kerja langsung.'
      ]);
    } else {
      setWarnings(prev => [
        ...prev.filter(w => !w.includes('staf produksi')),
        'ℹ️ Gaji staf non-produksi ini hanya akan masuk ke overhead costs, tidak langsung ke HPP resep.'
      ]);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Sanitize and validate form data
    const sanitizedData = sanitizeCostForm(formData);
    const validation = validateCostForm(sanitizedData);
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      setWarnings(validation.warnings);
      return;
    }

    setErrors({});
    setWarnings(validation.warnings);

    try {
      const success = await onSubmit(sanitizedData);
      if (success && !initialData) {
        // Reset form for new entries
        setFormData({
          nama_biaya: '',
          jumlah_per_bulan: 0,
          jenis: 'tetap',
          status: 'aktif',
        });
        setWarnings([]);
        setIsProductionStaff(null);
      }
    } catch (error) {
      logger.error('Error submitting form:', error);
    }
  };

  // Handle cost name suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    handleInputChange('nama_biaya', suggestion);
    setShowSuggestions(false);
  };

  // Filter suggestions based on current input
  const filteredSuggestions = DEFAULT_COST_NAMES.filter(name =>
    name.toLowerCase().includes(formData.nama_biaya.toLowerCase()) &&
    name !== formData.nama_biaya
  ).slice(0, 5);

  const isEditing = !!initialData;

  return (
    <>
      <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
        {/* Nama Biaya */}
        <div className="relative">
          <label htmlFor="nama_biaya" className="block text-sm font-medium text-gray-700 mb-1">
            Nama Biaya <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="nama_biaya"
            value={formData.nama_biaya}
            onChange={(e) => handleInputChange('nama_biaya', e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="Contoh: Gaji Karyawan, Listrik Pabrik"
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.nama_biaya ? 'border-red-300' : 'border-gray-300'
            }`}
            disabled={loading}
          />
          
          {/* Suggestions dropdown */}
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md max-h-48 overflow-y-auto">
              <div className="p-2 text-xs text-gray-500 border-b">Saran nama biaya:</div>
              {filteredSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
          
          {errors.nama_biaya && (
            <p className="mt-1 text-sm text-red-600">{errors.nama_biaya}</p>
          )}
        </div>

        {/* ✅ Staff Type Indicator */}
        {isSalaryRelated(formData.nama_biaya) && isProductionStaff !== null && (
          <div className={`p-3 rounded-md border ${
            isProductionStaff 
              ? 'bg-green-50 border-green-200' 
              : 'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex items-center gap-2">
              {isProductionStaff ? (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-green-800">Staf Produksi</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium text-blue-800">Staf Non-Produksi</span>
                </>
              )}
              <button
                type="button"
                onClick={() => setShowStaffTypeModal(true)}
                className="text-xs text-gray-500 hover:text-gray-700 underline ml-auto"
              >
                Ubah
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {isProductionStaff 
                ? 'Akan digunakan dalam kalkulasi HPP resep sebagai biaya tenaga kerja langsung'
                : 'Hanya masuk ke overhead costs, tidak langsung ke HPP resep'
              }
            </p>
          </div>
        )}

        {/* Jumlah per Bulan */}
        <div>
          <label htmlFor="jumlah_per_bulan" className="block text-sm font-medium text-gray-700 mb-1">
            Jumlah per Bulan <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              Rp
            </span>
            <input
              type="number"
              id="jumlah_per_bulan"
              value={formData.jumlah_per_bulan || ''}
              onChange={(e) => handleInputChange('jumlah_per_bulan', Number(e.target.value))}
              placeholder="1000"
              min="1000"
              step="1000"
              className={`w-full pl-10 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.jumlah_per_bulan ? 'border-red-300' : 'border-gray-300'
              }`}
              disabled={loading}
            />
          </div>
          
          {/* Preview formatted amount */}
          {formData.jumlah_per_bulan > 0 && (
            <p className="mt-1 text-sm text-gray-500">
              {formatCurrency(formData.jumlah_per_bulan)} per bulan
            </p>
          )}
          
          {errors.jumlah_per_bulan && (
            <p className="mt-1 text-sm text-red-600">{errors.jumlah_per_bulan}</p>
          )}
        </div>

        {/* Jenis dan Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Jenis Biaya */}
          <div>
            <label htmlFor="jenis" className="block text-sm font-medium text-gray-700 mb-1">
              Jenis Biaya <span className="text-red-500">*</span>
            </label>
            <select
              id="jenis"
              value={formData.jenis}
              onChange={(e) => handleInputChange('jenis', e.target.value as 'tetap' | 'variabel')}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.jenis ? 'border-red-300' : 'border-gray-300'
              }`}
              disabled={loading}
            >
              {JENIS_BIAYA_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            
            {/* Jenis description */}
            <p className="mt-1 text-xs text-gray-500">
              {JENIS_BIAYA_OPTIONS.find(opt => opt.value === formData.jenis)?.description}
            </p>
            
            {errors.jenis && (
              <p className="mt-1 text-sm text-red-600">{errors.jenis}</p>
            )}
          </div>

          {/* Status */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value as 'aktif' | 'nonaktif')}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.status ? 'border-red-300' : 'border-gray-300'
              }`}
              disabled={loading}
            >
              {STATUS_BIAYA_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            
            {errors.status && (
              <p className="mt-1 text-sm text-red-600">{errors.status}</p>
            )}
          </div>
        </div>

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
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
            {isEditing ? 'Perbarui Biaya' : 'Simpan Biaya'}
          </button>
        </div>
      </form>

      {/* ✅ Staff Type Selection Modal */}
      {showStaffTypeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg border max-w-md w-full p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Jenis Staf untuk "{formData.nama_biaya}"
              </h3>
              <p className="text-sm text-gray-600">
                Pilih jenis staf untuk membantu sistem menghitung biaya dengan tepat.
              </p>
            </div>

            <div className="space-y-3 mb-6">
              {/* Production Staff Option */}
              <button
                type="button"
                onClick={() => handleStaffTypeSelection(true)}
                className="w-full text-left p-4 border-2 border-green-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium text-green-900">Staf Produksi</h4>
                    <p className="text-sm text-green-700 mt-1">
                      Koki, staf dapur, atau pekerja yang terlibat langsung dalam membuat produk makanan/minuman.
                    </p>
                    <p className="text-xs text-green-600 mt-2 font-medium">
                      ✅ Akan digunakan dalam kalkulasi HPP resep
                    </p>
                  </div>
                </div>
              </button>

              {/* Non-Production Staff Option */}
              <button
                type="button"
                onClick={() => handleStaffTypeSelection(false)}
                className="w-full text-left p-4 border-2 border-blue-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-900">Staf Non-Produksi</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Admin, kasir, marketing, cleaning service, atau staf yang tidak ikut proses produksi.
                    </p>
                    <p className="text-xs text-blue-600 mt-2 font-medium">
                      ℹ️ Hanya masuk ke overhead costs
                    </p>
                  </div>
                </div>
              </button>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowStaffTypeModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CostForm;
