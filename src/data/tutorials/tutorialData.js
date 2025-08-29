export const tutorialData = [
  {
    id: 1,
    title: "Selamat Datang di Sistem HPP",
    subtitle: "Panduan Lengkap Memulai Perhitungan HPP untuk UMKM",
    duration: "8 menit",
    difficulty: "Pemula",
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
    difficulty: "Pemula",
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
    difficulty: "Pemula",
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
    difficulty: "Menengah",
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
    difficulty: "Pemula",
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
    difficulty: "Menengah",
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
    difficulty: "Lanjutan",
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
  }
];

export const getTutorialById = (id) => {
  return tutorialData.find(tutorial => tutorial.id === parseInt(id));
};

export const getAllTutorials = () => {
  return tutorialData;
};
