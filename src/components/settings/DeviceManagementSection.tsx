// src/components/settings/DeviceManagementSection.tsx
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useDeviceSync } from '@/contexts/DeviceSyncContext';
import { DeviceManager } from '@/components/device/DeviceManager';
import { Laptop, Smartphone, Tablet, Monitor, SmartphoneCharging, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

interface DeviceManagementSectionProps {
  className?: string;
}

const DeviceManagementSection: React.FC<DeviceManagementSectionProps> = ({
  className = ''
}) => {
  const {
    currentDevice,
    userDevices,
    pendingOperations,
    isOnline,
    isLoading,
    syncPendingOperations,
    refreshDevices
  } = useDeviceSync();

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

  const formatLastActive = (lastActive: string) => {
    try {
      return formatDistanceToNow(new Date(lastActive), {
        addSuffix: true,
        locale: id
      });
    } catch {
      return 'Tidak diketahui';
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Manajemen Perangkat & Sinkronisasi</CardTitle>
        <CardDescription>
          Kelola perangkat yang terhubung dan pantau status sinkronisasi data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Current Device Info */}
          {currentDevice && (
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-full bg-blue-100">
                  {getDeviceIcon(currentDevice.device_type)}
                </div>
                <div>
                  <p className="font-medium text-blue-900">
                    {currentDevice.device_name}
                  </p>
                  <p className="text-sm text-blue-700">
                    {currentDevice.browser} • {currentDevice.os}
                  </p>
                  <p className="text-xs text-blue-600">
                    Aktif {formatLastActive(currentDevice.last_active)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-xs text-gray-600">
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          )}

          {/* Sync Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-white border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {userDevices.filter(d => d.is_active).length}
              </div>
              <div className="text-sm text-gray-600">Perangkat Aktif</div>
            </div>

            <div className="text-center p-3 bg-white border rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {pendingOperations.length}
              </div>
              <div className="text-sm text-gray-600">Operasi Pending</div>
            </div>

            <div className="text-center p-3 bg-white border rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {userDevices.length}
              </div>
              <div className="text-sm text-gray-600">Total Perangkat</div>
            </div>
          </div>

          {/* Pending Operations Alert */}
          {pendingOperations.length > 0 && (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-orange-900">
                    {pendingOperations.length} Operasi Menunggu Sinkronisasi
                  </h4>
                  <p className="text-sm text-orange-700 mt-1">
                    Data belum tersinkron ke perangkat lain
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={syncPendingOperations}
                  disabled={!isOnline || isLoading}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Sinkronkan
                </Button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <DeviceManager
              trigger={
                <Button variant="outline" className="flex-1">
                  <Monitor className="h-4 w-4 mr-2" />
                  Kelola Perangkat
                </Button>
              }
            />

            <Button
              variant="outline"
              onClick={refreshDevices}
              disabled={isLoading}
              className="flex-1"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Help Text */}
          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
            <strong>Tips:</strong> Maksimal 5 perangkat aktif secara bersamaan.
            Perangkat yang tidak aktif selama 30 hari akan otomatis dinonaktifkan.
            Data tersimpan aman dengan enkripsi dan backup otomatis.
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DeviceManagementSection;