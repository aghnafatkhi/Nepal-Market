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
      className="sticky top-0 z-30 w-full border-b border-black/5 bg-white/95 backdrop-blur-xl"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        {/* Top Row */}
        <div className="flex items-center justify-between h-14 sm:h-16 gap-3 sm:gap-7">
          
          {/* Brand Logo */}
          <Link
            id="brand-wordmark"
            href="/"
            onClick={onResetToHome}
            className="flex items-center gap-2.5 focus:outline-hidden shrink-0"
          >
            <div className="nm-mark w-8 h-8 sm:w-9 sm:h-9 rounded-[10px] font-semibold text-sm sm:text-base">
              N
            </div>
            <span className="text-[15px] sm:text-[17px] font-semibold tracking-[-0.035em] text-slate-950">
              Nepal<span className="text-blue-600"> Market</span>
            </span>
          </Link>

          {/* Desktop & Tablet Search Bar */}
          <form 
            onSubmit={handleSearchSubmit}
            className="hidden sm:flex flex-1 max-w-lg items-center relative"
          >
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                id="search-input-desktop"
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Cari barang..."
                className="w-full pl-10 pr-8 py-2.5 bg-[#f5f5f3] focus:bg-white text-sm text-slate-950 placeholder:text-slate-400 rounded-xl border border-transparent focus:border-blue-600 focus:outline-hidden transition-colors"
              />
              {searchQuery && (
                <button
                  id="btn-clear-search-desktop"
                  type="button"
                  aria-label="Hapus pencarian"
                  onClick={() => onSearchChange('')}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </form>

          {/* Desktop Navigation */}
          <nav 
            id="desktop-nav"
            aria-label="Navigasi Header"
            className="hidden sm:flex items-center gap-2 shrink-0"
          >
            <Link
              id="desktop-nav-saved"
              href={user ? "/saved" : "/login?redirectTo=/saved"}
              className="relative flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium text-slate-700 hover:text-blue-600 hover:bg-slate-50 rounded-md transition-colors min-h-[40px]"
            >
              <Bookmark className="w-4 h-4 text-slate-500" />
              <span>Disimpan</span>
              {savedCount > 0 && (
                <span className="ml-0.5 inline-flex items-center justify-center px-1.5 py-0.2 text-xs font-semibold text-white bg-blue-600 rounded-full">
                  {savedCount}
                </span>
              )}
            </Link>

            <Link
              id="desktop-nav-profile"
              href={user ? "/profile" : "/login?redirectTo=/profile"}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium text-slate-700 hover:text-blue-600 hover:bg-slate-50 rounded-md transition-colors min-h-[40px]"
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
                className="flex items-center gap-1 px-2.5 py-1.5 text-sm font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors min-h-[40px]"
                title="Panel Admin"
              >
                <Shield className="w-4 h-4 text-rose-600" />
                <span>Admin</span>
              </Link>
            )}

            {/* CTA Button Jual */}
            <Link
              id="desktop-nav-sell"
              href="/sell"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-950 text-white text-sm font-medium hover:bg-blue-600 transition-colors min-h-[42px] cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Jual Barang</span>
            </Link>
          </nav>

          {/* Mobile Right Controls: Saved, Profile, Jual */}
          <div className="flex sm:hidden items-center gap-1">
            <Link
              id="mobile-nav-saved"
              href={user ? "/saved" : "/login?redirectTo=/saved"}
              aria-label="Barang Disimpan"
              className="relative p-2 text-slate-600 hover:text-blue-600 rounded-md transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
            >
              <Bookmark className="w-4 h-4" />
              {savedCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-600" />
              )}
            </Link>

            <Link
              id="mobile-nav-profile"
              href={user ? "/profile" : "/login?redirectTo=/profile"}
              aria-label="Profil Akun"
              className="p-2 text-slate-600 hover:text-blue-600 rounded-md transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
            >
              {user ? (
                <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center uppercase">
                  {(profile?.name || user.email || 'U').charAt(0)}
                </div>
              ) : (
                <User className="w-4 h-4" />
              )}
            </Link>

            <Link
              id="mobile-header-sell"
              href="/sell"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-950 text-white text-xs font-medium hover:bg-blue-600 transition-colors min-h-[40px] ml-0.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Jual</span>
            </Link>
          </div>

        </div>

        {/* Mobile Search Bar (langsung terlihat di mobile di bawah baris logo) */}
        <form onSubmit={handleSearchSubmit} className="sm:hidden pb-2.5">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              id="search-input-mobile"
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Cari barang di Nepal Market..."
              className="w-full pl-10 pr-8 py-2.5 bg-[#f5f5f3] focus:bg-white text-sm text-slate-950 placeholder:text-slate-400 rounded-xl border border-transparent focus:border-blue-600 focus:outline-hidden transition-colors min-h-[44px]"
            />
            {searchQuery && (
              <button
                id="btn-clear-search-mobile"
                type="button"
                aria-label="Hapus pencarian"
                onClick={() => onSearchChange('')}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
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
