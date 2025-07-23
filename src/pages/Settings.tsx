// src/pages/SettingsPage.tsx

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useUserSettings } from '@/contexts/UserSettingsContext';
import SimpleNotificationTest from '@/components/SimpleNotificationTest';
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
  Loader2
} from 'lucide-react';
import { UserSettings } from '@/contexts/UserSettingsContext';
import NotificationSettingsForm from '@/components/NotificationSettingsForm';
// 🔧 ADD DEBUG COMPONENT IMPORT
import NotificationDebugEnhanced from '@/components/NotificationDebugEnhanced';

const SettingsPage = () => {
  const { settings, saveSettings, isLoading } = useUserSettings();
  const [formState, setFormState] = useState<UserSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  // 🔧 ADD DEBUG MODE STATE
  const [showDebug, setShowDebug] = useState(process.env.NODE_ENV === 'development');

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

  const handleInputChange = (field: keyof UserSettings, value: any) => {
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
        // Toast sudah ada di dalam context, tidak perlu panggil lagi
        setHasChanges(false);
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
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-5xl">
        {/* Header Section */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-lg border overflow-hidden">
            <div className="bg-gradient-to-r from-orange-600 to-red-600 px-8 py-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 p-3 rounded-xl">
                    <SettingsIcon className="h-8 w-8" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold">Pengaturan Aplikasi</h1>
                    <p className="text-orange-100 mt-1">
                      Kelola informasi bisnis dan preferensi aplikasi Anda
                    </p>
                  </div>
                </div>
                {/* 🔧 DEBUG TOGGLE BUTTON */}
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={() => setShowDebug(!showDebug)}
                    variant="secondary"
                    size="sm"
                    className="bg-white/20 hover:bg-white/30 text-white border-white/20"
                  >
                    {showDebug ? '🔧 Hide Debug' : '🔧 Show Debug'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Status Bar */}
            <div className="px-8 py-4 bg-gray-50 border-b">
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Kolom Kiri: Forms */}
          <div className="lg:col-span-2 space-y-8">
            {/* Business Information Form */}
            <Card className="shadow-lg border-0 overflow-hidden">
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
              </CardContent>
            </Card>

            {/* Notification Settings Form */}
            <NotificationSettingsForm />
            <SimpleNotificationTest />

            {/* 🔧 DEBUG COMPONENT - CONDITIONALLY SHOWN */}
            {showDebug && <NotificationDebugEnhanced />}

          </div>

          {/* Kolom Kanan: Sidebar Actions & Preview */}
          <div className="space-y-6">
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle>Aksi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={handleSaveChanges}
                  disabled={!hasChanges || isSaving}
                  className="w-full h-12 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-5 w-5" />
                      Simpan Perubahan
                    </>
                  )}
                </Button>
                {hasChanges && (
                  <Button 
                    onClick={handleReset}
                    variant="outline"
                    className="w-full h-10 border-gray-300 hover:bg-gray-50"
                  >
                    Batalkan Perubahan
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 bg-gradient-to-br from-yellow-50 to-orange-50">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <div className="bg-yellow-100 p-2 rounded-lg flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-yellow-800 mb-2">Tips</h4>
                    <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
                      <li>Informasi ini akan muncul di semua invoice</li>
                      <li>Pastikan data kontak sudah benar</li>
                      <li>Alamat sebaiknya ditulis lengkap</li>
                      {showDebug && (
                        <li className="text-orange-600">🔧 Debug mode aktif - lihat komponen debug di bawah</li>
                      )}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 🔧 DEBUG INFO SIDEBAR */}
            {showDebug && (
              <Card className="shadow-lg border-2 border-orange-300 bg-orange-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-orange-800">🔧 Debug Mode</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-orange-700 space-y-2">
                  <p><strong>Environment:</strong> {process.env.NODE_ENV}</p>
                  <p><strong>Purpose:</strong> Diagnose notification issues</p>
                  <p><strong>Instructions:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Scroll down to debug component</li>
                    <li>Run diagnostics tests</li>
                    <li>Check browser console (F12)</li>
                    <li>Compare context vs database data</li>
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;