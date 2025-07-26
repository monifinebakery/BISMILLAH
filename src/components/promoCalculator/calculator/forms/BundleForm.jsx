// 🎯 Form untuk Bundle Produk

import React, { useState } from 'react';
import { Package, Plus, X, Search } from 'lucide-react';
import { toast } from 'sonner';

const BundleForm = ({ onSubmit, isLoading, recipes }) => {
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

  const filteredRecipes = recipes.filter(recipe =>
    recipe.namaResep.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !formData.resepBundle.some(item => item.resepId === recipe.id)
  );

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

  // Calculate bundle statistics
  const bundleStats = (() => {
    const totalHPP = formData.resepBundle.reduce((sum, item) => {
      const recipe = getRecipeById(item.resepId);
      return sum + (recipe ? recipe.hppPerPorsi * item.quantity : 0);
    }, 0);

    const totalNormalPrice = formData.resepBundle.reduce((sum, item) => {
      const recipe = getRecipeById(item.resepId);
      return sum + (recipe ? recipe.hargaJualPorsi * item.quantity : 0);
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nama Bundle *
          </label>
          <input
            type="text"
            value={formData.namaPromo}
            onChange={(e) => handleInputChange('namaPromo', e.target.value)}
            placeholder="Misal: Paket Hemat Nasi + Minuman"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
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
              className="w-full px-3 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
              className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded-lg text-sm flex items-center space-x-1 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Produk</span>
            </button>

            {showResep && (
              <div className="absolute right-0 z-10 w-80 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
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
                    onClick={() => addResepToBundle(recipe.id)}
                    className="w-full px-3 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-medium text-gray-900">{recipe.namaResep}</div>
                    <div className="text-sm text-gray-500 flex justify-between">
                      <span>HPP: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(recipe.hppPerPorsi)}</span>
                      <span>Harga: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(recipe.hargaJualPorsi)}</span>
                    </div>
                  </button>
                ))}
                {filteredRecipes.length === 0 && (
                  <div className="p-3 text-center text-gray-500 text-sm">
                    Tidak ada resep yang tersedia
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bundle Items List */}
        <div className="space-y-3">
          {formData.resepBundle.map((item, index) => {
            const recipe = getRecipeById(item.resepId);
            if (!recipe) return null;

            return (
              <div key={index} className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{recipe.namaResep}</h4>
                  <div className="text-sm text-gray-500 grid grid-cols-2 gap-4 mt-1">
                    <span>HPP: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(recipe.hppPerPorsi)}</span>
                    <span>Harga: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(recipe.hargaJualPorsi)}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-600">Qty:</label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateResepQuantity(index, parseInt(e.target.value))}
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => removeResepFromBundle(index)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}

          {formData.resepBundle.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>Belum ada produk dalam bundle</p>
              <p className="text-sm">Klik "Tambah Produk" untuk memulai</p>
            </div>
          )}
        </div>
      </div>

      {/* Bundle Statistics */}
      {formData.resepBundle.length > 0 && formData.hargaBundle && (
        <div className="bg-purple-50 rounded-lg p-4">
          <h5 className="font-medium text-purple-900 mb-3">Analisis Bundle</h5>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-purple-700">Total HPP:</p>
              <p className="font-semibold text-purple-900">
                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(bundleStats.totalHPP)}
              </p>
            </div>
            <div>
              <p className="text-purple-700">Harga Normal:</p>
              <p className="font-semibold text-purple-900">
                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(bundleStats.totalNormalPrice)}
              </p>
            </div>
            <div>
            <div>
              <p className="text-purple-700">Hemat:</p>
              <p className="font-semibold text-green-600">
                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(bundleStats.savings)} ({bundleStats.savingsPercent.toFixed(1)}%)
              </p>
            </div>
            <div>
              <p className="text-purple-700">Profit:</p>
              <p className={`font-semibold ${bundleStats.profit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(bundleStats.profit)} ({bundleStats.profitPercent.toFixed(1)}%)
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
          Deskripsi Bundle
        </label>
        <textarea
          value={formData.deskripsi}
          onChange={(e) => handleInputChange('deskripsi', e.target.value)}
          placeholder="Deskripsi detail paket bundle..."
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
        className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Menghitung...</span>
          </>
        ) : (
          <>
            <Package className="h-4 w-4" />
            <span>Hitung Bundle</span>
          </>
        )}
      </button>
    </form>
  );
};

export default BundleForm;