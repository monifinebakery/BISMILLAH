// src/pages/SettingsPage.tsx
// ✅ UPDATED - Compatible with new notification system

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useUserSettings, UserSettings } from '@/contexts/UserSettingsContext';
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
  Smartphone,
  Download,
  MessageSquare
} from 'lucide-react';

// ✅ UPDATED: Import from correct path
import NotificationSettingsForm from '@/components/NotificationSettingsForm';

// ✅ NEW: Import device management section
import DeviceManagementSection from '@/components/settings/DeviceManagementSection';

// ✅ NEW: Import PWA components
import PWAInstallButton from '@/components/pwa/PWAInstallButton';
import { usePWA } from '@/utils/pwaUtils';

// ✅ NEW: Import notification triggers for demo
import { useNotificationTriggers } from '@/hooks/useNotificationTriggers';
import { getDeviceType, getBrowserInfo } from '@/utils';

const SettingsPage = () => {
  const { settings, saveSettings, isLoading } = useUserSettings();
  const { triggerCustomNotification } = useNotificationTriggers();
  const { canInstall, isInstalled, isOnline } = usePWA();

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full p-4 sm:p-6 lg:p-8">
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
        {/* Main Content - Full Width */}
        <div className="space-y-8">
          {/* BUSINESS INFORMATION SECTION */}
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
                  className="bg-black hover:bg-gray-800 text-white"
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

          {/* NOTIFICATION SETTINGS SECTION */}
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
            
            <NotificationSettingsForm />
          </div>

          {/* Device Management Section */}
          <DeviceManagementSection />

          {/* MONIFINE WHATSAPP CHANNEL SECTION */}
          <Card className="border-0 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <MessageSquare className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">Channel Monifine</CardTitle>
                  <CardDescription>
                    Bergabung dengan channel WhatsApp untuk tips, update, dan info menarik untuk UMKM
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                        <MessageSquare className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-green-900 mb-2">
                        📢 Monifine - Kalkulator HPP untuk UMKM
                      </h4>
                      <p className="text-green-800 text-sm mb-3">
                        Dapatkan tips bisnis, update fitur terbaru, dan informasi menarik seputar UMKM Indonesia langsung dari tim Monifine.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-green-700 mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                          <span>Tips kalkulasi HPP</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                          <span>Update fitur terbaru</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                          <span>Strategi bisnis UMKM</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                          <span>Community support</span>
                        </div>
                      </div>
                      <Button 
                        onClick={() => {
                          window.open('https://whatsapp.com/channel/0029Vb6dAdI6LwHtkhRJXg1I', '_blank');
                          toast.success('Channel WhatsApp Monifine dibuka! 🎉');
                        }}
                        className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-semibold"
                      >
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Join Channel WhatsApp
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h5 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Mengapa Join Channel Monifine?
                  </h5>
                  <ul className="text-sm text-amber-800 space-y-1">
                    <li>• <strong>Edukasi GRATIS:</strong> Tips dan trik mengelola bisnis UMKM</li>
                    <li>• <strong>Update Aplikasi:</strong> Info fitur baru dan improvement</li>
                    <li>• <strong>Community:</strong> Diskusi dengan sesama pebisnis UMKM</li>
                    <li>• <strong>Support:</strong> Bantuan langsung dari tim Monifine</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* PWA INSTALL SECTION */}
          <Card className="border-0 overflow-hidden">
            <CardHeader className="bg-gray-50 border-b">
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 p-2 rounded-lg">
                  <Smartphone className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">Aplikasi Mobile</CardTitle>
                  <CardDescription>
                    Install aplikasi ke perangkat untuk akses yang lebih cepat
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg">
                      <Download className="h-5 w-5 text-gray-700" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Status Instalasi</h4>
                      <p className="text-sm text-gray-600">
                        {isInstalled ? 'Aplikasi sudah terinstall' : 'Aplikasi belum terinstall'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isInstalled ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-medium">Terinstall</span>
                      </div>
                    ) : (
                      <PWAInstallButton className="" showNetworkStatus={false} />
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <h5 className="font-semibold text-blue-900 mb-1">📱 Akses Cepat</h5>
                    <p className="text-blue-700">Buka aplikasi langsung dari home screen</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <h5 className="font-semibold text-green-900 mb-1">⚡ Performa</h5>
                    <p className="text-green-700">Loading lebih cepat dan responsif</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <h5 className="font-semibold text-purple-900 mb-1">📴 Offline</h5>
                    <p className="text-purple-700">Bekerja tanpa koneksi internet</p>
                  </div>
                </div>

                {!isInstalled && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <h5 className="font-semibold text-amber-900 mb-2">💡 Cara Install:</h5>
                    <ul className="text-sm text-amber-800 space-y-1">
                      <li>• <strong>Chrome Android:</strong> Tap tombol "Install App" di atas</li>
                      <li>• <strong>Safari iOS:</strong> Tap Share → "Add to Home Screen"</li>
                      <li>• <strong>Desktop:</strong> Lihat ikon install di address bar browser</li>
                    </ul>
                  </div>
                )}
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
  );
};

export default SettingsPage;
