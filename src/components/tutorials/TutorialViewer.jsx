import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Home, Clock, Star, CheckCircle, RotateCcw } from 'lucide-react';
import './tutorial.css';

const TutorialViewer = ({ tutorial, onBack, onNextTutorial }) => {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [completedSections, setCompletedSections] = useState(new Set());
  const [isCompleted, setIsCompleted] = useState(false);

  const currentSection = tutorial.sections[currentSectionIndex];
  const isLastSection = currentSectionIndex === tutorial.sections.length - 1;
  const isFirstSection = currentSectionIndex === 0;

  useEffect(() => {
    // Reset progress saat tutorial berganti
    setCurrentSectionIndex(0);
    setCompletedSections(new Set());
    setIsCompleted(false);
  }, [tutorial.id]);

  const handleNextSection = () => {
    // Mark current section as completed
    setCompletedSections(prev => new Set([...prev, currentSectionIndex]));
    
    if (isLastSection) {
      setIsCompleted(true);
    } else {
      setCurrentSectionIndex(prev => prev + 1);
    }
  };

  const handlePrevSection = () => {
    if (!isFirstSection) {
      setCurrentSectionIndex(prev => prev - 1);
    }
  };

  const handleRestartTutorial = () => {
    setCurrentSectionIndex(0);
    setCompletedSections(new Set());
    setIsCompleted(false);
  };

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

  const progress = ((completedSections.size + (isCompleted ? 1 : 0)) / tutorial.sections.length) * 100;

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-orange-50 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Completion Screen */}
          <div className="bg-white rounded-xl shadow-xl p-6 sm:p-8 lg:p-12 text-center">
            <div className="text-6xl mb-6">🎉</div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Selamat! Tutorial Selesai!
            </h1>
            <h2 className="text-lg sm:text-xl text-orange-600 font-semibold mb-6">
              {tutorial.title}
            </h2>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-bold text-green-800 mb-4">✅ Yang Sudah Anda Pelajari:</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                {tutorial.sections.map((section, index) => (
                  <div key={section.id} className="flex items-start">
                    <CheckCircle className="text-green-500 mr-2 mt-1 flex-shrink-0" size={16} />
                    <span className="text-sm text-green-700">{section.title}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleRestartTutorial}
                className="flex items-center justify-center px-4 py-2 sm:px-6 sm:py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm sm:text-base"
              >
                <RotateCcw size={16} className="mr-2" />
                Ulangi Tutorial
              </button>
              
              {onNextTutorial && (
                <button
                  onClick={onNextTutorial}
                  className="flex items-center justify-center px-4 py-2 sm:px-6 sm:py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium text-sm sm:text-base"
                >
                  Tutorial Selanjutnya
                  <ChevronRight size={16} className="ml-2" />
                </button>
              )}
              
              <button
                onClick={onBack}
                className="flex items-center justify-center px-4 py-2 sm:px-6 sm:py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium text-sm sm:text-base"
              >
                <Home size={16} className="mr-2" />
                Kembali ke Menu
              </button>
            </div>

            {/* Next Steps */}
            <div className="mt-8 p-6 bg-orange-50 border border-orange-200 rounded-lg text-left">
              <h3 className="text-lg font-bold text-orange-800 mb-4">🚀 Langkah Selanjutnya:</h3>
              <ul className="space-y-2 text-sm text-orange-700">
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2">•</span>
                  <strong>Praktikkan langsung:</strong> Gunakan pengetahuan ini untuk usaha Anda
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2">•</span>
                  <strong>Lanjutkan tutorial:</strong> Ada tutorial lanjutan yang bisa membantu Anda lebih dalam
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2">•</span>
                  <strong>Monitor hasil:</strong> Pantau perkembangan profit usaha Anda setiap minggu
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg mb-6">
          <div className="p-4 sm:p-6 lg:p-8">
            {/* Navigation & Back Button */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={onBack}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors font-medium"
              >
                <ChevronLeft size={20} className="mr-1" />
                Kembali ke Menu
              </button>
              
              <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(tutorial.difficulty)}`}>
                {tutorial.difficulty}
              </div>
            </div>

            {/* Tutorial Info */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <div className="text-3xl mr-4">{tutorial.icon}</div>
                  <div>
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                      {tutorial.title}
                    </h1>
                    <p className="text-gray-600 mt-1">{tutorial.subtitle}</p>
                  </div>
                </div>
                
                <div className="flex items-center mt-4 space-x-6">
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
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Progress</span>
                <span className="text-sm font-medium text-gray-700">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>

            {/* Section Navigation */}
            <div className="flex flex-wrap gap-2 mb-6">
              {tutorial.sections.map((section, index) => (
                <button
                  key={section.id}
                  onClick={() => setCurrentSectionIndex(index)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    index === currentSectionIndex
                      ? 'bg-orange-600 text-white'
                      : completedSections.has(index)
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {index < currentSectionIndex || completedSections.has(index) ? '✓' : index + 1}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-lg mb-6">
          <div className="p-4 sm:p-6 lg:p-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">
              {currentSection.title}
            </h2>
            
            <div className="prose prose-lg max-w-none">
              <div 
                dangerouslySetInnerHTML={{ __html: currentSection.content }}
                className="tutorial-content-container"
              />
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center bg-white rounded-xl shadow-lg p-4 sm:p-6 gap-3 sm:gap-4">
          <button
            onClick={handlePrevSection}
            disabled={isFirstSection}
            className={`flex items-center justify-center px-4 py-2 sm:px-6 sm:py-3 rounded-lg font-medium transition-colors text-sm sm:text-base ${
              isFirstSection
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-600 text-white hover:bg-gray-700'
            }`}
          >
            <ChevronLeft size={16} className="mr-2" />
            <span className="hidden sm:inline">Sebelumnya</span>
            <span className="sm:hidden">Prev</span>
          </button>

          <div className="text-center flex-1 mx-0 sm:mx-4 order-first sm:order-none">
            <p className="text-xs sm:text-sm text-gray-600">
              Bagian {currentSectionIndex + 1} dari {tutorial.sections.length}
            </p>
          </div>

          <button
            onClick={handleNextSection}
            className="flex items-center justify-center px-4 py-2 sm:px-6 sm:py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium text-sm sm:text-base"
          >
            <span className="hidden sm:inline">{isLastSection ? 'Selesai' : 'Selanjutnya'}</span>
            <span className="sm:hidden">{isLastSection ? 'Done' : 'Next'}</span>
            <ChevronRight size={16} className="ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TutorialViewer;
