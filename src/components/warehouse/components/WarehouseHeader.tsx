// ===== 2. UPDATE WarehouseHeader.tsx dengan useQuery =====
// src/components/warehouse/components/WarehouseHeader.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Package, AlertTriangle, RefreshCw, TrendingDown, Info, Bug } from 'lucide-react';
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
    }) as any; // Type assertion to access fetchBahanBaku method
    
    const items = await service.fetchBahanBaku();
    
    // ✅ AUTO PRICE ADJUSTMENT: Fix zero prices automatically
    await autoAdjustPrices(items, user?.id);
    
    // Calculate stats with proper typing
    const totalItems = items.length;
    const lowStockItems = items.filter((item: any) => Number(item.stok) <= Number(item.minimum));
    const outOfStockItems = items.filter((item: any) => Number(item.stok) === 0);
    const expiringItems = items.filter((item: any) => {
      if (!item.expiry) return false;
      const expiryDate = new Date(item.expiry);
      const threshold = new Date();
      threshold.setDate(threshold.getDate() + 7); // 7 days warning
      return expiryDate <= threshold && expiryDate > new Date();
    });
    
    // ✅ UPDATE: Calculate total value using effective price (WAC)
    const totalValue = items.reduce((sum: number, item: any) => {
      const harga = item.hargaRataRata ?? item.harga ?? 0;
      return sum + (Number(item.stok) * harga);
    }, 0);
    
    return {
      totalItems,
      lowStockCount: lowStockItems.length,
      outOfStockCount: outOfStockItems.length,
      expiringCount: expiringItems.length,
      totalValue,
      categories: [...new Set(items.map((item: any) => item.kategori))].length,
      suppliers: [...new Set(items.map((item: any) => item.supplier))].length,
    };
  } catch (error) {
    logger.error('Failed to fetch warehouse stats:', error);
    return null;
  }
};

/**
 * Auto-adjust prices for items with zero prices (Header Stats Version)
 * This version is used for header statistics calculation
 */
