import { getSupabaseClient } from './client';
import { InteractionType } from './types';
import { Product, CategorySlug, SortOption } from '@/types/market';

// Bobot skor interaksi sesuai panduan spesifikasi:
// - Membuka halaman detail produk: +1
// - Melihat produk beberapa saat, minimal 8 detik: +1 tambahan
// - Menyimpan produk: +3
// - Menekan tombol hubungi penjual: +4
// - Membatalkan simpan: kurangi skor simpan sebelumnya (-3)
export const INTERACTION_SCORES: Record<InteractionType, number> = {
  view: 1,
  dwell: 1,
  save: 3,
  unsave: -3,
  contact: 4,
};

// Key penyimpanan preferensi ringan untuk pengunjung anonim / belum login
const GUEST_INTERACTIONS_KEY = 'nepal_guest_interactions_v1';
const MAX_LOCAL_INTERACTIONS = 80;
const MAX_AGE_DAYS = 30;

export interface GuestInteractionRecord {
  productId: string;
  category: string;
  type: InteractionType;
  score: number;
  timestamp: number;
}

export interface CategoryAffinityResult {
  categoryScores: Record<string, number>;
  normalizedAffinity: Record<string, number>;
  topCategory: string | null;
  totalScore: number;
  hasSignificantPreference: boolean;
}

// ==============================================================================
// 1. DEDUPLIKASI EVENT PER SESI (Mencegah Spam View & Dwell Berulang)
// ==============================================================================
export function hasViewedInSession(productId: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return sessionStorage.getItem(`nepal_session_view_${productId}`) === '1';
  } catch {
    return false;
  }
}

export function markViewedInSession(productId: string): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(`nepal_session_view_${productId}`, '1');
  } catch {
    // Abaikan jika quota storage penuh
  }
}

export function hasDwelledInSession(productId: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return sessionStorage.getItem(`nepal_session_dwell_${productId}`) === '1';
  } catch {
    return false;
  }
}

export function markDwelledInSession(productId: string): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(`nepal_session_dwell_${productId}`, '1');
  } catch {
    // Abaikan jika quota storage penuh
  }
}

// ==============================================================================
// 2. PENYIMPANAN LOCALSTORAGE UNTUK PENGGUNA BELUM LOGIN (RINGAN & NON-SENSITIF)
// ==============================================================================
function getGuestInteractions(): GuestInteractionRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(GUEST_INTERACTIONS_KEY);
    if (!raw) return [];
    const list: GuestInteractionRecord[] = JSON.parse(raw);
    const now = Date.now();
    const cutoff = now - MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
    // Bersihkan riwayat lebih tua dari 30 hari
    return list.filter(item => item.timestamp >= cutoff);
  } catch {
    return [];
  }
}

function saveGuestInteraction(record: GuestInteractionRecord): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getGuestInteractions();
    const updated = [record, ...existing].slice(0, MAX_LOCAL_INTERACTIONS);
    localStorage.setItem(GUEST_INTERACTIONS_KEY, JSON.stringify(updated));
  } catch {
    // Abaikan jika quota storage penuh
  }
}

// ==============================================================================
// 3. FUNGSI PENCATATAN INTERAKSI (SUPABASE & GUEST FALLBACK)
// ==============================================================================
export interface RecordInteractionInput {
  productId: string;
  category: string;
  type: InteractionType;
  userId?: string | null;
}

export async function recordProductInteraction(input: RecordInteractionInput): Promise<void> {
  const { productId, category, type, userId } = input;
  if (!productId || !category || !type) return;

  // Cek deduplikasi view & dwell dalam sesi yang sama
  if (type === 'view') {
    if (hasViewedInSession(productId)) return;
    markViewedInSession(productId);
  } else if (type === 'dwell') {
    if (hasDwelledInSession(productId)) return;
    markDwelledInSession(productId);
  }

  const score = INTERACTION_SCORES[type] ?? 0;
  if (score === 0) return;

  // Catat ke localStorage untuk fallback / tracking anonim
  saveGuestInteraction({
    productId,
    category,
    type,
    score,
    timestamp: Date.now(),
  });

  // Jika login dan Supabase tersedia, simpan ke database dengan RLS
  if (userId) {
    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        // Query asinkron non-blocking, kegagalan tidak boleh merusak app
        supabase
          .from('product_interactions')
          .insert({
            user_id: userId,
            product_id: productId,
            category: category,
            interaction_type: type,
            score: score,
          })
          .then(
            ({ error }) => {
              if (error) {
                // Gagal insert (misal koneksi atau RLS), fallback tetap berjalan aman
                console.warn('[Nepal Recommendations] Catat interaksi DB:', error.message);
              }
            },
            () => {
              // Abaikan rejection
            }
          );
      }
    } catch {
      // Abaikan error jaringan
    }
  }
}

