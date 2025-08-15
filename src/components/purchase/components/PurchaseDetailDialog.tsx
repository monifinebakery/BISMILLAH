// src/components/purchase/components/PurchaseDetailDialog.tsx
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Package, 
  Calendar, 
  User, 
  MapPin, 
  Phone, 
  Mail,
  FileText,
  DollarSign,
  Hash,
  Clock,
} from 'lucide-react';

import { Purchase } from '../types/purchase.types';
import { getStatusDisplayText, getStatusColor } from '../utils/purchaseHelpers';

interface PurchaseDetailDialogProps {
  isOpen: boolean;
  purchase: Purchase | null;
  suppliers: any[];
  bahanBaku: any[];
  onClose: () => void;
  onEdit?: (purchase: Purchase) => void;
}

const currency = (n: number) =>
  `Rp ${Number(n || 0).toLocaleString('id-ID')}`;

const PurchaseDetailDialog: React.FC<PurchaseDetailDialogProps> = ({
  isOpen,
  purchase,
  suppliers,
  bahanBaku,
  onClose,
  onEdit
}) => {
  if (!purchase) return null;

  // Get supplier details
  const supplier = suppliers.find(s => s.id === (purchase as any).supplierId || s.id === (purchase as any).supplier_id);
  
  // Format date
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  // Get material name by ID (support old & new key)
  const getMaterialName = (item: any) => {
    const id = item.bahan_baku_id ?? item.bahanBakuId;
    const material = bahanBaku.find((bb) => bb.id === id);
    return material?.nama || 'Material tidak ditemukan';
  };

  // Normalize item fields (support old & new schema)
  const normalizeItem = (raw: any) => {
    const qtyBase = raw.qty_base ?? raw.kuantitas ?? 0;
    const baseUnit = raw.base_unit ?? raw.satuan ?? '';
    const hargaUnit = raw.harga_per_satuan ?? raw.hargaSatuan ?? 0;
    const subtotal = raw.subtotal ?? (Number(qtyBase) * Number(hargaUnit));
    const kemasan = (raw.jumlah_kemasan && raw.isi_per_kemasan)
      ? `${raw.jumlah_kemasan} × ${raw.isi_per_kemasan} ${baseUnit}${raw.satuan_kemasan ? ` (${raw.satuan_kemasan})` : ''}`
      : null;

    return {
      nama: getMaterialName(raw),
      catatan: raw.catatan ?? null,
      qtyBase,
      baseUnit,
      hargaUnit,
      subtotal,
      kemasanInfo: kemasan
    };
  };

  const handleEdit = () => {
    if (onEdit && purchase.status !== 'completed') {
      onEdit(purchase);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                <Package className="h-5 w-5" />
                Detail Pembelian
              </DialogTitle>
              <DialogDescription className="mt-1">
                Informasi lengkap pembelian dari supplier
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant="outline" 
                className={`${getStatusColor(purchase.status)} text-sm`}
              >
                {getStatusDisplayText(purchase.status)}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Purchase Info Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column - Basic Info */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Informasi Pembelian
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">ID:</span>
                    <span className="font-mono text-sm">{purchase.id}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Tanggal:</span>
                    <span className="text-sm">{formatDate(purchase.tanggal)}</span>
                  </div>

                  {(purchase as any).createdAt && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Dibuat:</span>
                      <span className="text-sm">{formatDate((purchase as any).createdAt)}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Total Nilai:</span>
                    <span className="font-semibold text-green-600">
                      {currency(purchase.totalNilai)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes Section */}
              {purchase.catatan && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Catatan
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {purchase.catatan}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Supplier Info */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Informasi Supplier
                </h3>
                {supplier ? (
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <User className="h-4 w-4 text-gray-500 mt-0.5" />
                      <div>
                        <span className="text-sm text-gray-600">Nama:</span>
                        <p className="font-medium">{supplier.nama}</p>
                      </div>
                    </div>

                    {supplier.alamat && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                        <div>
                          <span className="text-sm text-gray-600">Alamat:</span>
                          <p className="text-sm">{supplier.alamat}</p>
                        </div>
                      </div>
                    )}

                    {supplier.telepon && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Telepon:</span>
                        <span className="text-sm">{supplier.telepon}</span>
                      </div>
                    )}

                    {supplier.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Email:</span>
                        <span className="text-sm">{supplier.email}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      Data supplier tidak ditemukan
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Items Section */}
          <div>
            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Daftar Item ({purchase.items?.length || 0} item)
            </h3>
            
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Bahan Baku
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Qty (base)
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Harga / base
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {purchase.items.map((raw: any, index: number) => {
                      const item = normalizeItem(raw);
                      return (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-gray-900">{item.nama}</p>
                              {item.kemasanInfo && (
                                <p className="text-xs text-gray-500 mt-0.5">
                                  Kemasan: {item.kemasanInfo}
                                </p>
                              )}
                              {raw.catatan && (
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {raw.catatan}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm text-gray-900">
                              {item.qtyBase} {item.baseUnit}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm text-gray-900">
                              {currency(item.hargaUnit)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="font-medium text-gray-900">
                              {currency(item.subtotal)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-right font-medium text-gray-900">
                        Total Keseluruhan:
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-lg text-green-600">
                        {currency(purchase.totalNilai)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-gray-500">
              {(purchase as any).updatedAt && (
                <span>Terakhir diupdate: {formatDate((purchase as any).updatedAt)}</span>
              )}
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose}>
                Tutup
              </Button>
              
              {purchase.status !== 'completed' && onEdit && (
                <Button onClick={handleEdit}>
                  Edit Pembelian
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseDetailDialog;
