'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  PlusCircle, 
  Loader2, 
  Package, 
  Edit3, 
  CheckCircle2, 
  RotateCcw, 
  Trash2, 
  ExternalLink,
  AlertTriangle,
  X,
  Check
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Product } from '@/types/market';
import { formatRupiah } from '@/data/products';
import { fetchSellerProducts, updateProductStatusInDb, deleteProductFromDb } from '@/lib/supabase/products';

type TabKey = 'active' | 'sold' | 'draft';

export default function MyProductsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isConfigured } = useAuth();

  const [activeTab, setActiveTab] = useState<TabKey>('active');
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Modal konfirmasi hapus
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Protected route check
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirectTo=/my-products');
    }
  }, [user, authLoading, router]);

  const loadProducts = useCallback(async () => {
    if (!user || !isConfigured) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const result = await fetchSellerProducts(user.id);
    if (!result.error && result.products) {
      setProducts(result.products);
    }
    setIsLoading(false);
  }, [user, isConfigured]);

  useEffect(() => {
    let isMounted = true;
    if (user && isConfigured) {
      fetchSellerProducts(user.id).then((result) => {
        if (!isMounted) return;
        if (!result.error && result.products) {
          setProducts(result.products);
        }
        setIsLoading(false);
      });
    }
    return () => {
      isMounted = false;
    };
  }, [user, isConfigured]);

  // Kelompokkan produk berdasarkan status
  const activeProducts = products.filter((p) => p.status === 'active' || (!p.status && p.isAvailable));
  const soldProducts = products.filter((p) => p.status === 'sold' || (!p.status && p.isSold));
  const draftProducts = products.filter((p) => p.status === 'draft');

  const currentTabProducts = 
    activeTab === 'active' ? activeProducts :
    activeTab === 'sold' ? soldProducts :
    draftProducts;

  // Handler tandai terjual / aktifkan kembali
  const handleToggleStatus = async (product: Product, nextStatus: 'active' | 'sold') => {
    setUpdatingId(product.id);
    setActionMessage(null);

    const result = await updateProductStatusInDb(product.id, nextStatus);
    if (result.success) {
      setProducts((prev) =>
        prev.map((item) => (item.id === product.id ? { ...item, status: nextStatus, isAvailable: nextStatus === 'active', isSold: nextStatus === 'sold' } : item))
      );
      const msg = nextStatus === 'sold' ? 'Barang ditandai terjual.' : 'Barang kembali diaktifkan.';
      setActionMessage(msg);
      setTimeout(() => setActionMessage(null), 3500);
    } else {
      setActionMessage('Gagal mengubah status barang.');
      setTimeout(() => setActionMessage(null), 3500);
    }
    setUpdatingId(null);
  };

  // Handler konfirmasi hapus
  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);

    const result = await deleteProductFromDb(productToDelete.id);
    if (result.success) {
      setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id));
      setActionMessage('Barang berhasil dihapus.');
      setTimeout(() => setActionMessage(null), 3500);
      setProductToDelete(null);
    } else {
      setActionMessage(result.error?.message || 'Gagal menghapus barang.');
      setTimeout(() => setActionMessage(null), 3500);
    }
    setIsDeleting(false);
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f7f5]">
        <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7f5] pb-20">
      {/* Top Bar Navigation */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 h-14 sm:h-16 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors -ml-1 min-h-[44px] px-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Beranda</span>
          </Link>
          <span className="text-sm sm:text-base font-bold text-slate-900 truncate">Produk Saya</span>
          <Link
            href="/sell"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-medium transition-colors min-h-[44px]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Jual</span>
          </Link>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 pt-4 sm:pt-6">
        {/* Flash Message Banner */}
        {actionMessage && (
          <div
            role="status"
            className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-md flex items-center justify-between text-xs sm:text-sm font-medium text-emerald-800 animate-in fade-in slide-in-from-top-2"
          >
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{actionMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setActionMessage(null)}
              className="text-emerald-700 hover:text-emerald-900 p-1 min-h-[44px] min-w-[44px] inline-flex items-center justify-center cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg p-1 border border-slate-200 flex items-center gap-1 mb-5">
          <button
            type="button"
            onClick={() => setActiveTab('active')}
            className={`flex-1 min-h-[44px] py-2 px-3 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'active'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>Aktif</span>
            <span
              className={`text-[10px] sm:text-xs px-1.5 py-0.2 rounded-full ${
                activeTab === 'active' ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-700'
              }`}
            >
              {activeProducts.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sold')}
            className={`flex-1 min-h-[44px] py-2 px-3 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'sold'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>Terjual</span>
            <span
              className={`text-[10px] sm:text-xs px-1.5 py-0.2 rounded-full ${
                activeTab === 'sold' ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-700'
              }`}
            >
              {soldProducts.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('draft')}
            className={`flex-1 min-h-[44px] py-2 px-3 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'draft'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>Draft</span>
            <span
              className={`text-[10px] sm:text-xs px-1.5 py-0.2 rounded-full ${
                activeTab === 'draft' ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-700'
              }`}
            >
              {draftProducts.length}
            </span>
          </button>
        </div>

        {/* List Content */}
        {isLoading ? (
          <div className="py-16 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
            <p className="text-xs text-slate-500">Memuat daftar barangmu...</p>
          </div>
        ) : currentTabProducts.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-lg border border-slate-200 p-8 sm:p-12 text-center">
            <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Package className="w-7 h-7" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              {products.length === 0
                ? 'Kamu belum menjual barang.'
                : activeTab === 'active'
                ? 'Tidak ada barang aktif saat ini.'
                : activeTab === 'sold'
                ? 'Belum ada barang yang terjual.'
                : 'Belum ada draf barang tersimpan.'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-5">
              {products.length === 0
                ? 'Mulai tawarkan barangmu ke sesama warga komunitas Nepal Market sekarang.'
                : 'Pasang barang baru atau aktifkan kembali barang yang sudah laku.'}
            </p>
            <Link
              href="/sell"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-medium transition-colors min-h-[44px]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Jual Barang Sekarang</span>
            </Link>
          </div>
        ) : (
          /* Product Cards Grid / List */
          <div className="space-y-3 sm:space-y-4">
            {currentTabProducts.map((product) => {
              const isItemUpdating = updatingId === product.id;

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-lg border border-slate-200 overflow-hidden p-3.5 sm:p-4 flex flex-col sm:flex-row gap-3.5 sm:gap-4 transition-colors hover:border-slate-300"
                >
                  {/* Foto Thumbnail (Aspect 1:1 Konsisten) */}
                  <Link
                    href={`/product/${product.id}`}
                    className="relative w-full sm:w-32 aspect-square rounded-md overflow-hidden bg-slate-100 shrink-0 block group"
                  >
                    <Image
                      src={product.imageUrl}
                      alt={product.title}
                      fill
                      sizes="(max-width: 640px) 100vw, 150px"
                      className="object-cover group-hover:scale-105 transition-transform duration-200"
                      referrerPolicy="no-referrer"
                    />
                    {product.status === 'sold' && (
                      <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center">
                        <span className="bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Terjual
                        </span>
                      </div>
                    )}
                    {product.status === 'draft' && (
                      <div className="absolute top-2 left-2 bg-amber-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Draft
                      </div>
                    )}
                  </Link>

                  {/* Rincian Produk */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/product/${product.id}`}
                          className="text-sm sm:text-base font-bold text-slate-900 hover:text-blue-600 transition-colors line-clamp-2 leading-snug"
                        >
                          {product.title}
                        </Link>
                        <span className="text-xs sm:text-sm font-bold text-blue-600 shrink-0">
                          {formatRupiah(product.price)}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1 text-[11px] text-slate-500">
                        <span className="px-2 py-0.5 bg-slate-100 rounded-md font-medium text-slate-700 capitalize">
                          {product.category}
                        </span>
                        <span>•</span>
                        <span>{product.condition}</span>
                        <span>•</span>
                        <span>{product.location}</span>
                      </div>

                      <p className="text-xs text-slate-500 line-clamp-2 mt-1.5">
                        {product.description}
                      </p>
                    </div>

                    {/* Baris Tombol Aksi (Mobile-First, Touch Targets >= 44px) */}
                    <div className="flex flex-wrap items-center gap-2 pt-3 sm:pt-2 border-t sm:border-t-0 border-slate-100 mt-2">
                      {/* Tombol Edit */}
                      <Link
                        href={`/my-products/${product.id}/edit`}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors min-h-[44px]"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                        <span>Edit</span>
                      </Link>

                      {/* Tombol Status */}
                      {product.status === 'active' ? (
                        <button
                          type="button"
                          disabled={isItemUpdating}
                          onClick={() => handleToggleStatus(product, 'sold')}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100 text-emerald-800 text-xs font-medium transition-colors min-h-[44px] disabled:opacity-50 cursor-pointer"
                        >
                          {isItemUpdating ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          )}
                          <span>Tandai Terjual</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={isItemUpdating}
                          onClick={() => handleToggleStatus(product, 'active')}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-blue-200 bg-blue-50/60 hover:bg-blue-100 text-blue-700 text-xs font-medium transition-colors min-h-[44px] disabled:opacity-50 cursor-pointer"
                        >
                          {isItemUpdating ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
                          )}
                          <span>Aktifkan Kembali</span>
                        </button>
                      )}

                      {/* Tombol Lihat Iklan */}
                      <Link
                        href={`/product/${product.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-2 rounded-md text-slate-500 hover:text-slate-800 text-xs font-medium transition-colors min-h-[44px]"
                        title="Buka halaman barang"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Lihat</span>
                      </Link>

                      {/* Tombol Hapus */}
                      <button
                        type="button"
                        onClick={() => setProductToDelete(product)}
                        className="ml-auto inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors min-h-[44px] min-w-[44px] cursor-pointer"
                        title="Hapus iklan"
                        aria-label={`Hapus ${product.title}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modal Konfirmasi Hapus Produk */}
      {productToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 overflow-y-auto"
          onClick={() => !isDeleting && setProductToDelete(null)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-lg p-5 sm:p-6 border border-slate-200 text-left space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Hapus Iklan Barang?
              </h3>
              <p className="text-xs sm:text-sm text-slate-500">
                Barang &quot;{productToDelete.title}&quot; beserta semua fotonya akan dihapus secara permanen.
              </p>
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setProductToDelete(null)}
                className="flex-1 min-h-[44px] py-2.5 px-3 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-xs sm:text-sm transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="flex-1 min-h-[44px] py-2.5 px-3 rounded-md bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs sm:text-sm transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <span>Ya, Hapus</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
