// src/components/devices/DeviceManagementPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Laptop, 
  Smartphone, 
  Tablet,
  Monitor,
  SmartphoneCharging,
  LogOut,
  Edit2,
  Check,
  X,
  AlertTriangle,
  Shield,
  Activity,
  Clock,
  Trash2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useDevice } from '@/contexts/DeviceContext';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { LoadingSkeleton, Skeleton } from '@/components/ui/skeleton';

const DeviceManagementPage: React.FC = () => {
  const { devices, currentDevice, loading, error, refreshDevices, updateDeviceName, removeDevice, removeAllOtherDevices, fetchDevicesPaginated } = useDevice();
  const { user } = useAuth();
  const [editingDeviceId, setEditingDeviceId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  
  // ✅ LAZY LOADING STATE
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [useLazyLoading] = useState(true);
  const [paginationInfo, setPaginationInfo] = useState({ totalCount: 0, totalPages: 0 });
  
  // ✅ LAZY LOADING QUERY
  const { 
    data: paginatedData, 
    isLoading: isPaginatedLoading, 
    error: paginatedError,
    refetch: refetchPaginated 
  } = useQuery({
    queryKey: ['devices-paginated', user?.id, currentPage, itemsPerPage],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      const result = await fetchDevicesPaginated(user.id, currentPage, itemsPerPage);
      setPaginationInfo({ totalCount: result.totalCount, totalPages: result.totalPages });
      return result;
    },
    enabled: !!user?.id,
    staleTime: 30000,
    keepPreviousData: true,
    placeholderData: (prev) => prev,
  });
  
  // ✅ DETERMINE FINAL DATA
  const finalDevices = useLazyLoading ? (paginatedData?.devices || []) : devices;
  const finalIsLoading = useLazyLoading ? isPaginatedLoading : loading;
  const finalError = useLazyLoading ? paginatedError : error;

  // Load devices only once when component mounts
  useEffect(() => {
    if (!hasLoaded) {
      console.log('DeviceManagementPage: Initial load');
      handleRefreshDevices();
      setHasLoaded(true);
    }
  }, [hasLoaded]);

  const handleEditName = useCallback((deviceId: string, currentName: string) => {
    setEditingDeviceId(deviceId);
    setEditName(currentName || '');
  }, []);

  const handleSaveName = useCallback(async (deviceId: string) => {
    try {
      const success = await updateDeviceName(deviceId, editName.trim());
      if (success) {
        setEditingDeviceId(null);
        setEditName('');
      }
    } catch (err) {
      logger.error('Error saving device name:', err);
    }
  }, [editName, updateDeviceName]);

  const handleCancelEdit = useCallback(() => {
    setEditingDeviceId(null);
    setEditName('');
  }, []);

  const handleRemoveDevice = useCallback(async (deviceId: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus perangkat ini? Jika ini adalah perangkat saat ini, Anda akan keluar dari akun.')) {
      try {
        await removeDevice(deviceId);
      } catch (err) {
        logger.error('Error removing device:', err);
      }
    }
  }, [removeDevice]);

  const handleRefreshDevices = useCallback(async () => {
    if (isRefreshing) return;
    
    console.log('DeviceManagementPage: Refreshing devices');
    setIsRefreshing(true);
    try {
      await refreshDevices();
    } catch (err) {
      logger.error('Error refreshing devices:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, refreshDevices]);

  const handleRemoveAllOtherDevices = useCallback(async () => {
    if (isCleaningUp) return;
    
    if (window.confirm('Apakah Anda yakin ingin mengeluarkan semua perangkat lain? Anda akan tetap masuk di perangkat ini.')) {
      setIsCleaningUp(true);
      try {
        const success = await removeAllOtherDevices();
        if (success) {
          logger.info('Successfully removed all other devices');
        }
      } catch (err) {
        logger.error('Error removing all other devices:', err);
      } finally {
        setIsCleaningUp(false);
      }
    }
  }, [isCleaningUp, removeAllOtherDevices]);

  const getDeviceIcon = useCallback((deviceType?: string) => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="h-5 w-5" />;
      case 'tablet':
        return <Tablet className="h-5 w-5" />;
      case 'desktop':
        return <Monitor className="h-5 w-5" />;
      default:
        return <Laptop className="h-5 w-5" />;
    }
  }, []);

  // Enhanced device status helpers
  const getDeviceStatus = useCallback((device: any) => {
    const lastActive = new Date(device.last_active);
    const now = new Date();
    
    // Validate dates before using getTime()
    if (!(lastActive instanceof Date) || isNaN(lastActive.getTime()) ||
        !(now instanceof Date) || isNaN(now.getTime())) {
      return { status: 'unknown', label: 'Tidak Diketahui', color: 'gray', hours: 0 };
    }
    
    const hoursAgo = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60));
    
    if (device.is_current) {
      return { status: 'current', label: 'Perangkat Saat Ini', color: 'green', hours: 0 };
    } else if (hoursAgo < 1) {
      return { status: 'recent', label: 'Baru Aktif', color: 'blue', hours: hoursAgo };
    } else if (hoursAgo < 24) {
      return { status: 'today', label: `${hoursAgo} jam lalu`, color: 'yellow', hours: hoursAgo };
    } else if (hoursAgo < 24 * 7) {
      const daysAgo = Math.floor(hoursAgo / 24);
      return { status: 'week', label: `${daysAgo} hari lalu`, color: 'orange', hours: hoursAgo };
    } else {
      const daysAgo = Math.floor(hoursAgo / 24);
      return { status: 'old', label: `${daysAgo} hari lalu`, color: 'red', hours: hoursAgo };
    }
  }, []);

  const shouldShowWarning = finalDevices.length > 5;
  const hasOldDevices = finalDevices.some(device => {
    const status = getDeviceStatus(device);
    return status.hours > 24 * 30; // 30 days
  });

  const formatLastActive = useCallback((dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { 
        addSuffix: true,
        locale: id
      });
    } catch (err) {
      return 'Baru saja';
    }
  }, []);

  if (finalIsLoading && !isRefreshing) {
    const { LoadingStates } = require('@/components/ui/loading-spinner');
    return (
      <div className="p-6">
        <LoadingStates.Page />
      </div>
    );
  }

  if (finalError) {
    const errorMessage = finalError instanceof Error ? finalError.message : (typeof finalError === 'string' ? finalError : 'Terjadi kesalahan');
    return (
      <Card>
        <CardHeader>
          <CardTitle>Kesalahan</CardTitle>
          <CardDescription>{errorMessage}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => refetchPaginated()}>Coba Lagi</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-0">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Manajemen Perangkat</h1>
        <p className="text-gray-600 mt-2 text-sm md:text-base">
          Kelola perangkat yang saat ini masuk ke akun Anda
        </p>
        
        {/* Kontrol Paginasi */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
          <div className="flex flex-col space-y-3 md:flex-row md:items-center md:justify-between md:space-y-0">
            <div className="flex items-center space-x-3">
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-3 py-1 border border-gray-300 rounded text-sm"
              >
                <option value={5}>5 per halaman</option>
                <option value={10}>10 per halaman</option>
                <option value={20}>20 per halaman</option>
              </select>
            </div>

            <div className="text-sm text-gray-600">
              Total: {paginationInfo.totalCount} perangkat
            </div>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center md:space-y-0">
            <div>
              <CardTitle className="flex flex-wrap items-center gap-2 text-lg md:text-xl">
                Perangkat Aktif
                <Badge variant={shouldShowWarning ? 'destructive' : 'secondary'} className="text-xs">
                  {finalDevices.length} perangkat
                </Badge>
                {shouldShowWarning && (
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                )}
              </CardTitle>
              <CardDescription className="flex flex-col space-y-2 md:flex-row md:items-center md:gap-2 md:space-y-0 text-sm">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Status perangkat aktif
                </div>
                {shouldShowWarning && (
                  <span className="text-orange-600 flex items-center gap-1 text-xs md:text-sm">
                    <AlertTriangle className="h-3 w-3" />
                    Terlalu banyak perangkat - pertimbangkan untuk membersihkan
                  </span>
                )}
                {hasOldDevices && (
                  <span className="text-red-600 flex items-center gap-1 text-xs md:text-sm">
                    <Clock className="h-3 w-3" />
                    Ada perangkat tidak aktif {'>'} 30 hari
                  </span>
                )}
              </CardDescription>
            </div>
            <div className="flex flex-col space-y-2 md:flex-row md:gap-2 md:space-y-0">
              {finalDevices.length > 1 && (
                <Button 
                  variant="outline" 
                  onClick={handleRemoveAllOtherDevices}
                  disabled={isCleaningUp || isRefreshing}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs md:text-sm w-full md:w-auto"
                >
                  {isCleaningUp ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500 mr-2"></div>
                      <span className="hidden md:inline">Membersihkan...</span>
                      <span className="md:hidden">Keluar Semua</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      <span className="hidden md:inline">Keluar dari Semua Perangkat</span>
                      <span className="md:hidden">Keluar Semua</span>
                    </>
                  )}
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={handleRefreshDevices}
                disabled={isRefreshing || isCleaningUp}
                className="flex items-center gap-2 text-xs md:text-sm w-full md:w-auto"
              >
                {isRefreshing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500 mr-2"></div>
                    Memperbarui...
                  </>
                ) : (
                  'Perbarui Daftar'
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {finalDevices.length === 0 ? (
            <div className="text-center py-8">
              <SmartphoneCharging className="h-8 w-8 md:h-12 md:w-12 text-gray-400 mx-auto" />
              <p className="mt-4 text-gray-600 text-sm md:text-base">Tidak ada perangkat aktif</p>
            </div>
          ) : (
            <div className="space-y-3 md:space-y-4">
              {finalDevices.map((device) => {
                const status = getDeviceStatus(device);
                
                return (
                  <div 
                    key={device.id} 
                    className={`p-3 md:p-4 rounded-lg border transition-all duration-200 ${
                      device.is_current 
                        ? 'border-orange-200 bg-orange-50 shadow-sm' 
                        : status.status === 'old' 
                        ? 'border-red-200 bg-red-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex flex-col space-y-3 md:flex-row md:items-start md:justify-between md:space-y-0">
                      <div className="flex items-start space-x-3 md:space-x-4 flex-1">
                        <div className={`p-2 rounded-full relative flex-shrink-0 ${
                          device.is_current ? 'bg-orange-100' : 
                          status.status === 'old' ? 'bg-red-100' : 'bg-gray-100'
                        }`}>
                          {getDeviceIcon(device.device_type || undefined)}
                          {/* Status indicator dot */}
                          <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                            status.status === 'current' ? 'bg-green-500' :
                            status.status === 'recent' ? 'bg-blue-500' :
                            status.status === 'today' ? 'bg-yellow-500' :
                            status.status === 'week' ? 'bg-orange-500' : 'bg-red-500'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col space-y-2 md:flex-row md:items-center md:space-x-2 md:space-y-0 mb-2">
                            {editingDeviceId === device.id ? (
                              <div className="flex items-center space-x-2">
                                <Input
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  className="h-8 w-full md:w-48"
                                  placeholder="Nama perangkat"
                                  autoFocus
                                />
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleSaveName(device.id)}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={handleCancelEdit}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center space-x-2">
                                  <h3 className="font-medium text-gray-900 text-sm md:text-base truncate">
                                    {device.device_name || `${device.os} ${device.device_type}`}
                                  </h3>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleEditName(device.id, device.device_name || '')}
                                    className="flex-shrink-0"
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                  {device.is_current && (
                                    <Badge variant="default" className="bg-orange-600 text-xs">
                                      <Shield className="h-3 w-3 mr-1" />
                                      <span className="hidden md:inline">Perangkat Saat Ini</span>
                                      <span className="md:hidden">Aktif</span>
                                    </Badge>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                          
                          {/* Enhanced device information */}
                          <div className="space-y-1 text-xs md:text-sm">
                            <div className="flex flex-col space-y-1 md:flex-row md:items-center md:gap-4 text-gray-600">
                              <span className="flex items-center gap-1">
                                <Monitor className="h-3 w-3" />
                                <span className="truncate">{device.browser} di {device.os}</span>
                              </span>
                              <span className={`flex items-center gap-1 font-medium ${
                                status.color === 'green' ? 'text-green-600' :
                                status.color === 'blue' ? 'text-blue-600' :
                                status.color === 'yellow' ? 'text-yellow-600' :
                                status.color === 'orange' ? 'text-orange-600' : 'text-red-600'
                              }`}>
                                <Activity className="h-3 w-3" />
                                {status.label}
                              </span>
                            </div>
                            
                            {/* Device ID for debugging */}
                            {import.meta.env.DEV && (
                              <div className="text-xs text-gray-400 font-mono truncate">
                                ID: {device.device_id?.substring(0, 20)}...
                              </div>
                            )}
                            
                            {status.hours > 24 * 30 && (
                              <div className="flex items-center gap-1 text-red-600 text-xs">
                                <Clock className="h-3 w-3" />
                                Perangkat tidak aktif lebih dari 30 hari
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        {!device.is_current && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveDevice(device.id)}
                            className={`text-xs md:text-sm w-full md:w-auto ${
                              status.status === 'old' 
                                ? 'text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200'
                                : 'text-gray-600 hover:text-gray-700'
                            }`}
                          >
                            <LogOut className="h-4 w-4 mr-2" />
                            <span className="hidden md:inline">Keluarkan</span>
                            <span className="md:hidden">Keluar</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">Keamanan</CardTitle>
          <CardDescription className="text-sm md:text-base">
            Tindakan keamanan untuk melindungi akun Anda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-sm md:text-base">Aktivitas Mencurigakan?</h3>
              <p className="text-xs md:text-sm text-gray-600 mt-1">
                Jika Anda melihat aktivitas mencurigakan, segera ubah kata sandi Anda.
              </p>
              <Button 
                variant="outline" 
                className="mt-2 text-xs md:text-sm w-full md:w-auto"
                onClick={() => {
                  // This would navigate to password change page
                  // For now, we'll just show an alert
                  alert('Fitur ini akan mengarahkan Anda ke halaman ubah kata sandi.');
                }}
              >
                Ubah Kata Sandi
              </Button>
            </div>
          </div>
        </CardContent>
        </Card>
        
        {/* PAGINATION CONTROLS */}
        {paginationInfo.totalPages > 1 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
                <div className="text-sm text-gray-600">
                  Halaman {currentPage} dari {paginationInfo.totalPages} • 
                  Total {paginationInfo.totalCount} perangkat
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1 || isPaginatedLoading}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Sebelumnya
                  </Button>
                  
                  <span className="px-3 py-1 text-sm bg-gray-100 rounded">
                    {currentPage}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(paginationInfo.totalPages, prev + 1))}
                    disabled={currentPage === paginationInfo.totalPages || isPaginatedLoading}
                  >
                    Selanjutnya
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
  );
};

export default DeviceManagementPage;
