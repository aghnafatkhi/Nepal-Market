-- ==============================================================================
-- NEPAL MARKET - MIGRATION: SPONSOR BANNERS & STORAGE SETUP
-- ==============================================================================
-- File migrasi ini menambahkan:
-- 1. Tabel `sponsor_banners` dengan constraint ketat (HTTPS, tanggal, sort_order)
-- 2. Row Level Security (RLS) terpadu dengan pengecekan `nepal_private.is_admin()`
-- 3. Bucket Supabase Storage `sponsor-banners` publik dengan batas 5 MB & jenis file gambar
-- 4. Kebijakan Storage agar hanya Admin yang dapat upload, update, dan delete
--
-- CARA MENJALANKAN DI SUPABASE:
-- Buka Supabase Dashboard -> Masuk ke Project Anda -> Buka menu "SQL Editor" ->
-- Klik "New Query", tempelkan seluruh isi file ini, lalu klik "Run".
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. PASTIKAN SCHEMA PRIVAT & FUNGSI IS_ADMIN TERSEDIA (IDEMPOTENT)
-- ------------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS nepal_private;
REVOKE ALL ON SCHEMA nepal_private FROM public;
GRANT USAGE ON SCHEMA nepal_private TO authenticated;

CREATE OR REPLACE FUNCTION nepal_private.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid()) AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION nepal_private.is_admin() FROM public, anon;
GRANT EXECUTE ON FUNCTION nepal_private.is_admin() TO authenticated;

-- ------------------------------------------------------------------------------
-- 2. TRIGGER HELPER UNTUK UPDATED_AT (IDEMPOTENT)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ------------------------------------------------------------------------------
-- 3. PEMBUATAN TABEL SPONSOR_BANNERS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sponsor_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_name TEXT NOT NULL,
  desktop_image_url TEXT NOT NULL,
  mobile_image_url TEXT NOT NULL,
  target_url TEXT NOT NULL,
  alt_text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'inactive')),
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  sort_order INTEGER NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constraint: target_url harus berformat HTTPS
  CONSTRAINT check_sponsor_target_url_https CHECK (target_url ~* '^https://'),

  -- Constraint: ends_at harus lebih akhir daripada starts_at (jika keduanya diisi)
  CONSTRAINT check_sponsor_schedule_order CHECK (
    starts_at IS NULL OR ends_at IS NULL OR ends_at > starts_at
  )
);

-- ------------------------------------------------------------------------------
-- 4. INDEXES UNTUK EFISIENSI QUERY & PENJADWALAN
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_sponsor_banners_status_sort
  ON public.sponsor_banners(status, sort_order ASC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sponsor_banners_active_schedule
  ON public.sponsor_banners(starts_at, ends_at)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_sponsor_banners_created_by
  ON public.sponsor_banners(created_by);

-- ------------------------------------------------------------------------------
-- 5. TRIGGER OTOMATIS UPDATED_AT
-- ------------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trigger_sponsor_banners_updated_at ON public.sponsor_banners;
CREATE TRIGGER trigger_sponsor_banners_updated_at
  BEFORE UPDATE ON public.sponsor_banners
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS) UNTUK TABEL SPONSOR_BANNERS
-- ------------------------------------------------------------------------------
ALTER TABLE public.sponsor_banners ENABLE ROW LEVEL SECURITY;

-- Cabut akses tidak aman dan berikan hak dasar granular
REVOKE ALL ON public.sponsor_banners FROM public, anon, authenticated;
GRANT SELECT ON public.sponsor_banners TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.sponsor_banners TO authenticated;

-- Policy 1: Pengguna Publik & Login (Anon & Authenticated) HANYA dapat membaca
-- banner aktif yang sudah memasuki jadwal tayang dan belum kedaluwarsa.
DROP POLICY IF EXISTS "Public and users can view active scheduled sponsor banners" ON public.sponsor_banners;
CREATE POLICY "Public and users can view active scheduled sponsor banners"
  ON public.sponsor_banners
  FOR SELECT
  TO anon, authenticated
  USING (
    status = 'active'
    AND (starts_at IS NULL OR starts_at <= now())
    AND (ends_at IS NULL OR ends_at >= now())
  );