// ==============================================================================
// 4. PERHITUNGAN PREFERENSI KATEGORI (DENGAN TIME DECAY & BAYESIAN SMOOTHING)
// ==============================================================================
/**
 * Menghitung skor afinitas tiap kategori dengan:
 * 1. Time Decay: aktivitas 30 hari terakhir paling berpengaruh.
 * 2. Smoothing: satu klik tidak langsung membanjiri beranda (Bayesian Prior K=5).
 */
export async function computeUserCategoryAffinity(userId?: string | null): Promise<CategoryAffinityResult> {
  const categoryScores: Record<string, number> = {};
  const now = Date.now();
  let interactionsLoaded = false;

  // 1. Coba ambil dari Supabase jika user terautentikasi
  if (userId) {
    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        const thirtyDaysAgoIso = new Date(now - MAX_AGE_DAYS * 24 * 60 * 60 * 1000).toISOString();
        const { data, error } = await supabase
          .from('product_interactions')
          .select('category, score, created_at')
          .eq('user_id', userId)
          .gte('created_at', thirtyDaysAgoIso)
          .order('created_at', { ascending: false })
          .limit(100);

        if (!error && data && data.length > 0) {
          interactionsLoaded = true;
          for (const row of data) {
            const ageDays = Math.max(0, (now - new Date(row.created_at).getTime()) / (24 * 60 * 60 * 1000));
            // Decay eksponensial halus: hari 0 = 1.0, hari 14 = ~0.43, hari 30 = ~0.16
            const decay = Math.max(0.08, Math.exp(-0.06 * ageDays));
            const weightedScore = (row.score || 0) * decay;
            categoryScores[row.category] = (categoryScores[row.category] || 0) + weightedScore;
          }
        }
      }
    } catch {
      // Fallback ke local
    }
  }

  // 2. Jika bukan user login atau DB kosong, pakai localStorage
  if (!interactionsLoaded) {
    const localInteractions = getGuestInteractions();
    for (const item of localInteractions) {
      const ageDays = Math.max(0, (now - item.timestamp) / (24 * 60 * 60 * 1000));
      const decay = Math.max(0.08, Math.exp(-0.06 * ageDays));
      const weightedScore = item.score * decay;
      categoryScores[item.category] = (categoryScores[item.category] || 0) + weightedScore;
    }
  }

  // Normalisasi: pastikan tidak ada skor negatif setelah pembatalan simpan
  let totalPositiveScore = 0;
  for (const cat in categoryScores) {
    if (categoryScores[cat] < 0) {
      categoryScores[cat] = 0;
    }
    totalPositiveScore += categoryScores[cat];
  }

  // Cari kategori preferensi utama
  let topCategory: string | null = null;
  let maxScore = 0;
  for (const cat in categoryScores) {
    if (categoryScores[cat] > maxScore) {
      maxScore = categoryScores[cat];
      topCategory = cat;
    }
  }

  // Bayesian Smoothing (Prior K = 5):
  // Menghindari 1 view tunggal (skor 1) langsung mengubah total feed.
  // Dengan 1 view (skor 1): ratio = 1 / (1 + 5) = 0.166 (efek halus).
  // Dengan interaksi berulang (skor 8): ratio = 8 / (8 + 5) = 0.615 (preferensi kuat).
  const smoothingPrior = 5;
  const normalizedAffinity: Record<string, number> = {};
  for (const cat in categoryScores) {
    if (categoryScores[cat] > 0) {
      normalizedAffinity[cat] = categoryScores[cat] / (totalPositiveScore + smoothingPrior);
    } else {
      normalizedAffinity[cat] = 0;
    }
  }

  return {
    categoryScores,
    normalizedAffinity,
    topCategory: maxScore >= 1.5 ? topCategory : null, // Membutuhkan minat nyata (>1 klik tunggal)
    totalScore: totalPositiveScore,
    hasSignificantPreference: totalPositiveScore >= 2.0 && Boolean(topCategory),
  };
}

