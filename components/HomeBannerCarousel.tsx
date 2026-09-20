'use client';

import React, { useState, useEffect, useCallback, useRef, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, 
  ShoppingBag, 
  Handshake, 
  ChevronLeft, 
  ChevronRight, 
  ArrowRight 
} from 'lucide-react';
import { getPromoBanners, PromoBanner } from '@/data/banners';

interface HomeBannerCarouselProps {
  onOpenSellModal?: () => void;
  banners?: PromoBanner[];
  hasActiveProducts?: boolean;
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
  banners: propBanners,
  hasActiveProducts = false,
  autoSlideInterval = 5000,
}) => {
  const router = useRouter();
  
  // Dapatkan daftar banner sesuai ketersediaan produk aktif jika banners tidak dioper eksplisit
  const banners = propBanners || getPromoBanners(hasActiveProducts);
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
    if (count <= 1 || isPaused || prefersReducedMotion) return;

    const timer = setInterval(() => {
      handleNext();
    }, autoSlideInterval);

    return () => clearInterval(timer);
  }, [count, isPaused, prefersReducedMotion, autoSlideInterval, handleNext, timerKey]);

  // Handle CTA Click
  const handleCtaClick = (banner: PromoBanner) => {
    if (banner.ctaAction === 'sell_modal' && onOpenSellModal) {
      onOpenSellModal();
    } else {
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

  // Helper to render icon
  const renderIcon = (iconName: PromoBanner['badgeIcon']) => {
    switch (iconName) {
      case 'Sparkles':
        return <Sparkles className="w-3.5 h-3.5 shrink-0" />;
      case 'ShoppingBag':
        return <ShoppingBag className="w-3.5 h-3.5 shrink-0" />;
      case 'Handshake':
        return <Handshake className="w-3.5 h-3.5 shrink-0" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 shrink-0" />;
    }
  };

  return (
    <section 
      id="home-banner-carousel"
      aria-roledescription="carousel"
      aria-label="Promosi dan Panduan Komunitas Nepal Market"
      className="relative w-full mb-5 select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
      onKeyDown={handleKeyDown}
    >
      {/* Outer Card Container */}
      <div 
        className="relative overflow-hidden rounded-2xl border border-slate-800/10 shadow-xs"
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
                className={`w-full shrink-0 relative flex flex-col justify-between ${banner.theme.containerBg} px-4 sm:px-10 py-3.5 sm:py-4.5 min-h-[140px] sm:min-h-[155px]`}
              >
                {/* Banner Content (Badge + Title + Subtitle) */}
                <div className="relative z-10 max-w-xl">
                  {/* Badge */}
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-semibold border mb-1.5 backdrop-blur-xs w-fit ${banner.theme.badgeStyle}`}>
                    {renderIcon(banner.badgeIcon)}
                    <span>{banner.badge}</span>
                  </div>

                  {/* Title */}
                  <h2 className={`text-sm sm:text-base md:text-lg font-bold ${banner.theme.titleColor} tracking-tight leading-snug line-clamp-2`}>
                    {banner.title}
                  </h2>

                  {/* Description */}
                  <p className={`mt-1 text-xs sm:text-sm ${banner.theme.descriptionColor} line-clamp-2 leading-relaxed`}>
                    {banner.description}
                  </p>
                </div>

                {/* Banner Action Row */}
                <div className="relative z-10 flex items-center justify-between gap-3 mt-3 pr-24 sm:pr-28">
                  <button
                    type="button"
                    id={`btn-carousel-cta-${banner.id}`}
                    onClick={() => handleCtaClick(banner)}
                    tabIndex={isActive ? 0 : -1}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer ${banner.theme.ctaStyle} min-h-[44px] focus:outline-hidden focus:ring-2 focus:ring-white/50 active:scale-98`}
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
            className="absolute bottom-3.5 right-3.5 sm:right-6 z-20 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-slate-950/45 backdrop-blur-xs border border-white/10"
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
                  className={`h-1.5 transition-all duration-300 rounded-full cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-white ${
                    isDotActive 
                      ? 'w-5 bg-white' 
                      : 'w-1.5 bg-white/40 hover:bg-white/70'
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
            className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-slate-900/40 hover:bg-slate-900/75 text-white/80 hover:text-white backdrop-blur-xs items-center justify-center border border-white/10 transition-all opacity-90 hover:opacity-100 cursor-pointer min-h-[44px] min-w-[44px] focus:outline-hidden focus:ring-2 focus:ring-white/50"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* Next Button (Desktop only, mobile uses touch swipe & indicators) */}
        {count > 1 && (
          <button
            type="button"
            id="btn-carousel-next"
            onClick={handleManualNext}
            aria-label="Tampilkan banner berikutnya"
            tabIndex={0}
            className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-slate-900/40 hover:bg-slate-900/75 text-white/80 hover:text-white backdrop-blur-xs items-center justify-center border border-white/10 transition-all opacity-90 hover:opacity-100 cursor-pointer min-h-[44px] min-w-[44px] focus:outline-hidden focus:ring-2 focus:ring-white/50"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </section>
  );
};
