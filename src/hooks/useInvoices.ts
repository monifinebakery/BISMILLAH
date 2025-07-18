// src/hooks/useInvoiceService.ts (atau src/hooks/useInvoices.ts jika Anda mengganti isinya)

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
// Import tipe Invoice yang sudah kita definisikan
import { Invoice, InvoiceCustomerInfo, InvoiceBusinessInfo, OrderItem, InvoicePaymentStatus, InvoiceTemplateStyle } from '@/types/invoice';
import { generateUUID } from '@/utils/uuid';
import { safeParseDate, toSafeISOString } from '@/utils/dateUtils';

// Definisi TransformedInvoice (snake_case untuk DB) tetap dibutuhkan di sini
// karena hook ini yang akan melakukan mapping ke/dari DB.
interface TransformedInvoice {
  id: string;
  user_id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string | null;
  customer_info: InvoiceCustomerInfo; 
  business_info: InvoiceBusinessInfo; 
  items: OrderItem[]; 
  subtotal: number;
  tax_amount: number;
  discount_amount: number | null;
  shipping_cost: number | null;
  total_amount: number;
  amount_paid: number;
  payment_status: InvoicePaymentStatus; 
  notes: string | null;
  template_style: InvoiceTemplateStyle; 
  created_at: string;
  updated_at: string;
}

