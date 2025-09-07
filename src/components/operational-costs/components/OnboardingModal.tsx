import React from 'react';
import { Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useOperationalCost } from '../context';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSkip: () => void;
}

type BusinessType = 'bakery' | 'restaurant' | 'cafe';

const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose, onSkip }) => {
  const { actions, state } = useOperationalCost();
  const [loading, setLoading] = React.useState<BusinessType | null>(null);

  // Quick setup for common cost types
  const handleQuickSetup = async (type: BusinessType) => {
    setLoading(type);
    const costTemplates = {
      bakery: [
        { nama_biaya: 'Gas Oven', jumlah_per_bulan: 500000, jenis: 'tetap' as const, group: 'hpp' as const },
        { nama_biaya: 'Listrik Oven', jumlah_per_bulan: 300000, jenis: 'tetap' as const, group: 'hpp' as const },
        { nama_biaya: 'Sewa Dapur', jumlah_per_bulan: 1000000, jenis: 'tetap' as const, group: 'hpp' as const },
        { nama_biaya: 'Marketing', jumlah_per_bulan: 2000000, jenis: 'variabel' as const, group: 'operasional' as const },
        { nama_biaya: 'Admin/Kasir', jumlah_per_bulan: 1500000, jenis: 'tetap' as const, group: 'operasional' as const }
      ],
      restaurant: [
        { nama_biaya: 'Gas Kompor', jumlah_per_bulan: 400000, jenis: 'tetap' as const, group: 'hpp' as const },
        { nama_biaya: 'Sewa Dapur', jumlah_per_bulan: 1500000, jenis: 'tetap' as const, group: 'hpp' as const },
        { nama_biaya: 'Gaji Koki', jumlah_per_bulan: 3000000, jenis: 'tetap' as const, group: 'hpp' as const },
        { nama_biaya: 'Marketing', jumlah_per_bulan: 3000000, jenis: 'variabel' as const, group: 'operasional' as const },
        { nama_biaya: 'Internet & Listrik Toko', jumlah_per_bulan: 500000, jenis: 'tetap' as const, group: 'operasional' as const }
      ],
      cafe: [
        { nama_biaya: 'Listrik Coffee Machine', jumlah_per_bulan: 200000, jenis: 'tetap' as const, group: 'hpp' as const },
        { nama_biaya: 'Sewa Tempat', jumlah_per_bulan: 2000000, jenis: 'tetap' as const, group: 'operasional' as const },
        { nama_biaya: 'Gaji Barista', jumlah_per_bulan: 2500000, jenis: 'tetap' as const, group: 'hpp' as const },
        { nama_biaya: 'Marketing & Promo', jumlah_per_bulan: 1500000, jenis: 'variabel' as const, group: 'operasional' as const },
        { nama_biaya: 'Internet & Musik', jumlah_per_bulan: 300000, jenis: 'tetap' as const, group: 'operasional' as const }
      ]
    };

    const templates = costTemplates[type];
    let successCount = 0;
    let errorCount = 0;

    for (const template of templates) {
      try {
        const success = await actions.createCost({ ...template, status: 'aktif' });
        if (success) successCount++;
        else errorCount++;
      } catch (error) {
        console.error('Error creating template cost:', error);
        errorCount++;
      }
    }

    setLoading(null);

    if (successCount > 0) {
      toast.success(`Setup ${type} berhasil!`, {
        description: `${successCount} biaya contoh telah ditambahkan${errorCount > 0 ? `, ${errorCount} gagal` : ''}. Silakan edit sesuai kebutuhan.`
      });
      
      // Trigger explicit data refresh to ensure costs are immediately visible
      try {
        await actions.refreshData();
      } catch (error) {
        console.warn('Warning: Could not refresh data after quick setup:', error);
      }
      
      onClose();
    } else if (errorCount > 0) {
      toast.error('Gagal setup template', {
        description: 'Semua biaya gagal ditambahkan. Silakan coba lagi atau mulai dari kosong.'
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent centerMode="overlay" size="md">
        <div className="dialog-panel">
          <DialogHeader className="dialog-header-pad">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Info className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-center flex-1">
                <DialogTitle className="text-xl font-semibold">Selamat Datang! 👋</DialogTitle>
                <p className="text-sm text-gray-600">Mari setup sistem biaya operasional Anda dalam 2 langkah mudah</p>
              </div>
            </div>
          </DialogHeader>

          <div className="dialog-body overflow-y-auto">
            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-gray-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                <div>
                  <p className="font-medium text-gray-800">Tambah Biaya Operasional</p>
                  <p className="text-sm text-gray-600">Gas, sewa, marketing, dll (akan auto-klasifikasi)</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-gray-700 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                <div>
                  <p className="font-medium text-gray-800">Hitung Biaya per Produk</p>
                  <p className="text-sm text-gray-600">Set target produksi & kalkulasi otomatis</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-sm font-medium text-gray-700 mb-3">Pilih template bisnis untuk mulai cepat:</div>
              
              <div className="grid grid-cols-1 gap-2">
                <Button
                  onClick={() => handleQuickSetup('bakery')}
                  className="w-full flex items-center justify-between p-4 h-auto bg-gray-50 hover:bg-gray-100 text-gray-800 border border-gray-200"
                  variant="outline"
                  disabled={loading !== null}
                >
                  <div className="text-left">
                    <div className="font-medium">🧁 Toko Roti/Bakery</div>
                    <div className="text-xs text-gray-600">Gas oven, sewa dapur, marketing, dll</div>
                  </div>
                  {loading === 'bakery' ? (
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <div className="text-xs bg-gray-200 px-2 py-1 rounded">5 item</div>
                  )}
                </Button>
                
                <Button
                  onClick={() => handleQuickSetup('restaurant')}
                  className="w-full flex items-center justify-between p-4 h-auto bg-gray-50 hover:bg-gray-100 text-gray-800 border border-gray-200"
                  variant="outline"
                  disabled={loading !== null}
                >
                  <div className="text-left">
                    <div className="font-medium">🍽️ Restoran/Warung</div>
                    <div className="text-xs text-gray-600">Gas kompor, gaji koki, sewa, dll</div>
                  </div>
                  {loading === 'restaurant' ? (
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <div className="text-xs bg-gray-200 px-2 py-1 rounded">5 item</div>
                  )}
                </Button>
                
                <Button
                  onClick={() => handleQuickSetup('cafe')}
                  className="w-full flex items-center justify-between p-4 h-auto bg-gray-50 hover:bg-gray-100 text-gray-800 border border-gray-200"
                  variant="outline"
                  disabled={loading !== null}
                >
                  <div className="text-left">
                    <div className="font-medium">☕ Cafe/Kedai Kopi</div>
                    <div className="text-xs text-gray-600">Coffee machine, barista, sewa, dll</div>
                  </div>
                  {loading === 'cafe' ? (
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <div className="text-xs bg-gray-200 px-2 py-1 rounded">5 item</div>
                  )}
                </Button>
              </div>

              <div className="pt-4 border-t">
                <p className="text-xs text-gray-500 text-center mb-3">
                  💡 Tip: Template bisa diedit sesuai kebutuhan bisnis Anda
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="dialog-footer-pad">
            <Button
              onClick={onSkip}
              variant="outline"
              className="w-full sm:w-auto"
              disabled={loading !== null}
            >
              {loading ? 'Loading...' : 'Mulai dari Kosong'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingModal;