// src/components/NotificationSettingsForm.tsx

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { useNotification } from '@/contexts/NotificationContext';
import { toast } from 'sonner';
import { Loader2, BellRing } from 'lucide-react';

// Tipe data untuk form lokal, agar lebih mudah dikelola
type FormState = {
  order_notifications: boolean;
  inventory_notifications: boolean;
  system_notifications: boolean;
  low_stock_threshold: number;
};

const NotificationSettingsForm = () => {
  const { settings, updateSettings, isLoading: isContextLoading } = useNotification();
  const [formState, setFormState] = useState<FormState>({
    order_notifications: true,
    inventory_notifications: true,
    system_notifications: true,
    low_stock_threshold: 10,
  });
  const [isSaving, setIsSaving] = useState(false);

  // Efek ini akan mengisi form dengan data dari context saat pertama kali dimuat
  useEffect(() => {
    if (settings) {
      setFormState({
        order_notifications: settings.order_notifications,
        inventory_notifications: settings.inventory_notifications,
        system_notifications: settings.system_notifications,
        low_stock_threshold: settings.low_stock_threshold,
      });
    }
  }, [settings]);

  const handleInputChange = (field: keyof FormState, value: boolean | number) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    const success = await updateSettings(formState);
    if (success) {
      // Toast sudah ada di dalam context, tidak perlu panggil lagi di sini.
    }
    setIsSaving(false);
  };

  if (isContextLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pengaturan Notifikasi</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">Memuat pengaturan...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md border">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 bg-blue-100 p-3 rounded-lg">
            <BellRing className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <CardTitle className="text-xl">Pengaturan Notifikasi</CardTitle>
            <CardDescription>
              Atur notifikasi mana yang ingin Anda terima di dalam aplikasi.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-4">
        <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50/50">
          <div>
            <Label htmlFor="order-notifications" className="font-medium">
              Notifikasi Pesanan
            </Label>
            <p className="text-sm text-gray-500">
              Dapatkan notifikasi untuk pesanan baru dan perubahan status.
            </p>
          </div>
          <Switch
            id="order-notifications"
            checked={formState.order_notifications}
            onCheckedChange={(checked) => handleInputChange('order_notifications', checked)}
          />
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50/50">
          <div>
            <Label htmlFor="inventory-notifications" className="font-medium">
              Notifikasi Gudang & Stok
            </Label>
            <p className="text-sm text-gray-500">
              Dapatkan peringatan saat stok menipis atau habis.
            </p>
          </div>
          <Switch
            id="inventory-notifications"
            checked={formState.inventory_notifications}
            onCheckedChange={(checked) => handleInputChange('inventory_notifications', checked)}
          />
        </div>

        <div className="space-y-2 p-4 border rounded-lg bg-gray-50/50">
          <Label htmlFor="low-stock-threshold" className="font-medium">
            Batas Peringatan Stok Rendah
          </Label>
          <p className="text-sm text-gray-500">
            Kirim peringatan jika stok sebuah item sama dengan atau di bawah angka ini.
          </p>
          <Input
            id="low-stock-threshold"
            type="number"
            value={formState.low_stock_threshold}
            onChange={(e) => handleInputChange('low_stock_threshold', parseInt(e.target.value, 10) || 0)}
            className="max-w-xs mt-2"
            min="0"
          />
        </div>
        
        <div className="flex justify-end">
            <Button onClick={handleSaveSettings} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}
            </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationSettingsForm;
