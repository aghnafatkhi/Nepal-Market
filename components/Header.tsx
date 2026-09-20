'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, PlusCircle, Bookmark, User, X, LogIn, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  savedCount: number;
  onOpenSellModal: () => void;
  onOpenSavedModal: () => void;
  onOpenProfileModal: () => void;
  onResetToHome?: () => void;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  savedCount,
  onOpenSellModal,
  onOpenSavedModal,
  onOpenProfileModal,
  onResetToHome,
  searchInputRef,
}) => {
  const router = useRouter();
  const { user, profile } = useAuth();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/search');
    }
  };

  return (
    <header 
      id="main-header"
      className="sticky top-0 z-30 w-full bg-white border-b border-slate-200/90"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-15 sm:h-17 gap-3 sm:gap-6">
          
          {/* Brand Wordmark */}
          <Link
            id="brand-wordmark"
            href="/"
            onClick={onResetToHome}
            className="flex items-center gap-1.5 focus:outline-hidden group text-left shrink-0 py-1"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-lg tracking-wider group-hover:bg-blue-700 transition-colors">
              N
            </div>
            <div className="flex flex-col">
              <span className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 leading-none">
                Nepal<span className="text-blue-600">Market</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wide">
                Pasar Komunitas
              </span>
            </div>
          </Link>

          {/* Desktop & Tablet Search Bar */}
          <form 
            onSubmit={handleSearchSubmit}
            className="hidden sm:flex flex-1 max-w-xl items-center relative"
          >
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                id="search-input-desktop"
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Cari barang di Nepal Market (tekan Enter)"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-100/90 hover:bg-slate-100 focus:bg-white text-sm text-slate-900 placeholder:text-slate-500 rounded-lg border border-transparent focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 transition-all duration-150"
              />
              {searchQuery && (
                <button
                  id="btn-clear-search-desktop"
                  type="button"
                  aria-label="Hapus kata kunci"
                  onClick={() => onSearchChange('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </form>

          {/* Desktop Navigation (pengganti bottom nav untuk layar besar) */}
          <nav 
            id="desktop-nav"
            aria-label="Navigasi Desktop"
            className="hidden md:flex items-center gap-1.5 lg:gap-3 shrink-0"
          >
            <Link
              id="desktop-nav-saved"
              href={user ? "/saved" : "/login?redirectTo=/saved"}
              className="relative flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-colors min-h-[44px]"
            >
              <Bookmark className="w-4 h-4 text-slate-500" />
              <span>Disimpan</span>
              {savedCount > 0 && (
                <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-semibold text-white bg-blue-600 rounded-full">
                  {savedCount}
                </span>
              )}
            </Link>

            <Link
              id="desktop-nav-profile"
              href={user ? "/profile" : "/login?redirectTo=/profile"}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-colors min-h-[44px]"
            >
              {user ? (
                <>
                  <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center uppercase shrink-0">
                    {(profile?.name || user.email || 'U').charAt(0)}
                  </div>
                  <span className="max-w-[100px] truncate">{profile?.name ? profile.name.split(' ')[0] : 'Profil'}</span>
                </>
              ) : (
                <>
                  <User className="w-4 h-4 text-slate-500" />
                  <span>Profil</span>
                </>
              )}
            </Link>

            {/* Akses Admin (Hanya tampil jika role = admin) */}
            {profile?.role === 'admin' && (
              <Link
                id="desktop-nav-admin"
                href="/admin"
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors min-h-[44px]"
                title="Buka Panel Moderasi Admin"
              >
                <Shield className="w-4 h-4 text-rose-600" />
                <span>Admin</span>
              </Link>
            )}

            {/* CTA Button Jual */}
            <Link
              id="desktop-nav-sell"
              href="/sell"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-xs min-h-[44px]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Jual Barang</span>
            </Link>
          </nav>

          {/* Mobile Right CTA (Shortcut Jual Cepat di Header Mobile) */}
          <div className="flex md:hidden items-center gap-1.5">
            <Link
              id="mobile-header-sell"
              href="/sell"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 active:bg-blue-800 transition-colors min-h-[44px]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Jual</span>
            </Link>
          </div>

        </div>

        {/* Mobile Search Bar (selalu terlihat di mobile tepat di bawah header) */}
        <form onSubmit={handleSearchSubmit} className="sm:hidden pb-3 pt-1">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              id="search-input-mobile"
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Cari barang di Nepal Market"
              className="w-full pl-9 pr-9 py-2 bg-slate-100 focus:bg-white text-sm text-slate-900 placeholder:text-slate-500 rounded-lg border border-transparent focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 transition-all min-h-[44px]"
            />
            {searchQuery && (
              <button
                id="btn-clear-search-mobile"
                type="button"
                aria-label="Hapus pencarian"
                onClick={() => onSearchChange('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 w-11 h-11 justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>

      </div>
    </header>
  );
};
