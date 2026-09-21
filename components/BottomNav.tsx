'use client';

import React from 'react';
import { Home, Search, PlusCircle, Bookmark, User } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'home' | 'cari' | 'jual' | 'disimpan' | 'profil';
  savedCount: number;
  onSelectTab: (tab: 'home' | 'cari' | 'jual' | 'disimpan' | 'profil') => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  savedCount,
  onSelectTab,
}) => {
  return (
    <nav
      id="mobile-bottom-nav"
      aria-label="Navigasi Utama Mobile"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 pb-[env(safe-area-inset-bottom)]"
    >
      <div className="grid grid-cols-5 h-15 max-w-lg mx-auto items-center px-1">
        
        {/* Home */}
        <button
          id="tab-mobile-home"
          type="button"
          aria-label="Beranda"
          onClick={() => onSelectTab('home')}
          className={`flex flex-col items-center justify-center w-full h-full min-h-[44px] min-w-[44px] transition-colors ${
            activeTab === 'home' ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] mt-1 leading-none">Beranda</span>
        </button>

        {/* Cari */}
        <button
          id="tab-mobile-cari"
          type="button"
          aria-label="Cari Barang"
          onClick={() => onSelectTab('cari')}
          className={`flex flex-col items-center justify-center w-full h-full min-h-[44px] min-w-[44px] transition-colors ${
            activeTab === 'cari' ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Search className="w-5 h-5" />
          <span className="text-[10px] mt-1 leading-none">Cari</span>
        </button>

        {/* Jual (Center highlight button) */}
        <button
          id="tab-mobile-jual"
          type="button"
          aria-label="Pasang Iklan Jual Barang"
          onClick={() => onSelectTab('jual')}
          className="flex flex-col items-center justify-center w-full h-full min-h-[44px] min-w-[44px] text-blue-600 group active:scale-95 transition-transform"
        >
          <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs group-hover:bg-blue-700 transition-colors">
            <PlusCircle className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-semibold mt-0.5 leading-none text-blue-600">Jual</span>
        </button>

        {/* Disimpan */}
        <button
          id="tab-mobile-disimpan"
          type="button"
          aria-label="Barang Disimpan"
          onClick={() => onSelectTab('disimpan')}
          className={`relative flex flex-col items-center justify-center w-full h-full min-h-[44px] min-w-[44px] transition-colors ${
            activeTab === 'disimpan' ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className="relative">
            <Bookmark className="w-5 h-5" />
            {savedCount > 0 && (
              <span className="absolute -top-1.5 -right-2 min-w-[15px] h-[15px] px-1 bg-blue-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {savedCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-1 leading-none">Disimpan</span>
        </button>

        {/* Profil */}
        <button
          id="tab-mobile-profil"
          type="button"
          aria-label="Profil Pengguna"
          onClick={() => onSelectTab('profil')}
          className={`flex flex-col items-center justify-center w-full h-full min-h-[44px] min-w-[44px] transition-colors ${
            activeTab === 'profil' ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] mt-1 leading-none">Profil</span>
        </button>

      </div>
    </nav>
  );
};
