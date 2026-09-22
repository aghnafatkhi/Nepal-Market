export interface SponsorBanner {
  id: string;
  sponsorName: string;
  desktopImage: string;
  mobileImage: string;
  targetUrl: string;
  alt: string;
  active: boolean;
  startsAt?: string;
  endsAt?: string;
}

/**
 * Daftar slot iklan sponsor Nepal Market.
 * Banner difilter berdasarkan status active serta jadwal tayang startsAt & endsAt (jika ada).
 */
export const SPONSOR_BANNERS: SponsorBanner[] = [
  {
    id: 'sponsor-utama-01',
    sponsorName: 'Ruang Iklan Mitra Nepal 1',
    desktopImage: '/ads/contoh-sponsor-desktop.svg',
    mobileImage: '/ads/contoh-sponsor-mobile.svg',
    targetUrl: 'https://example.com/sponsor-1',
    alt: 'Slot Iklan Sponsor Resmi Nepal Market',
    active: true,
  },
  {
    id: 'sponsor-utama-02',
    sponsorName: 'Ruang Iklan Mitra Nepal 2',
    desktopImage: '/ads/contoh-sponsor-desktop.svg',
    mobileImage: '/ads/contoh-sponsor-mobile.svg',
    targetUrl: 'https://example.com/sponsor-2',
    alt: 'Slot Iklan Sponsor Resmi Nepal Market 2',
    active: true,
  },
];

/**
 * Memeriksa apakah suatu banner sponsor memenuhi syarat tayang saat ini.
 */
export function isSponsorBannerActive(banner: SponsorBanner, now: number = Date.now()): boolean {
  if (!banner.active) return false;

  if (banner.startsAt) {
    const startTime = new Date(banner.startsAt).getTime();
    if (!isNaN(startTime) && now < startTime) {
      return false;
    }
  }

  if (banner.endsAt) {
    const endTime = new Date(banner.endsAt).getTime();
    if (!isNaN(endTime) && now > endTime) {
      return false;
    }
  }

  return true;
}

/**
 * Mengambil seluruh banner sponsor aktif yang memenuhi jadwal tayang saat ini.
 */
export function getActiveSponsorBanners(now: number = Date.now()): SponsorBanner[] {
  return SPONSOR_BANNERS.filter((b) => isSponsorBannerActive(b, now));
}

/**
 * Mengambil satu banner sponsor aktif pertama (fallback single-banner).
 */
export function getActiveSponsorBanner(now: number = Date.now()): SponsorBanner | null {
  const activeBanners = getActiveSponsorBanners(now);
  return activeBanners.length > 0 ? activeBanners[0] : null;
}
