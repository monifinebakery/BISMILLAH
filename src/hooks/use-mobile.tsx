// src/hooks/use-mobile.ts

import { useState, useEffect } from 'react';
import { safeDom } from '@/utils/browserApiSafeWrappers';


/**
 * Custom hook untuk mendeteksi apakah layar saat ini dianggap sebagai mobile.
 * @param {number} [maxWidth=768] - Lebar maksimal dalam piksel untuk dianggap mobile. Defaultnya adalah 768px (ukuran tablet potret).
 * @returns {boolean} - Mengembalikan `true` jika lebar layar kurang dari atau sama dengan maxWidth, `false` jika lebih besar.
 */
export const useIsMobile = (maxWidth: number = 768): boolean => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Fungsi untuk memeriksa ukuran layar
    const handleResize = () => {
      setIsMobile(window.innerWidth <= maxWidth);
    };

    // Panggil fungsi sekali saat komponen pertama kali dimuat
    handleResize();

    // Tambahkan event listener untuk memantau perubahan ukuran jendela
    safeDom.addEventListener(safeDom, window, 'resize', handleResize);

    // Fungsi cleanup untuk menghapus event listener saat komponen tidak lagi digunakan
    // Ini penting untuk mencegah memory leak
    return () => {
      safeDom.removeEventListener(safeDom, window, 'resize', handleResize);
    };
  }, [maxWidth]); // Efek ini akan dijalankan ulang jika nilai maxWidth berubah

  return isMobile;
};