import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Loader2
} from 'lucide-react';
import { UserSettings } from '@/contexts/UserSettingsContext';

const SettingsPage = () => {
  const { settings, saveSettings, isLoading } = useUserSettings();
  const [formState, setFormState] = useState<UserSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

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
        toast.success('Pengaturan berhasil disimpan!');
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-4xl">
        {/* Header Section */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-lg border-0 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 text-white">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <SettingsIcon className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Pengaturan Aplikasi</h1>
                  <p className="text-blue-100 mt-1">
                    Kelola informasi bisnis dan preferensi aplikasi Anda
                  </p>
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
                  Terakhir diperbarui: {new Date().toLocaleString('id-ID')}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Business Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-lg border-0 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Building2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Informasi Bisnis</CardTitle>
                    <CardDescription>
                      Data bisnis yang akan tampil di invoice dan dokumen
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                {/* Business Name */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Nama Bisnis
                  </Label>
                  <Input 
                    value={formState.businessName || ''} 
                    onChange={e => handleInputChange('businessName', e.target.value)}
                    placeholder="Masukkan nama bisnis Anda"
                    className="h-12 text-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                {/* Owner Name */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Nama Pemilik
                  </Label>
                  <Input 
                    value={formState.ownerName || ''} 
                    onChange={e => handleInputChange('ownerName', e.target.value)}
                    placeholder="Masukkan nama pemilik bisnis"
                    className="h-12 text-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                {/* Contact Information */}
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
                      className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
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
                      className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Alamat Lengkap
                  </Label>
                  <Textarea 
                    value={formState.address || ''} 
                    onChange={e => handleInputChange('address', e.target.value)}
                    placeholder="Masukkan alamat lengkap bisnis Anda"
                    className="min-h-[100px] border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Preview & Actions */}
          <div className="space-y-6">
            {/* Preview Card */}
            <Card className="shadow-lg border-0 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                <CardTitle className="text-lg text-green-800">Preview Invoice</CardTitle>
                <CardDescription className="text-green-600">
                  Begini informasi Anda akan tampil
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 bg-gray-50">
                <div className="space-y-3 text-sm">
                  <div>
                    <h3 className="font-bold text-lg text-gray-800">
                      {formState.businessName || 'Nama Bisnis Anda'}
                    </h3>
                    <p className="text-gray-600">
                      {formState.ownerName || 'Nama Pemilik'}
                    </p>
                  </div>
                  <div className="space-y-1 text-gray-600">
                    <p>{formState.address || 'Alamat bisnis akan tampil di sini'}</p>
                    <p>{formState.phone || 'Nomor telepon'}</p>
                    <p>{formState.email || 'email@bisnis.com'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Card className="shadow-lg border-0">
              <CardContent className="p-6 space-y-4">
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

            {/* Tips Card */}
            <Card className="shadow-lg border-0 bg-gradient-to-br from-yellow-50 to-orange-50">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <div className="bg-yellow-100 p-2 rounded-lg flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-yellow-800 mb-2">Tips</h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>• Informasi ini akan muncul di semua invoice</li>
                      <li>• Pastikan data kontak sudah benar</li>
                      <li>• Alamat sebaiknya ditulis lengkap</li>
                    </ul>
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