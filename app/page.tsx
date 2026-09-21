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

export default function HomePage() {
  const router = useRouter();
  const { user, isConfigured } = useAuth();

  // State data produk: tidak memakai produk demo palsu untuk mengisi katalog
  const [products, setProducts] = useState<Product[]>([]);
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [savedProductIds, setSavedProductIds] = useState<string[]>([]);
  const [hasLoadedFromDb, setHasLoadedFromDb] = useState(!isConfigured);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
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

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Jangan tampilkan produk yang sudah terjual di feed utama
      if (product.isSold || !product.isAvailable) {
        return false;
      }

      // Filter kategori
      if (selectedCategory !== 'semua' && product.category !== selectedCategory) {
        return false;
      }

      // Filter kondisi
      if (selectedCondition !== 'semua' && product.condition !== selectedCondition) {
        return false;
      }

      // Filter search query
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase().trim();
        const matchesTitle = product.title.toLowerCase().includes(query);
        const matchesLocation = product.location.toLowerCase().includes(query);
        const matchesDescription = product.description.toLowerCase().includes(query);
        const matchesSeller = product.seller.name.toLowerCase().includes(query);
        if (!matchesTitle && !matchesLocation && !matchesDescription && !matchesSeller) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'harga-rendah') {
        return a.price - b.price;
      }
      if (sortBy === 'harga-tinggi') {
        return b.price - a.price;
      }
      return 0;
    });
  }, [products, selectedCategory, selectedCondition, searchQuery, sortBy]);

  // Efek simulasi loading saat kategori diubah
  const handleSelectCategory = (cat: CategorySlug) => {
    if (cat === selectedCategory) return;
    setIsLoading(true);
    setSelectedCategory(cat);
    setTimeout(() => {
      setIsLoading(false);
    }, 150);
  };

  // Toggle simpan barang (wishlist)
  const handleToggleSave = async (productId: string) => {
    if (!user) {
      router.push('/login?redirectTo=/');
      return;
    }

    const isCurrentlySaved = savedProductIds.includes(productId);
    
    // Update local UI optimistically
    setSavedProductIds((prev) =>
      isCurrentlySaved ? prev.filter((id) => id !== productId) : [...prev, productId]
    );

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
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] pb-24 sm:pb-12 text-[#1E293B]">
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
      <main id="main-content" className="flex-grow max-w-[1200px] w-full mx-auto px-4 sm:px-6 pt-3 sm:pt-5">
        
        {/* Banner Carousel di Bagian Atas Homepage */}
        <HomeBannerCarousel 
          hasActiveProducts={hasActiveProducts}
          isError={Boolean(fetchError)}
          isLoading={!hasLoadedFromDb || isLoading}
          onOpenSellModal={() => setIsSellModalOpen(true)} 
          onOpenCodGuideModal={() => setIsCodGuideModalOpen(true)}
        />

        {/* Section Header: Judul Katalog, Jumlah Produk, dan Filter */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3">
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              {selectedCategory === 'semua' ? 'Semua Barang' : `Kategori ${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}`}
            </h1>
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {filteredProducts.length} barang
            </span>
          </div>

          {/* Kontrol Ringkas: Filter Kondisi & Urutan */}
          <div className="flex items-center gap-2">
            <select
              id="select-condition-filter"
              aria-label="Filter Kondisi Barang"
              value={selectedCondition}
              onChange={(e) => setSelectedCondition(e.target.value)}
              className="bg-white border border-slate-200 text-xs font-medium text-slate-700 py-1.5 px-2.5 rounded-md focus:outline-hidden focus:border-blue-600 min-h-[38px] cursor-pointer"
            >
              <option value="semua">Semua Kondisi</option>
              <option value="Baru">Baru</option>
              <option value="Bekas - Seperti Baru">Bekas - Seperti Baru</option>
              <option value="Bekas - Mulus">Bekas - Mulus</option>
              <option value="Bekas - Layak">Bekas - Layak</option>
            </select>

            <select
              id="select-sort-products"
              aria-label="Urutkan produk"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-white border border-slate-200 text-xs font-medium text-slate-700 py-1.5 px-2.5 rounded-md focus:outline-hidden focus:border-blue-600 min-h-[38px] cursor-pointer"
            >
              <option value="terbaru">Terbaru</option>
              <option value="harga-rendah">Harga Terendah</option>
              <option value="harga-tinggi">Harga Tertinggi</option>
            </select>
          </div>
        </div>

        {/* Info filter aktif */}
        {(selectedCategory !== 'semua' || searchQuery || selectedCondition !== 'semua') && (
          <div className="flex items-center gap-2 mb-3 text-xs text-slate-600 flex-wrap">
            <span>Filter aktif:</span>
            {selectedCategory !== 'semua' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-md font-medium">
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
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-md font-medium">
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
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-md font-medium">
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
              className="text-blue-600 hover:underline font-medium text-xs ml-1 cursor-pointer"
            >
              Reset Filter
            </button>
          </div>
        )}

        {/* Product Grid / Error State / Empty State */}
        {isLoading ? (
          <ProductSkeleton count={10} />
        ) : fetchError ? (
          <div id="catalog-error-state" className="flex flex-col items-center justify-center py-10 px-4 text-center bg-white rounded-lg border border-slate-200 max-w-lg mx-auto my-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center mb-3">
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
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-medium transition-colors min-h-[44px] cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-900"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Coba Muat Ulang</span>
            </button>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="space-y-6">
            <div 
              id="product-grid" 
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4"
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
                  className="px-5 py-2 bg-white border border-slate-300 hover:bg-slate-50 hover:border-slate-400 text-slate-700 font-medium text-sm rounded-md transition-colors flex items-center gap-2 min-h-[44px] cursor-pointer disabled:opacity-60"
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

      {/* Footer Ringan Komunitas */}
      <footer className="mt-14 border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-left">
              <span className="font-bold text-slate-900 text-sm">Nepal Market</span>
              <p className="mt-0.5 text-slate-500">
                Platform jual beli langsung (COD) untuk warga komunitas Nepal.
              </p>
            </div>
            <div className="text-xs text-slate-400">
              © {new Date().getFullYear()} Nepal Market • Jual beli praktis sistem COD
            </div>
          </div>
        </div>
      </footer>

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
