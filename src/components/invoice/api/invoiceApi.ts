// src/components/invoice/api/invoiceApi.ts
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { toSafeISOString } from '@/utils/unifiedDateUtils';
import { UserFriendlyDate } from '@/utils/userFriendlyDate';
import type { OrderData } from '../types';

interface OrderItemDB {
  item_name?: string;
  namaBarang?: string;
  nama?: string;
  description?: string;
  quantity?: number;
  jumlah?: number;
  unit_price?: number;
  hargaSatuan?: number;
  harga?: number;
  price?: number;
}

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
    const items = Array.isArray(data.items) ? (data.items as OrderItemDB[]).map((item: OrderItemDB, index: number) => ({
      id: index + 1,
      itemName: item.item_name || item.namaBarang || item.nama || item.description || 'Item',
      quantity: item.quantity || item.jumlah || 1,
      unitPrice: item.unit_price || item.hargaSatuan || item.harga || item.price || 0,
      totalPrice: (item.quantity || item.jumlah || 1) * (item.unit_price || item.hargaSatuan || item.harga || item.price || 0)
    })) : [];

    // Calculate subtotal from items
    const calculatedSubtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const taxAmount = 0; // No tax info in orders table

    const orderData: OrderData = {
      id: data.id,
      orderNumber: data.nomor_pesanan,
      customerName: data.nama_pelanggan,
      customerAddress: data.alamat_pengiriman || undefined,
      customerPhone: data.telepon_pelanggan || undefined,
      customerEmail: data.email_pelanggan || undefined,
      orderDate: UserFriendlyDate.safeParseToDate(data.tanggal),
      items,
      subtotal: calculatedSubtotal,
      taxAmount,
      totalAmount: data.total_pesanan || calculatedSubtotal
    };

    logger.success('InvoiceAPI: Order data loaded successfully:', orderData.orderNumber);
    return orderData;
  },

  // Mock function for development - replace with real implementation
  async getMockOrderById(orderId: string): Promise<OrderData> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    logger.context('InvoiceAPI', 'Loading mock order data for:', orderId);
    
    return {
      id: orderId,
      orderNumber: `ORD-${orderId}`,
      customerName: 'Customer Name',
      customerAddress: 'Jl. Customer Address No. 123\nKelurahan ABC, Kecamatan DEF\nKota GHI 12345',
      customerPhone: '+62 123 456 789',
      customerEmail: 'customer@email.com',
      orderDate: new Date(),
      items: [
        { id: 1, itemName: 'Product 1', quantity: 2, unitPrice: 50000, totalPrice: 100000 },
        { id: 2, itemName: 'Product 2', quantity: 1, unitPrice: 75000, totalPrice: 75000 }
      ],
      subtotal: 175000,
      taxAmount: 19250,
      totalAmount: 194250
    };
  }
};