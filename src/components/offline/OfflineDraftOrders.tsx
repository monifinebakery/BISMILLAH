import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  Upload, 
  WifiOff,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { draftOrderStorage, syncQueueStorage } from '@/utils/offlineStorage';
import { usePWA } from '@/utils/pwaUtils';
import { toast } from 'sonner';

interface DraftOrderItem {
  productName: string;
  quantity: number;
  price: number;
  notes?: string;
}

interface DraftOrderForm {
  customerName: string;
  items: DraftOrderItem[];
  notes: string;
}

export default function OfflineDraftOrders() {
  const [drafts, setDrafts] = useState(draftOrderStorage.getDrafts());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDraft, setEditingDraft] = useState<any>(null);
  const [form, setForm] = useState<DraftOrderForm>({
    customerName: '',
    items: [{ productName: '', quantity: 1, price: 0, notes: '' }],
    notes: ''
  });
  const { isOnline } = usePWA();

  useEffect(() => {
    setDrafts(draftOrderStorage.getDrafts());
  }, []);

  const calculateTotal = (items: DraftOrderItem[]): number => {
    return items.reduce((total, item) => total + (item.quantity * item.price), 0);
  };

  const handleAddItem = () => {
    setForm(prev => ({
      ...prev,
      items: [...prev.items, { productName: '', quantity: 1, price: 0, notes: '' }]
    }));
  };

  const handleRemoveItem = (index: number) => {
    if (form.items.length > 1) {
      setForm(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
    }
  };

  const handleItemChange = (index: number, field: keyof DraftOrderItem, value: string | number) => {
    setForm(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleSaveDraft = () => {
    // Validation
    if (!form.customerName.trim()) {
      toast.error('Nama customer harus diisi');
      return;
    }

    const validItems = form.items.filter(item => 
      item.productName.trim() && item.quantity > 0 && item.price >= 0
    );

    if (validItems.length === 0) {
      toast.error('Minimal satu item harus diisi dengan valid');
      return;
    }

    const totalAmount = calculateTotal(validItems);
    const draftData = {
      customerName: form.customerName,
      items: validItems,
      totalAmount,
      notes: form.notes,
      status: 'draft' as const
    };

    let success = false;
    if (editingDraft) {
      success = draftOrderStorage.updateDraft(editingDraft.id, draftData);
      if (success) {
        toast.success('Draft order berhasil diupdate');
      }
    } else {
      const draftId = draftOrderStorage.saveDraft(draftData);
      success = !!draftId;
      if (success) {
        toast.success('Draft order berhasil disimpan');
      }
    }

    if (success) {
      setDrafts(draftOrderStorage.getDrafts());
      resetForm();
      setIsDialogOpen(false);
    }
  };

  const handleEditDraft = (draft: any) => {
    setEditingDraft(draft);
    setForm({
      customerName: draft.customerName || '',
      items: draft.items || [{ productName: '', quantity: 1, price: 0, notes: '' }],
      notes: draft.notes || ''
    });
    setIsDialogOpen(true);
  };

  const handleDeleteDraft = (id: string) => {
    const success = draftOrderStorage.removeDraft(id);
    if (success) {
      setDrafts(draftOrderStorage.getDrafts());
      toast.success('Draft order berhasil dihapus');
    }
  };

  const handleQueueForSync = (draft: any) => {
    if (!isOnline) {
      // Update status to pending sync
      draftOrderStorage.updateDraft(draft.id, { status: 'pending_sync' });
      
      // Add to sync queue
      syncQueueStorage.addOperation({
        type: 'create_order',
        data: {
          customerName: draft.customerName,
          items: draft.items,
          totalAmount: draft.totalAmount,
          notes: draft.notes,
          originalDraftId: draft.id
        },
        endpoint: '/api/orders',
        method: 'POST',
        priority: 'normal',
        maxAttempts: 3
      });

      setDrafts(draftOrderStorage.getDrafts());
      toast.success('Draft ditambahkan ke antrian sync');
    } else {
      // TODO: Direct API call when online
      toast.info('Fitur sync online sedang dalam pengembangan');
    }
  };

  const resetForm = () => {
    setForm({
      customerName: '',
      items: [{ productName: '', quantity: 1, price: 0, notes: '' }],
      notes: ''
    });
    setEditingDraft(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'pending_sync':
        return <Badge variant="outline" className="text-amber-600"><Clock className="h-3 w-3 mr-1" />Pending Sync</Badge>;
      case 'synced':
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Synced</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Offline Status */}
      {!isOnline && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-amber-800">
              <WifiOff className="h-4 w-4" />
              <span className="text-sm font-medium">Mode Offline - Draft orders akan disync ketika online</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Draft Orders ({drafts.length})
            </CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-1" />
                  Buat Draft
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingDraft ? 'Edit Draft Order' : 'Buat Draft Order Baru'}
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6 py-4">
                  {/* Customer Info */}
                  <div>
                    <Label>Nama Customer *</Label>
                    <Input
                      value={form.customerName}
                      onChange={(e) => setForm(prev => ({ ...prev, customerName: e.target.value }))}
                      placeholder="Masukkan nama customer"
                    />
                  </div>

                  {/* Items */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-medium">Items</Label>
                      <Button variant="outline" size="sm" onClick={handleAddItem}>
                        <Plus className="h-4 w-4 mr-1" />
                        Tambah Item
                      </Button>
                    </div>

                    {form.items.map((item, index) => (
                      <Card key={index} className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="md:col-span-2">
                            <Label>Nama Produk *</Label>
                            <Input
                              value={item.productName}
                              onChange={(e) => handleItemChange(index, 'productName', e.target.value)}
                              placeholder="Nama produk"
                            />
                          </div>
                          <div>
                            <Label>Quantity *</Label>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                            />
                          </div>
                          <div>
                            <Label>Harga Satuan *</Label>
                            <Input
                              type="number"
                              min="0"
                              value={item.price}
                              onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value) || 0)}
                            />
                          </div>
                          <div className="md:col-span-3">
                            <Label>Catatan Item</Label>
                            <Input
                              value={item.notes || ''}
                              onChange={(e) => handleItemChange(index, 'notes', e.target.value)}
                              placeholder="Catatan untuk item ini (opsional)"
                            />
                          </div>
                          <div className="flex items-end">
                            {form.items.length > 1 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemoveItem(index)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-gray-600">
                          Subtotal: Rp {(item.quantity * item.price).toLocaleString('id-ID')}
                        </div>
                      </Card>
                    ))}
                  </div>

                  {/* Order Notes */}
                  <div>
                    <Label>Catatan Order</Label>
                    <Textarea
                      value={form.notes}
                      onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Catatan tambahan untuk order ini..."
                      rows={3}
                    />
                  </div>

                  {/* Total */}
                  <div className="border-t pt-4">
                    <div className="text-right">
                      <div className="text-lg font-semibold">
                        Total: Rp {calculateTotal(form.items).toLocaleString('id-ID')}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Batal
                    </Button>
                    <Button onClick={handleSaveDraft}>
                      <Save className="h-4 w-4 mr-1" />
                      {editingDraft ? 'Update Draft' : 'Simpan Draft'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {drafts.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Belum ada draft order</p>
              <p className="text-sm">Buat draft order pertama Anda</p>
            </div>
          ) : (
            <div className="space-y-4">
              {drafts.map((draft) => (
                <Card key={draft.id} className="hover:bg-gray-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div>
                          <h4 className="font-medium">{draft.customerName}</h4>
                          <p className="text-sm text-gray-500">
                            {draft.items.length} item(s) • Rp {draft.totalAmount.toLocaleString('id-ID')}
                          </p>
                        </div>
                        {getStatusBadge(draft.status)}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditDraft(draft)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        {draft.status === 'draft' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQueueForSync(draft)}
                            title="Queue for sync when online"
                          >
                            <Upload className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteDraft(draft.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Item Summary */}
                    <div className="space-y-2">
                      {draft.items.slice(0, 3).map((item: any, index: number) => (
                        <div key={index} className="text-sm text-gray-600 flex justify-between">
                          <span>{item.productName} x{item.quantity}</span>
                          <span>Rp {(item.quantity * item.price).toLocaleString('id-ID')}</span>
                        </div>
                      ))}
                      {draft.items.length > 3 && (
                        <div className="text-sm text-gray-500">
                          +{draft.items.length - 3} item lainnya
                        </div>
                      )}
                    </div>

                    {draft.notes && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm text-gray-600">
                          <strong>Catatan:</strong> {draft.notes}
                        </p>
                      </div>
                    )}

                    <div className="mt-3 pt-3 border-t flex justify-between text-xs text-gray-500">
                      <span>Dibuat: {new Date(draft.created).toLocaleString('id-ID')}</span>
                      {draft.modified !== draft.created && (
                        <span>Diubah: {new Date(draft.modified).toLocaleString('id-ID')}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
