'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bookmark, ShoppingBag, Loader2, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchUserSavedProducts, toggleFavoriteInDb } from '@/lib/supabase/products';
import { Product } from '@/types/market';
import { ProductCard } from '@/components/ProductCard';

export default function SavedProductsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isConfigured } = useAuth();

  const [savedProducts, setSavedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Protected route: Redirect jika belum login
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirectTo=/saved');
    }
  }, [user, authLoading, router]);

  // Load saved products dari Supabase (untuk refresh manual)
  const loadSavedProducts = useCallback(async (showRefreshing = false) => {
    if (!user) return;
    if (showRefreshing) setIsRefreshing(true);

    try {
      if (isConfigured) {
        const { products } = await fetchUserSavedProducts(user.id);
        setSavedProducts(products);
      } else {
        setSavedProducts([]);
      }
    } catch (err) {
      console.error('Gagal memuat barang tersimpan:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user, isConfigured]);

  useEffect(() => {
    let isMounted = true;
    if (user && isConfigured) {
      fetchUserSavedProducts(user.id)
        .then(({ products }) => {
          if (!isMounted) return;
          setSavedProducts(products);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error('Gagal memuat barang tersimpan:', err);
          if (isMounted) setIsLoading(false);
        });
    } else {
      Promise.resolve().then(() => {
        if (isMounted) setIsLoading(false);
      });
    }

    return () => {
      isMounted = false;
    };
  }, [user, isConfigured]);

  // Handle batalkan simpan (unfavorite)
  const handleToggleSave = async (productId: string) => {
    if (!user) return;

    // Optimistically remove from saved items
    setSavedProducts((prev) => prev.filter((item) => item.id !== productId));

    if (isConfigured) {
      await toggleFavoriteInDb(user.id, productId, true);
    }
  };

  if (authLoading || (!user && isLoading)) {
    return (
      <div className="min-h-screen bg-[#f7f7f5] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7f5] text-neutral-900 pb-28 md:pb-16">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-15 sm:h-16 flex items-center justify-between">
          <Link
            id="btn-saved-back"
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors -ml-1 min-h-[44px] min-w-[44px] px-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Beranda</span>
          </Link>

          <div className="text-center">
            <h1 className="text-sm sm:text-base font-bold text-slate-900">Barang Disimpan</h1>
            {!isLoading && (
              <p className="text-[11px] text-slate-500">
                {savedProducts.length} barang
              </p>
            )}
          </div>

          <button
            id="btn-refresh-saved"
            type="button"
            aria-label="Segarkan daftar barang disimpan"
            onClick={() => loadSavedProducts(true)}
            disabled={isRefreshing || isLoading}
            className="inline-flex items-center justify-center w-11 h-11 min-h-[44px] min-w-[44px] rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors"
            title="Segarkan daftar"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-6">
        {isLoading ? (
          <div className="py-20 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500">Memuat koleksi simpanan kamu...</p>
          </div>
        ) : savedProducts.length === 0 ? (
          /* Empty State */
          <div
            id="saved-empty-state"
            className="mt-8 bg-white border border-slate-200 rounded-xl p-8 sm:p-12 text-center max-w-lg mx-auto shadow-xs"
          >
            <div className="w-14 h-14 mx-auto rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <Bookmark className="w-7 h-7" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Belum Ada Barang yang Disimpan
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
              Tekan ikon bookmark pada barang yang kamu minati saat menjelajah untuk menyimpannya ke daftar ini.
            </p>
            <div className="mt-6">
              <Link
                id="btn-explore-from-saved"
                href="/"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-semibold transition-colors shadow-xs"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Eksplor Barang di Nepal Market</span>
              </Link>
            </div>
          </div>
        ) : (
          /* Grid Produk yang Disimpan */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs sm:text-sm text-slate-500">
                Klik ikon bookmark untuk menghapus barang dari daftar simpan.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {savedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isSaved={true}
                  onToggleSave={handleToggleSave}
                />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
