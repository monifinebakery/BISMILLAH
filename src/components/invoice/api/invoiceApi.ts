// src/components/invoice/api/invoiceApi.ts
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { toSafeISOString } from '@/utils/unifiedDateUtils';
import { UserFriendlyDate } from '@/utils/unifiedDateUtils';
import type { OrderData } from '../types';

export const invoiceApi = {
  async getOrderById(orderId: string): Promise<OrderData> {
    logger.context('InvoiceAPI', 'Fetching order by ID:', orderId);

    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        nomor_pesanan,
        nama_pelanggan,
        alamat_pengiriman,
        telepon_pelanggan,
        email_pelanggan,
        tanggal,
        items,
        subtotal,
        pajak,
        total_pesanan
      `)
      .eq('id', orderId)
      .single();

    if (error) {
      logger.error('InvoiceAPI: Error fetching order:', error);
      throw new Error('Gagal memuat data pesanan: ' + error.message);
    }

    if (!data) {
      throw new Error('Pesanan tidak ditemukan');
    }

    // Transform database data to OrderData format
    const orderData: OrderData = {
      id: data.id,
      order_number: data.nomor_pesanan,
      customer_name: data.nama_pelanggan,
      customer_address: data.alamat_pengiriman,
      customer_phone: data.telepon_pelanggan,
      customer_email: data.email_pelanggan,
      order_date: UserFriendlyDate.safeParseToDate(data.tanggal),
      items: Array.isArray(data.items) ? data.items.map((item: any, index: number) => ({
        id: index + 1,
        item_name: item.item_name || item.namaBarang || item.nama || item.description || 'Item',
    quantity: item.quantity || item.jumlah || 1,
    unit_price: item.unit_price || item.hargaSatuan || item.harga || item.price || 0,
    total_price: (item.quantity || item.jumlah || 1) * (item.unit_price || item.hargaSatuan || item.harga || item.price || 0)
      })) : [],
      subtotal: data.subtotal || 0,
      tax_amount: data.pajak || 0,
      total_amount: data.total_pesanan || 0
    };

    logger.success('InvoiceAPI: Order data loaded successfully:', orderData.order_number);
    return orderData;
  },

  // Mock function for development - replace with real implementation
  async getMockOrderById(orderId: string): Promise<OrderData> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    logger.context('InvoiceAPI', 'Loading mock order data for:', orderId);
    
    return {
      id: orderId,
      order_number: `ORD-${orderId}`,
      customer_name: 'Customer Name',
      customer_address: 'Jl. Customer Address No. 123\nKelurahan ABC, Kecamatan DEF\nKota GHI 12345',
      customer_phone: '+62 123 456 789',
      customer_email: 'customer@email.com',
      order_date: new Date(),
      items: [
        { id: 1, item_name: 'Product 1', quantity: 2, unit_price: 50000, total_price: 100000 },
    { id: 2, item_name: 'Product 2', quantity: 1, unit_price: 75000, total_price: 75000 }
      ],
      subtotal: 175000,
      tax_amount: 19250,
      total_amount: 194250
    };
  }
};