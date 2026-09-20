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
 * Konfigurasi Banner Promosi Internal Nepal Market
 * Mudah disesuaikan untuk kebutuhan informasi dan kampanye komunitas.
 */
export const PROMO_BANNERS: PromoBanner[] = [
  {
    id: 'banner-terbaru',
    badge: 'Koleksi Komunitas',
    badgeIcon: 'Sparkles',
    title: 'Cari Barang Terbaru dari Warga Kampus',
    description: 'Mulai dari buku kuliah, outfit santai, hingga perlengkapan kos yang masih bagus dan siap pakai.',
    ctaText: 'Lihat Produk Terbaru',
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
    id: 'banner-jual',
    badge: 'Bebas Biaya Listing',
    badgeIcon: 'ShoppingBag',
    title: 'Punya Barang Layak Pakai yang Nganggur?',
    description: 'Bantu sesama dan dapatkan uang tambahan. Pasang iklan gratis dalam hitungan menit tanpa potongan biaya.',
    ctaText: 'Mulai Jual Barang',
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
    id: 'banner-cod',
    badge: 'Panduan Transaksi',
    badgeIcon: 'Handshake',
    title: 'Ketemuan Langsung & Cek Fisik Sebelum Bayar',
    description: 'Sepakati titik temu di area publik seperti kantin atau lobi utama agar jual beli COD lebih nyaman dan transparan.',
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
