'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Bookmark, 
  Share2, 
  AlertTriangle, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  MessageCircle, 
  ChevronRight,
  ChevronLeft,
  Store,
  Calendar,
  Layers,
  Check
} from 'lucide-react';
import { Product } from '@/types/market';
import { getProductById, getProductsBySeller, formatRupiah, INITIAL_PRODUCTS } from '@/data/products';
import { ProductCard } from '@/components/ProductCard';
import { ContactSellerModal } from '@/components/ContactSellerModal';
import { ReportModal } from '@/components/ReportModal';
import { BottomNav } from '@/components/BottomNav';
import { SellModal } from '@/components/SellModal';
import { SavedModal } from '@/components/SavedModal';
import { ProfileModal } from '@/components/ProfileModal';
import { useAuth } from '@/contexts/AuthContext';
import { fetchProductById, fetchUserFavoriteIds, toggleFavoriteInDb } from '@/lib/supabase/products';

interface ProductDetailViewProps {
  productId: string;
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({ productId }) => {
  const { user, isConfigured } = useAuth();
  const initialLocal = getProductById(productId);
  const [product, setProduct] = useState<Product | null>(initialLocal || null);
  const [isLoadingProduct, setIsLoadingProduct] = useState(!initialLocal && isConfigured);

  // States
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isCopiedLink, setIsCopiedLink] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // General Nav Modals
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Fetch product from Supabase if not found locally
  React.useEffect(() => {
    let isMounted = true;
    if (!initialLocal && isConfigured) {
      fetchProductById(productId).then(({ product: dbProduct }) => {
        if (!isMounted) return;
        if (dbProduct) {
          setProduct(dbProduct);
        }
        setIsLoadingProduct(false);
      });
    }
    return () => {
      isMounted = false;
    };
  }, [productId, initialLocal, isConfigured]);

  // Sync user saved status
  React.useEffect(() => {
    if (user && isConfigured) {
      fetchUserFavoriteIds(user.id).then((ids) => {
        setIsSaved(ids.includes(productId));
      });
    }
  }, [user, productId, isConfigured]);

  const handleToggleSave = async () => {
    const nextSaved = !isSaved;
    setIsSaved(nextSaved);
    if (user && isConfigured) {
      await toggleFavoriteInDb(user.id, productId, isSaved);
    }
  };

  // Photos gallery list (max 5 photos)
  const galleryImages = useMemo(() => {
    if (!product) return [];
    if (product.images && product.images.length > 0) {
      return product.images.slice(0, 5);
    }
    return [product.imageUrl];
  }, [product]);

  // Other products from same seller (excluding current product)
  const sellerOtherProducts = useMemo(() => {
    if (!product) return [];
    const fromSeller = getProductsBySeller(product.seller.name, product.id).filter(p => !p.isSold);
    if (fromSeller.length > 0) {
      return fromSeller;
    }
    // Fallback: recommend items from same category
    return INITIAL_PRODUCTS.filter(
      (p) => p.category === product.category && p.id !== product.id && !p.isSold
    ).slice(0, 4);
  }, [product]);

