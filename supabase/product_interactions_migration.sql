-- ==============================================================================
-- NEPAL MARKET - PRODUCT INTERACTIONS MIGRATION & RLS POLICIES
-- ==============================================================================
-- Rekomendasi Beranda Berbasis Skor & Ketertarikan Pengguna (Non-AI, Ringan, Cepat)
-- ==============================================================================

-- 1. TABEL PRODUCT_INTERACTIONS
CREATE TABLE IF NOT EXISTS public.product_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('view', 'dwell', 'save', 'unsave', 'contact')),
  score INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. INDEX UNTUK PERFORMA QUERY (Mencegah Full Table Scan)
-- Query riwayat pengguna 30 hari terakhir terindeks komposit:
CREATE INDEX IF NOT EXISTS idx_product_interactions_user_created 
  ON public.product_interactions(user_id, created_at DESC);

-- Index untuk produk (misal agregasi popularitas produk):
CREATE INDEX IF NOT EXISTS idx_product_interactions_product_id 
  ON public.product_interactions(product_id);

-- Index untuk kategori:
CREATE INDEX IF NOT EXISTS idx_product_interactions_category 
  ON public.product_interactions(category);

-- 3. ROW LEVEL SECURITY (RLS) - ISOLASI DATA KETAT
ALTER TABLE public.product_interactions ENABLE ROW LEVEL SECURITY;

-- Pengguna hanya boleh melihat data interaksinya sendiri (mencegah kebocoran data antar pengguna)
DROP POLICY IF EXISTS "Pengguna hanya boleh melihat interaksi miliknya" ON public.product_interactions;
CREATE POLICY "Pengguna hanya boleh melihat interaksi miliknya"
ON public.product_interactions
FOR SELECT
USING (auth.uid() = user_id);

-- Pengguna hanya boleh mencatat interaksi atas nama user id miliknya sendiri
DROP POLICY IF EXISTS "Pengguna hanya boleh menambahkan interaksi miliknya" ON public.product_interactions;
CREATE POLICY "Pengguna hanya boleh menambahkan interaksi miliknya"
ON public.product_interactions
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND auth.uid() = user_id
);

-- Pengguna hanya boleh menghapus riwayat miliknya sendiri jika diperlukan
DROP POLICY IF EXISTS "Pengguna hanya boleh menghapus interaksi miliknya" ON public.product_interactions;
CREATE POLICY "Pengguna hanya boleh menghapus interaksi miliknya"
ON public.product_interactions
FOR DELETE
USING (auth.uid() = user_id);
