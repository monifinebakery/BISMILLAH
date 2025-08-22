# Follow Up Pesanan Berdasarkan Status

Fitur ini memungkinkan Anda mengirim pesan follow up WhatsApp sesuai status pesanan. 
Template pesan dikelola melalui `FollowUpTemplateContext` dan diproses otomatis.

## Contoh Penggunaan

```tsx
import { useOrderFollowUp } from '@/components/orders/hooks/useOrderFollowUp';

const Example = ({ order }) => {
  const { getWhatsappUrl } = useOrderFollowUp();
  const url = getWhatsappUrl(order);

  return (
    <button disabled={!url} onClick={() => window.open(url!, '_blank')}>
      Follow Up
    </button>
  );
};
```

Fungsi `getWhatsappUrl` akan mengembalikan URL WhatsApp yang siap dibuka. 
Jika template atau nomor telepon tidak tersedia, fungsi akan mengembalikan `null`.

## Status yang Didukung

- `pending`
- `confirmed`
- `shipping`
- `delivered`
- `cancelled`

Setiap status memiliki template default yang dapat disesuaikan melalui **Template Manager** di halaman pesanan.

## Tutorial Singkat Template Manager

1. Buka halaman pesanan dan klik tombol **Template**.
2. Pilih status pesanan yang ingin diubah kemudian klik ikon pensil.
3. Ubah pesan sesuai kebutuhan dan tekan **Simpan Template**.
4. Gunakan tab **Variabel** untuk melihat daftar variabel yang bisa dimasukkan ke dalam pesan.
