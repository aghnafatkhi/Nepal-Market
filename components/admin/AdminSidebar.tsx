'use client';

import React from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Megaphone,
  Package,
  Users,
  AlertTriangle,
  History,
  Shield,
  ArrowLeft,
  X,
  ExternalLink
} from 'lucide-react';

export type AdminTab = 'dashboard' | 'sponsor' | 'products' | 'users' | 'reports' | 'logs';

interface AdminSidebarProps {
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  pendingReportsCount: number;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  adminName?: string;
  adminEmail?: string;
}

export const ADMIN_NAV_ITEMS: Array<{
  id: AdminTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}> = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    description: 'Ikhtisar statistik dan ringkasan aktivitas pasar',
  },
  {
    id: 'sponsor',
    label: 'Sponsor',
    icon: Megaphone,
    description: 'Manajemen banner promosi dan slot iklan beranda',
  },
  {
    id: 'products',
    label: 'Produk',
    icon: Package,
    description: 'Pengawasan dan moderasi barang di katalog pasar',
  },
  {
    id: 'users',
    label: 'Pengguna',
    icon: Users,
    description: 'Daftar akun penjual dan pengawasan status pengguna',
  },
  {
    id: 'reports',
    label: 'Laporan',
    icon: AlertTriangle,
    description: 'Antrean aduan pelanggaran dari pembeli dan penjual',
  },
  {
    id: 'logs',
    label: 'Log Moderasi',
    icon: History,
    description: 'Catatan jejak audit aksi dan alasan penindakan admin',
  },
];

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  onSelectTab,
  pendingReportsCount,
  isOpenMobile,
  onCloseMobile,
  adminName = 'Administrator',
  adminEmail,
}) => {
  const NavContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300">
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center font-bold text-white shadow-xs">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-white tracking-tight block">
              Nepal Market
            </span>
            <span className="text-[10px] font-mono text-rose-400 font-semibold uppercase tracking-wider">
              Admin Panel
            </span>
          </div>
        </div>

        {/* Mobile Close Button */}
        <button
          type="button"
          onClick={onCloseMobile}
          className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Tutup menu navigasi"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1" aria-label="Menu Admin">
        <p className="px-2 pb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
          Navigasi Utama
        </p>

        {ADMIN_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const hasPendingBadge = item.id === 'reports' && pendingReportsCount > 0;

          return (
            <button
              key={item.id}
              id={`admin-nav-${item.id}`}
              type="button"
              onClick={() => {
                onSelectTab(item.id);
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer ${
                isActive
                  ? 'bg-rose-600/15 text-white border border-rose-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-rose-400' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </div>

              {hasPendingBadge && (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[10px] font-mono font-bold">
                  {pendingReportsCount}
                </span>
              )}
            </button>
          );
        })}

        <div className="pt-4 mt-4 border-t border-slate-800">
          <p className="px-2 pb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            Toko
          </p>
          <Link
            href="/"
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-slate-400" />
            <span>Kembali ke Beranda</span>
          </Link>
          <Link
            href="/"
            target="_blank"
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <span>Buka Marketplace</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
          </Link>
        </div>
      </nav>

      {/* Admin User Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/50 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-rose-600/30 border border-rose-500/40 text-rose-300 flex items-center justify-center font-bold text-xs shrink-0">
            {adminName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white truncate">{adminName}</p>
            <p className="text-[10px] text-slate-400 truncate">{adminEmail || 'Administrator'}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Fixed 240px) */}
      <aside className="hidden md:flex flex-col w-60 shrink-0 sticky top-0 h-screen border-r border-slate-800 z-30">
        {NavContent}
      </aside>

      {/* Mobile Slide-Over Sheet / Drawer */}
      {isOpenMobile && (
        <div
          id="admin-mobile-drawer"
          className="fixed inset-0 z-50 md:hidden flex"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={onCloseMobile}
          />

          {/* Drawer Panel */}
          <div className="relative w-4/5 max-w-xs h-full bg-slate-900 shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {NavContent}
          </div>
        </div>
      )}
    </>
  );
};
