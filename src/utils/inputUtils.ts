// src/utils/inputUtils.ts

/**
 * Helper function to safely get input value for HTML input elements.
 * Handles null, undefined, and ensures Date objects are formatted correctly for inputs.
 * @param value The value from state or prop.
 * @returns A string or number suitable for HTML input `value` prop.
 */
export const getInputValue = <T extends string | number | Date | null | undefined>(value: T): string | number => {
  if (value === null || value === undefined) {
    return '';
  }
  // Jika itu objek Date, konversi ke YYYY-MM-DD
  // PENTING: Untuk input type="date" kita sudah pakai formatDateToYYYYMMDD,
  // jadi path ini mungkin tidak akan terpakai untuk Date objects
  if (value instanceof Date) {
    if (isNaN(value.getTime())) {
      return ''; // Tanggal tidak valid, kembalikan string kosong
    }
    // Karena getInputValue ini bersifat umum, kita bisa langsung kembalikan ISO string
    // atau jika yakin hanya untuk non-date input, bisa hapus branch ini.
    // Namun, untuk keamanan, biarkan saja.
    return value.toISOString().split('T')[0]; // Mengembalikan format yyyy-MM-dd
  }
  // Ini menangani kasus di mana 'value' mungkin objek kosong atau array, atau string/number biasa.
  if (typeof value === 'string' || typeof value === 'number') {
    return value;
  }
  return ''; // Fallback untuk tipe yang tidak diharapkan
};