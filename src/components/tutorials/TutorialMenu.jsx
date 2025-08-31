import React from 'react';
import { getAllTutorials } from '../../data/tutorials/tutorialData';
import { ChevronRight, Clock, BookOpen, Play } from 'lucide-react';

const TutorialMenu = ({ onSelectTutorial }) => {
  const tutorials = getAllTutorials();


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50 py-4 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 lg:mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-600 text-white rounded-full text-2xl mb-4">
            📚
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Tutorial Lengkap Analisis HPP
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Pelajari cara menghitung <strong>Harga Pokok Penjualan (HPP)</strong> dan 
            <strong> Weighted Average Cost (WAC)</strong> untuk meningkatkan profit usaha UMKM Anda
          </p>
        </div>

        {/* Learning Path Info */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 lg:p-8 mb-6 lg:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <BookOpen className="mr-3 text-orange-600" size={24} />
            Learning Path untuk UMKM
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
            <div className="text-center p-4 bg-green-50 rounded-lg border-2 border-green-200">
              <div className="text-3xl mb-2">🎯</div>
              <h3 className="font-semibold text-green-800">Dasar-Dasar</h3>
              <p className="text-sm text-green-600 mt-1">Pahami konsep HPP dan WAC</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg border-2 border-orange-200">
              <div className="text-3xl mb-2">📊</div>
              <h3 className="font-semibold text-orange-800">Praktik</h3>
              <p className="text-sm text-orange-600 mt-1">Input data dan buat resep</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
              <div className="text-3xl mb-2">🚀</div>
              <h3 className="font-semibold text-gray-800">Optimasi</h3>
              <p className="text-sm text-gray-600 mt-1">Tingkatkan profit usaha</p>
            </div>
          </div>
        </div>


        {/* Tutorial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
          {tutorials.map((tutorial, index) => (
            <div 
              key={tutorial.id}
              className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden group cursor-pointer"
              onClick={() => onSelectTutorial(tutorial)}
            >
              <div className="p-4 sm:p-6 lg:p-8">
                {/* Tutorial Number & Icon */}
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {index + 1}
                  </div>
                  <div className="ml-3 text-3xl">{tutorial.icon}</div>
                </div>

                {/* Title & Subtitle */}
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
                  {tutorial.title}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4 leading-relaxed">
                  {tutorial.subtitle}
                </p>

                {/* Meta Info */}
                <div className="flex items-center mb-4">
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock size={16} className="mr-2" />
                    <span>{tutorial.duration}</span>
                  </div>
                </div>

                {/* Start Button */}
                <button className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center group-hover:shadow-lg">
                  <Play size={18} className="mr-2" />
                  Mulai Tutorial
                  <ChevronRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Start Guide */}
        <div className="mt-8 lg:mt-12 bg-white rounded-xl shadow-lg p-4 sm:p-6 lg:p-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">
            🚀 Panduan Cepat Memulai
          </h2>
          <div className="grid grid-cols-1 gap-6 lg:gap-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <span className="bg-orange-100 text-orange-600 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold mr-2">📚</span>
                Urutan Tutorial yang Disarankan:
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Fondasi Dasar:</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start">
                      <span className="text-blue-500 mr-2">1️⃣</span>
                      Pengenalan HPP dan WAC
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-500 mr-2">2️⃣</span>
                      Input Data Bahan Baku
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-500 mr-2">3️⃣</span>
                      Input Biaya Operasional
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Implementasi & Optimasi:</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start">
                      <span className="text-purple-500 mr-2">4️⃣</span>
                      Membuat Resep Produk
                    </li>
                    <li className="flex items-start">
                      <span className="text-purple-500 mr-2">5️⃣</span>
                      Perhitungan HPP Otomatis
                    </li>
                    <li className="flex items-start">
                      <span className="text-purple-500 mr-2">6️⃣</span>
                      Analisis Profit dan Margin
                    </li>
                    <li className="flex items-start">
                      <span className="text-purple-500 mr-2">7️⃣</span>
                      Strategi Optimasi Profit
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
            <h4 className="font-semibold text-orange-900 mb-2">💡 Tips Belajar Efektif:</h4>
            <ul className="text-sm text-orange-800 space-y-1">
              <li>• <strong>Ikuti urutan tutorial</strong> - setiap tutorial membangun dari yang sebelumnya</li>
              <li>• <strong>Praktik langsung</strong> - gunakan data usaha Anda sendiri saat belajar</li>
              <li>• <strong>Jangan terburu-buru</strong> - pahami konsep sebelum lanjut ke tutorial berikutnya</li>
              <li>• <strong>Bookmark halaman ini</strong> - Anda bisa kembali kapan saja untuk mengulang</li>
            </ul>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mt-8 lg:mt-12 bg-gradient-to-r from-green-50 to-orange-50 rounded-xl p-4 sm:p-6 lg:p-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 text-center">
            🎯 Setelah Selesai Tutorial, Anda Akan Bisa:
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            <div className="text-center">
              <div className="bg-white p-4 rounded-lg shadow-md mb-3">
                <div className="text-3xl mb-2">💰</div>
                <h3 className="font-semibold text-gray-900 text-sm">Hitung HPP Akurat</h3>
              </div>
              <p className="text-xs text-gray-600">Tahu biaya produksi yang sebenarnya</p>
            </div>
            <div className="text-center">
              <div className="bg-white p-4 rounded-lg shadow-md mb-3">
                <div className="text-3xl mb-2">📈</div>
                <h3 className="font-semibold text-gray-900 text-sm">Analisis Profit</h3>
              </div>
              <p className="text-xs text-gray-600">Mengerti mana produk yang paling menguntungkan</p>
            </div>
            <div className="text-center">
              <div className="bg-white p-4 rounded-lg shadow-md mb-3">
                <div className="text-3xl mb-2">⚖️</div>
                <h3 className="font-semibold text-gray-900 text-sm">Gunakan WAC</h3>
              </div>
              <p className="text-xs text-gray-600">Hitung harga bahan baku yang tepat</p>
            </div>
            <div className="text-center">
              <div className="bg-white p-4 rounded-lg shadow-md mb-3">
                <div className="text-3xl mb-2">🚀</div>
                <h3 className="font-semibold text-gray-900 text-sm">Optimasi Usaha</h3>
              </div>
              <p className="text-xs text-gray-600">Strategi tingkatkan keuntungan 30-50%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorialMenu;
