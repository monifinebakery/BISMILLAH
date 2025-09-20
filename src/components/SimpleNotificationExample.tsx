// src/components/SimpleNotificationExample.tsx
// ✅ SIMPLE NOTIFICATION EXAMPLE - How to use the new system

import React from 'react';
import { Button } from '@/components/ui/button';
import { useSimpleNotification } from '@/contexts/SimpleNotificationContext';

const SimpleNotificationExample = () => {
  const { addNotification } = useSimpleNotification();

  const addTestNotification = () => {
    addNotification({
      title: 'Notifikasi Tes',
      message: 'Ini adalah notifikasi tes dari sistem sederhana',
      type: 'info'
    });
  };

  const addSuccessNotification = () => {
    addNotification({
      title: 'Berhasil!',
      message: 'Operasi berhasil diselesaikan',
      type: 'success'
    });
  };

  const addWarningNotification = () => {
    addNotification({
      title: 'Peringatan',
      message: 'Silakan periksa input Anda',
      type: 'warning'
    });
  };

  const addErrorNotification = () => {
    addNotification({
      title: 'Kesalahan',
      message: 'Terjadi kesalahan. Silakan coba lagi.',
      type: 'error'
    });
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="font-semibold mb-3">Contoh Notifikasi Sederhana</h3>
      <div className="flex flex-wrap gap-2">
        <Button onClick={addTestNotification} variant="outline">
          Tambah Info
        </Button>
        <Button onClick={addSuccessNotification} variant="outline" className="text-green-600 border-green-600 hover:bg-green-50">
          Tambah Sukses
        </Button>
        <Button onClick={addWarningNotification} variant="outline" className="text-orange-600 border-orange-600 hover:bg-orange-50">
          Tambah Peringatan
        </Button>
        <Button onClick={addErrorNotification} variant="outline" className="text-red-600 border-red-600 hover:bg-red-50">
          Tambah Kesalahan
        </Button>
      </div>
    </div>
  );
};

export default SimpleNotificationExample;