// ==============================================================================
// 5. FORMULA RANKING BERANDA & DIVERSITY INTERLEAVING
// ==============================================================================
/**
 * Komponen Skor Ranking:
 * - 50% Kecocokan kategori pengguna (affinity)
 * - 25% Kebaruan produk (recency)
 * - 15% Popularitas berdasarkan interaksi (popularity)
 * - 10% Variasi kategori (diversity bonus untuk discovery)
 */
export interface RankProductsOptions {
  affinity: CategoryAffinityResult;
  sortBy?: SortOption;
  selectedCategory?: CategorySlug;
  selectedCondition?: string;
  searchQuery?: string;
  maxTopCategoryRatio?: number; // Default 0.60 (Maksimal ~60% dari kategori minat utama)
}

export function rankProductsForHome(
  products: Product[],
  options: RankProductsOptions
): Product[] {
  const {
    affinity,
    sortBy = 'terbaru',
    selectedCategory = 'semua',
    selectedCondition = 'semua',
    searchQuery = '',
    maxTopCategoryRatio = 0.60,
  } = options;

  const now = Date.now();

  // 1. FILTERING KETAT SESUAI SPESIFIKASI:
  // - Semua produk aktif tetap tampil, termasuk iklan milik pengguna sendiri
  // - Produk yang sudah terjual ditiadakan
  // - Produk yang tidak aktif / dihapus ditiadakan
  // - Produk yang ditolak atau bukan status 'active' ditiadakan
  const candidateProducts = products.filter((p) => {
    // Filter produk terjual / tidak aktif
    if (p.isSold || !p.isAvailable) {
      return false;
    }

    // Filter status jika ada
    if (p.status && p.status !== 'active') {
      return false;
    }

    // Filter kategori eksplisit jika user memilih tombol kategori di CategoryBar
    if (selectedCategory !== 'semua' && p.category !== selectedCategory) {
      return false;
    }

    // Filter kondisi barang
    if (selectedCondition !== 'semua' && p.condition !== selectedCondition) {
      return false;
    }

    // Filter pencarian teks
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchDesc = p.description.toLowerCase().includes(q);
      const matchLoc = p.location.toLowerCase().includes(q);
      const matchSeller = p.seller?.name?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchLoc && !matchSeller) {
        return false;
      }
    }

    return true;
  });

  // Jika pengguna secara spesifik memilih pengurutan harga (harga-rendah / harga-tinggi),
  // hormati pilihan eksplisit pengguna.
  if (sortBy === 'harga-rendah') {
    return candidateProducts.sort((a, b) => a.price - b.price);
  }
  if (sortBy === 'harga-tinggi') {
    return candidateProducts.sort((a, b) => b.price - a.price);
  }

  // Jika pengguna memilih kategori spesifik selain 'semua',
  // urutkan berdasarkan kebaruan & popularitas tanpa penalti kategori lain
  if (selectedCategory !== 'semua') {
    return candidateProducts.sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });
  }

  // 2. HITUNG SKOR MULTI-FAKTOR UNTUK SETIAP PRODUK
  const isColdStart = !affinity.hasSignificantPreference;
  const topCategory = affinity.topCategory;

  interface ScoredProduct {
    product: Product;
    score: number;
    categoryScore: number;
    recencyScore: number;
    popularityScore: number;
    diversityScore: number;
  }

  const scoredList: ScoredProduct[] = candidateProducts.map((p) => {
    // A. Kecocokan Kategori (Bobot 50%)
    let categoryScore = 0.5; // baseline netral saat cold start
    if (!isColdStart) {
      const catRatio = affinity.normalizedAffinity[p.category] || 0;
      // Normalisasi skala 0.0 - 1.0
      categoryScore = Math.min(1.0, catRatio * 1.5);
    }

    // B. Kebaruan Produk (Bobot 25%)
    let recencyScore = 0.7; // default
    if (p.createdAt) {
      const ageDays = Math.max(0, (now - new Date(p.createdAt).getTime()) / (24 * 60 * 60 * 1000));
      // Produk baru hari ini = 1.0, 7 hari = ~0.77, 30 hari = 0.1
      recencyScore = Math.max(0.1, 1 - (ageDays / 30));
    }

    // C. Popularitas Berdasarkan Interaksi (Bobot 15%)
    // Dihitung dari interaksi riil produk (listing verified, seller listings, dll)
    const activeListings = p.seller?.activeListingsCount || 1;
    const isSellerVerified = p.seller?.isVerified ? 0.2 : 0;
    const popularityScore = Math.min(1.0, 0.4 + (Math.min(activeListings, 5) * 0.1) + isSellerVerified);

    // D. Variasi Kategori (Bobot 10%)
    // Memberikan dorongan eksplorasi untuk kategori di luar minat utama
    let diversityScore = 0.7;
    if (topCategory) {
      diversityScore = p.category === topCategory ? 0.35 : 1.0;
    }

    // Gabungkan dengan bobot: 50% kategori, 25% kebaruan, 15% popularitas, 10% variasi
    const finalScore =
      0.50 * categoryScore +
      0.25 * recencyScore +
      0.15 * popularityScore +
      0.10 * diversityScore;

    return {
      product: p,
      score: finalScore,
      categoryScore,
      recencyScore,
      popularityScore,
      diversityScore,
    };
  });

  // Urutkan kandidat berdasarkan skor tertinggi
  scoredList.sort((a, b) => b.score - a.score);

  // 3. ATURAN PENYELESAIAN (CONSTRAINTS 6, 7, 8, 10):
  // - Maksimal ~60% dari kategori minat utama
  // - Sisakan produk dari kategori lain untuk discovery
  // - Hindari duplikasi produk
  if (!topCategory) {
    // Pengguna Baru (Cold-start): Campuran seimbang antar kategori + produk terbaru
    // Diversifikasi adjacent: jangan menaruh 3 produk berurutan dengan kategori yang sama jika ada pilihan lain
    const result: Product[] = [];
    const pool = [...scoredList];
    const seenIds = new Set<string>();

    while (pool.length > 0) {
      const lastCategory = result.length > 0 ? result[result.length - 1].category : null;
      let nextIndex = 0;

      // Cari produk dengan kategori berbeda dari produk sebelumnya jika memungkinkan
      if (lastCategory && pool.length > 1) {
        const diffIndex = pool.findIndex(item => item.product.category !== lastCategory);
        if (diffIndex !== -1 && diffIndex < 4) {
          nextIndex = diffIndex;
        }
      }

      const chosen = pool.splice(nextIndex, 1)[0];
      if (!seenIds.has(chosen.product.id)) {
        seenIds.add(chosen.product.id);
        result.push(chosen.product);
      }
    }
    return result;
  }

  // Jika ada kategori minat utama: terapkan batas maksimal 60% dan interleave dengan discovery
  const topCategoryItems = scoredList.filter(item => item.product.category === topCategory);
  const otherCategoryItems = scoredList.filter(item => item.product.category !== topCategory);

  const finalRanked: Product[] = [];
  const seenIds = new Set<string>();

  let topIndex = 0;
  let otherIndex = 0;

  // Interleaving cerdas: menjaga rasio top category tidak melebihi ~60%
  while (topIndex < topCategoryItems.length || otherIndex < otherCategoryItems.length) {
    const currentTotal = finalRanked.length;
    const currentTopCount = finalRanked.filter(p => p.category === topCategory).length;
    const topRatio = currentTotal > 0 ? currentTopCount / currentTotal : 0;

    // Jika rasio top category masih di bawah ambang batas (60%) dan ada item top category:
    const canTakeTop = topIndex < topCategoryItems.length && (currentTotal === 0 || topRatio < maxTopCategoryRatio);
    const canTakeOther = otherIndex < otherCategoryItems.length;

    if (canTakeTop && (canTakeOther ? topRatio <= maxTopCategoryRatio : true)) {
      const item = topCategoryItems[topIndex++];
      if (!seenIds.has(item.product.id)) {
        seenIds.add(item.product.id);
        finalRanked.push(item.product);
      }
    } else if (canTakeOther) {
      const item = otherCategoryItems[otherIndex++];
      if (!seenIds.has(item.product.id)) {
        seenIds.add(item.product.id);
        finalRanked.push(item.product);
      }
    } else if (topIndex < topCategoryItems.length) {
      // Jika pool produk lain sudah habis, masukkan sisa produk top category
      const item = topCategoryItems[topIndex++];
      if (!seenIds.has(item.product.id)) {
        seenIds.add(item.product.id);
        finalRanked.push(item.product);
      }
    } else {
      break;
    }
  }

  return finalRanked;
}
