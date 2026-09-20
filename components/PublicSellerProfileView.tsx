'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Calendar, 
  Store, 
  CheckCircle2, 
  User, 
  MessageCircle, 
  Instagram, 
  Edit3, 
  Share2, 
  Check, 
  Loader2, 
  PackageOpen,
  ShoppingBag
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchProfileByUsername, PublicSellerProfile } from '@/lib/supabase/profile';
import { fetchSellerActiveProducts, fetchUserFavoriteIds, toggleFavoriteInDb } from '@/lib/supabase/products';
import { Product } from '@/types/market';
import { ProductCard } from '@/components/ProductCard';

interface PublicSellerProfileViewProps {
  username: string;
}

export const PublicSellerProfileView: React.FC<PublicSellerProfileViewProps> = ({ username }) => {
  const router = useRouter();
  const { user, isConfigured } = useAuth();

  const [profile, setProfile] = useState<PublicSellerProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [savedProductIds, setSavedProductIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isCopiedLink, setIsCopiedLink] = useState(false);

  // Load seller profile and products
  useEffect(() => {
    let isMounted = true;

    fetchProfileByUsername(username)
      .then(async ({ profile: sellerProfile, error: profileErr }) => {
        if (!isMounted) return;
        if (profileErr || !sellerProfile) {
          setNotFound(true);
          setIsLoading(false);
          return;
        }

        setProfile(sellerProfile);

        const { products: activeProds } = await fetchSellerActiveProducts(sellerProfile.id);
        if (!isMounted) return;
        setProducts(activeProds);
        setIsLoading(false);
      })
      .catch(() => {
        if (isMounted) {
          setNotFound(true);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [username]);

  // Load favorites for logged-in user
  useEffect(() => {
    if (user && isConfigured) {
      fetchUserFavoriteIds(user.id).then((ids) => {
        setSavedProductIds(ids);
      });
    }
  }, [user, isConfigured]);

  // Handle toggle save
  const handleToggleSave = async (productId: string) => {
    if (!user) {
      const currentUrl = typeof window !== 'undefined' ? window.location.pathname : `/profile/${username}`;
      router.push(`/login?redirectTo=${encodeURIComponent(currentUrl)}`);
      return;
    }

    const isCurrentlySaved = savedProductIds.includes(productId);
    setSavedProductIds((prev) =>
      isCurrentlySaved ? prev.filter((id) => id !== productId) : [...prev, productId]
    );

    if (isConfigured) {
      await toggleFavoriteInDb(user.id, productId, isCurrentlySaved);
    }
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setIsCopiedLink(true);
      setTimeout(() => setIsCopiedLink(false), 2000);
    }
  };

  const isOwnProfile = user && profile && user.id === profile.id;

  const formattedJoinedDate = React.useMemo(() => {
    if (!profile?.created_at) return '2024';
    try {
      return new Date(profile.created_at).toLocaleDateString('id-ID', {
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return '2024';
    }
  }, [profile]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
        <p className="text-sm font-medium text-slate-500">Memuat profil penjual...</p>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
          <User className="w-8 h-8" />
        </div>
        <h1 className="text-lg font-bold text-slate-900 mb-1">Penjual Tidak Ditemukan</h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-sm mb-6 leading-relaxed">
          Akun dengan username <strong className="text-slate-800">@{username}</strong> tidak ditemukan atau mungkin telah dinonaktifkan.
        </p>
        <Link
          id="btn-seller-not-found-back"
          href="/"
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold transition-colors shadow-xs"
        >
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 sm:pb-16">
      {/* Sticky Header Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 h-14 sm:h-16 flex items-center justify-between">
          <button
            id="btn-seller-profile-back"
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors -ml-1 min-h-[44px] px-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali</span>
          </button>

          <span className="text-xs sm:text-sm font-bold text-slate-900 truncate max-w-[180px] sm:max-w-xs">
            @{profile.username}
          </span>

          <button
            id="btn-share-seller-profile"
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-blue-600 p-2 min-h-[44px]"
            title="Salin tautan profil"
          >
            {isCopiedLink ? (
              <span className="text-emerald-600 flex items-center gap-1">
                <Check className="w-4 h-4" />
                <span className="hidden sm:inline">Disalin</span>
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Bagikan</span>
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-6 space-y-6">
        {/* Banner Pemilik jika melihat profil sendiri */}
        {isOwnProfile && (
          <div className="p-4 bg-blue-50/90 border border-blue-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5 text-blue-900">
              <User className="w-5 h-5 text-blue-600 shrink-0" />
              <div className="text-xs sm:text-sm">
                <p className="font-semibold">Ini adalah tampilan profil publik kamu.</p>
                <p className="text-blue-700 text-xs mt-0.5">
                  Orang lain melihat profil dan daftar barang aktif kamu seperti ini.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/profile"
                className="px-3 py-2 bg-white hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-xl border border-blue-200 transition-colors shadow-2xs"
              >
                Edit Profil
              </Link>
              <Link
                href="/sell"
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-2xs"
              >
                Pasang Iklan
              </Link>
            </div>
          </div>
        )}

        {/* Profile Card Header */}
        <section 
          id="seller-profile-card"
          className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-7 shadow-xs space-y-5"
        >
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-left">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-slate-100 border-2 border-slate-200/80 shadow-xs flex items-center justify-center relative">
                {profile.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt={profile.name}
                    fill
                    sizes="(max-width: 640px) 80px, 96px"
                    className="object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="text-2xl sm:text-3xl font-bold text-blue-600">
                    {profile.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 justify-center sm:justify-start">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {profile.name}
                </h1>
                {profile.role === 'admin' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-semibold w-fit mx-auto sm:mx-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Terverifikasi</span>
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm font-mono text-slate-500 mt-1">
                @{profile.username}
              </p>

              {/* Meta stats: Tanggal bergabung & Jumlah barang aktif */}
              <div className="mt-4 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-600">
                <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Bergabung {formattedJoinedDate}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                  <Store className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    <strong className="text-slate-900">{products.length}</strong> produk aktif
                  </span>
                </div>
              </div>
            </div>

            {/* Action buttons if not own profile: Contact shortcuts */}
            {!isOwnProfile && (
              <div className="flex sm:flex-col items-center gap-2 pt-2 sm:pt-0 w-full sm:w-auto shrink-0">
                {profile.phone && (
                  <a
                    href={`https://wa.me/${profile.phone.replace(/\D/g, '').replace(/^0/, '62')}?text=${encodeURIComponent('Halo, saya melihat profil Anda di Nepal Market.')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2 shadow-2xs min-h-[44px]"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>WhatsApp</span>
                  </a>
                )}
                {profile.instagram && (
                  <a
                    href={`https://instagram.com/${profile.instagram.replace(/^@/, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2 shadow-2xs min-h-[44px]"
                  >
                    <Instagram className="w-4 h-4" />
                    <span>Instagram</span>
                  </a>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Section Produk Aktif Milik Seller */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Barang yang Dijual ({products.length})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Semua barang aktif yang sedang ditawarkan oleh @{profile.username}
              </p>
            </div>
          </div>

          {products.length === 0 ? (
            /* Empty State jika seller tidak memiliki produk aktif */
            <div
              id="seller-empty-products"
              className="bg-white border border-slate-200/90 rounded-2xl p-8 sm:p-12 text-center shadow-xs"
            >
              <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3.5">
                <PackageOpen className="w-7 h-7" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Belum ada barang aktif
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
                Penjual ini belum memiliki barang aktif yang dipasang saat ini, atau semua barangnya sudah terjual.
              </p>
              {isOwnProfile && (
                <div className="mt-5">
                  <Link
                    id="btn-seller-add-first-product"
                    href="/sell"
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold transition-colors shadow-xs"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Pasang Barang Jualan Pertama</span>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            /* Grid Produk Aktif */
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {products.map((item) => (
                <ProductCard
                  key={item.id}
                  product={item}
                  isSaved={savedProductIds.includes(item.id)}
                  onToggleSave={handleToggleSave}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};
