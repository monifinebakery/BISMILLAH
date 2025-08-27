// src/components/promoCalculator/components/PromoCard.jsx - Komponen untuk menampilkan card promo
import React, { useState, useRef, useEffect } from 'react'; // ✅ Tambahkan useState, useRef, useEffect
import { Edit, Trash2, Eye, Copy, MoreVertical } from 'lucide-react';

const PromoCard = ({ 
  promo, 
  onEdit, 
  onDelete, 
  onView, 
  onDuplicate, 
  className = "",
  showActions = true 
}: any) => {
  // ✅ State untuk mengontrol dropdown
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null); // Untuk mendeteksi klik di luar dropdown

  // Utility functions
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value || 0);
  };

  const getPromoTypeIcon = (type) => {
    const icons = {
      bogo: '🎁',
      discount: '💰',
      bundle: '📦',
    };
    return icons[type] || '🎯';
  };

  const getStatusColor = (status) => {
    const colors = {
      aktif: 'bg-green-100 text-green-800 border-green-200',
      nonaktif: 'bg-gray-400 text-gray-800 border-gray-500',
      draft: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    };
    return colors[status] || 'bg-gray-400 text-gray-800 border-gray-500';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getPromoTypeText = (type) => {
    const types = {
      bogo: 'Buy One Get One',
      discount: 'Diskon',
      bundle: 'Paket Bundle'
    };
    return types[type] || type;
  };

  // Calculate days remaining
  const getDaysRemaining = (endDate) => {
    if (!endDate) return null;
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { text: 'Berakhir', color: 'text-red-600' };
    if (diffDays === 0) return { text: 'Berakhir hari ini', color: 'text-orange-600' };
    if (diffDays <= 7) return { text: `${diffDays} hari lagi`, color: 'text-orange-600' };
    return { text: `${diffDays} hari lagi`, color: 'text-green-600' };
  };

  const daysRemaining = getDaysRemaining(promo.tanggalSelesai);

  // ✅ Fungsi untuk toggle dropdown
  const toggleDropdown = () => {
    setIsDropdownOpen(prev => !prev);
  };

  // ✅ Fungsi untuk menutup dropdown
  const closeDropdown = () => {
    setIsDropdownOpen(false);
  };

  // ✅ Fungsi untuk menangani klik di luar dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        closeDropdown();
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // ✅ Fungsi pembungkus untuk menutup dropdown setelah aksi
  const handleAction = (actionFn) => {
    return () => {
      if (actionFn) actionFn(promo);
      closeDropdown();
    };
  };

  return (
<div
  className={`bg-white rounded-xl border border-gray-500 transition-colors duration-200 ${className}`}
>
      {/* Card Header */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3 flex-1">
            <span className="text-2xl">{getPromoTypeIcon(promo.tipePromo)}</span>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate text-lg">
                {promo.namaPromo}
              </h3>
              <p className="text-sm text-gray-600">
                {getPromoTypeText(promo.tipePromo)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 ml-3">
            {/* Status Badge */}
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(promo.status)}`}>
              {promo.status}
            </span>
            
            {/* Actions Menu */}
            {showActions && (
              // ✅ Tambahkan ref dan onClick untuk toggle
              <div className="relative" ref={dropdownRef}>
                <button 
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-400 transition-colors"
                  onClick={toggleDropdown} // ✅ Ganti hover dengan click
                  aria-haspopup="true"
                  aria-expanded={isDropdownOpen}
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
                
                {/* Dropdown Menu */}
                {/* ✅ Gunakan state isDropdownOpen untuk kontrol visibilitas */}
                {isDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg border border-gray-500 z-10">
                    <div className="py-1">
                      {onView && (
                        <button
                          onClick={handleAction(onView)} // ✅ Gunakan wrapper
                          className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                          <span>Lihat Detail</span>
                        </button>
                      )}
                      {onEdit && (
                        <button
                          onClick={handleAction(onEdit)} // ✅ Gunakan wrapper
                          className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                          <span>Edit</span>
                        </button>
                      )}
                      {onDuplicate && (
                        <button
                          onClick={handleAction(onDuplicate)} // ✅ Gunakan wrapper
                          className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Copy className="h-4 w-4" />
                          <span>Duplikat</span>
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={handleAction(onDelete)} // ✅ Gunakan wrapper
                          className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Hapus</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Calculation Results */}
        {promo.calculationResult && (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-500 mb-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600 mb-1">Harga Jual:</p>
                <p className="font-semibold text-gray-900">
                  {formatCurrency(promo.calculationResult.finalPrice)}
                </p>
              </div>
              <div>
                <p className="text-gray-600 mb-1">Margin:</p>
                <p className={`font-semibold ${
                  (promo.calculationResult.promoMargin || 0) < 5
                    ? 'text-red-600'
                    : (promo.calculationResult.promoMargin || 0) >= 10
                      ? 'text-yellow-600'
                      : 'text-green-600'
                }`}>
                  {(promo.calculationResult.promoMargin || 0).toFixed(1)}%
                </p>
              </div>
              
              {promo.calculationResult.savings && (
                <div>
                  <p className="text-gray-600 mb-1">Hemat Customer:</p>
                  <p className="font-semibold text-green-600">
                    {formatCurrency(promo.calculationResult.savings)}
                  </p>
                </div>
              )}
              
              {promo.calculationResult.profit && (
                <div>
                  <p className="text-gray-600 mb-1">Profit:</p>
                  <p className={`font-semibold ${
                    promo.calculationResult.profit > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(promo.calculationResult.profit)}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Description */}
        {promo.deskripsi && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 line-clamp-2">
              {promo.deskripsi}
            </p>
          </div>
        )}

        {/* Date Information */}
        <div className="space-y-2">
          {(promo.tanggalMulai || promo.tanggalSelesai) && (
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                {promo.tanggalMulai && promo.tanggalSelesai
                  ? `${formatDate(promo.tanggalMulai)} - ${formatDate(promo.tanggalSelesai)}`
                  : promo.tanggalMulai
                    ? `Mulai: ${formatDate(promo.tanggalMulai)}`
                    : `Berakhir: ${formatDate(promo.tanggalSelesai)}`
                }
              </span>
              
              {daysRemaining && (
                <span className={`font-medium ${daysRemaining.color}`}>
                  {daysRemaining.text}
                </span>
              )}
            </div>
          )}
          
          {/* Created Date */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-500">
            <p className="text-xs text-gray-500">
              Dibuat {formatDate(promo.createdAt)}
            </p>
            
            {promo.updatedAt && promo.updatedAt !== promo.createdAt && (
              <p className="text-xs text-gray-500">
                Diperbarui {formatDate(promo.updatedAt)}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromoCard;