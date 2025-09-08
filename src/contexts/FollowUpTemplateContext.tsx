// 🎯 Fixed FollowUpTemplateContext dengan React Query - No fetch loops
import React, { createContext, useContext, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import { logger } from '@/utils/logger';

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
  getTemplateForCurrentStatus: (orderStatus?: string) => { status: string; template: string } | null;
  getAvailableStatuses: () => string[];
  resetToDefaults: () => void;
}

// ✅ Query Keys
const followUpTemplateQueryKeys = {
  all: ['followup-templates'] as const,
  lists: () => [...followUpTemplateQueryKeys.all, 'list'] as const,
  list: (userId?: string) => [...followUpTemplateQueryKeys.lists(), userId] as const,
} as const;

// ✅ ENHANCED: Default templates dengan items support untuk semua status yang ada
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

Item pesanan:
{{items}}

Total: {{totalPesanan}}

Terima kasih!`,

  preparing: `Halo kak {{namaPelanggan}},

Update pesanan Anda #{{nomorPesanan}}: 
Saat ini sedang DALAM PROSES pembuatan.

Item yang sedang disiapkan:
{{items}}

Total: {{totalPesanan}}

Mohon bersabar ya, kami pastikan kualitas terbaik! 👨‍🍳`,

  ready: `Halo kak {{namaPelanggan}},

Kabar gembira! Pesanan Anda #{{nomorPesanan}} sudah SIAP diambil/dikirim!

Item yang siap:
{{items}}

Total: {{totalPesanan}}

Silakan konfirmasi kapan bisa diambil/dikirim. Terima kasih! 📦`,

  // Legacy: untuk kompatibilitas dengan sistem lama
  shipping: `Halo kak {{namaPelanggan}},

Kabar baik! Pesanan Anda #{{nomorPesanan}} sudah dalam proses PENGIRIMAN.

Item yang dikirim:
{{items}}

Total: {{totalPesanan}}

Mohon ditunggu kedatangannya ya. Terima kasih!`,

  delivered: `Halo kak {{namaPelanggan}},

Pesanan Anda #{{nomorPesanan}} telah DITERIMA dengan baik.

Item yang diterima:
{{items}}

Total: {{totalPesanan}}

Terima kasih telah berbelanja! Bagaimana rasanya? Ditunggu review dan pesanan selanjutnya 😊`,

  completed: `Halo kak {{namaPelanggan}},

Pesanan Anda #{{nomorPesanan}} telah SELESAI dengan sempurna! ✅

Item yang sudah selesai:
{{items}}

Total: {{totalPesanan}}

Terima kasih atas kepercayaannya! Jangan lupa kasih rating dan ditunggu pesanan selanjutnya ya 🌟`,

  cancelled: `Halo kak {{namaPelanggan}},

Pesanan Anda #{{nomorPesanan}} telah DIBATALKAN sesuai permintaan.

Item yang dibatalkan:
{{items}}

Total: {{totalPesanan}}

