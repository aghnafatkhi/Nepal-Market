'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { DbSponsorBanner } from '@/lib/supabase/types';
import { fetchActivePublicSponsorBanners } from '@/lib/supabase/sponsors';

interface HomeBannerCarouselProps {
  banners?: DbSponsorBanner[];
  className?: string;
}

/**
 * Komponen Slot Iklan Sponsor di Bagian Atas Halaman Utama Nepal Market.
 * Mengambil data banner langsung dari tabel Supabase `sponsor_banners` (hanya status 'active' & valid jadwal).
 * Mendukung banner tunggal maupun carousel otomatis jika terdapat lebih dari 1 iklan sponsor aktif.
 */
export const HomeBannerCarousel: React.FC<HomeBannerCarouselProps> = ({
  banners: propBanners,
  className = '',
}) => {
  const [banners, setBanners] = useState<DbSponsorBanner[]>(propBanners || []);
  const [isLoaded, setIsLoaded] = useState<boolean>(propBanners !== undefined);

  // Ambil data dari tabel Supabase sponsor_banners jika tidak dipassing dari props
  useEffect(() => {
    if (propBanners !== undefined) {
      setBanners(propBanners);
      setIsLoaded(true);
      return;
    }

    let isMounted = true;
    fetchActivePublicSponsorBanners()
      .then(({ data, error }) => {
        if (!isMounted) return;
        if (error) {
          // Log error secara aman tanpa membuat homepage error
          console.warn('Gagal memuat sponsor banner homepage:', error.message);
          setBanners([]);
        } else {
          setBanners(data || []);
        }
        setIsLoaded(true);
      })
      .catch((err) => {
        console.warn('Kendala koneksi sponsor banner homepage:', err);
        if (!isMounted) return;
        setBanners([]);
        setIsLoaded(true);
      });

    return () => {
      isMounted = false;
    };
  }, [propBanners]);

  const count = banners.length;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Touch swipe handling untuk perangkat mobile
  const touchStartX = useRef<number | null>(null);
  const touchCurrentX = useRef<number | null>(null);

  const nextSlide = useCallback(() => {
    if (count <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % count);
  }, [count]);

  const prevSlide = useCallback(() => {
    if (count <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + count) % count);
  }, [count]);

  // Rotasi otomatis setiap 5 detik jika ada > 1 iklan aktif dan tidak sedang di-hover/touch
  useEffect(() => {
    if (count <= 1 || isPaused) return;

    const interval = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => clearInterval(interval);
  }, [count, isPaused, nextSlide]);

  // Reset index jika count berkurang
  useEffect(() => {
    if (currentIndex >= count && count > 0) {
      setCurrentIndex(0);
    }
  }, [count, currentIndex]);

  // Jika belum selesai load atau tidak ada sponsor aktif sama sekali:
  // Sembunyikan seluruh bagian banner tanpa menyisakan ruang kosong
  if (!isLoaded || count === 0) {
    return null;
  }

  // ==============================================================================
  // JIKA HANYA ADA 1 SPONSOR AKTIF: Tampilkan banner biasa tanpa kontrol carousel
  // ==============================================================================
  if (count === 1) {
    const singleBanner = banners[0];
    return (
      <aside 
        id="sponsor-banner-slot" 
        aria-label={`Iklan Sponsor: ${singleBanner.sponsor_name}`} 
        className="w-full mb-4"
      >
        <a
          id={`sponsor-banner-link-${singleBanner.id}`}
          href={singleBanner.target_url || '#'}
          target="_blank"
          rel="noopener noreferrer sponsored"
          aria-label={`Kunjungi sponsor: ${singleBanner.sponsor_name}`}
          className={`group relative block w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-100 transition-opacity hover:opacity-95 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-600 ${className}`}
        >
          {/* Label Kecil "Iklan" */}
          <span 
            id={`badge-sponsor-label-${singleBanner.id}`}
            className="absolute top-2 right-2 z-10 px-1.5 py-0.5 text-[10px] font-medium tracking-wide bg-slate-900/60 text-white rounded backdrop-blur-xs select-none pointer-events-none"
          >
            Iklan
          </span>

          {/* Desktop & Tablet Image (Aspect 5:1 / 1500x300) */}
          <div className="hidden sm:block relative w-full aspect-[5/1] overflow-hidden">
            <Image
              src={singleBanner.desktop_image_url}
              alt={singleBanner.alt_text || `Iklan Sponsor ${singleBanner.sponsor_name}`}
              fill
              sizes="(max-width: 1200px) 100vw, 1200px"
              priority
              className="object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Mobile Image (Aspect 8:3 / 1200x450) */}
          <div className="block sm:hidden relative w-full aspect-[8/3] overflow-hidden">
            <Image
              src={singleBanner.mobile_image_url}
              alt={singleBanner.alt_text || `Iklan Sponsor ${singleBanner.sponsor_name}`}
              fill
              sizes="100vw"
              priority
              className="object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </a>
      </aside>
    );
  }

  // ==============================================================================
  // JIKA ADA LEBIH DARI 1 SPONSOR AKTIF: Carousel Otomatis + Swipe + Indikator Titik
  // ==============================================================================
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchCurrentX.current = e.touches[0].clientX;
    setIsPaused(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchCurrentX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current !== null && touchCurrentX.current !== null) {
      const diff = touchStartX.current - touchCurrentX.current;
      const threshold = 40; // minimum jarak swipe (px)
      if (diff > threshold) {
        nextSlide();
      } else if (diff < -threshold) {
        prevSlide();
      }
    }
    touchStartX.current = null;
    touchCurrentX.current = null;
    setIsPaused(false);
  };

  return (
    <aside
      id="sponsor-banner-carousel"
      aria-label="Carousel Iklan Sponsor Nepal Market"
      className="w-full mb-4"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className={`relative w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-100 ${className}`}>
        {/* Label Kecil "Iklan" */}
        <span
          id="badge-carousel-sponsor-label"
          className="absolute top-2 right-2 z-20 px-1.5 py-0.5 text-[10px] font-medium tracking-wide bg-slate-900/60 text-white rounded backdrop-blur-xs select-none pointer-events-none"
        >
          Iklan
        </span>

        {/* Carousel Track Slider */}
        <div
          id="sponsor-carousel-track"
          className="flex w-full transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {banners.map((banner, index) => (
            <div
              key={banner.id}
              className="w-full shrink-0 grow-0 basis-full"
              aria-hidden={index !== currentIndex}
            >
              <a
                id={`sponsor-banner-link-${banner.id}`}
                href={banner.target_url || '#'}
                target="_blank"
                rel="noopener noreferrer sponsored"
                aria-label={`Kunjungi sponsor: ${banner.sponsor_name}`}
                tabIndex={index === currentIndex ? 0 : -1}
                className="group relative block w-full focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-600 transition-opacity hover:opacity-95"
              >
                {/* Desktop & Tablet Image (Aspect 5:1 / 1500x300) */}
                <div className="hidden sm:block relative w-full aspect-[5/1] overflow-hidden">
                  <Image
                    src={banner.desktop_image_url}
                    alt={banner.alt_text || `Iklan Sponsor ${banner.sponsor_name}`}
                    fill
                    sizes="(max-width: 1200px) 100vw, 1200px"
                    priority={index === 0}
                    className="object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Mobile Image (Aspect 8:3 / 1200x450) */}
                <div className="block sm:hidden relative w-full aspect-[8/3] overflow-hidden">
                  <Image
                    src={banner.mobile_image_url}
                    alt={banner.alt_text || `Iklan Sponsor ${banner.sponsor_name}`}
                    fill
                    sizes="100vw"
                    priority={index === 0}
                    className="object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </a>
            </div>
          ))}
        </div>

        {/* Indikator Titik Kecil di Bagian Bawah Banner */}
        <div
          id="sponsor-carousel-dots"
          className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-900/40 backdrop-blur-xs select-none"
        >
          {banners.map((banner, idx) => {
            const isActive = idx === currentIndex;
            return (
              <button
                key={`dot-${banner.id}`}
                id={`btn-dot-banner-${idx}`}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Pindah ke banner sponsor ${idx + 1}: ${banner.sponsor_name}`}
                aria-current={isActive ? 'true' : undefined}
                className={`transition-all duration-300 rounded-full cursor-pointer focus:outline-hidden focus-visible:ring-1 focus-visible:ring-white ${
                  isActive
                    ? 'w-4 h-1.5 bg-white'
                    : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/80'
                }`}
              />
            );
          })}
        </div>
      </div>
    </aside>
  );
};
