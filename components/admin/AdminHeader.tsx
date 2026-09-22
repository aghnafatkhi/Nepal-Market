'use client';

import React from 'react';
import Link from 'next/link';
import { Menu, RefreshCw, ExternalLink } from 'lucide-react';
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
    <header className="sticky top-0 z-20 bg-white border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
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
              <h1 className="text-base font-semibold text-slate-950 tracking-tight truncate">
                {currentNav.label}
              </h1>
            </div>
          </div>
        </div>

        {/* Right: Quick Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 hover:bg-slate-100 border border-slate-200 rounded-md text-slate-600 cursor-pointer disabled:opacity-50"
            title="Perbarui Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <Link
            href="/"
            target="_blank"
            className="p-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-300" />
          </Link>
        </div>
      </div>
    </header>
  );
};
