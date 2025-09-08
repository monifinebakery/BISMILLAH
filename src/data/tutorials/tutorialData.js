export const tutorialData = [
  {
    id: 1,
    title: "Selamat Datang di Sistem HPP",
    subtitle: "Panduan Lengkap Memulai Perhitungan HPP untuk UMKM",
    duration: "8 menit",
    icon: "👋",
    sections: [
      {
        id: "hpp-basics",
        title: "Apa itu HPP (Harga Pokok Penjualan)?",
        content: `
          <div class="tutorial-content">
            <h3>🏭 HPP itu Apa Sih?</h3>
            <p>HPP atau Harga Pokok Penjualan adalah <strong>total biaya yang diperlukan untuk membuat 1 produk</strong> yang siap dijual.</p>
            
            <div class="example-box">
              <h4>💡 Contoh Sederhana:</h4>
              <p>Misalnya Anda jualan bakso:</p>
              <ul>
                <li>Daging sapi: Rp 15.000</li>
                <li>Tepung tapioka: Rp 2.000</li>
                <li>Bumbu-bumbu: Rp 3.000</li>
                <li>Gas untuk masak: Rp 5.000</li>
                <li>Gaji tukang masak: Rp 10.000</li>
              </ul>
              <p><strong>Total HPP = Rp 35.000 untuk 10 porsi bakso</strong></p>
              <p><strong>HPP per porsi = Rp 3.500</strong></p>
            </div>

            <h4>🎯 Kenapa HPP Penting?</h4>
            <ul>
              <li><strong>Menentukan harga jual yang tepat:</strong> Jika HPP Rp 3.500, jual minimal Rp 5.000 untuk dapat untung</li>
              <li><strong>Tahu mana yang untung/rugi:</strong> Kalau jual Rp 3.000, pasti rugi!</li>
              <li><strong>Bisa bandingkan dengan kompetitor:</strong> Apakah harga kita masih masuk akal?</li>
              <li><strong>Rencana bisnis yang tepat:</strong> Berapa modal yang dibutuhkan untuk produksi</li>
            </ul>
          </div>
        `
      },
      {
        id: "wac-explanation",
        title: "Memahami WAC (Weighted Average Cost)",
        content: `
          <div class="tutorial-content">
            <h3>⚖️ WAC itu Apa?</h3>
            <p>WAC atau Weighted Average Cost adalah cara menghitung <strong>harga rata-rata bahan baku yang kita beli dalam waktu berbeda dengan harga berbeda</strong>.</p>
            
            <div class="example-box">
              <h4>💡 Contoh WAC:</h4>
              <p>Anda beli gula dalam 3 kali pembelian:</p>
              <ul>
                <li><strong>Pembelian 1:</strong> 10 kg gula @ Rp 12.000/kg = Rp 120.000</li>
                <li><strong>Pembelian 2:</strong> 5 kg gula @ Rp 13.000/kg = Rp 65.000</li>
                <li><strong>Pembelian 3:</strong> 15 kg gula @ Rp 11.500/kg = Rp 172.500</li>
              </ul>
              
              <div class="calculation">
                <h5>📊 Perhitungan WAC:</h5>
                <p><strong>Total Gula:</strong> 10 + 5 + 15 = 30 kg</p>
                <p><strong>Total Biaya:</strong> Rp 120.000 + Rp 65.000 + Rp 172.500 = Rp 357.500</p>
                <p><strong>WAC Gula:</strong> Rp 357.500 ÷ 30 kg = <strong>Rp 11.916/kg</strong></p>
              </div>
            </div>

            <h4>🤔 Kenapa Pakai WAC?</h4>
            <ul>
              <li><strong>Harga bahan baku berubah-ubah:</strong> Harga gula hari ini bisa beda dengan minggu lalu</li>
              <li><strong>Stok tercampur:</strong> Gula yang dibeli minggu lalu dan hari ini tercampur di gudang</li>
              <li><strong>HPP lebih akurat:</strong> Pakai harga rata-rata, bukan harga terakhir beli saja</li>
              <li><strong>Keuntungan lebih stabil:</strong> Tidak naik-turun drastis karena fluktuasi harga</li>
            </ul>

            <div class="tip-box">
              <h4>💡 Tips untuk UMKM:</h4>
              <p>Aplikasi ini akan otomatis menghitung WAC untuk Anda. Yang perlu Anda lakukan hanya:</p>
              <ol>
                <li>Input setiap pembelian bahan baku</li>
                <li>Sistem akan hitung WAC otomatis</li>
                <li>HPP akan dihitung pakai harga WAC yang akurat</li>
              </ol>
            </div>
          </div>
        `
      }
    ]
  },
  {
    id: 2,
    title: "Input Data Bahan Baku",
    subtitle: "Langkah Pertama Menghitung HPP",
    duration: "15 menit",
    icon: "📋",
    sections: [
      {
        id: "material-input",
        title: "Cara Input Bahan Baku Step by Step",
        content: `
          <div class="tutorial-content">
            <h3>🛒 Langkah 1: Input Bahan Baku Melalui Pembelian</h3>
            <p><strong>Penting:</strong> Untuk input bahan baku baru, mulai dari menu <strong>Pembelian</strong>, bukan dari menu Bahan Baku langsung.</p>
            <ol>
              <li>Klik menu <strong>"Pembelian"</strong> di sidebar</li>
              <li>Klik tombol <strong>"+ Tambah Pembelian"</strong></li>
              <li>Jika bahan baku belum ada, sistem akan otomatis buatkan data bahan baku baru</li>
            </ol>

            <h3>📊 Langkah 2: Isi Data Pembelian</h3>
            <div class="form-explanation">
              <h4>📌 Field yang Harus Diisi saat Pembelian:</h4>
              <ul>
                <li><strong>Nama Bahan:</strong> Nama bahan baku (contoh: Gula Pasir, Tepung Terigu)</li>
                <li><strong>Satuan:</strong> Unit pengukuran (kg, gram, liter, pcs)</li>
                <li><strong>Tanggal Pembelian:</strong> Kapan barang dibeli</li>
                <li><strong>Jumlah:</strong> Berapa banyak yang dibeli</li>
                <li><strong>Harga per Satuan:</strong> Harga per unit</li>
                <li><strong>Supplier:</strong> Nama toko/supplier</li>
              </ul>
            </div>

            <div class="example-box">
              <h4>💡 Contoh Input Pembelian:</h4>
              <div class="example-form">
                <p><strong>Nama Bahan:</strong> Gula Pasir</p>
                <p><strong>Satuan:</strong> kg</p>
                <p><strong>Tanggal:</strong> 29 Agustus 2024</p>
                <p><strong>Jumlah:</strong> 25 kg</p>
                <p><strong>Harga per kg:</strong> Rp 12.000</p>
                <p><strong>Total:</strong> Rp 300.000 (otomatis)</p>
                <p><strong>Supplier:</strong> Toko Sembako Jaya</p>
              </div>
            </div>

            <h3>📋 Langkah 3: Data Bahan Baku Otomatis Terbuat</h3>
            <p>Setelah input pembelian, sistem akan otomatis:</p>
            <ol>
              <li>Membuat data bahan baku baru jika belum ada</li>
              <li>Menghitung WAC (Weighted Average Cost) otomatis</li>
              <li>Update stok di gudang</li>
              <li>Siap digunakan untuk membuat resep</li>
            </ol>


            <div class="tip-box">
              <h4>💡 Tips Penting:</h4>
              <ul>
                <li><strong>Catat semua pembelian:</strong> Jangan ada yang terlewat, sekecil apapun</li>
                <li><strong>Input segera setelah beli:</strong> Jangan tunggu sampai lupa</li>
                <li><strong>Simpan nota pembelian:</strong> Buat cross-check data</li>
                <li><strong>Update stok berkala:</strong> Pastikan stok di sistem sesuai fisik</li>
              </ul>
            </div>
          </div>
        `
      }
    ]
  },
  {
    id: 3,
    title: "Input Biaya Operasional",
    subtitle: "Menghitung Biaya Tak Langsung",
    duration: "12 menit",
    icon: "⚡",
    sections: [
      {
        id: "operational-costs",
        title: "Jenis-Jenis Biaya Operasional",
        content: `
          <div class="tutorial-content">
            <h3>⚡ Apa itu Biaya Operasional?</h3>
            <p>Biaya operasional adalah <strong>semua biaya yang diperlukan untuk menjalankan usaha</strong> tapi tidak langsung jadi bagian produk.</p>
            
            <div class="cost-types">
              <h4>📋 Jenis Biaya Operasional:</h4>
              
              <div class="cost-category">
                <h5>🔌 Biaya Utilitas:</h5>
                <ul>
                  <li>Listrik untuk mesin, lampu, AC</li>
                  <li>Air untuk cuci peralatan, masak</li>
                  <li>Gas untuk kompor</li>
                  <li>Internet untuk kasir digital</li>
                </ul>
              </div>

              <div class="cost-category">
                <h5>👥 Biaya Tenaga Kerja:</h5>
                <ul>
                  <li>Gaji karyawan harian/bulanan</li>
                  <li>THR dan bonus</li>
                  <li>BPJS (jika ada)</li>
                  <li>Uang makan karyawan</li>
                </ul>
              </div>

              <div class="cost-category">
                <h5>🏢 Biaya Tempat:</h5>
                <ul>
                  <li>Sewa kios/warung per bulan</li>
                  <li>Retribusi pasar</li>
                  <li>Biaya kebersihan tempat</li>
                  <li>Keamanan (jika ada)</li>
                </ul>
              </div>

              <div class="cost-category">
                <h5>🔧 Biaya Peralatan:</h5>
                <ul>
                  <li>Penyusutan alat masak</li>
                  <li>Service mesin</li>
                  <li>Beli peralatan kecil</li>
                  <li>Ganti kompor gas</li>
                </ul>
              </div>
            </div>

            <h3>📊 Cara Input Biaya Operasional:</h3>
            <ol>
              <li>Masuk ke menu <strong>"Biaya Operasional"</strong></li>
              <li>Klik <strong>"+ Tambah Biaya"</strong></li>
              <li>Pilih kategori biaya</li>
              <li>Isi nama biaya yang spesifik</li>
              <li>Isi jumlah biaya per bulan</li>
              <li>Sistem akan otomatis bagi per hari</li>
            </ol>

            <div class="example-box">
              <h4>💡 Contoh Input Biaya Listrik:</h4>
              <div class="example-form">
                <p><strong>Kategori:</strong> Utilitas</p>
                <p><strong>Nama Biaya:</strong> Listrik Warung</p>
                <p><strong>Biaya per Bulan:</strong> Rp 300.000</p>
                <p><strong>Biaya per Hari:</strong> Rp 10.000 (otomatis)</p>
                <p><strong>Keterangan:</strong> Listrik untuk mesin, lampu, kulkas</p>
              </div>
            </div>

            <div class="calculation-explanation">
              <h4>🧮 Cara Sistem Hitung Biaya per Produk:</h4>
              <p>Sistem akan otomatis bagi biaya operasional berdasarkan:</p>
              <ul>
                <li><strong>Jumlah produk yang dibuat per hari</strong></li>
                <li><strong>Persentase penggunaan untuk produk tertentu</strong></li>
              </ul>
              
              <div class="example">
                <p><strong>Contoh:</strong></p>
                <p>Biaya listrik per hari: Rp 10.000</p>
                <p>Produksi bakso per hari: 100 porsi</p>
                <p><strong>Biaya listrik per porsi bakso: Rp 100</strong></p>
              </div>
            </div>
            
            <h3>🔄 Langkah Selanjutnya - Gunakan Kalkulator Dual Mode:</h3>
            <div class="tip-box bg-blue-50 p-4 rounded-lg border border-blue-200 my-4">
              <h4 class="font-bold text-blue-800 mb-2">💡 Langkah Penting Setelah Input Biaya!</h4>
              <ol class="list-decimal pl-5 text-blue-700 space-y-2">
                <li>Setelah selesai menambahkan semua biaya operasional, klik tab <strong>"Kalkulator Dual Mode"</strong></li>
                <li>Di halaman kalkulator, klik tombol <strong>"Hitung Biaya per PCS"</strong></li>
                <li>Review hasil perhitungan overhead per pcs</li>
                <li>Klik tombol <strong>"Gunakan Angka Ini"</strong> untuk menyimpan hasil perhitungan</li>
                <li>Sekarang nilai overhead sudah tersimpan dan akan digunakan dalam perhitungan HPP produk Anda</li>
              </ol>
              <p class="mt-3 text-blue-600"><strong>Catatan:</strong> Langkah ini sangat penting agar perhitungan HPP lebih akurat dengan memperhitungkan biaya operasional!</p>
            </div>
          </div>
        `
      }
    ]
  },
  {
    id: 4,
    title: "Membuat Resep Produk",
    subtitle: "Menentukan Komposisi dan Takaran",
    duration: "20 menit",
    icon: "👨‍🍳",
    sections: [
      {
        id: "recipe-creation",
        title: "Cara Buat Resep untuk Produk",
        content: `
          <div class="tutorial-content">
            <h3>👨‍🍳 Apa itu Resep Produk?</h3>
            <p>Resep adalah <strong>daftar lengkap bahan dan takaran yang diperlukan untuk membuat 1 batch produk</strong>.</p>

            <h3>📝 Langkah Membuat Resep:</h3>
            <ol>
              <li>Masuk ke menu <strong>"Produk"</strong></li>
              <li>Klik <strong>"+ Tambah Produk"</strong></li>
              <li>Isi informasi dasar produk</li>
              <li>Tambah bahan-bahan ke resep</li>
              <li>Atur takaran masing-masing bahan</li>
            </ol>

            <div class="example-box">
              <h4>💡 Contoh Resep Bakso (untuk 10 porsi):</h4>
              <div class="recipe-table">
                <table>
                  <thead>
                    <tr>
                      <th>Bahan</th>
                      <th>Takaran</th>
                      <th>Harga per Unit</th>
                      <th>Total Biaya</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Daging Sapi Giling</td>
                      <td>1 kg</td>
                      <td>Rp 80.000/kg</td>
                      <td>Rp 80.000</td>
                    </tr>
                    <tr>
                      <td>Tepung Tapioka</td>
                      <td>200 gram</td>
                      <td>Rp 8.000/kg</td>
                      <td>Rp 1.600</td>
                    </tr>
                    <tr>
                      <td>Bawang Putih</td>
                      <td>50 gram</td>
                      <td>Rp 25.000/kg</td>
                      <td>Rp 1.250</td>
                    </tr>
                    <tr>
                      <td>Garam</td>
                      <td>20 gram</td>
                      <td>Rp 5.000/kg</td>
                      <td>Rp 100</td>
                    </tr>
                    <tr>
                      <td>Merica</td>
                      <td>5 gram</td>
                      <td>Rp 60.000/kg</td>
                      <td>Rp 300</td>
                    </tr>
                  </tbody>
                </table>
                <p><strong>Total Biaya Bahan: Rp 83.250</strong></p>
                <p><strong>Biaya Bahan per Porsi: Rp 8.325</strong></p>
              </div>
            </div>

            <h3>⚖️ Menentukan Yield (Hasil Produksi):</h3>
            <p>Yield adalah <strong>berapa banyak produk jadi yang dihasilkan dari 1 resep</strong>.</p>
            
            <div class="yield-explanation">
              <h4>📏 Cara Hitung Yield:</h4>
              <ul>
                <li><strong>Berat total adonan:</strong> Jumlah semua bahan (contoh: 1.275 kg)</li>
                <li><strong>Berat per porsi:</strong> Berapa gram per bakso (contoh: 50 gram)</li>
                <li><strong>Yield teoritis:</strong> 1.275 kg ÷ 50 gram = 25.5 porsi</li>
                <li><strong>Yield praktis:</strong> 25 porsi (ada yang menempel di wajan, dll)</li>
              </ul>
            </div>

            <div class="tip-box">
              <h4>💡 Tips Akurat Resep:</h4>
              <ul>
                <li><strong>Timbang semua bahan:</strong> Jangan kira-kira, pakai timbangan</li>
                <li><strong>Catat yield aktual:</strong> Hitung berapa produk jadi yang benar-benar bisa dijual</li>
                <li><strong>Update berkala:</strong> Sesuaikan resep jika ada perubahan supplier atau kualitas</li>
                <li><strong>Hitung waste:</strong> Masukkan juga bahan yang terbuang dalam proses</li>
              </ul>
            </div>
          </div>
        `
      }
    ]
  },
  {
    id: 5,
    title: "Perhitungan HPP Otomatis",
    subtitle: "Sistem Menghitung HPP untuk Anda",
    duration: "10 menit",
    icon: "🧮",
    sections: [
      {
        id: "hpp-calculation",
        title: "Bagaimana Sistem Menghitung HPP",
        content: `
          <div class="tutorial-content">
            <h3>🧮 Sistem Hitung HPP Otomatis</h3>
            <p>Setelah Anda input semua data, sistem akan <strong>otomatis menghitung HPP</strong> dengan rumus yang tepat.</p>

            <div class="formula-explanation">
              <h4>📐 Rumus HPP yang Digunakan:</h4>
              <div class="formula">
                <strong>HPP = Biaya Bahan Baku + Biaya Tenaga Kerja + Biaya Overhead</strong>
              </div>
              
              <h5>🧩 Komponen HPP:</h5>
              <ul>
                <li><strong>Biaya Bahan Baku:</strong> Harga semua bahan dalam resep (pakai WAC)</li>
                <li><strong>Biaya Tenaga Kerja:</strong> Gaji dibagi jumlah produk per periode</li>
                <li><strong>Biaya Overhead:</strong> Listrik, sewa, dll dibagi jumlah produk</li>
              </ul>
            </div>

            <div class="calculation-example">
              <h4>💡 Contoh Perhitungan HPP Bakso:</h4>
              
              <h5>1️⃣ Biaya Bahan Baku (per 10 porsi):</h5>
              <ul>
                <li>Daging sapi: Rp 80.000</li>
                <li>Tepung tapioka: Rp 1.600</li>
                <li>Bumbu-bumbu: Rp 1.650</li>
                <li><strong>Total Bahan: Rp 83.250</strong></li>
                <li><strong>Per porsi: Rp 8.325</strong></li>
              </ul>

              <h5>2️⃣ Biaya Tenaga Kerja:</h5>
              <ul>
                <li>Gaji koki per hari: Rp 100.000</li>
                <li>Produksi per hari: 100 porsi</li>
                <li><strong>Biaya tenaga kerja per porsi: Rp 1.000</strong></li>
              </ul>

              <h5>3️⃣ Biaya Overhead:</h5>
              <ul>
                <li>Listrik per hari: Rp 10.000</li>
                <li>Gas per hari: Rp 15.000</li>
                <li>Sewa tempat per hari: Rp 20.000</li>
                <li>Total overhead: Rp 45.000</li>
                <li><strong>Overhead per porsi: Rp 450</strong></li>
              </ul>

              <div class="final-calculation">
                <h5>🎯 HPP Total per Porsi:</h5>
                <p>Rp 8.325 + Rp 1.000 + Rp 450 = <strong>Rp 9.775</strong></p>
              </div>
            </div>

            <h3>📊 Melihat Hasil Perhitungan HPP:</h3>
            <ol>
              <li>Masuk ke menu <strong>"Analisis HPP"</strong></li>
              <li>Pilih produk yang ingin dilihat</li>
              <li>Sistem tampilkan breakdown biaya lengkap</li>
              <li>Lihat persentase masing-masing komponen biaya</li>
            </ol>

            <div class="understanding-box">
              <h4>🔍 Memahami Breakdown HPP:</h4>
              <ul>
                <li><strong>Bahan Baku (85%):</strong> Bagian terbesar, normal untuk usaha makanan</li>
                <li><strong>Tenaga Kerja (10%):</strong> Wajar untuk usaha padat karya</li>
                <li><strong>Overhead (5%):</strong> Biaya operasional yang efisien</li>
              </ul>
              <p><em>Persentase ini contoh, bisa berbeda untuk setiap jenis usaha.</em></p>
            </div>

            <div class="tip-box">
              <h4>💡 Tips Menggunakan HPP:</h4>
              <ul>
                <li><strong>Update rutin:</strong> Hitung ulang HPP jika ada perubahan harga bahan</li>
                <li><strong>Bandingkan periode:</strong> Lihat tren HPP dari bulan ke bulan</li>
                <li><strong>Identifikasi cost driver:</strong> Komponen mana yang paling besar pengaruhnya</li>
                <li><strong>Basis penetapan harga:</strong> Jual minimal 30-50% di atas HPP</li>
              </ul>
            </div>
          </div>
        `
      }
    ]
  },
  {
    id: 6,
    title: "Analisis Profit dan Margin",
    subtitle: "Memahami Keuntungan Usaha Anda",
    duration: "15 menit",
    icon: "💰",
    sections: [
      {
        id: "profit-analysis",
        title: "Cara Baca Analisis Profit",
        content: `
          <div class="tutorial-content">
            <h3>💰 Apa itu Analisis Profit?</h3>
            <p>Analisis profit adalah <strong>laporan yang menunjukkan berapa keuntungan yang Anda dapatkan</strong> dari setiap produk dan secara keseluruhan.</p>

            <div class="profit-metrics">
              <h4>📊 Metrik Penting dalam Analisis Profit:</h4>
              
              <div class="metric">
                <h5>💵 Gross Profit (Keuntungan Kotor):</h5>
                <p><strong>Rumus:</strong> Harga Jual - HPP</p>
                <div class="example">
                  <p><strong>Contoh:</strong> Bakso dijual Rp 15.000, HPP Rp 9.775</p>
                  <p><strong>Gross Profit:</strong> Rp 15.000 - Rp 9.775 = <strong>Rp 5.225</strong></p>
                </div>
              </div>

              <div class="metric">
                <h5>📈 Gross Profit Margin:</h5>
                <p><strong>Rumus:</strong> (Gross Profit ÷ Harga Jual) × 100%</p>
                <div class="example">
                  <p><strong>Contoh:</strong> (Rp 5.225 ÷ Rp 15.000) × 100% = <strong>34.8%</strong></p>
                  <p><em>Artinya 34.8% dari harga jual adalah keuntungan kotor</em></p>
                </div>
              </div>

              <div class="metric">
                <h5>💸 Net Profit (Keuntungan Bersih):</h5>
                <p><strong>Rumus:</strong> Gross Profit - Biaya Admin/Marketing</p>
                <div class="example">
                  <p><strong>Contoh:</strong> Gross Profit Rp 5.225 - Biaya admin Rp 500</p>
                  <p><strong>Net Profit:</strong> <strong>Rp 4.725</strong></p>
                </div>
              </div>
            </div>

            <div class="support-resources">
              <h4>🤝 Resources dan Support:</h4>
              
              <div class="help-available">
                <h5>📞 Bantuan Tersedia:</h5>
                <ul>
                  <li><strong>Tutorial video:</strong> Step-by-step visual guide</li>
                  <li><strong>Template Excel:</strong> Backup calculation untuk cross-check</li>
                  <li><strong>Community forum:</strong> Sharing experience dengan UMKM lain</li>
                  <li><strong>Customer support:</strong> Technical help jika ada kendala</li>
                </ul>
              </div>

              <div class="motivation">
                <h5>💪 Motivasi Terakhir:</h5>
                <p><strong>"HPP bukan cuma angka, tapi kompas bisnis Anda."</strong></p>
                <p>Dengan setup yang benar, Anda akan punya <strong>kontrol penuh</strong> atas profitability dan bisa membuat keputusan bisnis yang <strong>data-driven</strong>.</p>
                <p><em>Selamat memulai journey menuju bisnis yang lebih profitable! 🚀</em></p>
              </div>
            </div>

            <h3>📋 Cara Akses Analisis Profit:</h3>
            <ol>
              <li>Masuk ke menu <strong>"Analisis Profit"</strong></li>
              <li>Pilih periode analisis (hari, minggu, bulan)</li>
              <li>Pilih produk yang ingin dianalisis</li>
              <li>Sistem tampilkan profit breakdown lengkap</li>
            </ol>

            <div class="profit-dashboard">
              <h4>📈 Yang Ditampilkan di Dashboard Profit:</h4>
              <ul>
                <li><strong>Total Revenue:</strong> Pendapatan kotor dari penjualan</li>
                <li><strong>Total HPP:</strong> Total biaya produksi</li>
                <li><strong>Gross Profit:</strong> Keuntungan sebelum biaya admin</li>
                <li><strong>Net Profit:</strong> Keuntungan bersih setelah semua biaya</li>
                <li><strong>Profit per Produk:</strong> Detail keuntungan masing-masing produk</li>
                <li><strong>Best/Worst Performer:</strong> Produk paling/kurang menguntungkan</li>
              </ul>
            </div>

            <div class="interpretation-guide">
              <h4>🔍 Cara Baca Hasil Analisis:</h4>
              
              <div class="good-indicators">
                <h5>✅ Indikator Sehat:</h5>
                <ul>
                  <li><strong>Gross Margin > 30%:</strong> Margin keuntungan yang sehat</li>
                  <li><strong>Trend profit naik:</strong> Bisnis berkembang positif</li>
                  <li><strong>Cost control stabil:</strong> HPP tidak naik drastis</li>
                </ul>
              </div>

              <div class="warning-indicators">
                <h5>⚠️ Yang Perlu Diperhatikan:</h5>
                <ul>
                  <li><strong>Margin < 20%:</strong> Keuntungan terlalu tipis, perlu evaluasi</li>
                  <li><strong>HPP naik terus:</strong> Ada biaya yang tidak terkendali</li>
                  <li><strong>Produk rugi:</strong> Ada produk yang dijual di bawah HPP</li>
                </ul>
              </div>
            </div>

            <div class="action-guide">
              <h4>🎯 Langkah Berdasarkan Hasil Analisis:</h4>
              
              <div class="scenario">
                <h5>📊 Jika Margin Tipis (< 25%):</h5>
                <ol>
                  <li>Cek komponen HPP mana yang paling besar</li>
                  <li>Cari supplier bahan baku yang lebih murah</li>
                  <li>Optimasi resep untuk kurangi waste</li>
                  <li>Pertimbangkan naikkan harga jual</li>
                </ol>
              </div>

              <div class="scenario">
                <h5>📈 Jika Margin Sehat (> 30%):</h5>
                <ol>
                  <li>Pertahankan kualitas dan konsistensi</li>
                  <li>Tingkatkan volume produksi</li>
                  <li>Kembangkan varian produk baru</li>
                  <li>Investasi untuk efisiensi produksi</li>
                </ol>
              </div>
            </div>
          </div>
        `
      }
    ]
  },
  {
    id: 7,
    title: "Strategi Optimasi Profit",
    subtitle: "Tips Meningkatkan Keuntungan",
    duration: "18 menit",
    icon: "🚀",
    sections: [
      {
        id: "profit-optimization",
        title: "Strategi Tingkatkan Profit",
        content: `
          <div class="tutorial-content">
            <h3>🚀 Strategi Optimasi Profit untuk UMKM</h3>
            <p>Berdasarkan analisis HPP dan profit, berikut strategi praktis untuk <strong>meningkatkan keuntungan usaha</strong> Anda.</p>

            <div class="strategy-section">
              <h4>💡 1. Optimasi Biaya Bahan Baku (40-60% impact)</h4>
              
              <div class="strategy">
                <h5>🛒 Negosiasi dengan Supplier:</h5>
                <ul>
                  <li><strong>Beli dalam jumlah besar:</strong> Minta diskon quantity</li>
                  <li><strong>Pembayaran cash:</strong> Nego diskon 2-5% untuk bayar tunai</li>
                  <li><strong>Kontrak jangka panjang:</strong> Ikat harga stabil untuk 3-6 bulan</li>
                  <li><strong>Bandingkan supplier:</strong> Cari 2-3 alternatif supplier</li>
                </ul>
              </div>

              <div class="strategy">
                <h5>⚖️ Substitusi Bahan yang Cerdas:</h5>
                <ul>
                  <li><strong>Bahan alternatif:</strong> Cari pengganti yang lebih murah tapi kualitas sama</li>
                  <li><strong>Mix formula:</strong> Campur bahan mahal dengan yang murah (60%:40%)</li>
                  <li><strong>Seasonal buying:</strong> Beli saat harga sedang turun</li>
                  <li><strong>Local sourcing:</strong> Cari supplier lokal untuk kurangi ongkir</li>
                </ul>
              </div>
            </div>

            <div class="strategy-section">
              <h4>⚡ 2. Efisiensi Operasional (20-30% impact)</h4>
              
              <div class="strategy">
                <h5>🔧 Optimasi Proses Produksi:</h5>
                <ul>
                  <li><strong>Batch produksi optimal:</strong> Produksi dalam jumlah yang efisien</li>
                  <li><strong>Kurangi waste:</strong> Minimize bahan terbuang</li>
                  <li><strong>SOP yang jelas:</strong> Standardisasi cara kerja karyawan</li>
                  <li><strong>Maintenance rutin:</strong> Alat awet, produksi lancar</li>
                </ul>
              </div>

              <div class="strategy">
                <h5>👥 Produktivitas Tenaga Kerja:</h5>
                <ul>
                  <li><strong>Training karyawan:</strong> Skill naik, output naik</li>
                  <li><strong>Sistem reward:</strong> Bonus untuk target terlampaui</li>
                  <li><strong>Job rotation:</strong> Karyawan bisa handle multiple task</li>
                  <li><strong>Tools yang tepat:</strong> Investasi alat untuk percepat kerja</li>
                </ul>
              </div>
            </div>

            <div class="strategy-section">
              <h4>💲 3. Strategi Harga yang Tepat (30-40% impact)</h4>
              
              <div class="strategy">
                <h5>📊 Pricing yang Optimal:</h5>
                <ul>
                  <li><strong>Cost-plus pricing:</strong> HPP + Margin target (minimum 30%)</li>
                  <li><strong>Market-based pricing:</strong> Sesuaikan dengan harga pasar</li>
                  <li><strong>Value-based pricing:</strong> Harga berdasarkan perceived value</li>
                  <li><strong>Dynamic pricing:</strong> Sesuaikan harga dengan demand</li>
                </ul>
              </div>

              <div class="pricing-example">
                <h5>💡 Contoh Strategi Harga Bakso:</h5>
                <p><strong>HPP:</strong> Rp 9.775</p>
                <p><strong>Target margin:</strong> 40%</p>
                <p><strong>Harga minimum:</strong> Rp 9.775 ÷ 0.6 = Rp 16.292</p>
                <p><strong>Harga jual yang disarankan:</strong> <strong>Rp 17.000</strong></p>
                <p><strong>Actual margin:</strong> (Rp 17.000 - Rp 9.775) ÷ Rp 17.000 = <strong>42.5%</strong></p>
              </div>
            </div>

            <div class="strategy-section">
              <h4>📈 4. Monitoring dan Continuous Improvement</h4>
              
              <div class="monitoring">
                <h5>📅 Rutinitas Monitoring:</h5>
                <ul>
                  <li><strong>Harian:</strong> Cek stok, catat penjualan</li>
                  <li><strong>Mingguan:</strong> Review HPP dan profit per produk</li>
                  <li><strong>Bulanan:</strong> Analisis tren dan buat action plan</li>
                  <li><strong>Quarterly:</strong> Evaluasi strategi dan target baru</li>
                </ul>
              </div>

              <div class="kpi">
                <h5>🎯 KPI yang Harus Dipantau:</h5>
                <ul>
                  <li><strong>Gross Margin %:</strong> Target minimal 30%</li>
                  <li><strong>Cost per Unit:</strong> Makin rendah makin baik</li>
                  <li><strong>Revenue per Day:</strong> Target penjualan harian</li>
                  <li><strong>Inventory Turnover:</strong> Seberapa cepat stok habis</li>
                </ul>
              </div>
            </div>

            <div class="action-plan">
              <h4>📋 Action Plan Template:</h4>
              <ol>
                <li><strong>Identifikasi:</strong> Produk mana yang paling/kurang menguntungkan?</li>
                <li><strong>Analisis root cause:</strong> Kenapa margin rendah? Bahan mahal? Proses boros?</li>
                <li><strong>Set target:</strong> Target margin untuk bulan depan</li>
                <li><strong>Eksekusi:</strong> Lakukan 1-2 strategi yang paling feasible</li>
                <li><strong>Monitor:</strong> Track progress mingguan</li>
                <li><strong>Adjust:</strong> Sesuaikan strategi jika perlu</li>
              </ol>
            </div>
          </div>
        `
      }
    ]
  },
  {
    id: 8,
    title: "Cara Lengkap Menggunakan Menu Aplikasi",
    subtitle: "Panduan Detail Setiap Menu dan Fitur",
    duration: "25 menit",
    icon: "🧭",
    sections: [
      {
        id: "dashboard-menu",
        title: "Menu Dashboard - Ringkasan Bisnis Anda",
        content: `
          <div class="tutorial-content">
            <h3>🏠 Dashboard - Pusat Kontrol Bisnis</h3>
            <p>Dashboard adalah <strong>halaman utama yang menampilkan ringkasan seluruh bisnis Anda</strong> dalam satu tampilan.</p>
            
            <div class="dashboard-sections">
              <h4>📊 Yang Ditampilkan di Dashboard:</h4>
              
              <div class="section">
                <h5>💰 Panel Keuangan:</h5>
                <ul>
                  <li><strong>Total Pendapatan Hari Ini:</strong> Jumlah uang masuk dari penjualan</li>
                  <li><strong>Total Pengeluaran:</strong> Uang keluar untuk beli bahan, gaji, dll</li>
                  <li><strong>Keuntungan Bersih:</strong> Pendapatan dikurangi pengeluaran</li>
                  <li><strong>Grafik Trend:</strong> Naik/turunnya keuntungan per hari</li>
                </ul>
              </div>
              
              <div class="section">
                <h5>📦 Panel Gudang:</h5>
                <ul>
                  <li><strong>Total Item Gudang:</strong> Berapa jenis bahan yang ada</li>
                  <li><strong>Stok Menipis:</strong> Bahan yang perlu segera dibeli</li>
                  <li><strong>Nilai Inventory:</strong> Total nilai uang yang tersimpan di gudang</li>
                  <li><strong>Alert Restok:</strong> Peringatan bahan habis</li>
                </ul>
              </div>
              
              <div class="section">
                <h5>📋 Panel Pesanan:</h5>
                <ul>
                  <li><strong>Pesanan Hari Ini:</strong> Berapa order yang masuk</li>
                  <li><strong>Pesanan Pending:</strong> Yang belum selesai dikerjakan</li>
                  <li><strong>Total Nilai Pesanan:</strong> Jumlah uang dari semua order</li>
                  <li><strong>Status Pengiriman:</strong> Sudah kirim berapa pesanan</li>
                </ul>
              </div>
            </div>
            
            <div class="tips-dashboard">
              <h4>💡 Tips Menggunakan Dashboard:</h4>
              <ul>
                <li><strong>Cek setiap pagi:</strong> Lihat ringkasan bisnis kemarin</li>
                <li><strong>Pantau stok menipis:</strong> Agar tidak kehabisan bahan</li>
                <li><strong>Monitor trend keuntungan:</strong> Apakah naik atau turun?</li>
                <li><strong>Update data real-time:</strong> Input transaksi segera setelah terjadi</li>
              </ul>
            </div>
          </div>
        `
      },
      {
        id: "keuangan-menu",
        title: "Menu Keuangan - Kelola Uang Masuk Keluar",
        content: `
          <div class="tutorial-content">
            <h3>💰 Menu Keuangan - Catat Semua Transaksi</h3>
            <p>Menu ini untuk <strong>mencatat semua uang yang masuk dan keluar</strong> dari bisnis Anda.</p>
            
            <div class="submenu-keuangan">
              <h4>📋 Sub Menu di Keuangan:</h4>
              
              <div class="submenu">
                <h5>💵 Transaksi Masuk:</h5>
                <p><strong>Kapan digunakan:</strong> Setiap kali dapat uang dari penjualan</p>
                <ul>
                  <li>Uang dari jual produk</li>
                  <li>Uang dari jasa (jika ada)</li>
                  <li>Modal tambahan dari investor</li>
                  <li>Pinjaman bank (jika ada)</li>
                </ul>
                <p><strong>Cara input:</strong> Klik "+ Tambah Pemasukan" → Isi tanggal, jumlah, keterangan → Simpan</p>
              </div>
              
              <div class="submenu">
                <h5>💸 Transaksi Keluar:</h5>
                <p><strong>Kapan digunakan:</strong> Setiap kali keluar uang untuk bisnis</p>
                <ul>
                  <li>Beli bahan baku</li>
                  <li>Bayar gaji karyawan</li>
                  <li>Bayar sewa tempat</li>
                  <li>Bayar listrik, air, gas</li>
                  <li>Ongkos kirim pesanan</li>
                </ul>
                <p><strong>Cara input:</strong> Klik "+ Tambah Pengeluaran" → Pilih kategori → Isi detail → Simpan</p>
              </div>
              
              <div class="submenu">
                <h5>📊 Laporan Keuangan:</h5>
                <p><strong>Fungsi:</strong> Lihat ringkasan keuangan per periode</p>
                <ul>
                  <li><strong>Laporan Harian:</strong> Untung/rugi hari ini</li>
                  <li><strong>Laporan Mingguan:</strong> Performa 7 hari terakhir</li>
                  <li><strong>Laporan Bulanan:</strong> Total bulan ini vs bulan lalu</li>
                  <li><strong>Custom Period:</strong> Pilih tanggal sendiri</li>
                </ul>
              </div>
            </div>
            
            <div class="example-keuangan">
              <h4>💡 Contoh Penggunaan Harian:</h4>
              <div class="example">
                <h5>🌅 Pagi (buka warung):</h5>
                <p>• Beli sayuran di pasar Rp 50.000 → Input ke Transaksi Keluar</p>
                <p>• Bayar ongkir gas Rp 5.000 → Input ke Transaksi Keluar</p>
                
                <h5>🌆 Siang (jam sibuk):</h5>
                <p>• Jual 20 porsi bakso @ Rp 15.000 = Rp 300.000 → Input ke Transaksi Masuk</p>
                
                <h5>🌃 Malam (tutup warung):</h5>
                <p>• Cek laporan harian → Total masuk Rp 300.000, keluar Rp 55.000</p>
                <p>• Keuntungan hari ini: Rp 245.000</p>
              </div>
            </div>
          </div>
        `
      },
      {
        id: "gudang-menu",
        title: "Menu Gudang - Kelola Stok Bahan Baku",
        content: `
          <div class="tutorial-content">
            <h3>📦 Menu Gudang - Kontrol Persediaan</h3>
            <p>Menu gudang untuk <strong>mengawasi stok bahan baku</strong> agar tidak kehabisan saat produksi.</p>
            
            <div class="fitur-gudang">
              <h4>📋 Fitur Utama di Menu Gudang:</h4>
              
              <div class="fitur">
                <h5>📝 Daftar Bahan Baku:</h5>
                <p><strong>Fungsi:</strong> Lihat semua bahan yang ada di gudang</p>
                <ul>
                  <li>Nama bahan (misal: Gula Pasir, Tepung Terigu)</li>
                  <li>Stok saat ini (berapa kg/liter tersisa)</li>
                  <li>Harga beli terakhir</li>
                  <li>Tanggal kadaluarsa (jika ada)</li>
                  <li>Status: Normal/Menipis/Habis</li>
                </ul>
              </div>
              
              <div class="fitur">
                <h5>⚠️ Alert Stok Minimum:</h5>
                <p><strong>Fungsi:</strong> Peringatan otomatis jika stok hampir habis</p>
                <ul>
                  <li>Set batas minimum per bahan (misal: gula min 5 kg)</li>
                  <li>Aplikasi kasih alert merah jika di bawah minimum</li>
                  <li>Bisa langsung buat daftar belanja</li>
                  <li>Kirim notifikasi ke WhatsApp (jika diaktifkan)</li>
                </ul>
              </div>
              
              <div class="fitur">
                <h5>📊 Riwayat Stok:</h5>
                <p><strong>Fungsi:</strong> Lihat pergerakan stok masuk-keluar</p>
                <ul>
                  <li>Kapan bahan masuk (dari pembelian)</li>
                  <li>Kapan bahan keluar (untuk produksi)</li>
                  <li>Siapa yang input (jika ada karyawan)</li>
                  <li>Alasan perubahan stok</li>
                </ul>
              </div>
            </div>
            
            <div class="cara-pakai-gudang">
              <h4>🔧 Cara Menggunakan Menu Gudang:</h4>
              
              <div class="step">
                <h5>1️⃣ Setup Awal (sekali saja):</h5>
                <ol>
                  <li>Masuk menu "Gudang" → "Daftar Bahan Baku"</li>
                  <li>Klik "+ Tambah Bahan Baku"</li>
                  <li>Isi nama bahan, satuan (kg/liter/pcs)</li>
                  <li>Set stok minimum (kapan harus beli lagi)</li>
                  <li>Input stok awal yang ada di gudang</li>
                </ol>
              </div>
              
              <div class="step">
                <h5>2️⃣ Penggunaan Harian:</h5>
                <ol>
                  <li><strong>Pagi:</strong> Cek alert stok menipis</li>
                  <li><strong>Saat produksi:</strong> Stok otomatis berkurang (dari resep)</li>
                  <li><strong>Saat terima barang:</strong> Stok otomatis bertambah (dari pembelian)</li>
                  <li><strong>Malam:</strong> Review stok untuk besok</li>
                </ol>
              </div>
            </div>
            
            <div class="example-gudang">
              <h4>💡 Contoh Skenario di Warung Bakso:</h4>
              <div class="scenario">
                <h5>📅 Setup Awal Daging Sapi:</h5>
                <p>• <strong>Nama:</strong> Daging Sapi Giling</p>
                <p>• <strong>Satuan:</strong> kg</p>
                <p>• <strong>Stok Minimum:</strong> 2 kg (batas untuk alert)</p>
                <p>• <strong>Stok Saat Ini:</strong> 10 kg</p>
                
                <h5>🍲 Saat Produksi Bakso:</h5>
                <p>• Buat 50 porsi bakso (pakai 5 kg daging)</p>
                <p>• Sistem otomatis kurangi stok: 10 kg - 5 kg = 5 kg tersisa</p>
                <p>• Status masih NORMAL (di atas minimum 2 kg)</p>
                
                <h5>📢 Alert Stok Menipis:</h5>
                <p>• Besoknya produksi lagi 30 porsi (pakai 3 kg daging)</p>
                <p>• Stok jadi: 5 kg - 3 kg = 2 kg tersisa</p>
                <p>• Sistem kasih alert MERAH: "Daging Sapi Menipis!"</p>
                <p>• Langsung buat reminder beli daging besok</p>
              </div>
            </div>
          </div>
        `
      }
    ]
  },
  {
    id: 9,
    title: "Tutorial Menu Lanjutan",
    subtitle: "Resep, Pembelian, Pesanan, dan Analisis",
    duration: "30 menit",
    icon: "⚙️",
    sections: [
      {
        id: "resep-menu",
        title: "Menu Resep - Buat Formula Produk",
        content: `
          <div class="tutorial-content">
            <h3>👨‍🍳 Menu Resep - Formula Rahasia Produk</h3>
            <p>Menu resep untuk <strong>menyimpan komposisi dan takaran bahan</strong> setiap produk yang Anda jual.</p>
            
            <div class="fungsi-resep">
              <h4>🎯 Kenapa Resep Penting?</h4>
              <ul>
                <li><strong>Konsistensi rasa:</strong> Produk selalu sama rasanya</li>
                <li><strong>Hitung HPP akurat:</strong> Tahu persis berapa biaya buat 1 produk</li>
                <li><strong>Kontrol porsi:</strong> Tidak boros bahan</li>
                <li><strong>Mudah delegate:</strong> Karyawan bisa ikuti resep yang sama</li>
                <li><strong>Scaling produksi:</strong> Bisa hitung untuk 100 atau 1000 porsi</li>
              </ul>
            </div>
            
            <div class="cara-buat-resep">
              <h4>📝 Langkah Buat Resep Baru:</h4>
              
              <div class="step">
                <h5>1️⃣ Informasi Dasar Produk:</h5>
                <ol>
                  <li>Masuk menu "Resep" → Klik "+ Tambah Resep"</li>
                  <li><strong>Nama Produk:</strong> Bakso Kuah Spesial</li>
                  <li><strong>Kategori:</strong> Makanan Utama</li>
                  <li><strong>Porsi per Batch:</strong> 10 porsi (dari 1x masak)</li>
                  <li><strong>Waktu Masak:</strong> 45 menit</li>
                  <li><strong>Tingkat Kesulitan:</strong> Mudah/Sedang/Sulit</li>
                </ol>
              </div>
              
              <div class="step">
                <h5>2️⃣ Tambah Bahan-Bahan:</h5>
                <ol>
                  <li>Klik "+ Tambah Bahan"</li>
                  <li>Pilih bahan dari dropdown (harus sudah ada di gudang)</li>
                  <li>Isi takaran (misal: 1 kg, 200 gram, 50 ml)</li>
                  <li>Harga otomatis muncul dari data gudang</li>
                  <li>Ulangi untuk semua bahan</li>
                </ol>
              </div>
              
              <div class="step">
                <h5>3️⃣ Review dan Simpan:</h5>
                <ol>
                  <li>Cek total biaya bahan</li>
                  <li>Hitung biaya per porsi</li>
                  <li>Tambah foto produk jadi (opsional)</li>
                  <li>Tulis catatan khusus (tips masak, dll)</li>
                  <li>Klik "Simpan Resep"</li>
                </ol>
              </div>
            </div>
            
            <div class="contoh-resep-lengkap">
              <h4>💡 Contoh Resep Bakso Kuah (10 porsi):</h4>
              <div class="resep-table">
                <h5>📋 Daftar Bahan:</h5>
                <table class="w-full border-collapse border border-gray-300 text-sm">
                  <thead>
                    <tr class="bg-gray-100">
                      <th class="border border-gray-300 p-2">Bahan</th>
                      <th class="border border-gray-300 p-2">Takaran</th>
                      <th class="border border-gray-300 p-2">Harga/Unit</th>
                      <th class="border border-gray-300 p-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td class="border border-gray-300 p-2">Daging Sapi Giling</td><td class="border border-gray-300 p-2">1 kg</td><td class="border border-gray-300 p-2">Rp 80.000/kg</td><td class="border border-gray-300 p-2">Rp 80.000</td></tr>
                    <tr><td class="border border-gray-300 p-2">Tepung Tapioka</td><td class="border border-gray-300 p-2">200 g</td><td class="border border-gray-300 p-2">Rp 8.000/kg</td><td class="border border-gray-300 p-2">Rp 1.600</td></tr>
                    <tr><td class="border border-gray-300 p-2">Bawang Putih</td><td class="border border-gray-300 p-2">50 g</td><td class="border border-gray-300 p-2">Rp 25.000/kg</td><td class="border border-gray-300 p-2">Rp 1.250</td></tr>
                    <tr><td class="border border-gray-300 p-2">Garam</td><td class="border border-gray-300 p-2">20 g</td><td class="border border-gray-300 p-2">Rp 5.000/kg</td><td class="border border-gray-300 p-2">Rp 100</td></tr>
                    <tr><td class="border border-gray-300 p-2">Merica Bubuk</td><td class="border border-gray-300 p-2">5 g</td><td class="border border-gray-300 p-2">Rp 60.000/kg</td><td class="border border-gray-300 p-2">Rp 300</td></tr>
                    <tr class="bg-yellow-100 font-bold"><td class="border border-gray-300 p-2" colspan="3">TOTAL BIAYA BAHAN</td><td class="border border-gray-300 p-2">Rp 83.250</td></tr>
                    <tr class="bg-green-100 font-bold"><td class="border border-gray-300 p-2" colspan="3">BIAYA PER PORSI</td><td class="border border-gray-300 p-2">Rp 8.325</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        `
      },
      {
        id: "pembelian-menu",
        title: "Menu Pembelian - Kelola Supplier dan Stok",
        content: `
          <div class="tutorial-content">
            <h3>🛒 Menu Pembelian - Beli Bahan dengan Smart</h3>
            <p>Menu pembelian untuk <strong>mencatat semua pembelian bahan baku</strong> dan otomatis update stok gudang.</p>
            
            <div class="kenapa-penting-pembelian">
              <h4>🎯 Kenapa Menu Pembelian Penting?</h4>
              <ul>
                <li><strong>Hitung HPP akurat:</strong> Sistem pakai harga beli terakhir</li>
                <li><strong>Stok otomatis update:</strong> Tidak perlu input manual di gudang</li>
                <li><strong>Track supplier terbaik:</strong> Tahu mana supplier termurah</li>
                <li><strong>Riwayat pembelian:</strong> Bisa nego berdasarkan histori</li>
                <li><strong>Prediksi kebutuhan:</strong> Tahu pattern pembelian bulanan</li>
              </ul>
            </div>
            
            <div class="langkah-pembelian">
              <h4>📝 Langkah Input Pembelian:</h4>
              
              <div class="step">
                <h5>1️⃣ Tambah Pembelian Baru:</h5>
                <ol>
                  <li>Masuk menu "Pembelian" → Klik "+ Tambah Pembelian"</li>
                  <li><strong>Tanggal Pembelian:</strong> Kapan beli (hari ini/kemarin)</li>
                  <li><strong>Supplier:</strong> Nama toko (misal: Toko Sembako Jaya)</li>
                  <li><strong>Nomor Nota:</strong> Tulis nomor struk (untuk tracking)</li>
                </ol>
              </div>
              
              <div class="step">
                <h5>2️⃣ Input Detail Barang:</h5>
                <ol>
                  <li><strong>Nama Bahan:</strong> Ketik atau pilih dari dropdown</li>
                  <li><strong>Jumlah:</strong> Berapa yang dibeli (25 kg, 10 liter, etc)</li>
                  <li><strong>Harga per Unit:</strong> Harga per kg/liter/pcs</li>
                  <li><strong>Total Harga:</strong> Otomatis dihitung (jumlah × harga)</li>
                  <li>Klik "Tambah Item" jika beli banyak barang sekaligus</li>
                </ol>
              </div>
              
              <div class="step">
                <h5>3️⃣ Finalisasi Pembelian:</h5>
                <ol>
                  <li>Review total pembelian</li>
                  <li>Cek semua item sudah benar</li>
                  <li>Tambah catatan khusus (misal: dapat diskon 5%)</li>
                  <li>Klik "Simpan Pembelian"</li>
                  <li>Sistem otomatis update stok di gudang</li>
                </ol>
              </div>
            </div>
            
            <div class="contoh-pembelian">
              <h4>💡 Contoh Pembelian di Pasar Tradisional:</h4>
              <div class="scenario bg-gray-50 p-4 rounded-lg">
                <h5>📅 Pembelian Tanggal: 30 Agustus 2024</h5>
                <p><strong>Supplier:</strong> Toko Pak Budi - Pasar Sentral</p>
                <p><strong>Nomor Nota:</strong> PB-240830-001</p>
                
                <h6 class="mt-3 font-bold">🛒 Daftar Belanja:</h6>
                <div class="space-y-2 text-sm">
                  <div class="flex justify-between">• Daging Sapi Giling: 5 kg × Rp 82.000 = <span class="font-bold">Rp 410.000</span></div>
                  <div class="flex justify-between">• Tepung Tapioka: 2 kg × Rp 8.500 = <span class="font-bold">Rp 17.000</span></div>
                  <div class="flex justify-between">• Bawang Putih: 1 kg × Rp 28.000 = <span class="font-bold">Rp 28.000</span></div>
                  <div class="flex justify-between">• Garam Dapur: 5 kg × Rp 6.000 = <span class="font-bold">Rp 30.000</span></div>
                  <div class="border-t pt-2 font-bold flex justify-between">TOTAL BELANJA: <span>Rp 485.000</span></div>
                </div>
                
                <div class="mt-3 p-3 bg-green-100 rounded">
                  <h6 class="font-bold text-green-800">✅ Setelah Input Pembelian:</h6>
                  <ul class="text-green-700 text-sm mt-2 space-y-1">
                    <li>• Stok daging bertambah dari 2 kg → 7 kg</li>
                    <li>• Harga daging terupdate jadi Rp 82.000/kg</li>
                    <li>• WAC (rata-rata harga) dihitung ulang otomatis</li>
                    <li>• Pengeluaran tercatat di laporan keuangan</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        `
      },
      {
        id: "pesanan-menu",
        title: "Menu Pesanan - Kelola Order Customer",
        content: `
          <div class="tutorial-content">
            <h3>📋 Menu Pesanan - Terima dan Kelola Order</h3>
            <p>Menu pesanan untuk <strong>mencatat pesanan dari customer</strong> dan track status dari order hingga pengiriman.</p>
            
            <div class="kenapa-penting-pesanan">
              <h4>🎯 Kenapa Menu Pesanan Penting?</h4>
              <ul>
                <li><strong>Track semua order:</strong> Tidak ada pesanan yang terlewat</li>
                <li><strong>Hitung pendapatan:</strong> Tahu berapa penjualan per hari</li>
                <li><strong>Manage delivery:</strong> Status kirim sampai customer terima</li>
                <li><strong>Customer database:</strong> Simpan data pelanggan loyal</li>
                <li><strong>Analisis produk:</strong> Tahu produk mana yang paling laris</li>
              </ul>
            </div>
            
            <div class="langkah-pesanan">
              <h4>📝 Langkah Input Pesanan Baru:</h4>
              
              <div class="step">
                <h5>1️⃣ Data Customer:</h5>
                <ol>
                  <li>Masuk menu "Pesanan" → Klik "+ Pesanan Baru"</li>
                  <li><strong>Nama Customer:</strong> Nama yang pesan (Bu Sari, Pak Joko)</li>
                  <li><strong>No WhatsApp:</strong> Untuk konfirmasi dan update</li>
                  <li><strong>Alamat Kirim:</strong> Alamat lengkap (jika delivery)</li>
                  <li><strong>Catatan Khusus:</strong> Permintaan customer (pedas, tidak pedas, dll)</li>
                </ol>
              </div>
              
              <div class="step">
                <h5>2️⃣ Detail Pesanan:</h5>
                <ol>
                  <li><strong>Pilih Produk:</strong> Dari daftar menu yang tersedia</li>
                  <li><strong>Jumlah:</strong> Berapa porsi yang dipesan</li>
                  <li><strong>Harga:</strong> Otomatis muncul, bisa diedit (jika ada diskon)</li>
                  <li><strong>Subtotal:</strong> Jumlah × harga (otomatis)</li>
                  <li>Klik "+ Tambah Item" untuk produk lain</li>
                </ol>
              </div>
              
              <div class="step">
                <h5>3️⃣ Pengiriman dan Payment:</h5>
                <ol>
                  <li><strong>Metode Kirim:</strong> Pickup/Delivery/Dine-in</li>
                  <li><strong>Waktu Kirim:</strong> Jam berapa harus siap</li>
                  <li><strong>Ongkos Kirim:</strong> Biaya delivery (jika ada)</li>
                  <li><strong>Metode Bayar:</strong> Cash/Transfer/E-wallet</li>
                  <li><strong>Status Bayar:</strong> Lunas/DP/Belum Bayar</li>
                </ol>
              </div>
            </div>
            
            <div class="status-pesanan">
              <h4>🔄 Status Pesanan (Otomatis):</h4>
              <div class="status-flow">
                <div class="status">📝 <strong>Baru:</strong> Pesanan baru masuk, belum dikerjakan</div>
                <div class="arrow">↓</div>
                <div class="status">👨‍🍳 <strong>Proses:</strong> Sedang dimasak/disiapkan</div>
                <div class="arrow">↓</div>
                <div class="status">📦 <strong>Siap:</strong> Sudah selesai, siap kirim</div>
                <div class="arrow">↓</div>
                <div class="status">🚚 <strong>Kirim:</strong> Dalam perjalanan ke customer</div>
                <div class="arrow">↓</div>
                <div class="status">✅ <strong>Selesai:</strong> Diterima customer, transaksi complete</div>
              </div>
            </div>
            
            <div class="contoh-pesanan">
              <h4>💡 Contoh Pesanan Lengkap:</h4>
              <div class="order-example bg-blue-50 p-4 rounded-lg">
                <h5>📞 Pesanan via WhatsApp:</h5>
                <p><strong>Customer:</strong> Bu Sari (081234567890)</p>
                <p><strong>Alamat:</strong> Jl. Mawar No. 15, Kemayoran</p>
                
                <h6 class="mt-3 font-bold">🍜 Detail Pesanan:</h6>
                <div class="space-y-1 text-sm">
                  <div class="flex justify-between">• Bakso Kuah Spesial: 3 porsi × Rp 15.000 = <span class="font-bold">Rp 45.000</span></div>
                  <div class="flex justify-between">• Es Teh Manis: 3 gelas × Rp 5.000 = <span class="font-bold">Rp 15.000</span></div>
                  <div class="flex justify-between">• Ongkos Kirim: <span class="font-bold">Rp 10.000</span></div>
                  <div class="border-t pt-1 font-bold flex justify-between">TOTAL: <span>Rp 70.000</span></div>
                </div>
                
                <div class="mt-3">
                  <p><strong>Waktu Kirim:</strong> 12:30 WIB</p>
                  <p><strong>Pembayaran:</strong> Transfer BCA (Lunas)</p>
                  <p><strong>Catatan:</strong> Bakso tidak terlalu pedas</p>
                </div>
              </div>
            </div>
          </div>
        `
      },
      {
        id: "analisis-menu",
        title: "Menu Analisis Profit - Lihat Keuntungan",
        content: `
          <div class="tutorial-content">
            <h3>📈 Menu Analisis Profit - Monitor Keuntungan</h3>
            <p>Menu analisis untuk <strong>melihat keuntungan bisnis</strong> dari berbagai sudut pandang dan periode waktu.</p>
            
            <div class="jenis-analisis">
              <h4>📊 Jenis Analisis yang Tersedia:</h4>
              
              <div class="analysis-type">
                <h5>💰 Analisis Keuntungan Harian:</h5>
                <ul>
                  <li>Total penjualan hari ini</li>
                  <li>Total biaya produksi</li>
                  <li>Keuntungan bersih harian</li>
                  <li>Margin keuntungan (%)</li>
                  <li>Perbandingan dengan hari kemarin</li>
                </ul>
              </div>
              
              <div class="analysis-type">
                <h5>📅 Analisis Keuntungan Bulanan:</h5>
                <ul>
                  <li>Trend keuntungan per hari dalam 1 bulan</li>
                  <li>Hari-hari dengan penjualan tertinggi</li>
                  <li>Total keuntungan bulan ini vs bulan lalu</li>
                  <li>Growth rate (% pertumbuhan)</li>
                  <li>Proyeksi keuntungan bulan depan</li>
                </ul>
              </div>
              
              <div class="analysis-type">
                <h5>🍜 Analisis per Produk:</h5>
                <ul>
                  <li>Produk dengan margin tertinggi</li>
                  <li>Produk paling laris (best seller)</li>
                  <li>Produk dengan keuntungan terbesar</li>
                  <li>Produk yang perlu dievaluasi</li>
                  <li>Rekomendasi harga jual optimal</li>
                </ul>
              </div>
            </div>
            
            <div class="cara-baca-analisis">
              <h4>🔍 Cara Membaca Analisis:</h4>
              
              <div class="reading-guide">
                <h5>✅ Indikator Sehat:</h5>
                <ul>
                  <li><strong>Margin > 30%:</strong> Keuntungan yang bagus</li>
                  <li><strong>Trend naik:</strong> Bisnis berkembang positif</li>
                  <li><strong>HPP stabil:</strong> Cost control yang baik</li>
                  <li><strong>Produk balance:</strong> Tidak tergantung 1 produk saja</li>
                </ul>
                
                <h5>⚠️ Indikator Perlu Perhatian:</h5>
                <ul>
                  <li><strong>Margin < 20%:</strong> Keuntungan terlalu tipis</li>
                  <li><strong>Trend turun:</strong> Ada masalah yang perlu diperbaiki</li>
                  <li><strong>HPP naik terus:</strong> Biaya tidak terkendali</li>
                  <li><strong>Ada produk rugi:</strong> Harga jual terlalu murah</li>
                </ul>
              </div>
            </div>
            
            <div class="contoh-analisis">
              <h4>💡 Contoh Analisis Warung Bakso (Bulan Agustus):</h4>
              <div class="analysis-example bg-green-50 p-4 rounded-lg">
                <h5>📊 Summary Bulan Agustus:</h5>
                <div class="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><strong>Total Penjualan:</strong> Rp 15.000.000</p>
                    <p><strong>Total HPP:</strong> Rp 9.500.000</p>
                    <p><strong>Keuntungan Kotor:</strong> Rp 5.500.000</p>
                    <p><strong>Margin:</strong> 36.7% ✅</p>
                  </div>
                  <div>
                    <p><strong>Biaya Operasional:</strong> Rp 2.000.000</p>
                    <p><strong>Keuntungan Bersih:</strong> Rp 3.500.000</p>
                    <p><strong>Growth vs Juli:</strong> +15% 📈</p>
                    <p><strong>Status:</strong> SEHAT ✅</p>
                  </div>
                </div>
                
                <h6 class="mt-3 font-bold">🏆 Top 3 Produk Terbaik:</h6>
                <div class="space-y-1 text-sm">
                  <div>1. Bakso Kuah Spesial - Margin 42%, Terjual 450 porsi</div>
                  <div>2. Mie Ayam Bakso - Margin 38%, Terjual 320 porsi</div>
                  <div>3. Es Teh Manis - Margin 65%, Terjual 680 gelas</div>
                </div>
                
                <div class="mt-3 p-3 bg-yellow-100 rounded">
                  <h6 class="font-bold text-yellow-800">💡 Rekomendasi:</h6>
                  <ul class="text-yellow-700 text-sm space-y-1">
                    <li>• Fokus promosi Bakso Kuah Spesial (margin tinggi + laris)</li>
                    <li>• Tingkatkan penjualan Es Teh (margin 65%)</li>
                    <li>• Evaluasi harga Mie Ayam (bisa dinaikkan)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        `
      }
    ]
  },
  {
    id: 10,
    title: "Tips Praktis Penggunaan Sehari-hari",
    subtitle: "Workflow Harian untuk UMKM",
    duration: "15 menit",
    icon: "💼",
    sections: [
      {
        id: "workflow-harian",
        title: "Rutinitas Harian yang Efektif",
        content: `
          <div class="tutorial-content">
            <h3>💼 Workflow Harian untuk UMKM</h3>
            <p>Ikuti rutinitas ini setiap hari untuk <strong>memaksimalkan manfaat aplikasi</strong> dan kontrol bisnis yang lebih baik.</p>
            
            <div class="morning-routine">
              <h4>🌅 Rutinitas Pagi (5-10 menit):</h4>
              
              <div class="routine-step">
                <h5>1. Cek Dashboard (2 menit):</h5>
                <ul>
                  <li>✅ Lihat ringkasan bisnis kemarin</li>
                  <li>✅ Cek keuntungan vs target harian</li>
                  <li>✅ Review trend 7 hari terakhir</li>
                </ul>
              </div>
              
              <div class="routine-step">
                <h5>2. Monitor Stok Gudang (3 menit):</h5>
                <ul>
                  <li>📦 Cek alert stok menipis</li>
                  <li>📝 Buat daftar belanja jika ada yang habis</li>
                  <li>📅 Planning produksi hari ini</li>
                </ul>
              </div>
              
              <div class="routine-step">
                <h5>3. Review Pesanan (2 menit):</h5>
                <ul>
                  <li>📋 Cek pesanan yang harus selesai hari ini</li>
                  <li>🕓 Konfirmasi waktu kirim ke customer</li>
                  <li>📱 Balas chat WA customer (jika ada)</li>
                </ul>
              </div>
            </div>
            
            <div class="operational-routine">
              <h4>🌆 Rutinitas Operasional (Throughout the day):</h4>
              
              <div class="operation">
                <h5>🛒 Saat Belanja Bahan:</h5>
                <ol>
                  <li>Ambil foto struk pembelian</li>
                  <li>Input pembelian segera di aplikasi</li>
                  <li>Cek stok otomatis terupdate</li>
                  <li>Verifikasi harga WAC terbaru</li>
                </ol>
              </div>
              
              <div class="operation">
                <h5>🍲 Saat Produksi:</h5>
                <ol>
                  <li>Gunakan resep di aplikasi sebagai guide</li>
                  <li>Catat jika ada perubahan takaran</li>
                  <li>Hitung jumlah produk jadi</li>
                  <li>Update yield jika berbeda dari resep</li>
                </ol>
              </div>
              
              <div class="operation">
                <h5>📞 Saat Ada Pesanan:</h5>
                <ol>
                  <li>Input pesanan langsung saat terima order</li>
                  <li>Konfirmasi waktu dan detail ke customer</li>
                  <li>Update status pesanan real-time</li>
                  <li>Foto bukti pengiriman (jika delivery)</li>
                </ol>
              </div>
            </div>
            
            <div class="evening-routine">
              <h4>🌃 Rutinitas Malam (10-15 menit):</h4>
              
              <div class="evening-step">
                <h5>1. Rekap Penjualan (5 menit):</h5>
                <ul>
                  <li>📈 Input semua penjualan hari ini</li>
                  <li>💰 Cek total pendapatan vs target</li>
                  <li>🔄 Update status pesanan yang selesai</li>
                </ul>
              </div>
              
              <div class="evening-step">
                <h5>2. Review Keuangan (5 menit):</h5>
                <ul>
                  <li>📊 Lihat laporan keuangan harian</li>
                  <li>⚖️ Bandingkan pemasukan vs pengeluaran</li>
                  <li>🎯 Evaluasi margin keuntungan</li>
                </ul>
              </div>
              
              <div class="evening-step">
                <h5>3. Planning Besok (5 menit):</h5>
                <ul>
                  <li>📅 Cek pesanan untuk besok</li>
                  <li>🛒 Siapkan daftar belanja jika perlu</li>
                  <li>🎯 Set target penjualan besok</li>
                </ul>
              </div>
            </div>
          </div>
        `
      },
      {
        id: "troubleshooting-umum",
        title: "Troubleshooting Masalah Umum",
        content: `
          <div class="tutorial-content">
            <h3>🔧 Troubleshooting Masalah Umum</h3>
            <p>Solusi untuk <strong>masalah yang sering dialami pengguna</strong> aplikasi HPP Calculator.</p>
            
            <div class="common-issues">
              <h4>⚠️ Masalah Umum dan Solusinya:</h4>
              
              <div class="issue">
                <h5>📉 Problem: "HPP saya kok mahal banget?"</h5>
                <div class="solution">
                  <h6>🔍 Penyebab Kemungkinan:</h6>
                  <ul>
                    <li>Harga bahan baku terlalu tinggi</li>
                    <li>Porsi/yield terlalu kecil</li>
                    <li>Biaya operasional berlebihan</li>
                    <li>Resep tidak efisien</li>
                  </ul>
                  <h6>✅ Solusi:</h6>
                  <ol>
                    <li>Cek harga bahan di menu Gudang - bandingkan dengan harga pasar</li>
                    <li>Review resep - apakah takaran sudah optimal?</li>
                    <li>Evaluasi yield - hitung ulang berapa porsi yang benar-benar jadi</li>
                    <li>Audit biaya operasional - mana yang bisa dikurangi?</li>
                  </ol>
                </div>
              </div>
              
              <div class="issue">
                <h5>📈 Problem: "Keuntungan di dashboard tidak sesuai dengan uang di dompet"</h5>
                <div class="solution">
                  <h6>🔍 Penyebab Kemungkinan:</h6>
                  <ul>
                    <li>Ada transaksi yang belum diinput</li>
                    <li>Ada pengeluaran pribadi tercampur</li>
                    <li>Tanggal input salah</li>
                    <li>Ada hutang piutang yang tidak tercatat</li>
                  </ul>
                  <h6>✅ Solusi:</h6>
                  <ol>
                    <li>Cek laporan keuangan detail - cocokkan dengan nota/struk</li>
                    <li>Pisahkan keuangan bisnis dan pribadi</li>
                    <li>Input semua transaksi dengan tanggal yang benar</li>
                    <li>Catat hutang/piutang di kategori terpisah</li>
                  </ol>
                </div>
              </div>
              
              <div class="issue">
                <h5>📦 Problem: "Stok di aplikasi beda dengan stok fisik"</h5>
                <div class="solution">
                  <h6>🔍 Penyebab Kemungkinan:</h6>
                  <ul>
                    <li>Ada penggunaan bahan yang tidak tercatat</li>
                    <li>Pembelian tidak diinput</li>
                    <li>Resep tidak akurat</li>
                    <li>Ada bahan yang rusak/terbuang</li>
                  </ul>
                  <h6>✅ Solusi:</h6>
                  <ol>
                    <li>Lakukan stock opname fisik</li>
                    <li>Adjust stok di aplikasi sesuai fisik</li>
                    <li>Review resep - apakah takaran sudah benar?</li>
                    <li>Catat semua pembelian dan pemakaian</li>
                  </ol>
                </div>
              </div>
            </div>
            
            <div class="prevention-tips">
              <h4>🛡️ Tips Mencegah Masalah:</h4>
              
              <div class="prevention">
                <h5>1. Input Data Real-time:</h5>
                <ul>
                  <li>Jangan tunda input sampai malam</li>
                  <li>Gunakan fitur foto untuk backup nota</li>
                  <li>Set reminder di HP untuk input rutin</li>
                </ul>
              </div>
              
              <div class="prevention">
                <h5>2. Audit Berkala:</h5>
                <ul>
                  <li>Cek stok fisik vs aplikasi seminggu sekali</li>
                  <li>Review laporan keuangan setiap akhir bulan</li>
                  <li>Update harga bahan jika ada perubahan</li>
                </ul>
              </div>
              
              <div class="prevention">
                <h5>3. Backup Data:</h5>
                <ul>
                  <li>Export data ke Excel setiap bulan</li>
                  <li>Simpan foto semua struk/nota</li>
                  <li>Catat password di tempat aman</li>
                </ul>
              </div>
            </div>
            
            <div class="help-contacts bg-blue-50 p-4 rounded-lg">
              <h4>🆘 Butuh Bantuan Lebih Lanjut?</h4>
              <div class="contact-options">
                <div class="contact">
                  <h5>📱 WhatsApp Support:</h5>
                  <p>Chat langsung dengan tim support untuk bantuan teknis</p>
                  <p><strong>Response time:</strong> Maksimal 24 jam</p>
                </div>
                <div class="contact">
                  <h5>📹 Video Tutorial:</h5>
                  <p>Lihat video step-by-step di channel YouTube</p>
                  <p><strong>Update:</strong> Video baru setiap minggu</p>
                </div>
                <div class="contact">
                  <h5>👥 Community Group:</h5>
                  <p>Join group WhatsApp untuk sharing dengan UMKM lain</p>
                  <p><strong>Benefit:</strong> Tips dari pengalaman nyata</p>
                </div>
              </div>
            </div>
          </div>
        `
      }
    ]
  },
  {
    id: 11,
    title: "Fitur Otomatis yang Membantu Anda",
    subtitle: "Sistem Kerja Otomatis untuk Efisiensi Maksimal",
    duration: "20 menit",
    icon: "⚙️",
    sections: [
      {
        id: "otomatis-keuangan",
        title: "Otomatis Keuangan dan Pemasukan",
        content: `
          <div class="tutorial-content">
            <h3>⚙️ Sistem Otomatis Keuangan</h3>
            <p>Aplikasi ini punya <strong>sistem otomatis yang cerdas</strong> untuk mengelola keuangan tanpa perlu input manual berulang-ulang.</p>
            
            <div class="auto-financial">
              <h4>💰 Yang Terjadi Secara Otomatis di Keuangan:</h4>
              
              <div class="auto-feature">
                <h5>1️⃣ Pesanan Selesai → Otomatis Jadi Pemasukan</h5>
                <div class="process bg-green-50 p-4 rounded-lg">
                  <h6 class="font-bold text-green-800">🔄 Alur Otomatis:</h6>
                  <ol class="text-green-700 space-y-2">
                    <li><strong>Customer pesan:</strong> Bakso 3 porsi = Rp 45.000</li>
                    <li><strong>Anda ubah status:</strong> "Baru" → "Proses" → "Siap" → "Kirim" → <strong>"Selesai"</strong></li>
                    <li><strong>Sistem otomatis:</strong> Catat Rp 45.000 di laporan pemasukan</li>
                    <li><strong>Dashboard terupdate:</strong> Total penjualan hari ini bertambah</li>
                    <li><strong>Laporan keuangan:</strong> Otomatis masuk ke kategori "Penjualan Produk"</li>
                  </ol>
                </div>
                <div class="benefit bg-blue-50 p-3 rounded mt-2">
                  <p class="text-blue-700"><strong>✨ Manfaat:</strong> Tidak perlu input manual di menu Keuangan lagi!</p>
                </div>
              </div>
              
              <div class="auto-feature">
                <h5>2️⃣ Pembelian Bahan → Otomatis Jadi Pengeluaran</h5>
                <div class="process bg-orange-50 p-4 rounded-lg">
                  <h6 class="font-bold text-orange-800">🔄 Alur Otomatis:</h6>
                  <ol class="text-orange-700 space-y-2">
                    <li><strong>Input pembelian:</strong> Daging sapi 5 kg = Rp 400.000</li>
                    <li><strong>Sistem otomatis:</strong> Catat Rp 400.000 di laporan pengeluaran</li>
                    <li><strong>Kategori otomatis:</strong> "Pembelian Bahan Baku"</li>
                    <li><strong>Tanggal otomatis:</strong> Sesuai tanggal pembelian yang Anda input</li>
                    <li><strong>Supplier tercatat:</strong> Untuk tracking pembelian</li>
                  </ol>
                </div>
                <div class="benefit bg-blue-50 p-3 rounded mt-2">
                  <p class="text-blue-700"><strong>✨ Manfaat:</strong> Sekali input di Pembelian, otomatis masuk Laporan Keuangan!</p>
                </div>
              </div>
              
              <div class="auto-feature">
                <h5>3️⃣ Biaya Operasional → Otomatis Terdistribusi</h5>
                <div class="process bg-purple-50 p-4 rounded-lg">
                  <h6 class="font-bold text-purple-800">🔄 Alur Otomatis:</h6>
                  <ol class="text-purple-700 space-y-2">
                    <li><strong>Set biaya bulanan:</strong> Listrik Rp 300.000/bulan</li>
                    <li><strong>Sistem otomatis:</strong> Hitung Rp 10.000/hari</li>
                    <li><strong>Bagi per produk:</strong> Jika produksi 100 porsi = Rp 100/porsi</li>
                    <li><strong>Masuk HPP otomatis:</strong> Setiap produk dapat overhead Rp 100</li>
                    <li><strong>Laporan harian:</strong> Otomatis masuk pengeluaran operasional</li>
                  </ol>
                </div>
                <div class="benefit bg-blue-50 p-3 rounded mt-2">
                  <p class="text-blue-700"><strong>✨ Manfaat:</strong> Tidak perlu hitung manual biaya per produk!</p>
                </div>
              </div>
            </div>
          </div>
        `
      },
      {
        id: "otomatis-stok",
        title: "Otomatis Stok dan Inventory",
        content: `
          <div class="tutorial-content">
            <h3>📦 Sistem Otomatis Stok</h3>
            <p>Stok gudang <strong>terupdate otomatis</strong> tanpa perlu input manual setiap kali ada perubahan.</p>
            
            <div class="auto-inventory">
              <h4>📈 Yang Terjadi Otomatis di Stok:</h4>
              
              <div class="auto-stock">
                <h5>1️⃣ Pembelian Bahan → Stok Bertambah Otomatis</h5>
                <div class="example bg-green-50 p-4 rounded-lg">
                  <h6 class="font-bold text-green-800">📝 Contoh:</h6>
                  <div class="text-green-700 space-y-2">
                    <p><strong>Stok awal:</strong> Daging sapi 2 kg</p>
                    <p><strong>Beli lagi:</strong> 5 kg di menu Pembelian</p>
                    <p><strong>Sistem otomatis:</strong> Stok jadi 2 + 5 = <strong>7 kg</strong></p>
                    <p><strong>Harga terupdate:</strong> Pakai sistem WAC (rata-rata tertimbang)</p>
                    <p><strong>Alert hilang:</strong> Jika sebelumnya stok menipis, alert otomatis hilang</p>
                  </div>
                </div>
              </div>
              
              <div class="auto-stock">
                <h5>2️⃣ Produksi Pakai Resep → Stok Berkurang Otomatis</h5>
                <div class="example bg-orange-50 p-4 rounded-lg">
                  <h6 class="font-bold text-orange-800">🍲 Contoh:</h6>
                  <div class="text-orange-700 space-y-2">
                    <p><strong>Resep bakso:</strong> 1 kg daging untuk 10 porsi</p>
                    <p><strong>Produksi:</strong> 50 porsi bakso</p>
                    <p><strong>Sistem otomatis hitung:</strong> Butuh 50 ÷ 10 × 1 kg = 5 kg daging</p>
                    <p><strong>Stok otomatis kurang:</strong> 7 kg - 5 kg = <strong>2 kg tersisa</strong></p>
                    <p><strong>Alert muncul:</strong> Jika di bawah minimum, kasih peringatan</p>
                  </div>
                </div>
              </div>
              
              <div class="auto-stock">
                <h5>3️⃣ Alert Stok Menipis → Notifikasi Otomatis</h5>
                <div class="example bg-red-50 p-4 rounded-lg">
                  <h6 class="font-bold text-red-800">⚠️ Sistem Alert:</h6>
                  <div class="text-red-700 space-y-2">
                    <p><strong>Set minimum:</strong> Daging minimum 3 kg</p>
                    <p><strong>Stok saat ini:</strong> 2 kg (di bawah minimum)</p>
                    <p><strong>Alert otomatis:</strong> Dashboard kasih tanda merah</p>
                    <p><strong>List otomatis:</strong> Masuk daftar "Perlu Restok"</p>
                    <p><strong>Planning otomatis:</strong> Sistem sarankan beli berapa kg</p>
                  </div>
                </div>
              </div>
              
              <div class="auto-stock">
                <h5>4️⃣ WAC (Weighted Average Cost) → Hitung Otomatis</h5>
                <div class="example bg-blue-50 p-4 rounded-lg">
                  <h6 class="font-bold text-blue-800">🧮 Cara Kerja WAC:</h6>
                  <div class="text-blue-700 space-y-2">
                    <p><strong>Stok lama:</strong> 2 kg @ Rp 75.000/kg = Rp 150.000</p>
                    <p><strong>Beli baru:</strong> 5 kg @ Rp 80.000/kg = Rp 400.000</p>
                    <p><strong>Total:</strong> 7 kg dengan total nilai Rp 550.000</p>
                    <p><strong>WAC otomatis:</strong> Rp 550.000 ÷ 7 kg = <strong>Rp 78.571/kg</strong></p>
                    <p><strong>HPP terupdate:</strong> Semua resep pakai harga baru ini</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `
      },
      {
        id: "otomatis-laporan",
        title: "Otomatis Laporan dan Dashboard",
        content: `
          <div class="tutorial-content">
            <h3>📈 Sistem Otomatis Laporan</h3>
            <p>Semua laporan dan dashboard <strong>terupdate real-time</strong> tanpa perlu refresh atau hitung ulang manual.</p>
            
            <div class="auto-reports">
              <h4>📊 Yang Update Otomatis di Dashboard:</h4>
              
              <div class="dashboard-auto">
                <h5>🏠 Dashboard Utama - Update Real-time:</h5>
                <div class="updates bg-gray-50 p-4 rounded-lg">
                  <h6 class="font-bold mb-2">🔄 Update Otomatis Setiap:</h6>
                  <ul class="space-y-2 text-gray-700">
                    <li>• <strong>Ada pesanan selesai:</strong> Total penjualan hari ini naik</li>
                    <li>• <strong>Input pembelian:</strong> Total pengeluaran bertambah</li>
                    <li>• <strong>Stok berubah:</strong> Jumlah item dan nilai inventory update</li>
                    <li>• <strong>Biaya operasional:</strong> Perhitungan keuntungan bersih berubah</li>
                    <li>• <strong>Target tercapai:</strong> Progress bar dan status achievement</li>
                  </ul>
                </div>
              </div>
              
              <div class="dashboard-auto">
                <h5>💰 Panel Keuangan - Hitung Otomatis:</h5>
                <div class="calculations bg-green-50 p-4 rounded-lg">
                  <h6 class="font-bold text-green-800 mb-2">🧮 Perhitungan Otomatis:</h6>
                  <div class="text-green-700 space-y-2">
                    <p><strong>Keuntungan Kotor:</strong> Total Penjualan - Total HPP</p>
                    <p><strong>Keuntungan Bersih:</strong> Keuntungan Kotor - Biaya Operasional</p>
                    <p><strong>Margin %:</strong> (Keuntungan ÷ Penjualan) × 100%</p>
                    <p><strong>Cashflow:</strong> Pemasukan - Pengeluaran hari ini</p>
                    <p><strong>ROI:</strong> Return on Investment bulanan</p>
                  </div>
                </div>
              </div>
              
              <div class="dashboard-auto">
                <h5>📈 Grafik dan Chart - Generate Otomatis:</h5>
                <div class="charts bg-blue-50 p-4 rounded-lg">
                  <h6 class="font-bold text-blue-800 mb-2">📊 Chart Otomatis:</h6>
                  <div class="text-blue-700 space-y-2">
                    <p><strong>Trend Penjualan:</strong> Grafik 7 hari, 30 hari, 90 hari</p>
                    <p><strong>Pie Chart Produk:</strong> Proporsi penjualan per produk</p>
                    <p><strong>Bar Chart HPP:</strong> Perbandingan biaya vs revenue</p>
                    <p><strong>Line Chart Profit:</strong> Trend keuntungan per periode</p>
                    <p><strong>Donut Chart Expenses:</strong> Breakdown pengeluaran per kategori</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="auto-analysis">
              <h4>🔍 Analisis Otomatis:</h4>
              
              <div class="analysis-auto">
                <h5>1️⃣ Best/Worst Selling Products:</h5>
                <div class="analysis bg-yellow-50 p-4 rounded-lg">
                  <h6 class="font-bold text-yellow-800">🏆 Sistem Otomatis Ranking:</h6>
                  <ul class="text-yellow-700 space-y-1">
                    <li>• <strong>Best Seller:</strong> Produk paling banyak terjual + margin tertinggi</li>
                    <li>• <strong>Most Profitable:</strong> Produk dengan total keuntungan terbesar</li>
                    <li>• <strong>Worst Performer:</strong> Produk jarang laku atau margin rendah</li>
                    <li>• <strong>Seasonal Trends:</strong> Produk yang laris di waktu tertentu</li>
                  </ul>
                </div>
              </div>
              
              <div class="analysis-auto">
                <h5>2️⃣ Cost Analysis dan Rekomendasi:</h5>
                <div class="analysis bg-purple-50 p-4 rounded-lg">
                  <h6 class="font-bold text-purple-800">💡 Rekomendasi Otomatis:</h6>
                  <ul class="text-purple-700 space-y-1">
                    <li>• <strong>Harga Jual Optimal:</strong> Berdasarkan HPP + target margin</li>
                    <li>• <strong>Cost Reduction:</strong> Bahan mana yang bisa dicari alternatif</li>
                    <li>• <strong>Production Planning:</strong> Berapa banyak produksi untuk profit max</li>
                    <li>• <strong>Inventory Alert:</strong> Kapan harus restok untuk avoid stockout</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div class="sync-info bg-indigo-50 p-4 rounded-lg">
              <h4 class="font-bold text-indigo-800">🔄 Sinkronisasi Real-time:</h4>
              <div class="text-indigo-700 space-y-2">
                <p><strong>Multi-device sync:</strong> Update di HP, langsung keliatan di laptop</p>
                <p><strong>Cloud backup:</strong> Data otomatis tersimpan di cloud</p>
                <p><strong>Offline support:</strong> Bisa input walau internet lemot, sync nanti</p>
                <p><strong>Auto-save:</strong> Setiap perubahan langsung tersimpan</p>
              </div>
            </div>
          </div>
        `
      },
      {
        id: "workflow-otomatis",
        title: "Workflow Otomatis End-to-End",
        content: `
          <div class="tutorial-content">
            <h3>🔄 Workflow Otomatis Lengkap</h3>
            <p>Lihat bagaimana <strong>satu aksi bisa trigger banyak update otomatis</strong> di seluruh sistem.</p>
            
            <div class="complete-workflow">
              <h4>🍜 Contoh: Workflow Lengkap "Terima Pesanan Bakso"</h4>
              
              <div class="workflow-steps">
                <div class="step bg-blue-50 p-4 rounded-lg mb-4">
                  <h5 class="font-bold text-blue-800">Step 1: Customer Pesan Bakso (Input Manual)</h5>
                  <p class="text-blue-700">Anda input: "Bu Sari pesan 3 porsi bakso @ Rp 15.000 = Rp 45.000"</p>
                </div>
                
                <div class="step bg-green-50 p-4 rounded-lg mb-4">
                  <h5 class="font-bold text-green-800">Step 2: Sistem Otomatis Cek Stok</h5>
                  <div class="text-green-700 space-y-1">
                    <p>• Resep bakso: 1 kg daging untuk 10 porsi</p>
                    <p>• Butuh: 3 porsi = 0.3 kg daging</p>
                    <p>• Stok saat ini: 2 kg (cukup)</p>
                    <p>• <strong>Status:</strong> ✅ Bisa diproduksi</p>
                  </div>
                </div>
                
                <div class="step bg-yellow-50 p-4 rounded-lg mb-4">
                  <h5 class="font-bold text-yellow-800">Step 3: Produksi Dimulai (Update Status)</h5>
                  <div class="text-yellow-700 space-y-1">
                    <p>Anda ubah status: "Baru" → "Proses"</p>
                    <p><strong>Otomatis terjadi:</strong></p>
                    <p>• Stok daging: 2 kg → 1.7 kg</p>
                    <p>• Stok tepung, bumbu ikut berkurang sesuai resep</p>
                    <p>• Dashboard: Pesanan dalam proses +1</p>
                  </div>
                </div>
                
                <div class="step bg-purple-50 p-4 rounded-lg mb-4">
                  <h5 class="font-bold text-purple-800">Step 4: Pesanan Selesai (Final Status)</h5>
                  <div class="text-purple-700 space-y-1">
                    <p>Anda ubah status: "Proses" → "Selesai"</p>
                    <p><strong>Otomatis terjadi:</strong></p>
                    <p>• Pemasukan: +Rp 45.000</p>
                    <p>• HPP tercatat: Rp 29.325 (sesuai resep)</p>
                    <p>• Keuntungan kotor: Rp 15.675</p>
                    <p>• Overhead terdistribusi: Rp 450</p>
                    <p>• Keuntungan bersih: Rp 15.225</p>
                  </div>
                </div>
                
                <div class="step bg-red-50 p-4 rounded-lg mb-4">
                  <h5 class="font-bold text-red-800">Step 5: Dashboard Terupdate Real-time</h5>
                  <div class="text-red-700 space-y-1">
                    <p><strong>Panel Keuangan:</strong></p>
                    <p>• Total penjualan hari ini: +Rp 45.000</p>
                    <p>• Keuntungan hari ini: +Rp 15.225</p>
                    <p>• Margin: 33.8% (healthy)</p>
                    <p><strong>Panel Pesanan:</strong></p>
                    <p>• Pesanan selesai: +1</p>
                    <p>• Revenue dari pesanan: +Rp 45.000</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="automation-benefits">
              <h4>✨ Manfaat Sistem Otomatis:</h4>
              
              <div class="benefits grid grid-cols-2 gap-4">
                <div class="benefit bg-green-100 p-4 rounded-lg">
                  <h5 class="font-bold text-green-800">🚀 Hemat Waktu</h5>
                  <p class="text-green-700 text-sm">1 input pesanan = 15+ update otomatis di berbagai bagian</p>
                </div>
                <div class="benefit bg-blue-100 p-4 rounded-lg">
                  <h5 class="font-bold text-blue-800">🎯 Akurasi Tinggi</h5>
                  <p class="text-blue-700 text-sm">Tidak ada human error dalam perhitungan</p>
                </div>
                <div class="benefit bg-purple-100 p-4 rounded-lg">
                  <h5 class="font-bold text-purple-800">📈 Real-time Insight</h5>
                  <p class="text-purple-700 text-sm">Laporan dan analisis selalu up-to-date</p>
                </div>
                <div class="benefit bg-orange-100 p-4 rounded-lg">
                  <h5 class="font-bold text-orange-800">📊 Konsistensi Data</h5>
                  <p class="text-orange-700 text-sm">Semua angka selalu sinkron di seluruh sistem</p>
                </div>
              </div>
            </div>
            
            <div class="monitoring-tips bg-gray-50 p-4 rounded-lg">
              <h4 class="font-bold text-gray-800">👁️ Tips Monitoring Otomatis:</h4>
              <div class="text-gray-700 space-y-2">
                <p><strong>Cek harian:</strong> Pastikan semua angka masuk akal</p>
                <p><strong>Review mingguan:</strong> Bandingkan dengan catatan manual</p>
                <p><strong>Audit bulanan:</strong> Cocokkan dengan stok fisik dan kas</p>
                <p><strong>Backup data:</strong> Export laporan setiap bulan</p>
              </div>
            </div>
          </div>
        `
      }
    ]
  },
  {
    id: 12,
    title: "Fitur Otomatis Lanjutan",
    subtitle: "Backup, Sync, dan Notifikasi Otomatis",
    duration: "12 menit",
    icon: "🤖",
    sections: [
      {
        id: "backup-otomatis",
        title: "Backup dan Sinkronisasi Otomatis",
        content: `
          <div class="tutorial-content">
            <h3>🤖 Sistem Backup Otomatis</h3>
            <p>Data Anda <strong>aman dan ter-backup otomatis</strong> tanpa perlu khawatir kehilangan informasi bisnis.</p>
            
            <div class="auto-backup">
              <h4>💾 Yang Ter-backup Otomatis:</h4>
              
              <div class="backup-feature">
                <h5>1️⃣ Cloud Backup Real-time</h5>
                <div class="process bg-blue-50 p-4 rounded-lg">
                  <h6 class="font-bold text-blue-800">☁️ Otomatis ke Cloud:</h6>
                  <ul class="text-blue-700 space-y-2">
                    <li>• <strong>Setiap perubahan data:</strong> Langsung tersimpan di cloud</li>
                    <li>• <strong>Multiple backup:</strong> Data disimpan di beberapa server</li>
                    <li>• <strong>Versioning:</strong> Bisa restore ke versi sebelumnya jika ada masalah</li>
                    <li>• <strong>Enkripsi:</strong> Data dienkripsi untuk keamanan</li>
                    <li>• <strong>Access anywhere:</strong> Login dari perangkat manapun, data sama</li>
                  </ul>
                </div>
              </div>
              
              <div class="backup-feature">
                <h5>2️⃣ Multi-device Synchronization</h5>
                <div class="process bg-green-50 p-4 rounded-lg">
                  <h6 class="font-bold text-green-800">🔄 Sync Antar Device:</h6>
                  <div class="text-green-700 space-y-2">
                    <p><strong>Scenario:</strong> Anda punya HP dan laptop</p>
                    <ul class="space-y-1">
                      <li>• Input pesanan di HP → Langsung muncul di laptop</li>
                      <li>• Update stok di laptop → Dashboard HP terupdate</li>
                      <li>• Lihat laporan di tablet → Data sama persis</li>
                      <li>• Offline di HP → Sync otomatis saat online lagi</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div class="backup-feature">
                <h5>3️⃣ Offline Mode dengan Auto-sync</h5>
                <div class="process bg-yellow-50 p-4 rounded-lg">
                  <h6 class="font-bold text-yellow-800">📵 Offline Support:</h6>
                  <ul class="text-yellow-700 space-y-2">
                    <li>• <strong>Internet lemot:</strong> Aplikasi tetap bisa digunakan</li>
                    <li>• <strong>Data tersimpan lokal:</strong> Di browser/device Anda</li>
                    <li>• <strong>Auto-sync:</strong> Begitu internet normal, data langsung sync</li>
                    <li>• <strong>Conflict resolution:</strong> Sistem pintar gabungkan data</li>
                    <li>• <strong>No data loss:</strong> Tidak ada data yang hilang</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        `
      },
      {
        id: "notifikasi-otomatis",
        title: "System Notifikasi dan Alert Otomatis",
        content: `
          <div class="tutorial-content">
            <h3>🔔 Sistem Notifikasi Cerdas</h3>
            <p>Sistem akan <strong>kasih tahu Anda otomatis</strong> untuk hal-hal penting yang perlu perhatian.</p>
            
            <div class="auto-notifications">
              <h4>🎆 Jenis Notifikasi Otomatis:</h4>
              
              <div class="notification-type">
                <h5>1️⃣ Alert Stok Kritis</h5>
                <div class="alert bg-red-50 p-4 rounded-lg">
                  <h6 class="font-bold text-red-800">⚠️ Alert Otomatis:</h6>
                  <div class="text-red-700 space-y-2">
                    <p><strong>Kapan muncul:</strong> Stok di bawah minimum yang Anda set</p>
                    <p><strong>Dimana muncul:</strong></p>
                    <ul class="space-y-1">
                      <li>• Badge merah di menu Gudang</li>
                      <li>• Pop-up notification di dashboard</li>
                      <li>• List "Perlu Restok" di dashboard</li>
                      <li>• Email reminder (jika diaktifkan)</li>
                    </ul>
                    <p><strong>Aksi otomatis:</strong> Sistem kasih rekomendasi jumlah pembelian</p>
                  </div>
                </div>
              </div>
              
              <div class="notification-type">
                <h5>2️⃣ Pesanan Pending Alert</h5>
                <div class="alert bg-orange-50 p-4 rounded-lg">
                  <h6 class="font-bold text-orange-800">🕓 Reminder Otomatis:</h6>
                  <div class="text-orange-700 space-y-2">
                    <p><strong>Pesanan > 2 jam belum diproses:</strong> Alert kuning</p>
                    <p><strong>Pesanan > 4 jam:</strong> Alert merah + sound notification</p>
                    <p><strong>Delivery terlambat:</strong> Kasih tahu customer otomatis</p>
                    <p><strong>Customer menunggu:</strong> Reminder follow-up</p>
                  </div>
                </div>
              </div>
              
              <div class="notification-type">
                <h5>3️⃣ Target Achievement Notification</h5>
                <div class="alert bg-green-50 p-4 rounded-lg">
                  <h6 class="font-bold text-green-800">🎯 Achievement Unlock:</h6>
                  <div class="text-green-700 space-y-2">
                    <p><strong>Target harian tercapai:</strong> 🎉 Congratulations popup</p>
                    <p><strong>Record penjualan:</strong> 🏆 New record celebration</p>
                    <p><strong>Milestone bulanan:</strong> 💪 Summary achievement</p>
                    <p><strong>Profit margin naik:</strong> 📈 Progress notification</p>
                  </div>
                </div>
              </div>
              
              <div class="notification-type">
                <h5>4️⃣ Business Health Alert</h5>
                <div class="alert bg-purple-50 p-4 rounded-lg">
                  <h6 class="font-bold text-purple-800">🎨 Health Check:</h6>
                  <div class="text-purple-700 space-y-2">
                    <p><strong>Margin tipis < 20%:</strong> Warning dan tips optimasi</p>
                    <p><strong>Cashflow negatif:</strong> Alert urgensi + saran</p>
                    <p><strong>HPP naik drastis:</strong> Investigation reminder</p>
                    <p><strong>Produk tidak laku:</strong> Review recommendation</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `
      },
      {
        id: "automasi-lanjutan",
        title: "Fitur Automasi Lanjutan",
        content: `
          <div class="tutorial-content">
            <h3>🤯 Automasi Tingkat Lanjut</h3>
            <p>Fitur-fitur pintar yang <strong>belajar dari pola bisnis Anda</strong> dan memberikan rekomendasi otomatis.</p>
            
            <div class="advanced-automation">
              <h4>🧠 AI-powered Features:</h4>
              
              <div class="ai-feature">
                <h5>1️⃣ Smart Reorder Suggestions</h5>
                <div class="feature bg-blue-50 p-4 rounded-lg">
                  <h6 class="font-bold text-blue-800">🧑‍💼 Sistem Belajar:</h6>
                  <div class="text-blue-700 space-y-2">
                    <p><strong>Analisis pola pembelian:</strong> Berapa sering beli setiap bahan</p>
                    <p><strong>Seasonal adjustment:</strong> Lebaran butuh lebih banyak, normal hari biasa</p>
                    <p><strong>Auto-calculate:</strong> Berapa kg optimal untuk beli</p>
                    <p><strong>Price prediction:</strong> Waktu terbaik untuk beli (harga murah)</p>
                    <p><strong>Supplier recommendation:</strong> Mana yang paling ekonomis</p>
                  </div>
                </div>
              </div>
              
              <div class="ai-feature">
                <h5>2️⃣ Dynamic Pricing Recommendations</h5>
                <div class="feature bg-green-50 p-4 rounded-lg">
                  <h6 class="font-bold text-green-800">💰 Smart Pricing:</h6>
                  <div class="text-green-700 space-y-2">
                    <p><strong>Market analysis:</strong> Bandingkan harga dengan kompetitor</p>
                    <p><strong>Demand forecasting:</strong> Kapan bisa naik harga, kapan harus turun</p>
                    <p><strong>Margin optimization:</strong> Harga optimal untuk max profit</p>
                    <p><strong>Bundle suggestions:</strong> Produk mana yang cocok dijual paket</p>
                    <p><strong>Promo timing:</strong> Kapan waktu terbaik kasih diskon</p>
                  </div>
                </div>
              </div>
              
              <div class="ai-feature">
                <h5>3️⃣ Predictive Analytics</h5>
                <div class="feature bg-purple-50 p-4 rounded-lg">
                  <h6 class="font-bold text-purple-800">🔮 Future Prediction:</h6>
                  <div class="text-purple-700 space-y-2">
                    <p><strong>Sales forecasting:</strong> Prediksi penjualan minggu/bulan depan</p>
                    <p><strong>Cash flow projection:</strong> Kapan butuh modal tambahan</p>
                    <p><strong>Inventory planning:</strong> Bahan apa yang akan habis kapan</p>
                    <p><strong>Seasonal planning:</strong> Prepare untuk musim ramai/sepi</p>
                    <p><strong>Growth opportunities:</strong> Area mana yang bisa dikembangkan</p>
                  </div>
                </div>
              </div>
              
              <div class="ai-feature">
                <h5>4️⃣ Business Intelligence Dashboard</h5>
                <div class="feature bg-orange-50 p-4 rounded-lg">
                  <h6 class="font-bold text-orange-800">📊 Smart Insights:</h6>
                  <div class="text-orange-700 space-y-2">
                    <p><strong>Performance anomalies:</strong> Deteksi pola tidak normal otomatis</p>
                    <p><strong>Opportunity alerts:</strong> "Hari ini laris, tambah produksi!"</p>
                    <p><strong>Cost optimization:</strong> "Ganti supplier ini bisa hemat 15%"</p>
                    <p><strong>Market trends:</strong> "Produk vegan lagi trend, coba buat menu"</p>
                    <p><strong>Action recommendations:</strong> Step konkret untuk improve bisnis</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="automation-control">
              <h4>⚙️ Kontrol Automation:</h4>
              <div class="control bg-gray-50 p-4 rounded-lg">
                <h5 class="font-bold text-gray-800">Anda Tetap Punya Kontrol Penuh:</h5>
                <div class="text-gray-700 space-y-2">
                  <p><strong>On/Off switches:</strong> Bisa matikan fitur tertentu jika tidak perlu</p>
                  <p><strong>Sensitivity settings:</strong> Atur seberapa sering dapat notifikasi</p>
                  <p><strong>Custom thresholds:</strong> Set sendiri batas-batas alert</p>
                  <p><strong>Manual override:</strong> Selalu bisa input manual jika sistem salah</p>
                  <p><strong>Privacy settings:</strong> Data sensitif tidak akan dishare</p>
                </div>
              </div>
            </div>
          </div>
        `
      }
    ]
  },
  {
    id: 13,
    title: "Gabung Channel WhatsApp",
    subtitle: "Bergabung dengan Komunitas UMKM",
    duration: "3 menit",
    icon: "📱",
    sections: [
      {
        id: "whatsapp-channel",
        title: "Cara Join Channel WhatsApp HPP Calculator",
        content: `
          <div class="tutorial-content">
            <h3>📱 Kenapa Harus Join Channel WhatsApp?</h3>
            <p>Channel WhatsApp HPP Calculator adalah tempat untuk <strong>mendapatkan tips bisnis, update fitur terbaru, dan sharing pengalaman</strong> dengan sesama UMKM.</p>
            
            <div class="benefits-box bg-green-50 p-4 rounded-lg border border-green-200 my-4">
              <h4 class="font-bold text-green-800 mb-3">🎯 Yang Akan Anda Dapatkan:</h4>
              <ul class="text-green-700 space-y-2">
                <li>• <strong>Tips bisnis mingguan:</strong> Strategi praktis tingkatkan profit</li>
                <li>• <strong>Update fitur baru:</strong> Fitur terbaru aplikasi HPP Calculator</li>
                <li>• <strong>Sharing experience:</strong> Cerita sukses dari UMKM lain</li>
                <li>• <strong>Diskusi HPP:</strong> Tanya jawab seputar perhitungan HPP</li>
                <li>• <strong>Template gratis:</strong> Excel template, SOP, dll</li>
                <li>• <strong>Promo khusus:</strong> Diskon untuk upgrade premium</li>
              </ul>
            </div>
            
            <h3>📲 Cara Join Channel:</h3>
            <div class="steps-container">
              <div class="step-box bg-blue-50 p-4 rounded-lg border border-blue-200 my-3">
                <h4 class="font-bold text-blue-800 mb-2">1️⃣ Klik Link Channel</h4>
                <p class="text-blue-700 mb-3">Klik tombol di bawah ini untuk langsung join channel WhatsApp:</p>
                <a href="https://whatsapp.com/channel/0029VaAqXWRELcJ2nBYNDj1l" 
                   target="_blank" 
                   class="inline-block bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg">
                  📱 Join Channel WhatsApp Sekarang
                </a>
              </div>
              
              <div class="step-box bg-orange-50 p-4 rounded-lg border border-orange-200 my-3">
                <h4 class="font-bold text-orange-800 mb-2">2️⃣ Atau Manual via WhatsApp</h4>
                <p class="text-orange-700 mb-2">Jika link tidak berfungsi, bisa join manual:</p>
                <ol class="list-decimal pl-5 text-orange-700 space-y-1">
                  <li>Buka WhatsApp di HP Anda</li>
                  <li>Klik icon "Cari" atau "Search"</li>
                  <li>Ketik: <strong>"HPP Calculator untuk UMKM"</strong></li>
                  <li>Pilih channel yang muncul</li>
                  <li>Klik "Ikuti" atau "Follow"</li>
                </ol>
              </div>
              
              <div class="step-box bg-purple-50 p-4 rounded-lg border border-purple-200 my-3">
                <h4 class="font-bold text-purple-800 mb-2">3️⃣ Copy Link Manual</h4>
                <p class="text-purple-700 mb-2">Atau copy link ini dan paste di WhatsApp:</p>
                <div class="bg-gray-100 p-2 rounded border text-sm font-mono break-all">
                  https://whatsapp.com/channel/0029VaAqXWRELcJ2nBYNDj1l
                </div>
              </div>
            </div>
            
            <div class="community-info bg-yellow-50 p-4 rounded-lg border border-yellow-200 my-4">
              <h4 class="font-bold text-yellow-800 mb-3">👥 Tentang Komunitas:</h4>
              <ul class="text-yellow-700 space-y-2">
                <li>• <strong>Channel Khusus UMKM:</strong> Fokus pada bisnis skala kecil-menengah</li>
                <li>• <strong>Gratis selamanya:</strong> Tidak ada biaya langganan</li>
                <li>• <strong>Content berkualitas:</strong> Hanya tips yang sudah terbukti efektif</li>
                <li>• <strong>Update rutin:</strong> Minimal 2-3 konten per minggu</li>
                <li>• <strong>Support langsung:</strong> Admin siap bantu jika ada pertanyaan</li>
              </ul>
            </div>
            
            <div class="example-content bg-gray-50 p-4 rounded-lg border border-gray-200 my-4">
              <h4 class="font-bold text-gray-800 mb-3">📋 Contoh Content Channel:</h4>
              <div class="space-y-3">
                <div class="content-example">
                  <h5 class="font-semibold text-gray-700">💡 Tips Bisnis:</h5>
                  <p class="text-gray-600 text-sm italic">"Cara Kurangi HPP 15% dengan Negosiasi Smart ke Supplier"</p>
                </div>
                <div class="content-example">
                  <h5 class="font-semibold text-gray-700">📊 Case Study:</h5>
                  <p class="text-gray-600 text-sm italic">"Bakso Bu Sari: Dari Rugi ke Profit 40% dalam 3 Bulan"</p>
                </div>
                <div class="content-example">
                  <h5 class="font-semibold text-gray-700">🆕 Update Fitur:</h5>
                  <p class="text-gray-600 text-sm italic">"Fitur Baru: Import Data Excel Langsung ke HPP Calculator"</p>
                </div>
                <div class="content-example">
                  <h5 class="font-semibold text-gray-700">🎁 Template Gratis:</h5>
                  <p class="text-gray-600 text-sm italic">"Download Excel Template Analisis Break Even Point"</p>
                </div>
              </div>
            </div>
            
            <div class="cta-final bg-green-50 p-4 rounded-lg border border-green-200 text-center my-4">
              <h4 class="font-bold text-green-800 mb-2">🚀 Jangan Lewatkan!</h4>
              <p class="text-green-700 mb-3">Join sekarang dan dapatkan akses ke komunitas UMKM yang supportive!</p>
              <a href="https://whatsapp.com/channel/0029VaAqXWRELcJ2nBYNDj1l" 
                 target="_blank" 
                 class="inline-block bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg text-lg">
                📱 Join Channel Sekarang Juga!
              </a>
            </div>
            
            <div class="note-box bg-blue-50 p-3 rounded border border-blue-200 mt-4">
              <p class="text-blue-700 text-sm">
                <strong>💡 Catatan:</strong> Channel ini adalah one-way broadcast, jadi Anda hanya menerima pesan dari admin. 
                Untuk diskusi atau tanya jawab, akan ada group terpisah yang linknya akan dibagikan di channel.
              </p>
            </div>
          </div>
        `
      }
    ]
  }
];

export const getTutorialById = (id) => {
  return tutorialData.find(tutorial => tutorial.id === parseInt(id));
};

export const getAllTutorials = () => {
  return tutorialData;
};
