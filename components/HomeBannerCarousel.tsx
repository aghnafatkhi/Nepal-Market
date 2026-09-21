'use client';

import React, { useState, useEffect, useCallback, useRef, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ChevronLeft, 
  ChevronRight, 
  ArrowRight 
} from 'lucide-react';
import { getPromoBanners, PromoBanner } from '@/data/banners';

interface HomeBannerCarouselProps {
  onOpenSellModal?: () => void;
  onOpenCodGuideModal?: () => void;
  banners?: PromoBanner[];
  hasActiveProducts?: boolean;
  isError?: boolean;
  isLoading?: boolean;
  autoSlideInterval?: number;
}

// External store for prefers-reduced-motion (SSR-safe, React 19 recommended)
const subscribeReducedMotion = (callback: () => void) => {
  if (typeof window === 'undefined') return () => {};
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  mediaQuery.addEventListener('change', callback);
  return () => mediaQuery.removeEventListener('change', callback);
};

const getReducedMotionSnapshot = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

const getReducedMotionServerSnapshot = () => false;

export const HomeBannerCarousel: React.FC<HomeBannerCarouselProps> = ({
  onOpenSellModal,
  onOpenCodGuideModal,
  banners: propBanners,
  hasActiveProducts = false,
  isError = false,
  isLoading = false,
  autoSlideInterval = 5000,
}) => {
  const router = useRouter();
  
  // Dapatkan daftar banner sesuai ketersediaan produk aktif jika banners tidak dioper eksplisit
  const banners = propBanners || getPromoBanners(hasActiveProducts, isError);
  const count = banners.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [timerKey, setTimerKey] = useState(0);

  // Indeks aktif yang aman saat jumlah banner atau status katalog berubah
  const activeIndex = currentIndex < count ? currentIndex : 0;

  // Subscribed reduced-motion preference
  const prefersReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  );

  // Touch swipe coordinates
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const touchCurrentXRef = useRef<number | null>(null);
  const touchCurrentYRef = useRef<number | null>(null);

  // Handlers for next and prev with timer reset
  const handleNext = useCallback(() => {
    if (count <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % count);
  }, [count]);

  const handlePrev = useCallback(() => {
    if (count <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + count) % count);
  }, [count]);

  const handleManualNext = useCallback(() => {
    handleNext();
    setTimerKey((k) => k + 1);
  }, [handleNext]);

  const handleManualPrev = useCallback(() => {
    handlePrev();
    setTimerKey((k) => k + 1);
  }, [handlePrev]);

  const handleSelectSlide = useCallback((index: number) => {
    setCurrentIndex(index);
    setTimerKey((k) => k + 1);
  }, []);

  // Keyboard navigation on indicators or buttons (Left / Right Arrow)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      handleManualPrev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      handleManualNext();
    }
  };

  // Auto-advance timer (every ~5 seconds), paused during interaction or reduced motion
  useEffect(() => {
    if (isLoading || count <= 1 || isPaused || prefersReducedMotion) return;

    const timer = setInterval(() => {
      handleNext();
    }, autoSlideInterval);

    return () => clearInterval(timer);
  }, [count, isPaused, prefersReducedMotion, autoSlideInterval, handleNext, timerKey, isLoading]);

  // Handle CTA Click
  const handleCtaClick = (banner: PromoBanner) => {
    if (banner.ctaAction === 'cod_guide_modal' && onOpenCodGuideModal) {
      onOpenCodGuideModal();
    } else if (banner.ctaAction === 'sell_modal' && onOpenSellModal) {
      onOpenSellModal();
    } else if (banner.ctaHref && banner.ctaHref !== '#') {
      router.push(banner.ctaHref);
    }
  };

  // Touch Event Handlers for Mobile Swipe
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setIsPaused(true);
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    touchCurrentXRef.current = e.touches[0].clientX;
    touchCurrentYRef.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    touchCurrentXRef.current = e.touches[0].clientX;
    touchCurrentYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = () => {
    if (
      touchStartXRef.current !== null &&
      touchCurrentXRef.current !== null &&
      touchStartYRef.current !== null &&
      touchCurrentYRef.current !== null
    ) {
      const deltaX = touchStartXRef.current - touchCurrentXRef.current;
      const deltaY = Math.abs(touchStartYRef.current - touchCurrentYRef.current);

      // Trigger swipe if horizontal displacement is dominant and exceeds 40px
      if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > deltaY * 1.1) {
        if (deltaX > 0) {
          handleManualNext();
        } else {
          handleManualPrev();
        }
      }
    }

    // Reset touch coordinates
    touchStartXRef.current = null;
    touchStartYRef.current = null;
    touchCurrentXRef.current = null;
    touchCurrentYRef.current = null;

    // Small delay before resuming auto-advance
    setTimeout(() => {
      setIsPaused(false);
    }, 400);
  };

  // Tampilkan Skeleton Banner saat data katalog masih dimuat dari database
  if (isLoading) {
    return (
      <section
        id="home-banner-skeleton"
        aria-busy="true"
        aria-label="Memuat banner promosi"
        className="relative w-full mb-4 select-none"
      >
        <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-100 px-4 sm:px-6 py-3.5 sm:py-4 min-h-[105px] sm:min-h-[115px] flex flex-col justify-between animate-pulse">
          <div className="max-w-xl space-y-1.5">
            <div className="h-5 w-1/2 sm:w-1/3 rounded bg-slate-300" />
            <div className="h-3.5 w-3/4 sm:w-2/3 rounded bg-slate-200" />
          </div>
          <div className="flex items-center justify-between gap-3 mt-2">
            <div className="h-8 w-28 sm:w-32 rounded-md bg-slate-300" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section 
      id="home-banner-carousel"
      aria-roledescription="carousel"
      aria-label="Promosi dan Panduan Nepal Market"
      className="relative w-full mb-4 select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
      onKeyDown={handleKeyDown}
    >
      {/* Outer Card Container */}
      <div 
        className="relative overflow-hidden rounded-lg border border-slate-200"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Slides Track */}
        <div 
          className={`flex w-full ${prefersReducedMotion ? 'transition-none' : 'transition-transform duration-500 ease-out'}`}
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {banners.map((banner, index) => {
            const isActive = index === activeIndex;

            return (
              <div
                key={banner.id}
                id={`carousel-slide-${index}`}
                role="group"
                aria-roledescription="slide"
                aria-label={`Slide ${index + 1} dari ${count}: ${banner.title}`}
                aria-hidden={!isActive}
                inert={!isActive ? true : undefined}
                className={`w-full shrink-0 relative flex flex-col justify-between ${banner.theme.containerBg} px-4 sm:px-6 py-3.5 sm:py-4 min-h-[105px] sm:min-h-[115px]`}
              >
                {/* Banner Content (Title + Subtitle) */}
                <div className="relative z-10 max-w-xl">
                  <h2 className={`text-sm sm:text-base font-bold ${banner.theme.titleColor} tracking-tight leading-snug`}>
                    {banner.title}
                  </h2>
                  <p className={`mt-0.5 text-xs sm:text-sm ${banner.theme.descriptionColor} leading-relaxed line-clamp-1 sm:line-clamp-2`}>
                    {banner.description}
                  </p>
                </div>

                {/* Banner Action Row */}
                <div className="relative z-10 flex items-center justify-between gap-3 mt-2.5 pr-20 sm:pr-24">
                  <button
                    type="button"
                    id={`btn-carousel-cta-${banner.id}`}
                    onClick={() => handleCtaClick(banner)}
                    tabIndex={isActive ? 0 : -1}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors cursor-pointer ${banner.theme.ctaStyle} min-h-[38px] focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-600 active:scale-98`}
                  >
                    <span>{banner.ctaText}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Unified Single Tablist for Slide Indicators */}
        {count > 1 && (
          <div 
            className="absolute bottom-2.5 right-3 sm:right-4 z-20 flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/80 border border-slate-200"
            role="tablist"
            aria-label="Pilih slide banner"
          >
            {banners.map((b, idx) => {
              const isDotActive = idx === activeIndex;
              return (
                <button
                  key={`dot-${b.id}`}
                  id={`btn-carousel-indicator-${idx}`}
                  type="button"
                  role="tab"
                  aria-selected={isDotActive}
                  aria-label={`Lihat banner ${idx + 1}: ${b.title}`}
                  tabIndex={0}
                  onClick={() => handleSelectSlide(idx)}
                  className={`h-1.5 transition-all duration-200 rounded-full cursor-pointer focus:outline-hidden focus-visible:ring-1 focus-visible:ring-blue-600 ${
                    isDotActive 
                      ? 'w-4 bg-blue-600' 
                      : 'w-1.5 bg-slate-300 hover:bg-slate-400'
                  }`}
                />
              );
            })}
          </div>
        )}

        {/* Previous Button (Desktop only, mobile uses touch swipe & indicators) */}
        {count > 1 && (
          <button
            type="button"
            id="btn-carousel-prev"
            onClick={handleManualPrev}
            aria-label="Tampilkan banner sebelumnya"
            tabIndex={0}
            className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white hover:bg-slate-50 text-slate-700 items-center justify-center border border-slate-200 transition-colors cursor-pointer min-h-[36px] min-w-[36px] focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        {/* Next Button (Desktop only, mobile uses touch swipe & indicators) */}
        {count > 1 && (
          <button
            type="button"
            id="btn-carousel-next"
            onClick={handleManualNext}
            aria-label="Tampilkan banner selanjutnya"
            tabIndex={0}
            className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white hover:bg-slate-50 text-slate-700 items-center justify-center border border-slate-200 transition-colors cursor-pointer min-h-[36px] min-w-[36px] focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </section>
  );
};
