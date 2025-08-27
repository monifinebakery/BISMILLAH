// 🎯 DiscountForm - Fixed className Issues
import React, { useState } from 'react';
import { Percent, Search, ChevronDown, X } from 'lucide-react';
import { toast } from 'sonner';

const DiscountForm = ({ onSubmit, isLoading, recipes = [] }: any) => {
  const [formData, setFormData] = useState({
    namaPromo: '',
    resep: '',
    tipeDiskon: 'persentase',
    nilaiDiskon: '',
    maksimalDiskon: '',
    minimalPembelian: '',
    tanggalMulai: '',
    tanggalSelesai: '',
    deskripsi: '',
    status: 'aktif'
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [showResep, setShowResep] = useState(false);

  // Safe array filtering
  const filteredRecipes = Array.isArray(recipes) ? recipes.filter(recipe =>
    recipe?.namaResep?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recipe?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  const handleSubmit = (e) => {
    e.preventDefault();
    
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

  const getRecipeById = (id) => Array.isArray(recipes) ? recipes.find(r => r?.id === id) : null;
  const selectedRecipe = getRecipeById(formData.resep);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value || 0);
  };

  const getRecipeProperty = (recipe, property) => {
    if (!recipe) return property === 'name' ? 'Unknown Recipe' : 0;
    
    const possibleNames = {
      hpp: ['hpp', 'hppPerPorsi', 'cost_per_portion'],
      harga: ['harga_jual', 'hargaJualPorsi', 'hargaJual', 'price', 'selling_price'],
      name: ['namaResep', 'name', 'recipe_name']
    };
    
    const names = possibleNames[property] || [property];
    
    for (const name of names) {
      if (recipe[name] !== undefined && recipe[name] !== null) {
        return recipe[name];
      }
    }
    
    return property === 'name' ? 'Unknown Recipe' : 0;
  };

  // Fixed className variables for consistency
  const inputClassName = "w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent";
  const inputWithIconClassName = "w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent";
  const selectClassName = "w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent";
  const labelClassName = "block text-sm font-medium text-gray-700 mb-2";

  const RecipeSelector = () => {
    return (
      <div className="relative">
        <label className={labelClassName}>
          Pilih Resep *
        </label>
        
        <button
          type="button"
          onClick={() => setShowResep(!showResep)}
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
              <span className="text-gray-500">Pilih resep untuk promo</span>
            )}
          </div>
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showResep ? 'rotate-180' : ''}`} />
        </button>

        {showResep && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
            <div className="p-3 border-b border-gray-300">
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

            <div className="max-h-48 overflow-y-auto">
              {filteredRecipes.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  Tidak ada resep ditemukan
                </div>
              ) : (
                filteredRecipes.map((recipe) => {
                  const hpp = getRecipeProperty(recipe, 'hpp');
                  const harga = getRecipeProperty(recipe, 'harga');
                  const margin = harga > 0 ? ((harga - hpp) / harga * 100) : 0;
                  
                  return (
                    <button
                      key={recipe.id}
                      type="button"
                      onClick={() => {
                        handleInputChange('resep', recipe.id);
                        setShowResep(false);
                        setSearchTerm('');
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-200 last:border-b-0 transition-colors"
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

        {formData.resep && (
          <button
            type="button"
            onClick={() => handleInputChange('resep', '')}
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClassName}>
            Nama Promo *
          </label>
          <input
            type="text"
            value={formData.namaPromo}
            onChange={(e) => handleInputChange('namaPromo', e.target.value)}
            placeholder="Misal: Diskon 20% Bakso Special"
            className={inputClassName}
            required
          />
        </div>

        <div>
          <label className={labelClassName}>
            Tipe Diskon
          </label>
          <select
            value={formData.tipeDiskon}
            onChange={(e) => handleInputChange('tipeDiskon', e.target.value)}
            className={selectClassName}
          >
            <option value="persentase">Persentase (%)</option>
            <option value="nominal">Nominal (Rp)</option>
          </select>
        </div>
      </div>

      <RecipeSelector />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClassName}>
            Nilai Diskon *
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              max={formData.tipeDiskon === 'persentase' ? 100 : undefined}
              step={formData.tipeDiskon === 'persentase' ? 0.1 : 1000}
              value={formData.nilaiDiskon}
              onChange={(e) => handleInputChange('nilaiDiskon', parseFloat(e.target.value) || '')}
              placeholder={formData.tipeDiskon === 'persentase' ? '20' : '5000'}
              className={inputWithIconClassName}
              required
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">
              {formData.tipeDiskon === 'persentase' ? '%' : 'Rp'}
            </div>
          </div>
        </div>

        {formData.tipeDiskon === 'persentase' && (
          <div>
            <label className={labelClassName}>
              Maksimal Diskon (Opsional)
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="1000"
                value={formData.maksimalDiskon}
                onChange={(e) => handleInputChange('maksimalDiskon', parseFloat(e.target.value) || '')}
                placeholder="50000"
                className={inputWithIconClassName}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">
                Rp
              </div>
            </div>
          </div>
        )}

        <div>
          <label className={labelClassName}>
            Minimal Pembelian (Opsional)
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              step="1000"
              value={formData.minimalPembelian}
              onChange={(e) => handleInputChange('minimalPembelian', parseFloat(e.target.value) || '')}
              placeholder="25000"
              className={inputWithIconClassName}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">
              Rp
            </div>
          </div>
        </div>
      </div>

      {selectedRecipe && formData.nilaiDiskon > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h5 className="font-medium text-blue-900 mb-2">Preview Perhitungan</h5>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-blue-700">Harga Normal:</p>
              <p className="font-semibold text-blue-900">
                {formatCurrency(getRecipeProperty(selectedRecipe, 'harga'))}
              </p>
            </div>
            <div>
              <p className="text-blue-700">Setelah Diskon:</p>
              <p className="font-semibold text-blue-900">
                {(() => {
                  const harga = getRecipeProperty(selectedRecipe, 'harga');
                  let discountAmount = 0;
                  if (formData.tipeDiskon === 'persentase') {
                    discountAmount = (harga * formData.nilaiDiskon) / 100;
                    if (formData.maksimalDiskon && discountAmount > formData.maksimalDiskon) {
                      discountAmount = formData.maksimalDiskon;
                    }
                  } else {
                    discountAmount = formData.nilaiDiskon;
                  }
                  const finalPrice = Math.max(0, harga - discountAmount);
                  return formatCurrency(finalPrice);
                })()}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClassName}>
            Tanggal Mulai
          </label>
          <input
            type="date"
            value={formData.tanggalMulai}
            onChange={(e) => handleInputChange('tanggalMulai', e.target.value)}
            className={inputClassName}
          />
        </div>

        <div>
          <label className={labelClassName}>
            Tanggal Selesai
          </label>
          <input
            type="date"
            value={formData.tanggalSelesai}
            onChange={(e) => handleInputChange('tanggalSelesai', e.target.value)}
            className={inputClassName}
          />
        </div>
      </div>

      <div>
        <label className={labelClassName}>
          Deskripsi Promo
        </label>
        <textarea
          value={formData.deskripsi}
          onChange={(e) => handleInputChange('deskripsi', e.target.value)}
          placeholder="Deskripsi detail promo diskon..."
          rows={3}
          className={inputClassName}
        />
      </div>

      <div>
        <label className={labelClassName}>
          Status
        </label>
        <select
          value={formData.status}
          onChange={(e) => handleInputChange('status', e.target.value)}
          className={selectClassName}
        >
          <option value="aktif">Aktif</option>
          <option value="nonaktif">Non-aktif</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-4 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span>Menghitung...</span>
          </>
        ) : (
          <>
            <Percent className="h-5 w-5" />
            <span>Hitung Diskon</span>
          </>
        )}
      </button>
    </form>
  );
};

export default DiscountForm;