// src/components/purchase/components/PurchaseHeader.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  ShoppingCart,
  TrendingUp,
  Clock,
  CheckCircle,
  FileText,
  Upload,
  Zap,
  BarChart3,
  Package,
  Star
} from 'lucide-react';
import { formatCurrency } from '@/utils/formatUtils';
import { PurchaseHeaderProps } from '../types/purchase.types';

const PurchaseHeader: React.FC<PurchaseHeaderProps> = ({
  totalPurchases,
  totalValue,
  pendingCount,
  onAddPurchase,
  className = '',
}) => {
  return (
    <Card className={`relative bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 text-white border-0 shadow-2xl overflow-hidden ${className}`}>
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-6 -left-6 w-32 h-32 bg-white bg-opacity-10 rounded-full animate-pulse"></div>
        <div className="absolute top-20 right-16 w-24 h-24 bg-white bg-opacity-5 rounded-full animate-bounce" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-16 left-24 w-28 h-28 bg-white bg-opacity-5 rounded-full animate-ping" style={{animationDelay: '4s'}}></div>
        <div className="absolute top-1/2 right-1/3 w-48 h-48 bg-gradient-to-br from-teal-400 to-green-400 opacity-20 rounded-full blur-2xl animate-pulse"></div>
      </div>
      
      <div className="relative p-8">
        {/* Main header content */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
          {/* Left content */}
          <div className="flex items-center gap-6 mb-6 lg:mb-0">
            <div className="relative flex-shrink-0">
              <div className="bg-white bg-opacity-20 p-4 rounded-2xl backdrop-blur-sm border border-white border-opacity-30 shadow-2xl">
                <div className="relative">
                  <ShoppingCart className="h-12 w-12 text-white drop-shadow-lg" />
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center animate-ping">
                    <Star className="h-3 w-3 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
                    <Star className="h-3 w-3 text-white" />
                  </div>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-teal-400 to-green-400 rounded-2xl blur opacity-40 animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-3 bg-gradient-to-r from-white via-green-100 to-teal-100 bg-clip-text text-transparent drop-shadow-lg">
                🛍️ Manajemen Pembelian
              </h1>
              <p className="text-white text-opacity-90 text-lg mb-4">
                Catat pembelian bahan baku langsung dari nota untuk hasil yang akurat
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 text-sm bg-white bg-opacity-15 px-4 py-2 rounded-full backdrop-blur-sm border border-white border-opacity-20">
                  <BarChart3 className="h-4 w-4" />
                  <span>Smart Recording</span>
                </div>
                <div className="flex items-center gap-2 text-sm bg-white bg-opacity-15 px-4 py-2 rounded-full backdrop-blur-sm border border-white border-opacity-20">
                  <Zap className="h-4 w-4" />
                  <span>Auto Sync</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right actions */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-4 w-full lg:w-auto">
            {/* Import button */}
            <Button
              onClick={() => onAddPurchase('import')}
              className="group w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-400 to-cyan-400 text-gray-900 font-bold rounded-xl border-0 hover:from-blue-300 hover:to-cyan-300 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl"
            >
              <Upload className="h-5 w-5 group-hover:animate-bounce" />
              <span>Import Data</span>
            </Button>

            {/* Tambah dari Nota */}
            <Button
              onClick={() => onAddPurchase('packaging')}
              className="group w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-white bg-opacity-20 text-white font-bold rounded-xl border border-white border-opacity-30 hover:bg-white hover:bg-opacity-30 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl backdrop-blur-sm"
            >
              <FileText className="h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
              <span>Tambah Pembelian</span>
            </Button>
          </div>
        </div>

        {/* Enhanced Stats section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Enhanced Total Purchases Card */}
          <div className="group bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 border border-white border-opacity-30 hover:bg-opacity-20 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-2xl">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-3xl font-bold text-white group-hover:text-blue-100 transition-colors duration-300">
                  {totalPurchases} 📊
                </div>
                <div className="text-sm opacity-80 text-green-100 group-hover:opacity-100 transition-opacity duration-300">
                  Total Pembelian
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Total Value Card */}
          <div className="group bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 border border-white border-opacity-30 hover:bg-opacity-20 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-2xl">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-green-400 to-emerald-400 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                <ShoppingCart className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-3xl font-bold text-white group-hover:text-green-100 transition-colors duration-300">
                  {formatCurrency(totalValue)} 💰
                </div>
                <div className="text-sm opacity-80 text-green-100 group-hover:opacity-100 transition-opacity duration-300">
                  Total Nilai
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Pending Count Card */}
          <div className={`group bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 border border-white border-opacity-30 hover:bg-opacity-20 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-2xl ${
            pendingCount > 0 ? 'animate-pulse' : ''
          }`}>
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300 ${
                pendingCount > 0 
                  ? 'bg-gradient-to-br from-yellow-400 to-orange-400' 
                  : 'bg-gradient-to-br from-green-400 to-emerald-400'
              }`}>
                {pendingCount > 0 ? (
                  <Clock className="h-6 w-6 text-white animate-spin" style={{animationDuration: '2s'}} />
                ) : (
                  <CheckCircle className="h-6 w-6 text-white" />
                )}
              </div>
              <div>
                <div className={`text-3xl font-bold transition-colors duration-300 ${
                  pendingCount > 0 
                    ? 'text-yellow-100 group-hover:text-white' 
                    : 'text-white group-hover:text-green-100'
                }`}>
                  {pendingCount} {pendingCount > 0 ? '⏳' : '✅'}
                </div>
                <div className="text-sm opacity-80 text-green-100 group-hover:opacity-100 transition-opacity duration-300">
                  {pendingCount > 0 ? 'Pending' : 'Semua Selesai'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced notification for pending items */}
        {pendingCount > 0 && (
          <div className="mt-6 p-4 bg-gradient-to-r from-yellow-500 from-opacity-20 to-orange-500 to-opacity-20 backdrop-blur-sm rounded-xl border border-yellow-300 border-opacity-40 shadow-lg animate-pulse">
            <div className="flex items-center gap-3 text-sm">
              <div className="p-2 bg-yellow-400 bg-opacity-30 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-100 animate-spin" style={{animationDuration: '3s'}} />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-yellow-100 mb-1">
                  🚨 Perhatian: {pendingCount} Pembelian Pending
                </div>
                <span className="text-yellow-200 opacity-90">
                  Segera proses untuk update stok yang akurat dan inventory yang real-time.
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default PurchaseHeader;