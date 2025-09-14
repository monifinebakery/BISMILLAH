// src/components/orders/naming.ts
// Helpers to convert between camelCase (legacy UI) and snake_case (new standard)

import type { Order } from './types';

type AnyRecord = Record<string, any>;

const camel_to_snake_key = (key: string) =>
  key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);

const snake_to_camel_key = (key: string) =>
  key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());

export const to_snake_order = (order: AnyRecord): Order => {
  const mapped: AnyRecord = {};
  Object.entries(order || {}).forEach(([k, v]) => {
    let key = k;
    // Explicit maps for known fields that differ semantically
    const explicit: Record<string, string> = {
      nomorPesanan: 'nomor_pesanan',
      namaPelanggan: 'nama_pelanggan',
      teleponPelanggan: 'telepon_pelanggan',
      emailPelanggan: 'email_pelanggan',
      alamatPengiriman: 'alamat_pengiriman',
      totalPesanan: 'total_pesanan',
      userId: 'user_id',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      tanggalSelesai: 'tanggal_selesai',
    };
    key = explicit[k] || camel_to_snake_key(k);
    mapped[key] = v;
  });

  return mapped as Order;
};

export const from_snake_order = (order: AnyRecord): AnyRecord => {
  const mapped: AnyRecord = {};
  Object.entries(order || {}).forEach(([k, v]) => {
    let key = k;
    const explicit: Record<string, string> = {
      nomor_pesanan: 'nomorPesanan',
      nama_pelanggan: 'namaPelanggan',
      telepon_pelanggan: 'teleponPelanggan',
      email_pelanggan: 'emailPelanggan',
      alamat_pengiriman: 'alamatPengiriman',
      total_pesanan: 'totalPesanan',
      user_id: 'userId',
      created_at: 'createdAt',
      updated_at: 'updatedAt',
      tanggal_selesai: 'tanggalSelesai',
    };
    key = explicit[k] || snake_to_camel_key(k);
    mapped[key] = v;
  });
  return mapped;
};

// Map arrays of orders efficiently
export const to_snake_orders = (orders: AnyRecord[]): Order[] => orders.map(to_snake_order);
export const from_snake_orders = (orders: AnyRecord[]): AnyRecord[] => orders.map(from_snake_order);

export default {
  to_snake_order,
  from_snake_order,
  to_snake_orders,
  from_snake_orders,
};

