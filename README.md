# Nepal Market

Marketplace lokal dengan Next.js dan Supabase. Seller mengunggah foto barang ke Supabase Storage; pembeli menghubungi seller di luar aplikasi.

## Menjalankan lokal

1. Pasang dependensi dengan `npm install` atau `bun install`.
2. Salin `.env.example` ke `.env.local`. Isi `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` dengan Project URL dan publishable/anon key dari Supabase. Jangan gunakan service role key di browser.
3. Jalankan `npm run dev` dan buka `http://localhost:3000`.

Di project Supabase baru, jalankan `supabase/schema.sql` sekali di SQL Editor, lalu `supabase/storage_setup.sql`. Di project Nepal Market yang sudah terhubung, kedua langkah itu telah diterapkan; jangan jalankan ulang `schema.sql` karena policy dapat sudah ada. `storage_setup.sql` aman dijalankan kembali bila perlu.

Storage menggunakan bucket publik `product-images` dengan batas JPG/PNG/WebP 5 MB. Akses unggah dan hapus foto dibatasi ke folder milik seller. Foto pertama adalah sampul. URL foto akan terlihat publik setelah produk diterbitkan.

Email seller tidak bisa dibaca melalui API publik. Nomor WhatsApp seller dipublikasikan agar pembeli bisa menghubungi; seller perlu menggunakan nomor yang ingin ia tampilkan ke pembeli.

Untuk OAuth atau verifikasi email, tambahkan `http://localhost:3000/**` ke Authentication → URL Configuration → Redirect URLs. Setelah deploy, tambahkan domain produksi ke daftar redirect dan isi variabel yang sama di lingkungan deploy.

Periksa dengan `npx tsc --noEmit`, `npm run lint`, dan `npm run build`.
