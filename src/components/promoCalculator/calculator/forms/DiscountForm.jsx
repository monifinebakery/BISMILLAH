// 🎯 Form untuk Diskon

import React, { useState } from 'react';
import { Percent, Search } from 'lucide-react';
import { toast } from 'sonner';

const DiscountForm = ({ onSubmit, isLoading, recipes }) => {
  const [formData, setFormData] = useState({
    namaPromo: '',
    resep: '',
    tipeDiskon: 'persentase', // 'persentase' atau 'nominal'
    nilaiDiskon: '',
    maksimalDiskon: '', // Untuk diskon persentase
    minimalPembelian: '',
    tanggalMulai: '',
    tanggalSelesai: '',
    deskripsi: '',
    status: 'aktif'
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [showResep, setShowResep] = useState(false);

  const filteredRecipes = recipes.filter(recipe =>
    recipe.namaResep.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.namaPromo.trim()) {
      toast.error('Nama promo wajib diisi');
      return;
    }
    if (!formData.resep) {
      toast.error('Resep wajib dipilih');
      return;
    }
    if (!formData.nilaiDiskon || formData.nilaiDiskon <= 0) {
      toast.error('Nilai diskon harus lebih dari 0');
      return;
    }
    if (formData.tipeDiskon === 'persentase' && formData.nilaiDiskon > 100) {
      toast.error('Diskon persentase tidak boleh lebih dari 100%');
      return;
    }

    onSubmit(formData);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getRecipeById = (id) => recipes.find(r => r.id === id);
  const selectedRecipe = getRecipeById(formData.resep);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nama Promo *
          </label>
          <input
            type="text"
            value={formData.namaPromo}
            onChange={(e) => handleInputChange('namaPromo', e.target.value)}
            placeholder="Misal: Diskon 20% Bakso Special"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipe Diskon
          </label>
          <select
            value={formData.tipeDiskon}
            onChange={(e) => handleInputChange('tipeDiskon', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="persentase">Persentase (%)</option>
            <option value="nominal">Nominal (Rp)</option>
          </select>
        </div>
      </div>

      {/* Recipe Selection */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Pilih Resep *
        </label>
        <button
          type="button"
          onClick={() => setShowResep(!showResep)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-left focus:ring-2 focus:ring-orange-500 focus:border-transparent flex items-center justify-between"
        >
          <span className={!formData.resep ? 'text-gray-400' : 'text-gray-900'}>
            {formData.resep 
              ? selectedRecipe?.namaResep 
              : 'Pilih resep untuk promo'
            }
          </span>
          <Search className="h-4 w-4 text-gray-400" />
        </button>

        {showResep && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            <div className="p-2">
              <input
                type="text"
                placeholder="Cari resep..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
              />
            </div>
            {filteredRecipes.map(recipe => (
              <button
                key={recipe.id}
                type="button"
                onClick={() => {
                  handleInputChange('resep', recipe.id);
                  setShowResep(false);
                  setSearchTerm('');
                }}
                className="w-full px-3 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
              >
                <div className="font-medium text-gray-900">{recipe.namaResep}</div>
                <div className="text-sm text-gray-500 flex justify-between">
                  <span>HPP: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(recipe.hppPerPorsi)}</span>
                  <span>Harga: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(recipe.hargaJualPorsi)}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Discount Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nilai Diskon *
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              max={formData.tipeDiskon === 'persentase' ? 100 : undefined}
              step={formData.tipeDiskon === 'persentase' ? 0.1 : 1000}
              value={formData.nilaiDiskon}
              onChange={(e) => handleInputChange('nilaiDiskon', parseFloat(e.target.value))}
              placeholder={formData.tipeDiskon === 'persentase' ? '20' : '5000'}
              className="w-full px-3 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              required
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">
              {formData.tipeDiskon === 'persentase' ? '%' : 'Rp'}
            </div>
          </div>
        </div>

        {formData.tipeDiskon === 'persentase' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Maksimal Diskon (Opsional)
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="1000"
                value={formData.maksimalDiskon}
                onChange={(e) => handleInputChange('maksimalDiskon', parseFloat(e.target.value))}
                placeholder="50000"
                className="w-full px-3 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">
                Rp
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Minimal Pembelian (Opsional)
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              step="1000"
              value={formData.minimalPembelian}
              onChange={(e) => handleInputChange('minimalPembelian', parseFloat(e.target.value))}
              placeholder="25000"
              className="w-full px-3 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">
              Rp
            </div>
          </div>
        </div>
      </div>

      {/* Preview Calculation */}
      {selectedRecipe && formData.nilaiDiskon > 0 && (
        <div className="bg-blue-50 rounded-lg p-4">
          <h5 className="font-medium text-blue-900 mb-2">Preview Perhitungan</h5>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-blue-700">Harga Normal:</p>
              <p className="font-semibold text-blue-900">
                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(selectedRecipe.hargaJualPorsi)}
              </p>
            </div>
            <div>
              <p className="text-blue-700">Setelah Diskon:</p>
              <p className="font-semibold text-blue-900">
                {(() => {
                  let discountAmount = 0;
                  if (formData.tipeDiskon === 'persentase') {
                    discountAmount = (selectedRecipe.hargaJualPorsi * formData.nilaiDiskon) / 100;
                    if (formData.maksimalDiskon && discountAmount > formData.maksimalDiskon) {
                      discountAmount = formData.maksimalDiskon;
                    }
                  } else {
                    discountAmount = formData.nilaiDiskon;
                  }
                  const finalPrice = Math.max(0, selectedRecipe.hargaJualPorsi - discountAmount);
                  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(finalPrice);
                })()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Date Range */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tanggal Mulai
          </label>
          <input
            type="date"
            value={formData.tanggalMulai}
            onChange={(e) => handleInputChange('tanggalMulai', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tanggal Selesai
          </label>
          <input
            type="date"
            value={formData.tanggalSelesai}
            onChange={(e) => handleInputChange('tanggalSelesai', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Deskripsi Promo
        </label>
        <textarea
          value={formData.deskripsi}
          onChange={(e) => handleInputChange('deskripsi', e.target.value)}
          placeholder="Deskripsi detail promo diskon..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
      </div>

      {/* Status */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Status
        </label>
        <select
          value={formData.status}
          onChange={(e) => handleInputChange('status', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        >
          <option value="aktif">Aktif</option>
          <option value="nonaktif">Non-aktif</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Menghitung...</span>
          </>
        ) : (
          <>
            <Percent className="h-4 w-4" />
            <span>Hitung Diskon</span>
          </>
        )}
      </button>
    </form>
  );
};

export default DiscountForm;