Terima kasih atas pengertiannya. Jika ada yang bisa kami bantu lagi, jangan sungkan hubungi kami ya 🙏`
};

// ✅ API Functions
const fetchTemplates = async (userId: string): Promise<Record<string, string>> => {
  logger.info('🔄 Fetching follow-up templates for user:', userId);
  
  const { data, error } = await supabase
    .from('followup_templates')
    .select(`
      id,
      user_id,
      status,
      template,
      created_at,
      updated_at
    `)
    .eq('user_id', userId);
  
  if (error) {
    logger.error('❌ Error fetching templates:', error);
    throw new Error(error.message);
  }
  
  // Start with default templates
  const templatesMap = { ...DEFAULT_TEMPLATES };
  
  // Override with user's custom templates
  if (data && data.length > 0) {
    data.forEach(template => {
      templatesMap[template.status] = template.template;
    });
  }
  
  logger.success('✅ Templates fetched successfully:', Object.keys(templatesMap).length, 'templates');
  return templatesMap;
};

const saveTemplate = async (userId: string, status: string, template: string): Promise<FollowUpTemplate> => {
  logger.info('🔄 Saving template:', status);
  
  const { data, error } = await supabase
    .from('followup_templates')
    .upsert({
      user_id: userId,
      status: status,
      template: template,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,status'
    })
    .select()
    .single();
  
  if (error) {
    logger.error('❌ Error saving template:', error);
    throw new Error(error.message);
  }
  
  logger.success('✅ Template saved successfully:', status);
  return data;
};

const saveAllTemplates = async (userId: string, templatesData: Record<string, string>): Promise<FollowUpTemplate[]> => {
  logger.info('🔄 Saving all templates:', Object.keys(templatesData).length, 'templates');
  
  const templateEntries = Object.entries(templatesData).map(([status, template]) => ({
    user_id: userId,
    status: status,
    template: template,
    updated_at: new Date().toISOString()
  }));

  const { data, error } = await supabase
    .from('followup_templates')
    .upsert(templateEntries, {
      onConflict: 'user_id,status'
    })
    .select();
  
  if (error) {
    logger.error('❌ Error saving all templates:', error);
    throw new Error(error.message);
  }
  
  logger.success('✅ All templates saved successfully');
  return data;
};

const FollowUpTemplateContext = createContext<FollowUpTemplateContextType | undefined>(undefined);

export const FollowUpTemplateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  logger.debug('🔍 FollowUpTemplateProvider rendered', {
    userId: user?.id,
    timestamp: new Date().toISOString()
  });

  // ✅ useQuery for fetching templates
  const {
    data: templates = DEFAULT_TEMPLATES,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: followUpTemplateQueryKeys.list(user?.id),
    queryFn: () => fetchTemplates(user!.id),
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error: any) => {
      if (error?.status >= 400 && error?.status < 500) {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // ✅ Mutations for CRUD operations
  const saveTemplateMutation = useMutation({
    mutationFn: ({ status, template }: { status: string; template: string }) => 
      saveTemplate(user!.id, status, template),
    onSuccess: (data, { status }) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: followUpTemplateQueryKeys.lists() });
      
      logger.info('🎉 Save template mutation success');
    },
    onError: (error: Error, { status }) => {
      logger.error('❌ Save template mutation error:', error.message);
      toast.error(`Gagal menyimpan template untuk status ${status}`);
    },
  });

  const saveAllTemplatesMutation = useMutation({
    mutationFn: (templatesData: Record<string, string>) => 
      saveAllTemplates(user!.id, templatesData),
    onSuccess: (data) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: followUpTemplateQueryKeys.lists() });
      
      toast.success('Semua template berhasil disimpan!');
      logger.info('🎉 Save all templates mutation success');
    },
    onError: (error: Error) => {
      logger.error('❌ Save all templates mutation error:', error.message);
      toast.error('Gagal menyimpan template');
    },
  });

  // ✅ Real-time subscription using useEffect (stable dependencies)
  React.useEffect(() => {
    if (!user?.id) return;

    logger.info('🔄 Setting up real-time subscription for follow-up templates');

    const channel = supabase
      .channel(`realtime-followup-templates-${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'followup_templates',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        logger.info('📡 Real-time follow-up template event received:', payload.eventType);

        // Invalidate queries to refetch fresh data
        queryClient.invalidateQueries({ queryKey: followUpTemplateQueryKeys.lists() });
      })
      .subscribe();

    return () => {
      logger.debug('🧹 Cleaning up follow-up template real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]); // ✅ Stable dependencies only

  // ✅ Context action functions using mutations
  const loadTemplates = useCallback(async (): Promise<void> => {
    logger.info('🔄 Manual reload templates requested');
    await refetch();
  }, [refetch]);

  const saveTemplateAction = useCallback(async (status: string, template: string): Promise<boolean> => {
    if (!user) {
      logger.warn('🔐 Save template attempted without authentication');
      toast.error('Anda harus login untuk menyimpan template');
      return false;
    }

    try {
      await saveTemplateMutation.mutateAsync({ status, template });
      return true;
    } catch (error) {
      logger.error('❌ Save template failed:', error);
      return false;
    }
  }, [user, saveTemplateMutation]);

  const saveAllTemplatesAction = useCallback(async (templatesData: Record<string, string>): Promise<boolean> => {
    if (!user) {
      logger.warn('🔐 Save all templates attempted without authentication');
      toast.error('Anda harus login untuk menyimpan template');
      return false;
    }

    try {
      await saveAllTemplatesMutation.mutateAsync(templatesData);
      return true;
    } catch (error) {
      logger.error('❌ Save all templates failed:', error);
      return false;
    }
  }, [user, saveAllTemplatesMutation]);

  // ✅ Utility functions
  const getTemplate = useCallback((status: string): string => {
    return templates[status] || DEFAULT_TEMPLATES[status] || '';
  }, [templates]);

  const getTemplateForCurrentStatus = useCallback((orderStatus?: string) => {
    if (!orderStatus) return null;
    
    const template = getTemplate(orderStatus);
    if (!template) return null;
    
    return {
      status: orderStatus,
      template
    };
  }, [getTemplate]);

  const getAvailableStatuses = useCallback((): string[] => {
    return Object.keys(DEFAULT_TEMPLATES);
  }, []);

  const resetToDefaults = useCallback(() => {
    // Reset to defaults by updating local query cache
    queryClient.setQueryData(
      followUpTemplateQueryKeys.list(user?.id),
      DEFAULT_TEMPLATES
    );
    logger.info('🔄 Templates reset to defaults');
  }, [queryClient, user?.id]);

  // ✅ Handle query error
  React.useEffect(() => {
    if (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('❌ Template query error:', errorMessage);
      toast.error('Gagal memuat template WhatsApp');
    }
  }, [error]);

  // ✅ Context value with enhanced state from useQuery
  const value: FollowUpTemplateContextType = {
    templates,
    isLoading: isLoading || saveTemplateMutation.isPending || saveAllTemplatesMutation.isPending,
    loadTemplates,
    saveTemplate: saveTemplateAction,
    saveAllTemplates: saveAllTemplatesAction,
    getTemplate,
    getTemplateForCurrentStatus,
    getAvailableStatuses,
    resetToDefaults,
  };

  logger.debug('🎯 FollowUpTemplateContext value prepared:', {
    templatesCount: Object.keys(templates).length,
    isLoading: value.isLoading,
    hasError: !!error
  });

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

// ✅ ENHANCED: Hook untuk memproses template dengan data order + items support
export const useProcessTemplate = () => {
  const processTemplate = useCallback((template: string, orderData: any): string => {
    if (!orderData || !template) return template;
    
    // ✅ ENHANCED: Generate items list dalam berbagai format
    const generateItemsList = (items: any[], format: 'simple' | 'detailed' = 'simple'): string => {
      if (!items || items.length === 0) {
        return 'Tidak ada item';
      }

      if (format === 'simple') {
        return items
          .map((item: any) => `- ${item.namaBarang || item.name || 'Item'} (${item.quantity || 1}x)`)
          .join('\n');
      }

      // Format detailed dengan harga
      return items
        .map((item: any) => {
          const name = item.namaBarang || item.name || 'Item';
          const quantity = item.quantity || 1;
          const price = item.harga || item.price || 0;
          const subtotal = quantity * price;
          
          const formatCurrency = (amount: number) => {
            return new Intl.NumberFormat('id-ID', { 
              style: 'currency', 
              currency: 'IDR', 
              minimumFractionDigits: 0 
            }).format(amount);
          };
          
          return `- ${name}\n  Qty: ${quantity}x @ ${formatCurrency(price)} = ${formatCurrency(subtotal)}`;
        })
        .join('\n\n');
    };

    // Format currency helper
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('id-ID', { 
        style: 'currency', 
        currency: 'IDR', 
        minimumFractionDigits: 0 
      }).format(amount || 0);
    };

    // ✅ ENHANCED: Process template dengan semua variables
    const processedTemplate = template
      // Basic order info
      .replace(/\{\{namaPelanggan\}\}/g, orderData.namaPelanggan || '')
      .replace(/\{\{nomorPesanan\}\}/g, orderData.nomorPesanan || '')
      .replace(/\{\{telefonPelanggan\}\}/g, orderData.telefonPelanggan || '')
      .replace(/\{\{emailPelanggan\}\}/g, orderData.emailPelanggan || '')
      .replace(/\{\{alamatPengiriman\}\}/g, orderData.alamatPengiriman || '')
      .replace(/\{\{catatan\}\}/g, orderData.catatan || '')
      .replace(/\{\{status\}\}/g, orderData.status || '')
      
      // Date and money
      .replace(/\{\{tanggal\}\}/g, orderData.tanggal ? new Date(orderData.tanggal).toLocaleDateString('id-ID') : '')
      .replace(/\{\{totalPesanan\}\}/g, formatCurrency(orderData.totalPesanan))
      .replace(/\{\{subtotal\}\}/g, formatCurrency(orderData.subtotal || 0))
      .replace(/\{\{pajak\}\}/g, formatCurrency(orderData.pajak || 0))
      
      // ✅ NEW: Items-related variables
      .replace(/\{\{items\}\}/g, generateItemsList(orderData.items || [], 'simple'))
      .replace(/\{\{itemsDetail\}\}/g, generateItemsList(orderData.items || [], 'detailed'))
      .replace(/\{\{jumlahItems\}\}/g, (orderData.items?.length || 0).toString())
      .replace(/\{\{totalQuantity\}\}/g, 
        (orderData.items?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0).toString()
      );

    return processedTemplate;
  }, []);

  return { processTemplate };
};

export default FollowUpTemplateProvider;