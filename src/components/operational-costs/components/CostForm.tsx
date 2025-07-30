// src/components/operational-costs/components/CostForm.tsx

import React, { useState, useEffect } from 'react';
import { CostFormData, OperationalCost } from '../types';
import { validateCostForm, sanitizeCostForm } from '../utils/costValidation';
import { transformCostToForm } from '../utils/costTransformers';
import { JENIS_BIAYA_OPTIONS, STATUS_BIAYA_OPTIONS, DEFAULT_COST_NAMES } from '../constants/costCategories';
import { formatCurrency } from '../utils/costHelpers';

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

  // Initialize form data
  useEffect(() => {
    if (initialData) {
      setFormData(transformCostToForm(initialData));
    }
  }, [initialData]);

  // Handle input changes
  const handleInputChange = (field: keyof CostFormData, value: any) => {
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
      }
    } catch (error) {
      console.error('Error submitting form:', error);
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
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
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
            placeholder="0"
            min="0"
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
  );
};

export default CostForm;