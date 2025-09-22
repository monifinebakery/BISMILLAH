// src/components/device/DeviceManager.tsx
import React, { useState } from 'react';
import { useDeviceSync } from '@/contexts/DeviceSyncContext';
import { DeviceRecord } from '@/services/deviceService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Monitor,
  Smartphone,
  Tablet,
  Trash2,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'sonner';

interface DeviceManagerProps {
  trigger?: React.ReactNode;
  className?: string;
}

export const DeviceManager: React.FC<DeviceManagerProps> = ({
  trigger,
  className = ''
}) => {
  const {
    currentDevice,
    userDevices,
    isLoading,
    pendingOperations,
    isOnline,
    refreshDevices,
    deactivateDeviceById,
    syncPendingOperations
  } = useDeviceSync();

  const [isOpen, setIsOpen] = useState(false);
  const [deactivatingDevice, setDeactivatingDevice] = useState<string | null>(null);

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'desktop': return <Monitor className="h-5 w-5" />;
      case 'mobile': return <Smartphone className="h-5 w-5" />;
      case 'tablet': return <Tablet className="h-5 w-5" />;
      default: return <Monitor className="h-5 w-5" />;
    }
  };

  const getStatusColor = (device: DeviceRecord) => {
    if (device.isCurrentDevice) return 'bg-green-100 text-green-800';
    if (device.is_active) return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (device: DeviceRecord) => {
    if (device.isCurrentDevice) return 'Aktif';
    if (device.is_active) return 'Terhubung';
    return 'Nonaktif';
  };

  const handleDeactivateDevice = async (device: DeviceRecord) => {
    if (device.isCurrentDevice) {
      toast.error('Tidak dapat menonaktifkan perangkat yang sedang digunakan');
      return;
    }

    setDeactivatingDevice(device.id);
    try {
      const success = await deactivateDeviceById(device.device_id);
      if (success) {
        toast.success(`Perangkat "${device.device_name}" berhasil dinonaktifkan`);
      }
    } catch (error) {
      toast.error('Gagal menonaktifkan perangkat');
    } finally {
      setDeactivatingDevice(null);
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

  const defaultTrigger = (
    <Button variant="outline" size="sm" className="gap-2">
      <Monitor className="h-4 w-4" />
      Kelola Perangkat
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[600px] max-w-[95vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Kelola Perangkat Terhubung
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Connection Status */}
          <Alert className={isOnline ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
            <div className="flex items-center gap-2">
              {isOnline ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={isOnline ? "text-green-800" : "text-red-800"}>
                {isOnline ? 'Terhubung ke internet - Sinkronisasi aktif' : 'Offline - Data tersimpan lokal'}
              </AlertDescription>
            </div>
          </Alert>

          {/* Pending Operations */}
          {pendingOperations.length > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2 text-orange-800">
                  <Clock className="h-4 w-4" />
                  Operasi Pending Sinkronisasi
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <p className="text-sm text-orange-700">
                    {pendingOperations.length} operasi belum disinkronkan ke perangkat lain
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={syncPendingOperations}
                    disabled={!isOnline || isLoading}
                    className="border-orange-300 text-orange-700 hover:bg-orange-100"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Sinkronkan Sekarang
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Current Device Info */}
          {currentDevice && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-green-800">Perangkat Saat Ini</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-3">
                  {getDeviceIcon(currentDevice.device_type)}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-green-900">{currentDevice.device_name}</div>
                    <div className="text-xs text-green-700">
                      {currentDevice.browser} • {currentDevice.os}
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Aktif
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Device List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900">
                Semua Perangkat ({userDevices.length})
              </h3>
              <Button
                size="sm"
                variant="outline"
                onClick={refreshDevices}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {userDevices.map((device) => (
                <Card key={device.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {getDeviceIcon(device.device_type)}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {device.device_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {device.browser} • {device.os}
                        </div>
                        <div className="text-xs text-gray-400">
                          Aktif {formatLastActive(device.last_active)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(device)}>
                        {getStatusText(device)}
                      </Badge>

                      {!device.isCurrentDevice && device.is_active && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeactivateDevice(device)}
                          disabled={deactivatingDevice === device.id}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className={`h-4 w-4 ${deactivatingDevice === device.id ? 'animate-spin' : ''}`} />
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}

              {userDevices.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Monitor className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Tidak ada perangkat terdaftar</p>
                </div>
              )}
            </div>
          </div>

          {/* Help Text */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Tips:</strong> Pastikan tidak lebih dari 5 perangkat aktif secara bersamaan untuk performa optimal.
              Perangkat yang tidak aktif selama 30 hari akan otomatis dinonaktifkan.
            </AlertDescription>
          </Alert>
        </div>
      </DialogContent>
    </Dialog>
  );
};
