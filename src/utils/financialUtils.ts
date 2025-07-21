/**
 * Menghitung total omzet dari daftar pesanan.
 * @param {Array} orders - Array objek pesanan.
 * @param {Object} options - Opsi filter.
 * @param {boolean} [options.includePending=true] - Apakah akan menyertakan pesanan 'BELUM LUNAS'.
 * @returns {number} Total omzet.
 */
export const calculateRevenue = (orders, options = {}) => {
  // Set default options
  const { includePending = true } = options;

  if (!orders || orders.length === 0) {
    return 0;
  }

  const ordersToCalculate = includePending
    ? orders // Jika includePending true, hitung semua
    : orders.filter(order => order.status === 'LUNAS'); // Jika false, hitung yang lunas saja

  return ordersToCalculate.reduce((sum, order) => sum + (order.total || 0), 0);