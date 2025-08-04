// 🎯 Form untuk BOGO (Buy One Get One) - Fixed with Proper Recipe Properties

import React, { useState } from 'react';
import { Gift, Search, ChevronDown, X } from 'lucide-react';
import { toast } from 'sonner';

const BogoForm = ({ onSubmit, isLoading, recipes }) => {
  const [formData, setFormData] = useState({
    namaPromo: '',
    resepUtama: '',
    resepGratis: '',
    minimalQty: 1,
    tanggalMulai: '',
    tanggalSelesai: '',
    deskripsi: '',
    status: 'aktif'
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [showResepUtama, setShowResepUtama] = useState(false);
  const [showResepGratis, setShowResepGratis] = useState(false);

  const filteredRecipes = recipes.filter(recipe => {
    const name = getRecipeProperty(recipe, 'name');
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.namaPromo.trim()) {
      toast.error('Nama promo wajib diisi');
      return;
    }
    if (!formData.resepUtama) {
      toast.error('Resep utama wajib dipilih');
      return;
    }
    if (!formData.resepGratis) {
      toast.error('Resep gratis wajib dipilih');
      return;
    }
    if (formData.resepUtama === formData.resepGratis) {
      toast.error('Resep utama dan gratis tidak boleh sama');
      return;
    }

    onSubmit(formData);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Helper function to get the correct property value
  const getRecipeProperty = (recipe, property) => {
    if (!recipe) return property === 'name' ? 'Unknown Recipe' : 0;
    
    const possibleNames = {
      hpp: ['hpp', 'hppPerPorsi', 'cost_per_portion', 'hpp_per_porsi'],
      harga: ['harga_jual', 'hargaJualPorsi', 'hargaJual', 'price', 'selling_price', 'harga_jual_porsi'],
      name: ['namaResep', 'name', 'recipe_name', 'nama_resep']
    };
    
    const names = possibleNames[property] || [property];
    
    for (const name of names) {
      if (recipe[name] !== undefined && recipe[name] !== null) {
        return recipe[name];
      }
    }
    
    return property === 'name' ? 'Unknown Recipe' : 0;
  };

  const getRecipeById = (id) => recipes.find(r => r.id === id);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value || 0);
  };

  const RecipeSelector = ({ 
    label, 
    value, 
    onChange, 
    showDropdown, 
    setShowDropdown, 
    placeholder,
    excludeId = null 
  }) => {
    const selectedRecipe = getRecipeById(value);

    return (
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} *
        </label>
        
        <button
          type="button"
          onClick={() => setShowDropdown(!showDropdown)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-left focus:ring-2 focus:ring-orange-500 focus:border-transparent flex items-center justify-between"
        >
          <div className="flex-1">
            {selectedRecipe ? (
              <div>
                <div className="font-medium text-gray-900">
                  {getRecipeProperty(selectedRecipe, 'name')}
                </div>
                <div className="text-sm text-gray-500">
                  HPP: {formatCurrency(getRecipeProperty(selectedRecipe, 'hpp'))} • 
                  Harga: {formatCurrency(getRecipeProperty(selectedRecipe, 'harga'))}
                </div>
              </div>
            ) : (
              <span className="text-gray-500">{placeholder}</span>
            )}
          </div>
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${
            showDropdown ? 'rotate-180' : ''
          }`} />
        </button>

        {showDropdown && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
            {/* Search */}
            <div className="p-3 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari resep..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Recipe List */}
            <div className="max-h-48 overflow-y-auto">
              {filteredRecipes.filter(r => r.id !== excludeId).length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  Tidak ada resep ditemukan
                </div>
              ) : (
                filteredRecipes.filter(r => r.id !== excludeId).map((recipe) => {
                  const hpp = getRecipeProperty(recipe, 'hpp');
                  const harga = getRecipeProperty(recipe, 'harga');
                  const margin = harga > 0 ? ((harga - hpp) / harga * 100) : 0;
                  
                  return (
                    <button
                      key={recipe.id}
                      type="button"
                      onClick={() => {
                        onChange(recipe.id);
                        setShowDropdown(false);
                        setSearchTerm('');
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                    >
                      <div className="font-medium text-gray-900">
                        {getRecipeProperty(recipe, 'name')}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        HPP: {formatCurrency(hpp)} • 
                        Harga: {formatCurrency(harga)} • 
                        Margin: {margin.toFixed(1)}%
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Clear button */}
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-8 right-10 p-1 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Nama Promo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nama Promo *
        </label>
        <input
          type="text"
          value={formData.namaPromo}
          onChange={(e) => handleInputChange('namaPromo', e.target.value)}
          placeholder="Misal: BOGO Bakso Special"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          required
        />
      </div>

      {/* Recipe Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RecipeSelector
          label="Resep Utama (Dibeli)"
          value={formData.resepUtama}
          onChange={(id) => handleInputChange('resepUtama', id)}
          showDropdown={showResepUtama}
          setShowDropdown={setShowResepUtama}
          placeholder="Pilih resep yang dibeli"
          excludeId={formData.resepGratis}
        />

        <RecipeSelector
          label="Resep Gratis"
          value={formData.resepGratis}
          onChange={(id) => handleInputChange('resepGratis', id)}
          showDropdown={showResepGratis}
          setShowDropdown={setShowResepGratis}
          placeholder="Pilih resep gratis"
          excludeId={formData.resepUtama}
        />
      </div>

      {/* BOGO Preview */}
      {formData.resepUtama && formData.resepGratis && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-800 mb-3">Preview BOGO:</h4>
          <div className="text-sm text-green-700">
            <div className="flex items-center justify-between mb-2">
              <span>Beli: {getRecipeProperty(getRecipeById(formData.resepUtama), 'name')}</span>
              <span className="font-medium">
                {formatCurrency(getRecipeProperty(getRecipeById(formData.resepUtama), 'harga'))}
              </span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span>Gratis: {getRecipeProperty(getRecipeById(formData.resepGratis), 'name')}</span>
              <span className="font-medium line-through text-gray-500">
                {formatCurrency(getRecipeProperty(getRecipeById(formData.resepGratis), 'harga'))}
              </span>
            </div>
            <div className="border-t border-green-300 pt-2 mt-2">
              <div className="flex items-center justify-between font-semibold">
                <span>Total Customer Bayar:</span>
                <span>{formatCurrency(getRecipeProperty(getRecipeById(formData.resepUtama), 'harga'))}</span>
              </div>
              <div className="flex items-center justify-between text-xs mt-1">
                <span>Hemat:</span>
                <span>{formatCurrency(getRecipeProperty(getRecipeById(formData.resepGratis), 'harga'))}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Minimal Quantity */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Minimal Pembelian
        </label>
        <input
          type="number"
          min="1"
          value={formData.minimalQty}
          onChange={(e) => handleInputChange('minimalQty', parseInt(e.target.value) || 1)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">
          Jumlah minimum resep utama yang harus dibeli untuk mendapat gratis
        </p>
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tanggal Mulai
          </label>
          <input
            type="date"
            value={formData.tanggalMulai}
            onChange={(e) => handleInputChange('tanggalMulai', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tanggal Selesai
          </label>
          <input
            type="date"
            value={formData.tanggalSelesai}
            onChange={(e) => handleInputChange('tanggalSelesai', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Deskripsi Promo
        </label>
        <textarea
          value={formData.deskripsi}
          onChange={(e) => handleInputChange('deskripsi', e.target.value)}
          placeholder="Deskripsi detail promo BOGO..."
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
      </div>

      {/* Status */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Status
        </label>
        <select
          value={formData.status}
          onChange={(e) => handleInputChange('status', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
        className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-4 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span>Menghitung...</span>
          </>
        ) : (
          <>
            <Gift className="h-5 w-5" />
            <span>Hitung BOGO</span>
          </>
        )}
      </button>
    </form>
  );
};

export default BogoForm;