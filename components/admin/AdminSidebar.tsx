'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft, History, LayoutDashboard, Megaphone, Package, Shield, Users, X } from 'lucide-react';

export type AdminTab = 'dashboard' | 'sponsor' | 'products' | 'users' | 'reports' | 'logs';

interface Props {
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  pendingReportsCount: number;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  adminName?: string;
  adminEmail?: string;
}

export const ADMIN_NAV_ITEMS = [
  { id: 'dashboard' as const, label: 'Ringkasan', icon: LayoutDashboard, description: '' },
  { id: 'products' as const, label: 'Produk', icon: Package, description: '' },
  { id: 'users' as const, label: 'Pengguna', icon: Users, description: '' },
  { id: 'reports' as const, label: 'Laporan', icon: AlertTriangle, description: '' },
  { id: 'sponsor' as const, label: 'Sponsor', icon: Megaphone, description: '' },
  { id: 'logs' as const, label: 'Aktivitas', icon: History, description: '' },
];

export const AdminSidebar: React.FC<Props> = ({
  activeTab, onSelectTab, pendingReportsCount, isOpenMobile, onCloseMobile, adminName = 'Admin',
}) => {
  const content = (
    <div className="flex h-full flex-col bg-white">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 px-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-950 text-white"><Shield className="h-4 w-4" /></div>
          <div><p className="text-sm font-semibold text-slate-950">Nepal Market</p><p className="text-[10px] text-slate-500">Admin</p></div>
        </div>
        <button type="button" onClick={onCloseMobile} className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 md:hidden" aria-label="Tutup menu"><X className="h-5 w-5" /></button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-2" aria-label="Menu admin">
        {ADMIN_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button key={item.id} type="button" onClick={() => { onSelectTab(item.id); onCloseMobile(); }}
              className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium ${active ? 'bg-slate-100 text-slate-950' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'}`}>
              <span className="flex items-center gap-2.5"><Icon className="h-4 w-4 text-slate-400" />{item.label}</span>
              {item.id === 'reports' && pendingReportsCount > 0 ? <span className="rounded-full bg-slate-900 px-1.5 text-[10px] text-white">{pendingReportsCount}</span> : null}
            </button>
          );
        })}
        <div className="mt-3 border-t border-slate-200 pt-3">
          <Link href="/" className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-950"><ArrowLeft className="h-4 w-4 text-slate-400" />Kembali ke toko</Link>
        </div>
      </nav>

      <div className="border-t border-slate-200 p-3">
        <p className="truncate text-xs font-medium text-slate-900">{adminName}</p>
      </div>
    </div>
  );

  return (
    <>
      <aside className="sticky top-0 z-30 hidden h-screen w-56 shrink-0 border-r border-slate-200 md:flex">{content}</aside>
      {isOpenMobile ? (
        <div className="fixed inset-0 z-50 flex md:hidden" role="dialog" aria-modal="true">
          <button type="button" className="fixed inset-0 bg-slate-950/40" onClick={onCloseMobile} aria-label="Tutup menu" />
          <div className="relative z-10 h-full w-4/5 max-w-xs shadow-2xl">{content}</div>
        </div>
      ) : null}
    </>
  );
};
