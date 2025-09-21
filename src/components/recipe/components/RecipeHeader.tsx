import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface RecipeHeaderProps {
  onAddRecipe: () => void;
  isProcessing: boolean;
}

const RecipeHeader: React.FC<RecipeHeaderProps> = ({ onAddRecipe, isProcessing }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-6 mb-6 text-white shadow-lg">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="bg-white bg-opacity-10 p-3 rounded-xl backdrop-blur-sm">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>

          <div>
            <h1 className="text-2xl lg:text-3xl font-bold mb-2">
              Manajemen Resep
            </h1>
            <p className="text-white text-opacity-90">
              Kelola resep dan hitung HPP dengan mudah
            </p>
          </div>
        </div>

        <div className="hidden md:flex gap-3">
          <Button
            onClick={() => navigate('/resep/kategori')}
            disabled={isProcessing}
            className="flex items-center gap-2 bg-white bg-opacity-20 text-white border border-white border-opacity-30 hover:bg-white hover:bg-opacity-30 font-medium px-4 py-2 rounded-lg transition-all backdrop-blur-sm"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Kelola Kategori
          </Button>

          <Button
            onClick={onAddRecipe}
            disabled={isProcessing}
            className="flex items-center gap-2 bg-white text-orange-600 font-semibold border hover:bg-gray-100 px-4 py-2 rounded-lg transition-all"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tambah Resep
          </Button>
        </div>
      </div>

      <div className="flex md:hidden flex-col gap-3 mt-6">
        <Button
          onClick={() => navigate('/resep/kategori')}
          disabled={isProcessing}
          className="w-full flex items-center justify-center gap-2 bg-white bg-opacity-20 text-white border border-white border-opacity-30 hover:bg-white hover:bg-opacity-30 font-medium px-4 py-3 rounded-lg transition-all backdrop-blur-sm"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          Kelola Kategori
        </Button>
        <Button
          onClick={onAddRecipe}
          disabled={isProcessing}
          className="w-full flex items-center justify-center gap-2 bg-white text-orange-600 font-semibold border hover:bg-gray-100 px-4 py-3 rounded-lg transition-all"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tambah Resep
        </Button>
      </div>
    </div>
  );
};

export default RecipeHeader;
