'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUpDown, X, PlusCircle, AlertCircle } from 'lucide-react';
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
import { HomeBannerCarousel } from '@/components/HomeBannerCarousel';
import { INITIAL_PRODUCTS } from '@/data/products';
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
  const [activeBottomTab, setActiveBottomTab] = useState<'home' | 'cari' | 'jual' | 'disimpan' | 'profil'>('home');

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load produk dari Supabase jika configured (page 1)
  useEffect(() => {
    let isMounted = true;
    if (isConfigured) {
      fetchActiveProducts({ page: 1, pageSize: 12 }).then(({ products: dbProducts, hasMore: more, error }) => {
        if (!isMounted) return;
        if (!error) {
          setProducts(dbProducts);
          setHasMore(more);
          setPage(1);
        } else {
          console.warn('Gagal memuat dari Supabase:', error.message);
        }
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
        <HomeBannerCarousel onOpenSellModal={() => setIsSellModalOpen(true)} />

        {/* Section Header: "Baru di Nepal Market" & Kontrol Urutan */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Barang Terbaru
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
              {filteredProducts.length}
            </span>
          </div>

          {/* Baris Filter & Sort */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            {/* Filter Kondisi Cepat */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400 hidden sm:inline">Kondisi:</span>
              <button
                type="button"
                onClick={() => setSelectedCondition('semua')}
                className={`px-3 py-2 rounded-lg font-medium transition-colors min-h-[44px] ${
                  selectedCondition === 'semua'
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setSelectedCondition('Baru')}
                className={`px-3 py-2 rounded-lg font-medium transition-colors min-h-[44px] ${
                  selectedCondition === 'Baru'
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Baru
              </button>
              <button
                type="button"
                onClick={() => setSelectedCondition('Bekas - Mulus')}
                className={`px-3 py-2 rounded-lg font-medium transition-colors min-h-[44px] ${
                  selectedCondition === 'Bekas - Mulus'
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Bekas Mulus
              </button>
            </div>

            {/* Pemisah Kecil */}
            <div className="w-px h-5 bg-slate-200 shrink-0 mx-1" />

            {/* Dropdown Urutkan */}
            <div className="flex items-center gap-1 relative shrink-0">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                id="select-sort-products"
                aria-label="Urutkan produk"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-white border border-slate-200 text-xs font-medium text-slate-700 py-2 px-2.5 rounded-lg focus:outline-hidden focus:border-blue-500 min-h-[44px]"
              >
                <option value="terbaru">Terbaru</option>
                <option value="harga-rendah">Harga Terendah</option>
                <option value="harga-tinggi">Harga Tertinggi</option>
              </select>
            </div>
          </div>
        </div>

        {/* Info filter aktif */}
        {(selectedCategory !== 'semua' || searchQuery || selectedCondition !== 'semua') && (
          <div className="flex items-center gap-2 mb-4 text-xs text-slate-600 flex-wrap">
            <span>Menampilkan hasil:</span>
            {selectedCategory !== 'semua' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md font-medium">
                Kategori: {selectedCategory}
                <button 
                  type="button" 
                  onClick={() => setSelectedCategory('semua')} 
                  className="hover:text-blue-900 ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md font-medium">
                Kata kunci: &ldquo;{searchQuery}&rdquo;
                <button 
                  type="button" 
                  onClick={() => setSearchQuery('')} 
                  className="hover:text-blue-900 ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedCondition !== 'semua' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md font-medium">
                Kondisi: {selectedCondition}
                <button 
                  type="button" 
                  onClick={() => setSelectedCondition('semua')} 
                  className="hover:text-blue-900 ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-blue-600 hover:underline font-medium text-xs ml-1"
            >
              Hapus Semua Filter
            </button>
          </div>
        )}

        {/* Product Grid / Empty State */}
        {isLoading ? (
          <ProductSkeleton count={10} />
        ) : filteredProducts.length > 0 ? (
          <div className="space-y-6">
            <div 
              id="product-grid" 
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4"
            >
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isSaved={savedProductIds.includes(product.id)}
                  onToggleSave={handleToggleSave}
                  onOpenDetail={setSelectedProductForView}
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
                  className="px-6 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 font-semibold text-sm rounded-xl shadow-xs transition-colors flex items-center gap-2 min-h-[44px] disabled:opacity-60"
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
      <footer className="mt-16 border-t border-slate-200/80 bg-white py-8 text-center text-xs text-slate-500">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-left">
              <span className="font-bold text-slate-800 text-sm">Nepal Market</span>
              <p className="mt-0.5 text-slate-400">
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

    </div>
  );
}
