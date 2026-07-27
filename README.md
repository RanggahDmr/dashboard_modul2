# Dashboard Analisis & Simulasi Insentif AO (Modul 2) 🚀

Dashboard web interaktif yang dibangun menggunakan **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS / Vanilla CSS**, dan **Prisma ORM** dengan database **MySQL**. Aplikasi ini dirancang khusus untuk memonitor performa Account Officer (AO), melakukan penimbangan bobot KPI utama secara dinamis, menyimulasikan alokasi anggaran insentif menggunakan metode *Performance Pool*, serta mengelola data AO baik melalui database maupun import dari file Excel.

---

## 🌟 Fitur Utama

1. **📊 Ringkasan Eksekutif & KPI Utama**
   - Visualisasi tingkat kelulusan insentif (*Eligible AO* vs *Not Eligible*).
   - Pemantauan metrik krusial: Rata-rata Skor AO, persentase kelulusan, dan estimasi total insentif yang terdistribusi.
   - Grafik interaktif (Chart.js): **Doughnut Chart** untuk distribusi kategori skor (Sangat Tinggi, Tinggi, Sedang, Tidak Memenuhi) dan **Scatter Chart** untuk analisis korelasi antara *Flowrate* dengan Skor Akhir AO.

2. **⚙️ Simulasi Anggaran & Penimbangan Bobot KPI**
   - **4 KPI Utama**: Setor Awal (SI) / CLBK, Setoran Lanjutan (SL), Flowrate (FR), dan Full Payment (FP).
   - Penyesuaian bobot KPI secara langsung (interaktif) dengan indikator otomatis untuk memastikan total bobot selalu **100%**.
   - **Simulasi Performance Pool**: Penentuan anggaran insentif, ambang batas kelulusan skor minimal, dan perhitungan otomatis distribusi insentif tiap range skor serta potensi efisiensi (*saving*) anggaran.

3. **📁 Manajemen & Import Data AO**
   - Tabel direktori AO yang dilengkapi dengan sistem *badge* status kelulusan, pencarian instan berdasarkan nama/ID AO, dan pemilahan berdasarkan unit kerja/cabang.
   - **Upload Excel (.xlsx)**: Fitur *drag-and-drop* untuk memperbarui atau mengimpor data KPI AO secara masal langsung ke dalam sistem database.

---

## 🛠️ Tech Stack & Dependensi

