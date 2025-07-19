import React from 'react';
import { Button } from '@/components/ui/button';
import { CloudUpload, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

// --- IMPOR HOOK UTAMA ---
import { useSupabaseSync } from '@/hooks/useSupabaseSync';
import { useUserSettings } from '@/contexts/UserSettingsContext'; // Asumsi Anda punya konteks ini

// --- IMPOR SEMUA HOOK KONTEKS DATA ---
import { useBahanBaku } from '@/contexts/BahanBakuContext';
import { useSupplier } from '@/contexts/SupplierContext';
import { usePurchase } from '@/contexts/PurchaseContext';
import { useRecipe } from '@/contexts/RecipeContext';
import { useOrder } from '@/contexts/OrderContext';
import { useAssets } from '@/contexts/AssetContext';
import { useFinancial } from '@/contexts/FinancialContext';
import { useActivity } from '@/contexts/ActivityContext';

interface CloudSyncButtonProps {
  variant?: 'upload' | 'download';
  className?: string;
}

const CloudSyncButton: React.FC<CloudSyncButtonProps> = ({ 
  variant = 'upload',
  className = ''
}) => {
  // --- PANGGIL HOOK UTAMA ---
  const { syncToSupabase, loadFromSupabase, isLoading: isSyncing } = useSupabaseSync();
  const { settings } = useUserSettings();

  // --- KUMPULKAN DATA DARI SEMUA KONTEKS ---
  const { bahanBaku } = useBahanBaku();
  const { suppliers } = useSupplier();
  const { purchases } = usePurchase();
  const { recipes, hppResults } = useRecipe();
  const { orders } = useOrder();
  const { assets } = useAsset();
  const { financialTransactions } = useFinancial();
  const { activities } = useActivity();
  
  // State loading lokal khusus untuk interaksi tombol
  const [isHandlingClick, setIsHandlingClick] = React.useState(false);

  // Ambil status aktivasi cloud sync dari pengaturan
  const cloudSyncEnabled = settings?.backup?.auto ?? false;

  const handleClick = async () => {
    if (!cloudSyncEnabled) {
      toast.error('Cloud sync tidak diaktifkan. Aktifkan di Pengaturan > Backup Data.');
      return;
    }

    setIsHandlingClick(true);
    try {
      if (variant === 'upload') {
        // Gabungkan semua data menjadi satu objek untuk dikirim
        const dataToSync = {
          bahanBaku,
          suppliers,
          purchases,
          recipes,
          hppResults,
          orders,
          assets,
          financialTransactions,
          activities,
        };

        const success = await syncToSupabase(dataToSync);
        // Toast notifikasi sudah di-handle di dalam hook useSupabaseSync
        
      } else {
        await loadFromSupabase();
        // Toast notifikasi sudah di-handle di dalam hook useSupabaseSync
      }
    } catch (error) {
      console.error("Cloud Sync Error:", error)
      toast.error('Terjadi kesalahan saat sinkronisasi data.');
    } finally {
      setIsHandlingClick(false);
    }
  };

  if (!cloudSyncEnabled) {
    return null;
  }

  const isLoading = isHandlingClick || isSyncing;

  return (
    <Button
      onClick={handleClick}
      disabled={isLoading}
      variant={variant === 'upload' ? 'default' : 'outline'}
      size="sm" // Ukuran default agar konsisten
      className={className}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : variant === 'upload' ? (
        <CloudUpload className="h-4 w-4 mr-2" />
      ) : (
        <RefreshCw className="h-4 w-4 mr-2" />
      )}
      {isLoading
        ? 'Proses...' 
        : variant === 'upload' 
          ? 'Simpan ke Cloud' 
          : 'Muat dari Cloud'
      }
    </Button>
  );
};

export default CloudSyncButton;