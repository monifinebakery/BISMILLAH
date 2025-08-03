import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Calculator, Save, RefreshCw, AlertCircle, ChevronRight } from 'lucide-react';

// Mock hooks
const useRecipe = () => ({
  recipes: [
    { id: 1, name: 'Nasi Goreng Special', hpp: 15000, harga_jual: 25000 },
    { id: 2, name: 'Ayam Bakar', hpp: 20000, harga_jual: 35000 },
    { id: 3, name: 'Gado-gado', hpp: 12000, harga_jual: 20000 }
  ],
  isLoading: false
});

const usePromoCalculation = () => ({
  calculatePromo: async (type, data) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      originalPrice: data.originalPrice || 25000,
      promoPrice: data.promoPrice || 20000,
      profitMargin: 15,
      totalSavings: 5000
    };
  },
  savePromo: async (data) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true };
  },
  isLoading: false
});

const useIsMobile = (breakpoint = 768) => {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, [breakpoint]);
  
  return isMobile;
};

const toast = {
  success: (message) => console.log('Success:', message),
  error: (message) => console.log('Error:', message)
};

// Lazy components
const PromoTypeSelector = lazy(() => Promise.resolve({
  default: ({ selectedType, onTypeChange, onFormSubmit, isCalculating, recipes, isMobile }) => {
    const [formData, setFormData] = useState({});

    const promoTypes = [
      { id: 'bogo', title: 'Buy One Get One', description: 'Beli satu gratis satu dengan syarat minimal pembelian', icon: '🎁' },
      { id: 'discount', title: 'Diskon Persentase/Nominal', description: 'Potongan harga dalam persentase atau nominal rupiah', icon: '💰' },
      { id: 'bundle', title: 'Paket Bundle', description: 'Kombinasi beberapa produk dengan harga khusus', icon: '📦' }
    ];

    const handleTypeSelect = (type) => {
      onTypeChange(type);
      setFormData({});
    };

    const handleSubmit = () => {
      onFormSubmit(formData);
    };

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Pilih Tipe Promo</h2>
          <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-3'}`}>
            {promoTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => handleTypeSelect(type.id)}
                className={`p-6 rounded-xl border-2 text-left transition-all hover:shadow-lg hover:scale-105 ${
                  selectedType === type.id
                    ? 'border-orange-500 bg-orange-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex flex-col items-center text-center space-y-3">
                  <span className="text-3xl">{type.icon}</span>
                  <div>
                    <h3 className={`font-semibold text-lg ${
                      selectedType === type.id ? 'text-orange-900' : 'text-gray-900'
                    }`}>
                      {type.title}
                    </h3>
                    <p className={`text-sm mt-2 leading-relaxed ${
                      selectedType === type.id ? 'text-orange-700' : 'text-gray-600'
                    }`}>
                      {type.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {selectedType && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 space-y-6">
            <h3 className="text-xl font-semibold text-gray-900 capitalize flex items-center">
              <span className="text-2xl mr-3">
                {selectedType === 'bogo' ? '🎁' : selectedType === 'discount' ? '💰' : '📦'}
              </span>
              Pengaturan {selectedType === 'bogo' ? 'Buy One Get One' : selectedType === 'discount' ? 'Diskon' : 'Bundle'}
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Pilih Resep</label>
              <select 
                value={formData.recipeId || ''}
                onChange={(e) => setFormData({...formData, recipeId: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
              >
                <option value="">Pilih resep...</option>
                {recipes.map((recipe) => (
                  <option key={recipe.id} value={recipe.id}>
                    {recipe.name} - HPP: {new Intl.NumberFormat('id-ID', {
                      style: 'currency',
                      currency: 'IDR',
                      minimumFractionDigits: 0
                    }).format(recipe.hpp)}
                  </option>
                ))}
              </select>
            </div>

            {selectedType === 'discount' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Harga Normal</label>
                  <input
                    type="number"
                    value={formData.originalPrice || ''}
                    onChange={(e) => setFormData({...formData, originalPrice: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="25000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Harga Promo</label>
                  <input
                    type="number"
                    value={formData.promoPrice || ''}
                    onChange={(e) => setFormData({...formData, promoPrice: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="20000"
                  />
                </div>
              </div>
            )}

            {selectedType === 'bogo' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Minimal Pembelian</label>
                <input
                  type="number"
                  value={formData.minPurchase || ''}
                  onChange={(e) => setFormData({...formData, minPurchase: parseInt(e.target.value) || 0})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="1"
                />
              </div>
            )}

            {selectedType === 'bundle' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Harga Bundle</label>
                <input
                  type="number"
                  value={formData.bundlePrice || ''}
                  onChange={(e) => setFormData({...formData, bundlePrice: parseInt(e.target.value) || 0})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="45000"
                />
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={isCalculating}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-3 hover:shadow-lg"
            >
              {isCalculating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Menghitung...</span>
                </>
              ) : (
                <>
                  <Calculator className="h-5 w-5" />
                  <span>Hitung Promo</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    );
  }
}));

const PromoPreview = lazy(() => Promise.resolve({
  default: ({ type, data, onSave, isLoading, isMobile }) => {
    if (!type || !data.calculationResult) {
      return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
          <div className="text-center py-12">
            <div className="text-6xl mb-6">📊</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Preview Promo</h3>
            <p className="text-gray-600 leading-relaxed">
              Pilih tipe promo dan isi formulir untuk melihat preview hasil kalkulasi
            </p>
          </div>
        </div>
      );
    }

    const { calculationResult } = data;

    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <span className="text-2xl mr-3">📊</span>
          Hasil Kalkulasi
        </h3>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="text-sm font-medium text-gray-600 mb-2">Harga Normal</div>
              <div className="text-2xl font-bold text-gray-900">
                {new Intl.NumberFormat('id-ID', {
                  style: 'currency',
                  currency: 'IDR',
                  minimumFractionDigits: 0
                }).format(calculationResult.originalPrice)}
              </div>
            </div>
            
            <div className="bg-orange-50 rounded-lg p-6">
              <div className="text-sm font-medium text-orange-600 mb-2">Harga Promo</div>
              <div className="text-2xl font-bold text-orange-700">
                {new Intl.NumberFormat('id-ID', {
                  style: 'currency',
                  currency: 'IDR',
                  minimumFractionDigits: 0
                }).format(calculationResult.promoPrice)}
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-6">
            <div className="text-sm font-medium text-green-600 mb-2">Margin Keuntungan</div>
            <div className="text-3xl font-bold text-green-700">
              {calculationResult.profitMargin}%
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-6">
            <div className="text-sm font-medium text-blue-600 mb-2">Total Penghematan</div>
            <div className="text-2xl font-bold text-blue-700">
              {new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0
              }).format(calculationResult.totalSavings)}
            </div>
          </div>

          <button
            onClick={onSave}
            disabled={isLoading}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-3 hover:shadow-lg"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                <span>Simpan Promo</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }
}));

const LoadingState = ({ type }) => (
  <div className="p-8 text-center">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500 mx-auto mb-6"></div>
    <p className="text-gray-600">
      {type === 'form' ? 'Memuat formulir...' : 'Memuat...'}
    </p>
  </div>
);

const PromoCalculator = () => {
  const isMobile = useIsMobile(768);
  const [selectedType, setSelectedType] = useState('');
  const [formData, setFormData] = useState({});
  const [isCalculating, setIsCalculating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  const { recipes, isLoading: recipesLoading } = useRecipe();
  const { calculatePromo, savePromo, isLoading: calculationLoading } = usePromoCalculation();

  useEffect(() => {
    setFormData({});
    setShowPreview(false);
  }, [selectedType]);

  const handleFormSubmit = async (data) => {
    setIsCalculating(true);
    try {
      const calculationResult = await calculatePromo(selectedType, data);
      setFormData({ ...data, calculationResult });
      
      if (isMobile) {
        setShowPreview(true);
      }
      
      toast.success('Perhitungan promo berhasil!');
    } catch (error) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSavePromo = async () => {
    if (!formData.calculationResult) {
      toast.error('Lakukan perhitungan terlebih dahulu');
      return;
    }

    try {
      await savePromo({
        type: selectedType,
        data: formData,
        calculation: formData.calculationResult
      });
      toast.success('Promo berhasil disimpan!');
      
      setSelectedType('');
      setFormData({});
      setShowPreview(false);
    } catch (error) {
      toast.error(`Gagal menyimpan promo: ${error.message}`);
    }
  };

  if (recipesLoading) {
    return <LoadingState />;
  }

  if (recipes.length === 0) {
    return (
      <div className="text-center">
        <div className="bg-gray-50 rounded-xl p-12 max-w-md mx-auto">
          <div className="text-gray-400 text-6xl mb-6">🍳</div>
          <h3 className="text-2xl font-semibold text-gray-700 mb-4">Belum Ada Resep</h3>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Tambahkan resep terlebih dahulu untuk menggunakan kalkulator promo
          </p>
          
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-8">
            <div className="flex items-start space-x-4">
              <AlertCircle className="h-6 w-6 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="text-left">
                <h4 className="font-medium text-orange-800 mb-3">Yang perlu Anda lakukan:</h4>
                <ul className="text-sm text-orange-700 space-y-2">
                  <li>• Buat resep dengan HPP dan harga jual</li>
                  <li>• Tentukan margin keuntungan</li>
                  <li>• Mulai buat promo untuk resep tersebut</li>
                </ul>
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => window.location.href = '/resep'}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-lg transition-all duration-200 font-semibold hover:shadow-lg"
          >
            Buat Resep Pertama
          </button>
        </div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Mobile Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Calculator className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Kalkulator Promo</h1>
                {selectedType && (
                  <p className="text-xs text-gray-600 capitalize">{selectedType}</p>
                )}
              </div>
            </div>
            
            {formData.calculationResult && !showPreview && (
              <button
                onClick={() => setShowPreview(true)}
                className="flex items-center space-x-1 text-orange-600 text-sm font-medium"
              >
                <span>Preview</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="p-4">
          {!showPreview ? (
            <div className="space-y-4">
              <Suspense fallback={<LoadingState type="form" />}>
                <PromoTypeSelector 
                  selectedType={selectedType}
                  onTypeChange={setSelectedType}
                  onFormSubmit={handleFormSubmit}
                  isCalculating={isCalculating || calculationLoading}
                  recipes={recipes}
                  isMobile={true}
                />
              </Suspense>
              
              {formData.calculationResult && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-green-800">
                      Perhitungan selesai
                    </span>
                  </div>
                  <p className="text-xs text-green-700 mt-1">
                    Tap "Preview" untuk melihat hasil kalkulasi
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <button
                onClick={() => setShowPreview(false)}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ChevronRight className="h-4 w-4 rotate-180" />
                <span className="text-sm">Kembali ke Form</span>
              </button>
              
              <Suspense fallback={<LoadingState type="form" />}>
                <PromoPreview 
                  type={selectedType}
                  data={formData}
                  onSave={handleSavePromo}
                  isLoading={calculationLoading}
                  isMobile={true}
                />
              </Suspense>
            </div>
          )}
        </div>

        {formData.calculationResult && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center justify-center space-x-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="text-sm">
                  {showPreview ? 'Edit' : 'Preview'}
                </span>
              </button>
              
              <button
                onClick={handleSavePromo}
                disabled={calculationLoading}
                className="flex items-center justify-center space-x-2 px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span className="text-sm">Simpan Promo</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Desktop Layout - FIXED
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Orange Header */}
      <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center space-x-6">
            <div className="p-4 bg-white bg-opacity-20 rounded-xl backdrop-blur-sm">
              <Calculator className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">Kalkulator Promo</h1>
              <p className="text-orange-100 mt-3 text-lg">
                Hitung profit margin dan dampak promo dengan akurat
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column - Form */}
          <div className="space-y-8">
            <Suspense fallback={<LoadingState type="form" />}>
              <PromoTypeSelector 
                selectedType={selectedType}
                onTypeChange={setSelectedType}
                onFormSubmit={handleFormSubmit}
                isCalculating={isCalculating || calculationLoading}
                recipes={recipes}
                isMobile={false}
              />
            </Suspense>
          </div>
          
          {/* Right Column - Preview */}
          <div className="lg:sticky lg:top-8 lg:self-start">
            <Suspense fallback={<LoadingState type="form" />}>
              <PromoPreview 
                type={selectedType}
                data={formData}
                onSave={handleSavePromo}
                isLoading={calculationLoading}
                isMobile={false}
              />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromoCalculator;