// 🎯 Enhanced FollowUpTemplateManager dengan FollowUpTemplateContext Integration
import React, { useState, useEffect } from 'react';
import { MessageSquare, Plus, Edit, Trash2, Send, Eye, X, Copy, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';
import { toast } from 'sonner';
import { formatCurrency } from '@/utils/formatUtils';
import { formatDateForDisplay } from '../../utils';
import { useFollowUpTemplate, useProcessTemplate } from '@/contexts/FollowUpTemplateContext';
import type { Order } from '../../types';

interface Template {
  id: string;
  name: string;
  message: string;
  createdAt: Date;
}

interface FollowUpTemplateManagerProps {
  isOpen: boolean;
  onClose: () => void;
  order?: Order | null;
  onSendWhatsApp?: (message: string, order: Order) => void;
}

const FollowUpTemplateManager: React.FC<FollowUpTemplateManagerProps> = ({
  isOpen,
  onClose,
  order,
  onSendWhatsApp
}) => {
  // ✅ INTEGRATED: Use FollowUpTemplateContext
  const { templates: contextTemplates, getTemplate, saveTemplate, isLoading } = useFollowUpTemplate();
  const { processTemplate } = useProcessTemplate();

  // Convert context templates to Template array format
  const [templates, setTemplates] = useState<Template[]>([]);
  
  // Update templates when context changes
  useEffect(() => {
    const templateArray = Object.entries(contextTemplates).map(([status, message], index) => ({
      id: status,
      name: getStatusDisplayName(status),
      message: message,
      createdAt: new Date()
    }));
    setTemplates(templateArray);
  }, [contextTemplates]);

  // Helper function to get display name for status
  const getStatusDisplayName = (status: string): string => {
    const statusNames: Record<string, string> = {
      pending: 'Konfirmasi Pesanan',
      confirmed: 'Pesanan Dikonfirmasi',
      shipping: 'Update Pengiriman', 
      delivered: 'Pesanan Selesai',
      cancelled: 'Pesanan Dibatalkan'
    };
    return statusNames[status] || status;
  };

  // Form state untuk template baru/edit
  const [isCreating, setIsCreating] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    message: ''
  });

  // Preview state
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [previewMessage, setPreviewMessage] = useState('');

  // ✅ ENHANCED: Generate items list dalam berbagai format
  const generateItemsList = (orderData: Order | null, format: 'simple' | 'detailed' = 'simple') => {
    if (!orderData?.items || orderData.items.length === 0) {
      return 'Tidak ada item';
    }

    if (format === 'simple') {
      return orderData.items
        .map((item: any) => `- ${item.namaBarang || item.name || 'Item'} (${item.quantity}x)`)
        .join('\n');
    }

    // Format detailed dengan harga
    return orderData.items
      .map((item: any) => {
        const name = item.namaBarang || item.name || 'Item';
        const quantity = item.quantity || 1;
        const price = item.harga || item.price || 0;
        const subtotal = quantity * price;
        
        return `- ${name}\n  Qty: ${quantity}x @ ${formatCurrency(price)} = ${formatCurrency(subtotal)}`;
      })
      .join('\n\n');
  };

  // ✅ UPDATED: Generate preview message - sesuai dengan FollowUpTemplateContext
  const generatePreview = (template: Template, orderData: Order | null) => {
    if (!orderData || !template) return template?.message || '';

    // Gunakan processTemplate dari context untuk konsistensi
    const { processTemplate } = useProcessTemplate();
    return processTemplate(template.message, orderData);
  };

  // Update preview when template or order changes
  useEffect(() => {
    if (selectedTemplate) {
      setPreviewMessage(generatePreview(selectedTemplate, order));
    }
  }, [selectedTemplate, order]);

  // Handle template form
  const handleCreateTemplate = () => {
    setIsCreating(true);
    setEditingTemplate(null);
    setTemplateForm({ name: '', message: '' });
  };

  const handleEditTemplate = (template: Template) => {
    setEditingTemplate(template);
    setIsCreating(true);
    setTemplateForm({
      name: template.name,
      message: template.message
    });
  };

  const handleSaveTemplate = () => {
    if (!templateForm.name.trim() || !templateForm.message.trim()) {
      toast.error('Nama dan pesan template harus diisi');
      return;
    }

    if (editingTemplate) {
      // Update existing template
      setTemplates(prev => prev.map(t => 
        t.id === editingTemplate.id 
          ? { ...t, name: templateForm.name, message: templateForm.message }
          : t
      ));
      toast.success('Template berhasil diperbarui');
    } else {
      // Create new template
      const newTemplate: Template = {
        id: Date.now().toString(),
        name: templateForm.name,
        message: templateForm.message,
        createdAt: new Date()
      };
      setTemplates(prev => [...prev, newTemplate]);
      toast.success('Template berhasil dibuat');
    }

    setIsCreating(false);
    setEditingTemplate(null);
    setTemplateForm({ name: '', message: '' });
  };

  const handleDeleteTemplate = (templateId: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus template ini?')) {
      setTemplates(prev => prev.filter(t => t.id !== templateId));
      toast.success('Template berhasil dihapus');
    }
  };

  const handleSendMessage = () => {
    if (!order || !selectedTemplate || !onSendWhatsApp) {
      toast.error('Data tidak lengkap untuk mengirim pesan');
      return;
    }

    onSendWhatsApp(previewMessage, order);
    toast.success('Pesan WhatsApp berhasil dikirim');
    onClose();
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(previewMessage);
    toast.success('Pesan berhasil disalin ke clipboard');
  };

  // ✅ UPDATED: Available variables list - sesuai dengan FollowUpTemplateContext
  const availableVariables = [
    { key: '{nama_pelanggan}', desc: 'Nama pelanggan (legacy - gunakan {{namaPelanggan}})' },
    { key: '{{namaPelanggan}}', desc: 'Nama pelanggan' },
    { key: '{{nomorPesanan}}', desc: 'Nomor pesanan' },
    { key: '{{totalPesanan}}', desc: 'Total harga pesanan' },
    { key: '{{tanggal}}', desc: 'Tanggal pesanan' },
    { key: '{{status}}', desc: 'Status pesanan' },
    { key: '{{telefonPelanggan}}', desc: 'Nomor telepon pelanggan' },
    { key: '{{emailPelanggan}}', desc: 'Email pelanggan' },
    { key: '{{alamatPengiriman}}', desc: 'Alamat pengiriman' },
    { key: '{{catatan}}', desc: 'Catatan pesanan' },
    { key: '{{subtotal}}', desc: 'Subtotal pesanan' },
    { key: '{{pajak}}', desc: 'Pajak pesanan' },
    { key: '{{items}}', desc: 'Daftar item sederhana (nama + qty)' },
    { key: '{{itemsDetail}}', desc: 'Daftar item detail (nama + qty + harga)' },
    { key: '{{jumlahItems}}', desc: 'Jumlah jenis item' },
    { key: '{{totalQuantity}}', desc: 'Total kuantitas semua item' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Kelola Template Follow-Up WhatsApp
            {order && (
              <span className="text-sm font-normal text-gray-600">
                - Pesanan #{order.nomorPesanan}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="templates" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="templates">Template</TabsTrigger>
            <TabsTrigger value="variables">Variabel</TabsTrigger>
            </TabsTrigger>
          </TabsList>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Template Pesan</h3>
              <Button onClick={handleCreateTemplate} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Buat Template Baru
              </Button>
            </div>

            {/* Template Form */}
            {isCreating && (
              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-semibold mb-3">
                  {editingTemplate ? 'Edit Template' : 'Template Baru'}
                </h4>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="templateName">Nama Template</Label>
                    <Input
                      id="templateName"
                      value={templateForm.name}
                      onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Masukkan nama template"
                    />
                  </div>
                  <div>
                    <Label htmlFor="templateMessage">Pesan Template</Label>
                    <Textarea
                      id="templateMessage"
                      value={templateForm.message}
                      onChange={(e) => setTemplateForm(prev => ({ ...prev, message: e.target.value }))}
                      placeholder="Masukkan pesan template... Gunakan variabel seperti {nama_pelanggan}, {daftar_items}, dll."
                      rows={6}
                      className="font-mono text-sm"
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      💡 Tip: Lihat tab "Variabel" untuk melihat semua variabel yang tersedia
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveTemplate}>
                      {editingTemplate ? 'Update' : 'Simpan'} Template
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setIsCreating(false);
                        setEditingTemplate(null);
                        setTemplateForm({ name: '', message: '' });
                      }}
                    >
                      Batal
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Template List */}
            <div className="space-y-2">
              {templates.map((template) => (
                <div 
                  key={template.id} 
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedTemplate?.id === template.id ? 'border-orange-500 bg-orange-50' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedTemplate(template)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{template.name}</h4>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditTemplate(template);
                        }}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTemplate(template.id);
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-3 whitespace-pre-line">{template.message}</p>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* ✅ NEW: Variables Tab */}
          <TabsContent value="variables" className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-4">Variabel yang Tersedia</h3>
              
              <Alert className="mb-4">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Gunakan variabel ini dalam template Anda. Variabel akan otomatis diganti dengan data pesanan saat mengirim pesan.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {availableVariables.map((variable) => (
                  <div key={variable.key} className="border rounded-lg p-3 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <code className="text-sm font-mono bg-white px-2 py-1 rounded border">
                        {variable.key}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(variable.key);
                          toast.success(`Variabel ${variable.key} disalin`);
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{variable.desc}</p>
                  </div>
                ))}
              </div>

              {/* ✅ Example with current order data */}
              {order && (
                <div className="mt-6 border rounded-lg p-4 bg-blue-50">
                  <h4 className="font-semibold text-blue-800 mb-3">Contoh Data Pesanan Saat Ini:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div><strong>Nama:</strong> {order.namaPelanggan}</div>
                    <div><strong>No. Pesanan:</strong> #{order.nomorPesanan}</div>
                    <div><strong>Total:</strong> {formatCurrency(order.totalPesanan)}</div>
                    <div><strong>Status:</strong> {order.status}</div>
                    <div><strong>Jumlah Item:</strong> {order.items?.length || 0} jenis</div>
                    <div><strong>Total Qty:</strong> {order.items?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0} unit</div>
                  </div>
                  
                  {order.items && order.items.length > 0 && (
                    <div className="mt-3">
                      <strong>Daftar Items:</strong>
                      <div className="text-xs bg-white p-2 rounded border mt-1 max-h-20 overflow-y-auto">
                        {generateItemsList(order, 'simple')}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="space-y-4">
            {selectedTemplate && order && (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">Preview Pesan</h4>
                  <div className="text-sm space-y-1 text-blue-700">
                    <div><strong>Template:</strong> {selectedTemplate.name}</div>
                    <div><strong>Untuk:</strong> {order.namaPelanggan} ({order.telefonPelanggan})</div>
                    <div><strong>Pesanan:</strong> #{order.nomorPesanan}</div>
                    <div><strong>Items:</strong> {order.items?.length || 0} jenis item</div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <Label className="text-sm font-medium">Pesan yang akan dikirim:</Label>
                  <div className="mt-2 p-3 bg-gray-50 rounded border min-h-[150px] whitespace-pre-wrap text-sm">
                    {previewMessage}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button onClick={handleSendMessage} className="flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    Kirim WhatsApp
                  </Button>
                  <Button variant="outline" onClick={handleCopyMessage} className="flex items-center gap-2">
                    <Copy className="h-4 w-4" />
                    Salin Pesan
                  </Button>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>

        {/* Close Button */}
        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Tutup
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FollowUpTemplateManager;