// src/components/purchase/components/dialogs/EditItemDialog.tsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Edit3, Save, X } from 'lucide-react';
import { ActionButtons } from '@/components/ui/action-buttons';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/shared';
import { SafeNumericInput } from './SafeNumericInput';
import type { PurchaseItem } from '../../types/purchase.types';
import { parseRobustNumber } from '@/utils/robustNumberParser';

interface EditItemDialogProps {
  isOpen: boolean;
  item?: PurchaseItem | null;
  itemIndex?: number;
  onClose: () => void;
  onSave: (index: number, updatedItem: Partial<PurchaseItem>) => void;
}

export const EditItemDialog: React.FC<EditItemDialogProps> = ({
  isOpen,
  item,
  itemIndex,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    quantity: '',
    unitPrice: '',
    keterangan: '',
  });

  // Initialize form when dialog opens with item data
  useEffect(() => {
    if (isOpen && item) {
      console.log('🔧 Edit dialog opened for item:', item);
      setFormData({
        quantity: String(item.quantity || 0),
        unitPrice: String(item.unitPrice || 0),
        keterangan: item.keterangan || '',
      });
    }
  }, [isOpen, item]);

  // Calculate subtotal in real time
  const kuantitasNum = parseRobustNumber(formData.quantity, 0);
  const harga_satuan_num = parseRobustNumber(formData.unitPrice, 0);
  const subtotal = kuantitasNum * harga_satuan_num;

  const handleSave = () => {
    if (!item || itemIndex === undefined) {
      toast.error('Data item tidak valid');
      return;
    }

    if (kuantitasNum <= 0) {
      toast.error('Kuantitas harus lebih dari 0');
      return;
    }

    if (harga_satuan_num <= 0) {
      toast.error('Harga satuan harus lebih dari 0');
      return;
    }

    const updatedItem: Partial<PurchaseItem> = {
      quantity: kuantitasNum,
      unitPrice: harga_satuan_num,
      subtotal: subtotal,
      keterangan: formData.keterangan.trim(),
    };

    console.log('💾 Saving item with data:', updatedItem);
    onSave(itemIndex, updatedItem);
    toast.success('Item berhasil diperbarui');
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  if (!isOpen || !item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent centerMode="overlay" size="md">
        <div className="dialog-panel dialog-panel-md">
          <DialogHeader className="dialog-header">
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Edit3 className="w-4 h-4 text-orange-600" />
              </div>
              <span className="text-lg">Edit Item</span>
            </DialogTitle>
            <DialogDescription>
              Edit detail item: <strong>{item.nama}</strong> ({item.satuan})
            </DialogDescription>
          </DialogHeader>

          <div className="dialog-body space-y-4">
            {/* Info Item */}
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="text-sm text-gray-600">
                <strong>Item:</strong> {item.nama}
              </div>
              <div className="text-sm text-gray-600">
                <strong>Satuan:</strong> {item.satuan}
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Kuantitas *
                </Label>
                <div className="flex gap-2">
                  <SafeNumericInput
                    value={formData.quantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                    placeholder="0"
                    className="h-11 border-gray-200 focus:border-orange-500 focus:ring-orange-500/20"
                  />
                  <div className="flex items-center px-3 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-600 min-w-[70px] justify-center">
                    {item.satuan}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Harga Satuan *
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                    Rp
                  </span>
                  <SafeNumericInput
                    value={formData.unitPrice}
                    onChange={(e) => setFormData(prev => ({ ...prev, unitPrice: e.target.value }))}
                    className="h-11 pl-8 border-gray-200 focus:border-orange-500 focus:ring-orange-500/20"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* Keterangan */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Keterangan
              </Label>
              <Textarea
                value={formData.keterangan}
                onChange={(e) => setFormData(prev => ({ ...prev, keterangan: e.target.value }))}
                placeholder="Keterangan tambahan (opsional)"
                rows={3}
                className="border-gray-200 focus:border-orange-500 focus:ring-orange-500/20"
              />
            </div>

            {/* Subtotal Preview */}
            {(kuantitasNum > 0 && harga_satuan_num > 0) && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-green-700">
                    <strong>Preview:</strong> {kuantitasNum} {item.satuan} × {formatCurrency(harga_satuan_num)}
                  </div>
                  <div className="text-lg font-bold text-green-900">
                    {formatCurrency(subtotal)}
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="dialog-footer">
            <ActionButtons
              actions={[
                {
                  type: 'secondary',
                  label: 'Batal',
                  icon: X,
                  onClick: handleCancel,
                },
                {
                  type: 'primary',
                  label: 'Simpan',
                  icon: Save,
                  onClick: handleSave,
                  disabled: kuantitasNum <= 0 || harga_satuan_num <= 0,
                },
              ]}
            />
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditItemDialog;
