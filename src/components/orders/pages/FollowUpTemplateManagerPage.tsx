// src/components/orders/pages/FollowUpTemplateManagerPage.tsx
// Full-page responsive template management for WhatsApp follow-up messages

import React, { useState, useEffect } from 'react';
import { MessageSquare, Edit, Send, Eye, X, Copy, Info, ArrowLeft, Save, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { ActionButtons } from '@/components/ui/action-buttons';
import { toast } from 'sonner';
import { formatCurrency } from '@/utils/formatUtils';
import { formatDateForDisplay } from '@/utils/unifiedDateUtils';
import { useFollowUpTemplate, useProcessTemplate } from '@/contexts/FollowUpTemplateContext';
import type { Order } from '../types';

interface Template {
  id: string;
  name: string;
  message: string;
  createdAt: Date;
}

const FollowUpTemplateManagerPage: React.FC = () => {
  const navigate = useNavigate();

  // Use FollowUpTemplateContext
  const { templates: contextTemplates, saveTemplate } = useFollowUpTemplate();
  const { processTemplate } = useProcessTemplate();

  // Convert context templates to Template array format
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [templateForm, setTemplateForm] = useState({ message: '' });
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [previewMessage, setPreviewMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Update templates when context changes
  useEffect(() => {
    const templateArray = Object.entries(contextTemplates).map(([status, message]) => ({
      id: status,
      name: getStatusDisplayName(status),
      message: message,
      createdAt: new Date()
    }));
    setTemplates(templateArray);
    
    // Set first template as selected if none selected
    if (!selectedTemplate && templateArray.length > 0) {
      setSelectedTemplate(templateArray[0]);
    }
  }, [contextTemplates]);

  // Helper function to get display name for status
  const getStatusDisplayName = (status: string): string => {
    const statusNames: Record<string, string> = {
      pending: 'Konfirmasi Pesanan',
      confirmed: 'Pesanan Dikonfirmasi',
      preparing: 'Sedang Diproses',
      ready: 'Siap Diambil/Dikirim',
      shipping: 'Update Pengiriman',
      delivered: 'Pesanan Diterima',
      completed: 'Pesanan Selesai',
      cancelled: 'Pesanan Dibatalkan'
    };
    return statusNames[status] || status;
  };

  // Sample order data for preview
  const sampleOrder: Order = {
    id: 'sample-001',
    orderNumber: 'ORD-2024-001',
    customerName: 'John Doe',
    totalAmount: 150000,
    status: 'confirmed',
    items: [
      { namaBarang: 'Kue Tart Cokelat', quantity: 1, harga: 100000 },
      { namaBarang: 'Cupcake Vanilla', quantity: 6, harga: 8333 }
    ],
    tanggal: new Date().toISOString(),
    phoneNumber: '+62812345678'
  } as Order;

  // Generate preview message
  const generatePreview = (template: Template) => {
    if (!template) return '';
    return processTemplate(template.message, sampleOrder);
  };

  // Update preview when template changes
  useEffect(() => {
    if (selectedTemplate) {
      setPreviewMessage(generatePreview(selectedTemplate));
    }
  }, [selectedTemplate]);

  const handleEditTemplate = (template: Template) => {
    setEditingTemplate(template);
    setIsEditing(true);
    setTemplateForm({ message: template.message });
  };

  const handleSaveTemplate = async () => {
    if (!editingTemplate) return;
    if (!templateForm.message.trim()) {
      toast.error('Pesan template harus diisi');
      return;
    }

    setIsSaving(true);
    try {
      const success = await saveTemplate(editingTemplate.id, templateForm.message);
      if (success) {
        setTemplates(prev =>
          prev.map(t =>
            t.id === editingTemplate.id ? { ...t, message: templateForm.message } : t
          )
        );
        toast.success('Template berhasil disimpan');
        setIsEditing(false);
        setEditingTemplate(null);
        setTemplateForm({ message: '' });
      } else {
        toast.error('Gagal menyimpan template');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan saat menyimpan');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingTemplate(null);
    setTemplateForm({ message: '' });
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(previewMessage);
    toast.success('Pesan berhasil disalin ke clipboard');
  };

  const handleResetTemplate = async () => {
    if (!selectedTemplate) return;
    
    const defaultTemplates: Record<string, string> = {
      pending: 'Halo {{customerName}}, terima kasih sudah memesan di toko kami!\n\nNomor pesanan: {{orderNumber}}\nTotal: {{totalAmount}}\n\nPesanan Anda sedang kami konfirmasi. Kami akan menghubungi Anda kembali segera.',
      confirmed: 'Halo {{customerName}}, pesanan Anda telah dikonfirmasi!\n\nNomor pesanan: {{orderNumber}}\nTotal: {{totalAmount}}\n\nPesanan Anda sedang kami siapkan.',
      preparing: 'Halo {{customerName}}, pesanan Anda sedang dalam proses pembuatan.\n\nNomor pesanan: {{orderNumber}}\n\nMohon ditunggu, kami akan update Anda segera.',
      ready: 'Halo {{customerName}}, pesanan Anda sudah siap!\n\nNomor pesanan: {{orderNumber}}\n\nSilakan ambil pesanan Anda atau kami akan kirim sesuai kesepakatan.',
      delivered: 'Halo {{customerName}}, pesanan Anda telah diterima.\n\nTerima kasih sudah berbelanja di toko kami!',
      completed: 'Halo {{customerName}}, terima kasih atas pesanan Anda!\n\nSemoga Anda puas dengan produk kami. Jangan lupa order lagi ya!',
      cancelled: 'Halo {{customerName}}, pesanan Anda telah dibatalkan.\n\nJika ada pertanyaan, silakan hubungi kami.'
    };

    const defaultMessage = defaultTemplates[selectedTemplate.id] || selectedTemplate.message;
    
    setIsSaving(true);
    try {
      const success = await saveTemplate(selectedTemplate.id, defaultMessage);
      if (success) {
        toast.success('Template berhasil direset ke default');
      } else {
        toast.error('Gagal reset template');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan saat reset template');
    } finally {
      setIsSaving(false);
    }
  };

  // Available variables list
  const availableVariables = [
    { key: '{{customerName}}', desc: 'Nama pelanggan' },
    { key: '{{orderNumber}}', desc: 'Nomor pesanan' },
    { key: '{{totalAmount}}', desc: 'Total harga pesanan (dengan mata uang)' },
    { key: '{{orderDate}}', desc: 'Tanggal pesanan' },
    { key: '{{itemsList}}', desc: 'Daftar item pesanan' },
    { key: '{{status}}', desc: 'Status pesanan saat ini' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/pesanan')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Kembali
              </Button>
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Kelola Template WhatsApp
                </h1>
                <p className="text-sm text-gray-600">
                  Atur pesan otomatis untuk berbagai status pesanan
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {selectedTemplate && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetTemplate}
                  disabled={isSaving}
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset Default
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Template List - Left Panel */}
          <div className="lg:col-span-1">
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MessageSquare className="h-5 w-5" />
                  Template WhatsApp
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                      selectedTemplate?.id === template.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-sm text-gray-900">
                        {template.name}
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditTemplate(template);
                        }}
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {template.message.substring(0, 50)}...
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Variables Helper */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Info className="h-4 w-4" />
                  Variabel Tersedia
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {availableVariables.map((variable) => (
                  <div
                    key={variable.key}
                    className="flex items-start justify-between p-2 bg-gray-50 rounded text-xs"
                  >
                    <code className="font-mono text-blue-600 font-medium">
                      {variable.key}
                    </code>
                  </div>
                ))}
                <p className="text-xs text-gray-500 mt-3">
                  Gunakan variabel di atas untuk personalisasi pesan secara otomatis.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Right Panel */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Edit Form */}
            {selectedTemplate && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Edit Template: {selectedTemplate.name}</span>
                    {!isEditing && (
                      <Button
                        onClick={() => handleEditTemplate(selectedTemplate)}
                        className="flex items-center gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="template-message">Pesan Template</Label>
                        <Textarea
                          id="template-message"
                          value={templateForm.message}
                          onChange={(e) => setTemplateForm({ message: e.target.value })}
                          className="min-h-[200px] mt-2"
                          placeholder="Masukkan pesan template..."
                        />
                      </div>
                      
                      <ActionButtons
                        onCancel={handleCancelEdit}
                        onSave={handleSaveTemplate}
                        cancelText="Batal"
                        saveText="Simpan Template"
                        isSaving={isSaving}
                      />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <Label>Pesan Template</Label>
                        <div className="mt-2 p-4 bg-gray-50 rounded-lg border">
                          <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                            {selectedTemplate.message}
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Preview */}
            {selectedTemplate && !isEditing && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      Preview Pesan
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyMessage}
                        className="flex items-center gap-2"
                      >
                        <Copy className="h-4 w-4" />
                        Salin
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Alert className="mb-4">
                    <Info className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      Preview menggunakan data pesanan contoh. Variabel akan diganti otomatis dengan data pesanan sebenarnya.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-green-600 font-medium mb-2">
                          WhatsApp Preview
                        </p>
                        <div className="bg-white p-3 rounded-lg shadow-sm">
                          <pre className="whitespace-pre-wrap text-sm text-gray-800">
                            {previewMessage}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Sample Data Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Data Contoh untuk Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <strong>Pelanggan:</strong> {sampleOrder.customerName}
                  </div>
                  <div>
                    <strong>No. Pesanan:</strong> {sampleOrder.orderNumber}
                  </div>
                  <div>
                    <strong>Total:</strong> {formatCurrency(sampleOrder.totalAmount)}
                  </div>
                  <div>
                    <strong>Status:</strong> {sampleOrder.status}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FollowUpTemplateManagerPage;