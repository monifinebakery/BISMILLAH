// 🎯 180 lines - Follow-up template manager dengan logika asli
import React, { useState, useEffect } from 'react';
import { MessageSquare, Plus, Edit, Trash2, Send, Eye, X, Copy } from 'lucide-react';
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
import { toast } from 'sonner';
import { formatCurrency } from '@/utils/formatUtils';
import { formatDateForDisplay } from '../../utils';
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
  // Template state
  const [templates, setTemplates] = useState<Template[]>([
    {
      id: '1',
      name: 'Konfirmasi Pesanan',
      message: 'Hai kak {nama_pelanggan}, terima kasih ya udah order dengan nomor #{nomor_pesanan} senilai {total_pesanan}. Pesanan kakak lagi kami proses nih 😊',
      createdAt: new Date()
    },
    {
      id: '2', 
      name: 'Update Pengiriman',
      message: 'Halo kak {nama_pelanggan}, pesanan kakak dengan nomor #{nomor_pesanan} sudah kami kirim dan sedang dalam perjalanan ya 🚚✨',
      createdAt: new Date()
    },
    {
      id: '3',
      name: 'Pesanan Selesai',
      message: 'Halo {nama_pelanggan}, pesanan #{nomor_pesanan} telah selesai. Terima kasih telah berbelanja dengan kami!',
      createdAt: new Date()
    }
  ]);

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

  // Generate preview message dengan data order
  const generatePreview = (template: Template, orderData: Order | null) => {
    if (!orderData || !template) return template?.message || '';

    let message = template.message;
    
    // Replace placeholders
    message = message.replace(/\{nama_pelanggan\}/g, orderData.namaPelanggan);
    message = message.replace(/\{nomor_pesanan\}/g, orderData.nomorPesanan);
    message = message.replace(/\{total_pesanan\}/g, formatCurrency(orderData.totalPesanan));
    message = message.replace(/\{tanggal_pesanan\}/g, formatDateForDisplay(orderData.tanggal));
    message = message.replace(/\{status_pesanan\}/g, orderData.status);
    message = message.replace(/\{telepon_pelanggan\}/g, orderData.teleponPelanggan);
    message = message.replace(/\{email_pelanggan\}/g, orderData.emailPelanggan);
    message = message.replace(/\{alamat_pengiriman\}/g, orderData.alamatPengiriman);

    return message;
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Kelola Template Follow-Up
            {order && (
              <span className="text-sm font-normal text-gray-600">
                - Pesanan #{order.nomorPesanan}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="templates" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="templates">Template</TabsTrigger>
            <TabsTrigger value="preview" disabled={!selectedTemplate}>
              Preview & Kirim
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
                      placeholder="Masukkan pesan template... Gunakan {nama_pelanggan}, {nomor_pesanan}, {total_pesanan}, dll."
                      rows={4}
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      Variabel yang tersedia: {'{nama_pelanggan}'}, {'{nomor_pesanan}'}, {'{total_pesanan}'}, {'{tanggal_pesanan}'}, {'{status_pesanan}'}
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
                  <p className="text-sm text-gray-600 line-clamp-2">{template.message}</p>
                </div>
              ))}
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
                    <div><strong>Untuk:</strong> {order.namaPelanggan} ({order.teleponPelanggan})</div>
                    <div><strong>Pesanan:</strong> #{order.nomorPesanan}</div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <Label className="text-sm font-medium">Pesan yang akan dikirim:</Label>
                  <div className="mt-2 p-3 bg-gray-50 rounded border min-h-[100px] whitespace-pre-wrap">
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