export const useInvoiceService = () => { // Nama hook diubah
  // Fungsi untuk memuat semua invoice dari Supabase
  const fetchInvoicesFromDb = async (currentUserId: string): Promise<Invoice[] | null> => {
    if (!currentUserId) {
      console.warn('No userId provided for fetching invoices from DB.');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', currentUserId)
        .order('issue_date', { ascending: false })
        .timeout(5000);

      if (error) {
        console.error('Error fetching invoices from Supabase:', error);
        toast.error(`Gagal memuat invoice dari server: ${error.message}`);
        return null;
      }

      // Transformasi data dari format DB (snake_case) ke format frontend (camelCase)
      const transformedData = data.map((item: any) => {
        const parsedIssueDate = safeParseDate(item.issue_date);
        const parsedDueDate = safeParseDate(item.due_date);
        const parsedCreatedAt = safeParseDate(item.created_at);
        const parsedUpdatedAt = safeParseDate(item.updated_at);

        return {
          id: item.id,
          userId: item.user_id,
          invoiceNumber: item.invoice_number,
          issueDate: (parsedIssueDate instanceof Date && !isNaN(parsedIssueDate.getTime())) ? parsedIssueDate : new Date(),
          dueDate: (parsedDueDate instanceof Date && !isNaN(parsedDueDate.getTime())) ? parsedDueDate : null,
          
          customerInfo: item.customer_info || {}, 
          businessInfo: item.business_info || {}, 
          items: item.items || [], 
          
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
      return transformedData;
    } catch (error) {
      console.error('Unexpected error in fetchInvoicesFromDb:', error);
      toast.error('Terjadi kesalahan tak terduga saat memuat invoice.');
      return null;
    }
  };

  // Fungsi untuk menambah invoice ke Supabase
  const addInvoiceToDb = async (invoiceData: Omit<Invoice, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Invoice | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Anda harus login untuk menambahkan invoice');
        return null;
      }

      // Validasi data input
      if (!invoiceData.invoiceNumber || !invoiceData.issueDate || !invoiceData.customerInfo.namaPelanggan || !invoiceData.businessInfo.namaBisnis || invoiceData.items.length === 0 || invoiceData.totalAmount <= 0) {
        toast.error('Harap lengkapi semua field wajib: Nomor Invoice, Tanggal Terbit, Info Pelanggan, Info Bisnis, Item, dan Total.');
        return null;
      }
      if (!(invoiceData.issueDate instanceof Date) || isNaN(invoiceData.issueDate.getTime())) {
        toast.error('Tanggal Terbit tidak valid.');
        return null;
      }
      if (invoiceData.dueDate && (!(invoiceData.dueDate instanceof Date) || isNaN(invoiceData.dueDate.getTime()))) {
        toast.error('Tanggal Jatuh Tempo tidak valid.');
        return null;
      }

      const newInvoiceId = generateUUID();
      const now = new Date();

      const invoiceToInsert: TransformedInvoice = { // Menggunakan TransformedInvoice untuk type safety
        id: newInvoiceId,
        user_id: session.user.id,
        invoice_number: invoiceData.invoiceNumber,
        issue_date: toSafeISOString(invoiceData.issueDate)!, // ! karena sudah divalidasi
        due_date: toSafeISOString(invoiceData.dueDate),
        
        customer_info: invoiceData.customerInfo,
        business_info: invoiceData.businessInfo,
        items: invoiceData.items,
        
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

      const { data, error } = await supabase.from('invoices').insert([invoiceToInsert]).select().single();
      if (error) {
        console.error('Error adding invoice to DB:', error);
        toast.error(`Gagal menambahkan invoice: ${error.message}`);
        return null;
      }

      // Mengembalikan invoice yang baru ditambahkan (dalam format frontend Invoice)
      return {
        ...invoiceData,
        id: data.id,
        userId: data.user_id,
        amountPaid: data.amount_paid,
        paymentStatus: data.payment_status,
        createdAt: safeParseDate(data.created_at),
        updatedAt: safeParseDate(data.updated_at),
      };
    } catch (error) {
      console.error('Error in addInvoiceToDb:', error);
      toast.error('Gagal menambahkan invoice');
      return null;
    }
  };

  // Fungsi untuk memperbarui invoice di Supabase
  const updateInvoiceInDb = async (id: string, updates: Partial<Invoice>): Promise<Invoice | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Anda harus login untuk memperbarui invoice');
        return null;
      }

      const invoiceToUpdate: Partial<TransformedInvoice> = {
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

      const { data, error } = await supabase.from('invoices').update(invoiceToUpdate).eq('id', id).eq('user_id', session.user.id).select().single();
      if (error) {
        console.error('Error updating invoice:', error);
        toast.error(`Gagal memperbarui invoice: ${error.message}`);
        return null;
      }

      // Mengembalikan invoice yang diperbarui
      return {
        ...updates, // Gabungkan update yang diberikan
        id: data.id,
        userId: data.user_id,
        invoiceNumber: data.invoice_number, // Pastikan properti ini tetap dari DB jika tidak diupdate
        issueDate: safeParseDate(data.issue_date) || new Date(),
        dueDate: safeParseDate(data.due_date) || null,
        customerInfo: data.customer_info,
        businessInfo: data.business_info,
        items: data.items,
        subtotal: parseFloat(data.subtotal),
        taxAmount: parseFloat(data.tax_amount),
        discountAmount: parseFloat(data.discount_amount) ?? null,
        shippingCost: parseFloat(data.shipping_cost) ?? null,
        totalAmount: parseFloat(data.total_amount),
        amountPaid: parseFloat(data.amount_paid),
        paymentStatus: data.payment_status,
        notes: data.notes || null,
        templateStyle: data.template_style,
        createdAt: safeParseDate(data.created_at),
        updatedAt: safeParseDate(data.updated_at),
      };
    } catch (error) {
      console.error('Error in updateInvoiceInDb:', error);
      toast.error('Gagal memperbarui invoice');
      return null;
    }
  };

  // Fungsi untuk menghapus invoice dari Supabase
  const deleteInvoiceFromDb = async (id: string): Promise<boolean> => {
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
      return true;
    } catch (error) {
      console.error('Error in deleteInvoiceFromDb:', error);
      toast.error('Gagal menghapus invoice');
      return false;
    }
  };

  return {
    fetchInvoicesFromDb,
    addInvoiceToDb,
    updateInvoiceInDb,
    deleteInvoiceFromDb,
  };
};