// src/utils/financialUtils.js

/**
 * Menyaring transaksi berdasarkan rentang tanggal.
 * @param {Array} transactions - Array objek transaksi (bisa pesanan atau transaksi keuangan).
 * @param {Object} dateRange - Objek dengan properti 'from' dan 'to'.
 * @param {string} dateKey - Nama properti tanggal pada objek transaksi (misalnya 'tanggal' atau 'timestamp').
 * @returns {Array} Array transaksi yang sudah difilter.
 */
export const filterByDateRange = (transactions, dateRange, dateKey = 'tanggal') => {
  if (!transactions || !dateRange?.from) {
    return [];
  }

  const fromDate = new Date(dateRange.from).setHours(0, 0, 0, 0);
  const toDate = dateRange.to ? new Date(dateRange.to).setHours(23, 59, 59, 999) : fromDate;

  return transactions.filter(item => {
    const itemDateValue = item[dateKey];
    if (!itemDateValue) return false;
    
    const itemDate = new Date(itemDateValue).getTime();
    return itemDate >= fromDate && itemDate <= toDate;
  });
};

/**
 * Menghitung total omzet dari daftar pesanan yang sudah difilter.
 * Omzet dihitung dari semua pesanan, terlepas dari status pembayarannya (Gross Revenue).
 * @param {Array} filteredOrders - Array objek pesanan yang sudah difilter berdasarkan tanggal.
 * @returns {number} Total omzet.
 */
export const calculateGrossRevenue = (filteredOrders) => {
  if (!filteredOrders) {
    return 0;
  }
  return filteredOrders.reduce((sum, order) => sum + (order.total || 0), 0);
};

/**
 * Menghitung total pemasukan dari transaksi keuangan yang statusnya 'income'.
 * Ini adalah pendapatan yang dicatat secara manual di laporan keuangan.
 * @param {Array} filteredTransactions - Array transaksi keuangan yang sudah difilter.
 * @returns {number} Total pemasukan.
 */
export const calculateTotalIncome = (filteredTransactions) => {
    if (!filteredTransactions) {
        return 0;
    }
    return filteredTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
};

/**
 * Menghitung total pengeluaran dari transaksi keuangan yang statusnya 'expense'.
 * @param {Array} filteredTransactions - Array transaksi keuangan yang sudah difilter.
 * @returns {number} Total pengeluaran.
 */
export const calculateTotalExpense = (filteredTransactions) => {
    if (!filteredTransactions) {
        return 0;
    }
    return filteredTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
};