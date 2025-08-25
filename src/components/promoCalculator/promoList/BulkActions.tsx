// 🎯 Bulk actions component

import React from 'react';
import { Trash2, X, CheckSquare } from 'lucide-react';

const BulkActions = ({ selectedCount, onDelete, onDeselect }: any) => {
  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <CheckSquare className="h-5 w-5 text-orange-600" />
          <span className="text-sm font-medium text-orange-800">
            {selectedCount} promo dipilih
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onDelete}
            className="flex items-center space-x-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            <span>Hapus Terpilih</span>
          </button>

          <button
            onClick={onDeselect}
            className="flex items-center space-x-2 px-3 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm rounded-lg transition-colors"
          >
            <X className="h-4 w-4" />
            <span>Batal Pilih</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkActions;