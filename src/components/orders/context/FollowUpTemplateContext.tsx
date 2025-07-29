// contexts/FollowUpTemplateContext.jsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';

interface FollowUpTemplate {
  id?: string;
  user_id: string;
  status: string;
  template: string;
  created_at?: string;
  updated_at?: string;
}

interface FollowUpTemplateContextType {
  templates: Record<string, string>;
  isLoading: boolean;
  loadTemplates: () => Promise<void>;
  saveTemplate: (status: string, template: string) => Promise<boolean>;
  saveAllTemplates: (templates: Record<string, string>) => Promise<boolean>;
  getTemplate: (status: string) => string;
  resetToDefaults: () => void;
}

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

Terima kasih telah berbelanja! Ditunggu pesanan selanjutnya 😊`,

  cancelled: `Halo kak {{namaPelanggan}},

Pesanan Anda #{{nomorPesanan}} telah DIBATALKAN sesuai permintaan.

Terima kasih atas pengertiannya.`
};

const FollowUpTemplateContext = createContext<FollowUpTemplateContextType | undefined>(undefined);

export const FollowUpTemplateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [templates, setTemplates] = useState<Record<string, string>>(DEFAULT_TEMPLATES);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  // Load templates from database
  const loadTemplates = async () => {
    if (!user) {
      setTemplates(DEFAULT_TEMPLATES);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('followup_templates')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      // Start with default templates
      const templatesMap = { ...DEFAULT_TEMPLATES };
      
      // Override with user's custom templates
      if (data && data.length > 0) {
        data.forEach(template => {
          templatesMap[template.status] = template.template;
        });
      }
      
      setTemplates(templatesMap);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Gagal memuat template WhatsApp');
      // Use default templates on error
      setTemplates(DEFAULT_TEMPLATES);
    } finally {
      setIsLoading(false);
    }
  };

  // Save single template
  const saveTemplate = async (status: string, template: string): Promise<boolean> => {
    if (!user) {
      toast.error('Anda harus login untuk menyimpan template');
      return false;
    }

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
      
      // Update local state
      setTemplates(prev => ({
        ...prev,
        [status]: template
      }));
      
      return true;
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error(`Gagal menyimpan template untuk status ${status}`);
      return false;
    }
  };

  // Save all templates at once
  const saveAllTemplates = async (templatesData: Record<string, string>): Promise<boolean> => {
    if (!user) {
      toast.error('Anda harus login untuk menyimpan template');
      return false;
    }

    setIsLoading(true);
    try {
      const templateEntries = Object.entries(templatesData).map(([status, template]) => ({
        user_id: user.id,
        status: status,
        template: template,
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('followup_templates')
        .upsert(templateEntries, {
          onConflict: 'user_id,status'
        });
      
      if (error) throw error;
      
      // Update local state
      setTemplates(templatesData);
      toast.success('Semua template berhasil disimpan!');
      return true;
    } catch (error) {
      console.error('Error saving templates:', error);
      toast.error('Gagal menyimpan template');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Get template for specific status
  const getTemplate = (status: string): string => {
    return templates[status] || DEFAULT_TEMPLATES[status] || '';
  };

  // Reset to default templates
  const resetToDefaults = () => {
    setTemplates({ ...DEFAULT_TEMPLATES });
  };

  // Load templates when user changes
  useEffect(() => {
    loadTemplates();
  }, [user]);

  const value: FollowUpTemplateContextType = {
    templates,
    isLoading,
    loadTemplates,
    saveTemplate,
    saveAllTemplates,
    getTemplate,
    resetToDefaults,
  };

  return (
    <FollowUpTemplateContext.Provider value={value}>
      {children}
    </FollowUpTemplateContext.Provider>
  );
};

export const useFollowUpTemplate = () => {
  const context = useContext(FollowUpTemplateContext);
  if (context === undefined) {
    throw new Error('useFollowUpTemplate must be used within a FollowUpTemplateProvider');
  }
  return context;
};

// Hook untuk memproses template dengan data order
export const useProcessTemplate = () => {
  const processTemplate = (template: string, orderData: any): string => {
    if (!orderData || !template) return template;
    
    const itemsText = (orderData.items || [])
      .map((item: any) => `- ${item.namaBarang || item.name || 'Item'} (${item.quantity}x)`)
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

  return { processTemplate };
};

export default FollowUpTemplateProvider;