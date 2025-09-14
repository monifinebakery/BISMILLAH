# Panduan Konsistensi Penulisan Data dengan `snake_case`

Dokumen ini menetapkan standar penulisan nama field, kolom, dan kunci data di seluruh proyek agar menggunakan format `snake_case`.

## Aturan Penamaan
1. Seluruh huruf ditulis **kecil**.
2. Setiap kata dipisahkan oleh karakter underscore (`_`).
3. Tidak menggunakan spasi, huruf kapital, atau tanda hubung (`-`).
4. Berlaku untuk schema database, response API, dan struktur data lainnya.

## Contoh
| Benar (`snake_case`) | Salah |
|----------------------|-------|
| `total_nilai`        | `totalNilai`, `TotalNilai`, `total-nilai` |
| `tanggal_lahir`      | `tanggalLahir`, `TanggalLahir` |
| `harga_satuan`       | `hargaSatuan`, `harga-satuan` |

## Alasan Penggunaan
- **Konsistensi** antara backend dan frontend.
- **Kemudahan** integrasi dengan database PostgreSQL yang umumnya memakai `snake_case`.
- **Keterbacaan** yang lebih baik bagi seluruh anggota tim.

Dengan mengikuti panduan ini, seluruh data dalam proyek akan lebih mudah dipelihara, diintegrasikan, dan dihindari dari kesalahan penulisan.
