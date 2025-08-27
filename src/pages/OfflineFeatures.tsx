import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  WifiOff, 
  Calculator, 
  FileText, 
  Database, 
  Sync,
  Info,
  CheckCircle,
  Clock
} from 'lucide-react';
import { usePWA } from '@/utils/pwaUtils';
import { syncQueueStorage } from '@/utils/offlineStorage';
import OfflineCalculator from '@/components/offline/OfflineCalculator';
import OfflineDraftOrders from '@/components/offline/OfflineDraftOrders';
import CachedDataViewer from '@/components/offline/CachedDataViewer';

export default function OfflineFeatures() {
  const { isOnline } = usePWA();
  const [syncQueue] = useState(syncQueueStorage.getQueue());
  const pendingOperations = syncQueueStorage.getPendingOperations();
  const failedOperations = syncQueueStorage.getFailedOperations();

  const offlineCapabilities = [
    {
      icon: Calculator,
      title: 'Kalkulator Offline',
      description: 'Hitung HPP, profit, dan operasi matematika dengan history lengkap',
      features: ['HPP Calculator', 'Basic Math', 'Profit Calculator', 'Export History']
    },
    {
      icon: FileText,
      title: 'Draft Orders',
      description: 'Buat dan kelola draft orders yang akan disync ketika online',
      features: ['Create Orders', 'Edit Drafts', 'Auto Sync Queue', 'Customer Management']
    },
    {
      icon: Database,
      title: 'Cached Data Viewer',
      description: 'Lihat data warehouse, orders, dan recipes yang tersimpan secara offline',
      features: ['Read-Only Access', 'Search & Filter', 'Last Update Info', 'Multi-Category']
    },
    {
      icon: Sync,
      title: 'Background Sync',
      description: 'Sistem antrian otomatis yang akan mensinkronisasi data ketika online',
      features: ['Auto Queue', 'Priority System', 'Retry Logic', 'Status Tracking']
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fitur Offline</h1>
          <p className="text-gray-600 mt-1">
            Kelola data dan lakukan perhitungan meskipun tanpa koneksi internet
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge 
            variant={isOnline ? 'default' : 'secondary'} 
            className={isOnline ? 'bg-green-600' : 'bg-amber-600'}
          >
            {isOnline ? (
              <>
                <CheckCircle className="h-3 w-3 mr-1" />
                Online
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3 mr-1" />
                Offline
              </>
            )}
          </Badge>
          {pendingOperations.length > 0 && (
            <Badge variant="outline" className="text-amber-600">
              <Clock className="h-3 w-3 mr-1" />
              {pendingOperations.length} Pending Sync
            </Badge>
          )}
        </div>
      </div>

      {/* Connection Status Card */}
      <Card className={`border-2 ${isOnline ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isOnline ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : (
                <WifiOff className="h-6 w-6 text-amber-600" />
              )}
              <div>
                <h3 className={`font-semibold ${isOnline ? 'text-green-800' : 'text-amber-800'}`}>
                  {isOnline ? 'Mode Online' : 'Mode Offline'}
                </h3>
                <p className={`text-sm ${isOnline ? 'text-green-700' : 'text-amber-700'}`}>
                  {isOnline 
                    ? 'Semua fitur tersedia dan data akan tersinkronisasi otomatis'
                    : 'Menggunakan data lokal - semua perubahan akan disync ketika online'
                  }
                </p>
              </div>
            </div>
            {!isOnline && pendingOperations.length > 0 && (
              <div className="text-right">
                <div className="text-sm font-medium text-amber-800">
                  {pendingOperations.length} operasi menunggu sync
                </div>
                <div className="text-xs text-amber-700">
                  Akan otomatis tersinkronisasi ketika online
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Offline Capabilities Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Kemampuan Offline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {offlineCapabilities.map((capability, index) => {
              const Icon = capability.icon;
              return (
                <div key={index} className="flex gap-4 p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex-shrink-0">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Icon className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">{capability.title}</h4>
                    <p className="text-sm text-gray-600 mb-2">{capability.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {capability.features.map((feature, fIndex) => (
                        <Badge key={fIndex} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs defaultValue="calculator" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="calculator" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            <span className="hidden sm:inline">Kalkulator</span>
          </TabsTrigger>
          <TabsTrigger value="drafts" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Draft Orders</span>
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span className="hidden sm:inline">Data Viewer</span>
          </TabsTrigger>
          <TabsTrigger value="sync" className="flex items-center gap-2">
            <Sync className="h-4 w-4" />
            <span className="hidden sm:inline">Sync Status</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calculator">
          <OfflineCalculator />
        </TabsContent>

        <TabsContent value="drafts">
          <OfflineDraftOrders />
        </TabsContent>

        <TabsContent value="data">
          <CachedDataViewer />
        </TabsContent>

        <TabsContent value="sync">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sync className="h-5 w-5" />
                Status Sinkronisasi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Sync Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-blue-50">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">{syncQueue.length}</div>
                      <div className="text-sm text-blue-700">Total Queue</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-amber-50">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-amber-600">{pendingOperations.length}</div>
                      <div className="text-sm text-amber-700">Pending</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-red-50">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-red-600">{failedOperations.length}</div>
                      <div className="text-sm text-red-700">Failed</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Sync Queue Details */}
                {syncQueue.length > 0 ? (
                  <div className="space-y-3">
                    <h4 className="font-semibold">Antrian Sinkronisasi:</h4>
                    {syncQueue.map((operation: any) => (
                      <Card key={operation.id} className="hover:bg-gray-50">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{operation.type}</div>
                              <div className="text-sm text-gray-600">
                                {operation.endpoint} • {operation.method}
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge 
                                variant={operation.attempts >= operation.maxAttempts ? 'destructive' : 'secondary'}
                              >
                                {operation.attempts >= operation.maxAttempts ? 'Failed' : 'Pending'}
                              </Badge>
                              <div className="text-xs text-gray-500 mt-1">
                                Attempts: {operation.attempts}/{operation.maxAttempts}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <Sync className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Tidak ada operasi dalam antrian</p>
                    <p className="text-sm">
                      {isOnline ? 'Semua data sudah tersinkronisasi' : 'Operasi akan muncul ketika ada aktivitas offline'}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
