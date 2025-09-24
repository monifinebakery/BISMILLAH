/**
 * Memformat angka menjadi mata uang Rupiah (misal: 15000 -> "Rp 15.000").
 * @deprecated Gunakan useCurrency hook dari CurrencyContext untuk formatting yang responsive terhadap pilihan mata uang user.
 * @param value Angka yang akan diformat.
 * @returns String dalam format mata uang Rupiah.
 */
export const formatCurrency = (value: number | null | undefined): string => {
  if (typeof value !== 'number' || isNaN(value)) {
    return 'Rp 0'; // Menangani input yang tidak valid
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Memformat angka besar menjadi string ringkas (misal: "100 rb", "1,2 jt", "5 M") dengan awalan "Rp".
 * Berguna untuk label grafik atau tampilan ringkas.
 * @param num Angka yang akan diformat.
 * @param digits Jumlah desimal untuk angka ringkas. Defaultnya 1.
 * @returns String yang diformat (misal: "Rp 100 rb", "Rp 1,2 jt").
 */
export const formatLargeNumber = (num: number | null | undefined, digits: number = 1): string => {
  if (typeof num !== 'number' || isNaN(num)) {
    return 'Rp 0'; // Menangani input yang tidak valid
  }

  const si = [
    { value: 1, symbol: "" },
    { value: 1E3, symbol: " rb" }, // Ribu
    { value: 1E6, symbol: " jt" }, // Juta
    { value: 1E9, symbol: " miliar" },  // Miliar
    { value: 1E12, symbol: " triliun" }  // Triliun
  ];
  const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
  let i;
  for (i = si.length - 1; i > 0; i--) {
    if (num >= si[i].value) {
      break;
    }
  }

  // Untuk angka di bawah 1000, gunakan format biasa
  if (i === 0) {
      return formatCurrency(num);
  }

  const abbreviatedNum = (num / si[i].value).toFixed(digits).replace(rx, "$1");

  return `Rp ${abbreviatedNum}${si[i].symbol}`;
};

/**
 * ✨ FUNGSI BARU DITAMBAHKAN DI SINI
 * Memformat angka menjadi persentase (misal: 0.25 -> "25,0%")
 * @param value - Angka desimal (rasio) yang akan diformat.
 * @returns String persentase yang sudah diformat.
 */
export const formatPercentage = (value: number | null | undefined): string => {
  if (typeof value !== 'number' || isNaN(value)) {
    return '0,0%'; // Nilai default jika input tidak valid
  }

  return new Intl.NumberFormat('id-ID', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
};