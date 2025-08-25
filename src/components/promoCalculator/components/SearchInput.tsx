import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { helpers } from '../utils';

const SearchInput = ({ 
  value = '', 
  onChange, 
  placeholder = 'Cari...', 
  debounceMs = 300,
  className = '' 
}: any) => {
  const [localValue, setLocalValue] = useState(value);

  // Debounced onChange
  const debouncedOnChange = helpers.debounce(onChange, debounceMs);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    debouncedOnChange(newValue);
  };

  const handleClear = () => {
    setLocalValue('');
    onChange('');
  };

  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-4 w-4 text-gray-400" />
      </div>
      
      <input
        type="text"
        value={localValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
      />
      
      {localValue && (
        <button
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-3 flex items-center"
        >
          <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
        </button>
      )}
    </div>
  );
};

export default SearchInput;