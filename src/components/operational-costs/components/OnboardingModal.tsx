import React from 'react';
import { Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useOperationalCost } from '../context';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSkip: () => void;
}

type BusinessType = 'bakery' | 'restaurant' | 'cafe';

const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose, onSkip }) => {
  const { actions } = useOperationalCost();

  // Quick setup for common cost types
  const handleQuickSetup = async (type: BusinessType) => {
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

    for (const template of templates) {
      try {
        const success = await actions.createCost({ ...template, status: 'aktif' });
        if (success) successCount++;
      } catch (error) {
        console.error('Error creating template cost:', error);
      }
    }

    if (successCount > 0) {
      toast.success(`Setup ${type} berhasil!`, {
        description: `${successCount} biaya contoh telah ditambahkan. Silakan edit sesuai kebutuhan.`
      });
      
      // Trigger explicit data refresh to ensure costs are immediately visible
      try {
        await actions.refreshData();
      } catch (error) {
        console.warn('Warning: Could not refresh data after quick setup:', error);
      }
      
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="dialog-overlay-center">
      <div className="dialog-panel max-w-lg w-full px-12 sm:px-16 max-h-[70vh] overflow-y-auto">
        <div className="dialog-body">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Info className="h-8 w-8 text-gray-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Selamat Datang! 👋</h2>
            <p className="text-gray-600">Mari setup sistem biaya operasional Anda dalam 2 langkah mudah</p>
          </div>

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
              >
                <div className="text-left">
                  <div className="font-medium">🧁 Toko Roti/Bakery</div>
                  <div className="text-xs text-gray-600">Gas oven, sewa dapur, marketing, dll</div>
                </div>
                <div className="text-xs bg-gray-200 px-2 py-1 rounded">5 item</div>
              </Button>
              
              <Button
                onClick={() => handleQuickSetup('restaurant')}
                className="w-full flex items-center justify-between p-4 h-auto bg-gray-50 hover:bg-gray-100 text-gray-800 border border-gray-200"
                variant="outline"
              >
                <div className="text-left">
                  <div className="font-medium">🍽️ Restoran/Warung</div>
                  <div className="text-xs text-gray-600">Gas kompor, gaji koki, sewa, dll</div>
                </div>
                <div className="text-xs bg-gray-200 px-2 py-1 rounded">5 item</div>
              </Button>
              
              <Button
                onClick={() => handleQuickSetup('cafe')}
                className="w-full flex items-center justify-between p-4 h-auto bg-gray-50 hover:bg-gray-100 text-gray-800 border border-gray-200"
                variant="outline"
              >
                <div className="text-left">
                  <div className="font-medium">☕ Cafe/Kedai Kopi</div>
                  <div className="text-xs text-gray-600">Coffee machine, barista, sewa, dll</div>
                </div>
                <div className="text-xs bg-gray-200 px-2 py-1 rounded">5 item</div>
              </Button>
            </div>

            <div className="pt-4 border-t">
              <Button
                onClick={onSkip}
                variant="outline"
                className="w-full mb-2"
              >
                Mulai dari Kosong
              </Button>
              <p className="text-xs text-gray-500 text-center">
                💡 Tip: Template bisa diedit sesuai kebutuhan bisnis Anda
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;