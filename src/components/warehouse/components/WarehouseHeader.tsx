// ===== 2. UPDATE WarehouseHeader.tsx dengan useQuery =====
// src/components/warehouse/components/WarehouseHeader.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Package, AlertTriangle, RefreshCw, TrendingDown, Info, Zap, BarChart3, ShoppingCart, Star } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { warehouseApi } from '../services/warehouseApi';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { useNavigate } from 'react-router-dom';

interface WarehouseHeaderProps {
  itemCount: number;
  selectedCount: number;
  isConnected: boolean;
  lastUpdated?: Date;
  onRefresh?: () => void;
}

const headerQueryKeys = {
  stats: ['warehouse', 'header', 'stats'] as const,
  alerts: ['warehouse', 'header', 'alerts'] as const,
};

const fetchWarehouseStats = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const service = await warehouseApi.createService('crud', {
      userId: user?.id,
      enableDebugLogs: import.meta.env.DEV
    });
    
    const items = await service.fetchBahanBaku();
    
    // Calculate stats
    const totalItems = items.length;
    const lowStockItems = items.filter(item => Number(item.stok) <= Number(item.minimum));
    const outOfStockItems = items.filter(item => Number(item.stok) === 0);
    const expiringItems = items.filter(item => {
      if (!item.expiry) return false;
      const expiryDate = new Date(item.expiry);
      const threshold = new Date();
      threshold.setDate(threshold.getDate() + 7); // 7 days warning
      return expiryDate <= threshold && expiryDate > new Date();
    });
    
    // ✅ UPDATE: Calculate total value using effective price (WAC)
    const totalValue = items.reduce((sum, item) => {
      const harga = item.hargaRataRata ?? item.harga ?? 0;
      return sum + (Number(item.stok) * harga);
    }, 0);
    
    return {
      totalItems,
      lowStockCount: lowStockItems.length,
      outOfStockCount: outOfStockItems.length,
      expiringCount: expiringItems.length,
      totalValue,
      categories: [...new Set(items.map(item => item.kategori))].length,
      suppliers: [...new Set(items.map(item => item.supplier))].length,
    };
  } catch (error) {
    logger.error('Failed to fetch warehouse stats:', error);
    return null;
  }
};

const fetchWarehouseAlerts = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const service = await warehouseApi.createService('alert', {
      userId: user?.id,
      enableDebugLogs: import.meta.env.DEV
    });
    
    return {
      hasAlerts: false,
      alertCount: 0,
      criticalAlerts: 0,
    };
  } catch (error) {
    logger.error('Failed to fetch warehouse alerts:', error);
    return null;
  }
};

