import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Settings as SettingsIcon, User, Bell, Palette, Database, Shield, ChefHat } from 'lucide-react'; // MODIFIED: Tambahkan ChefHat
import { useUserSettings } from '@/hooks/useUserSettings';
import RecipeCategoryManager from '@/components/RecipeCategoryManager'; // MODIFIED: Tambahkan import RecipeCategoryManager
import { Label } from '@/components/ui/label'; // MODIFIED: Tambahkan import Label

const Settings = () => {
  const { settings, saveSettings, loading } = useUserSettings();

  const handleSettingChange = (category: keyof typeof settings, key: string, value: any) => {
    if (typeof settings[category] === 'object' && settings[category] !== null) {
      const newSettings = {
        ...settings,
        [category]: {
          ...(settings[category] as object),
          [key]: value,
        },
      };
      saveSettings(newSettings);
    }
  };

  const handleDirectChange = (key: keyof typeof settings, value: any) => {
    const newSettings = {
      ...settings,
      [key]: value,
    };
    saveSettings(newSettings);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-3 sm:p-6 flex items-center justify-center font-inter">
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
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-3 rounded-full mr-4">
              <SettingsIcon className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Pengaturan
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                Kelola pengaturan aplikasi dan preferensi
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Business Information */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm rounded-lg">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center text-lg sm:text-xl">
                <User className="h-5 w-5 mr-2" />
                Informasi Bisnis
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="businessName">Nama Bisnis</Label>
                  <Input
                    id="businessName"
                    value={settings.businessName}
                    onChange={(e) => handleDirectChange('businessName', e.target.value)}
                    onBlur={() => saveSettings(settings)}
                    className="rounded-md"
                  />
                </div>
                <div>
                  <Label htmlFor="ownerName">Nama Pemilik</Label>
                  <Input
                    id="ownerName"
                    value={settings.ownerName}
                    onChange={(e) => handleDirectChange('ownerName', e.target.value)}
                    onBlur={() => saveSettings(settings)}
                    className="rounded-md"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.email || ''}
                    onChange={(e) => handleDirectChange('email', e.target.value)}
                    onBlur={() => saveSettings(settings)}
                    className="rounded-md"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telepon</Label>
                  <Input
                    id="phone"
                    value={settings.phone || ''}
                    onChange={(e) => handleDirectChange('phone', e.target.value)}
                    onBlur={() => saveSettings(settings)}
                    className="rounded-md"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="address">Alamat</Label>
                <Input
                  id="address"
                  value={settings.address || ''}
                  onChange={(e) => handleDirectChange('address', e.target.value)}
                  onBlur={() => saveSettings(settings)}
                  className="rounded-md"
                />
              </div>
            </CardContent>
          </Card>

          {/* Appearance - without dark mode */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm rounded-lg">
            <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center text-lg sm:text-xl">
                <Palette className="h-5 w-5 mr-2" />
                Tampilan
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="currency">Mata Uang</Label>
                  <Select
                    value={settings.currency}
                    onValueChange={(value) => handleDirectChange('currency', value)}
                  >
                    <SelectTrigger className="rounded-md">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IDR">Rupiah (IDR)</SelectItem>
                      <SelectItem value="USD">Dollar (USD)</SelectItem>
                      <SelectItem value="EUR">Euro (EUR)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="language">Bahasa</Label>
                  <Select
                    value={settings.language}
                    onValueChange={(value) => handleDirectChange('language', value)}
                  >
                    <SelectTrigger className="rounded-md">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="id">Bahasa Indonesia</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm rounded-lg">
            <CardHeader className="bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center text-lg sm:text-xl">
                <Bell className="h-5 w-5 mr-2" />
                Notifikasi
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Stok Rendah</Label>
                    <p className="text-sm text-muted-foreground">Notifikasi ketika stok bahan baku rendah</p>
                  </div>
                  <Switch
                    checked={settings.notifications.lowStock}
                    onCheckedChange={(checked) => handleSettingChange('notifications', 'lowStock', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Pesanan Baru</Label>
                    <p className="text-sm text-muted-foreground">Notifikasi untuk pesanan baru</p>
                  </div>
                  <Switch
                    checked={settings.notifications.newOrder}
                    onCheckedChange={(checked) => handleSettingChange('notifications', 'newOrder', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Laporan Keuangan</Label>
                    <p className="text-sm text-muted-foreground">Notifikasi untuk laporan keuangan mingguan</p>
                  </div>
                  <Switch
                    checked={settings.notifications.financial}
                    onCheckedChange={(checked) => handleSettingChange('notifications', 'financial', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Backup */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm rounded-lg">
            <CardHeader className="bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center text-lg sm:text-xl">
                <Database className="h-5 w-5 mr-2" />
                Backup Data
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Backup Otomatis</Label>
                  <p className="text-sm text-muted-foreground">Backup data secara otomatis</p>
                </div>
                <Switch
                  checked={settings.backup.auto}
                  onCheckedChange={(checked) => handleSettingChange('backup', 'auto', checked)}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Frekuensi Backup</Label>
                  <Select
                    value={settings.backup.frequency}
                    onValueChange={(value) => handleSettingChange('backup', 'frequency', value)}
                  >
                    <SelectTrigger className="rounded-md">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Harian</SelectItem>
                      <SelectItem value="weekly">Mingguan</SelectItem>
                      <SelectItem value="monthly">Bulanan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Lokasi Backup</Label>
                  <Select
                    value={settings.backup.location}
                    onValueChange={(value) => handleSettingChange('backup', 'location', value)}
                  >
                    <SelectTrigger className="rounded-md">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cloud">Cloud Storage</SelectItem>
                      <SelectItem value="local">Local Storage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm rounded-lg">
            <CardHeader className="bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center text-lg sm:text-xl">
                <Shield className="h-5 w-5 mr-2" />
                Keamanan
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">Aktifkan autentikasi dua faktor</p>
                </div>
                <Switch
                  checked={settings.security.twoFactor}
                  onCheckedChange={(checked) => handleSettingChange('security', 'twoFactor', checked)}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Session Timeout (menit)</Label>
                  <Input
                    type="number"
                    value={settings.security.sessionTimeout}
                    onChange={(e) => handleSettingChange('security', 'sessionTimeout', e.target.value)}
                    className="rounded-md"
                  />
                </div>
                <div>
                  <Label>Persyaratan Password</Label>
                  <Select
                    value={settings.security.passwordRequirement}
                    onValueChange={(value) => handleSettingChange('security', 'passwordRequirement', value)}
                  >
                    <SelectTrigger className="rounded-md">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Rendah</SelectItem>
                      <SelectItem value="medium">Sedang</SelectItem>
                      <SelectItem value="high">Tinggi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Pengaturan Resep */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm rounded-lg">
            <CardHeader className="bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center text-lg sm:text-xl">
                <ChefHat className="h-5 w-5 mr-2" />
                Pengaturan Resep
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-4">
              <p className="text-sm text-muted-foreground">Kelola kategori yang digunakan untuk resep Anda.</p>
              <RecipeCategoryManager />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
