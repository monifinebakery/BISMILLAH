import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';

// --- INTERFACES & TYPES ---
interface FollowUpTemplate {
  id?: string;
  user_id: string;
  status: string;
  template: string;
  created_at?: string;
  updated_at?: string;
}

// Data order yang dibutuhkan untuk memproses template
type OrderData = {
  namaPelanggan?: string;
  nomorPesanan?: string;
  teleponPelanggan?: string;
  tanggal?: string | Date;
  totalPesanan?: number;
  items?: { namaBarang?: string; name?: string; quantity: number }[];
  alamatPengiriman?: string;
  catatan?: string;
};

interface FollowUpTemplateContextType {
  templates: Record<string, string>;
  isLoading: boolean;
  loadTemplates: () => Promise<void>;
  saveTemplate: (status: string, template: string) => Promise<boolean>;
  saveAllTemplates: (templates: Record<string, string>) => Promise<boolean>;
  getTemplate: (status: string) => string;
  resetToDefaults: () => void;
  processTemplate: (status: string, orderData: OrderData) => string; // FIX: Moved processTemplate into the context
}

// --- CONSTANTS ---
const DEFAULT_TEMPLATES: Record<string, string> = {
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

// --- CONTEXT ---
const FollowUpTemplateContext = createContext<FollowUpTemplateContextType | undefined>(undefined);

// --- PROVIDER COMPONENT ---
export const FollowUpTemplateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [templates, setTemplates] = useState<Record<string, string>>(DEFAULT_TEMPLATES);
  const [isLoading, setIsLoading] = useState(true); // Set initial loading to true
  const { user } = useAuth();

  const loadTemplates = useCallback(async () => {
    if (!user) {
      setTemplates(DEFAULT_TEMPLATES);
      setIsLoading(false); // Stop loading if no user
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('followup_templates')
        .select('status, template')
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      const templatesMap = { ...DEFAULT_TEMPLATES };
      if (data) {
        data.forEach(template => {
          templatesMap[template.status] = template.template;
        });
      }
      
      setTemplates(templatesMap);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Gagal memuat template WhatsApp');
      setTemplates(DEFAULT_TEMPLATES); // Fallback to defaults
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

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
      }));

      const { error } = await supabase
        .from('followup_templates')
        .upsert(templateEntries, { onConflict: 'user_id,status' });
      
      if (error) throw error;
      
      setTemplates(templatesData);
      toast.success('Semua template berhasil disimpan!');
      return true;
    } catch (error) {
      console.error('Error saving all templates:', error);
      toast.error('Gagal menyimpan semua template');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  const saveTemplate = async (status: string, template: string): Promise<boolean> => {
      // This is now a convenience wrapper around saveAllTemplates
      const newTemplates = { ...templates, [status]: template };
      return saveAllTemplates(newTemplates);
  };

  const getTemplate = (status: string): string => {
    return templates[status] || DEFAULT_TEMPLATES[status] || '';
  };

  const resetToDefaults = async () => {
    if (!user) {
      setTemplates(DEFAULT_TEMPLATES);
      toast.success("Template telah direset ke default.");
      return;
    }
    // Also delete user's custom templates from the database
    setIsLoading(true);
    try {
        const { error } = await supabase
            .from('followup_templates')
            .delete()
            .eq('user_id', user.id);
        if (error) throw error;
        setTemplates(DEFAULT_TEMPLATES);
        toast.success("Template kustom telah dihapus dan direset ke default.");
    } catch (error) {
        console.error('Error resetting templates:', error);
        toast.error("Gagal mereset template di database.");
    } finally {
        setIsLoading(false);
    }
  };

  // FIX: Moved processTemplate logic inside the provider and made it part of the context value.
  const processTemplate = useCallback((status: string, orderData: OrderData): string => {
    const template = getTemplate(status);
    if (!orderData || !template) return template;
    
    const itemsText = (orderData.items || [])
      .map((item) => `- ${item.namaBarang || item.name || 'Item'} (${item.quantity}x)`)
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
  }, [templates]); // Dependency on templates

  const value: FollowUpTemplateContextType = {
    templates,
    isLoading,
    loadTemplates,
    saveTemplate,
    saveAllTemplates,
    getTemplate,
    resetToDefaults,
    processTemplate, // Expose the function through context
  };

  return (
    <FollowUpTemplateContext.Provider value={value}>
      {children}
    </FollowUpTemplateContext.Provider>
  );
};

// --- CUSTOM HOOK ---
export const useFollowUpTemplate = () => {
  const context = useContext(FollowUpTemplateContext);
  if (context === undefined) {
    throw new Error('useFollowUpTemplate must be used within a FollowUpTemplateProvider');
  }
  return context;
};
