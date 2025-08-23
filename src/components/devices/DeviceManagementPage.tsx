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
  Trash2
} from 'lucide-react';
import { useDevice } from '@/contexts/DeviceContext';
import { logger } from '@/utils/logger';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

const DeviceManagementPage: React.FC = () => {
  const { devices, currentDevice, loading, error, refreshDevices, updateDeviceName, removeDevice, removeAllOtherDevices } = useDevice();
  const [editingDeviceId, setEditingDeviceId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

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

  const getDeviceAccuracyScore = useCallback((device: any) => {
    let score = 100;
    
    // Deduct points for missing information
    if (!device.device_name || device.device_name === 'Unknown Device') score -= 20;
    if (!device.os || device.os === 'Unknown') score -= 15;
    if (!device.browser || device.browser === 'Unknown') score -= 15;
    if (!device.device_type) score -= 10;
    
    // Deduct points for old devices
    const status = getDeviceStatus(device);
    if (status.status === 'old') score -= 20;
    if (status.status === 'week') score -= 10;
    
    return Math.max(score, 0);
  }, [getDeviceStatus]);

  const getAccuracyColor = useCallback((score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  }, []);

  const shouldShowWarning = devices.length > 5;
  const hasOldDevices = devices.some(device => {
    const status = getDeviceStatus(device);
    return status.hours > 24 * 30; // 30 days
  });

  const overallAccuracy = devices.length > 0 
    ? Math.round(devices.reduce((sum, device) => sum + getDeviceAccuracyScore(device), 0) / devices.length)
    : 0;

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

  if (loading && !isRefreshing) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat daftar perangkat...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Kesalahan</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleRefreshDevices}>Coba Lagi</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Manajemen Perangkat</h1>
        <p className="text-gray-600 mt-2">
          Kelola perangkat yang saat ini masuk ke akun Anda
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                Perangkat Aktif
                <Badge variant={shouldShowWarning ? 'destructive' : 'secondary'}>
                  {devices.length} perangkat
                </Badge>
                {shouldShowWarning && (
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                )}
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Akurasi identifikasi: 
                <span className={`font-medium ${getAccuracyColor(overallAccuracy)}`}>
                  {overallAccuracy}%
                </span>
                {shouldShowWarning && (
                  <span className="text-orange-600 ml-2 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Terlalu banyak perangkat - pertimbangkan untuk membersihkan
                  </span>
                )}
                {hasOldDevices && (
                  <span className="text-red-600 ml-2 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Ada perangkat tidak aktif {'>'} 30 hari
                  </span>
                )}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {devices.length > 1 && (
                <Button 
                  variant="outline" 
                  onClick={handleRemoveAllOtherDevices}
                  disabled={isCleaningUp || isRefreshing}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  {isCleaningUp ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500 mr-2"></div>
                      Membersihkan...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Keluar dari Semua Perangkat
                    </>
                  )}
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={handleRefreshDevices}
                disabled={isRefreshing || isCleaningUp}
                className="flex items-center gap-2"
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
          {devices.length === 0 ? (
            <div className="text-center py-8">
              <SmartphoneCharging className="h-12 w-12 text-gray-400 mx-auto" />
              <p className="mt-4 text-gray-600">Tidak ada perangkat aktif</p>
            </div>
          ) : (
            <div className="space-y-4">
              {devices.map((device) => {
                const status = getDeviceStatus(device);
                const accuracy = getDeviceAccuracyScore(device);
                
                return (
                  <div 
                    key={device.id} 
                    className={`p-4 rounded-lg border transition-all duration-200 ${
                      device.is_current 
                        ? 'border-orange-200 bg-orange-50 shadow-sm' 
                        : status.status === 'old' 
                        ? 'border-red-200 bg-red-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className={`p-2 rounded-full relative ${
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
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            {editingDeviceId === device.id ? (
                              <div className="flex items-center space-x-2">
                                <Input
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  className="h-8 w-48"
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
                                <h3 className="font-medium text-gray-900">
                                  {device.device_name || `${device.os} ${device.device_type}`}
                                </h3>
                                {device.is_current && (
                                  <Badge variant="default" className="bg-orange-600">
                                    <Shield className="h-3 w-3 mr-1" />
                                    Perangkat Saat Ini
                                  </Badge>
                                )}
                                <Badge 
                                  variant="outline" 
                                  className={`${getAccuracyColor(accuracy)} border-current`}
                                >
                                  {accuracy}% akurat
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEditName(device.id, device.device_name || '')}
                                  className="ml-2"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                          
                          {/* Enhanced device information */}
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-4 text-gray-600">
                              <span className="flex items-center gap-1">
                                <Monitor className="h-3 w-3" />
                                {device.browser} di {device.os}
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
                              <div className="text-xs text-gray-400 font-mono">
                                ID: {device.device_id?.substring(0, 20)}...
                              </div>
                            )}
                            
                            {/* Additional accuracy details */}
                            {accuracy < 70 && (
                              <div className="flex items-center gap-1 text-yellow-600 text-xs">
                                <AlertTriangle className="h-3 w-3" />
                                Informasi perangkat tidak lengkap - akurasi rendah
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
                      <div className="flex flex-col gap-2">
                        {!device.is_current && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveDevice(device.id)}
                            className={`${
                              status.status === 'old' 
                                ? 'text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200'
                                : 'text-gray-600 hover:text-gray-700'
                            }`}
                          >
                            <LogOut className="h-4 w-4 mr-2" />
                            Keluarkan
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
          <CardTitle>Keamanan</CardTitle>
          <CardDescription>
            Tindakan keamanan untuk melindungi akun Anda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">Aktivitas Mencurigakan?</h3>
              <p className="text-sm text-gray-600 mt-1">
                Jika Anda melihat aktivitas mencurigakan, segera ubah kata sandi Anda.
              </p>
              <Button 
                variant="outline" 
                className="mt-2"
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
    </div>
  );
};

export default DeviceManagementPage;