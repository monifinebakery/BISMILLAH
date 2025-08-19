# Warehouse Import Tutorial

Panduan singkat untuk melakukan import stok bahan baku menggunakan *ImportExportDialog*.

## Langkah penggunaan
1. Buka dialog import dengan komponen `ImportExportDialog`.
2. Pilih file CSV atau Excel yang sesuai dengan template.
3. Tinjau data pada tampilan preview dan pastikan tidak ada error.
4. Klik tombol **Import** untuk menyimpan data ke sistem.

## Contoh impor hook
```ts
import { useImportExport } from '@/components/warehouse/hooks';
```
