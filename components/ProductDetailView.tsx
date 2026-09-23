'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
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
  Check,
  Edit3,
  Package,
  Instagram,
  ImageIcon
} from 'lucide-react';
import { Product } from '@/types/market';
import { getProductById, getProductsBySeller, formatConditionLabel, formatRupiah } from '@/data/products';
import { ProductCard } from '@/components/ProductCard';
import { ContactSellerModal } from '@/components/ContactSellerModal';
import { ReportModal } from '@/components/ReportModal';
import { SellModal } from '@/components/SellModal';
import { SavedModal } from '@/components/SavedModal';
import { ProfileModal } from '@/components/ProfileModal';
import { useAuth } from '@/contexts/AuthContext';
import { fetchProductById, fetchUserFavoriteIds, toggleFavoriteInDb } from '@/lib/supabase/products';
import { recordProductInteraction } from '@/lib/supabase/recommendations';

interface ProductDetailViewProps {
  productId: string;
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({ productId }) => {
  const router = useRouter();
  const { user, isConfigured } = useAuth();
  const searchParams = useSearchParams();
  const justListed = searchParams?.get('justListed') === 'true';
  const justUpdated = searchParams?.get('justUpdated') === 'true';

  const [notification, setNotification] = useState<string | null>(
    justListed ? 'Barang berhasil dipasang.' : justUpdated ? 'Perubahan barang berhasil disimpan.' : null
  );

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
  const [imgErrorMap, setImgErrorMap] = useState<Record<number, boolean>>({});
  const [sellerAvatarError, setSellerAvatarError] = useState(false);

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

  // Rekomendasi: Catat sinyal View (+1) saat detail dibuka, dan Dwell (+1) jika melihat minimal 8 detik
  React.useEffect(() => {
    if (!product) return;

    // Sinyal: Membuka halaman detail produk: +1 (deduplikasi per sesi browser)
    recordProductInteraction({
      productId: product.id,
      category: product.category,
      type: 'view',
      userId: user?.id,
    });

    // Sinyal: Melihat produk beberapa saat, minimal 8 detik: +1 tambahan
    const dwellTimer = setTimeout(() => {
      recordProductInteraction({
        productId: product.id,
        category: product.category,
        type: 'dwell',
        userId: user?.id,
      });
    }, 8000);

    return () => {
      clearTimeout(dwellTimer);
    };
  }, [product, user?.id]);

  const handleToggleSave = async () => {
    if (!user) {
      const currentUrl = typeof window !== 'undefined' ? (window.location.pathname + window.location.search) : `/product/${productId}`;
      router.push(`/login?redirectTo=${encodeURIComponent(currentUrl)}`);
      return;
    }
    const nextSaved = !isSaved;
    setIsSaved(nextSaved);

    // Rekomendasi: Menyimpan (+3) atau Membatalkan simpan (-3)
    if (product) {
      recordProductInteraction({
        productId: product.id,
        category: product.category,
        type: nextSaved ? 'save' : 'unsave',
        userId: user.id,
      });
    }

    if (isConfigured) {
      await toggleFavoriteInDb(user.id, productId, isSaved);
    }
  };

  const seller = product?.seller;
  const rawPhone = (seller?.whatsapp || '').trim();
  const cleanPhone = rawPhone.replace(/\D/g, '').replace(/^0/, '62');
  const hasWhatsApp = Boolean(cleanPhone && cleanPhone.length >= 8);

  const rawIg = (seller?.instagram || '').trim().replace(/^@/, '');
  const hasInstagram = Boolean(rawIg);
  const instagramUrl = hasInstagram ? `https://instagram.com/${rawIg}` : null;

  const handleContactWhatsApp = () => {
    if (!hasWhatsApp || !product) return;
    // Rekomendasi: Menekan tombol hubungi penjual: +4
    recordProductInteraction({
      productId: product.id,
      category: product.category,
      type: 'contact',
      userId: user?.id,
    });
    const msg = `Halo ${seller?.name || 'Penjual'}, saya tertarik dengan barang "${product.title}" (${formatRupiah(product.price)}) di Nepal Market. Apakah masih tersedia?`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
  };

  const handleContactInstagram = () => {
    if (!instagramUrl || !product) return;
    // Rekomendasi: Menekan tombol hubungi penjual: +4
    recordProductInteraction({
      productId: product.id,
      category: product.category,
      type: 'contact',
      userId: user?.id,
    });
    window.open(instagramUrl, '_blank', 'noopener,noreferrer');
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
    return getProductsBySeller(product.seller?.name || '', product.id).filter(p => !p.isSold).slice(0, 4);
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
      <div className="min-h-screen bg-[#f7f7f5] text-neutral-900 pb-28 md:pb-16 animate-pulse">
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
          <div className="max-w-[1100px] mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between h-14">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-md bg-slate-200" />
                <div className="h-4 w-36 bg-slate-200 rounded" />
              </div>
              <div className="w-8 h-8 rounded-md bg-slate-200" />
            </div>
          </div>
        </header>

        <main className="max-w-[1100px] mx-auto px-4 sm:px-6 pt-4 sm:pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Foto Skeleton 1:1 Aspect Square */}
            <div className="lg:col-span-7 flex flex-col gap-2.5">
              <div className="relative aspect-square w-full bg-slate-200/80 rounded-lg border border-slate-200" />
              <div className="grid grid-cols-5 gap-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="aspect-square rounded-md bg-slate-200/60 border border-slate-200" />
                ))}
              </div>
            </div>

            {/* Info Skeleton */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-4 sm:p-5 space-y-4">
              <div className="h-4 w-32 bg-slate-200 rounded" />
              <div className="h-8 w-48 bg-slate-200 rounded" />
              <div className="h-6 w-3/4 bg-slate-200 rounded" />
              <div className="h-24 w-full bg-slate-100 rounded-md" />
              <div className="h-28 w-full bg-slate-100 rounded-md" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Error State: Product Not Found
  if (!product) {
    return (
      <div className="min-h-screen bg-[#f7f7f5] flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-lg p-6 sm:p-8 text-center max-w-md w-full">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <Layers className="w-6 h-6" />
          </div>
          <h1 className="text-base font-bold text-slate-900 mb-1">Barang Tidak Ditemukan</h1>
          <p className="text-xs text-slate-500 mb-5 leading-relaxed">
            Iklan barang ini mungkin telah dihapus oleh pemiliknya atau tautan tidak sesuai.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Link
              href="/"
              className="px-4 py-2 rounded-md bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors min-h-[40px] flex items-center justify-center"
            >
              Kembali ke Beranda
            </Link>
            <Link
              href="/search"
              className="px-4 py-2 rounded-md border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors min-h-[40px] flex items-center justify-center"
            >
              Cari Barang Lain
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isSold = Boolean(product.isSold || !product.isAvailable);
  const isLongDescription = product.description.length > 220;
  const currentImg = galleryImages[selectedImageIndex];
  const isCurrentImgError = Boolean(imgErrorMap[selectedImageIndex]);
  const hasCurrentImg = Boolean(currentImg && currentImg.trim().length > 0 && !isCurrentImgError);

  return (
    <div className="min-h-screen bg-[#f7f7f5] text-neutral-900 pb-28 md:pb-16">
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                id="btn-back-detail"
                href="/"
                className="w-9 h-9 min-h-[38px] min-w-[38px] -ml-1 rounded-md flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
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

            <div className="flex items-center gap-1">
              {/* Share button */}
              <button
                id="btn-share-product"
                type="button"
                onClick={handleShare}
                className="relative w-9 h-9 min-h-[38px] min-w-[38px] rounded-md flex items-center justify-center text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Bagikan tautan barang"
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
                className="hidden sm:flex w-9 h-9 min-h-[38px] min-w-[38px] rounded-md items-center justify-center text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label={isSaved ? 'Hapus dari simpanan' : 'Simpan barang'}
              >
                <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-blue-600 text-blue-600' : ''}`} />
              </button>

              {/* Laporkan button desktop */}
              <button
                id="btn-report-desktop"
                type="button"
                onClick={() => setIsReportModalOpen(true)}
                className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors min-h-[38px] cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Laporkan</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-[1100px] mx-auto px-4 sm:px-6 pt-4 sm:pt-6">
        {/* Notifikasi Status */}
        {notification && (
          <div
            role="status"
            className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-md flex items-center justify-between text-xs font-medium text-emerald-800"
          >
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{notification}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="text-emerald-700 hover:text-emerald-900 p-1 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Banner Pemilik Iklan */}
        {user && product && user.id === product.seller?.id && (
          <div className="mb-4 p-3.5 bg-blue-50/70 border border-blue-200 rounded-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-blue-600 text-white flex items-center justify-center shrink-0">
                <Package className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-blue-950">
                  Barang jualan kamu
                </p>
                <p className="text-[11px] text-blue-700">
                  Status: <span className="font-semibold uppercase">{product.status || (product.isSold ? 'Terjual' : 'Aktif')}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Link
                href={`/my-products/${product.id}/edit`}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors min-h-[38px]"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Barang</span>
              </Link>
              <Link
                href="/my-products"
                className="flex-1 sm:flex-none inline-flex items-center justify-center px-3 py-1.5 rounded-md border border-blue-300 bg-white hover:bg-blue-50 text-blue-800 text-xs font-medium transition-colors min-h-[38px]"
              >
                <span>Produk Saya</span>
              </Link>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* KOLOM KIRI: Galeri Foto */}
          <div className="lg:col-span-7 flex flex-col gap-2.5">
            {/* Foto Utama */}
            <div className="relative aspect-square w-full bg-slate-100 rounded-lg overflow-hidden border border-slate-200 group">
              {hasCurrentImg ? (
                <Image
                  src={currentImg}
                  alt={`${product.title} - Foto ${selectedImageIndex + 1}`}
                  fill
                  priority
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 650px"
                  className={`object-cover ${isSold ? 'opacity-70 grayscale-[0.4]' : ''}`}
                  referrerPolicy="no-referrer"
                  onError={() => setImgErrorMap(prev => ({ ...prev, [selectedImageIndex]: true }))}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 p-6 text-center">
                  <ImageIcon className="w-12 h-12 stroke-1 mb-2 text-slate-300" />
                  <span className="text-xs text-slate-400 font-medium">Foto barang tidak tersedia</span>
                </div>
              )}

              {/* Status Terjual atau Kondisi */}
              <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5">
                <span 
                  id="product-badge-condition"
                  className="inline-flex items-center px-2 py-0.5 bg-slate-900/85 text-white text-xs font-medium rounded-sm"
                >
                  {formatConditionLabel(product.condition)}
                </span>
                {isSold && (
                  <span 
                    id="product-badge-sold"
                    className="inline-flex items-center px-2 py-0.5 bg-slate-900 text-white text-xs font-semibold rounded-sm uppercase tracking-wide"
                  >
                    Terjual
                  </span>
                )}
              </div>

              {/* Indikator Jumlah Foto */}
              {galleryImages.length > 1 && (
                <div className="absolute bottom-3 right-3 z-10 px-2 py-0.5 rounded-sm bg-slate-900/70 text-white text-[11px] font-medium">
                  {selectedImageIndex + 1} / {galleryImages.length}
                </div>
              )}

              {/* Navigasi Next & Prev */}
              {galleryImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center transition-opacity opacity-80 group-hover:opacity-100 cursor-pointer"
                    aria-label="Foto sebelumnya"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center transition-opacity opacity-80 group-hover:opacity-100 cursor-pointer"
                    aria-label="Foto berikutnya"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Galeri (Maksimal 5) */}
            {galleryImages.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {galleryImages.map((img, idx) => {
                  const isCurrent = selectedImageIndex === idx;
                  const isErr = imgErrorMap[idx];
                  return (
                    <button
                      key={idx}
                      id={`thumbnail-btn-${idx}`}
                      type="button"
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`relative aspect-square rounded-md overflow-hidden border-2 transition-all cursor-pointer bg-slate-100 ${
                        isCurrent
                          ? 'border-blue-600'
                          : 'border-slate-200 hover:border-slate-400 opacity-70 hover:opacity-100'
                      }`}
                      aria-label={`Pilih foto ${idx + 1}`}
                    >
                      {!isErr && img ? (
                        <Image
                          src={img}
                          alt={`Thumbnail ${idx + 1}`}
                          fill
                          sizes="(max-width: 640px) 20vw, 100px"
                          className="object-cover"
                          referrerPolicy="no-referrer"
                          onError={() => setImgErrorMap(prev => ({ ...prev, [idx]: true }))}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <ImageIcon className="w-4 h-4" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* KOLOM KANAN: Informasi Inti, Kontak, Penjual & Langkah COD */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-4 sm:p-5 space-y-4">
            
            {/* Header: Kategori, Harga, Judul */}
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <Link
                  href={`/search?category=${product.category}`}
                  className="font-medium text-blue-600 hover:underline capitalize"
                >
                  {product.category}
                </Link>
                <span>•</span>
                <span>{formatConditionLabel(product.condition)}</span>
                <span>•</span>
                <span className={isSold ? 'text-slate-400 font-medium' : 'text-emerald-600 font-medium'}>
                  {isSold ? 'Sudah terjual' : 'Tersedia'}
                </span>
              </div>

              {/* Harga (Paling mudah ditemukan) */}
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className={`tracking-tight ${
                  isSold 
                    ? 'text-2xl sm:text-3xl font-semibold text-slate-400 line-through' 
                    : 'text-2xl sm:text-3xl font-bold text-slate-900'
                }`}>
                  {formatRupiah(product.price)}
                </span>
                {isSold && (
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-medium rounded-sm">
                    Terjual
                  </span>
                )}
              </div>

              {/* Nama Barang */}
              <h1 className="mt-1 text-base sm:text-lg font-semibold text-slate-900 leading-snug break-words">
                {product.title}
              </h1>
            </div>

            {/* Lokasi COD & Waktu */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="truncate">Lokasi COD: <strong className="text-slate-900 font-semibold">{product.location || 'Sesuai kesepakatan'}</strong></span>
              </div>
              <div className="flex items-center gap-1 text-slate-400 text-[11px] shrink-0">
                <Clock className="w-3 h-3" />
                <span>{product.postedAt}</span>
              </div>
            </div>

            {/* Tombol Kontak Seller (Desktop) */}
            <div className="pt-3 border-t border-slate-100 hidden md:block">
              {isSold ? (
                <button
                  type="button"
                  disabled
                  className="w-full py-2.5 px-4 rounded-md bg-slate-100 text-slate-400 font-medium text-xs sm:text-sm cursor-not-allowed text-center border border-slate-200 min-h-[42px]"
                >
                  Barang Sudah Terjual
                </button>
              ) : user && product && user.id === product.seller?.id ? (
                <Link
                  href={`/my-products/${product.id}/edit`}
                  className="w-full py-2.5 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 min-h-[42px]"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit Barang</span>
                </Link>
              ) : hasWhatsApp ? (
                <div className="flex flex-col gap-2">
                  <button
                    id="btn-contact-seller-desktop"
                    type="button"
                    onClick={handleContactWhatsApp}
                    className="w-full py-2.5 px-4 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 min-h-[42px] cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Hubungi via WhatsApp</span>
                  </button>
                  {hasInstagram && (
                    <button
                      type="button"
                      onClick={handleContactInstagram}
                      className="w-full py-2 px-4 rounded-md border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium text-xs transition-colors flex items-center justify-center gap-1.5 min-h-[38px] cursor-pointer"
                    >
                      <Instagram className="w-3.5 h-3.5" />
                      <span>Hubungi via Instagram (@{rawIg})</span>
                    </button>
                  )}
                </div>
              ) : hasInstagram ? (
                <button
                  id="btn-contact-seller-desktop"
                  type="button"
                  onClick={handleContactInstagram}
                  className="w-full py-2.5 px-4 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 min-h-[42px] cursor-pointer"
                >
                  <Instagram className="w-4 h-4" />
                  <span>Hubungi via Instagram (@{rawIg})</span>
                </button>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-800 flex items-start gap-2">
                  <span>Penjual belum mencantumkan nomor WhatsApp atau akun Instagram.</span>
                </div>
              )}
            </div>

            {/* Informasi Penjual (Tanpa kartu bersarang, cukup divider) */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Penjual
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative w-9 h-9 rounded-full overflow-hidden bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {seller?.avatar && !sellerAvatarError ? (
                      <Image
                        src={seller.avatar}
                        alt={`Foto profil ${seller.name || 'penjual'}`}
                        fill
                        sizes="36px"
                        className="object-cover"
                        referrerPolicy="no-referrer"
                        onError={() => setSellerAvatarError(true)}
                      />
                    ) : (
                      seller?.name ? seller.name.charAt(0).toUpperCase() : 'W'
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                        {seller?.name || 'Warga Komunitas'}
                      </span>
                      {seller?.isVerified && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right text-[11px] text-slate-500 shrink-0">
                  <div>{seller?.activeListingsCount || 1} barang aktif</div>
                  <div className="text-slate-400">{seller?.joinedDate || 'Terdaftar'}</div>
                </div>
              </div>
            </div>

            {/* Deskripsi Barang */}
            <div className="pt-3 border-t border-slate-100">
              <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Deskripsi
              </div>
              <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                <p>
                  {isLongDescription && !isDescriptionExpanded
                    ? `${product.description.slice(0, 200)}...`
                    : product.description}
                </p>
                {isLongDescription && (
                  <button
                    id="btn-toggle-description"
                    type="button"
                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                    className="mt-1 text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                  >
                    {isDescriptionExpanded ? 'Tampilkan Lebih Sedikit' : 'Selengkapnya'}
                  </button>
                )}
              </div>
            </div>

          </div>

        </div>

        {/* Barang Lain dari Penjual Ini */}
        {sellerOtherProducts.length > 0 && (
          <div className="mt-10 pt-6 border-t border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  Barang lain dari {seller?.name || 'penjual ini'}
                </h2>
              </div>
              <Link
                href={`/search?q=${encodeURIComponent(seller?.name || '')}`}
                className="text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                Lihat semua
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3">
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
        )}
      </main>

      {/* MOBILE STICKY ACTION BAR */}
      <aside 
        id="mobile-sticky-action-bar"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 p-2.5 pb-[calc(0.6rem+env(safe-area-inset-bottom))] flex items-center gap-2"
      >
        <div className="flex flex-col min-w-0 pr-1 flex-1">
          <span className="text-[10px] text-slate-400 font-medium uppercase leading-none">Harga</span>
          <span className={`text-sm sm:text-base font-bold truncate leading-tight mt-0.5 ${
            isSold ? 'text-slate-400 line-through' : 'text-slate-900'
          }`}>
            {formatRupiah(product.price)}
          </span>
        </div>

        {/* Mobile Bookmark Button */}
        <button
          id="btn-mobile-sticky-save"
          type="button"
          onClick={handleToggleSave}
          className={`w-10 h-10 shrink-0 rounded-md border flex items-center justify-center transition-colors cursor-pointer min-h-[40px] min-w-[40px] ${
            isSaved 
              ? 'bg-blue-50 border-blue-600 text-blue-600' 
              : 'bg-white border-slate-200 text-slate-700'
          }`}
          aria-label={isSaved ? 'Hapus simpanan' : 'Simpan'}
        >
          <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-blue-600' : ''}`} />
        </button>

        {/* Mobile Action Button */}
        {user && product && user.id === product.seller?.id ? (
          <Link
            id="btn-mobile-sticky-owner-edit"
            href={`/my-products/${product.id}/edit`}
            className="h-10 px-4 rounded-md bg-blue-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 min-h-[40px]"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit</span>
          </Link>
        ) : isSold ? (
          <button
            type="button"
            disabled
            className="h-10 px-3 rounded-md bg-slate-100 text-slate-400 text-xs font-medium cursor-not-allowed border border-slate-200 min-h-[40px]"
          >
            Terjual
          </button>
        ) : hasWhatsApp ? (
          <button
            id="btn-mobile-sticky-contact"
            type="button"
            onClick={handleContactWhatsApp}
            className="h-10 px-3.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 min-h-[40px] cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>WhatsApp</span>
          </button>
        ) : hasInstagram ? (
          <button
            id="btn-mobile-sticky-contact"
            type="button"
            onClick={handleContactInstagram}
            className="h-10 px-3.5 rounded-md bg-slate-900 text-white text-xs font-semibold flex items-center justify-center gap-1.5 min-h-[40px] cursor-pointer"
          >
            <Instagram className="w-4 h-4" />
            <span>Instagram</span>
          </button>
        ) : (
          <button
            type="button"
            disabled
            className="h-10 px-3 rounded-md bg-slate-100 text-slate-400 text-xs font-medium cursor-not-allowed border border-slate-200 min-h-[40px]"
          >
            Kontak Belum Ada
          </button>
        )}
      </aside>

      {/* Modals */}
      <ContactSellerModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        product={product}
        onTrackContact={() => {
          if (product) {
            recordProductInteraction({
              productId: product.id,
              category: product.category,
              type: 'contact',
              userId: user?.id,
            });
          }
        }}
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
