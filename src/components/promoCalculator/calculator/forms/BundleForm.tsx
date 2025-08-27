// 🎯 Form untuk Bundle Produk - Fixed with Proper Recipe Properties

import React, { useState } from 'react';
import { Package, Plus, X, Search } from 'lucide-react';
import { toast } from 'sonner';

const BundleForm = ({ onSubmit, isLoading, recipes }: any) => {
  const [formData, setFormData] = useState({
    namaPromo: '',
    resepBundle: [], // Array of {resepId, quantity}
    hargaBundle: '',
    tanggalMulai: '',
    tanggalSelesai: '',
    deskripsi: '',
    status: 'aktif'
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [showResep, setShowResep] = useState(false);

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

  const filteredRecipes = recipes.filter(recipe => {
    const name = getRecipeProperty(recipe, 'name');
    return name.toLowerCase().includes(searchTerm.toLowerCase()) &&
           !formData.resepBundle.some(item => item.resepId === recipe.id);
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.namaPromo.trim()) {
      toast.error('Nama promo wajib diisi');
      return;
    }
    if (formData.resepBundle.length < 2) {
      toast.error('Bundle minimal harus memiliki 2 resep');
      return;
    }
    if (!formData.hargaBundle || formData.hargaBundle <= 0) {
      toast.error('Harga bundle harus lebih dari 0');
      return;
    }

    onSubmit(formData);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addResepToBundle = (resepId) => {
    setFormData(prev => ({
      ...prev,
      resepBundle: [...prev.resepBundle, { resepId, quantity: 1 }]
    }));
    setShowResep(false);
    setSearchTerm('');
  };

  const removeResepFromBundle = (index) => {
    setFormData(prev => ({
      ...prev,
      resepBundle: prev.resepBundle.filter((_, i) => i !== index)
    }));
  };

  const updateResepQuantity = (index, quantity) => {
    if (quantity < 1) return;
    setFormData(prev => ({
      ...prev,
      resepBundle: prev.resepBundle.map((item, i) => 
        i === index ? { ...item, quantity } : item
      )
    }));
  };

  const getRecipeById = (id) => recipes.find(r => r.id === id);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value || 0);
  };

  // Calculate bundle statistics
  const bundleStats = (() => {
    const totalHPP = formData.resepBundle.reduce((sum, item) => {
      const recipe = getRecipeById(item.resepId);
      const hpp = getRecipeProperty(recipe, 'hpp');
      return sum + (hpp * item.quantity);
    }, 0);

    const totalNormalPrice = formData.resepBundle.reduce((sum, item) => {
      const recipe = getRecipeById(item.resepId);
      const harga = getRecipeProperty(recipe, 'harga');
      return sum + (harga * item.quantity);
    }, 0);

    const bundlePrice = parseFloat(formData.hargaBundle) || 0;
    const savings = totalNormalPrice - bundlePrice;
    const savingsPercent = totalNormalPrice > 0 ? (savings / totalNormalPrice) * 100 : 0;
    const profit = bundlePrice - totalHPP;
    const profitPercent = bundlePrice > 0 ? (profit / bundlePrice) * 100 : 0;

    return {
      totalHPP,
      totalNormalPrice,
      bundlePrice,
      savings,
      savingsPercent,
      profit,
      profitPercent
    };
  })();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nama Bundle *
          </label>
          <input
            type="text"
            value={formData.namaPromo}
            onChange={(e) => handleInputChange('namaPromo', e.target.value)}
            placeholder="Misal: Paket Hemat Nasi + Minuman"
            className="w-full px-4 py-3 border border-gray-500 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Harga Bundle *
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              step="1000"
              value={formData.hargaBundle}
              onChange={(e) => handleInputChange('hargaBundle', e.target.value)}
              placeholder="35000"
              className="w-full px-4 py-3 pr-12 border border-gray-500 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              required
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">
              Rp
            </div>
          </div>
        </div>
      </div>

      {/* Bundle Items */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Produk dalam Bundle *
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowResep(!showResep)}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm flex items-center space-x-2 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Produk</span>
            </button>

            {showResep && (
              <div className="absolute right-0 z-10 w-80 mt-1 bg-white border border-gray-500 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                <div className="p-3 border-b border-gray-500">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Cari resep..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-500 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {filteredRecipes.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      Tidak ada resep yang tersedia
                    </div>
                  ) : (
                    filteredRecipes.map(recipe => (
                      <button
                        key={recipe.id}
                        type="button"
                        onClick={() => addResepToBundle(recipe.id)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-400 last:border-b-0 transition-colors"
                      >
                        <div className="font-medium text-gray-900">
                          {getRecipeProperty(recipe, 'name')}
                        </div>
                        <div className="text-sm text-gray-500 flex justify-between mt-1">
                          <span>HPP: {formatCurrency(getRecipeProperty(recipe, 'hpp'))}</span>
                          <span>Harga: {formatCurrency(getRecipeProperty(recipe, 'harga'))}</span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bundle Items List */}
        <div className="space-y-3">
          {formData.resepBundle.map((item, index) => {
            const recipe = getRecipeById(item.resepId);
            if (!recipe) return null;

            const hpp = getRecipeProperty(recipe, 'hpp');
            const harga = getRecipeProperty(recipe, 'harga');
            const name = getRecipeProperty(recipe, 'name');

            return (
              <div key={index} className="bg-gray-50 rounded-lg p-4 flex items-center justify-between border border-gray-500">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{name}</h4>
                  <div className="text-sm text-gray-500 grid grid-cols-2 gap-4 mt-1">
                    <span>HPP: {formatCurrency(hpp)}</span>
                    <span>Harga: {formatCurrency(harga)}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-600">Qty:</label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateResepQuantity(index, parseInt(e.target.value) || 1)}
                      className="w-16 px-2 py-1 border border-gray-500 rounded text-center text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => removeResepFromBundle(index)}
                    className="text-red-500 hover:text-red-700 p-1 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}

          {formData.resepBundle.length === 0 && (
            <div className="text-center py-8 text-gray-500 border border-dashed border-gray-500 rounded-lg">
              <Package className="h-12 w-12 mx-auto mb-2 text-gray-500" />
              <p>Belum ada produk dalam bundle</p>
              <p className="text-sm">Klik "Tambah Produk" untuk memulai</p>
            </div>
          )}
        </div>
      </div>

      {/* Bundle Statistics */}
      {formData.resepBundle.length > 0 && formData.hargaBundle && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h5 className="font-medium text-purple-900 mb-3">Analisis Bundle</h5>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-purple-700">Total HPP:</p>
              <p className="font-semibold text-purple-900">
                {formatCurrency(bundleStats.totalHPP)}
              </p>
            </div>
            <div>
              <p className="text-purple-700">Harga Normal:</p>
              <p className="font-semibold text-purple-900">
                {formatCurrency(bundleStats.totalNormalPrice)}
              </p>
            </div>
            <div>
              <p className="text-purple-700">Hemat Customer:</p>
              <p className="font-semibold text-green-600">
                {formatCurrency(bundleStats.savings)} ({bundleStats.savingsPercent.toFixed(1)}%)
              </p>
            </div>
            <div>
              <p className="text-purple-700">Profit:</p>
              <p className={`font-semibold ${bundleStats.profit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(bundleStats.profit)} ({bundleStats.profitPercent.toFixed(1)}%)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Date Range & Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tanggal Mulai
          </label>
          <input
            type="date"
            value={formData.tanggalMulai}
            onChange={(e) => handleInputChange('tanggalMulai', e.target.value)}
            className="w-full px-4 py-3 border border-gray-500 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
            className="w-full px-4 py-3 border border-gray-500 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            value={formData.status}
            onChange={(e) => handleInputChange('status', e.target.value)}
            className="w-full px-4 py-3 border border-gray-500 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="aktif">Aktif</option>
            <option value="nonaktif">Non-aktif</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Deskripsi Bundle
        </label>
        <textarea
          value={formData.deskripsi}
          onChange={(e) => handleInputChange('deskripsi', e.target.value)}
          placeholder="Deskripsi detail paket bundle..."
          rows={3}
          className="w-full px-4 py-3 border border-gray-500 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white px-6 py-4 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b border-white"></div>
            <span>Menghitung...</span>
          </>
        ) : (
          <>
            <Package className="h-5 w-5" />
            <span>Hitung Bundle</span>
          </>
        )}
      </button>
    </form>
  );
};

export default BundleForm;