import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUserSettings } from '@/contexts/UserSettingsContext';
import { toast } from 'sonner';
import { Settings as SettingsIcon, Save } from 'lucide-react';
import { UserSettings } from '@/contexts/UserSettingsContext';

const SettingsPage = () => {
  const { settings, saveSettings, isLoading } = useUserSettings();
  const [formState, setFormState] = useState<UserSettings | null>(null);

  useEffect(() => {
    if (settings) {
      setFormState(settings);
    }
  }, [settings]);

  if (isLoading || !formState) {
    return <div className="p-6 text-center text-muted-foreground">Memuat pengaturan...</div>;
  }

  const handleInputChange = (field: keyof UserSettings, value: any) => {
    setFormState(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleSaveChanges = async () => {
    if (formState) {
      // Kita hanya menyimpan bagian yang ada di form ini, bukan seluruh settings
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
      }
    }
  };
  
  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-8">
      <div className="flex items-center gap-4">
        <SettingsIcon className="h-8 w-8 text-orange-500" />
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Pengaturan Aplikasi</h1>
          <p className="text-muted-foreground">Kelola informasi bisnis dan preferensi aplikasi Anda.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informasi Bisnis & Kontak</CardTitle>
          <CardDescription>Informasi ini akan digunakan pada invoice dan laporan.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><Label>Nama Bisnis</Label><Input value={formState.businessName} onChange={e => handleInputChange('businessName', e.target.value)} /></div>
            <div><Label>Nama Pemilik</Label><Input value={formState.ownerName} onChange={e => handleInputChange('ownerName', e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><Label>Email</Label><Input type="email" value={formState.email} onChange={e => handleInputChange('email', e.target.value)} /></div>
            <div><Label>Telepon</Label><Input type="tel" value={formState.phone} onChange={e => handleInputChange('phone', e.target.value)} /></div>
          </div>
          <div><Label>Alamat</Label><Input value={formState.address} onChange={e => handleInputChange('address', e.target.value)} /></div>
        </CardContent>
      </Card>
      
      <div className="flex justify-end pt-4 border-t">
          <Button onClick={handleSaveChanges}><Save className="mr-2 h-4 w-4" /> Simpan Perubahan</Button>
      </div>
    </div>
  );
};

export default SettingsPage;