- **Core Framework**: [Next.js 16](https://nextjs.org/) (App Router) & [React 19](https://react.dev/)
- **Bahasa**: [TypeScript](https://www.typescriptlang.org/)
- **Database & ORM**: MySQL & [Prisma ORM 6.x](https://www.prisma.io/) (+ `mysql2`)
- **Visualisasi Grafik**: `chart.js` & `react-chartjs-2`, `recharts`
- **Utility & Pemrosesan File**: `xlsx` (SheetJS) untuk pemrosesan Excel, `zod`, `clsx`, `tailwind-merge`, `lucide-react`, `framer-motion`

---

## 📋 Prasyarat Sistem (Prerequisites)

Sebelum menjalankan proyek ini di lingkungan lokal Anda, pastikan telah memasang aplikasi berikut:
- **Node.js**: Versi 18.x, 20.x, atau yang lebih baru ([Download Node.js](https://nodejs.org/)).
- **MySQL Server**: Versi 5.7 / 8.0+ (Bisa menggunakan server lokal dari [Laragon](https://laragon.org/), [XAMPP](https://www.apachefriends.org/), atau MySQL Standalone).
- **Package Manager**: `npm`, `pnpm`, `yarn`, atau `bun`.

---

## ⚙️ Setup & Konfigurasi Lingkungan (*Environment Variables*)

Aplikasi membutuhkan konfigurasi koneksi database MySQL. 

1. Duplikasi berkas contoh variabel lingkungan `.env.example` menjadi `.env` (atau langsung buat file `.env` di root direktori proyek):
   ```bash
   cp .env.example .env
   ```
2. Buka berkas `.env` dan sesuaikan nilainya dengan konfigurasi server MySQL lokal/server Anda:

   ```ini
   # =====================================================================
   # KONFIGURASI DATABASE MYSQL
   # =====================================================================
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASS=                # Isi password MySQL Anda (kosongkan bila tidak ada)
   DB_NAME=ao_performance_db

   # =====================================================================
   # PRISMA DATABASE URL
   # =====================================================================
   # Format: mysql://USER:PASSWORD@HOST:PORT/DATABASE_NAME
   DATABASE_URL="mysql://root@localhost:3306/ao_performance_db"
   ```

> [!IMPORTANT]
> Pastikan nama database pada variabel `DB_NAME` dan `DATABASE_URL` adalah sama (contoh default: `ao_performance_db`). Jika MySQL Anda menggunakan password, tambahkan password tersebut setelah `@USER:` pada `DATABASE_URL` (misal: `mysql://root:rahasia123@localhost:3306/ao_performance_db`).

---

## 🚀 Panduan Instalasi & Menjalankan Aplikasi

Ikuti langkah-langkah berikut untuk setup dari awal hingga aplikasi berjalan di browser:

### 1. Instalasi Dependensi
Buka terminal di dalam folder proyek (`c:\laragon\www\dashboard_modul_2`) lalu jalankan perintah:
```bash
npm install
# atau
pnpm install
```

### 2. Persiapan Database MySQL
Pastikan servis MySQL lokal Anda (Laragon/XAMPP) sudah berjalan. Buat database baru di MySQL dengan nama sesuai konfigurasi `.env` Anda:
```sql
CREATE DATABASE ao_performance_db;
```

### 3. Sinkronisasi Skema Database (Prisma Migrate / Push)
Jalankan perintah berikut untuk membuat tabel-tabel yang dibutuhkan ke dalam database MySQL Anda berdasarkan definisi di `prisma/schema.prisma`:
```bash
npx prisma db push
# atau jika menggunakan sistem migrasi:
npx prisma migrate dev
```

### 4. Seeding Data Awal (*Opsional*)
Jika Anda ingin mengisi database dengan data dummy awal untuk keperluan pengujian dan demonstrasi, jalankan script seeder Prisma:
```bash
npx prisma db seed
```
*(Catatan: Anda juga dapat menambahkan data sendiri melalui fitur **Upload Excel (.xlsx)** yang tersedia di halaman antarmuka dashboard).*

### 5. Menjalankan Server Pengembangan (*Development Server*)
Setelah setup database selesai, jalankan server pengembangan:
```bash
npm run dev
# atau
pnpm dev
```

Aplikasi akan berjalan secara otomatis di port `3000`. Buka browser Anda dan akses:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 📦 Build untuk Produksi (*Production*)

Untuk membangun dan menjalankan aplikasi dalam mode produksi berkinerja tinggi:

1. Buat *build* bundle produksi:
   ```bash
   npm run build
   ```
2. Jalankan server produksi Next.js:
   ```bash
   npm start
   ```

---

## 📁 Struktur Direktori Proyek

```text
dashboard_modul_2/
├── prisma/
│   ├── schema.prisma          # Skema database ORM Prisma (Tabel AO, Kpi, Ranking, dll)
│   └── seed.ts                # Script seeder untuk pengisian data dummy
├── public/                    # Aset statis (gambar, ikon, sampel file Excel)
├── src/
│   ├── app/
│   │   ├── api/               # API Endpoints (App Router Backend)
│   │   │   ├── ao/            # API manajemen & pengambilan data AO
│   │   │   ├── dashboard/     # API perhitungan ranking & performa dashboard
│   │   │   └── upload/excel/  # API pemrosesan upload dan import file Excel (.xlsx)
│   │   ├── globals.css        # Sistem desain (variabel warna, animasi kartu, UI styling)
│   │   ├── layout.tsx         # Root Layout aplikasi
│   │   └── page.tsx           # Halaman utama (Dashboard Interaktif & Simulasi)
├── .env                       # Variabel lingkungan aktif (tidak masuk Git)
├── .env.example               # Template contoh variabel lingkungan
├── package.json               # Daftar dependensi & script NPM
└── tsconfig.json              # Konfigurasi TypeScript
```

---

## 💡 Panduan Troubleshooting Umum

- **Error `Can't reach database server at localhost:3306`**:
  Pastikan servis MySQL lokal Anda (Laragon / XAMPP) dalam kondisi aktif (Running). Cek kembali port apakah sudah benar di `3306` atau menggunakan port lain (misal `3307`).
- **Error `Table 'ao_performance_db.xxx' doesn't exist`**:
  Berarti tabel database belum terbentuk. Jalankan perintah `npx prisma db push` di terminal untuk menyinkronkan skema.
- **Grafik atau Nominal Uang Tidak Tampil**:
  Pastikan database tidak kosong. Gunakan fitur *Upload Excel* di bagian bawah dashboard atau jalankan perintah `npx prisma db seed`.

---
*Dibuat untuk kebutuhan Monitoring & Analisis Performa Account Officer (AO) - Modul 2.*
