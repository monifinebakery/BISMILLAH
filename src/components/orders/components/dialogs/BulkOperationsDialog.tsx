// src/components/orders/components/dialogs/BulkOperationsDialog.tsx
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { X, Settings2, Trash2, AlertTriangle, Save, Edit } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/shared';
import { getStatusText, getStatusColor } from '../../constants';
import type { Order, OrderStatus } from '../../types';

interface BulkOperationsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  operation: 'edit' | 'delete';
  selectedOrders: Order[];
  onConfirm: (data?: any) => Promise<void>;
  isProcessing: boolean;
}

interface BulkEditData {
  status?: OrderStatus;
  tanggalPengiriman?: string;
  catatan?: string;
}

const BulkOperationsDialog: React.FC<BulkOperationsDialogProps> = ({
  const { formatCurrency } = useCurrency();  isOpen,
  onClose,
  operation,
  selectedOrders,
  onConfirm,
  isProcessing,
}) => {
  const [bulkEditData, setBulkEditData] = useState<BulkEditData>({});
  const { formatCurrency } = useCurrency();
  const isEditMode = operation === 'edit';
  const selectedCount = selectedOrders.length;

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setBulkEditData({});
    }
  }, [isOpen]);

  // Handle form field changes
  const handleFieldChange = (field: keyof BulkEditData, value: string | undefined) => {
  const { formatCurrency } = useCurrency();    setBulkEditData(prev => ({ ...prev, [field]: value }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
  const { formatCurrency } = useCurrency();    e.preventDefault();
    
    if (isEditMode) {
      // Filter out empty values for bulk edit
      const cleanedData = Object.entries(bulkEditData).reduce((acc, [key, value]) => {
  const { formatCurrency } = useCurrency();        if (value !== undefined && value !== '' && value !== null) {
          acc[key as keyof BulkEditData] = value;
        }
        return acc;
      }, {} as BulkEditData);

      await onConfirm(cleanedData);
    } else {
      // For delete, no data needed
      await onConfirm();
    }
  };

  // Calculate total value
  const totalValue = selectedOrders.reduce((sum, order: any) => sum + (order.total_pesanan ?? order.totalAmount ?? 0), 0);

  // Group orders by status
  const statusGroups = selectedOrders.reduce((groups, order) => {
  const { formatCurrency } = useCurrency();    if (!groups[order.status]) {
      groups[order.status] = [];
    }
    groups[order.status].push(order);
    return groups;
  }, {} as Record<OrderStatus, Order[]>);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              isEditMode ? 'bg-blue-100' : 'bg-red-100'
            }`}>
              {isEditMode ? (
                <Settings2 className="w-5 h-5 text-blue-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-600" />
              )}
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold text-gray-900">
                {isEditMode ? 'Edit Massal Pesanan' : 'Hapus Massal Pesanan'}
              </DialogTitle>
              <p className="text-sm text-gray-600">
                {isEditMode 
                  ? `Ubah ${selectedCount} pesanan yang dipilih` 
                  : `Hapus ${selectedCount} pesanan yang dipilih`
                }
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Summary Info */}
          <div className={`border rounded-lg p-4 ${
            isEditMode ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {isEditMode ? (
                <Edit className="h-4 w-4 text-blue-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              )}
              <span className={`font-semibold ${
                isEditMode ? 'text-blue-800' : 'text-red-800'
              }`}>
                Ringkasan {isEditMode ? 'Edit' : 'Penghapusan'}
              </span>
            </div>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>Jumlah pesanan:</span>
                <span className="font-semibold">{selectedCount} pesanan</span>
              </div>
              <div className="flex justify-between">
                <span>Total nilai pesanan:</span>
                <span className="font-semibold">{formatCurrency(totalValue)}</span>
              </div>
            </div>
          </div>

          {/* Status Distribution */}
          <div className="border rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Distribusi Status</h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(statusGroups).map(([status, orders]) => (
                <div key={status} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                    getStatusColor(status as OrderStatus)
                  }`}>
                    {getStatusText(status as OrderStatus)}
                  </span>
                  <span className="text-sm font-medium">{orders.length}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Edit Form - Only show in edit mode */}
          {isEditMode && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900">Data yang akan diubah</h3>
              
              {/* Status Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status Baru
                </label>
                <Select
                  value={bulkEditData.status || ''}
                  onValueChange={(value) => handleFieldChange('status', value as OrderStatus)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih status baru (opsional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Menunggu</SelectItem>
                    <SelectItem value="confirmed">Dikonfirmasi</SelectItem>
                    <SelectItem value="processing">Diproses</SelectItem>
                    <SelectItem value="shipped">Dikirim</SelectItem>
                    <SelectItem value="delivered">Diterima</SelectItem>
                    <SelectItem value="cancelled">Dibatalkan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tanggal Pengiriman Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal Pengiriman
                </label>
                <Input
                  type="date"
                  value={bulkEditData.tanggalPengiriman || ''}
                  onChange={(e) => handleFieldChange('tanggalPengiriman', e.target.value)}
                  placeholder="Pilih tanggal pengiriman (opsional)"
                />
              </div>

              {/* Catatan Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catatan
                </label>
                <Textarea
                  value={bulkEditData.catatan || ''}
                  onChange={(e) => handleFieldChange('catatan', e.target.value)}
                  placeholder="Tambahkan catatan (opsional)"
                  rows={3}
                />
              </div>

              {/* Help Text */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Edit className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Tips Edit Massal:</p>
                    <ul className="list-disc list-inside space-y-1 text-blue-700">
                      <li>Field yang kosong tidak akan mengubah data yang ada</li>
                      <li>Semua pesanan yang dipilih akan diubah sesuai input</li>
                      <li>Perubahan status akan mempengaruhi workflow pesanan</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Delete Confirmation - Only show in delete mode */}
          {!isEditMode && (
            <div className="space-y-4">
              {/* Order List Preview */}
              {selectedOrders.length > 0 && (
                <div className="max-h-60 overflow-y-auto border rounded-lg">
                  <div className="bg-gray-50 px-4 py-2 border-b">
                    <span className="text-sm font-medium text-gray-700">Pesanan yang akan dihapus:</span>
                  </div>
                  <div className="divide-y">
                    {selectedOrders.slice(0, 10).map((order: any) => (
                      <div key={order.id} className="px-4 py-3 flex items-center justify-between">
                        <div>
                          <div className="font-medium">#{order.nomor_pesanan || order.order_number || order.orderNumber}</div>
                          <div className="text-sm text-gray-600">{order.nama_pelanggan || order.customer_name || order.customerName}</div>
                          <div className="text-xs text-gray-500">
                            {formatDate(order.tanggal)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{formatCurrency(order.total_pesanan ?? order.totalAmount ?? 0)}</div>
                          <div className="text-xs text-gray-500 capitalize">{order.status}</div>
                        </div>
                      </div>
                    ))}
                    {selectedCount > 10 && (
                      <div className="px-4 py-2 text-center text-sm text-gray-500 bg-gray-50">
                        ... dan {selectedCount - 10} pesanan lainnya
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Warning Message */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-yellow-800">
                    <div className="font-semibold mb-1">Peringatan:</div>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Data pesanan akan dihapus secara permanen</li>
                      <li>Riwayat transaksi terkait akan hilang</li>
                      <li>Tindakan ini tidak dapat dibatalkan</li>
                      <li>Pastikan Anda sudah membuat backup jika diperlukan</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
          >
            Batal
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isProcessing}
            className={`flex items-center gap-2 ${
              isEditMode 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {isProcessing ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                {isEditMode ? 'Menyimpan...' : 'Menghapus...'}
              </>
            ) : (
              <>
                {isEditMode ? (
                  <>
                    <Save className="w-4 h-4" />
                    Simpan Perubahan
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Hapus {selectedCount} Pesanan
                  </>
                )}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkOperationsDialog;
export type { BulkOperationsDialogProps, BulkEditData };
