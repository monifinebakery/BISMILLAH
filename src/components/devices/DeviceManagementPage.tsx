// src/components/devices/DeviceManagementPage.tsx
import React, { useState, useEffect } from 'react';
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
  X
} from 'lucide-react';
import { useDevice } from '@/contexts/DeviceContext';
import { logger } from '@/utils/logger';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

const DeviceManagementPage: React.FC = () => {
  const { devices, currentDevice, loading, error, refreshDevices, updateDeviceName, removeDevice } = useDevice();
  const [editingDeviceId, setEditingDeviceId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const loadDevices = async () => {
      setIsRefreshing(true);
      try {
        await refreshDevices();
      } catch (err) {
        logger.error('Error loading devices:', err);
      } finally {
        setIsRefreshing(false);
      }
    };

    loadDevices();
  }, [refreshDevices]);

  const handleEditName = (deviceId: string, currentName: string) => {
    setEditingDeviceId(deviceId);
    setEditName(currentName || '');
  };

  const handleSaveName = async (deviceId: string) => {
    try {
      const success = await updateDeviceName(deviceId, editName.trim());
      if (success) {
        setEditingDeviceId(null);
        setEditName('');
      }
    } catch (err) {
      logger.error('Error saving device name:', err);
    }
  };

  const handleCancelEdit = () => {
    setEditingDeviceId(null);
    setEditName('');
  };

  const handleRemoveDevice = async (deviceId: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus perangkat ini? Jika ini adalah perangkat saat ini, Anda akan keluar dari akun.')) {
      try {
        await removeDevice(deviceId);
      } catch (err) {
        logger.error('Error removing device:', err);
      }
    }
  };

  const getDeviceIcon = (deviceType?: string) => {
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
  };

  const formatLastActive = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { 
        addSuffix: true,
        locale: id
      });
    } catch (err) {
      return 'Baru saja';
    }
  };

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
          <Button onClick={() => refreshDevices()}>Coba Lagi</Button>
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
              <CardTitle>Perangkat Aktif</CardTitle>
              <CardDescription>
                {devices.length} perangkat saat ini masuk ke akun Anda
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              onClick={() => refreshDevices()}
              disabled={isRefreshing}
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
        </CardHeader>
        <CardContent>
          {devices.length === 0 ? (
            <div className="text-center py-8">
              <SmartphoneCharging className="h-12 w-12 text-gray-400 mx-auto" />
              <p className="mt-4 text-gray-600">Tidak ada perangkat aktif</p>
            </div>
          ) : (
            <div className="space-y-4">
              {devices.map((device) => (
                <div 
                  key={device.id} 
                  className={`p-4 rounded-lg border ${device.is_current ? 'border-orange-200 bg-orange-50' : 'border-gray-200'}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className={`p-2 rounded-full ${device.is_current ? 'bg-orange-100' : 'bg-gray-100'}`}>
                        {getDeviceIcon(device.device_type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          {editingDeviceId === device.id ? (
                            <div className="flex items-center space-x-2">
                              <Input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="h-8 w-48"
                                placeholder="Nama perangkat"
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
                              <h3 className="font-medium">
                                {device.device_name || `${device.os} ${device.device_type}`}
                              </h3>
                              {device.is_current && (
                                <Badge variant="secondary">Perangkat Saat Ini</Badge>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditName(device.id, device.device_name || '')}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                        <div className="mt-2 text-sm text-gray-600">
                          <p>{device.browser} di {device.os}</p>
                          <p className="mt-1">
                            Terakhir aktif {formatLastActive(device.last_active)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div>
                      {!device.is_current && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveDevice(device.id)}
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Keluarkan
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
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
              <h3 className="font-medium">Keluar dari Semua Perangkat</h3>
              <p className="text-sm text-gray-600 mt-1">
                Keluar dari akun Anda di semua perangkat, termasuk perangkat saat ini.
              </p>
              <Button 
                variant="destructive" 
                className="mt-2"
                onClick={async () => {
                  if (window.confirm('Apakah Anda yakin ingin keluar dari semua perangkat?')) {
                    try {
                      // This would be implemented in your auth context
                      // await performGlobalSignOut();
                      // For now, we'll just refresh the devices list
                      await refreshDevices();
                    } catch (err) {
                      logger.error('Error signing out from all devices:', err);
                    }
                  }
                }}
              >
                Keluar dari Semua Perangkat
              </Button>
            </div>
            
            <Separator />
            
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