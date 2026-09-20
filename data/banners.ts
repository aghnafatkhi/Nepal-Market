export interface PromoBanner {
  id: string;
  badge: string;
  badgeIcon: 'Sparkles' | 'ShoppingBag' | 'Handshake';
  title: string;
  description: string;
  ctaText: string;
  ctaHref: string;
  ctaAction?: 'sell_modal' | 'navigate';
  theme: {
    containerBg: string;
    badgeStyle: string;
    titleColor: string;
    descriptionColor: string;
    ctaStyle: string;
    indicatorActive: string;
    ambientBg: string;
  };
}

/**
 * Banner promosi komunitas ketika katalog BELUM memiliki produk aktif
 * (semua barang sebelumnya sudah sold atau belum ada iklan yang aktif).
 */
export const EMPTY_CATALOG_BANNERS: PromoBanner[] = [
  {
    id: 'banner-empty-jual',
    badge: 'Pasang Iklan',
    badgeIcon: 'ShoppingBag',
    title: 'Punya Buku, Pakaian, atau Aksesori yang Masih Bagus?',
    description: 'Tawarkan barang pribadi yang sudah jarang dipakai ke sesama anggota komunitas. Iklan langsung tampil di katalog.',
    ctaText: 'Pasang Iklan Sekarang',
    ctaHref: '/sell',
    ctaAction: 'sell_modal',
    theme: {
      containerBg: 'bg-gradient-to-r from-slate-900 via-emerald-950/80 to-slate-900 text-white',
      badgeStyle: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
      titleColor: 'text-white',
      descriptionColor: 'text-slate-300',
      ctaStyle: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs',
      indicatorActive: 'bg-emerald-500',
      ambientBg: 'from-emerald-600/15 to-teal-600/10',
    },
  },
  {
    id: 'banner-empty-cod',
    badge: 'Panduan Transaksi',
    badgeIcon: 'Handshake',
    title: 'Janjian COD di Titik Temu yang Ramai',
    description: 'Sepakati lokasi temu yang mudah dijangkau dan periksa kondisi fisik barang secara langsung sebelum membayar.',
    ctaText: 'Mulai Jual Barang',
    ctaHref: '/sell',
    ctaAction: 'sell_modal',
    theme: {
      containerBg: 'bg-gradient-to-r from-slate-900 via-indigo-950/90 to-slate-900 text-white',
      badgeStyle: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30',
      titleColor: 'text-white',
      descriptionColor: 'text-slate-300',
      ctaStyle: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs',
      indicatorActive: 'bg-indigo-500',
      ambientBg: 'from-indigo-600/15 to-blue-600/10',
    },
  },
  {
    id: 'banner-empty-info',
    badge: 'Katalog Komunitas',
    badgeIcon: 'Sparkles',
    title: 'Katalog Sedang Menunggu Iklan Baru',
    description: 'Barang yang terpasang sebelumnya sudah laku terjual. Iklan baru yang kamu pasang akan langsung terlihat di beranda.',
    ctaText: 'Pasang Iklan Pertama',
    ctaHref: '/sell',
    ctaAction: 'sell_modal',
    theme: {
      containerBg: 'bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white',
      badgeStyle: 'bg-blue-500/20 text-blue-300 border-blue-400/30',
      titleColor: 'text-white',
      descriptionColor: 'text-slate-300',
      ctaStyle: 'bg-blue-600 hover:bg-blue-500 text-white shadow-xs',
      indicatorActive: 'bg-blue-500',
      ambientBg: 'from-blue-600/15 to-indigo-600/10',
    },
  },
];

/**
 * Banner promosi komunitas ketika ADA produk aktif di katalog.
 */
export const ACTIVE_CATALOG_BANNERS: PromoBanner[] = [
  {
    id: 'banner-active-terbaru',
    badge: 'Koleksi Komunitas',
    badgeIcon: 'Sparkles',
    title: 'Temukan Buku, Pakaian, dan Aksesori Layak Pakai',
    description: 'Cari barang yang sedang ditawarkan oleh anggota komunitas di sekitar kamu dengan sistem COD langsung.',
    ctaText: 'Lihat Barang Terbaru',
    ctaHref: '/search?sort=terbaru',
    ctaAction: 'navigate',
    theme: {
      containerBg: 'bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white',
      badgeStyle: 'bg-blue-500/20 text-blue-300 border-blue-400/30',
      titleColor: 'text-white',
      descriptionColor: 'text-slate-300',
      ctaStyle: 'bg-blue-600 hover:bg-blue-500 text-white shadow-xs',
      indicatorActive: 'bg-blue-500',
      ambientBg: 'from-blue-600/15 to-indigo-600/10',
    },
  },
  {
    id: 'banner-active-jual',
    badge: 'Pasang Iklan',
    badgeIcon: 'ShoppingBag',
    title: 'Punya Barang Pribadi yang Masih Layak Pakai?',
    description: 'Tawarkan buku, pakaian, atau aksesori yang sudah tidak dipakai agar bermanfaat bagi orang lain.',
    ctaText: 'Pasang Iklan Sekarang',
    ctaHref: '/sell',
    ctaAction: 'sell_modal',
    theme: {
      containerBg: 'bg-gradient-to-r from-slate-900 via-emerald-950/80 to-slate-900 text-white',
      badgeStyle: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
      titleColor: 'text-white',
      descriptionColor: 'text-slate-300',
      ctaStyle: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs',
      indicatorActive: 'bg-emerald-500',
      ambientBg: 'from-emerald-600/15 to-teal-600/10',
    },
  },
  {
    id: 'banner-active-cod',
    badge: 'Panduan Transaksi',
    badgeIcon: 'Handshake',
    title: 'Janjian COD di Titik Temu yang Ramai',
    description: 'Sepakati lokasi temu yang mudah dijangkau dan periksa kondisi fisik barang secara langsung sebelum membayar.',
    ctaText: 'Jelajahi Pilihan Barang',
    ctaHref: '/search',
    ctaAction: 'navigate',
    theme: {
      containerBg: 'bg-gradient-to-r from-slate-900 via-indigo-950/90 to-slate-900 text-white',
      badgeStyle: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30',
      titleColor: 'text-white',
      descriptionColor: 'text-slate-300',
      ctaStyle: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs',
      indicatorActive: 'bg-indigo-500',
      ambientBg: 'from-indigo-600/15 to-blue-600/10',
    },
  },
];

/**
 * Mendapatkan banner yang sesuai dengan kondisi katalog aktual.
 */
export function getPromoBanners(hasActiveProducts: boolean): PromoBanner[] {
  return hasActiveProducts ? ACTIVE_CATALOG_BANNERS : EMPTY_CATALOG_BANNERS;
}

// Default export untuk kompatibilitas mundur
export const PROMO_BANNERS: PromoBanner[] = EMPTY_CATALOG_BANNERS;
