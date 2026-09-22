'use client';

import React from 'react';
import Link from 'next/link';
import { Menu, RefreshCw, ExternalLink, Shield } from 'lucide-react';
import { AdminTab, ADMIN_NAV_ITEMS } from './AdminSidebar';

interface AdminHeaderProps {
  activeTab: AdminTab;
  onOpenMobileMenu: () => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  activeTab,
  onOpenMobileMenu,
  onRefresh,
  isLoading,
}) => {
  const currentNav = ADMIN_NAV_ITEMS.find((item) => item.id === activeTab) || ADMIN_NAV_ITEMS[0];

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-slate-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3">
        {/* Left: Mobile Toggle & Page Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="md:hidden p-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
            aria-label="Buka menu navigasi"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate">
                {currentNav.label}
              </h1>
              <span className="hidden sm:inline-flex text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-semibold uppercase">
                Panel Admin
              </span>
            </div>
            <p className="text-xs text-slate-500 truncate hidden sm:block">
              {currentNav.description}
            </p>
          </div>
        </div>

        {/* Right: Quick Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="px-2.5 sm:px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Perbarui Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Segarkan</span>
          </button>

          <Link
            href="/"
            target="_blank"
            className="px-2.5 sm:px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-300" />
            <span className="hidden sm:inline">Lihat Toko</span>
          </Link>
        </div>
      </div>
    </header>
  );
};
