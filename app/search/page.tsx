'use client';

import React, { useState, useMemo, useEffect, Suspense, useCallback, useSyncExternalStore } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Search, 
  SlidersHorizontal, 
  RotateCcw, 
  ArrowUpDown, 
  X, 
  ArrowLeft,
  ChevronDown,
  History
} from 'lucide-react';
import { INITIAL_PRODUCTS, CATEGORIES } from '@/data/products';
import { CategorySlug, ConditionFilter, Product, SortOption } from '@/types/market';
import { ProductCard } from '@/components/ProductCard';
import { SearchFilterSheet } from '@/components/SearchFilterSheet';
import { BottomNav } from '@/components/BottomNav';
import { SellModal } from '@/components/SellModal';
import { SavedModal } from '@/components/SavedModal';
import { ProfileModal } from '@/components/ProfileModal';
import { useAuth } from '@/contexts/AuthContext';
import { fetchActiveProducts, fetchUserFavoriteIds, toggleFavoriteInDb } from '@/lib/supabase/products';

const SEARCH_HISTORY_KEY = 'nepal_market_search_history';

// Cross-tab and in-tab store listeners for localStorage
const subscribeSearchHistory = (callback: () => void) => {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', callback);
  window.addEventListener('nepal_market_history_change', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('nepal_market_history_change', callback);
  };
};

const getSearchHistorySnapshot = () => {
  if (typeof window === 'undefined') return '[]';
  try {
    return localStorage.getItem(SEARCH_HISTORY_KEY) || '[]';
  } catch {
    return '[]';
  }
};

