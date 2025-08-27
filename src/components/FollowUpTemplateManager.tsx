// components/FollowUpTemplateManager.jsx - Clean Version without Fallback
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Save, RotateCcw, Eye, Code, Info, ExternalLink, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { useFollowUpTemplate, useProcessTemplate } from '@/contexts/FollowUpTemplateContext';
import { orderStatusList } from '@/components/orders/constants/orderConstants';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  const isMobile = useIsMobile();
  
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
  const [isVariablesOpen, setIsVariablesOpen] = useState(!isMobile); // Open by default on desktop

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
      <DialogContent className={cn(
        "w-full h-full max-w-none max-h-none m-0 p-0 rounded-none",
        "sm:max-w-5xl sm:max-h-[95vh] sm:rounded-lg sm:m-auto sm:p-6",
        "overflow-hidden"
      )}>
        <ScrollArea className="h-full w-full">
          <div className="p-4 sm:p-0">
            {/* Mobile Header - Sticky */}
            <div className="sticky top-0 bg-white z-10 border-b pb-4 mb-4 sm:static sm:border-b-0 sm:pb-0 sm:mb-6">
              <DialogHeader>
                <DialogTitle className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-6 w-6 text-blue-600 flex-shrink-0" />
                    <span className="text-lg sm:text-xl">Template WhatsApp</span>
                  </div>
                  
                  {order && (
                    <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
                      <Badge variant="outline" className="text-xs">
                        #{order.nomorPesanan}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {order.namaPelanggan}
                      </Badge>
                      <Badge className="bg-green-600 text-white text-xs">
                        {orderStatusList.find(s => s.key === order.status)?.label || order.status}
                      </Badge>
                    </div>
                  )}
                </DialogTitle>
              </DialogHeader>
              
              {/* Mobile Action Buttons */}
              <div className="flex gap-2 mt-4 sm:hidden">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewMode(!previewMode)}
                  disabled={!order}
                  className="flex-1"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  {previewMode ? 'Edit' : 'Preview'}
                </Button>
                {order && (
                  <Button
                    onClick={handleQuickSend}
                    className="bg-green-600 hover:bg-green-700 text-white flex-1"
                    size="sm"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Kirim WA
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-4 sm:space-y-6">
              {/* Quick Actions for Current Order - Desktop */}
              {order && !isMobile && (
                <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between text-lg text-green-800">
                      <span className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Quick Send untuk Pesanan Ini
                      </span>
                      <Badge className="bg-green-600 text-white">
                        {orderStatusList.find(s => s.key === order.status)?.label || order.status}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-700 mb-1">
                          Kirim template untuk status: <strong>{orderStatusList.find(s => s.key === order.status)?.label || order.status}</strong>
                        </p>
                        <p className="text-xs text-green-600">
                          #{order.nomorPesanan} - {order.namaPelanggan} ({order.teleponPelanggan})
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

              {/* Variable Reference Card - Collapsible on Mobile */}
              <Card>
                <Collapsible open={isVariablesOpen} onOpenChange={setIsVariablesOpen}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                      <CardTitle className="flex items-center justify-between text-base sm:text-lg">
                        <div className="flex items-center gap-2">
                          <Code className="h-4 w-4 sm:h-5 sm:w-5" />
                          Variabel Template
                        </div>
                        <ChevronDown className={cn(
                          "h-4 w-4 transition-transform duration-200",
                          isVariablesOpen && "rotate-180"
                        )} />
                      </CardTitle>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {TEMPLATE_VARIABLES.map((variable) => (
                          <div 
                            key={variable.key} 
                            className="flex flex-col p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-400 transition-colors active:bg-gray-500"
                            onClick={() => {
                              navigator.clipboard.writeText(variable.key);
                              toast.success(`Variable ${variable.key} disalin!`);
                            }}
                            title="Klik untuk copy"
                          >
                            <code className="text-xs sm:text-sm font-mono text-blue-600 mb-1 break-all">
                              {variable.key}
                            </code>
                            <span className="text-xs text-gray-600">{variable.description}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-center gap-2 text-amber-800 mb-2">
                          <Info className="h-4 w-4 flex-shrink-0" />
                          <span className="font-medium text-sm">Tips Penggunaan</span>
                        </div>
                        <ul className="text-xs sm:text-sm text-amber-700 space-y-1">
                          <li>• Klik variabel untuk menyalin ke clipboard</li>
                          <li>• Template akan otomatis diisi dengan data pesanan saat dikirim</li>
                          <li>• Anda dapat menggabungkan teks bebas dengan variabel</li>
                          <li>• Gunakan mode preview untuk melihat hasil akhir template</li>
                        </ul>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>

              {/* Template Editor Tabs */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <CardTitle className="text-base sm:text-lg">Editor Template</CardTitle>
                    <div className="flex items-center gap-2">
                      {!isMobile && (
                        <Button
                          variant={previewMode ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPreviewMode(!previewMode)}
                          disabled={!order}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          {previewMode ? 'Mode Edit' : 'Preview'}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    {/* Mobile: Grid-style tabs */}
                    {isMobile ? (
                      <div className="mb-4">
                        <Label className="text-sm text-gray-600 mb-2 block">Pilih Status:</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {orderStatusList.map((status) => (
                            <Button
                              key={status.key}
                              variant={activeTab === status.key ? "default" : "outline"}
                              size="sm"
                              onClick={() => setActiveTab(status.key)}
                              className={cn(
                                "text-xs justify-center",
                                order && order.status === status.key && "ring-2 ring-green-400",
                                activeTab === status.key && "bg-blue-600 hover:bg-blue-700"
                              )}
                            >
                              {status.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <TabsList className="grid grid-cols-4 lg:grid-cols-5 mb-4 w-full">
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
                    )}

                    {orderStatusList.map((status) => (
                      <TabsContent key={status.key} value={status.key} className="space-y-4 mt-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <Label className="text-base sm:text-lg font-medium">
                            Template: {status.label}
                          </Label>
                          <div className="flex gap-2">
                            {order && !isMobile && (
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
                            <CardHeader className="pb-3">
                              <CardTitle className="text-sm text-green-800 flex items-center gap-2">
                                <Eye className="h-4 w-4" />
                                Preview untuk {order.namaPelanggan}
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <div className="bg-white p-3 sm:p-4 rounded-lg border">
                                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-medium leading-relaxed">
                                  {processTemplate(editingTemplates[status.key] || '', order)}
                                </pre>
                              </div>
                              {order && isMobile && (
                                <Button
                                  onClick={() => handleSendWhatsApp(status.key)}
                                  className="bg-green-600 hover:bg-green-700 w-full mt-3"
                                  size="sm"
                                >
                                  <MessageSquare className="h-4 w-4 mr-2" />
                                  Kirim Template Ini
                                </Button>
                              )}
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
                              className="min-h-32 sm:min-h-48 font-mono text-sm resize-none"
                              rows={isMobile ? 6 : 10}
                            />
                            
                            {/* Live preview of variables */}
                            {editingTemplates[status.key] && (
                              <Card className="bg-blue-50 border-blue-200">
                                <CardHeader className="pb-3">
                                  <CardTitle className="text-sm text-blue-800">Template dengan Highlighting</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0">
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

              {/* Action Buttons - Sticky on Mobile */}
              <div className={cn(
                "flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t bg-white",
                isMobile && "sticky bottom-0 pb-4 -mx-4 px-4"
              )}>
                <Button
                  variant="outline"
                  onClick={handleResetAll}
                  className="text-orange-600 border-orange-600 hover:bg-orange-50 order-2 sm:order-1"
                  size={isMobile ? "default" : "sm"}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset ke Default
                </Button>
                
                <div className="flex gap-2 order-1 sm:order-2">
                  <Button 
                    variant="outline" 
                    onClick={onClose}
                    className="flex-1 sm:flex-none"
                    size={isMobile ? "default" : "sm"}
                  >
                    Tutup
                  </Button>
                  <Button
                    onClick={handleSaveAll}
                    disabled={isSaving || isLoading}
                    className="bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-none"
                    size={isMobile ? "default" : "sm"}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? 'Menyimpan...' : 'Simpan Semua'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default FollowUpTemplateManager;