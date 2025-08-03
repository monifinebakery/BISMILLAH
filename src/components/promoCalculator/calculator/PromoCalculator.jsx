import React, { useState, Suspense, lazy } from 'react';
import { Calculator, Save, ChevronLeft, AlertCircle } from 'lucide-react';

// Lazy load components
const PromoTypeSelector = lazy(() => Promise.resolve({
  default: ({ selectedType, onTypeChange, onCalculate, isCalculating, recipes, isMobile }) => {
    const [formData, setFormData] = useState({});

    const promoTypes = [
      { id: 'bogo', title: 'Buy One Get One', description: 'Beli satu gratis satu dengan syarat minimal pembelian', icon: '🎁' },
      { id: 'discount', title: 'Diskon Persentase/Nominal', description: 'Potongan harga dalam persentase atau nominal rupiah', icon: '💰' },
      { id: 'bundle', title: 'Paket Bundle', description: 'Kombinasi beberapa produk dengan harga khusus', icon: '📦' }
    ];

    const handleCalculate = () => {
      onCalculate(formData);
    };

    const handleTypeChange = (type) => {
      onTypeChange(type);
      setFormData({});
    };

    return (
      <div className="space-y-6">
        {/* Type Selection */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pilih Tipe Promo</h2>
          <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'}`}>
            {promoTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => handleTypeChange(type.id)}
                className={`p-4 rounded-lg border-2 text-left transition-all hover:shadow-md ${
                  selectedType === type.id
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <span className="text-2xl">{type.icon}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-medium ${
                      selectedType === type.id ? 'text-orange-900' : 'text-gray-900'
                    }`}>
                      {type.title}
                    </h3>
                    <p className={`text-sm mt-1 ${
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

        {/* Form */}
        {selectedType && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Pengaturan {selectedType === 'bogo' ? 'Buy One Get One' : selectedType === 'discount' ? 'Diskon' : 'Bundle'}
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Resep</label>
              <select 
                value={formData.recipeId || ''}
                onChange={(e) => setFormData({...formData, recipeId: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">Pilih resep...</option>
                {recipes.map(recipe => (
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
              <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Harga Normal</label>
                  <input 
                    type="number" 
                    value={formData.originalPrice || ''}
                    onChange={(e) => setFormData({...formData, originalPrice: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="25000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Harga Promo</label>
                  <input 
                    type="number" 
                    value={formData.promoPrice || ''}
                    onChange={(e) => setFormData({...formData, promoPrice: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="20000"
                  />
                </div>
              </div>
            )}

            {selectedType === 'bogo' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Minimal Pembelian</label>
                <input
                  type="number"
                  value={formData.minPurchase || ''}
                  onChange={(e) => setFormData({...formData, minPurchase: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="1"
                />
              </div>
            )}

            {selectedType === 'bundle' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Harga Bundle</label>
                <input
                  type="number"
                  value={formData.bundlePrice || ''}
                  onChange={(e) => setFormData({...formData, bundlePrice: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="45000"
                />
              </div>
            )}

            <button
              onClick={handleCalculate}
              disabled={isCalculating}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              {isCalculating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Menghitung...</span>
                </>
              ) : (
                <>
                  <Calculator className="h-4 w-4" />
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
  default: ({ result, onSave, isMobile }) => {
    if (!result) {
      return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Preview Promo</h3>
            <p className="text-gray-600 text-sm">Pilih tipe promo untuk melihat preview</p>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="text-xl mr-2">📊</span>
          Hasil Kalkulasi
        </h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600">Harga Normal</div>
              <div className="text-lg font-semibold text-gray-900">
                {new Intl.NumberFormat('id-ID', {
                  style: 'currency',
                  currency: 'IDR',
                  minimumFractionDigits: 0
                }).format(result.originalPrice)}
              </div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="text-sm text-orange-600">Harga Promo</div>
              <div className="text-lg font-semibold text-orange-700">
                {new Intl.NumberFormat('id-ID', {
                  style: 'currency',
                  currency: 'IDR',
                  minimumFractionDigits: 0
                }).format(result.promoPrice)}
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-sm text-green-600">Margin Keuntungan</div>
            <div className="text-xl font-bold text-green-700">{result.profitMargin}%</div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-sm text-blue-600">Total Penghematan</div>
            <div className="text-lg font-semibold text-blue-700">
              {new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0
              }).format(result.totalSavings)}
            </div>
          </div>

          {!isMobile && (
            <button
              onClick={onSave}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>Simpan Promo</span>
            </button>
          )}
        </div>
      </div>
    );
  }
}));

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
    <span className="ml-3 text-gray-600">Memuat...</span>
  </div>
);

const PromoCalculator = () => {
  const [selectedType, setSelectedType] = useState('');
  const [formData, setFormData] = useState({});
  const [showPreview, setShowPreview] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  
  // Mock data
  const recipes = [
    { id: 1, name: 'Nasi Goreng Special', hpp: 15000, harga_jual: 25000 },
    { id: 2, name: 'Ayam Bakar', hpp: 20000, harga_jual: 35000 },
    { id: 3, name: 'Gado-gado', hpp: 12000, harga_jual: 20000 }
  ];

  const handleCalculate = async (data) => {
    setIsCalculating(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const result = {
      originalPrice: data.originalPrice || 25000,
      promoPrice: data.promoPrice || 20000,
      profitMargin: 15,
      totalSavings: 5000
    };
    
    setFormData({ ...data, result });
    setShowPreview(true);
    setIsCalculating(false);
  };

  const handleSave = () => {
    alert('Promo berhasil disimpan!');
    setSelectedType('');
    setFormData({});
    setShowPreview(false);
  };

  // Mobile check
  const isMobile = window.innerWidth < 768;

  if (recipes.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-md w-full">
          <div className="text-center">
            <div className="text-6xl mb-4">🍳</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Belum Ada Resep</h3>
            <p className="text-gray-600 mb-6">
              Tambahkan resep terlebih dahulu untuk menggunakan kalkulator promo
            </p>
            
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div className="text-left">
                  <h4 className="text-sm font-medium text-orange-800">Yang perlu Anda lakukan:</h4>
                  <ul className="text-sm text-orange-700 mt-2 space-y-1">
                    <li>• Buat resep dengan HPP dan harga jual</li>
                    <li>• Tentukan margin keuntungan</li>
                    <li>• Mulai buat promo untuk resep tersebut</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => window.location.href = '/resep'}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg transition-colors font-medium"
            >
              Buat Resep Pertama
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Mobile Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            {showPreview ? (
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="h-5 w-5 text-gray-600" />
                </button>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">Preview Promo</h1>
                  <p className="text-xs text-gray-600 capitalize">{selectedType}</p>
                </div>
              </div>
            ) : (
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
            )}
          </div>
        </div>

        {/* Mobile Content */}
        <div className="p-4 pb-24">
          {!showPreview ? (
            // Form
            <Suspense fallback={<LoadingSpinner />}>
              <PromoTypeSelector 
                selectedType={selectedType}
                onTypeChange={setSelectedType}
                onCalculate={handleCalculate}
                isCalculating={isCalculating}
                recipes={recipes}
                isMobile={true}
              />
            </Suspense>
          ) : (
            // Preview
            <Suspense fallback={<LoadingSpinner />}>
              <PromoPreview 
                result={formData.result}
                onSave={handleSave}
                isMobile={true}
              />
            </Suspense>
          )}
        </div>

        {/* Mobile Bottom Actions */}
        {formData.result && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
            <button
              onClick={handleSave}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>Simpan Promo</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // Desktop
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white bg-opacity-20 rounded-xl backdrop-blur-sm">
              <Calculator className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Kalkulator Promo</h1>
              <p className="text-orange-100 mt-2 text-lg">
                Hitung profit margin dan dampak promo dengan akurat
              </p>
            </div>
          </div>
          
          {selectedType && (
            <div className="mt-6 bg-white bg-opacity-20 backdrop-blur-sm border border-white border-opacity-30 rounded-lg p-4">
              <p className="text-orange-100">
                <span className="font-medium">Tipe promo dipilih:</span> 
                <span className="capitalize ml-1 text-white">
                  {selectedType === 'bogo' ? 'Buy One Get One' : 
                   selectedType === 'discount' ? 'Diskon' : 'Bundle'}
                </span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2 space-y-6">
            <Suspense fallback={<LoadingSpinner />}>
              <PromoTypeSelector 
                selectedType={selectedType}
                onTypeChange={setSelectedType}
                onCalculate={handleCalculate}
                isCalculating={isCalculating}
                recipes={recipes}
                isMobile={false}
              />
            </Suspense>
          </div>

          {/* Preview */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <Suspense fallback={<LoadingSpinner />}>
                <PromoPreview 
                  result={formData.result}
                  onSave={handleSave}
                  isMobile={false}
                />
              </Suspense>
            </div>
          </div>'currency',
                          currency: 'IDR',
                          minimumFractionDigits: 0
                        }).format(formData.result.originalPrice)}
                      </div>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-4">
                      <div className="text-sm text-orange-600">Harga Promo</div>
                      <div className="text-lg font-semibold text-orange-700">
                        {new Intl.NumberFormat('id-ID', {
                          style: 'currency',
                          currency: 'IDR',
                          minimumFractionDigits: 0
                        }).format(formData.result.promoPrice)}
                      </div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="text-sm text-green-600">Margin Keuntungan</div>
                      <div className="text-xl font-bold text-green-700">{formData.result.profitMargin}%</div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="text-sm text-blue-600">Total Penghematan</div>
                      <div className="text-lg font-semibold text-blue-700">
                        {new Intl.NumberFormat('id-ID', {
                          style: 'currency',
                          currency: 'IDR',
                          minimumFractionDigits: 0
                        }).format(formData.result.totalSavings)}
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleSave}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                  >
                    <Save className="h-4 w-4" />
                    <span>Simpan Promo</span>
                  </button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">📊</div>
                  <p className="text-gray-600 text-sm">Pilih tipe promo untuk melihat preview</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromoCalculator;