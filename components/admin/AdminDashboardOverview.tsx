'use client';

import React from 'react';
import { AlertTriangle, ArrowRight, Package, RefreshCw, Users } from 'lucide-react';
import { AdminDashboardRealStats, formatRelativeTime } from '@/lib/supabase/adminStats';
import { formatRupiah } from '@/lib/utils';
import { AdminTab } from './AdminSidebar';

interface Props {
  stats: AdminDashboardRealStats | null;
  isLoading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  onNavigateTab: (tab: AdminTab) => void;
}

export const AdminDashboardOverview: React.FC<Props> = ({
  stats, isLoading, isRefreshing, onRefresh, onNavigateTab,
}) => {
  if (isLoading && !stats) {
    return <div className="h-64 animate-pulse rounded-lg border border-slate-200 bg-white" />;
  }

  const value: AdminDashboardRealStats = stats || {
    totalUsers: 0, totalProducts: 0, activeProducts: 0, inactiveProducts: 0,
    pendingReports: 0, activeSponsors: 0, expiringSponsors: 0,
    activeProductPercentage: 0, categoryBreakdown: [], conditionBreakdown: [],
    recentProducts: [], recentReports: [], currentActiveSponsors: [],
    recentModerationLogs: [], lastUpdated: new Date().toISOString(), errors: {},
  };
  const metrics = [
    { label: 'Produk aktif', value: value.activeProducts, tab: 'products' as const },
    { label: 'Pengguna', value: value.totalUsers, tab: 'users' as const },
    { label: 'Laporan', value: value.pendingReports, tab: 'reports' as const },
    { label: 'Sponsor aktif', value: value.activeSponsors, tab: 'sponsor' as const },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Ringkasan</h2>
          <p className="mt-0.5 text-xs text-slate-500">Data utama Nepal Market.</p>
        </div>
        <button type="button" onClick={onRefresh} disabled={isRefreshing}
          className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          Perbarui
        </button>
      </div>

      {Object.keys(value.errors).length > 0 ? (
        <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <AlertTriangle className="h-4 w-4" /> Sebagian data belum dapat dimuat.
        </div>
      ) : null}

      <section className="grid grid-cols-2 overflow-hidden rounded-lg border border-slate-200 bg-white lg:grid-cols-4">
        {metrics.map((metric, index) => (
          <button key={metric.label} type="button" onClick={() => onNavigateTab(metric.tab)}
            className={`p-4 text-left hover:bg-slate-50 ${index % 2 ? 'border-l border-slate-200' : ''} ${index > 1 ? 'border-t border-slate-200 lg:border-t-0' : ''} ${index === 2 ? 'lg:border-l' : ''}`}>
            <p className="text-xs text-slate-500">{metric.label}</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">{metric.value}</p>
          </button>
        ))}
      </section>

      <div className="grid gap-5 lg:grid-cols-3">
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-900">Produk terbaru</h3>
            <button type="button" onClick={() => onNavigateTab('products')} className="inline-flex items-center gap-1 text-xs font-medium text-blue-600">
              Semua produk <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
          {value.recentProducts.length === 0 ? (
            <div className="px-4 py-10 text-center text-xs text-slate-500">Belum ada produk.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {value.recentProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between gap-4 px-4 py-3 text-xs">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">{product.title}</p>
                    <p className="mt-0.5 text-slate-500">{product.sellerName} · {product.category}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-medium text-slate-900">{formatRupiah(product.price)}</p>
                    <p className="mt-0.5 text-slate-400">{formatRelativeTime(product.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-900">Perlu perhatian</h3>
          </div>
          <div className="divide-y divide-slate-100">
            <AttentionRow icon={<AlertTriangle className="h-4 w-4" />} label="Laporan menunggu" value={value.pendingReports} onClick={() => onNavigateTab('reports')} />
            <AttentionRow icon={<Package className="h-4 w-4" />} label="Produk nonaktif" value={value.inactiveProducts} onClick={() => onNavigateTab('products')} />
            <AttentionRow icon={<Users className="h-4 w-4" />} label="Total pengguna" value={value.totalUsers} onClick={() => onNavigateTab('users')} />
          </div>
        </section>
      </div>
    </div>
  );
};

function AttentionRow({ icon, label, value, onClick }: { icon: React.ReactNode; label: string; value: number; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-50">
      <span className="flex items-center gap-2 text-xs text-slate-700"><span className="text-slate-400">{icon}</span>{label}</span>
      <span className="text-sm font-semibold text-slate-950">{value}</span>
    </button>
  );
}
