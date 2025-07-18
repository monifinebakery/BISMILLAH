// src/hooks/useInvoices.ts

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
// Import tipe Invoice yang sudah kita definisikan
import { Invoice, InvoiceCustomerInfo, InvoiceBusinessInfo, OrderItem, InvoicePaymentStatus, InvoiceTemplateStyle } from '@/types/invoice';
import { generateUUID } from '@/utils/uuid';
import { saveToStorage, loadFromStorage } from '@/utils/localStorageHelpers';
import { safeParseDate, toSafeISOString } from '@/utils/dateUtils';

const STORAGE_KEY = 'hpp_app_invoices'; // Kunci penyimpanan khusus untuk invoice di localStorage

export const useInvoices = (userId: string | undefined) => {
  // State untuk menyimpan daftar invoice
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    // Muat data dari localStorage saat inisialisasi state
    const storedInvoices = loadFromStorage(STORAGE_KEY, []);
    return storedInvoices.map((item: any) => {
      // Pastikan semua tanggal di-parse dengan benar
      const parsedIssueDate = safeParseDate(item.issueDate || item.issue_date);
      const parsedDueDate = safeParseDate(item.dueDate || item.due_date);
      const parsedCreatedAt = safeParseDate(item.createdAt || item.created_at);
      const parsedUpdatedAt = safeParseDate(item.updatedAt || item.updated_at);

      return {
        ...item, // Salin properti yang ada
        id: item.id,
        userId: item.userId || item.user_id, // Kompatibilitas dengan nama lama jika ada
        invoiceNumber: item.invoiceNumber || item.invoice_number,
        issueDate: (parsedIssueDate instanceof Date && !isNaN(parsedIssueDate.getTime())) ? parsedIssueDate : new Date(), // Wajib valid Date
        dueDate: (parsedDueDate instanceof Date && !isNaN(parsedDueDate.getTime())) ? parsedDueDate : null,
        
        customerInfo: item.customerInfo || item.customer_info || {}, // Pastikan ini objek
        businessInfo: item.businessInfo || item.business_info || {}, // Pastikan ini objek
        items: item.items || [], // Pastikan ini array

        subtotal: parseFloat(item.subtotal) || 0,
        taxAmount: parseFloat(item.taxAmount || item.tax_amount) || 0,
        discountAmount: parseFloat(item.discountAmount || item.discount_amount) ?? null,
        shippingCost: parseFloat(item.shippingCost || item.shipping_cost) ?? null,
        totalAmount: parseFloat(item.totalAmount || item.total_amount) || 0,
        amountPaid: parseFloat(item.amountPaid || item.amount_paid) || 0,
        paymentStatus: item.paymentStatus || item.payment_status || 'Belum Dibayar',
        notes: item.notes || null,
        templateStyle: item.templateStyle || item.template_style || 'Simple',

        createdAt: (parsedCreatedAt instanceof Date && !isNaN(parsedCreatedAt.getTime())) ? parsedCreatedAt : null,
        updatedAt: (parsedUpdatedAt instanceof Date && !isNaN(parsedUpdatedAt.getTime())) ? parsedUpdatedAt : null,
      } as Invoice;
    });
  });

  const [loading, setLoading] = useState(true); // State loading untuk operasi fetch
  const isMounted = useRef(true); // Untuk mencegah update state pada unmounted component

  // Efek samping untuk fetch invoices dari Supabase saat userId berubah atau komponen mount
  useEffect(() => {
    const fetchInvoices = async () => {
      if (!isMounted.current) return;
      setLoading(true);

      try {
        if (!userId) {
          console.warn('No userId provided for invoices, using local storage data only.');
          if (isMounted.current) setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('invoices')
          .select('*') // Ambil semua kolom
          .eq('user_id', userId)
          .order('issue_date', { ascending: false }) // Urutkan berdasarkan tanggal terbit terbaru
          .timeout(5000); // Batas waktu 5 detik

        if (error) {
          console.error('Error loading invoices from Supabase:', error);
          toast.error(`Gagal memuat invoice dari server: ${error.message}`);
          // Fallback ke data yang sudah ada di state (yang sudah di-parse dari localStorage)
          if (isMounted.current && invoices.length > 0) {
            setInvoices(invoices); 
            console.log('Falling back to previously loaded local storage invoice data.');
          }
        } else {
          // Transformasi data dari format DB (snake_case) ke format frontend (camelCase)
          const transformedData = data.map((item: any) => {
            const parsedIssueDate = safeParseDate(item.issue_date);
            const parsedDueDate = safeParseDate(item.due_date);
            const parsedCreatedAt = safeParseDate(item.created_at);
            const parsedUpdatedAt = safeParseDate(item.updated_at);

            return {
              id: item.id,
              userId: item.user_id,
              orderId: item.order_id || null, // Meskipun tidak lagi dikaitkan, biarkan properti ini untuk kompatibilitas jika ada di DB lama
              invoiceNumber: item.invoice_number,
              issueDate: (parsedIssueDate instanceof Date && !isNaN(parsedIssueDate.getTime())) ? parsedIssueDate : new Date(),
              dueDate: (parsedDueDate instanceof Date && !isNaN(parsedDueDate.getTime())) ? parsedDueDate : null,
              
              customerInfo: item.customer_info || {}, // JSONB dari DB
              businessInfo: item.business_info || {}, // JSONB dari DB
              items: item.items || [], // JSONB array dari DB
              
              subtotal: parseFloat(item.subtotal) || 0,
              taxAmount: parseFloat(item.tax_amount) || 0,
              discountAmount: parseFloat(item.discount_amount) ?? null,
              shippingCost: parseFloat(item.shipping_cost) ?? null,
              totalAmount: parseFloat(item.total_amount) || 0,
              amountPaid: parseFloat(item.amount_paid) || 0,
              paymentStatus: item.payment_status || 'Belum Dibayar',
              notes: item.notes || null,
              templateStyle: item.template_style || 'Simple',

              createdAt: (parsedCreatedAt instanceof Date && !isNaN(parsedCreatedAt.getTime())) ? parsedCreatedAt : null,
              updatedAt: (parsedUpdatedAt instanceof Date && !isNaN(parsedUpdatedAt.getTime())) ? parsedUpdatedAt : null,
            } as Invoice;
          });
          if (isMounted.current) {
            setInvoices(transformedData);
            saveToStorage(STORAGE_KEY, transformedData); // Simpan ke localStorage
            console.log('Invoices loaded and saved to local storage:', transformedData);
          }
        }
      } catch (error) {
        console.error('Unexpected error fetching invoices:', error);
        toast.error('Terjadi kesalahan tak terduga saat memuat invoice');
        // Fallback ke data yang sudah ada di state (yang sudah di-parse dari localStorage)
        if (isMounted.current && invoices.length > 0) {
          setInvoices(invoices); 
          console.log('Falling back to previously loaded local storage invoice data.');
        }
      } finally {
        if (isMounted.current) setLoading(false);
      }
    };

    fetchInvoices();

    // Cleanup function untuk menandai komponen sebagai unmounted
    return () => {
      isMounted.current = false;
    };
  }, [userId]); // userId adalah dependency, fetch ulang jika berubah

  // Efek samping untuk menyimpan state `invoices` ke localStorage setiap kali berubah
  useEffect(() => {
    saveToStorage(STORAGE_KEY, invoices);
  }, [invoices]);

  // Fungsi untuk menambah invoice baru
  const addInvoice = async (invoiceData: Omit<Invoice, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'amountPaid' | 'paymentStatus'>) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Anda harus login untuk menambahkan invoice');
        return false;
      }

      // Validasi data input
      if (!invoiceData.invoiceNumber || !invoiceData.issueDate || !invoiceData.customerInfo.namaPelanggan || !invoiceData.businessInfo.namaBisnis || invoiceData.items.length === 0 || invoiceData.totalAmount <= 0) {
        toast.error('Harap lengkapi semua field wajib: Nomor Invoice, Tanggal Terbit, Info Pelanggan, Info Bisnis, Item, dan Total.');
        return false;
      }
      if (!(invoiceData.issueDate instanceof Date) || isNaN(invoiceData.issueDate.getTime())) {
        toast.error('Tanggal Terbit tidak valid.');
        return false;
      }
      if (invoiceData.dueDate && (!(invoiceData.dueDate instanceof Date) || isNaN(invoiceData.dueDate.getTime()))) {
        toast.error('Tanggal Jatuh Tempo tidak valid.');
        return false;
      }

      const newInvoiceId = generateUUID();
      const now = new Date();

      const invoiceToInsert = {
        id: newInvoiceId,
        user_id: session.user.id,
        order_id: null, // Tidak dikaitkan dengan order
        invoice_number: invoiceData.invoiceNumber,
        issue_date: toSafeISOString(invoiceData.issueDate),
        due_date: toSafeISOString(invoiceData.dueDate),
        
        customer_info: invoiceData.customerInfo, // JSONB
        business_info: invoiceData.businessInfo, // JSONB
        items: invoiceData.items, // JSONB
        
        subtotal: invoiceData.subtotal,
        tax_amount: invoiceData.taxAmount,
        discount_amount: invoiceData.discountAmount ?? 0,
        shipping_cost: invoiceData.shippingCost ?? 0,
        total_amount: invoiceData.totalAmount,
        
        amount_paid: 0, // Default 0 saat pertama kali dibuat
        payment_status: 'Belum Dibayar', // Default status awal
        
        notes: invoiceData.notes || null,
        template_style: invoiceData.templateStyle || 'Simple',
        
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      };

      const { error } = await supabase.from('invoices').insert([invoiceToInsert]);
      if (error) {
        console.error('Error adding invoice to DB:', error);
        toast.error(`Gagal menambahkan invoice: ${error.message}`);
        return false;
      }

      // Perbarui state lokal dengan invoice baru
      setInvoices(prev => [...prev, {
        ...invoiceData,
        id: newInvoiceId,
        userId: session.user.id,
        amountPaid: 0, // Default 0 saat pertama kali dibuat
        paymentStatus: 'Belum Dibayar', // Default status awal
        createdAt: now,
        updatedAt: now,
      }]);
      toast.success(`Invoice ${invoiceData.invoiceNumber} berhasil ditambahkan!`);
      return true;
    } catch (error) {
      console.error('Error in addInvoice:', error);
      toast.error('Gagal menambahkan invoice');
      return false;
    }
  };

  // Fungsi untuk memperbarui invoice
  const updateInvoice = async (id: string, updates: Partial<Invoice>) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Anda harus login untuk memperbarui invoice');
        return false;
      }

      const invoiceToUpdate: Partial<any> = {
        updated_at: new Date().toISOString(),
      };

      // Mapping properti frontend ke nama kolom DB
      if (updates.invoiceNumber !== undefined) invoiceToUpdate.invoice_number = updates.invoiceNumber;
      if (updates.issueDate !== undefined) invoiceToUpdate.issue_date = toSafeISOString(updates.issueDate);
      if (updates.dueDate !== undefined) invoiceToUpdate.due_date = toSafeISOString(updates.dueDate);
      if (updates.customerInfo !== undefined) invoiceToUpdate.customer_info = updates.customerInfo;
      if (updates.businessInfo !== undefined) invoiceToUpdate.business_info = updates.businessInfo;
      if (updates.items !== undefined) invoiceToUpdate.items = updates.items;
      if (updates.subtotal !== undefined) invoiceToUpdate.subtotal = updates.subtotal;
      if (updates.taxAmount !== undefined) invoiceToUpdate.tax_amount = updates.taxAmount;
      if (updates.discountAmount !== undefined) invoiceToUpdate.discount_amount = updates.discountAmount;
      if (updates.shippingCost !== undefined) invoiceToUpdate.shipping_cost = updates.shippingCost;
      if (updates.totalAmount !== undefined) invoiceToUpdate.total_amount = updates.totalAmount;
      if (updates.amountPaid !== undefined) invoiceToUpdate.amount_paid = updates.amountPaid;
      if (updates.paymentStatus !== undefined) invoiceToUpdate.payment_status = updates.paymentStatus;
      if (updates.notes !== undefined) invoiceToUpdate.notes = updates.notes || null;
      if (updates.templateStyle !== undefined) invoiceToUpdate.template_style = updates.templateStyle;

      const { error } = await supabase.from('invoices').update(invoiceToUpdate).eq('id', id).eq('user_id', session.user.id);
      if (error) {
        console.error('Error updating invoice:', error);
        toast.error(`Gagal memperbarui invoice: ${error.message}`);
        return false;
      }

      // Perbarui state lokal
      setInvoices(prev => 
        prev.map(invoice => 
          invoice.id === id ? { ...invoice, ...updates, updatedAt: new Date() } : invoice
        )
      );
      toast.success(`Invoice berhasil diperbarui!`);
      return true;
    } catch (error) {
      console.error('Error in updateInvoice:', error);
      toast.error('Gagal memperbarui invoice');
      return false;
    }
  };

  // Fungsi untuk menghapus invoice
  const deleteInvoice = async (id: string): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Anda harus login untuk menghapus invoice');
        return false;
      }

      const { error } = await supabase.from('invoices').delete().eq('id', id).eq('user_id', session.user.id);
      if (error) {
        console.error('Error deleting invoice:', error);
        toast.error(`Gagal menghapus invoice: ${error.message}`);
        return false;
      }

      setInvoices(prev => prev.filter(inv => inv.id !== id));
      toast.success(`Invoice berhasil dihapus!`);
      return true;
    } catch (error) {
      console.error('Error in deleteInvoice:', error);
      toast.error('Gagal menghapus invoice');
      return false;
    }
  };

  return {
    invoices,
    loading,
    addInvoice,
    updateInvoice,
    deleteInvoice,
    setInvoices, // Exposed agar AppDataContext bisa mengatur data langsung
  };
};