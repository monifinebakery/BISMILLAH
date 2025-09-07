// 🎯 Single row component untuk table promo

import React from 'react';
import { 
  Edit, Trash2, ToggleLeft, ToggleRight, Gift, Percent, Package 
} from 'lucide-react';
import { formatCurrency } from '@/utils/formatUtils';
import { formatDateForDisplay } from '@/utils/unifiedDateUtils';

const PromoTableRow = ({ 
  promo, 
  isSelected, 
  onSelectChange, 
  onEdit, 
  onDelete, 
  onToggleStatus 
}: any) => {
  


  const getPromoIcon = (type) => {
    switch (type) {
      case 'bogo': return <Gift className="h-4 w-4 text-green-600" />;
      case 'discount': return <Percent className="h-4 w-4 text-blue-600" />;
      case 'bundle': return <Package className="h-4 w-4 text-purple-600" />;
      default: return <Gift className="h-4 w-4 text-gray-400" />;
    }
  };

  const getPromoTypeLabel = (type) => {
    switch (type) {
      case 'bogo': return 'BOGO';
      case 'discount': return 'Diskon';
      case 'bundle': return 'Bundle';
      default: return type;
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      aktif: { bg: 'bg-green-100', text: 'text-green-800', label: 'Aktif' },
      nonaktif: { bg: 'bg-red-100', text: 'text-red-800', label: 'Non-aktif' },
      draft: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Draft' }
    };
    
    const config = statusConfig[status] || statusConfig.draft;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const handleToggleClick = () => {
    const newStatus = promo.status === 'aktif' ? 'nonaktif' : 'aktif';
    onToggleStatus(promo.id, newStatus);
  };

  const handleEditClick = () => {
    onEdit(promo);
  };

  const handleDeleteClick = () => {
    if (window.confirm(`Yakin ingin menghapus promo "${promo.nama_promo}"?`)) {
      onDelete(promo.id);
    }
  };

  const profitMargin = promo.calculation_result?.promoMargin || 0;

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      {/* Checkbox */}
      <td className="px-6 py-4">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelectChange(promo.id, e.target.checked)}
          className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
        />
      </td>

      {/* Nama Promo */}
      <td className="px-6 py-4">
        <div className="flex items-center space-x-3">
          {getPromoIcon(promo.tipe_promo)}
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-gray-900 truncate">
              {promo.nama_promo}
            </div>
            <div className="text-sm text-gray-500 truncate max-w-xs">
              {promo.deskripsi || 'Tidak ada deskripsi'}
            </div>
          </div>
        </div>
      </td>

      {/* Tipe */}
      <td className="px-6 py-4">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {getPromoTypeLabel(promo.tipe_promo)}
        </span>
      </td>

      {/* HPP/Harga */}
      <td className="px-6 py-4 text-sm text-gray-900">
        <div className="space-y-1">
          <div>
            <span className="text-xs text-gray-500">HPP:</span>{' '}
            <span className="font-medium">{formatCurrency(promo.calculation_result?.promoHpp)}</span>
          </div>
          <div>
            <span className="text-xs text-gray-500">Harga:</span>{' '}
            <span className="font-medium text-green-600">{formatCurrency(promo.calculation_result?.promoPrice)}</span>
          </div>
        </div>
      </td>

      {/* Profit Margin */}
      <td className="px-6 py-4">
        <div className={`text-sm font-semibold ${
          profitMargin > 0 ? 'text-green-600' : 'text-red-600'
        }`}>
          {profitMargin.toFixed(1)}%
        </div>
        {promo.calculation_result?.savings && (
          <div className="text-xs text-gray-500">
            Hemat: {formatCurrency(promo.calculation_result.savings)}
          </div>
        )}
      </td>

      {/* Status */}
      <td className="px-6 py-4">
        {getStatusBadge(promo.status)}
      </td>

      {/* Tanggal */}
      <td className="px-6 py-4 text-sm text-gray-500">
        <div className="space-y-1">
          <div>{formatDateForDisplay(promo.created_at)}</div>
          {promo.tanggal_mulai && (
            <div className="text-xs">
              {formatDateForDisplay(promo.tanggal_mulai)} - {formatDateForDisplay(promo.tanggal_selesai)}
            </div>
          )}
        </div>
      </td>

      {/* Actions */}
      <td className="px-6 py-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={handleToggleClick}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title={promo.status === 'aktif' ? 'Nonaktifkan' : 'Aktifkan'}
          >
            {promo.status === 'aktif' ? 
              <ToggleRight className="h-4 w-4 text-green-600" /> : 
              <ToggleLeft className="h-4 w-4 text-red-600" />
            }
          </button>
          
          <button
            onClick={handleEditClick}
            className="text-blue-600 hover:text-blue-800 transition-colors"
            title="Edit promo"
          >
            <Edit className="h-4 w-4" />
          </button>
          
          <button
            onClick={handleDeleteClick}
            className="text-red-600 hover:text-red-800 transition-colors"
            title="Hapus promo"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default PromoTableRow;