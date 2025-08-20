// src/pages/SettingsPage.tsx
// ✅ UPDATED - Compatible with new notification system

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useUserSettings } from '@/contexts/UserSettingsContext';
import { toast } from 'sonner';
import { 
  Settings as SettingsIcon, 
  Save, 
  Building2, 
  User, 
  Mail, 
  Phone, 
  MapPin,
  CheckCircle,
  AlertCircle,
  Loader2,
  BellRing,
  Shield,
  Info,
  RefreshCw
} from 'lucide-react';
import { UserSettings } from '@/contexts/UserSettingsContext';

// ✅ UPDATED: Import from correct path
import NotificationSettingsForm from '@/components/NotificationSettingsForm';

// ✅ NEW: Import notification triggers for demo
import { useNotificationTriggers } from '@/hooks/useNotificationTriggers';
import { getDeviceType, getBrowserInfo } from '@/utils';

const SettingsPage = () => {
  const { settings, saveSettings, isLoading } = useUserSettings();
  const { triggerCustomNotification } = useNotificationTriggers();

  const [formState, setFormState] = useState<UserSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState({ device: '', browser: '' });

  useEffect(() => {
    setDeviceInfo({
      device: getDeviceType(),
      browser: getBrowserInfo().browser,
    });
  }, []);

  useEffect(() => {
    if (settings) {
      setFormState(settings);
    }
  }, [settings]);

  useEffect(() => {
    if (settings && formState) {
      const hasChanged = 
        settings.businessName !== formState.businessName ||
        settings.ownerName !== formState.ownerName ||
        settings.email !== formState.email ||
        settings.phone !== formState.phone ||
        settings.address !== formState.address;
      setHasChanges(hasChanged);
    }
  }, [settings, formState]);

  if (isLoading || !formState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Memuat pengaturan...</p>
        </div>
      </div>
    );
  }

  const handleInputChange = (
    field: keyof UserSettings,
    value: UserSettings[keyof UserSettings]
  ) => {
    setFormState(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleSaveChanges = async () => {
    if (!formState) return;

    setIsSaving(true);
    try {
      const settingsToUpdate: Partial<UserSettings> = {
        businessName: formState.businessName,
        ownerName: formState.ownerName,
        email: formState.email,
        phone: formState.phone,
        address: formState.address,
      };

      const success = await saveSettings(settingsToUpdate);
      if (success) {
        setHasChanges(false);
        toast.success('Pengaturan bisnis berhasil disimpan');
        
        // ✅ NEW: Trigger notification when settings saved
        await triggerCustomNotification(
          'Pengaturan Disimpan',
          'Informasi bisnis Anda telah diperbarui',
          'success',
          2
        );
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (settings) {
      setFormState(settings);
      setHasChanges(false);
      toast.info('Perubahan dibatalkan');
    }
  };

  // ✅ NEW: Test notification function
  const handleTestNotification = async () => {
    await triggerCustomNotification(
      'Test Notifikasi',
      'Ini adalah notifikasi test untuk memastikan sistem berjalan dengan baik',
      'info',
      2
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-6xl">
        <p className="mb-4 text-sm text-gray-600">
          Akun Anda sedang login di perangkat {deviceInfo.device} dengan browser {deviceInfo.browser}
        </p>

        {/* Header Section */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl border overflow-hidden">
            <div className="px-8 py-6 bg-gray-100">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white rounded-xl">
                  <SettingsIcon className="h-8 w-8 text-gray-700" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">Pengaturan Aplikasi</h1>
                  <p className="text-gray-600 mt-1">
                    Kelola informasi bisnis, notifikasi, dan preferensi aplikasi Anda
                  </p>
                </div>
              </div>
            </div>

            {/* Status Bar */}
            <div className="px-8 py-4 bg-white border-t">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {hasChanges ? (
                    <>
                      <AlertCircle className="h-5 w-5 text-orange-500" />
                      <span className="text-sm font-medium text-orange-700">
                        Ada perubahan yang belum disimpan
                      </span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-sm font-medium text-green-700">
                        Semua perubahan tersimpan
                      </span>
                    </>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  Terakhir diperbarui: {settings?.updatedAt ? new Date(settings.updatedAt).toLocaleString('id-ID') : 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Main Content */}
        <div className="space-y-8">
          {/* Kolom Utama: Forms */}
          <div className="space-y-8">
            
            {/* ✅ BUSINESS INFORMATION SECTION */}
            <Card className="border-0 overflow-hidden">
              <CardHeader className="bg-gray-50 border-b">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Building2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Informasi Bisnis</CardTitle>
                    <CardDescription>
                      Data ini akan tampil di invoice dan dokumen lainnya.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Nama Bisnis
                  </Label>
                  <Input 
                    value={formState.businessName || ''} 
                    onChange={e => handleInputChange('businessName', e.target.value)}
                    placeholder="Masukkan nama bisnis Anda"
                    className="h-11 text-base border-gray-300"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Nama Pemilik
                  </Label>
                  <Input 
                    value={formState.ownerName || ''} 
                    onChange={e => handleInputChange('ownerName', e.target.value)}
                    placeholder="Masukkan nama pemilik bisnis"
                    className="h-11 text-base border-gray-300"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </Label>
                    <Input 
                      type="email" 
                      value={formState.email || ''} 
                      onChange={e => handleInputChange('email', e.target.value)} 
                      placeholder="email@bisnis.com" 
                      className="h-11 border-gray-300" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Telepon
                    </Label>
                    <Input 
                      type="tel" 
                      value={formState.phone || ''} 
                      onChange={e => handleInputChange('phone', e.target.value)} 
                      placeholder="+62 XXX XXX XXXX" 
                      className="h-11 border-gray-300" 
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Alamat Lengkap
                  </Label>
                  <Textarea 
                    value={formState.address || ''} 
                    onChange={e => handleInputChange('address', e.target.value)}
                    placeholder="Masukkan alamat lengkap bisnis Anda"
                    className="min-h-[100px] border-gray-300"
                    rows={4}
                  />
                </div>

                {/* Action Buttons for Business Info */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  {hasChanges && (
                    <Button 
                      onClick={handleReset}
                      variant="outline"
                      className="border-gray-300 hover:bg-gray-50"
                    >
                      Batalkan
                    </Button>
                  )}
                  <Button 
                    onClick={handleSaveChanges}
                    disabled={!hasChanges || isSaving}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Simpan Info Bisnis
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* ✅ NOTIFICATION SETTINGS SECTION */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <BellRing className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Pengaturan Notifikasi</h2>
                  <p className="text-gray-600">Atur preferensi notifikasi dan peringatan sistem</p>
                </div>
              </div>
              
              {/* ✅ UPDATED: Import the fixed NotificationSettingsForm */}
              <NotificationSettingsForm />
            </div>
          </div>

          {/* ✅ SIDEBAR: Quick Actions & Info */}
          <div className="space-y-6">
            
            {/* Quick Actions Card */}
            <Card className="border-0 sticky top-6">
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={handleSaveChanges}
                  disabled={!hasChanges || isSaving}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  size="lg"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save All
                    </>
                  )}
                </Button>

                {/* ✅ NEW: Test Notification Button */}
                <Button 
                  onClick={handleTestNotification}
                  variant="outline"
                  className="w-full border-green-300 text-green-700 hover:bg-green-50"
                  size="lg"
                >
                  <BellRing className="mr-2 h-4 w-4" />
                  Test Notifikasi
                </Button>
                
                <Separator />
                
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-gray-700">Status</h4>
                  <div className="flex items-center gap-2 text-sm">
                    {hasChanges ? (
                      <>
                        <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                        <span className="text-orange-700">Unsaved changes</span>
                      </>
                    ) : (
                      <>
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-green-700">All saved</span>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ✅ UPDATED: Notification Tips Card */}
            <Card className="border-0 bg-gradient-to-br from-green-50 to-emerald-50">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <div className="bg-green-100 p-2 rounded-lg flex-shrink-0">
                    <BellRing className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-800 mb-2">Tips Notifikasi</h4>
                    <ul className="text-sm text-green-700 space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        <span>Aktifkan push notification untuk alert real-time</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        <span>Set threshold stok rendah sesuai bisnis Anda</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        <span>Enable laporan bulanan untuk insight bisnis</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        <span>Test notifikasi secara berkala</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tips Card */}
            <Card className="border-0 bg-gradient-to-br from-yellow-50 to-orange-50">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <div className="bg-yellow-100 p-2 rounded-lg flex-shrink-0">
                    <Info className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-yellow-800 mb-2">Tips Pengaturan</h4>
                    <ul className="text-sm text-yellow-700 space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-500 mt-1">•</span>
                        <span>Informasi bisnis akan muncul di semua invoice</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-500 mt-1">•</span>
                        <span>Update contact info secara berkala</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-500 mt-1">•</span>
                        <span>Simpan perubahan sebelum keluar halaman</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-500 mt-1">•</span>
                        <span>Backup data secara rutin</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Version Info */}
            <Card className="border-0">
              <CardContent className="p-4">
                <div className="text-center text-xs text-gray-500 space-y-1">
                  <p className="font-medium">Bakery Management System</p>
                  <p>Version 2.1.0</p>
                  <p>© 2025 Monifine</p>
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-green-600">System Online</span>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