const getServerSnapshot = () => '[]';

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isConfigured } = useAuth();

  // Parse state directly from URL search params (Single Source of Truth)
  const paramQ = searchParams.get('q') || '';
  const selectedCategory = (searchParams.get('category') as CategorySlug) || 'semua';
  const selectedCondition = (searchParams.get('condition') as ConditionFilter) || 'semua';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const sortBy = (searchParams.get('sort') as SortOption) || 'terbaru';

  // Local state for live search input typing
  const [searchQuery, setSearchQuery] = useState<string>(paramQ);
  const [prevParamQ, setPrevParamQ] = useState<string>(paramQ);

  // Search history state subscribed via useSyncExternalStore (SSR-safe, reactive, no setState cascading renders)
  const searchHistoryRaw = useSyncExternalStore(
    subscribeSearchHistory,
    getSearchHistorySnapshot,
    getServerSnapshot
  );

  const searchHistory = useMemo(() => {
    try {
      const parsed = JSON.parse(searchHistoryRaw);
      return Array.isArray(parsed)
        ? parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).slice(0, 5)
        : [];
    } catch {
      return [];
    }
  }, [searchHistoryRaw]);

  // Sync searchQuery when URL paramQ changes externally without an effect
  if (paramQ !== prevParamQ) {
    setPrevParamQ(paramQ);
    setSearchQuery(paramQ);
  }

  // Modals & UI states: tidak memakai produk demo palsu untuk mengisi katalog
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [savedProductIds, setSavedProductIds] = useState<string[]>([]);
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Pagination states
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const getFilters = () => ({
    pageSize: 24,
    category: selectedCategory,
    condition: selectedCondition,
    sortBy,
    searchQuery: paramQ,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
  });

  useEffect(() => {
    let active = true;
    if (isConfigured) {
      fetchActiveProducts({
        page: 1, pageSize: 24, category: selectedCategory, condition: selectedCondition,
        sortBy, searchQuery: paramQ,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
      }).then(({ products: dbProds, hasMore: more, totalCount: count, error }) => {
        if (!active || error) return;
        setProductsList(dbProds);
        setHasMore(more);
        setTotalCount(count);
        setPage(1);
      });
    }
    return () => { active = false; };
  }, [isConfigured, selectedCategory, selectedCondition, sortBy, paramQ, minPrice, maxPrice]);

  const handleLoadMore = async () => {
    if (!isConfigured || isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    const nextPage = page + 1;
    const { products: moreProds, hasMore: moreAvailable, error } = await fetchActiveProducts({
      ...getFilters(), page: nextPage,
    });
    if (!error && moreProds.length > 0) {
      setProductsList((prev) => [...prev, ...moreProds]);
      setPage(nextPage);
      setHasMore(moreAvailable);
    }
    setIsLoadingMore(false);
  };

  useEffect(() => {
    if (user && isConfigured) {
      fetchUserFavoriteIds(user.id).then((ids) => {
        setSavedProductIds(ids);
      });
    }
  }, [user, isConfigured]);

  const handleToggleSave = async (productId: string) => {
    const isCurrentlySaved = savedProductIds.includes(productId);
    setSavedProductIds((prev) =>
      isCurrentlySaved ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
    if (user && isConfigured) {
      await toggleFavoriteInDb(user.id, productId, isCurrentlySaved);
    }
  };

  // Function to push new state to URL
  const updateUrlParams = useCallback((newParams: {
    q?: string;
    category?: CategorySlug;
    condition?: ConditionFilter;
    minPrice?: string;
    maxPrice?: string;
    sort?: SortOption;
  }) => {
    const params = new URLSearchParams();

    const q = newParams.q !== undefined ? newParams.q : searchQuery;
    const cat = newParams.category !== undefined ? newParams.category : selectedCategory;
    const cond = newParams.condition !== undefined ? newParams.condition : selectedCondition;
    const minP = newParams.minPrice !== undefined ? newParams.minPrice : minPrice;
    const maxP = newParams.maxPrice !== undefined ? newParams.maxPrice : maxPrice;
    const sBy = newParams.sort !== undefined ? newParams.sort : sortBy;

    if (q.trim()) params.set('q', q.trim());
    if (cat && cat !== 'semua') params.set('category', cat);
    if (cond && cond !== 'semua') params.set('condition', cond);
    if (minP && !isNaN(Number(minP)) && Number(minP) > 0) params.set('minPrice', minP);
    if (maxP && !isNaN(Number(maxP)) && Number(maxP) > 0) params.set('maxPrice', maxP);
    if (sBy && sBy !== 'terbaru') params.set('sort', sBy);

    const queryString = params.toString();
    const targetUrl = queryString ? `/search?${queryString}` : '/search';
    router.replace(targetUrl, { scroll: false });
  }, [router, searchQuery, selectedCategory, selectedCondition, minPrice, maxPrice, sortBy]);

  // Save a search query to search history (max 5 items, case-insensitive deduplication)
  const saveToHistory = useCallback((query: string) => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) return;
    try {
      const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      const currentList: string[] = Array.isArray(parsed) ? parsed : [];
      const filtered = currentList.filter(
        (item) => typeof item === 'string' && item.toLowerCase() !== trimmed.toLowerCase()
      );
      const updated = [trimmed, ...filtered].slice(0, 5);
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('nepal_market_history_change'));
    } catch (err) {
      console.warn('Gagal menyimpan riwayat pencarian ke localStorage:', err);
    }
  }, []);

  // Remove a single item from search history
  const handleRemoveHistoryItem = useCallback((itemToRemove: string) => {
    try {
      const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      const currentList: string[] = Array.isArray(parsed) ? parsed : [];
      const updated = currentList.filter((item) => item !== itemToRemove).slice(0, 5);
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('nepal_market_history_change'));
    } catch (err) {
      console.warn('Gagal memperbarui riwayat pencarian:', err);
    }
  }, []);

  // Clear all search history
  const handleClearHistory = useCallback(() => {
    try {
      localStorage.removeItem(SEARCH_HISTORY_KEY);
      window.dispatchEvent(new Event('nepal_market_history_change'));
    } catch (err) {
      console.warn('Gagal menghapus riwayat pencarian:', err);
    }
  }, []);

  // Quick re-access: click history chip to search
  const handleSelectHistory = useCallback((queryText: string) => {
    setSearchQuery(queryText);
    updateUrlParams({ q: queryText });
    saveToHistory(queryText);
  }, [updateUrlParams, saveToHistory]);

  // Save when URL query param changes or arrives from external page
  useEffect(() => {
    if (paramQ && paramQ.trim().length >= 2) {
      saveToHistory(paramQ);
    }
  }, [paramQ, saveToHistory]);

  // Debounce search query changes to URL and save to history
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== paramQ) {
        updateUrlParams({ q: searchQuery });
        if (searchQuery.trim().length >= 2) {
          saveToHistory(searchQuery);
        }
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, paramQ, updateUrlParams, saveToHistory]);

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== 'semua') count++;
    if (selectedCondition !== 'semua') count++;
    if (minPrice && Number(minPrice) > 0) count++;
    if (maxPrice && Number(maxPrice) > 0) count++;
    if (sortBy !== 'terbaru') count++;
    return count;
  }, [selectedCategory, selectedCondition, minPrice, maxPrice, sortBy]);

  // Filter & Sort Products
  const searchResults = useMemo(() => {
    if (isConfigured) return productsList;
    return productsList.filter((product) => {
      // 1. Text Search (title, description, category, seller)
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase().trim();
        const inTitle = product.title.toLowerCase().includes(query);
        const inDesc = product.description.toLowerCase().includes(query);
        const inCat = product.category.toLowerCase().includes(query);
        const inSeller = product.seller.name.toLowerCase().includes(query);
        const inLocation = product.location.toLowerCase().includes(query);

        if (!inTitle && !inDesc && !inCat && !inSeller && !inLocation) {
          return false;
        }
      }

      // 2. Category Filter
      if (selectedCategory !== 'semua' && product.category !== selectedCategory) {
        return false;
      }

      // 3. Condition Filter
      if (selectedCondition !== 'semua') {
        if (selectedCondition === 'baru' && product.condition !== 'Baru') {
          return false;
        }
        if (selectedCondition === 'seperti-baru' && product.condition !== 'Bekas - Seperti Baru') {
          return false;
        }
        if (selectedCondition === 'bekas') {
          // 'Bekas' covers all used states (Bekas - Seperti Baru, Bekas - Mulus, Bekas - Layak)
          if (!product.condition.startsWith('Bekas')) {
            return false;
          }
        }
      }

      // 4. Price Range Filter
      const minNum = minPrice ? Number(minPrice) : 0;
      const maxNum = maxPrice ? Number(maxPrice) : Infinity;

      if (!isNaN(minNum) && minNum > 0 && product.price < minNum) {
        return false;
      }
      if (!isNaN(maxNum) && maxNum > 0 && product.price > maxNum) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'harga-rendah') {
        return a.price - b.price;
      }
      if (sortBy === 'harga-tinggi') {
        return b.price - a.price;
      }
      // 'terbaru' (default order by original ID/entry)
      return 0;
    });
  }, [productsList, searchQuery, selectedCategory, selectedCondition, minPrice, maxPrice, sortBy, isConfigured]);

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    router.replace('/search', { scroll: false });
  };

  // Handle filter sheet apply
  const handleApplyFilterSheet = (newFilters: {
    q: string;
    category: CategorySlug;
    condition: ConditionFilter;
    minPrice: string;
    maxPrice: string;
    sortBy: SortOption;
  }) => {
    setSearchQuery(newFilters.q);
    updateUrlParams({
      q: newFilters.q,
      category: newFilters.category,
      condition: newFilters.condition,
      minPrice: newFilters.minPrice,
      maxPrice: newFilters.maxPrice,
      sort: newFilters.sortBy,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-28 md:pb-12">
      {/* Top Sticky Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-2.5 h-14 sm:h-16">
            {/* Back to Home Button */}
            <Link
              id="btn-back-to-home"
              href="/"
              className="w-9 h-9 min-w-[38px] min-h-[38px] -ml-1.5 rounded-md flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Kembali ke Beranda"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>

            {/* Search Input Box */}
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                id="search-page-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (searchQuery.trim()) {
                      saveToHistory(searchQuery);
                      updateUrlParams({ q: searchQuery });
                    }
                  }
                }}
                placeholder="Cari nama barang..."
                autoFocus={!paramQ}
                className="w-full pl-9 pr-9 py-2 bg-slate-100 focus:bg-white text-sm text-slate-900 placeholder:text-slate-400 rounded-md border border-slate-200 focus:border-blue-600 focus:outline-hidden min-h-[40px] transition-colors"
              />
              {searchQuery && (
                <button
                  id="btn-clear-search-page"
                  type="button"
                  aria-label="Hapus kata kunci"
                  onClick={() => {
                    setSearchQuery('');
                    updateUrlParams({ q: '' });
                  }}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 min-w-[36px] min-h-[36px] justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Mobile Filter Trigger Button */}
            <button
              id="btn-open-mobile-filter"
              type="button"
              aria-label="Buka Filter"
              onClick={() => setIsFilterSheetOpen(true)}
              className={`md:hidden flex items-center gap-1.5 px-3 py-2 rounded-md border text-xs font-semibold min-h-[40px] transition-colors shrink-0 cursor-pointer ${
                activeFilterCount > 0
                  ? 'bg-blue-50 border-blue-600 text-blue-700'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filter</span>
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center ml-0.5">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Search History Row (Clean plain text, not decorative badges) */}
          {searchHistory.length > 0 && (
            <div
              id="search-history-container"
              className="pb-2 pt-0.5 flex items-center justify-between gap-2 overflow-x-auto text-xs"
            >
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 min-w-0">
                <span className="text-[11px] text-slate-400 shrink-0 select-none">
                  Terakhir dicari:
                </span>
                {searchHistory.map((queryText, index) => (
                  <div
                    key={`${queryText}-${index}`}
                    className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 transition-colors shrink-0 text-xs"
                  >
                    <button
                      type="button"
                      id={`btn-search-history-${index}`}
                      onClick={() => handleSelectHistory(queryText)}
                      className="hover:underline cursor-pointer truncate max-w-[140px]"
                      title={`Cari ulang "${queryText}"`}
                    >
                      {queryText}
                    </button>
                    <button
                      type="button"
                      id={`btn-remove-history-${index}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveHistoryItem(queryText);
                      }}
                      aria-label={`Hapus ${queryText} dari riwayat`}
                      className="text-slate-300 hover:text-rose-600 transition-colors cursor-pointer p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    {index < searchHistory.length - 1 && (
                      <span className="text-slate-300 select-none mx-0.5">•</span>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                id="btn-clear-all-history"
                onClick={handleClearHistory}
                className="text-[11px] text-slate-400 hover:text-rose-600 transition-colors shrink-0 whitespace-nowrap cursor-pointer"
                title="Hapus semua riwayat pencarian"
              >
                Hapus
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Container: Desktop Side Filter + Search Results */}
      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-4 sm:pt-6">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          
          {/* Desktop Filter Panel (Left Sidebar) */}
          <aside 
            id="desktop-filter-panel"
            className="hidden md:block w-60 lg:w-64 shrink-0 bg-white border border-slate-200 rounded-lg p-4 sticky top-20 space-y-5 text-slate-800"
          >
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">Filter</h2>
              {activeFilterCount > 0 && (
                <button
                  id="btn-desktop-reset-filter"
                  type="button"
                  onClick={handleResetFilters}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            {/* Urutkan */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                Urutkan
              </label>
              <div className="relative">
                <select
                  id="desktop-sort-select"
                  value={sortBy}
                  onChange={(e) => {
                    const newSort = e.target.value as SortOption;
                    updateUrlParams({ sort: newSort });
                  }}
                  className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-800 text-xs font-medium py-2 pl-2.5 pr-7 rounded-md focus:outline-hidden focus:border-blue-600 cursor-pointer"
                >
                  <option value="terbaru">Terbaru</option>
                  <option value="harga-rendah">Harga Terendah</option>
                  <option value="harga-tinggi">Harga Tertinggi</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* Kondisi */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                Kondisi
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'semua', label: 'Semua' },
                  { id: 'baru', label: 'Baru' },
                  { id: 'seperti-baru', label: 'Spt. Baru' },
                  { id: 'bekas', label: 'Bekas' },
                ].map((cond) => {
                  const isSelected = selectedCondition === cond.id;
                  return (
                    <button
                      key={cond.id}
                      id={`desktop-cond-${cond.id}`}
                      type="button"
                      onClick={() => {
                        const newCond = cond.id as ConditionFilter;
                        updateUrlParams({ condition: newCond });
                      }}
                      className={`px-2 py-1.5 rounded-md text-xs font-medium border text-center transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50 border-blue-600 text-blue-700 font-semibold'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {cond.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Kategori */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                Kategori
              </label>
              <div className="space-y-0.5 max-h-48 overflow-y-auto pr-1">
                {CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat.slug;
                  return (
                    <button
                      key={cat.slug}
                      id={`desktop-cat-${cat.slug}`}
                      type="button"
                      onClick={() => {
                        updateUrlParams({ category: cat.slug });
                      }}
                      className={`w-full text-left px-2 py-1 rounded-md text-xs font-medium transition-colors flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50 text-blue-700 font-semibold'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <span>{cat.label}</span>
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Harga */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                Harga
              </label>
              <div className="space-y-1.5">
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-xs text-slate-400 pointer-events-none font-medium">
                    Rp
                  </span>
                  <input
                    id="desktop-min-price-input"
                    type="number"
                    defaultValue={minPrice}
                    key={`min-${minPrice}`}
                    onBlur={(e) => {
                      updateUrlParams({ minPrice: e.target.value });
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        updateUrlParams({ minPrice: (e.target as HTMLInputElement).value });
                      }
                    }}
                    placeholder="Minimum"
                    className="w-full pl-8 pr-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-hidden"
                  />
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-xs text-slate-400 pointer-events-none font-medium">
                    Rp
                  </span>
                  <input
                    id="desktop-max-price-input"
                    type="number"
                    defaultValue={maxPrice}
                    key={`max-${maxPrice}`}
                    onBlur={(e) => {
                      updateUrlParams({ maxPrice: e.target.value });
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        updateUrlParams({ maxPrice: (e.target as HTMLInputElement).value });
                      }
                    }}
                    placeholder="Maksimum"
                    className="w-full pl-8 pr-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

          </aside>

          {/* Results Column */}
          <div className="flex-1 w-full min-w-0">
            
            {/* Results Header: Count & Quick Reset/Sort Info */}
            <div className="flex items-center justify-between pb-3.5 mb-1 border-b border-slate-200/80">
              <div className="flex items-baseline gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900">
                  {searchQuery ? `Hasil untuk "${searchQuery}"` : 'Semua Barang'}
                </h1>
                <span id="search-result-count" className="text-xs sm:text-sm text-slate-500 font-medium">
                  ({isConfigured ? totalCount : searchResults.length} barang)
                </span>
              </div>

              {/* Reset filter button if any active filter */}
              {activeFilterCount > 0 && (
                <button
                  id="btn-quick-reset-all"
                  type="button"
                  onClick={handleResetFilters}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 min-h-[36px]"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Filter ({activeFilterCount})</span>
                </button>
              )}
            </div>

            {/* Active Filters Chips Bar (Mobile & Desktop) */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 py-2">
                {selectedCategory !== 'semua' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 rounded text-xs font-medium">
                    <span>Kategori: {CATEGORIES.find((c) => c.slug === selectedCategory)?.label}</span>
                    <button
                      type="button"
                      onClick={() => {
                        updateUrlParams({ category: 'semua' });
                      }}
                      className="text-slate-400 hover:text-slate-800 p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {selectedCondition !== 'semua' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 rounded text-xs font-medium">
                    <span>Kondisi: {selectedCondition}</span>
                    <button
                      type="button"
                      onClick={() => {
                        updateUrlParams({ condition: 'semua' });
                      }}
                      className="text-slate-400 hover:text-slate-800 p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {(minPrice || maxPrice) && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 rounded text-xs font-medium">
                    <span>
                      Harga: {minPrice ? `Rp${Number(minPrice).toLocaleString('id-ID')}` : '0'} - {maxPrice ? `Rp${Number(maxPrice).toLocaleString('id-ID')}` : 'Bebas'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        updateUrlParams({ minPrice: '', maxPrice: '' });
                      }}
                      className="text-slate-400 hover:text-slate-800 p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {sortBy !== 'terbaru' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 rounded text-xs font-medium">
                    <span>Urutkan: {sortBy === 'harga-rendah' ? 'Harga Terendah' : 'Harga Tertinggi'}</span>
                    <button
                      type="button"
                      onClick={() => {
                        updateUrlParams({ sort: 'terbaru' });
                      }}
                      className="text-slate-400 hover:text-slate-800 p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
            )}

            {/* Results Grid or Empty State */}
            {searchResults.length > 0 ? (
              <div className="space-y-6 mt-3">
                <div 
                  id="search-results-grid"
                  className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4"
                >
                  {searchResults.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      isSaved={savedProductIds.includes(product.id)}
                      onToggleSave={handleToggleSave}
                    />
                  ))}
                </div>

                {hasMore && isConfigured && (
                  <div className="flex justify-center pt-2">
                    <button
                      id="btn-search-load-more"
                      type="button"
                      onClick={handleLoadMore}
                      disabled={isLoadingMore}
                      className="px-6 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 font-semibold text-sm rounded-xl shadow-xs transition-colors flex items-center gap-2 min-h-[44px] disabled:opacity-60"
                    >
                      {isLoadingMore ? (
                        <>
                          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                          <span>Memuat barang...</span>
                        </>
                      ) : (
                        <span>Muat Lebih Banyak Barang</span>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Specified Empty State: "Barangnya belum ketemu." & "Lihat barang lainnya" */
              <div 
                id="search-empty-state"
                className="bg-white border border-slate-200/90 rounded-2xl p-8 sm:p-12 text-center max-w-md mx-auto my-8 shadow-xs"
              >
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
                  <Search className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1.5">
                  Barangnya belum ketemu.
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-6">
                  Coba gunakan kata kunci yang lebih umum, periksa ejaan, atau kurangi filter yang terpasang.
                </p>
                <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
                  <button
                    id="btn-empty-reset"
                    type="button"
                    onClick={handleResetFilters}
                    className="px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-xs min-h-[44px]"
                  >
                    Lihat barang lainnya
                  </button>
                  <Link
                    href="/"
                    className="px-5 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors min-h-[44px] flex items-center justify-center"
                  >
                    Kembali ke Beranda
                  </Link>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>

      {/* Mobile Filter Bottom Sheet */}
      <SearchFilterSheet
        isOpen={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        filters={{
          q: searchQuery,
          category: selectedCategory,
          condition: selectedCondition,
          minPrice,
          maxPrice,
          sortBy,
        }}
        onApply={handleApplyFilterSheet}
        onReset={handleResetFilters}
        totalResultsCount={isConfigured ? totalCount : searchResults.length}
      />

      {/* Bottom Nav for Mobile */}
      <BottomNav
        activeTab="cari"
        savedCount={savedProductIds.length}
        onSelectTab={(tab) => {
          if (tab === 'home') router.push('/');
          if (tab === 'cari') {
            const input = document.getElementById('search-page-input');
            input?.focus();
          }
          if (tab === 'jual') setIsSellModalOpen(true);
          if (tab === 'disimpan') setIsSavedModalOpen(true);
          if (tab === 'profil') setIsProfileModalOpen(true);
        }}
      />

      {/* Modals */}
      <SellModal
        isOpen={isSellModalOpen}
        onClose={() => setIsSellModalOpen(false)}
        onAddProduct={() => {
          setIsSellModalOpen(false);
          router.push('/');
        }}
      />

      <SavedModal
        isOpen={isSavedModalOpen}
        onClose={() => setIsSavedModalOpen(false)}
        savedProducts={INITIAL_PRODUCTS.filter((p) => savedProductIds.includes(p.id))}
        onRemoveSaved={handleToggleSave}
        onSelectProduct={(p) => router.push(`/product/${p.id}`)}
      />

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        savedCount={savedProductIds.length}
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
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span>Memuat pencarian...</span>
        </div>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}
