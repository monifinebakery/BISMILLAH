// components/ProductSelection.tsx - Product Selection Component

import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, Package, DollarSign, TrendingUp } from 'lucide-react';
import { Recipe, ProductSelectionProps } from '@/types';
import { formatCurrency } from '@/utils/formatUtils';
import { useSearch, useToggle } from '@/hooks';

interface ProductSelectionComponent extends React.FC<ProductSelectionProps> {
  SearchInput: React.FC<SearchInputProps>;
  ProductCard: React.FC<ProductCardProps>;
  ProductList: React.FC<ProductListProps>;
  EmptyState: React.FC<EmptyStateProps>;
}

interface SearchInputProps {
  query: string;
  onQueryChange: (query: string) => void;
  placeholder?: string;
  className?: string;
}

interface ProductCardProps {
  recipe: Recipe;
  isSelected: boolean;
  onSelect: () => void;
  showDetails?: boolean;
  className?: string;
}

interface ProductListProps {
  recipes: Recipe[];
  selectedRecipeId: string;
  onRecipeSelect: (recipeId: string) => void;
  loading?: boolean;
}

interface EmptyStateProps {
  query?: string;
  onReset?: () => void;
}

// 🔍 Search Input Component
const SearchInput: React.FC<SearchInputProps> = ({
  query,
  onQueryChange,
  placeholder = "Cari produk...",
  className = ""
}) => {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-4 w-4 text-gray-400" />
      </div>
      <input
        type="text"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all duration-200"
      />
      {query && (
        <button
          onClick={() => onQueryChange('')}
          className="absolute inset-y-0 right-0 pr-3 flex items-center"
        >
          <span className="text-gray-400 hover:text-gray-600 text-sm">✕</span>
        </button>
      )}
    </div>
  );
};

