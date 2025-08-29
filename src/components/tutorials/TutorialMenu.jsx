import React, { useState } from 'react';
import { getAllTutorials } from '../../data/tutorials/tutorialData';
import { ChevronRight, Clock, Star, BookOpen, Play } from 'lucide-react';

const TutorialMenu = ({ onSelectTutorial }) => {
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const tutorials = getAllTutorials();

  const filteredTutorials = tutorials.filter(tutorial => 
    selectedDifficulty === 'all' || tutorial.difficulty === selectedDifficulty
  );

  const getDifficultyColor = (difficulty) => {
    switch(difficulty) {
      case 'Pemula': return 'bg-green-100 text-green-800 border-green-200';
      case 'Menengah': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Lanjutan': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDifficultyStars = (difficulty) => {
    switch(difficulty) {
      case 'Pemula': return 1;
      case 'Menengah': return 2;
      case 'Lanjutan': return 3;
      default: return 1;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-4 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 lg:mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-full text-2xl mb-4">
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
            <BookOpen className="mr-3 text-blue-600" size={24} />
            Learning Path untuk UMKM
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
            <div className="text-center p-4 bg-green-50 rounded-lg border-2 border-green-200">
              <div className="text-3xl mb-2">🎯</div>
              <h3 className="font-semibold text-green-800">Dasar-Dasar</h3>
              <p className="text-sm text-green-600 mt-1">Pahami konsep HPP dan WAC</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
              <div className="text-3xl mb-2">📊</div>
              <h3 className="font-semibold text-blue-800">Praktik</h3>
              <p className="text-sm text-blue-600 mt-1">Input data dan buat resep</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
              <div className="text-3xl mb-2">🚀</div>
              <h3 className="font-semibold text-purple-800">Optimasi</h3>
              <p className="text-sm text-purple-600 mt-1">Tingkatkan profit usaha</p>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6 lg:mb-8">
          <h3 className="font-semibold text-gray-900 mb-4">Filter berdasarkan Level:</h3>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <button
              onClick={() => setSelectedDifficulty('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedDifficulty === 'all' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Semua Tutorial
            </button>
            <button
              onClick={() => setSelectedDifficulty('Pemula')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedDifficulty === 'Pemula' 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pemula
            </button>
            <button
              onClick={() => setSelectedDifficulty('Menengah')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedDifficulty === 'Menengah' 
                ? 'bg-yellow-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Menengah
            </button>
            <button
              onClick={() => setSelectedDifficulty('Lanjutan')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedDifficulty === 'Lanjutan' 
                ? 'bg-red-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Lanjutan
            </button>
          </div>
        </div>

        {/* Tutorial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
          {filteredTutorials.map((tutorial, index) => (
            <div 
              key={tutorial.id}
              className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden group cursor-pointer"
              onClick={() => onSelectTutorial(tutorial)}
            >
              <div className="p-4 sm:p-6 lg:p-8">
                {/* Tutorial Number & Icon */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      {index + 1}
                    </div>
                    <div className="ml-3 text-3xl">{tutorial.icon}</div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(tutorial.difficulty)}`}>
                    {tutorial.difficulty}
                  </div>
                </div>

                {/* Title & Subtitle */}
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {tutorial.title}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4 leading-relaxed">
                  {tutorial.subtitle}
                </p>

                {/* Meta Info */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock size={16} className="mr-2" />
                    <span>{tutorial.duration}</span>
                  </div>
                  <div className="flex items-center">
                    {[...Array(3)].map((_, i) => (
                      <Star 
                        key={i}
                        size={16} 
                        className={i < getDifficultyStars(tutorial.difficulty) 
                          ? 'text-yellow-400 fill-current' 
                          : 'text-gray-300'
                        }
                      />
                    ))}
                  </div>
                </div>

                {/* Start Button */}
                <button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center group-hover:shadow-lg">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <span className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold mr-2">1</span>
                Pemula? Mulai dari sini!
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Tutorial 1: Pengenalan HPP dan WAC
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Tutorial 2: Input Data Bahan Baku
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Tutorial 3: Input Biaya Operasional
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <span className="bg-yellow-100 text-yellow-600 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold mr-2">2</span>
                Sudah Paham Dasar?
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <span className="text-yellow-500 mr-2">✓</span>
                  Tutorial 4: Membuat Resep Produk
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-500 mr-2">✓</span>
                  Tutorial 5: Perhitungan HPP Otomatis
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-500 mr-2">✓</span>
                  Tutorial 6: Analisis Profit dan Margin
                </li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2">💡 Tips Belajar Efektif:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Ikuti urutan tutorial</strong> - setiap tutorial membangun dari yang sebelumnya</li>
              <li>• <strong>Praktik langsung</strong> - gunakan data usaha Anda sendiri saat belajar</li>
              <li>• <strong>Jangan terburu-buru</strong> - pahami konsep sebelum lanjut ke tutorial berikutnya</li>
              <li>• <strong>Bookmark halaman ini</strong> - Anda bisa kembali kapan saja untuk mengulang</li>
            </ul>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mt-8 lg:mt-12 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 sm:p-6 lg:p-8">
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
