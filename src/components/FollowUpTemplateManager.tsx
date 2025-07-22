// components/FollowUpTemplateManager.jsx
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Save, RotateCcw, Eye, Code, Info, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { useFollowUpTemplate, useProcessTemplate } from '@/contexts/FollowUpTemplateContext';
import { orderStatusList } from '@/constants/orderConstants';
import { cn } from '@/lib/utils';

const TEMPLATE_VARIABLES = [
  { key: '{{namaPelanggan}}', description: 'Nama pelanggan' },
  { key: '{{nomorPesanan}}', description: 'Nomor pesanan' },
  { key: '{{teleponPelanggan}}', description: 'Telepon pelanggan' },
  { key: '{{tanggal}}', description: 'Tanggal pesanan' },
  { key: '{{totalPesanan}}', description: 'Total pesanan (format rupiah)' },
  { key: '{{items}}', description: 'Daftar item pesanan' },
  { key: '{{alamatPengiriman}}', description: 'Alamat pengiriman' },
  { key: '{{catatan}}', description: 'Catatan pesanan' }
];

const FollowUpTemplateManager = ({ isOpen, onClose, order, onSendWhatsApp }) => {
  const { 
    templates, 
    isLoading, 
    saveAllTemplates, 
    resetToDefaults,
    getTemplate 
  } = useFollowUpTemplate();
  
  const { processTemplate } = useProcessTemplate();
  
  const [editingTemplates, setEditingTemplates] = useState({});
  const [activeTab, setActiveTab] = useState('pending');
  const [previewMode, setPreviewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize editing templates when templates or dialog opens
  useEffect(() => {
    if (isOpen) {
      setEditingTemplates({ ...templates });
      // Set active tab to order's current status if order exists
      if (order && order.status) {
        setActiveTab(order.status);
      }
    }
  }, [isOpen, templates, order]);

  // Save all templates
  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const success = await saveAllTemplates(editingTemplates);
      if (success) {
        toast.success('Semua template berhasil disimpan!');
      }
    } catch (error) {
      toast.error('Gagal menyimpan template');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to default templates
  const handleResetAll = () => {
    resetToDefaults();
    setEditingTemplates({ ...templates });
    toast.success('Template direset ke default');
  };

  // Handle send WhatsApp for specific status
  const handleSendWhatsApp = (status) => {
    if (!order) {
      toast.error('Tidak ada data pesanan yang dipilih');
      return;
    }

    const template = editingTemplates[status] || getTemplate(status);
    const processedMessage = processTemplate(template, order);
    
    if (onSendWhatsApp) {
      onSendWhatsApp(processedMessage, order);
    }
    
    // Open WhatsApp with the message
    const phoneNumber = order?.teleponPelanggan?.replace(/\D/g, '') || '';
    
    if (!phoneNumber) {
      toast.error('Nomor telepon pelanggan tidak tersedia');
      return;
    }

    const whatsappURL = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(processedMessage)}`;
    window.open(whatsappURL, '_blank');
    
    toast.success('WhatsApp dibuka dengan template pesan');
    onClose(); // Close modal after sending
  };

  // Handle bulk send for current order status
  const handleQuickSend = () => {
    if (!order) {
      toast.error('Tidak ada data pesanan yang dipilih');
      return;
    }
    handleSendWhatsApp(order.status);
  };

  const renderVariableHighlight = (text) => {
    if (!text) return '';
    return text.replace(/(\{\{[^}]+\}\})/g, '<span class="bg-blue-100 text-blue-800 px-1 rounded font-medium">$1</span>');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-blue-600" />
            Kelola Template Follow Up WhatsApp
            {order && (
              <Badge variant="outline" className="ml-2">
                Pesanan #{order.nomorPesanan} - {order.namaPelanggan}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quick Actions for Current Order */}
          {order && (
            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-lg text-green-800">
                  <span className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Quick Send untuk Pesanan Ini
                  </span>
                  <Badge className="bg-green-600 text-white">
                    Status: {orderStatusList.find(s => s.key === order.status)?.label || order.status}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-700 mb-2">
                      Kirim template untuk status saat ini: <strong>{orderStatusList.find(s => s.key === order.status)?.label || order.status}</strong>
                    </p>
                    <p className="text-xs text-green-600">
                      Pesanan #{order.nomorPesanan} - {order.namaPelanggan} ({order.teleponPelanggan})
                    </p>
                  </div>
                  <Button
                    onClick={handleQuickSend}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    size="sm"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Kirim Sekarang
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Variable Reference Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Code className="h-5 w-5" />
                Variabel Template
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {TEMPLATE_VARIABLES.map((variable) => (
                  <div 
                    key={variable.key} 
                    className="flex flex-col p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => {
                      navigator.clipboard.writeText(variable.key);
                      toast.success(`Variable ${variable.key} disalin!`);
                    }}
                    title="Klik untuk copy"
                  >
                    <code className="text-sm font-mono text-blue-600 mb-1">
                      {variable.key}
                    </code>
                    <span className="text-xs text-gray-600">{variable.description}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2 text-amber-800 mb-2">
                  <Info className="h-4 w-4" />
                  <span className="font-medium">Tips Penggunaan</span>
                </div>
                <ul className="text-sm text-amber-700 space-y-1">
                  <li>• Klik variabel untuk menyalin ke clipboard</li>
                  <li>• Template akan otomatis diisi dengan data pesanan saat dikirim</li>
                  <li>• Anda dapat menggabungkan teks bebas dengan variabel</li>
                  <li>• Gunakan mode preview untuk melihat hasil akhir template</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Template Editor Tabs */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Editor Template</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant={previewMode ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPreviewMode(!previewMode)}
                    disabled={!order}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {previewMode ? 'Mode Edit' : 'Preview'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-4 lg:grid-cols-5 mb-4">
                  {orderStatusList.map((status) => (
                    <TabsTrigger 
                      key={status.key} 
                      value={status.key}
                      className={cn(
                        "text-xs",
                        order && order.status === status.key && "ring-2 ring-green-400 bg-green-50"
                      )}
                    >
                      <Badge variant="outline" className="text-xs">
                        {status.label}
                      </Badge>
                    </TabsTrigger>
                  ))}
                </TabsList>

                {orderStatusList.map((status) => (
                  <TabsContent key={status.key} value={status.key} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-lg font-medium">
                        Template untuk Status: {status.label}
                      </Label>
                      <div className="flex gap-2">
                        {order && (
                          <Button
                            onClick={() => handleSendWhatsApp(status.key)}
                            className="bg-green-600 hover:bg-green-700"
                            size="sm"
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Kirim WhatsApp
                          </Button>
                        )}
                      </div>
                    </div>

                    {previewMode && order ? (
                      <Card className="bg-green-50 border-green-200">
                        <CardHeader>
                          <CardTitle className="text-sm text-green-800 flex items-center gap-2">
                            <Eye className="h-4 w-4" />
                            Preview Pesan untuk {order.namaPelanggan}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="bg-white p-4 rounded-lg border">
                            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-medium leading-relaxed">
                              {processTemplate(editingTemplates[status.key] || '', order)}
                            </pre>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="space-y-4">
                        <Textarea
                          value={editingTemplates[status.key] || ''}
                          onChange={(e) => setEditingTemplates(prev => ({
                            ...prev,
                            [status.key]: e.target.value
                          }))}
                          placeholder={`Masukkan template untuk status ${status.label}...`}
                          className="min-h-48 font-mono text-sm resize-none"
                          rows={10}
                        />
                        
                        {/* Live preview of variables */}
                        {editingTemplates[status.key] && (
                          <Card className="bg-blue-50 border-blue-200">
                            <CardHeader>
                              <CardTitle className="text-sm text-blue-800">Template dengan Highlighting</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div 
                                className="text-sm whitespace-pre-wrap leading-relaxed"
                                dangerouslySetInnerHTML={{
                                  __html: renderVariableHighlight(editingTemplates[status.key] || '')
                                }}
                              />
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleResetAll}
              className="text-orange-600 border-orange-600 hover:bg-orange-50"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset ke Default
            </Button>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Tutup
              </Button>
              <Button
                onClick={handleSaveAll}
                disabled={isSaving || isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Menyimpan...' : 'Simpan Semua Template'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FollowUpTemplateManager;integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { orderStatusList } from '@/constants/orderConstants';
import { cn } from '@/lib/utils';

const TEMPLATE_VARIABLES = [
  { key: '{{namaPelanggan}}', description: 'Nama pelanggan' },
  { key: '{{nomorPesanan}}', description: 'Nomor pesanan' },
  { key: '{{teleponPelanggan}}', description: 'Telepon pelanggan' },
  { key: '{{tanggal}}', description: 'Tanggal pesanan' },
  { key: '{{totalPesanan}}', description: 'Total pesanan (format rupiah)' },
  { key: '{{items}}', description: 'Daftar item pesanan' },
  { key: '{{alamatPengiriman}}', description: 'Alamat pengiriman' },
  { key: '{{catatan}}', description: 'Catatan pesanan' }
];

const DEFAULT_TEMPLATES = {
  pending: `Halo kak {{namaPelanggan}},

Terima kasih telah memesan. Ini detail pesanan Anda:
Nomor Pesanan: {{nomorPesanan}}

Item:
{{items}}

Total: {{totalPesanan}}

Mohon konfirmasinya. Terima kasih.`,

  confirmed: `Halo kak {{namaPelanggan}},

Pesanan Anda #{{nomorPesanan}} telah kami KONFIRMASI dan sedang kami siapkan.

Terima kasih!`,

  shipping: `Halo kak {{namaPelanggan}},

Kabar baik! Pesanan Anda #{{nomorPesanan}} sudah dalam proses PENGIRIMAN.

Mohon ditunggu kedatangannya ya. Terima kasih!`,

  delivered: `Halo kak {{namaPelanggan}},

Pesanan Anda #{{nomorPesanan}} telah TIBA.

Terima kasih telah berbelanja! Ditunggu pesanan selanjutnya 😊`
};

const FollowUpTemplateManager = ({ isOpen, onClose, order, onSendWhatsApp }) => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState({});
  const [editingTemplates, setEditingTemplates] = useState({});
  const [activeTab, setActiveTab] = useState('pending');
  const [isLoading, setIsLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // Load templates from database
  const loadTemplates = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('followup_templates')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      const templatesMap = {};
      const editingMap = {};
      
      // Initialize with default templates
      orderStatusList.forEach(status => {
        templatesMap[status.key] = DEFAULT_TEMPLATES[status.key] || '';
        editingMap[status.key] = DEFAULT_TEMPLATES[status.key] || '';
      });
      
      // Override with user's custom templates
      if (data) {
        data.forEach(template => {
          templatesMap[template.status] = template.template;
          editingMap[template.status] = template.template;
        });
      }
      
      setTemplates(templatesMap);
      setEditingTemplates(editingMap);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Gagal memuat template');
    } finally {
      setIsLoading(false);
    }
  };

  // Save template to database
  const saveTemplate = async (status, template) => {
    if (!user) return false;
    
    try {
      const { error } = await supabase
        .from('followup_templates')
        .upsert({
          user_id: user.id,
          status: status,
          template: template,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,status'
        });
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error saving template:', error);
      return false;
    }
  };

  // Save all templates
  const handleSaveAll = async () => {
    setIsLoading(true);
    try {
      const promises = Object.keys(editingTemplates).map(status => 
        saveTemplate(status, editingTemplates[status])
      );
      
      await Promise.all(promises);
      setTemplates({ ...editingTemplates });
      toast.success('Semua template berhasil disimpan!');
    } catch (error) {
      toast.error('Gagal menyimpan template');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset to default templates
  const handleResetAll = () => {
    const resetTemplates = {};
    orderStatusList.forEach(status => {
      resetTemplates[status.key] = DEFAULT_TEMPLATES[status.key] || '';
    });
    setEditingTemplates(resetTemplates);
    toast.success('Template direset ke default');
  };

  // Process template with order data
  const processTemplate = (template, orderData) => {
    if (!orderData || !template) return template;
    
    const itemsText = (orderData.items || [])
      .map(item => `- ${item.namaBarang || item.name || 'Item'} (${item.quantity}x)`)
      .join('\n');
    
    const totalText = new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR', 
      minimumFractionDigits: 0 
    }).format(orderData.totalPesanan || 0);

    return template
      .replace(/\{\{namaPelanggan\}\}/g, orderData.namaPelanggan || '')
      .replace(/\{\{nomorPesanan\}\}/g, orderData.nomorPesanan || '')
      .replace(/\{\{teleponPelanggan\}\}/g, orderData.teleponPelanggan || '')
      .replace(/\{\{tanggal\}\}/g, orderData.tanggal ? new Date(orderData.tanggal).toLocaleDateString('id-ID') : '')
      .replace(/\{\{totalPesanan\}\}/g, totalText)
      .replace(/\{\{items\}\}/g, itemsText)
      .replace(/\{\{alamatPengiriman\}\}/g, orderData.alamatPengiriman || '')
      .replace(/\{\{catatan\}\}/g, orderData.catatan || '');
  };

  // Handle send WhatsApp
  const handleSendWhatsApp = (status) => {
    const template = templates[status] || editingTemplates[status] || '';
    const processedMessage = processTemplate(template, order);
    
    if (onSendWhatsApp) {
      onSendWhatsApp(processedMessage, order);
    }
    
    // Open WhatsApp with the message
    const phoneNumber = order?.teleponPelanggan?.replace(/\D/g, '') || '';
    const whatsappURL = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(processedMessage)}`;
    window.open(whatsappURL, '_blank');
    
    toast.success('WhatsApp dibuka dengan template pesan');
  };

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen, user]);

  const renderVariableHighlight = (text) => {
    return text.replace(/(\{\{[^}]+\}\})/g, '<span class="bg-blue-100 text-blue-800 px-1 rounded">$1</span>');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-blue-600" />
            Kelola Template Follow Up WhatsApp
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Variable Reference Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Code className="h-5 w-5" />
                Variabel Template
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {TEMPLATE_VARIABLES.map((variable) => (
                  <div key={variable.key} className="flex flex-col p-3 bg-gray-50 rounded-lg">
                    <code className="text-sm font-mono text-blue-600 mb-1">
                      {variable.key}
                    </code>
                    <span className="text-xs text-gray-600">{variable.description}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2 text-amber-800 mb-2">
                  <Info className="h-4 w-4" />
                  <span className="font-medium">Tips Penggunaan</span>
                </div>
                <ul className="text-sm text-amber-700 space-y-1">
                  <li>• Gunakan variabel di atas untuk membuat template dinamis</li>
                  <li>• Template akan otomatis diisi dengan data pesanan saat dikirim</li>
                  <li>• Anda dapat menggabungkan teks bebas dengan variabel</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Template Editor Tabs */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Editor Template</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant={previewMode ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPreviewMode(!previewMode)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {previewMode ? 'Mode Edit' : 'Preview'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-4 mb-4">
                  {orderStatusList.map((status) => (
                    <TabsTrigger key={status.key} value={status.key}>
                      <Badge variant="outline" className="text-xs">
                        {status.label}
                      </Badge>
                    </TabsTrigger>
                  ))}
                </TabsList>

                {orderStatusList.map((status) => (
                  <TabsContent key={status.key} value={status.key} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-lg font-medium">
                        Template untuk Status: {status.label}
                      </Label>
                      {order && (
                        <Button
                          onClick={() => handleSendWhatsApp(status.key)}
                          className="bg-green-600 hover:bg-green-700"
                          size="sm"
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Kirim WhatsApp
                        </Button>
                      )}
                    </div>

                    {previewMode && order ? (
                      <Card className="bg-green-50 border-green-200">
                        <CardHeader>
                          <CardTitle className="text-sm text-green-800">Preview Pesan</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <pre className="whitespace-pre-wrap text-sm text-green-700 font-medium">
                            {processTemplate(editingTemplates[status.key] || '', order)}
                          </pre>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="space-y-4">
                        <Textarea
                          value={editingTemplates[status.key] || ''}
                          onChange={(e) => setEditingTemplates(prev => ({
                            ...prev,
                            [status.key]: e.target.value
                          }))}
                          placeholder={`Masukkan template untuk status ${status.label}...`}
                          className="min-h-48 font-mono text-sm"
                          rows={8}
                        />
                        
                        {/* Live preview of variables */}
                        {editingTemplates[status.key] && (
                          <Card className="bg-blue-50 border-blue-200">
                            <CardHeader>
                              <CardTitle className="text-sm text-blue-800">Template dengan Highlighting</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div 
                                className="text-sm whitespace-pre-wrap"
                                dangerouslySetInnerHTML={{
                                  __html: renderVariableHighlight(editingTemplates[status.key] || '')
                                }}
                              />
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleResetAll}
              className="text-orange-600 border-orange-600 hover:bg-orange-50"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset ke Default
            </Button>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Batal
              </Button>
              <Button
                onClick={handleSaveAll}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? 'Menyimpan...' : 'Simpan Semua Template'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FollowUpTemplateManager;