// src/utils/testSimpleNotifications.ts
// ✅ SIMPLE NOTIFICATION TEST - Test the new simplified system

import { addSimpleNotification } from '@/services/simpleNotificationApi';

// Test function to add a sample notification
export const testSimpleNotification = async (userId: string) => {
  try {
    const result = await addSimpleNotification({
      user_id: userId,
      title: 'Notifikasi Tes',
      message: 'Ini adalah notifikasi tes dari sistem yang disederhanakan',
      type: 'info',
      is_read: false
    }, userId);
    
    console.log('Notifikasi tes ditambahkan:', result);
    return result;
  } catch (error) {
    console.error('Kesalahan menambahkan notifikasi tes:', error);
    return null;
  }
};

// Test function to add multiple sample notifications
export const testMultipleSimpleNotifications = async (userId: string) => {
  const notifications = [
    {
      title: 'Selamat Datang!',
      message: 'Selamat datang di sistem notifikasi yang disederhanakan',
      type: 'success'
    },
    {
      title: 'Pesanan Baru Diterima',
      message: 'Anda memiliki pesanan baru untuk diproses',
      type: 'info'
    },
    {
      title: 'Peringatan Stok Rendah',
      message: 'Beberapa item mulai menipis di inventaris',
      type: 'warning'
    },
    {
      title: 'Pembayaran Diterima',
      message: 'Pembayaran pelanggan telah diproses',
      type: 'success'
    }
  ];

  try {
    const results = [];
    for (const notif of notifications) {
      const result = await addSimpleNotification({
        user_id: userId,
        title: notif.title,
        message: notif.message,
        type: notif.type as 'info' | 'success' | 'warning' | 'error',
        is_read: false
      }, userId);
      
      results.push(result);
      // Add a small delay to ensure proper ordering
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('Notifikasi tes ditambahkan:', results);
    return results;
  } catch (error) {
    console.error('Kesalahan menambahkan notifikasi tes:', error);
    return [];
  }
};