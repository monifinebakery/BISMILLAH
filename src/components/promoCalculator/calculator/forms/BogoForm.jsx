// 🎯 Form untuk BOGO (Buy One Get One)

import React, { useState } from 'react';
import { Gift, Search, Calendar } from 'lucide-react';
import { toast } from 'sonner'; // ← ADD THIS MISSING IMPORT

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

  const getRecipeById = (id) => recipes.find(r => r.id === id);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Nama Promo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nama Promo *
        </label>
        <input
          type="text"
          value={formData.namaPromo}
          onChange={(e) => handleInputChange('namaPromo', e.target.value)}
          placeholder="Misal: BOGO Bakso Special"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          required
        />
      </div>

      {/* Minimal Quantity */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Minimal Pembelian
        </label>
        <input
          type="number"
          min="1"
          value={formData.minimalQty}
          onChange={(e) => handleInputChange('minimalQty', parseInt(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
      </div>

      {/* Basic Info */}
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
          placeholder="Deskripsi detail promo BOGO..."
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
        className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Menghitung...</span>
          </>
        ) : (
          <>
            <Gift className="h-4 w-4" />
            <span>Hitung BOGO</span>
          </>
        )}
      </button>
    </form>
  );
};

export default BogoForm;