-- Policy 2: Hanya Admin yang dapat melihat SELURUH sponsor banner (draft, inactive, expired)
DROP POLICY IF EXISTS "Admin can view all sponsor banners" ON public.sponsor_banners;
CREATE POLICY "Admin can view all sponsor banners"
  ON public.sponsor_banners
  FOR SELECT
  TO authenticated
  USING ((SELECT nepal_private.is_admin()));

-- Policy 3: Hanya Admin yang dapat membuat (INSERT) data sponsor
DROP POLICY IF EXISTS "Admin can insert sponsor banners" ON public.sponsor_banners;
CREATE POLICY "Admin can insert sponsor banners"
  ON public.sponsor_banners
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT nepal_private.is_admin())
  );

-- Policy 4: Hanya Admin yang dapat mengubah (UPDATE) data sponsor
DROP POLICY IF EXISTS "Admin can update sponsor banners" ON public.sponsor_banners;
CREATE POLICY "Admin can update sponsor banners"
  ON public.sponsor_banners
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT nepal_private.is_admin())
  )
  WITH CHECK (
    (SELECT nepal_private.is_admin())
  );

-- Policy 5: Hanya Admin yang dapat menghapus (DELETE) data sponsor
DROP POLICY IF EXISTS "Admin can delete sponsor banners" ON public.sponsor_banners;
CREATE POLICY "Admin can delete sponsor banners"
  ON public.sponsor_banners
  FOR DELETE
  TO authenticated
  USING (
    (SELECT nepal_private.is_admin())
  );

-- ------------------------------------------------------------------------------
-- 7. SUPABASE STORAGE BUCKET: sponsor-banners
-- ------------------------------------------------------------------------------
-- Bucket berstatus publik (agar browser dapat memuat aset gambar sponsor langsung)
-- Batas ukuran file: 5 MB (5.242.880 bytes)
-- Format diizinkan: JPG, PNG, WebP, AVIF
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'sponsor-banners',
  'sponsor-banners',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ------------------------------------------------------------------------------
-- 8. STORAGE RLS POLICIES PADA storage.objects
-- ------------------------------------------------------------------------------

-- Policy Storage 1: Siapapun (publik) boleh membaca gambar banner sponsor
DROP POLICY IF EXISTS "Public can view sponsor banner images" ON storage.objects;
CREATE POLICY "Public can view sponsor banner images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'sponsor-banners');

-- Policy Storage 2: Hanya Admin yang boleh mengunggah (INSERT) gambar sponsor
DROP POLICY IF EXISTS "Admin can upload sponsor banner images" ON storage.objects;
CREATE POLICY "Admin can upload sponsor banner images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'sponsor-banners'
    AND (SELECT nepal_private.is_admin())
  );

-- Policy Storage 3: Hanya Admin yang boleh memperbarui/menimpa (UPDATE) gambar sponsor
DROP POLICY IF EXISTS "Admin can update sponsor banner images" ON storage.objects;
CREATE POLICY "Admin can update sponsor banner images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'sponsor-banners'
    AND (SELECT nepal_private.is_admin())
  )
  WITH CHECK (
    bucket_id = 'sponsor-banners'
    AND (SELECT nepal_private.is_admin())
  );

-- Policy Storage 4: Hanya Admin yang boleh menghapus (DELETE) gambar sponsor
DROP POLICY IF EXISTS "Admin can delete sponsor banner images" ON storage.objects;
CREATE POLICY "Admin can delete sponsor banner images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'sponsor-banners'
    AND (SELECT nepal_private.is_admin())
  );

COMMIT;
-- ==============================================================================
-- MIGRASI SELESAI
-- ==============================================================================
