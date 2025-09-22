// src/components/device/ConflictResolver.tsx
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  GitMerge,
  Smartphone,
  Monitor,
  Tablet,
  Clock,
  User,
  AlertTriangle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

export interface ConflictData {
  entityType: 'operational_cost' | 'recipe' | 'settings';
  entityId: string;
  entityName: string;
  localData: any;
  remoteData: any;
  localDevice: {
    id: string;
    name: string;
    type: 'desktop' | 'mobile' | 'tablet';
  };
  remoteDevice: {
    id: string;
    name: string;
    type: 'desktop' | 'mobile' | 'tablet';
  };
  timestamp: string;
}

interface ConflictResolverProps {
  isOpen: boolean;
  conflict: ConflictData | null;
  onResolve: (resolution: 'local' | 'remote' | 'merge') => void;
  onCancel: () => void;
  isResolving?: boolean;
}

export const ConflictResolver: React.FC<ConflictResolverProps> = ({
  isOpen,
  conflict,
  onResolve,
  onCancel,
  isResolving = false
}) => {
  const [selectedResolution, setSelectedResolution] = useState<'local' | 'remote' | 'merge' | null>(null);

  if (!conflict) return null;

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'desktop': return <Monitor className="h-4 w-4" />;
      case 'mobile': return <Smartphone className="h-4 w-4" />;
      case 'tablet': return <Tablet className="h-4 w-4" />;
      default: return <Monitor className="h-4 w-4" />;
    }
  };

  const formatLastModified = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), {
        addSuffix: true,
        locale: id
      });
    } catch {
      return 'Tidak diketahui';
    }
  };

  const renderDataComparison = (localData: any, remoteData: any) => {
    // Render different comparison based on entity type
    switch (conflict.entityType) {
      case 'operational_cost':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Nama Biaya</h4>
              <p className="text-sm text-gray-600">{localData.nama_biaya || 'Tidak ada'}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Nama Biaya</h4>
              <p className="text-sm text-gray-600">{remoteData.nama_biaya || 'Tidak ada'}</p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Jumlah per Bulan</h4>
              <p className="text-sm text-gray-600">
                Rp {(localData.jumlah_per_bulan || 0).toLocaleString('id-ID')}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Jumlah per Bulan</h4>
              <p className="text-sm text-gray-600">
                Rp {(remoteData.jumlah_per_bulan || 0).toLocaleString('id-ID')}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Jenis</h4>
              <Badge variant={localData.jenis === 'tetap' ? 'default' : 'secondary'}>
                {localData.jenis === 'tetap' ? 'Tetap' : 'Variabel'}
              </Badge>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Jenis</h4>
              <Badge variant={remoteData.jenis === 'tetap' ? 'default' : 'secondary'}>
                {remoteData.jenis === 'tetap' ? 'Tetap' : 'Variabel'}
              </Badge>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center text-gray-500">
            <p>Detail perbandingan data tidak tersedia untuk tipe ini</p>
          </div>
        );
    }
  };

  const handleResolve = () => {
    if (selectedResolution) {
      onResolve(selectedResolution);
      setSelectedResolution(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => !isResolving && onCancel()}>
      <DialogContent className="sm:max-w-[700px] max-w-[95vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitMerge className="h-5 w-5 text-orange-600" />
            Konflik Data Terdeteksi
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Conflict Description */}
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-orange-800">
              <strong>{conflict.entityName}</strong> telah diubah di dua perangkat berbeda.
              Pilih versi mana yang ingin dipertahankan atau gabungkan keduanya.
            </AlertDescription>
          </Alert>

          {/* Device Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  {getDeviceIcon(conflict.localDevice.type)}
                  <div>
                    <div className="font-medium text-green-900">Perangkat Anda</div>
                    <div className="text-sm text-green-700">{conflict.localDevice.name}</div>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800">
                  <Clock className="h-3 w-3 mr-1" />
                  Versi Anda
                </Badge>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  {getDeviceIcon(conflict.remoteDevice.type)}
                  <div>
                    <div className="font-medium text-blue-900">{conflict.remoteDevice.name}</div>
                    <div className="text-sm text-blue-700">
                      Diedit {formatLastModified(conflict.timestamp)}
                    </div>
                  </div>
                </div>
                <Badge className="bg-blue-100 text-blue-800">
                  <User className="h-3 w-3 mr-1" />
                  Versi Lain
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* Data Comparison */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Perbandingan Data
              </h3>
              {renderDataComparison(conflict.localData, conflict.remoteData)}
            </CardContent>
          </Card>

          {/* Resolution Options */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-gray-900">Pilih Resolusi:</h3>

            <div className="space-y-2">
              <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="resolution"
                  value="local"
                  checked={selectedResolution === 'local'}
                  onChange={() => setSelectedResolution('local')}
                  className="text-green-600"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Gunakan Versi Anda</div>
                  <div className="text-sm text-gray-600">
                    Pertahankan perubahan yang Anda buat, abaikan perubahan dari perangkat lain
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="resolution"
                  value="remote"
                  checked={selectedResolution === 'remote'}
                  onChange={() => setSelectedResolution('remote')}
                  className="text-blue-600"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Gunakan Versi Perangkat Lain</div>
                  <div className="text-sm text-gray-600">
                    Terima perubahan dari perangkat lain, ganti versi Anda
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="resolution"
                  value="merge"
                  checked={selectedResolution === 'merge'}
                  onChange={() => setSelectedResolution('merge')}
                  className="text-purple-600"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Gabungkan Kedua Versi</div>
                  <div className="text-sm text-gray-600">
                    Sistem akan mencoba menggabungkan perubahan dari kedua versi
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isResolving}
          >
            Batalkan
          </Button>
          <Button
            onClick={handleResolve}
            disabled={!selectedResolution || isResolving}
            className="min-w-[120px]"
          >
            {isResolving ? 'Memproses...' : 'Selesaikan Konflik'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
