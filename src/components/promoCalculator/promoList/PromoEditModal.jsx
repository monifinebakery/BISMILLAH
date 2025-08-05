import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { toast } from 'sonner';

const PromoEditModal = ({ isOpen, promo, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    nama_promo: '',
    status: 'aktif',
    tanggal_mulai: '',
    tanggal_selesai: '',
    deskripsi: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  // ✅ Reset form when promo changes
  useEffect(() => {
    if (promo) {
      console.log('📝 Setting form data for promo:', promo);
      setFormData({
        nama_promo: promo.nama_promo || promo.namaPromo || '',
        status: promo.status || 'aktif',
        tanggal_mulai: promo.tanggal_mulai || '',
        tanggal_selesai: promo.tanggal_selesai || '',
        deskripsi: promo.deskripsi || ''
      });
    }
  }, [promo]);

  // ✅ Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        nama_promo: '',
        status: 'aktif',
        tanggal_mulai: '',
        tanggal_selesai: '',
        deskripsi: ''
      });
      setIsLoading(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!promo) {
      console.error('❌ No promo data available');
      toast.error('Data promo tidak tersedia');
      return;
    }

    // Validation
    if (!formData.nama_promo.trim()) {
      toast.error('Nama promo tidak boleh kosong');
      return;
    }

    console.log('📝 Submitting form data:', {
      promoId: promo.id,
      formData,
      originalPromo: promo
    });

    setIsLoading(true);
    try {
      // Call onSave from parent (PromoList)
      await onSave(formData);
      
      console.log('✅ Form submitted successfully');
      // Modal will be closed by parent on success
      
    } catch (error) {
      console.error('❌ Error in modal submit:', error);
      toast.error(`Gagal memperbarui promo: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleClose = () => {
    if (isLoading) return; // Prevent closing while saving
    onClose();
  };

  // Don't render if not open
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={handleClose}
        ></div>

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Edit Promo
                </h3>
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isLoading}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Promo *
                  </label>
                  <input
                    type="text"
                    value={formData.nama_promo}
                    onChange={(e) => handleInputChange('nama_promo', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                    disabled={isLoading}
                    placeholder="Masukkan nama promo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    disabled={isLoading}
                  >
                    <option value="aktif">Aktif</option>
                    <option value="nonaktif">Non-aktif</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tanggal Mulai
                    </label>
                    <input
                      type="date"
                      value={formData.tanggal_mulai}
                      onChange={(e) => handleInputChange('tanggal_mulai', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tanggal Selesai
                    </label>
                    <input
                      type="date"
                      value={formData.tanggal_selesai}
                      onChange={(e) => handleInputChange('tanggal_selesai', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      disabled={isLoading}
                      min={formData.tanggal_mulai} // Ensure end date is after start date
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Deskripsi
                  </label>
                  <textarea
                    value={formData.deskripsi}
                    onChange={(e) => handleInputChange('deskripsi', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                    disabled={isLoading}
                    placeholder="Deskripsi promo (opsional)"
                  />
                </div>

                {/* Display promo info */}
                {promo && (
                  <div className="bg-gray-50 rounded-lg p-3 text-sm">
                    <div className="font-medium text-gray-700 mb-1">Info Promo:</div>
                    <div className="text-gray-600">
                      ID: {promo.id} | Dibuat: {new Date(promo.createdAt || promo.created_at).toLocaleDateString('id-ID')}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isLoading || !formData.nama_promo.trim()}
                className="w-full inline-flex justify-center items-center space-x-2 rounded-lg border border-transparent shadow-sm px-4 py-2 bg-orange-600 text-base font-medium text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Simpan Perubahan</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PromoEditModal;