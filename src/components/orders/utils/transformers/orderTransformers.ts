// 🎯 100 lines - DB <-> UI transformations
import { Order, NewOrder } from '../../types/order';
import { safeParseDate, toSafeISOString, isValidDate } from './dateTransformers';

export const transformOrderFromDB = (dbItem: any): Order => {
  try {
    if (!dbItem || typeof dbItem !== 'object') {
      throw new Error('Invalid order data from database');
    }

    // Safe date parsing with fallbacks
    const parsedTanggal = safeParseDate(dbItem.tanggal);
    const parsedCreatedAt = safeParseDate(dbItem.created_at);
    const parsedUpdatedAt = safeParseDate(dbItem.updated_at);

    return {
      id: dbItem.id,
      nomorPesanan: dbItem.nomor_pesanan || '',
      namaPelanggan: dbItem.nama_pelanggan || '',
      teleponPelanggan: dbItem.telepon_pelanggan || '',
      emailPelanggan: dbItem.email_pelanggan || '',
      alamatPengiriman: dbItem.alamat_pengiriman || '',
      tanggal: parsedTanggal || new Date(),
      items: Array.isArray(dbItem.items) ? dbItem.items : [],
      totalPesanan: Number(dbItem.total_pesanan) || 0,
      status: dbItem.status || 'pending',
      catatan: dbItem.catatan || '',
      subtotal: Number(dbItem.subtotal) || 0,
      pajak: Number(dbItem.pajak) || 0,
      userId: dbItem.user_id,
      createdAt: parsedCreatedAt || new Date(),
      updatedAt: parsedUpdatedAt || new Date(),
    };
  } catch (error) {
    console.error('Error transforming order from DB:', error, dbItem);
    
    // Return safe fallback order
    return {
      id: dbItem?.id || 'error',
      nomorPesanan: 'ERROR',
      namaPelanggan: 'Data Error',
      teleponPelanggan: '',
      emailPelanggan: '',
      alamatPengiriman: '',
      tanggal: new Date(),
      items: [],
      totalPesanan: 0,
      status: 'pending',
      catatan: 'Error loading order data',
      subtotal: 0,
      pajak: 0,
      userId: dbItem?.user_id || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
};

export const transformOrderToDB = (data: Partial<Order>): { [key: string]: any } => {
  try {
    const dbData: { [key: string]: any } = {};
    
    // Safe property mapping with validation
    if (data.namaPelanggan !== undefined) dbData.nama_pelanggan = data.namaPelanggan;
    if (data.teleponPelanggan !== undefined) dbData.telepon_pelanggan = data.teleponPelanggan;
    if (data.emailPelanggan !== undefined) dbData.email_pelanggan = data.emailPelanggan;
    if (data.alamatPengiriman !== undefined) dbData.alamat_pengiriman = data.alamatPengiriman;
    if (data.status !== undefined) dbData.status = data.status;
    if (data.items !== undefined) dbData.items = data.items;
    if (data.totalPesanan !== undefined) dbData.total_pesanan = data.totalPesanan;
    if (data.catatan !== undefined) dbData.catatan = data.catatan;
    if (data.subtotal !== undefined) dbData.subtotal = data.subtotal;
    if (data.pajak !== undefined) dbData.pajak = data.pajak;
    
    // Enhanced date handling
    if (data.tanggal !== undefined) {
      if (data.tanggal instanceof Date && isValidDate(data.tanggal)) {
        dbData.tanggal = toSafeISOString(data.tanggal);
      } else if (typeof data.tanggal === 'string') {
        const parsedDate = safeParseDate(data.tanggal);
        dbData.tanggal = parsedDate ? toSafeISOString(parsedDate) : toSafeISOString(new Date());
      } else {
        dbData.tanggal = toSafeISOString(new Date());
      }
    }
    
    return dbData;
  } catch (error) {
    console.error('Error transforming order to DB:', error, data);
    
    // Return safe minimal data
    return {
      nama_pelanggan: data.namaPelanggan || 'Error',
      status: data.status || 'pending',
      total_pesanan: data.totalPesanan || 0,
      tanggal: toSafeISOString(new Date())
    };
  }
};