  // Copy shareable link
  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setIsCopiedLink(true);
      setTimeout(() => setIsCopiedLink(false), 2000);
    }
  };

  // Next & Prev Image Gallery
  const handlePrevImage = () => {
    setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : galleryImages.length - 1));
  };

  const handleNextImage = () => {
    setSelectedImageIndex((prev) => (prev < galleryImages.length - 1 ? prev + 1 : 0));
  };

  // Loading State
  if (isLoadingProduct) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-medium">Memuat rincian barang...</p>
        </div>
      </div>
    );
  }

  // Error State: Product Not Found
  if (!product) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-8 sm:p-12 text-center max-w-md w-full shadow-xs">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
            <Layers className="w-8 h-8" />
          </div>
          <h1 className="text-lg font-bold text-slate-900 mb-2">Barang Tidak Ditemukan</h1>
          <p className="text-xs text-slate-500 mb-6 leading-relaxed">
            Iklan barang ini mungkin telah dihapus oleh pemiliknya atau tautan yang kamu buka kurang tepat.
          </p>
          <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
            <Link
              href="/"
              className="px-5 py-2.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors min-h-[44px] flex items-center justify-center"
            >
              Kembali ke Beranda
            </Link>
            <Link
              href="/search"
              className="px-5 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors min-h-[44px] flex items-center justify-center"
            >
              Cari Barang Lain
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isSold = Boolean(product.isSold || !product.isAvailable);
  const seller = product.seller;
  const isLongDescription = product.description.length > 200;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-28 md:pb-16">
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200/90 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center gap-3">
              <Link
                id="btn-back-detail"
                href="/"
                className="w-10 h-10 -ml-2 rounded-lg flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                aria-label="Kembali ke Beranda"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate max-w-[200px] sm:max-w-md">
                <Link href="/" className="hover:text-blue-600">Beranda</Link>
                <ChevronRight className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                <Link href={`/search?category=${product.category}`} className="hover:text-blue-600 capitalize">
                  {product.category}
                </Link>
                <ChevronRight className="w-3.5 h-3.5 shrink-0 text-slate-400 hidden sm:inline" />
                <span className="text-slate-800 font-medium truncate hidden sm:inline">{product.title}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Share button */}
              <button
                id="btn-share-product"
                type="button"
                onClick={handleShare}
                title="Salin tautan barang"
                className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors relative"
                aria-label="Bagikan barang"
              >
                {isCopiedLink ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Share2 className="w-4 h-4" />
                )}
                {isCopiedLink && (
                  <span className="absolute -bottom-7 right-0 text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded shadow-xs whitespace-nowrap">
                    Tautan tersalin!
                  </span>
                )}
              </button>

              {/* Bookmark button desktop */}
              <button
                id="btn-toggle-save-desktop"
                type="button"
                onClick={handleToggleSave}
                className="hidden sm:flex w-10 h-10 rounded-lg items-center justify-center text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                aria-label={isSaved ? 'Hapus dari simpanan' : 'Simpan barang'}
              >
                <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-blue-600 text-blue-600' : ''}`} />
              </button>

              {/* Laporkan button desktop */}
              <button
                id="btn-report-desktop"
                type="button"
                onClick={() => setIsReportModalOpen(true)}
                className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Laporkan</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* LEFT COLUMN: Photo Gallery (max 5 photos) */}
          <div className="lg:col-span-7 flex flex-col gap-3">
            {/* Main Stage Image */}
            <div className="relative aspect-4/3 sm:aspect-16/11 w-full bg-slate-100 rounded-2xl overflow-hidden border border-slate-200/90 shadow-xs group">
              <Image
                src={galleryImages[selectedImageIndex]}
                alt={`${product.title} - Foto ${selectedImageIndex + 1}`}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="object-cover"
                referrerPolicy="no-referrer"
              />

              {/* Sold Out Overlay Banner or Condition Badge */}
              <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
                {isSold ? (
                  <span 
                    id="product-badge-sold"
                    className="inline-flex items-center gap-1 px-3 py-1 bg-slate-950/90 backdrop-blur-xs text-white text-xs font-bold rounded-lg shadow-sm"
                  >
                    Sudah terjual
                  </span>
                ) : (
                  <span 
                    id="product-badge-condition"
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900/80 backdrop-blur-xs text-white text-xs font-medium rounded-lg shadow-xs"
                  >
                    {product.condition}
                  </span>
                )}
              </div>

              {/* Image Counter Badge */}
              {galleryImages.length > 1 && (
                <div className="absolute bottom-3 right-3 z-10 px-2.5 py-1 rounded-md bg-slate-900/70 backdrop-blur-xs text-white text-xs font-medium tracking-wide">
                  {selectedImageIndex + 1} / {galleryImages.length}
                </div>
              )}

              {/* Prev & Next Arrows (jika foto lebih dari 1) */}
              {galleryImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrevImage}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-md flex items-center justify-center transition-opacity opacity-80 group-hover:opacity-100"
                    aria-label="Foto sebelumnya"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextImage}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-md flex items-center justify-center transition-opacity opacity-80 group-hover:opacity-100"
                    aria-label="Foto berikutnya"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Gallery (maksimal 5 thumbnail) */}
            {galleryImages.length > 1 && (
              <div className="grid grid-cols-5 gap-2 sm:gap-3">
                {galleryImages.map((img, idx) => {
                  const isCurrent = selectedImageIndex === idx;
                  return (
                    <button
                      key={idx}
                      id={`thumbnail-btn-${idx}`}
                      type="button"
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-150 ${
                        isCurrent
                          ? 'border-blue-600 ring-2 ring-blue-600/30 shadow-xs'
                          : 'border-slate-200/90 hover:border-slate-400 opacity-75 hover:opacity-100'
                      }`}
                      aria-label={`Pilih foto ${idx + 1}`}
                    >
                      <Image
                        src={img}
                        alt={`Thumbnail ${idx + 1}`}
                        fill
                        sizes="100px"
                        className="object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Product Info, Seller Card, CTA */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* Main Product Card */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
              
              {/* Category, Condition & Status Row */}
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/search?category=${product.category}`}
                  className="px-2.5 py-1 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold capitalize transition-colors"
                >
                  {product.category}
                </Link>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-slate-600 font-medium">{product.condition}</span>
                <span className="text-xs text-slate-400">•</span>
                <span className={`text-xs font-semibold ${isSold ? 'text-slate-500' : 'text-emerald-600'}`}>
                  {isSold ? 'Sudah terjual' : 'Tersedia'}
                </span>
              </div>

              {/* Title & Price */}
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
                  {product.title}
                </h1>
                <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-blue-600 tracking-tight">
                  {formatRupiah(product.price)}
                </div>
              </div>

              {/* Location & Time Info */}
              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Tempat serah terima: <strong className="text-slate-700 font-medium">{product.location}</strong></span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 text-slate-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{product.postedAt}</span>
                </div>
              </div>

              {/* Description Section with "Selengkapnya" toggle */}
              <div className="pt-3 border-t border-slate-100">
                <h2 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Deskripsi Barang
                </h2>
                <div className="text-sm text-slate-700 leading-relaxed space-y-2 whitespace-pre-line">
                  <p>
                    {isLongDescription && !isDescriptionExpanded
                      ? `${product.description.slice(0, 190)}...`
                      : product.description}
                  </p>
                  {isLongDescription && (
                    <button
                      id="btn-toggle-description"
                      type="button"
                      onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-block focus:outline-hidden"
                    >
                      {isDescriptionExpanded ? 'Tampilkan Lebih Sedikit' : 'Selengkapnya'}
                    </button>
                  )}
                </div>
              </div>

              {/* Desktop Action Buttons */}
              <div className="pt-3 border-t border-slate-100 hidden md:flex flex-col gap-2.5">
                {isSold ? (
                  <button
                    id="btn-contact-seller-desktop-disabled"
                    type="button"
                    disabled
                    className="w-full py-3 px-4 rounded-xl bg-slate-200 text-slate-400 font-semibold text-sm cursor-not-allowed text-center min-h-[48px]"
                  >
                    Barang Sudah Terjual
                  </button>
                ) : (
                  <button
                    id="btn-contact-seller-desktop"
                    type="button"
                    onClick={() => setIsContactModalOpen(true)}
                    className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm transition-colors shadow-xs flex items-center justify-center gap-2 min-h-[48px]"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Hubungi Seller</span>
                  </button>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <button
                    id="btn-save-bottom-desktop"
                    type="button"
                    onClick={handleToggleSave}
                    className={`py-2.5 px-3 rounded-lg border text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 min-h-[42px] ${
                      isSaved
                        ? 'bg-blue-50 border-blue-600 text-blue-700'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-blue-600' : ''}`} />
                    <span>{isSaved ? 'Tersimpan' : 'Simpan Barang'}</span>
                  </button>

                  <button
                    id="btn-report-bottom-desktop"
                    type="button"
                    onClick={() => setIsReportModalOpen(true)}
                    className="py-2.5 px-3 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-rose-600 hover:bg-rose-50/50 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 min-h-[42px]"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Laporkan</span>
                  </button>
                </div>
              </div>

            </div>

            {/* SELLER CARD */}
            <div 
              id="seller-card"
              className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Informasi Penjual
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-medium">
                  Pengguna Komunitas
                </span>
              </div>

              <div className="flex items-center gap-3.5 pt-1">
                {/* Seller Avatar */}
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-bold text-lg flex items-center justify-center shrink-0 shadow-xs">
                  {seller.name.charAt(0)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-slate-900 truncate">
                      {seller.name}
                    </h3>
                    {seller.isVerified && (
                      <span title="Penjual Terverifikasi" className="inline-flex items-center">
                        <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {seller.location}
                  </p>
                </div>
              </div>

              {/* Seller Metadata: Joined Date & Active Listings */}
              <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{seller.joinedDate || 'Bergabung 2023'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Store className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{seller.activeListingsCount || 1} barang aktif</span>
                </div>
              </div>
            </div>

            {/* Safety Reminder / COD Tips */}
            <div className="p-3.5 bg-slate-100/80 rounded-xl border border-slate-200/80 text-[11px] text-slate-600 leading-relaxed">
              <strong className="text-slate-800 font-semibold block mb-0.5">Tips Transaksi Aman:</strong>
              Sepakati COD di tempat ramai seperti kantin atau lobi. Periksa kondisi fisik barang secara teliti sebelum membayar langsung kepada seller.
            </div>

          </div>

        </div>

        {/* RELATED PRODUCTS: Other items from same seller */}
        <div className="mt-12 pt-8 border-t border-slate-200/80">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Barang lain dari {seller.name}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Lihat barang lain yang dijual oleh penjual ini atau dalam kategori serupa.
              </p>
            </div>
            <Link
              href={`/search?q=${encodeURIComponent(seller.name)}`}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 hidden sm:inline"
            >
              Lihat semua
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {sellerOtherProducts.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                isSaved={false}
                onToggleSave={() => {}}
              />
            ))}
          </div>
        </div>
      </main>

      {/* MOBILE STICKY ACTION BAR */}
      <aside 
        id="mobile-sticky-action-bar"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-lg flex items-center gap-2.5"
      >
        <div className="flex flex-col min-w-0 pr-2">
          <span className="text-[10px] text-slate-400 font-medium uppercase leading-none">Harga</span>
          <span className="text-base font-extrabold text-blue-600 truncate leading-tight mt-0.5">
            {formatRupiah(product.price)}
          </span>
        </div>

        {/* Mobile Bookmark Button */}
        <button
          id="btn-mobile-sticky-save"
          type="button"
          onClick={handleToggleSave}
          className={`w-11 h-11 shrink-0 rounded-xl border flex items-center justify-center transition-colors ${
            isSaved 
              ? 'bg-blue-50 border-blue-600 text-blue-600' 
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
          aria-label={isSaved ? 'Hapus simpanan' : 'Simpan'}
        >
          <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-blue-600' : ''}`} />
        </button>

        {/* Mobile Report Button */}
        <button
          id="btn-mobile-sticky-report"
          type="button"
          onClick={() => setIsReportModalOpen(true)}
          className="w-11 h-11 shrink-0 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-rose-600 flex items-center justify-center transition-colors"
          aria-label="Laporkan barang"
        >
          <AlertTriangle className="w-5 h-5" />
        </button>

        {/* Mobile Hubungi Seller Button */}
        {isSold ? (
          <button
            id="btn-mobile-sticky-disabled"
            type="button"
            disabled
            className="flex-1 h-11 px-3 rounded-xl bg-slate-200 text-slate-400 text-xs font-semibold cursor-not-allowed flex items-center justify-center"
          >
            Sudah Terjual
          </button>
        ) : (
          <button
            id="btn-mobile-sticky-contact"
            type="button"
            onClick={() => setIsContactModalOpen(true)}
            className="flex-1 h-11 px-4 rounded-xl bg-blue-600 active:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Hubungi Seller</span>
          </button>
        )}
      </aside>

      {/* Modals */}
      <ContactSellerModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        product={product}
      />

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        product={product}
      />

      <SellModal
        isOpen={isSellModalOpen}
        onClose={() => setIsSellModalOpen(false)}
        onAddProduct={() => setIsSellModalOpen(false)}
      />

      <SavedModal
        isOpen={isSavedModalOpen}
        onClose={() => setIsSavedModalOpen(false)}
        savedProducts={isSaved ? [product] : []}
        onRemoveSaved={() => setIsSaved(false)}
        onSelectProduct={() => setIsSavedModalOpen(false)}
      />

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        savedCount={isSaved ? 1 : 0}
        myListingsCount={0}
        onOpenSellModal={() => {
          setIsProfileModalOpen(false);
          setIsSellModalOpen(true);
        }}
        onOpenSavedModal={() => {
          setIsProfileModalOpen(false);
          setIsSavedModalOpen(true);
        }}
      />
    </div>
  );
};
