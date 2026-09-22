-- ==============================================================================
-- NEPAL MARKET - SUPABASE DATABASE MIGRATION & RLS POLICIES
-- ==============================================================================
-- Salin seluruh isi file ini ke Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABEL PROFILES (Terhubung ke auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Warga Nepal',
  username TEXT UNIQUE NOT NULL,
  email TEXT,
  avatar_url TEXT,
  phone TEXT,
  instagram TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. TABEL PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price BIGINT NOT NULL CHECK (price >= 0),
  category TEXT NOT NULL,
  condition TEXT NOT NULL CHECK (condition IN ('new', 'like_new', 'used')),
  location TEXT NOT NULL DEFAULT 'Kantin Utama',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'sold', 'hidden', 'removed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. TABEL PRODUCT_IMAGES
CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);

-- 5. TABEL FAVORITES
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_product_favorite UNIQUE (user_id, product_id)
);

-- 6. TABEL REPORTS
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_reporter_product UNIQUE (reporter_id, product_id)
);

-- 6B. TABEL MODERATION_LOGS
CREATE TABLE IF NOT EXISTS public.moderation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('product', 'profile', 'report')),
  target_id UUID NOT NULL,
  target_title TEXT,
  reason TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Kolom tambahan untuk penonaktifan akun seller jika diperlukan
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

-- ==============================================================================
-- 7. INDEXES UNTUK PERFORMA QUERY
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category, status);
CREATE INDEX IF NOT EXISTS idx_products_seller_id ON public.products(seller_id);
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id, sort_order ASC);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_product_id ON public.favorites(product_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- ==============================================================================
-- 8. TRIGGER UPDATE updated_at PADA TABEL PRODUCTS
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_products_updated_at ON public.products;
CREATE TRIGGER trigger_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 9. TRIGGER OTOMATIS PEMBUATAN PROFILE SETELAH REGISTRASI DI auth.users
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  full_name TEXT;
  user_email TEXT;
  user_avatar TEXT;
  suffix INT := 1;
BEGIN
  user_email := NEW.email;
  
  -- Ambil nama dari metadata Google/Email jika ada
  full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(user_email, '@', 1)
  );

  user_avatar := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture'
  );

  -- Buat base username dari email atau user_name
  base_username := lower(regexp_replace(
    COALESCE(NEW.raw_user_meta_data->>'user_name', split_part(user_email, '@', 1)),
    '[^a-zA-Z0-9_]', '', 'g'
  ));
  
  IF base_username IS NULL OR length(base_username) < 3 THEN
    base_username := 'user_' || substring(NEW.id::text, 1, 6);
  END IF;

  final_username := base_username;

  -- Pastikan username selalu unik
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    final_username := base_username || '_' || suffix;
    suffix := suffix + 1;
  END LOOP;

  INSERT INTO public.profiles (id, name, username, email, avatar_url, role)
  VALUES (
    NEW.id,
    COALESCE(full_name, 'Warga Nepal'),
    final_username,
    user_email,
    user_avatar,
    'user'
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    name = COALESCE(public.profiles.name, EXCLUDED.name);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- A. PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Semua orang boleh melihat profil"
ON public.profiles
FOR SELECT
USING (true);

CREATE POLICY "Pengguna hanya boleh mengubah profilnya sendiri"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Profil baru dibuat oleh trigger auth.users; client tidak mendapat izin INSERT.

-- B. PRODUCTS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Semua orang boleh melihat produk aktif"
ON public.products
FOR SELECT
USING (
  status = 'active'
  OR auth.uid() = seller_id
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Seller hanya boleh membuat produk miliknya sendiri"
ON public.products
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = seller_id
);

CREATE POLICY "Seller hanya boleh mengubah produknya sendiri"
ON public.products
FOR UPDATE
USING (
  auth.uid() = seller_id
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
  auth.uid() = seller_id
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Seller hanya boleh menghapus produknya sendiri"
ON public.products
FOR DELETE
USING (
  auth.uid() = seller_id
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- C. PRODUCT_IMAGES
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Semua orang boleh melihat gambar produk aktif"
ON public.product_images
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = product_images.product_id
      AND (
        p.status = 'active' 
        OR p.seller_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.id = auth.uid() AND pr.role = 'admin')
      )
  )
);

CREATE POLICY "Seller boleh menambahkan gambar pada produk miliknya"
ON public.product_images
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = product_images.product_id
      AND p.seller_id = auth.uid()
  )
);

CREATE POLICY "Seller boleh mengubah gambar pada produk miliknya"
ON public.product_images
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = product_images.product_id
      AND p.seller_id = auth.uid()
  )
);

CREATE POLICY "Seller boleh menghapus gambar pada produk miliknya"
ON public.product_images
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = product_images.product_id
      AND p.seller_id = auth.uid()
  )
);

-- D. FAVORITES
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pengguna hanya boleh melihat favorite miliknya"
ON public.favorites
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Pengguna hanya boleh menambahkan favorite miliknya"
ON public.favorites
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND auth.uid() = user_id
);

CREATE POLICY "Pengguna hanya boleh menghapus favorite miliknya"
ON public.favorites
FOR DELETE
USING (auth.uid() = user_id);

-- E. REPORTS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pengguna login boleh membuat laporan"
ON public.reports
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND auth.uid() = reporter_id
);

CREATE POLICY "Pelapor boleh melihat laporannya sendiri dan admin boleh melihat semua"
ON public.reports
FOR SELECT
USING (
  auth.uid() = reporter_id
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Hanya admin yang boleh melakukan moderasi laporan"
ON public.reports
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- F. MODERATION_LOGS
ALTER TABLE public.moderation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hanya admin yang boleh melihat log moderasi"
ON public.moderation_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Hanya admin yang boleh menambahkan log moderasi"
ON public.moderation_logs
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- G. ADMIN PROFILE UPDATE (Untuk penonaktifan akun)
CREATE POLICY "Admin boleh memperbarui status penonaktifan akun"
ON public.profiles
FOR UPDATE
USING (
  auth.uid() = id
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  auth.uid() = id
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ==============================================================================
-- PANDUAN PEMBERIAN HAK AKSES ADMIN:
-- Jalankan query ini di SQL Editor Supabase untuk menetapkan akun menjadi Admin:
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'admin@example.com';
-- ==============================================================================
