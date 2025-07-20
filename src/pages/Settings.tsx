// src/pages/Settings.tsx

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings as SettingsIcon, User, Bell, Palette, Database, Shield, ChefHat } from 'lucide-react';
import { useUserSettings } from '@/contexts/UserSettingsContext';
import RecipeCategoryManager from '@/components/RecipeCategoryManager';
import { Label } from '@/components/ui/label';

const Settings = () => {
  // Panggil hook yang benar dari context realtime kita
  const { settings, updateSettings, isLoading } = useUserSettings();
  
  // Gunakan state lokal untuk form, agar tidak memicu save di setiap ketikan
  const [formState, setFormState] = useState(settings);

  // Sinkronkan state lokal jika data dari context (server) berubah
  useEffect(() => {
    setFormState(settings);
  }, [settings]);

  // Handler untuk menyimpan perubahan saat input kehilangan fokus (onBlur)
  const handleBlurSave = (field: keyof typeof formState, value: any) => {
    // Hanya panggil update jika nilainya benar-benar berubah
    if (settings[field] !== value) {
      updateSettings({ [field]: value });
    }
  };
  
  // Handler untuk menyimpan perubahan Switch & Select secara langsung
  const handleImmediateSave = (update: Partial<typeof settings>) => {
    updateSettings(update);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Memuat pengaturan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-3 sm:p-6 font-inter">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-3 rounded-full mr-4">
              <SettingsIcon className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Pengaturan</h1>
              <p className="text-sm sm:text-base text-gray-600">Kelola pengaturan aplikasi dan preferensi</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Business Information */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm rounded-lg">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center text-lg"><User className="h-5 w-5 mr-2" />Informasi Bisnis</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="businessName">Nama Bisnis</Label>
                  <Input id="businessName" value={formState.businessName} onChange={(e) => setFormState({ ...formState, businessName: e.target.value })} onBlur={(e) => handleBlurSave('businessName', e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="ownerName">Nama Pemilik</Label>
                  <Input id="ownerName" value={formState.ownerName} onChange={(e) => setFormState({ ...formState, ownerName: e.target.value })} onBlur={(e) => handleBlurSave('ownerName', e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Notifications */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm rounded-lg">
            <CardHeader className="bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center text-lg"><Bell className="h-5 w-5 mr-2" />Notifikasi</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Stok Rendah</Label>
                  <p className="text-sm text-muted-foreground">Notifikasi ketika stok bahan baku rendah</p>
                </div>
                <Switch
                  checked={formState.notifications?.lowStock ?? false} // <-- Gunakan `?.` dan `??`
                  onCheckedChange={(checked) => handleImmediateSave({ notifications: { ...formState.notifications, lowStock: checked } })}
                />
              </div>
              {/* Tambahkan switch lain jika ada (newOrder, financial) dengan pola yang sama */}
            </CardContent>
          </Card>
          
          {/* Recipe Settings */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm rounded-lg">
            <CardHeader className="bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center text-lg"><ChefHat className="h-5 w-5 mr-2" />Pengaturan Resep</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <p className="text-sm text-muted-foreground">Kelola kategori yang digunakan untuk resep Anda.</p>
              <RecipeCategoryManager />
            </CardContent>
          </Card>
          
          {/* Kartu lain (Backup, Security, dll) bisa ditambahkan di sini dengan pola yang sama */}
        </div>
      </div>
    </div>
  );
};

export default Settings;