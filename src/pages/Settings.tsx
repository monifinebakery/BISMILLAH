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
// ✅ PERFORMANCE: Lazy load heavy components
import { lazy, Suspense } from 'react';
import ErrorBoundary from '@/components/dashboard/ErrorBoundary';

// Lazy load heavy components to improve initial page load
// const NotificationSettingsForm = lazy(() => import('@/components/NotificationSettingsForm'));
const DeviceManagementSection = lazy(() => import('@/components/settings/DeviceManagementSection'));
const PWAInstallButton = lazy(() => import('@/components/pwa/PWAInstallButton'));

// ✅ PERFORMANCE: Import utils directly but defer execution
import { usePWA } from '@/utils/pwaUtils';
// import { useNotificationTriggers } from '@/hooks/useNotificationTriggers';
import { getDeviceType, getBrowserInfo } from '@/utils';

const SettingsPage = () => {
  // 🚀 PERFORMANCE: Show UI immediately with loading states
  const [showContent, setShowContent] = useState(true); // Always show content
  const [shouldLoadHeavyFeatures, setShouldLoadHeavyFeatures] = useState(false);
  
  // 🚀 PERFORMANCE: Load settings asynchronously
  const { settings, saveSettings, isLoading } = useUserSettings();
  
  // 🚀 PERFORMANCE: Only call heavy hooks when needed
  // const notificationHooks = shouldLoadHeavyFeatures ? useNotificationTriggers() : null;
  const pwaHooks = shouldLoadHeavyFeatures ? usePWA() : null;
  
  // Extract values safely
  // const triggerCustomNotification = notificationHooks?.triggerCustomNotification || null;
  const { canInstall, isInstalled, isOnline } = pwaHooks 
    ? pwaHooks 
    : { canInstall: false, isInstalled: false, isOnline: true };

  const [formState, setFormState] = useState<UserSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState({ device: '', browser: '' });
  const [heavyComponentsLoaded, setHeavyComponentsLoaded] = useState(false);

  // ✅ PERFORMANCE: Defer device info calculation
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDeviceInfo({
        device: getDeviceType(),
        browser: getBrowserInfo().browser,
      });
    }, 100); // Defer by 100ms to not block initial render
    
    return () => clearTimeout(timeoutId);
  }, []);
  
  // ✅ PERFORMANCE: Load heavy components after main content renders
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setHeavyComponentsLoaded(true);
      setShouldLoadHeavyFeatures(true);
    }, 500); // Load heavy components after 500ms
    
    return () => clearTimeout(timeoutId);
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
        settings.address !== formState.address ||
        settings.whatsappType !== formState.whatsappType;
      setHasChanges(hasChanged);
    }
  }, [settings, formState]);

  // 🚀 PERFORMANCE: Show content even while loading, use skeleton states
  const isContentLoading = isLoading && !formState;
  const displaySettings = formState || {
    businessName: '',
    ownerName: '',
    email: '',
    phone: '',
    address: '',
    whatsappType: 'personal' as const,
    notifications: { lowStock: true, newOrder: true }
  };

  const handleInputChange = (
    field: keyof UserSettings,
    value: UserSettings[keyof UserSettings]
  ) => {
    if (!formState && !isLoading) {
      setFormState({ ...displaySettings, [field]: value } as UserSettings);
    } else {
      setFormState(prev => prev ? { ...prev, [field]: value } : null);
    }
  };

  const handleSaveChanges = async () => {
    const settingsToSave = formState || displaySettings;
    if (!settingsToSave) return;

    setIsSaving(true);
    try {
      const settingsToUpdate: Partial<UserSettings> = {
        businessName: settingsToSave.businessName,
        ownerName: settingsToSave.ownerName,
        email: settingsToSave.email,
        phone: settingsToSave.phone,
        address: settingsToSave.address,
        whatsappType: settingsToSave.whatsappType,
      };

      const success = await saveSettings(settingsToUpdate);
      if (success) {
        setHasChanges(false);
        toast.success('Pengaturan bisnis berhasil disimpan');
        
        // ✅ PERFORMANCE: Only trigger notification if loaded
        // if (triggerCustomNotification) {
        //   await triggerCustomNotification(
        //     'Pengaturan Disimpan',
        //     'Informasi bisnis Anda telah diperbarui',
        //     'success',
        //     2
        //   );
        // }
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

          {/* WHATSAPP SETTINGS SECTION */}
          <Card className="border-0 overflow-hidden">
            <CardHeader className="bg-gray-50 border-b">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <MessageSquare className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">Pengaturan WhatsApp</CardTitle>
                  <CardDescription>
                    Pilih tipe WhatsApp untuk fitur follow-up pelanggan
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-gray-700">
                    Tipe WhatsApp untuk Follow-up
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Personal WhatsApp Option */}
                    <div 
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                        formState.whatsappType === 'personal'
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleInputChange('whatsappType', 'personal')}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center ${
                          formState.whatsappType === 'personal'
                            ? 'border-green-500 bg-green-500'
                            : 'border-gray-300'
                        }`}>
                          {formState.whatsappType === 'personal' && (
                            <div className="w-2 h-2 rounded-full bg-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">
                            WhatsApp Personal
                          </h4>
                          <p className="text-sm text-gray-600 mb-2">
                            Menggunakan WhatsApp Web biasa (wa.me)
                          </p>
                          <div className="text-xs text-gray-500">
                            ✅ Lebih universal<br/>
                            ✅ Kompatibel dengan semua perangkat<br/>
                            ✅ Tidak memerlukan WhatsApp Business
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Business WhatsApp Option */}
                    <div 
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                        formState.whatsappType === 'business'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleInputChange('whatsappType', 'business')}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center ${
                          formState.whatsappType === 'business'
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                        }`}>
                          {formState.whatsappType === 'business' && (
                            <div className="w-2 h-2 rounded-full bg-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">
                            WhatsApp Business
                          </h4>
                          <p className="text-sm text-gray-600 mb-2">
                            Menggunakan WhatsApp Business API
                          </p>
                          <div className="text-xs text-gray-500">
                            ✅ Fitur bisnis lengkap<br/>
                            ✅ Analytics dan insights<br/>
                            ⚠️ Memerlukan WhatsApp Business app
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h5 className="font-semibold text-blue-900 mb-2">ℹ️ Informasi:</h5>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Setting ini mengatur URL yang digunakan saat mengirim follow-up WhatsApp</li>
                    <li>• Anda bisa mengubah setting ini kapan saja sesuai kebutuhan</li>
                    <li>• Kedua pilihan akan membuka WhatsApp dengan pesan yang sudah disiapkan</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* NOTIFICATION SETTINGS SECTION - LAZY LOADED */}
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
            
            </div>

          {/* Device Management Section - LAZY LOADED */}
          {heavyComponentsLoaded ? (
            <ErrorBoundary fallback={<div className="p-4 text-center text-gray-500">Gagal memuat manajemen perangkat</div>}>
              <Suspense fallback={<div className="flex items-center justify-center p-4">
    <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
  </div>}>
                <DeviceManagementSection />
              </Suspense>
            </ErrorBoundary>
          ) : (
            <div className="flex items-center justify-center p-4">
    <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
  </div>
          )}

          {/* MONIFINE WHATSAPP CHANNEL SECTION */}
          <Card className="border-0 overflow-hidden">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-center">
                <Button 
                  onClick={() => {
                    window.open('https://whatsapp.com/channel/0029Vb6dAdI6LwHtkhRJXg1I', '_blank');
                    toast.success('Channel WhatsApp Monifine dibuka! 🎉');
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg text-base"
                >
                  <MessageSquare className="mr-2 h-5 w-5" />
                  Join Channel WhatsApp Monifine
                </Button>
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
                    ) : heavyComponentsLoaded ? (
                      <ErrorBoundary fallback={<Button disabled>PWA tidak tersedia</Button>}>
                        <Suspense fallback={<Button disabled>Loading...</Button>}>
                          <PWAInstallButton className="" showNetworkStatus={false} />
                        </Suspense>
                      </ErrorBoundary>
                    ) : (
                      <Button disabled>Loading...</Button>
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

const NotificationSettingsSimpleLoading = () => (
  <div className="border rounded-lg p-6 space-y-4">
    <div className="flex items-center gap-3 mb-4">
      <div className="flex items-center justify-center p-2"><div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" /></div>
      <div>
        <div className="flex items-center justify-center p-2"><div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" /></div>
        <div className="flex items-center justify-center p-2"><div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" /></div>
      </div>
    </div>
    <div className="space-y-3">
      <div className="flex items-center justify-center p-2"><div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" /></div>
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center p-2"><div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" /></div>
              <div>
                <div className="flex items-center justify-center p-2"><div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" /></div>
                <div className="flex items-center justify-center p-2"><div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" /></div>
              </div>
            </div>
            <div className="flex items-center justify-center p-2"><div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" /></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const DeviceManagementSimpleLoading = () => (
  <div className="border rounded-lg">
    <div className="p-6 border-b">
      <div className="flex items-center justify-center p-2"><div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" /></div>
      <div className="flex items-center justify-center p-2"><div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" /></div>
    </div>
    <div className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center p-2"><div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" /></div>
            <div>
              <div className="flex items-center justify-center p-2"><div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" /></div>
              <div className="flex items-center justify-center p-2"><div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" /></div>
            </div>
          </div>
          <div className="flex items-center justify-center p-2"><div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" /></div>
        </div>
        <div className="pt-2 border-t">
          <div className="flex items-center justify-center p-2"><div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" /></div>
        </div>
      </div>
    </div>
  </div>
);

export default SettingsPage;
