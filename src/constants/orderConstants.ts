// src/constants/orderConstants.ts

// Daftar status untuk digunakan di dropdown dan iterasi
export const ORDER_STATUS_LIST = [
  { key: 'pending', label: 'Menunggu' },
  { key: 'confirmed', label: 'Dikonfirmasi' },
  { key: 'processing', label: 'Diproses' },
  { key: 'shipping', label: 'Sedang Dikirim' },
  { key: 'delivered', label: 'Selesai' },
  { key: 'cancelled', label: 'Dibatalkan' },
];

/**
 * Mengembalikan teks label yang mudah dibaca dari sebuah key status.
 * @param status - Key status (misalnya, 'pending').
 * @returns Teks label (misalnya, 'Menunggu').
 */
export const getStatusText = (status: string): string => {
  const foundStatus = ORDER_STATUS_LIST.find(s => s.key === status);
  return foundStatus ? foundStatus.label : status;
};

/**
 * Mengembalikan kelas warna Tailwind CSS berdasarkan status pesanan.
 * @param status - Key status (misalnya, 'pending').
 * @returns String kelas CSS untuk warna latar dan teks.
 */
export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'confirmed':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'processing':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'shipping':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'delivered':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'cancelled':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};