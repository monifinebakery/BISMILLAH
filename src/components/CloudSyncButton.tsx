
import React from 'react';
import { Button } from '@/components/ui/button';
import { Cloud, CloudUpload, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface CloudSyncButtonProps {
  variant?: 'upload' | 'download';
  className?: string;
}

const CloudSyncButton: React.FC<CloudSyncButtonProps> = ({ 
  variant = 'upload',
  className = ''
}) => {
  const { syncToCloud, loadFromCloud, cloudSyncEnabled } = useAppData();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleClick = async () => {
    if (!cloudSyncEnabled) {
      toast.error('Cloud sync tidak diaktifkan');
      return;
    }

    setIsLoading(true);
    try {
      if (variant === 'upload') {
        const success = await syncToCloud();
        if (success) {
          toast.success('Data berhasil disimpan ke cloud');
        } else {
          toast.error('Gagal menyimpan data ke cloud');
        }
      } else {
        await loadFromCloud();
        toast.success('Data berhasil dimuat dari cloud');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan saat sync data');
    } finally {
      setIsLoading(false);
    }
  };

  if (!cloudSyncEnabled) {
    return null;
  }

  return (
    <Button
      onClick={handleClick}
      disabled={isLoading}
      variant={variant === 'upload' ? 'default' : 'outline'}
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
