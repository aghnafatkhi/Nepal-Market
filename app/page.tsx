'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { X, AlertCircle, RefreshCw } from 'lucide-react';
import { Header } from '@/components/Header';
import { CategoryBar } from '@/components/CategoryBar';
import { ProductCard } from '@/components/ProductCard';
import { ProductSkeleton } from '@/components/ProductSkeleton';
import { EmptyState } from '@/components/EmptyState';
import { BottomNav } from '@/components/BottomNav';
import { QuickViewModal } from '@/components/QuickViewModal';
import { SellModal } from '@/components/SellModal';
import { SavedModal } from '@/components/SavedModal';
import { ProfileModal } from '@/components/ProfileModal';
import { CodGuideModal } from '@/components/CodGuideModal';
import { Footer } from '@/components/Footer';
import { HomeBannerCarousel } from '@/components/HomeBannerCarousel';
import { CategorySlug, Product, SortOption } from '@/types/market';
import { useAuth } from '@/contexts/AuthContext';
import { 
  fetchActiveProducts, 
  fetchProductsBySellerId, 
  fetchUserFavoriteIds, 
  toggleFavoriteInDb,
  updateProductStatusInDb,
  deleteProductFromDb
} from '@/lib/supabase/products';
import { 
  computeUserCategoryAffinity, 
  rankProductsForHome, 
  recordProductInteraction, 
  CategoryAffinityResult 
} from '@/lib/supabase/recommendations';