const autoAdjustPrices = async (items: any[], userId?: string) => {
  if (!userId || !items) return;
  
  try {
    // Find items with zero prices
    const zeroPriceItems = items.filter(item => 
      (item.harga || 0) === 0 || (item.hargaRataRata || 0) === 0
    );
    
    if (zeroPriceItems.length === 0) return;
    
    logger.info(`🔄 Header stats: Auto-adjusting prices for ${zeroPriceItems.length} items`);
    
    // Get purchase history for price calculation
    const { data: purchases, error: purchasesError } = await supabase
      .from('purchases')
      .select('items, created_at, supplier')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(30); // Limit for header stats performance
    
    if (purchasesError) {
      logger.error('Failed to fetch purchase history for price adjustment:', purchasesError);
      return;
    }
    
    // Process each item with zero price
    for (const item of zeroPriceItems) {
      try {
        let newPrice = 0;
        let newWac = null;
        let totalQuantity = 0;
        let totalValue = 0;
        
        // Calculate average price from purchase history
        if (purchases && purchases.length > 0) {
          purchases.forEach(purchase => {
            if (purchase.items && Array.isArray(purchase.items)) {
              purchase.items.forEach((purchaseItem: any) => {
                const itemMatches = (
                  purchaseItem.bahan_baku_id === item.id || 
                  purchaseItem.bahanBakuId === item.id ||
                  purchaseItem.id === item.id
                );
                
                if (itemMatches) {
                  const qty = Number(purchaseItem.jumlah || purchaseItem.kuantitas || purchaseItem.quantity || 0);
                  const price = Number(
                    purchaseItem.harga_per_satuan || 
                    purchaseItem.harga_satuan || 
                    purchaseItem.hargaSatuan ||
                    purchaseItem.unit_price ||
                    purchaseItem.price || 0
                  );
                  
                  if (qty > 0 && price > 0) {
                    totalQuantity += qty;
                    totalValue += qty * price;
                  }
                }
              });
            }
          });
        }
        
        if (totalQuantity > 0 && totalValue > 0) {
          newWac = totalValue / totalQuantity;
          newPrice = newWac;
        } else {
          // Smart category-based default pricing
          const categoryDefaults: { [key: string]: number } = {
            'Daging': 50000,
            'Seafood': 40000,
            'Sayuran': 15000,
            'Buah': 20000,
            'Bumbu': 10000,
            'Minyak': 25000,
            'Tepung': 8000,
            'Gula': 12000,
            'Garam': 5000,
            'Susu': 15000,
            'Telur': 25000
          };
          
          newPrice = categoryDefaults[item.kategori] || 5000;
        }
        
        // Prepare update data
        const updateData: any = {
          updated_at: new Date().toISOString()
        };
        
        if ((item.harga || 0) === 0) {
          updateData.harga_satuan = newPrice;
        }
        
        if (newWac !== null && (item.hargaRataRata || 0) === 0) {
          updateData.harga_rata_rata = newWac;
        }
        
        // Update the item price
        const { error: updateError } = await supabase
          .from('bahan_baku')
          .update(updateData)
          .eq('id', item.id)
          .eq('user_id', userId);
        
        if (updateError) {
          logger.error(`Failed to update price for ${item.nama}:`, updateError);
        } else {
          const priceType = newWac !== null ? 'WAC' : 'category-default';
          logger.info(`✅ Header stats: Auto-adjusted price for ${item.nama}: Rp ${newPrice.toLocaleString()} (${priceType})`);
          
          // Update the item in memory for immediate stats calculation
          if ((item.harga || 0) === 0) {
            item.harga = newPrice;
          }
          if (newWac !== null && (item.hargaRataRata || 0) === 0) {
            item.hargaRataRata = newWac;
          }
        }
        
      } catch (error) {
        logger.error(`Error processing item ${item.nama}:`, error);
      }
    }
    
  } catch (error) {
    logger.error('Error in header stats auto price adjustment:', error);
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
        refetchStats(), // This will now trigger auto price adjustment
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
                {(stats?.lowStockCount || 0) > 0 && `${stats!.lowStockCount} item stok hampir habis`}
                {(stats?.lowStockCount || 0) > 0 && (stats?.expiringCount || 0) > 0 && ', '}
                {(stats?.expiringCount || 0) > 0 && `${stats!.expiringCount} item akan kadaluarsa`}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-6 mb-6 text-white border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white bg-opacity-20 p-3 rounded-xl backdrop-blur-sm">
              <Package className="h-8 w-8 text-white" />
            </div>
            
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold mb-2">
                Manajemen Gudang
              </h1>
              <p className="text-white opacity-90">
                Kelola semua stok bahan baku dengan sistem inventory yang terintegrasi.
              </p>
            </div>
          </div>

          <div className="hidden md:flex gap-3">
            {/* 🐛 DEBUG: Price Adjustment Debug Tool (Development only) */}
            {import.meta.env.DEV && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => navigate('/debug/price-adjustment')}
                      className="flex items-center gap-2 bg-yellow-500 bg-opacity-90 text-white border border-yellow-400 hover:bg-yellow-600 font-medium px-4 py-2 rounded-lg transition-all backdrop-blur-sm"
                    >
                      <Bug className="h-4 w-4" />
                      Debug Harga
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs text-sm">
                    <p>
                      Debug tool untuk menganalisis dan memperbaiki harga otomatis di warehouse.
                      Hanya tersedia di development mode.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            
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
              onClick={() => navigate('/pembelian')}
              className="flex items-center gap-2 bg-white bg-opacity-20 text-white border border-white border-opacity-30 hover:bg-white hover:bg-opacity-30 font-medium px-4 py-2 rounded-lg transition-all backdrop-blur-sm"
            >
              <Plus className="h-4 w-4" />
              Tambah via Pembelian
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
            onClick={() => navigate('/pembelian')}
            className="w-full flex items-center justify-center gap-2 bg-white bg-opacity-20 text-white border border-white border-opacity-30 hover:bg-white hover:bg-opacity-30 font-medium px-4 py-3 rounded-lg transition-all backdrop-blur-sm"
          >
            <Plus className="h-4 w-4" />
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

              {/* ✅ UPDATE: Render condition untuk total value dengan tooltip */}
              {stats && stats.totalValue !== undefined && (
                <div className="flex flex-col">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1">
                          <span className="text-white opacity-75 text-xs uppercase tracking-wide">
                            Nilai Stok (Harga Rata-Rata)
                          </span>
                          <Info className="h-3 w-3 text-white opacity-60 cursor-pointer" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs text-sm">
                        <p>
                          Nilai stok dihitung dari stok × harga beli rata-rata (Weighted Average Cost),
                          yaitu rata-rata harga pembelian terakhir yang sudah termasuk semua pembelian sebelumnya.
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