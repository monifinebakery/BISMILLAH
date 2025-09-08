# Follow Up Pesanan Berdasarkan Status

Fitur ini memungkinkan Anda mengirim pesan follow up WhatsApp sesuai status pesanan dengan template yang disesuaikan otomatis. Template pesan dikelola melalui `FollowUpTemplateContext` dan diproses dengan data pesanan real-time.

## ✅ Fitur Status-Aware Template

- 🎯 **Auto Status Detection**: Template otomatis dipilih berdasarkan status pesanan saat ini
- 📝 **Template Editor**: Editor visual dengan preview real-time untuk setiap status
- 📁 **Variable Support**: Dukungan penuh untuk semua variabel pesanan (nama, nomor, items, dll)
- 📱 **Mobile Responsive**: Interface yang dioptimalkan untuk semua ukuran layar

## Contoh Penggunaan

```tsx
import { useOrderFollowUp } from '@/components/orders/hooks/useOrderFollowUp';

const Example = ({ order }) => {
  const { 
    getWhatsappUrl, 
    getCurrentStatusTemplate,
    hasTemplateForStatus 
  } = useOrderFollowUp();
  
  // Get URL for current status
  const url = getWhatsappUrl(order);
  
  // Get URL for specific status
  const urlForConfirmed = getWhatsappUrl(order, 'confirmed');
  
  // Check if template exists for status
  const hasTemplate = hasTemplateForStatus(order.status);

  return (
    <div>
      <button 
        disabled={!url || !hasTemplate} 
        onClick={() => window.open(url!, '_blank')}
      >
        Kirim Template {order.status}
      </button>
      
      <button 
        disabled={!urlForConfirmed} 
        onClick={() => window.open(urlForConfirmed!, '_blank')}
      >
        Kirim Template Konfirmasi
      </button>
    </div>
  );
};
```

Fungsi `getWhatsappUrl` akan mengembalikan URL WhatsApp yang siap dibuka dengan template yang sesuai status pesanan. Jika template atau nomor telepon tidak tersedia, fungsi akan mengembalikan `null`.

## Status yang Didukung

- `pending` - Pesanan menunggu konfirmasi
- `confirmed` - Pesanan telah dikonfirmasi
- `preparing` - Pesanan sedang disiapkan
- `ready` - Pesanan siap diambil/dikirim
- `delivered` - Pesanan telah diterima
- `completed` - Pesanan selesai
- `cancelled` - Pesanan dibatalkan
- `shipping` (legacy) - Untuk kompatibilitas sistem lama

Setiap status memiliki template default yang dapat disesuaikan melalui **Template Manager** yang otomatis memfilter berdasarkan status pesanan.

## 🎆 Fitur Baru Template Manager

### 🎯 Status-Aware Interface
- Template manager sekarang **otomatis menampilkan status pesanan saat ini** dengan highlight khusus
- Tab aktif otomatis disesuaikan dengan status pesanan yang dipilih
- Visual indicator untuk membedakan status aktif dengan status lain

### 📱 Mobile-First Design
- Grid layout yang responsif untuk semua ukuran layar iPad dan mobile
- Collapsible variabel reference untuk menghemat ruang
- Tombol aksi yang mudah diakses di perangkat mobile

### ⚡ Quick Send
- Tombol "Quick Send" untuk langsung mengirim template sesuai status aktif
- Preview real-time dengan data pesanan yang sebenarnya
- Konfirmasi visual sebelum mengirim pesan WhatsApp

## Tutorial Template Manager

1. **Akses Template Manager**
   - Buka halaman pesanan dan klik tombol **Template WhatsApp**
   - Template manager akan otomatis membuka tab sesuai status pesanan yang dipilih

2. **Edit Template**
   - Status pesanan saat ini akan ditandai dengan badge "Status Saat Ini"
   - Edit template di editor atau gunakan mode Preview untuk melihat hasil
   - Template secara otomatis memproses variabel dengan data pesanan real

3. **Gunakan Variabel**
   - Klik pada bagian "Variabel Template" untuk melihat daftar variabel tersedia
   - Klik variabel untuk menyalin ke clipboard
   - Variabel akan otomatis diisi dengan data pesanan saat template dikirim

4. **Quick Send**
   - Gunakan tombol "Kirim Template Aktif" untuk langsung mengirim template status saat ini
   - Atau pilih tab status lain dan klik "Kirim WhatsApp" untuk template status tertentu

## Variabel Template

Template mendukung variabel berikut yang akan otomatis diisi:

- `{{namaPelanggan}}` - Nama pelanggan
- `{{nomorPesanan}}` - Nomor pesanan
- `{{teleponPelanggan}}` - Telepon pelanggan
- `{{tanggal}}` - Tanggal pesanan (format Indonesia)
- `{{totalPesanan}}` - Total pesanan (format Rupiah)
- `{{items}}` - Daftar item pesanan (format sederhana)
- `{{itemsDetail}}` - Daftar item dengan detail harga
- `{{alamatPengiriman}}` - Alamat pengiriman
- `{{catatan}}` - Catatan pesanan
- `{{subtotal}}` - Subtotal pesanan
- `{{pajak}}` - Pajak pesanan
- `{{jumlahItems}}` - Total jumlah jenis item
- `{{totalQuantity}}` - Total kuantitas semua item