export default function HomePage() {
  const router = useRouter();
  const { user, isConfigured } = useAuth();

  // State data produk: tidak memakai produk demo palsu untuk mengisi katalog
  const [products, setProducts] = useState<Product[]>([]);
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [savedProductIds, setSavedProductIds] = useState<string[]>([]);
  const [hasLoadedFromDb, setHasLoadedFromDb] = useState(!isConfigured);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // State preferensi rekomendasi beranda (skor afinitas per kategori)
  const [userAffinity, setUserAffinity] = useState<CategoryAffinityResult>({
    categoryScores: {},
    normalizedAffinity: {},
    topCategory: null,
    totalScore: 0,
    hasSignificantPreference: false,
  });
  
  // State filter & search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategorySlug>('semua');
  const [sortBy, setSortBy] = useState<SortOption>('terbaru');
  const [selectedCondition, setSelectedCondition] = useState<string>('semua');
  
  // Loading & Pagination state
  const [isLoading, setIsLoading] = useState(isConfigured);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Modal states
  const [selectedProductForView, setSelectedProductForView] = useState<Product | null>(null);
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isCodGuideModalOpen, setIsCodGuideModalOpen] = useState(false);
  const [activeBottomTab, setActiveBottomTab] = useState<'home' | 'cari' | 'jual' | 'disimpan' | 'profil'>('home');

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Handler muat ulang manual (misal saat retry dari tombol)
  const handleRetryLoad = useCallback(async () => {
    if (!isConfigured) return;

    setIsLoading(true);
    setFetchError(null);

    try {
      const { products: dbProducts, hasMore: more, error } = await fetchActiveProducts({ page: 1, pageSize: 12 });
      if (error) {
        setFetchError(error.message || 'Gagal memuat produk dari server.');
      } else {
        setProducts(dbProducts);
        setHasMore(more);
        setPage(1);
        setFetchError(null);
      }
    } catch {
      setFetchError('Terjadi kendala jaringan saat memuat produk.');
    } finally {
      setHasLoadedFromDb(true);
      setIsLoading(false);
    }
  }, [isConfigured]);

  // Load produk dari Supabase jika configured (page 1) saat mount
  useEffect(() => {
    let isMounted = true;
    if (isConfigured) {
      fetchActiveProducts({ page: 1, pageSize: 12 })
        .then(({ products: dbProducts, hasMore: more, error }) => {
          if (!isMounted) return;
          if (!error) {
            setProducts(dbProducts);
            setHasMore(more);
            setPage(1);
          } else {
            setFetchError(error.message || 'Gagal memuat produk dari server.');
          }
          setHasLoadedFromDb(true);
          setIsLoading(false);
        })
        .catch(() => {
          if (!isMounted) return;
          setFetchError('Terjadi kendala jaringan saat memuat produk.');
          setHasLoadedFromDb(true);
          setIsLoading(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [isConfigured]);

  // Handler muat lebih banyak data produk (pagination)
  const handleLoadMore = async () => {
    if (!isConfigured || isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    const nextPage = page + 1;
    const { products: moreProducts, hasMore: moreAvailable, error } = await fetchActiveProducts({
      page: nextPage,
      pageSize: 12,
    });

    if (!error && moreProducts.length > 0) {
      setProducts((prev) => [...prev, ...moreProducts]);
      setPage(nextPage);
      setHasMore(moreAvailable);
    }
    setIsLoadingMore(false);
  };

  // Load user favorites dan user listings saat user login
  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    if (isConfigured) {
      // Ambil wishlist dari DB
      fetchUserFavoriteIds(user.id).then((ids) => {
        if (isMounted) setSavedProductIds(ids);
      });

      // Ambil iklan milik user dari DB
      fetchProductsBySellerId(user.id).then(({ products: userProds }) => {
        if (isMounted) setMyProducts(userProds);
      });
    }
    return () => {
      isMounted = false;
    };
  }, [user, isConfigured]);

  // Muat preferensi rekomendasi beranda (30 hari terakhir dengan time decay)
  useEffect(() => {
    let isMounted = true;
    computeUserCategoryAffinity(user?.id)
      .then((affinity) => {
        if (isMounted) {
          setUserAffinity(affinity);
        }
      })
      .catch(() => {
        // Fallback aman jika gagal
      });
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  // Filter & Multi-Factor Recommendation Ranking Logic:
  // Menggabungkan 50% kategori, 25% kebaruan, 15% popularitas, 10% variasi
  // Maksimal ~60% dari kategori minat utama, sisanya untuk discovery produk lain
  const filteredProducts = useMemo(() => {
    try {
      return rankProductsForHome(products, {
        affinity: userAffinity,
        sortBy,
        selectedCategory,
        selectedCondition,
        searchQuery,
        maxTopCategoryRatio: 0.60,
      });
    } catch {
      // Fallback aman jika terjadi kendala pada ranking
      return products.filter((product) => {
        if (product.isSold || !product.isAvailable) return false;
        if (selectedCategory !== 'semua' && product.category !== selectedCategory) return false;
        if (selectedCondition !== 'semua' && product.condition !== selectedCondition) return false;
        return true;
      });
    }
  }, [products, userAffinity, sortBy, selectedCategory, selectedCondition, searchQuery]);

  // Filter kategori berjalan lokal; skeleton tidak diperlukan.
  const handleSelectCategory = (cat: CategorySlug) => {
    if (cat === selectedCategory) return;
    setSelectedCategory(cat);
  };

  // Toggle simpan barang (wishlist)
  const handleToggleSave = async (productId: string) => {
    if (!user) {
      router.push('/login?redirectTo=/');
      return;
    }

    const isCurrentlySaved = savedProductIds.includes(productId);
    const targetProduct = products.find((p) => p.id === productId);
    
    // Update local UI optimistically
    setSavedProductIds((prev) =>
      isCurrentlySaved ? prev.filter((id) => id !== productId) : [...prev, productId]
    );

    // Rekomendasi: catat save (+3) atau unsave (-3)
    if (targetProduct) {
      recordProductInteraction({
        productId,
        category: targetProduct.category,
        type: isCurrentlySaved ? 'unsave' : 'save',
        userId: user.id,
      });

      // Segarkan afinitas kategori setelah interaksi
      computeUserCategoryAffinity(user.id)
        .then((aff) => {
          setUserAffinity(aff);
        })
        .catch(() => {});
    }

    // Sync ke Supabase jika login
    if (isConfigured) {
      await toggleFavoriteInDb(user.id, productId, isCurrentlySaved);
    }
  };

  // Tambah produk baru dari modal / form
  const handleAddProduct = (newProduct: Product) => {
    setProducts((prev) => [newProduct, ...prev]);
    setMyProducts((prev) => [newProduct, ...prev]);
    setSelectedCategory('semua');
  };

  // Tandai produk sudah terjual (hanya untuk seller yang bersangkutan)
  const handleMarkProductSold = async (productId: string) => {
    if (isConfigured && user) {
      await updateProductStatusInDb(productId, 'sold');
    }
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, isSold: true, isAvailable: false } : p))
    );
    setMyProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, isSold: true, isAvailable: false } : p))
    );
  };

  // Hapus produk
  const handleDeleteProduct = async (productId: string) => {
    if (isConfigured && user) {
      await deleteProductFromDb(productId);
    }
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    setMyProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  // Reset filter
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('semua');
    setSelectedCondition('semua');
    setSortBy('terbaru');
  };

  // Navigasi Bottom Nav Mobile
  const handleSelectBottomTab = (tab: 'home' | 'cari' | 'jual' | 'disimpan' | 'profil') => {
    setActiveBottomTab(tab);
    if (tab === 'home') {
      handleResetFilters();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (tab === 'cari') {
      const el = document.getElementById('search-input-mobile') || document.getElementById('search-input-desktop');
      if (el) {
        el.focus();
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (tab === 'jual') {
      router.push('/sell');
    } else if (tab === 'disimpan') {
      if (!user) {
        router.push('/login?redirectTo=/saved');
      } else {
        router.push('/saved');
      }
    } else if (tab === 'profil') {
      if (!user) {
        router.push('/login?redirectTo=/profile');
      } else {
        router.push('/profile');
      }
    }
  };

  // Cek apakah ada produk aktif (bukan sold) dari data nyata
  const hasActiveProducts = useMemo(() => {
    return products.some((p) => !p.isSold);
  }, [products]);

  // Daftar produk yang disimpan
  const savedProductsList = useMemo(() => {
    return products.filter((p) => savedProductIds.includes(p.id));
  }, [products, savedProductIds]);

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f7f5] pb-24 sm:pb-0 text-neutral-900">
      {/* Header Utama */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        savedCount={savedProductIds.length}
        onOpenSellModal={() => setIsSellModalOpen(true)}
        onOpenSavedModal={() => setIsSavedModalOpen(true)}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        onResetToHome={handleResetFilters}
        searchInputRef={searchInputRef}
      />

      {/* Kategori Bar (Horizontal Scroll di Mobile) */}
      <CategoryBar
        selectedCategory={selectedCategory}
        onSelectCategory={handleSelectCategory}
      />

      {/* Main Content Area */}
      <main id="main-content" className="flex-grow max-w-[1200px] w-full mx-auto px-4 sm:px-6 pt-4 sm:pt-6">
        
        {/* Slot Iklan Banner Sponsor di Bagian Atas Halaman Utama */}
        <HomeBannerCarousel />

        {/* Section Header: Judul Katalog, Jumlah Produk, dan Filter */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4 sm:mb-5">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-semibold text-neutral-950 tracking-[-0.025em]">
                {selectedCategory === 'semua' ? 'Semua Barang' : `Kategori ${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}`}
              </h1>
            </div>
            <p className="mt-1 text-sm text-neutral-500">{filteredProducts.length} barang tersedia</p>
          </div>

          {/* Kontrol Ringkas: Filter Kondisi & Urutan */}
          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
            <select
              id="select-condition-filter"
              aria-label="Filter Kondisi Barang"
              value={selectedCondition}
              onChange={(e) => setSelectedCondition(e.target.value)}
              className="min-h-11 rounded-xl border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-700 outline-none transition focus:border-blue-500 focus:ring-3 focus:ring-blue-100 cursor-pointer"
            >
              <option value="semua">Semua kondisi</option>
              <option value="Baru">Baru</option>
              <option value="Bekas">Bekas</option>
            </select>

            <select
              id="select-sort-products"
              aria-label="Urutkan produk"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="min-h-11 rounded-xl border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-700 outline-none transition focus:border-blue-500 focus:ring-3 focus:ring-blue-100 cursor-pointer"
            >
              <option value="terbaru">Terbaru</option>
              <option value="harga-rendah">Harga Terendah</option>
              <option value="harga-tinggi">Harga Tertinggi</option>
            </select>
          </div>
        </div>

        {/* Info filter aktif */}
        {(selectedCategory !== 'semua' || searchQuery || selectedCondition !== 'semua') && (
          <div className="flex items-center gap-2 mb-4 text-xs text-neutral-600 flex-wrap">
            <span className="sr-only">Filter aktif:</span>
            {selectedCategory !== 'semua' && (
              <span className="inline-flex min-h-8 items-center gap-1 rounded-lg bg-blue-50 px-2.5 text-blue-700 font-medium">
                {selectedCategory}
                <button 
                  type="button" 
                  onClick={() => setSelectedCategory('semua')} 
                  className="hover:text-blue-900 ml-0.5"
                  aria-label="Hapus filter kategori"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {searchQuery && (
              <span className="inline-flex min-h-8 items-center gap-1 rounded-lg bg-blue-50 px-2.5 text-blue-700 font-medium">
                &ldquo;{searchQuery}&rdquo;
                <button 
                  type="button" 
                  onClick={() => setSearchQuery('')} 
                  className="hover:text-blue-900 ml-0.5"
                  aria-label="Hapus kata kunci"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedCondition !== 'semua' && (
              <span className="inline-flex min-h-8 items-center gap-1 rounded-lg bg-blue-50 px-2.5 text-blue-700 font-medium">
                {selectedCondition}
                <button 
                  type="button" 
                  onClick={() => setSelectedCondition('semua')} 
                  className="hover:text-blue-900 ml-0.5"
                  aria-label="Hapus filter kondisi"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={handleResetFilters}
              className="min-h-8 text-blue-700 hover:text-blue-900 font-semibold text-xs ml-1 cursor-pointer"
            >
              Reset Filter
            </button>
          </div>
        )}

        {/* Product Grid / Error State / Empty State */}
        {isLoading ? (
          <ProductSkeleton count={10} />
        ) : fetchError ? (
          <div id="catalog-error-state" className="flex flex-col items-center justify-center py-14 px-4 text-center max-w-lg mx-auto my-4">
            <div className="w-11 h-11 rounded-xl bg-neutral-200/70 text-neutral-600 flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-slate-500" />
            </div>
            <h2 className="text-base font-bold text-slate-900">
              Katalog Belum Dapat Dimuat
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-sm leading-relaxed">
              Terjadi kendala saat memuat produk dari server. Silakan coba muat ulang halaman atau periksa koneksi internet kamu.
            </p>
            <button
              type="button"
              id="btn-retry-fetch-catalog"
              onClick={handleRetryLoad}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-950 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold transition-colors min-h-[44px] cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Coba Muat Ulang</span>
            </button>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="space-y-6">
            <div 
              id="product-grid" 
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-5"
            >
              {filteredProducts.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isSaved={savedProductIds.includes(product.id)}
                  onToggleSave={handleToggleSave}
                  onOpenDetail={setSelectedProductForView}
                  imagePriority={index === 0}
                />
              ))}
            </div>

            {/* Tombol Muat Lebih Banyak (Pagination) */}
            {hasMore && isConfigured && (
              <div className="flex justify-center pt-4">
                <button
                  id="btn-load-more-products"
                  type="button"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="px-5 py-2 bg-white border border-neutral-200 hover:border-neutral-400 text-neutral-800 font-semibold text-sm rounded-xl transition-colors flex items-center gap-2 min-h-[44px] cursor-pointer disabled:opacity-60"
                >
                  {isLoadingMore ? (
                    <>
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span>Memuat...</span>
                    </>
                  ) : (
                    <span>Lihat Lebih Banyak</span>
                  )}
                </button>
              </div>
            )}
          </div>
        ) : (
          <EmptyState 
            query={searchQuery}
            isInitialEmpty={
              filteredProducts.length === 0 &&
              !searchQuery.trim() &&
              selectedCategory === 'semua' &&
              selectedCondition === 'semua'
            }
            onReset={handleResetFilters}
            onOpenSellModal={() => setIsSellModalOpen(true)}
          />
        )}

      </main>

      {/* Footer Nepal Market */}
      <Footer className="mt-16" />

      {/* Bottom Navigation Mobile */}
      <BottomNav
        activeTab={activeBottomTab}
        savedCount={savedProductIds.length}
        onSelectTab={handleSelectBottomTab}
      />

      {/* Modal Quick View Detail Produk */}
      <QuickViewModal
        product={selectedProductForView}
        isOpen={!!selectedProductForView}
        isSaved={selectedProductForView ? savedProductIds.includes(selectedProductForView.id) : false}
        onClose={() => setSelectedProductForView(null)}
        onToggleSave={handleToggleSave}
      />

      {/* Modal Jual Barang Baru */}
      <SellModal
        isOpen={isSellModalOpen}
        onClose={() => setIsSellModalOpen(false)}
        onAddProduct={handleAddProduct}
      />

      {/* Modal Daftar Tersimpan */}
      <SavedModal
        isOpen={isSavedModalOpen}
        onClose={() => setIsSavedModalOpen(false)}
        savedProducts={savedProductsList}
        onRemoveSaved={handleToggleSave}
        onSelectProduct={setSelectedProductForView}
      />

      {/* Modal Profil Pengguna */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        savedCount={savedProductIds.length}
        myListingsCount={myProducts.length}
        myProducts={myProducts}
        onOpenSellModal={() => setIsSellModalOpen(true)}
        onOpenSavedModal={() => setIsSavedModalOpen(true)}
        onMarkProductSold={handleMarkProductSold}
        onDeleteProduct={handleDeleteProduct}
      />

      {/* Modal Panduan Transaksi COD */}
      <CodGuideModal
        isOpen={isCodGuideModalOpen}
        onClose={() => setIsCodGuideModalOpen(false)}
      />

    </div>
  );
}
