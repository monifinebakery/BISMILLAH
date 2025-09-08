# Tutorial Lengkap Penggunaan Aplikasi Manajemen Bisnis

## Daftar Isi
1. [Pengenalan Aplikasi](#pengenalan-aplikasi)
2. [Persiapan dan Setup](#persiapan-dan-setup)
3. [Login dan Autentikasi](#login-dan-autentikasi)
4. [Dashboard Utama](#dashboard-utama)
5. [Manajemen Keuangan](#manajemen-keuangan)
6. [Manajemen Gudang](#manajemen-gudang)
7. [Sistem Resep](#sistem-resep)
8. [Manajemen Supplier](#manajemen-supplier)
9. [Manajemen Pembelian](#manajemen-pembelian)
10. [Manajemen Pesanan](#manajemen-pesanan)
11. [Biaya Operasional](#biaya-operasional)
12. [Analisis Keuntungan](#analisis-keuntungan)
13. [Invoice dan Faktur](#invoice-dan-faktur)
14. [Pengaturan Aplikasi](#pengaturan-aplikasi)
15. [Tips dan Troubleshooting](#tips-dan-troubleshooting)

## Pengenalan Aplikasi

### Apa itu Aplikasi Manajemen Bisnis ini?
Aplikasi ini adalah sistem manajemen bisnis terintegrasi yang dirancang untuk membantu usaha kecil dan menengah mengelola:
- Keuangan dan transaksi
- Inventory/stok gudang
- Resep dan kalkulasi HPP (Harga Pokok Penjualan)
- Supplier dan pembelian
- Pesanan pelanggan
- Analisis keuntungan
- Biaya operasional

### Teknologi yang Digunakan
- Frontend: React dengan TypeScript
- Database: Supabase (PostgreSQL)
- UI: shadcn/ui dengan Tailwind CSS
- Real-time: Sinkronisasi data otomatis
- Mobile-friendly: Responsif untuk semua perangkat

## Persiapan dan Setup

### Persyaratan Sistem
- Browser modern (Chrome, Firefox, Safari, Edge)
- Koneksi internet yang stabil
- Akun email yang valid

### Mengakses Aplikasi
1. Buka browser Anda
2. Akses aplikasi melalui URL yang diberikan
3. Pastikan JavaScript diaktifkan di browser

### Instalasi untuk Pengembangan (Opsional)
Jika Anda ingin menjalankan aplikasi secara lokal:

```bash
# Clone repository
git clone [repository-url]

# Masuk ke folder proyek
cd BISMILLAH

# Install dependencies
pnpm install

# Jalankan aplikasi development
pnpm dev
```

Aplikasi akan berjalan di `http://localhost:5174`

## Login dan Autentikasi

### Membuat Akun Baru
1. Buka halaman aplikasi
2. Klik "Daftar" atau "Sign Up"
3. Masukkan email dan password yang kuat
4. Verifikasi email Anda melalui link yang dikirim
5. Login dengan kredensial yang telah dibuat

### Login ke Aplikasi
1. Masukkan email dan password
2. Klik "Masuk" atau "Login"
3. Sistem akan memverifikasi kredensial
4. Jika berhasil, Anda akan diarahkan ke dashboard

### Lupa Password
1. Klik "Lupa Password" di halaman login
2. Masukkan email terdaftar
3. Cek email untuk link reset password
4. Ikuti instruksi untuk membuat password baru

## Dashboard Utama

### Tampilan Overview
Dashboard menampilkan ringkasan bisnis Anda:

#### Panel Keuangan
- Total Pendapatan
- Total Pengeluaran
- Keuntungan Bersih
- Grafik trend keuangan

#### Panel Inventory
- Total item di gudang
- Item dengan stok menipis
- Nilai total inventory
- Item yang perlu restok

#### Panel Pesanan
- Pesanan hari ini
- Pesanan pending
- Pesanan selesai
- Total nilai pesanan

#### Panel Analisis
- Margin keuntungan
- Product terlaris
- Performa bulanan
- Target vs realisasi

### Navigasi Menu
Menu utama terdiri dari:

**Keuangan**
- Transaksi harian
- Laporan keuangan
- Arus kas

**Gudang**
- Daftar bahan baku
- Stok management
- Alert stok minimum

**Resep**
- Database resep
- Kalkulasi HPP
- Cost analysis

**Supplier**
- Daftar supplier
- Kontak dan info
- Riwayat pembelian

**Pembelian**
- Purchase order
- Receiving goods
- Payment tracking

**Pesanan**
- Order management
- Customer info
- Delivery tracking

**Operasional**
- Fixed costs
- Variable costs
- Overhead expenses

**Analisis**
- Profit analysis
- Performance metrics
- Business insights

## Manajemen Keuangan

### Mencatat Transaksi Masuk
1. Pilih menu "Keuangan" → "Transaksi"
2. Klik "Tambah Transaksi Masuk"
3. Isi informasi:
   - Tanggal transaksi
   - Jumlah uang
   - Kategori (penjualan, investasi, dll)
   - Keterangan/deskripsi
   - Metode pembayaran
4. Klik "Simpan"

### Mencatat Transaksi Keluar
1. Pilih menu "Keuangan" → "Transaksi"
2. Klik "Tambah Transaksi Keluar"
3. Isi informasi:
   - Tanggal transaksi
   - Jumlah uang
   - Kategori (pembelian, gaji, utilitas, dll)
   - Keterangan/deskripsi
   - Metode pembayaran
4. Klik "Simpan"

### Melihat Laporan Keuangan
1. Masuk ke menu "Keuangan" → "Laporan"
2. Pilih periode laporan:
   - Harian
   - Mingguan
   - Bulanan
   - Custom range
3. Lihat summary:
   - Total pemasukan
   - Total pengeluaran
   - Keuntungan bersih
   - Breakdown per kategori

### Export Data Keuangan
1. Di halaman laporan keuangan
2. Klik "Export"
3. Pilih format (Excel, PDF, CSV)
4. File akan diunduh otomatis

### Mengatur Kategori Keuangan
1. Masuk ke "Keuangan" → "Pengaturan"
2. Kelola kategori pemasukan:
   - Tambah kategori baru
   - Edit kategori existing
   - Hapus kategori tidak terpakai
3. Kelola kategori pengeluaran sama seperti di atas

## Manajemen Gudang

### Menambah Bahan Baku Baru
1. Pilih menu "Gudang" → "Bahan Baku"
2. Klik "Tambah Bahan Baku"
3. Isi informasi:
   - Nama bahan
   - Satuan (kg, liter, pcs, dll)
   - Harga per satuan
   - Stok minimum
   - Kategori bahan
   - Keterangan
4. Klik "Simpan"

### Update Stok Bahan Baku
1. Cari bahan baku di daftar
2. Klik "Edit" atau icon pensil
3. Update informasi:
   - Jumlah stok saat ini
   - Harga terbaru
   - Tanggal update
4. Sistem akan mencatat riwayat perubahan stok

### Monitor Stok Minimum
1. Dashboard akan menampilkan alert untuk stok menipis
2. Masuk ke "Gudang" → "Alert Stok"
3. Lihat daftar item yang perlu direstok
4. Klik "Buat Purchase Order" untuk pembelian otomatis

### Audit Stok
1. Pilih "Gudang" → "Audit Stok"
2. Lakukan stock opname fisik
3. Input jumlah stok aktual
4. Sistem akan menghitung selisih
5. Adjust stok sesuai hasil fisik

### Riwayat Pergerakan Stok
1. Masuk ke "Gudang" → "Riwayat"
2. Filter berdasarkan:
   - Periode waktu
   - Jenis bahan
   - Tipe transaksi (masuk/keluar)
3. Lihat detail setiap pergerakan stok

## Sistem Resep

### Membuat Resep Baru
1. Pilih menu "Resep" → "Database Resep"
2. Klik "Tambah Resep"
3. Isi informasi dasar:
   - Nama resep/produk
   - Kategori produk
   - Porsi/yield yang dihasilkan
   - Waktu pembuatan
   - Tingkat kesulitan
4. Tambah bahan-bahan:
   - Pilih bahan dari database
   - Tentukan jumlah yang dibutuhkan
   - Sistem akan auto-calculate cost
5. Klik "Simpan Resep"

### Kalkulasi HPP (Harga Pokok Penjualan)
1. Buka resep yang sudah dibuat
2. Klik "Hitung HPP"
3. Sistem akan menghitung:
   - Total cost bahan baku
   - Cost per porsi
   - Suggested selling price
   - Margin keuntungan
4. Adjust margin sesuai target bisnis

### Scaling Resep
1. Buka resep yang ingin di-scale
2. Klik "Scale Recipe"
3. Tentukan:
   - Jumlah porsi yang diinginkan
   - Atau total produksi
4. Sistem akan auto-adjust:
   - Jumlah setiap bahan
   - Total cost production
   - Kebutuhan inventory

### Copy dan Modifikasi Resep
1. Pilih resep yang ingin dicopy
2. Klik "Duplicate Recipe"
3. Beri nama baru
4. Modifikasi bahan atau jumlah
5. Save as new recipe

### Print Resep untuk Produksi
1. Buka resep yang ingin diprint
2. Klik "Print Recipe Card"
3. Pilih format:
   - Recipe card untuk chef
   - Production sheet untuk staff
   - Cost breakdown untuk management

## Manajemen Supplier

### Menambah Supplier Baru
1. Pilih menu "Supplier" → "Database Supplier"
2. Klik "Tambah Supplier"
3. Isi informasi lengkap:
   - Nama perusahaan/supplier
   - Nama contact person
   - Alamat lengkap
   - Nomor telepon
   - Email
   - Website (opsional)
   - Kategori supplier
   - Rating supplier
   - Payment terms
   - Notes khusus
4. Klik "Simpan"

### Mengatur Katalog Supplier
1. Masuk ke detail supplier
2. Klik tab "Katalog Produk"
3. Tambah produk yang disupply:
   - Nama produk
   - Kode produk supplier
   - Harga per unit
   - Minimum order quantity
   - Lead time
   - Availability status
4. Update catalog secara berkala

### Evaluasi Performa Supplier
1. Masuk ke "Supplier" → "Performance Review"
2. Lihat metrics:
   - On-time delivery rate
   - Quality score
   - Price competitiveness
   - Response time
   - Payment terms compliance
3. Beri rating dan feedback

### Membandingkan Harga Supplier
1. Pilih bahan baku tertentu
2. Klik "Compare Suppliers"
3. Lihat perbandingan:
   - Harga per unit
   - Minimum order
   - Delivery time
   - Quality rating
4. Pilih supplier terbaik untuk setiap item

## Manajemen Pembelian

### Membuat Purchase Order (PO)
1. Pilih menu "Pembelian" → "Purchase Order"
2. Klik "Buat PO Baru"
3. Pilih supplier
4. Tambah items:
   - Pilih bahan dari katalog supplier
   - Tentukan quantity
   - Harga akan auto-populate
   - Adjust jika ada nego harga
5. Review total amount
6. Set expected delivery date
7. Klik "Submit PO"

### Tracking Purchase Order
1. Masuk ke "Pembelian" → "PO Tracking"
2. Lihat status setiap PO:
   - Draft (belum dikirim)
   - Sent (sudah dikirim ke supplier)
   - Confirmed (dikonfirmasi supplier)
   - Delivered (sudah diterima)
   - Completed (sudah dibayar)
3. Update status manual jika diperlukan

### Receiving Goods
1. Ketika barang datang, buka PO terkait
2. Klik "Receive Goods"
3. Checklist items yang diterima:
   - Verify quantity
   - Check quality
   - Note any discrepancies
4. Items yang diterima akan auto-update ke inventory
5. Generate delivery receipt

### Payment Management
1. Setelah goods received, buat payment
2. Pilih PO yang akan dibayar
3. Isi payment details:
   - Payment date
   - Payment method
   - Reference number
   - Amount paid
4. Upload bukti pembayaran jika ada
5. Status PO akan update ke "Paid"

### Vendor Management
1. Track performa setiap supplier
2. Lihat history pembelian
3. Analyze spending per vendor
4. Negotiate better terms berdasarkan volume

## Manajemen Pesanan

### Menerima Pesanan Baru
1. Pilih menu "Pesanan" → "Order Management"
2. Klik "Pesanan Baru"
3. Isi data customer:
   - Nama customer
   - Kontak (phone/email)
   - Alamat delivery
4. Tambah items pesanan:
   - Pilih produk dari menu
   - Tentukan quantity
   - Harga akan auto-populate
   - Add notes khusus
5. Set delivery date & time
6. Klik "Confirm Order"

### Processing Order
1. Order baru akan masuk ke queue
2. Check ketersediaan bahan baku
3. Jika insufficient, sistem akan alert
4. Update status order:
   - Confirmed (order dikonfirmasi)
   - In Production (sedang diproduksi)
   - Ready for Delivery (siap kirim)
   - Delivered (sudah dikirim)
   - Completed (selesai & dibayar)

### Delivery Management
1. Order yang ready for delivery masuk ke delivery queue
2. Assign delivery person/method
3. Generate delivery note
4. Track delivery status
5. Confirm delivery completion
6. Collect payment (jika COD)

### Customer Database
1. Semua customer otomatis tersimpan
2. Track customer history:
   - Total orders
   - Total spending
   - Favorite products
   - Payment behavior
3. Segment customers untuk marketing

### Order Reports
1. Lihat laporan penjualan:
   - Daily sales summary
   - Product performance
   - Customer analysis
   - Delivery performance
2. Export untuk analisis lebih lanjut

## Biaya Operasional

### Kategori Biaya Operasional
Aplikasi mengelompokkan biaya menjadi:

**Fixed Costs (Biaya Tetap)**
- Sewa tempat
- Gaji karyawan tetap
- Asuransi
- Listrik dasar
- Internet
- Lisensi software

**Variable Costs (Biaya Variabel)**
- Bahan baku
- Packaging
- Delivery costs
- Commission sales
- Overtime pay

**Overhead Costs**
- Marketing
- Office supplies
- Maintenance
- Professional services
- Training

### Menambah Biaya Operasional
1. Pilih menu "Operasional" → "Biaya"
2. Klik "Tambah Biaya"
3. Isi detail:
   - Nama biaya
   - Kategori biaya
   - Frekuensi (harian, mingguan, bulanan, yearly)
   - Jumlah biaya
   - Tanggal mulai
   - Status (active/inactive)
4. Klik "Simpan"

### Recurring Expenses
1. Untuk biaya yang berulang (sewa, gaji, dll)
2. Set sebagai "Recurring"
3. Sistem akan otomatis generate biaya setiap periode
4. Review dan approve recurring expenses

### Budget Planning
1. Masuk ke "Operasional" → "Budget"
2. Set budget per kategori biaya
3. Set budget period (monthly/quarterly/yearly)
4. Monitor actual vs budget
5. Get alerts jika over budget

### Cost Allocation
1. Alokasi biaya ke produk/project
2. Hitung cost per unit product
3. Analyze cost structure
4. Optimize cost efficiency

## Analisis Keuntungan

### Dashboard Profit Analysis
1. Pilih menu "Analisis" → "Profit Analysis"
2. Lihat overview:
   - Gross profit margin
   - Net profit margin
   - Operating profit
   - ROI (Return on Investment)

### Product Profitability
1. Analyze profit per produk:
   - Revenue per product
   - Cost of goods sold
   - Gross margin per product
   - Units sold vs profit
2. Identifikasi produk paling menguntungkan
3. Review produk dengan margin rendah

### Time-based Analysis
1. Analisis keuntungan berdasarkan waktu:
   - Daily profit trends
   - Monthly comparison
   - Seasonal patterns
   - Year-over-year growth
2. Identifikasi peak periods
3. Plan strategies untuk low periods

### Cost-Benefit Analysis
1. Evaluate new investments:
   - Equipment purchase
   - Marketing campaigns
   - New product development
   - Staff hiring
2. Calculate payback period
3. Assess risk vs return

### Competitive Analysis
1. Benchmark dengan kompetitor
2. Analyze market positioning
3. Price optimization recommendations
4. Market share analysis

### Financial Ratios
Monitor key financial ratios:
- Current ratio
- Quick ratio
- Debt-to-equity ratio
- Asset turnover
- Inventory turnover
- Receivables turnover

## Invoice dan Faktur

### Membuat Invoice
1. Pilih menu "Invoice" → "Create Invoice"
2. Pilih customer dari database
3. Tambah items:
   - Pilih dari order existing atau manual entry
   - Set quantities dan prices
   - Apply discounts jika ada
4. Set payment terms:
   - Due date
   - Payment methods accepted
   - Late fees policy
5. Generate dan send invoice

### Invoice Templates
1. Customize invoice design:
   - Company logo dan info
   - Color scheme
   - Layout preferences
   - Required fields
2. Save template untuk konsistensi
3. Create different templates untuk different purposes

### Payment Tracking
1. Monitor payment status:
   - Paid
   - Pending
   - Overdue
   - Partially paid
2. Send payment reminders otomatis
3. Apply late fees untuk overdue invoices
4. Generate aging reports

### Tax Management
1. Setup tax rates:
   - PPN rate
   - Other applicable taxes
   - Tax-exempt items
2. Generate tax reports untuk compliance
3. Export untuk tax filing

### Receipt Management
1. Generate receipts untuk payments received
2. Email receipts ke customers
3. Track receipt numbers
4. Archive untuk record keeping

## Pengaturan Aplikasi

### User Profile Settings
1. Masuk ke "Settings" → "Profile"
2. Update informasi personal:
   - Nama lengkap
   - Email
   - Phone number
   - Profile picture
3. Change password
4. Set notification preferences

### Company Settings
1. Setup company information:
   - Company name dan logo
   - Address dan contact info
   - Tax ID number
   - Business registration
2. Set business hours
3. Configure default settings

### System Preferences
1. Set default currency
2. Configure date formats
3. Set timezone
4. Language preferences (jika tersedia multi-language)

### User Management (untuk multi-user)
1. Add team members
2. Set user roles dan permissions:
   - Admin (full access)
   - Manager (limited admin access)
   - Staff (operational access)
   - Viewer (read-only access)
3. Manage user status

### Backup & Data Export
1. Regular automated backups
2. Manual backup creation
3. Export data dalam berbagai format
4. Import data dari sistem lain

### Integration Settings
1. Connect dengan payment gateways
2. Setup accounting software integration
3. Configure email settings
4. API configurations untuk third-party tools

## Tips dan Troubleshooting

### Tips Penggunaan Optimal

**Data Entry Best Practices:**
1. Input data secara konsisten dan real-time
2. Gunakan naming convention yang jelas
3. Backup data secara regular
4. Review dan reconcile data secara berkala

**Performance Optimization:**
1. Tutup tabs yang tidak digunakan
2. Clear browser cache secara berkala
3. Use stable internet connection
4. Update browser ke versi terbaru

**Security Best Practices:**
1. Gunakan password yang kuat
2. Logout setelah selesai menggunakan
3. Jangan share login credentials
4. Monitor user activity regularly

### Troubleshooting Common Issues

**Login Issues:**
- Pastikan email dan password benar
- Check caps lock status
- Clear browser cookies dan cache
- Try incognito/private browsing mode
- Reset password jika perlu

**Data Sync Issues:**
- Check internet connection
- Refresh halaman (F5)
- Logout dan login kembali
- Clear browser cache
- Contact support jika masih bermasalah

**Performance Issues:**
- Close unnecessary browser tabs
- Disable browser extensions temporarily
- Try different browser
- Check internet speed
- Restart browser/computer

**Calculation Errors:**
- Verify input data accuracy
- Check decimal settings
- Review formula configurations
- Recalculate manually untuk verification
- Report bug jika calculation tetap wrong

**Export/Print Issues:**
- Check browser popup settings
- Ensure printer is connected
- Try different file format
- Use different browser
- Check file permissions

### Getting Help

**Built-in Help:**
1. Klik "?" icon di setiap halaman
2. Hover over field labels untuk tooltips
3. Check help documentation dalam app

**Contact Support:**
- Email support team
- Use in-app chat feature
- Submit bug reports
- Request new features

**Community Resources:**
- User forums
- Video tutorials
- Best practices guides
- Template downloads

### System Requirements

**Minimum Requirements:**
- Modern browser (Chrome 90+, Firefox 85+, Safari 14+, Edge 90+)
- 2GB RAM
- Stable internet connection (1Mbps minimum)
- Screen resolution 1024x768 atau lebih besar

**Recommended:**
- Latest browser versions
- 4GB+ RAM
- High-speed internet (5Mbps+)
- Screen resolution 1920x1080
- SSD storage untuk better performance

### Regular Maintenance Tasks

**Daily:**
- Input daily transactions
- Check inventory levels
- Review pending orders
- Monitor cash flow

**Weekly:**
- Reconcile bank accounts
- Review weekly reports
- Update supplier information
- Check system backups

**Monthly:**
- Generate monthly reports
- Review profit analysis
- Update budgets
- Audit user permissions
- Clean up old data

**Quarterly:**
- Comprehensive business review
- Update system settings
- Review and optimize workflows
- Plan for next quarter

### Advanced Features

**API Integration:**
- Connect ke accounting software
- Integrate dengan e-commerce platforms
- Sync dengan payment gateways
- Connect ke shipping providers

**Automation Rules:**
- Auto-reorder untuk low stock items
- Automated invoice generation
- Scheduled report delivery
- Alert notifications setup

**Custom Reports:**
- Build custom report templates
- Set automated report schedules
- Create dashboards untuk specific needs
- Export data untuk advanced analysis

**Mobile App Features:**
- Responsive web app works di mobile
- Touch-friendly interface
- Offline capability untuk basic functions
- Mobile-optimized workflows

---

## Kesimpulan

Aplikasi manajemen bisnis ini dirancang untuk memberikan solusi lengkap untuk kebutuhan operasional bisnis Anda. Dengan mengikuti tutorial ini step by step, Anda akan dapat:

1. Mengelola keuangan dengan akurat
2. Mengoptimalkan inventory management
3. Mengkalkulasi HPP dengan presisi
4. Mengelola supplier relationships
5. Streamline purchase processes
6. Efficient order management
7. Control operational costs
8. Analyze business profitability

Ingatlah untuk selalu:
- Input data secara konsisten
- Review laporan secara berkala
- Backup data regularly
- Update sistem knowledge Anda
- Utilize support resources ketika needed

Untuk pertanyaan lebih lanjut atau dukungan teknis, jangan ragu untuk menghubungi tim support kami.

**Semoga aplikasi ini membantu mengembangkan bisnis Anda dengan lebih efisien dan profitable!**
