// ===== 2. UPDATE WarehouseHeader.tsx dengan useQuery =====
// src/components/warehouse/components/WarehouseHeader.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Package, AlertTriangle, RefreshCw, TrendingDown, Info, Zap, BarChart3, ShoppingCart, Star } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { warehouseApi } from '../services/warehouseApi';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/utils/logger';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { useNavigate } from 'react-router-dom';
import { toNumber } from '../utils/typeUtils';

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

const fetchWarehouseStats = async (userId?: string) => {
  try {
    const service = await warehouseApi.createService('crud', {
      userId,
      enableDebugLogs: import.meta.env.DEV
    });
    
    const items = await service.fetchBahanBaku();
    
    // Calculate stats
    const totalItems = items.length;
    const lowStockItems = items.filter(item => toNumber(item.stok) <= toNumber(item.minimum));
    const outOfStockItems = items.filter(item => toNumber(item.stok) === 0);
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
      return sum + (toNumber(item.stok) * harga);
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

const fetchWarehouseAlerts = async (userId?: string) => {
  try {
    const service = await warehouseApi.createService('alert', {
      userId,
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
  const { user } = useAuth();
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats
  } = useQuery({
    queryKey: [...headerQueryKeys.stats, user?.id],
    queryFn: () => fetchWarehouseStats(user?.id),
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    retry: 1,
  });

  const {
    data: alerts,
    isLoading: alertsLoading,
  } = useQuery({
    queryKey: [...headerQueryKeys.alerts, user?.id],
    queryFn: () => fetchWarehouseAlerts(user?.id),
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

      <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-6 mb-6 text-white shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-white bg-opacity-10 p-3 rounded-xl backdrop-blur-sm">
              <Package className="h-8 w-8 text-white" />
            </div>
            
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold mb-2">
                Manajemen Gudang
              </h1>
              <p className="text-white text-opacity-90">
                Kelola semua stok bahan baku dengan sistem inventory yang terintegrasi
              </p>
            </div>
          </div>

          <div className="hidden md:flex gap-3">
            {onRefresh && (
              <Button 
                onClick={handleRefresh}
                disabled={statsLoading}
                className="flex items-center gap-2 bg-white bg-opacity-20 text-white border border-white border-opacity-30 hover:bg-white hover:bg-opacity-30 font-medium px-4 py-2 rounded-lg transition-all backdrop-blur-sm"
              >
                <RefreshCw className={`h-4 w-4 ${statsLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            )}

            <Button
              onClick={() => navigate('/gudang/add')}
              className="flex items-center gap-2 bg-white text-orange-600 font-semibold border hover:bg-gray-100 px-4 py-2 rounded-lg transition-all"
            >
              <Plus className="h-4 w-4" />
              Tambah Item
            </Button>
            
            <Button
              onClick={() => navigate('/pembelian')}
              className="flex items-center gap-2 bg-white bg-opacity-10 text-white border border-white border-opacity-30 hover:bg-white hover:bg-opacity-20 font-medium px-4 py-2 rounded-lg transition-all backdrop-blur-sm"
            >
              <ShoppingCart className="h-4 w-4" />
              via Pembelian
            </Button>
          </div>
        </div>

        <div className="flex md:hidden flex-col gap-3 mt-6">
          {onRefresh && (
            <Button
              onClick={handleRefresh}
              disabled={statsLoading}
              className="w-full flex items-center justify-center gap-2 bg-white bg-opacity-20 text-white border border-white border-opacity-30 hover:bg-white hover:bg-opacity-30 font-medium px-4 py-3 rounded-lg transition-all backdrop-blur-sm"
            >
              <RefreshCw className={`h-4 w-4 ${statsLoading ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
          )}
          <Button
            onClick={() => navigate('/gudang/add')}
            className="w-full flex items-center justify-center gap-2 bg-white text-orange-600 font-semibold border hover:bg-gray-100 px-4 py-3 rounded-lg transition-all"
          >
            <Plus className="h-4 w-4" />
            Tambah Item Gudang
          </Button>
          <Button
            onClick={() => navigate('/pembelian')}
            className="w-full flex items-center justify-center gap-2 bg-white bg-opacity-20 text-white border border-white border-opacity-30 hover:bg-white hover:bg-opacity-30 font-medium px-4 py-3 rounded-lg transition-all backdrop-blur-sm"
          >
            <ShoppingCart className="h-4 w-4" />
            Tambah via Pembelian
          </Button>
        </div>

        {(itemCount > 0 || stats) && (
          <div className="mt-4 pt-4 border-t border-white border-opacity-20">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex flex-col">
                <span className="text-white opacity-75 text-xs uppercase tracking-wide">Total Items</span>
                <span className="font-bold text-lg">
                  {statsLoading ? '...' : (stats?.totalItems || itemCount)}
                </span>
              </div>

              {stats && stats.totalValue !== undefined && (
                <div className="flex flex-col">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1">
                          <span className="text-white opacity-75 text-xs uppercase tracking-wide">
                            Nilai Stok
                          </span>
                          <Info className="h-3 w-3 text-white opacity-60 cursor-pointer" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs text-sm">
                        <p>
                          Nilai stok dihitung dari stok × harga beli rata-rata (Weighted Average Cost)
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <span className="font-bold text-lg">
                    {new Intl.NumberFormat('id-ID', {
                      style: 'currency',
                      currency: 'IDR',
                      notation: 'compact',
                    }).format(stats.totalValue)}
                  </span>
                </div>
              )}

              {stats && (stats.lowStockCount > 0 || stats.expiringCount > 0) && (
                <div className="flex flex-col">
                  <span className="text-white opacity-75 text-xs uppercase tracking-wide">Alerts</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg text-yellow-200">
                      {stats.lowStockCount + stats.expiringCount}
                    </span>
                    <TrendingDown className="h-3 w-3 text-yellow-200" />
                  </div>
                </div>
              )}

              {selectedCount > 0 && (
                <div className="flex flex-col">
                  <span className="text-white opacity-75 text-xs uppercase tracking-wide">Selected</span>
                  <span className="font-bold text-lg text-blue-200">
                    {selectedCount}
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