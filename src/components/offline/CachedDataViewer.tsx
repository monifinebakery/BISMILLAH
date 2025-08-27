import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Database, 
  Search, 
  RefreshCw, 
  Package, 
  ShoppingCart, 
  ChefHat,
  Clock,
  WifiOff,
  Eye
} from 'lucide-react';
import { cachedDataStorage } from '@/utils/offlineStorage';
import { usePWA } from '@/utils/pwaUtils';

interface CachedItem {
  id: string;
  name: string;
  category?: string;
  price?: number;
  stock?: number;
  unit?: string;
  description?: string;
  [key: string]: any;
}

type DataType = 'warehouse' | 'orders' | 'recipes';

export default function CachedDataViewer() {
  const [activeTab, setActiveTab] = useState<DataType>('warehouse');
  const [warehouseData, setWarehouseData] = useState<CachedItem[]>([]);
  const [ordersData, setOrdersData] = useState<any[]>([]);
  const [recipesData, setRecipesData] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastCacheTime, setLastCacheTime] = useState<{ [key: string]: number | null }>({});
  const { isOnline } = usePWA();

  useEffect(() => {
    loadCachedData();
    loadCacheTimes();
  }, []);

  const loadCachedData = () => {
    setWarehouseData(cachedDataStorage.getCachedWarehouseData());
    setOrdersData(cachedDataStorage.getCachedOrdersData());
    setRecipesData(cachedDataStorage.getCachedRecipesData());
  };

  const loadCacheTimes = () => {
    setLastCacheTime({
      warehouse: cachedDataStorage.getLastCacheTime('warehouse'),
      orders: cachedDataStorage.getLastCacheTime('orders'),
      recipes: cachedDataStorage.getLastCacheTime('recipes')
    });
  };

  const getCurrentData = () => {
    switch (activeTab) {
      case 'warehouse': return warehouseData;
      case 'orders': return ordersData;
      case 'recipes': return recipesData;
      default: return [];
    }
  };

  const filteredData = getCurrentData().filter((item: any) => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      (item.name && item.name.toLowerCase().includes(searchLower)) ||
      (item.productName && item.productName.toLowerCase().includes(searchLower)) ||
      (item.customerName && item.customerName.toLowerCase().includes(searchLower)) ||
      (item.category && item.category.toLowerCase().includes(searchLower)) ||
      (item.description && item.description.toLowerCase().includes(searchLower))
    );
  });

  const formatLastUpdate = (timestamp: number | null) => {
    if (!timestamp) return 'Tidak ada data';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Baru saja';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} menit lalu`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} jam lalu`;
    return `${Math.floor(diff / 86400000)} hari lalu`;
  };

  const tabs = [
    { key: 'warehouse', label: 'Warehouse', icon: Package, count: warehouseData.length },
    { key: 'orders', label: 'Orders', icon: ShoppingCart, count: ordersData.length },
    { key: 'recipes', label: 'Recipes', icon: ChefHat, count: recipesData.length }
  ];

  const renderWarehouseItem = (item: any) => (
    <Card key={item.id} className="hover:bg-gray-50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h4 className="font-medium">{item.name || item.productName}</h4>
            {item.category && (
              <Badge variant="secondary" className="text-xs mt-1">
                {item.category}
              </Badge>
            )}
            <div className="text-sm text-gray-600 mt-2 space-y-1">
              {item.stock !== undefined && (
                <div>Stock: {item.stock} {item.unit || 'unit'}</div>
              )}
              {item.price !== undefined && (
                <div>Harga: Rp {item.price.toLocaleString('id-ID')}</div>
              )}
              {item.description && (
                <div className="text-xs">{item.description}</div>
              )}
            </div>
          </div>
          <Badge variant={item.stock > 10 ? 'default' : item.stock > 0 ? 'secondary' : 'destructive'}>
            {item.stock > 10 ? 'Available' : item.stock > 0 ? 'Low Stock' : 'Out of Stock'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );

  const renderOrderItem = (item: any) => (
    <Card key={item.id} className="hover:bg-gray-50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h4 className="font-medium">
              {item.customerName || `Order #${item.id?.substr(-8)}`}
            </h4>
            <div className="text-sm text-gray-600 mt-1">
              {item.totalAmount && (
                <div>Total: Rp {item.totalAmount.toLocaleString('id-ID')}</div>
              )}
              {item.items && (
                <div>{item.items.length} item(s)</div>
              )}
              {item.status && (
                <Badge variant="secondary" className="text-xs mt-1">
                  {item.status}
                </Badge>
              )}
            </div>
          </div>
          <div className="text-right text-sm text-gray-500">
            {item.createdAt && new Date(item.createdAt).toLocaleDateString('id-ID')}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderRecipeItem = (item: any) => (
    <Card key={item.id} className="hover:bg-gray-50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h4 className="font-medium">{item.name}</h4>
            <div className="text-sm text-gray-600 mt-1">
              {item.ingredients && (
                <div>{item.ingredients.length} bahan</div>
              )}
              {item.yield && (
                <div>Hasil: {item.yield} porsi</div>
              )}
              {item.category && (
                <Badge variant="secondary" className="text-xs mt-1">
                  {item.category}
                </Badge>
              )}
            </div>
          </div>
          {item.estimatedCost && (
            <div className="text-right text-sm">
              <div className="font-medium">Rp {item.estimatedCost.toLocaleString('id-ID')}</div>
              <div className="text-gray-500">Est. Cost</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderContent = () => {
    if (filteredData.length === 0) {
      return (
        <div className="text-center text-gray-500 py-8">
          <Database className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>{searchTerm ? 'Tidak ada data yang cocok' : 'Tidak ada data tersimpan'}</p>
          <p className="text-sm">
            {searchTerm ? 'Coba ubah kata kunci pencarian' : 'Data akan tersimpan ketika Anda online'}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {filteredData.map((item: any) => {
          switch (activeTab) {
            case 'warehouse':
              return renderWarehouseItem(item);
            case 'orders':
              return renderOrderItem(item);
            case 'recipes':
              return renderRecipeItem(item);
            default:
              return null;
          }
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Offline Status */}
      {!isOnline && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-amber-800">
              <WifiOff className="h-4 w-4" />
              <span className="text-sm font-medium">Mode Offline - Menampilkan data tersimpan</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Data Viewer (Read-Only)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <Button
                  key={tab.key}
                  variant={activeTab === tab.key ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab(tab.key as DataType)}
                  className="flex-1"
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label} ({tab.count})
                </Button>
              );
            })}
          </div>

          {/* Cache Status */}
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                Terakhir disimpan: {formatLastUpdate(lastCacheTime[activeTab])}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                loadCachedData();
                loadCacheTimes();
              }}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={`Cari ${activeTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Content */}
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
}
