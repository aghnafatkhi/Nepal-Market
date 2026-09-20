# Nepal Market - Marketplace Jual Beli Komunitas Lokal

Nepal Market adalah platform marketplace C2C (Customer to Customer) yang dirancang khusus untuk komunitas sekolah/lokal guna memfasilitasi transaksi jual beli barang bekas dan baru dengan kesepakatan tempat serah terima (COD/ketemuan) secara aman dan transparan.

---

## 🚀 Fitur Utama

- **Katalog & Navigasi Cepat:** Feed produk interaktif, filter kategori, rentang harga, kondisi barang, dan pengurutan cerdas.
- **Pencarian & Pagination Teroptimasi:** Dukungan URL query terintegrasi dan lazy-loading/pagination tanpa membebani database.
- **Manajemen Iklan Mandiri (CRUD):** Tambah barang, multi-foto hingga 5 gambar, edit detail, tandai barang sudah terjual, dan hapus listing.
- **Keamanan & RLS Supabase:** Proteksi penuh di level database (Row Level Security); pengguna tidak dapat memanipulasi atau menghapus data seller lain.
- **Penyimpanan Gambar Aman:** Supabase Storage dengan isolasi folder per-seller (`product-images/{user_id}/*`) dan validasi tipe file (JPG, PNG, WebP, max 5MB).
- **Komunikasi Langsung:** Tombol kontak WhatsApp dan Instagram langsung terhubung ke seller.
- **Fitur Wishlist / Simpan:** Sinkronisasi bookmark barang lokal & tersinkron saat login.
- **Sistem Moderasi & Laporan:** Pelaporan iklan bermasalah dan dashboard admin khusus untuk memoderasi status barang (`active`, `hidden`, `sold`, `removed`).

---

## 🛠️ Panduan Menjalankan Secara Lokal

### 1. Prasyarat
- **Node.js**: Versi 18.x atau lebih baru (direkomendasikan Node.js 20 LTS).
- **NPM** atau **Bun** / **Yarn** / **PNPM**.
- Akun **Supabase** (Free tier atau Pro).

### 2. Instalasi Dependensi
```bash
# Clone repository dan masuk ke direktori proyek
git clone <repository-url>
cd nepal-market

# Pasang paket dependensi
npm install
```

### 3. Konfigurasi Lingkungan (`.env.local`)
Salin berkas `.env.example` menjadi `.env.local`:
```bash
cp .env.example .env.local
```

Isi variabel lingkungan pada berkas `.env.local`:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Production Host URL (opsional untuk metadata & sitemap)
APP_URL=http://localhost:3000
```
> ⚠️ **PENTING:** Jangan pernah memasukkan `SUPABASE_SERVICE_ROLE_KEY` ke dalam variabel lingkungan frontend. Gunakan hanya `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

### 4. Menjalankan Server Pengembangan
```bash
npm run dev
```
Buka peramban di `http://localhost:3000`.

---

## 🗄️ Konfigurasi Supabase (Database & Storage)

### 1. Migrasi Tabel & RLS (Schema)
Untuk proyek Supabase baru, jalankan `supabase_setup.sql` di **Supabase Dashboard -> SQL Editor**:
- Membuat tabel: `profiles`, `products`, `product_images`, `favorites`, `reports`, dan `moderation_logs`.
- Mengaktifkan Row Level Security (RLS) pada semua tabel.
- Menyiapkan trigger otomatis `on_auth_user_created` untuk membuat profil pengguna saat mendaftar.

### 2. Setup Storage Bucket (`product-images`)
Jalankan berkas `supabase/storage_setup.sql` di SQL Editor:
- Membuat bucket publik `product-images`.
- Memberikan izin `SELECT` untuk publik.
- Membatasi izin `INSERT` dan `DELETE` hanya pada folder pengguna masing-masing (`(storage.foldername(name))[1] = auth.uid()::text`).

### 3. Perbaikan fitur setelah tahap 8
Jalankan `supabase/post_eight_stage_fix.sql` lalu `supabase/harden_existing_functions.sql` setelah setup di atas. Keduanya menambah bucket `avatars`, kolom penangguhan, log moderasi, aturan akses admin, dan mengamankan fungsi trigger lama. **Pada proyek Supabase yang sudah digunakan, jalankan hanya kedua berkas perbaikan ini.** Jangan ulangi `supabase_setup.sql` karena policy lama sudah ada dan SQL dasar tidak dirancang untuk dijalankan ulang.

### 4. Konfigurasi Autentikasi & Redirect URLs
Di **Supabase Dashboard -> Authentication -> URL Configuration**:
- **Site URL:** `http://localhost:3000` (saat pengembangan) atau URL domain produksi Vercel.
- **Redirect URLs:** Tambahkan:
  - `http://localhost:3000/**`
  - `https://your-domain.vercel.app/**`

### 4. Mengangkat Akun Admin Moderasi
Untuk memberikan hak akses admin kepada akun tertentu, jalankan perintah SQL berikut di Supabase SQL Editor:
```sql
UPDATE public.profiles
SET role = 'admin'
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'aghna1011@gmail.com'
);
```

---

## 🚢 Panduan Deployment ke Vercel

1. **Hubungkan Repository ke Vercel:**
   - Masuk ke dashboard Vercel dan impor repository proyek ini.
   - Pilih framework preset: **Next.js**.

2. **Pengaturan Environment Variables di Vercel:**
   Tambahkan variabel berikut pada menu **Project Settings -> Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL` = *(URL Supabase project Anda)*
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = *(Anon Public Key Supabase)*
   - `APP_URL` = `https://your-domain.vercel.app`

3. **Build & Output Settings:**
   - Build Command: `npm run build`
   - Output Directory: `.next` (default Next.js)

4. **Deploy:**
   - Klik **Deploy**.
   - Setelah deploy selesai, daftarkan domain Vercel ke **Supabase Authentication -> Redirect URLs**.

---

## 🔍 Audit & Verifikasi Kualitas

Sebelum mendeploy ke produksi, selalu pastikan seluruh pemeriksaan berikut berhasil:
```bash
# Pemeriksaan tipe data TypeScript
npx tsc --noEmit

# Pemeriksaan linter ESLint
npm run lint

# Kompilasi build produksi Next.js
npm run build
```