const WarehouseHeader: React.FC<WarehouseHeaderProps> = ({
  itemCount,
  selectedCount,
  isConnected,
  lastUpdated,
  onRefresh
}) => {
  const navigate = useNavigate();
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats
  } = useQuery({
    queryKey: headerQueryKeys.stats,
    queryFn: fetchWarehouseStats,
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    retry: 1,
  });

  const {
    data: alerts,
    isLoading: alertsLoading,
  } = useQuery({
    queryKey: headerQueryKeys.alerts,
    queryFn: fetchWarehouseAlerts,
    staleTime: 1 * 60 * 1000,
    refetchInterval: 2 * 60 * 1000,
    retry: 1,
  });

  const handleRefresh = async () => {
    try {
      await Promise.all([
        refetchStats(),
        onRefresh?.()
      ]);
    } catch (error) {
      logger.error('Failed to refresh header data:', error);
    }
  };

  return (
    <>
      {!isConnected && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-800">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">
              Koneksi tidak stabil. Data mungkin tidak ter-update secara real-time.
            </span>
          </div>
        </div>
      )}

      {(stats?.lowStockCount > 0 || stats?.expiringCount > 0) && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-800">
            <AlertTriangle className="h-4 w-4" />
            <div className="flex-1">
              <span className="text-sm font-medium">Perhatian: </span>
              <span className="text-sm">
                {stats.lowStockCount > 0 && `${stats.lowStockCount} item stok hampir habis`}
                {stats.lowStockCount > 0 && stats.expiringCount > 0 && ', '}
                {stats.expiringCount > 0 && `${stats.expiringCount} item akan kadaluarsa`}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-2xl p-8 mb-6 text-white overflow-hidden shadow-2xl">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-4 -left-4 w-32 h-32 bg-white bg-opacity-10 rounded-full animate-pulse"></div>
          <div className="absolute top-16 right-12 w-20 h-20 bg-white bg-opacity-5 rounded-full animate-bounce" style={{animationDelay: '1.5s'}}></div>
          <div className="absolute bottom-12 left-20 w-24 h-24 bg-white bg-opacity-5 rounded-full animate-ping" style={{animationDelay: '3s'}}></div>
          <div className="absolute top-1/3 right-1/4 w-40 h-40 bg-gradient-to-br from-cyan-400 to-blue-400 opacity-20 rounded-full blur-2xl animate-pulse"></div>
        </div>
        
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="bg-white bg-opacity-20 p-4 rounded-2xl backdrop-blur-sm border border-white border-opacity-30 shadow-2xl">
                <div className="relative">
                  <Package className="h-12 w-12 text-white drop-shadow-lg" />
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full flex items-center justify-center animate-ping">
                    <Star className="h-3 w-3 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full flex items-center justify-center">
                    <Star className="h-3 w-3 text-white" />
                  </div>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-blue-400 rounded-2xl blur opacity-40 animate-pulse"></div>
            </div>
            
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-3 bg-gradient-to-r from-white via-blue-100 to-cyan-100 bg-clip-text text-transparent drop-shadow-lg">
                📦 Manajemen Gudang
              </h1>
              <p className="text-white text-opacity-90 text-lg mb-4">
                Kelola semua stok bahan baku dengan sistem inventory yang terintegrasi
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 text-sm bg-white bg-opacity-15 px-4 py-2 rounded-full backdrop-blur-sm border border-white border-opacity-20">
                  <BarChart3 className="h-4 w-4" />
                  <span>Real-time Monitoring</span>
                </div>
                <div className="flex items-center gap-2 text-sm bg-white bg-opacity-15 px-4 py-2 rounded-full backdrop-blur-sm border border-white border-opacity-20">
                  <Zap className="h-4 w-4" />
                  <span>Smart Alerts</span>
                </div>
              </div>
            </div>
          </div>

          <div className="hidden md:flex gap-4">
            {onRefresh && (
              <Button 
                onClick={handleRefresh}
                disabled={statsLoading}
                className="group flex items-center gap-2 bg-gradient-to-r from-cyan-400 to-blue-400 text-gray-900 border-0 hover:from-cyan-300 hover:to-blue-300 font-bold px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl backdrop-blur-sm"
              >
                <RefreshCw className={`h-5 w-5 ${statsLoading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-300'}`} />
                <span>Refresh Data</span>
              </Button>
            )}

            <Button
              onClick={() => navigate('/pembelian')}
              className="group flex items-center gap-2 bg-white bg-opacity-20 text-white border border-white border-opacity-30 hover:bg-white hover:bg-opacity-30 font-bold px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl backdrop-blur-sm"
            >
              <ShoppingCart className="h-5 w-5 group-hover:animate-bounce" />
              <span>Tambah via Pembelian</span>
            </Button>
          </div>
        </div>

        <div className="flex md:hidden flex-col gap-4 mt-8">
          {onRefresh && (
            <Button
              onClick={handleRefresh}
              disabled={statsLoading}
              className="group w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-400 to-blue-400 text-gray-900 border-0 hover:from-cyan-300 hover:to-blue-300 font-bold px-6 py-4 rounded-xl transition-all duration-300 transform active:scale-95 shadow-xl"
            >
              <RefreshCw className={`h-5 w-5 ${statsLoading ? 'animate-spin' : 'group-active:rotate-180 transition-transform duration-300'}`} />
              <span>Refresh Data</span>
            </Button>
          )}
          <Button
            onClick={() => navigate('/pembelian')}
            className="group w-full flex items-center justify-center gap-2 bg-white bg-opacity-20 text-white border border-white border-opacity-30 hover:bg-white hover:bg-opacity-30 font-bold px-6 py-4 rounded-xl transition-all duration-300 transform active:scale-95 backdrop-blur-sm shadow-xl"
          >
            <ShoppingCart className="h-5 w-5 group-active:animate-bounce" />
            <span>Tambah via Pembelian</span>
          </Button>
        </div>

        {(itemCount > 0 || stats) && (
          <div className="relative mt-8 pt-6 border-t border-white border-opacity-30">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="group flex flex-col p-4 bg-white bg-opacity-10 rounded-xl backdrop-blur-sm border border-white border-opacity-20 hover:bg-opacity-20 transition-all duration-300 transform hover:scale-105">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="h-4 w-4 text-blue-200" />
                  <span className="text-white opacity-75 text-xs uppercase tracking-wide font-semibold">Total Items</span>
                </div>
                <span className="font-bold text-2xl text-blue-100 group-hover:text-white transition-colors duration-300">
                  {statsLoading ? (
                    <div className="w-8 h-8 bg-white bg-opacity-20 rounded animate-pulse"></div>
                  ) : (
                    <>{stats?.totalItems || itemCount} 📦</>
                  )}
                </span>
              </div>

              {/* Enhanced Total Value Card */}
              {stats && stats.totalValue !== undefined && (
                <div className="group flex flex-col p-4 bg-white bg-opacity-10 rounded-xl backdrop-blur-sm border border-white border-opacity-20 hover:bg-opacity-20 transition-all duration-300 transform hover:scale-105">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="h-4 w-4 text-green-200" />
                          <span className="text-white opacity-75 text-xs uppercase tracking-wide font-semibold">
                            Nilai Stok
                          </span>
                          <Info className="h-3 w-3 text-white opacity-60 cursor-pointer hover:opacity-100 transition-opacity" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs text-sm bg-gray-900 text-white border-gray-700">
                        <p>
                          Nilai stok dihitung dari stok × harga beli rata-rata (Weighted Average Cost)
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <span className="font-bold text-2xl text-green-100 group-hover:text-white transition-colors duration-300">
                    {new Intl.NumberFormat('id-ID', {
                      style: 'currency',
                      currency: 'IDR',
                      notation: 'compact',
                    }).format(stats.totalValue)} 💰
                  </span>
                </div>
              )}

              {/* Enhanced Alerts Card */}
              {stats && (stats.lowStockCount > 0 || stats.expiringCount > 0) && (
                <div className="group flex flex-col p-4 bg-gradient-to-br from-yellow-500 from-opacity-20 to-red-500 to-opacity-20 rounded-xl backdrop-blur-sm border border-yellow-300 border-opacity-30 hover:border-opacity-50 transition-all duration-300 transform hover:scale-105 animate-pulse">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-200 animate-bounce" />
                    <span className="text-yellow-100 opacity-90 text-xs uppercase tracking-wide font-semibold">Alerts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-2xl text-yellow-100 group-hover:text-white transition-colors duration-300">
                      {stats.lowStockCount + stats.expiringCount} ⚠️
                    </span>
                  </div>
                </div>
              )}

              {/* Enhanced Selected Card */}
              {selectedCount > 0 && (
                <div className="group flex flex-col p-4 bg-gradient-to-br from-blue-500 from-opacity-20 to-cyan-500 to-opacity-20 rounded-xl backdrop-blur-sm border border-blue-300 border-opacity-30 hover:border-opacity-50 transition-all duration-300 transform hover:scale-105">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="h-4 w-4 text-blue-200" />
                    <span className="text-blue-100 opacity-90 text-xs uppercase tracking-wide font-semibold">Selected</span>
                  </div>
                  <span className="font-bold text-2xl text-blue-100 group-hover:text-white transition-colors duration-300">
                    {selectedCount} ✓
                  </span>
                </div>
              )}
            </div>

            {(lastUpdated || stats) && (
              <div className="mt-3 pt-3 border-t border-white border-opacity-10">
                <div className="flex items-center justify-between text-xs text-white opacity-75">
                  <span>
                    {lastUpdated 
                      ? `Terakhir diperbarui: ${lastUpdated.toLocaleTimeString('id-ID')}`
                      : 'Data real-time'
                    }
                  </span>
                  {statsError && (
                    <span className="text-yellow-200">
                      Stats offline
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default WarehouseHeader;