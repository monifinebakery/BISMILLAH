// src/components/invoice/api/invoiceApi.ts
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
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
      nomorPesanan: data.nomor_pesanan,
      namaPelanggan: data.nama_pelanggan,
      alamatPelanggan: data.alamat_pengiriman,
      telefonPelanggan: data.telepon_pelanggan,
      emailPelanggan: data.email_pelanggan,
      tanggal: data.tanggal,
      items: Array.isArray(data.items) ? data.items.map((item: any, index: number) => ({
        id: index + 1,
        namaBarang: item.namaBarang || item.nama || item.description || 'Item',
        quantity: item.quantity || item.jumlah || 1,
        hargaSatuan: item.hargaSatuan || item.harga || item.price || 0,
        totalHarga: (item.quantity || item.jumlah || 1) * (item.hargaSatuan || item.harga || item.price || 0)
      })) : [],
      subtotal: data.subtotal || 0,
      pajak: data.pajak || 0,
      totalPesanan: data.total_pesanan || 0
    };

    logger.success('InvoiceAPI: Order data loaded successfully:', orderData.nomorPesanan);
    return orderData;
  },

  // Mock function for development - replace with real implementation
  async getMockOrderById(orderId: string): Promise<OrderData> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    logger.context('InvoiceAPI', 'Loading mock order data for:', orderId);
    
    return {
      id: orderId,
      nomorPesanan: `ORD-${orderId}`,
      namaPelanggan: 'Customer Name',
      alamatPelanggan: 'Jl. Customer Address No. 123\nKelurahan ABC, Kecamatan DEF\nKota GHI 12345',
      telefonPelanggan: '+62 123 456 789',
      emailPelanggan: 'customer@email.com',
      tanggal: new Date().toISOString(),
      items: [
        { id: 1, namaBarang: 'Product 1', quantity: 2, hargaSatuan: 50000, totalHarga: 100000 },
        { id: 2, namaBarang: 'Product 2', quantity: 1, hargaSatuan: 75000, totalHarga: 75000 }
      ],
      subtotal: 175000,
      pajak: 19250,
      totalPesanan: 194250
    };
  }
};