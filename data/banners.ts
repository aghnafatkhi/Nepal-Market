export interface PromoBanner {
  id: string;
  badge?: string;
  badgeIcon?: 'Sparkles' | 'ShoppingBag' | 'Handshake';
  title: string;
  description: string;
  ctaText: string;
  ctaHref: string;
  ctaAction?: 'sell_modal' | 'navigate' | 'cod_guide_modal';
  theme: {
    containerBg: string;
    titleColor: string;
    descriptionColor: string;
    ctaStyle: string;
  };
}

/**
 * Banner promosi saat katalog BELUM memiliki produk aktif.
 */
export const EMPTY_CATALOG_BANNERS: PromoBanner[] = [
  {
    id: 'banner-empty-jual',
    title: 'Pasang Iklan Barang Bekas',
    description: 'Punya buku, pakaian, atau perlengkapan yang masih layak? Pasang iklan sekarang.',
    ctaText: 'Pasang Iklan',
    ctaHref: '/sell',
    ctaAction: 'sell_modal',
    theme: {
      containerBg: 'bg-slate-100',
      titleColor: 'text-slate-900',
      descriptionColor: 'text-slate-600',
      ctaStyle: 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white',
    },
  },
  {
    id: 'banner-empty-cod',
    title: 'Panduan Transaksi COD',
    description: 'Janjian di titik temu yang ramai dan pastikan barang sudah diperiksa sebelum bayar.',
    ctaText: 'Lihat Panduan COD',
    ctaHref: '#',
    ctaAction: 'cod_guide_modal',
    theme: {
      containerBg: 'bg-blue-50/70',
      titleColor: 'text-slate-900',
      descriptionColor: 'text-slate-600',
      ctaStyle: 'bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white',
    },
  },
];

/**
 * Banner promosi saat ADA produk aktif di katalog.
 */
export const ACTIVE_CATALOG_BANNERS: PromoBanner[] = [
  {
    id: 'banner-active-jual',
    title: 'Jual Barang yang Jarang Terpakai',
    description: 'Tawarkan barang layak pakai langsung ke sesama warga sekitar tanpa potongan biaya.',
    ctaText: 'Pasang Iklan',
    ctaHref: '/sell',
    ctaAction: 'sell_modal',
    theme: {
      containerBg: 'bg-slate-100',
      titleColor: 'text-slate-900',
      descriptionColor: 'text-slate-600',
      ctaStyle: 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white',
    },
  },
  {
    id: 'banner-active-cod',
    title: 'Panduan Transaksi COD',
    description: 'Janjian di titik temu yang ramai dan pastikan barang sudah diperiksa sebelum bayar.',
    ctaText: 'Lihat Panduan COD',
    ctaHref: '#',
    ctaAction: 'cod_guide_modal',
    theme: {
      containerBg: 'bg-blue-50/70',
      titleColor: 'text-slate-900',
      descriptionColor: 'text-slate-600',
      ctaStyle: 'bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white',
    },
  },
];

/**
 * Banner netral ketika terjadi kendala memuat data dari database.
 */
export const NEUTRAL_FALLBACK_BANNERS: PromoBanner[] = [
  {
    id: 'banner-neutral-cod',
    title: 'Panduan Transaksi COD',
    description: 'Janjian di titik temu yang ramai dan pastikan barang sudah diperiksa sebelum bayar.',
    ctaText: 'Lihat Panduan COD',
    ctaHref: '#',
    ctaAction: 'cod_guide_modal',
    theme: {
      containerBg: 'bg-blue-50/70',
      titleColor: 'text-slate-900',
      descriptionColor: 'text-slate-600',
      ctaStyle: 'bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white',
    },
  },
  {
    id: 'banner-neutral-jual',
    title: 'Pasang Iklan Barang Bekas',
    description: 'Punya buku, pakaian, atau perlengkapan yang masih layak? Pasang iklan sekarang.',
    ctaText: 'Pasang Iklan',
    ctaHref: '/sell',
    ctaAction: 'sell_modal',
    theme: {
      containerBg: 'bg-slate-100',
      titleColor: 'text-slate-900',
      descriptionColor: 'text-slate-600',
      ctaStyle: 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white',
    },
  },
];

/**
 * Mendapatkan banner yang sesuai dengan kondisi katalog aktual.
 */
export function getPromoBanners(hasActiveProducts: boolean, isError = false): PromoBanner[] {
  if (isError) {
    return NEUTRAL_FALLBACK_BANNERS;
  }
  return hasActiveProducts ? ACTIVE_CATALOG_BANNERS : EMPTY_CATALOG_BANNERS;
}

export const PROMO_BANNERS: PromoBanner[] = EMPTY_CATALOG_BANNERS;