// 📦 Product Card Component
const ProductCard: React.FC<ProductCardProps> = ({
  recipe,
  isSelected,
  onSelect,
  showDetails = true,
  className = ""
}) => {
  const marginRp = recipe.hargaJualPorsi - recipe.hppPerPorsi;
  const marginPercent = recipe.hargaJualPorsi > 0 ? (marginRp / recipe.hargaJualPorsi) * 100 : 0;
  
  const getMarginColor = (margin: number) => {
    if (margin < 10) return 'text-red-600 bg-red-50';
    if (margin < 20) return 'text-orange-600 bg-orange-50';
    if (margin < 30) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  return (
    <div
      onClick={onSelect}
      className={`
        relative p-4 border rounded-lg cursor-pointer transition-all duration-200
        ${isSelected 
          ? 'border-orange-500 bg-orange-50 shadow-md' 
          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
        }
        ${className}
      `}
    >
      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2">
          <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs">✓</span>
          </div>
        </div>
      )}

      {/* Product Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="p-2 bg-gray-100 rounded-lg">
          <Package className="h-5 w-5 text-gray-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">
            {recipe.namaResep}
          </h3>
          {recipe.kategori && (
            <p className="text-sm text-gray-500 mt-1">
              {recipe.kategori}
            </p>
          )}
        </div>
      </div>

      {showDetails && (
        <>
          {/* Price Information */}
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <DollarSign className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-gray-500">HPP</span>
              </div>
              <p className="text-sm font-medium text-gray-900">
                {formatCurrency(recipe.hppPerPorsi)}
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <DollarSign className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-gray-500">Harga Jual</span>
              </div>
              <p className="text-sm font-medium text-gray-900">
                {formatCurrency(recipe.hargaJualPorsi)}
              </p>
            </div>
          </div>

          {/* Margin Information */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-gray-400" />
              <span className="text-xs text-gray-500">Margin</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-900">
                {formatCurrency(marginRp)}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMarginColor(marginPercent)}`}>
                {marginPercent.toFixed(1)}%
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// 📋 Product List Component
const ProductList: React.FC<ProductListProps> = ({
  recipes,
  selectedRecipeId,
  onRecipeSelect,
  loading = false
}) => {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="p-4 border border-gray-200 rounded-lg animate-pulse">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-9 h-9 bg-gray-200 rounded-lg"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div className="space-y-1">
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
              <div className="space-y-1">
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
            <div className="flex justify-between">
              <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              <div className="h-6 bg-gray-200 rounded w-1/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {recipes.map((recipe) => (
        <ProductCard
          key={recipe.id}
          recipe={recipe}
          isSelected={selectedRecipeId === recipe.id}
          onSelect={() => onRecipeSelect(recipe.id)}
        />
      ))}
    </div>
  );
};

// 🚫 Empty State Component
const EmptyState: React.FC<EmptyStateProps> = ({ query, onReset }) => {
  return (
    <div className="text-center py-12">
      <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Package className="h-8 w-8 text-gray-400" />
      </div>
      
      {query ? (
        <>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Produk tidak ditemukan
          </h3>
          <p className="text-gray-500 mb-4">
            Tidak ada produk yang cocok dengan pencarian "{query}"
          </p>
          {onReset && (
            <button
              onClick={onReset}
              className="text-orange-600 hover:text-orange-700 font-medium"
            >
              Reset pencarian
            </button>
          )}
        </>
      ) : (
        <>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Belum ada produk
          </h3>
          <p className="text-gray-500">
            Tambahkan produk untuk mulai membuat promo
          </p>
        </>
      )}
    </div>
  );
};

// 🎯 Main Product Selection Component
const ProductSelection: ProductSelectionComponent = ({
  recipes,
  selectedRecipeId,
  onRecipeSelect,
  loading = false
}) => {
  const [showFilters, setShowFilters] = useToggle(false);
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'margin'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // 🔍 Search functionality
  const { query, setQuery, filteredItems } = useSearch(recipes, 'namaResep');

  // 📊 Sorting functionality
  const sortedRecipes = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.namaResep.localeCompare(b.namaResep);
          break;
        case 'price':
          comparison = a.hargaJualPorsi - b.hargaJualPorsi;
          break;
        case 'margin':
          const marginA = a.hargaJualPorsi - a.hppPerPorsi;
          const marginB = b.hargaJualPorsi - b.hppPerPorsi;
          comparison = marginA - marginB;
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredItems, sortBy, sortOrder]);

  // 📊 Statistics
  const stats = useMemo(() => {
    const totalRecipes = recipes.length;
    const filteredCount = filteredItems.length;
    const averagePrice = recipes.length > 0 
      ? recipes.reduce((sum, recipe) => sum + recipe.hargaJualPorsi, 0) / recipes.length 
      : 0;
    
    return {
      totalRecipes,
      filteredCount,
      averagePrice,
      hasSelection: selectedRecipeId !== ''
    };
  }, [recipes, filteredItems, selectedRecipeId]);

  const handleSortChange = (newSortBy: typeof sortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Pilih Produk
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {stats.filteredCount} dari {stats.totalRecipes} produk
          </p>
        </div>
        
        {recipes.length > 0 && (
          <button
            onClick={setShowFilters.toggle}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span>Filter</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${showFilters.value ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="space-y-3">
        <SearchInput
          query={query}
          onQueryChange={setQuery}
          placeholder="Cari nama produk..."
        />

        {showFilters.value && (
          <div className="p-4 bg-gray-50 rounded-lg space-y-3">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700">Urutkan:</span>
              <div className="flex gap-2">
                {[
                  { key: 'name', label: 'Nama' },
                  { key: 'price', label: 'Harga' },
                  { key: 'margin', label: 'Margin' }
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => handleSortChange(key as typeof sortBy)}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                      sortBy === key
                        ? 'bg-orange-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {label}
                    {sortBy === key && (
                      <span className="ml-1">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {stats.hasSelection && (
              <div className="text-sm text-gray-600">
                ✓ {recipes.find(r => r.id === selectedRecipeId)?.namaResep} dipilih
              </div>
            )}
          </div>
        )}
      </div>

      {/* Product List */}
      <div className="max-h-96 overflow-y-auto">
        {sortedRecipes.length > 0 ? (
          <ProductList
            recipes={sortedRecipes}
            selectedRecipeId={selectedRecipeId}
            onRecipeSelect={onRecipeSelect}
            loading={loading}
          />
        ) : (
          <EmptyState
            query={query}
            onReset={() => setQuery('')}
          />
        )}
      </div>

      {/* Selection Summary */}
      {stats.hasSelection && (
        <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <span className="text-sm font-medium text-orange-800">
              Produk dipilih: {recipes.find(r => r.id === selectedRecipeId)?.namaResep}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// Attach sub-components
ProductSelection.SearchInput = SearchInput;
ProductSelection.ProductCard = ProductCard;
ProductSelection.ProductList = ProductList;
ProductSelection.EmptyState = EmptyState;

export default ProductSelection;