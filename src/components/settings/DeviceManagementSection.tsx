// src/components/settings/DeviceManagementSection.tsx
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useDeviceManagement } from '@/hooks/useDeviceManagement';
import { Laptop, Smartphone, Tablet, Monitor, SmartphoneCharging } from 'lucide-react';

interface DeviceManagementSectionProps {
  className?: string;
}

const DeviceManagementSection: React.FC<DeviceManagementSectionProps> = ({ 
  className = ''
}) => {
  const { deviceCount, hasMultipleDevices, currentDevice } = useDeviceManagement();

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

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Manajemen Perangkat</CardTitle>
        <CardDescription>
          Kelola perangkat yang saat ini masuk ke akun Anda
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-full bg-orange-100">
                {getDeviceIcon(currentDevice?.device_type)}
              </div>
              <div>
                <p className="font-medium">
                  {currentDevice?.device_name || `${currentDevice?.os} ${currentDevice?.device_type}`}
                </p>
                <p className="text-sm text-gray-600">
                  Perangkat saat ini
                </p>
              </div>
            </div>
            <Button variant="outline" asChild>
              <a href="/devices">Lihat Semua</a>
            </Button>
          </div>
          
          <div className="pt-2 border-t">
            <p className="text-sm text-gray-600">
              Total {deviceCount} perangkat aktif
              {hasMultipleDevices && ' - Anda masuk di beberapa perangkat'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DeviceManagementSection;