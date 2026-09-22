'use client';

import React from 'react';
import Link from 'next/link';
import {
  AdminDashboardRealStats,
  formatAdminDateTime,
  formatRelativeTime,
} from '@/lib/supabase/adminStats';
import { AdminStatCard } from './AdminStatCard';
import { AdminStatusBadge } from './AdminStatusBadge';
import { AdminEmptyState } from './AdminEmptyState';
import { formatRupiah } from '@/lib/utils';
import { AdminTab } from './AdminSidebar';
import {
  Users,
  Package,
  CheckCircle2,
  EyeOff,
  AlertTriangle,
  Megaphone,
  Clock,
  RefreshCw,
  TrendingUp,
  BarChart3,
  Layers,
  ArrowRight,
  ShieldAlert,
  ExternalLink,
  History,
  Check,
  AlertOctagon,
  Calendar,
} from 'lucide-react';

interface AdminDashboardOverviewProps {
  stats: AdminDashboardRealStats | null;
  isLoading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  onNavigateTab: (tab: AdminTab) => void;
}

export const AdminDashboardOverview: React.FC<AdminDashboardOverviewProps> = ({
  stats,
  isLoading,
  isRefreshing,
  onRefresh,
  onNavigateTab,
}) => {
  // Skeleton Loader saat pertama kali data dimuat
  if (isLoading && !stats) {
    return <DashboardSkeleton onRefresh={onRefresh} />;
  }

  const currentStats: AdminDashboardRealStats = stats || {
    totalUsers: 0,
    totalProducts: 0,
    activeProducts: 0,
    inactiveProducts: 0,
    pendingReports: 0,
    activeSponsors: 0,
    expiringSponsors: 0,
    activeProductPercentage: 0,
    categoryBreakdown: [],
    conditionBreakdown: [],
    recentProducts: [],
    recentReports: [],
    currentActiveSponsors: [],
    recentModerationLogs: [],
    lastUpdated: new Date().toISOString(),
    errors: {},
  };

  const hasPartialErrors = Object.keys(currentStats.errors || {}).length > 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-200" id="admin-real-dashboard">
      {/* 1. Header Bar: Sinkronisasi Waktu & Tombol Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-lg p-3.5 sm:p-4 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-800 tracking-wide uppercase">
                Data Real-Time Supabase
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-slate-100 text-slate-600 border border-slate-200">
                Live Query
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Terakhir diperbarui: {formatAdminDateTime(currentStats.lastUpdated)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            id="btn-refresh-admin-dashboard"
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white rounded-md text-xs font-semibold transition-all shadow-2xs cursor-pointer"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`}
            />
            <span>{isRefreshing ? 'Menyinkronkan...' : 'Segarkan Data'}</span>
          </button>
        </div>
      </div>

      {/* Partial Error Notification (Graceful Degradation Notice) */}
      {hasPartialErrors && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2.5 text-xs text-amber-800">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">Perhatian koneksi data: </span>
            <span>
              Sebagian query statistik belum terisi ({Object.keys(currentStats.errors).join(', ')}). Statistik lainnya tetap ditampilkan dari data database yang tersedia.
            </span>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            className="text-amber-900 font-bold hover:underline shrink-0 text-[11px]"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* 2. TUJUH KARTU STATISTIK UTAMA (Real Data dari Supabase) */}
      <section aria-label="Ringkasan Metrik Utama">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Kartu 1: Total Pengguna */}
          <AdminStatCard
            id="stat-total-users"
            title="Total Pengguna"
            value={currentStats.totalUsers}
            badgeText="Terdaftar"
            badgeType="info"
            subtext="Akun di profil sistem"
            icon={<Users className="w-5 h-5 text-blue-600" />}
            onClick={() => onNavigateTab('users')}
          />

          {/* Kartu 2: Total Produk */}
          <AdminStatCard
            id="stat-total-products"
            title="Total Produk"
            value={currentStats.totalProducts}
            badgeText="Semua Status"
            badgeType="neutral"
            subtext="Katalog keseluruhan"
            icon={<Package className="w-5 h-5 text-indigo-600" />}
            onClick={() => onNavigateTab('products')}
          />

          {/* Kartu 3: Produk Aktif */}
          <AdminStatCard
            id="stat-active-products"
            title="Produk Aktif"
            value={currentStats.activeProducts}
            badgeText="Tayang Publik"
            badgeType="success"
            subtext="Tampil di halaman utama"
            icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            onClick={() => onNavigateTab('products')}
          />

          {/* Kartu 4: Produk Tersembunyi / Tidak Aktif */}
          <AdminStatCard
            id="stat-inactive-products"
            title="Produk Non-Aktif"
            value={currentStats.inactiveProducts}
            badgeText={currentStats.inactiveProducts > 0 ? 'Draft / Hidden' : 'Nol'}
            badgeType={currentStats.inactiveProducts > 0 ? 'neutral' : 'success'}
            subtext="Tersembunyi atau terjual"
            icon={<EyeOff className="w-5 h-5 text-slate-500" />}
            onClick={() => onNavigateTab('products')}
          />

          {/* Kartu 5: Laporan Menunggu */}
          <AdminStatCard
            id="stat-pending-reports"
            title="Laporan Menunggu"
            value={currentStats.pendingReports}
            badgeText={currentStats.pendingReports > 0 ? 'Perlu Ditinjau' : 'Bersih'}
            badgeType={currentStats.pendingReports > 0 ? 'danger' : 'success'}
            subtext="Aduan produk / pelanggaran"
            icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
            onClick={() => onNavigateTab('reports')}
          />

          {/* Kartu 6: Sponsor Aktif */}
          <AdminStatCard
            id="stat-active-sponsors"
            title="Sponsor Aktif"
            value={currentStats.activeSponsors}
            badgeText="Slot Beranda"
            badgeType="info"
            subtext="Sedang live di homepage"
            icon={<Megaphone className="w-5 h-5 text-sky-600" />}
            onClick={() => onNavigateTab('sponsor')}
          />

          {/* Kartu 7: Sponsor Segera Berakhir (< 7 Hari) */}
          <AdminStatCard
            id="stat-expiring-sponsors"
            title="Sponsor Segera Berakhir"
            value={currentStats.expiringSponsors}
            badgeText={currentStats.expiringSponsors > 0 ? '< 7 Hari' : 'Aman'}
            badgeType={currentStats.expiringSponsors > 0 ? 'danger' : 'neutral'}
            subtext="Perlu perpanjangan kontrak"
            icon={<Clock className="w-5 h-5 text-amber-600" />}
            onClick={() => onNavigateTab('sponsor')}
          />

          {/* Kartu 8 (Bonus Metrik): Persentase Produk Aktif */}
          <div className="w-full bg-white border border-slate-200 rounded-lg p-3.5 sm:p-4 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Rasio Keaktifan
                </p>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {currentStats.activeProductPercentage}%
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  katalog aktif
                </span>
              </div>
            </div>

            {/* Visual Mini Progress Bar */}
            <div className="mt-2.5">
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
                  style={{ width: `${Math.min(100, currentStats.activeProductPercentage)}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
                <span>{currentStats.activeProducts} aktif</span>
                <span>{currentStats.totalProducts} total</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SECTION DISTRIBUSI: KATEGORI & KONDISI PRODUK */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Ringkasan Kategori Produk (Grafik Batang Sederhana & Responsif) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-slate-700" />
                <h2 className="text-sm font-bold text-slate-900">
                  Ringkasan Kategori Produk
                </h2>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                Grafik Distribusi
              </span>
            </div>

            {currentStats.categoryBreakdown.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Belum ada data kategori produk yang tercatat di katalog.
              </div>
            ) : (
              <div className="space-y-3">
                {currentStats.categoryBreakdown.map((item) => (
                  <div key={item.category} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700">
                        {item.label}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">
                          {item.count} produk
                        </span>
                        <span className="text-[11px] text-slate-400 w-8 text-right font-mono">
                          {item.percentage}%
                        </span>
                      </div>
                    </div>
                    {/* Bar Responsif Murni Tailwind */}
                    <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden flex">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${Math.max(3, item.percentage)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Total terpetakan: {currentStats.totalProducts} produk</span>
            <button
              type="button"
              onClick={() => onNavigateTab('products')}
              className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1 cursor-pointer"
            >
              Lihat di Daftar Produk <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Ringkasan Kondisi Produk */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-slate-700" />
                <h2 className="text-sm font-bold text-slate-900">
                  Ringkasan Kondisi
                </h2>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                Kondisi Barang
              </span>
            </div>

            {currentStats.conditionBreakdown.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Belum ada data kondisi produk.
              </div>
            ) : (
              <div className="space-y-3">
                {currentStats.conditionBreakdown.map((item) => {
                  const conditionColor =
                    item.condition === 'new'
                      ? 'bg-emerald-500'
                      : item.condition === 'like_new'
                      ? 'bg-blue-500'
                      : 'bg-amber-500';

                  return (
                    <div
                      key={item.condition}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800">
                          {item.label}
                        </span>
                        <span className="font-mono text-xs font-bold text-slate-900">
                          {item.count} ({item.percentage}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className={`h-full ${conditionColor} rounded-full transition-all duration-500`}
                          style={{ width: `${Math.max(4, item.percentage)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <p className="text-[11px] text-slate-400 mt-4 pt-3 border-t border-slate-100">
            Kondisi dinyatakan langsung oleh penjual saat listing dibuat.
          </p>
        </div>
      </section>

      {/* 4. SECTION DATA TERBARU: PRODUK & LAPORAN */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Widget 1: Produk Terbaru */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-slate-700" />
                <h2 className="text-sm font-bold text-slate-900">Produk Terbaru</h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('products')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                Lihat Semua →
              </button>
            </div>

            {currentStats.recentProducts.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Belum ada produk terdaftar di database.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {currentStats.recentProducts.map((prod) => (
                  <div
                    key={prod.id}
                    className="py-2.5 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-900 truncate">
                          {prod.title}
                        </p>
                        <AdminStatusBadge status={prod.status} />
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span className="font-medium text-slate-700">
                          {formatRupiah(prod.price)}
                        </span>
                        <span>•</span>
                        <span className="capitalize">{prod.category}</span>
                        <span>•</span>
                        <span>Penjual: {prod.sellerName}</span>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400 whitespace-nowrap shrink-0">
                      {formatRelativeTime(prod.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Widget 2: Laporan Terbaru */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-rose-600" />
                <h2 className="text-sm font-bold text-slate-900">
                  Laporan Pengaduan Terbaru
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('reports')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                Lihat Semua →
              </button>
            </div>

            {currentStats.recentReports.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Tidak ada laporan masuk. Seluruh produk beroperasi normal.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {currentStats.recentReports.map((rep) => (
                  <div
                    key={rep.id}
                    className="py-2.5 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          {rep.reason}
                        </span>
                        <p className="font-medium text-slate-800 truncate">
                          {rep.productTitle}
                        </p>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Status:{' '}
                        <span
                          className={`font-medium ${
                            rep.status === 'pending'
                              ? 'text-rose-600'
                              : 'text-emerald-600'
                          }`}
                        >
                          {rep.status === 'pending' ? 'Menunggu Peninjauan' : rep.status}
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400 whitespace-nowrap shrink-0">
                      {formatRelativeTime(rep.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 5. SECTION DATA TERBARU: SPONSOR AKTIF & AKTIVITAS MODERASI */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Widget 3: Sponsor Aktif Saat Ini */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-amber-600" />
                <h2 className="text-sm font-bold text-slate-900">
                  Sponsor Aktif Saat Ini
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('sponsor')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                Kelola Banner →
              </button>
            </div>

            {currentStats.currentActiveSponsors.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Tidak ada sponsor yang sedang live saat ini di halaman utama.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {currentStats.currentActiveSponsors.map((sp) => (
                  <div
                    key={sp.id}
                    className="py-2.5 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 truncate">
                          {sp.sponsorName}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Live
                        </span>
                        {sp.isExpiringSoon && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200">
                            Segera Berakhir
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        {sp.daysRemaining !== null ? (
                          <span>Sisa waktu: {sp.daysRemaining} hari</span>
                        ) : (
                          <span>Durasi: Berkelanjutan</span>
                        )}
                      </div>
                    </div>

                    {sp.targetUrl && sp.targetUrl !== '#' && (
                      <a
                        href={sp.targetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-slate-700 p-1"
                        title="Buka URL Sponsor"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Widget 4: Aktivitas Moderasi Terbaru */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-slate-700" />
                <h2 className="text-sm font-bold text-slate-900">
                  Aktivitas Moderasi Terbaru
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('logs')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                Semua Log →
              </button>
            </div>

            {currentStats.recentModerationLogs.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Belum ada aktivitas audit moderasi tercatat.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {currentStats.recentModerationLogs.map((log) => (
                  <div
                    key={log.id}
                    className="py-2.5 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800">
                          {formatActionLabel(log.action)}
                        </span>
                        {log.targetTitle && (
                          <span className="text-slate-600 truncate max-w-[140px] sm:max-w-[200px]">
                            &quot;{log.targetTitle}&quot;
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Oleh: <strong className="text-slate-700">{log.adminName}</strong> • {log.reason}
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400 whitespace-nowrap shrink-0">
                      {formatRelativeTime(log.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

function formatActionLabel(action: string): string {
  switch (action) {
    case 'hide_product':
      return 'Sembunyikan Produk';
    case 'remove_product':
      return 'Hapus Produk';
    case 'restore_product':
      return 'Pulihkan Produk';
    case 'suspend_user':
      return 'Tangguhkan Pengguna';
    case 'unsuspend_user':
      return 'Aktifkan Pengguna';
    case 'resolve_report':
      return 'Selesaikan Laporan';
    case 'dismiss_report':
      return 'Abaikan Laporan';
    default:
      return action;
  }
}

/**
 * Skeleton Loader untuk Tampilan Dashboard Admin saat memuat data
 */
function DashboardSkeleton({ onRefresh }: { onRefresh: () => void }) {
  return (
    <div className="space-y-6 animate-pulse" id="admin-dashboard-skeleton">
      {/* Skeleton Header Bar */}
      <div className="h-16 bg-white border border-slate-200 rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-slate-200" />
          <div className="space-y-1.5">
            <div className="h-3.5 w-32 bg-slate-200 rounded" />
            <div className="h-2.5 w-48 bg-slate-100 rounded" />
          </div>
        </div>
        <div className="h-8 w-28 bg-slate-200 rounded" />
      </div>

      {/* Skeleton Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            className="h-24 bg-white border border-slate-200 rounded-lg p-4 flex justify-between items-center"
          >
            <div className="space-y-2 flex-1">
              <div className="h-2.5 w-24 bg-slate-200 rounded" />
              <div className="h-6 w-16 bg-slate-300 rounded" />
              <div className="h-2 w-32 bg-slate-100 rounded" />
            </div>
            <div className="w-10 h-10 rounded-lg bg-slate-100 shrink-0" />
          </div>
        ))}
      </div>

      {/* Skeleton Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 h-64 bg-white border border-slate-200 rounded-lg p-5 space-y-3">
          <div className="h-4 w-40 bg-slate-200 rounded" />
          <div className="space-y-3 pt-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between">
                  <div className="h-3 w-20 bg-slate-200 rounded" />
                  <div className="h-3 w-12 bg-slate-200 rounded" />
                </div>
                <div className="h-2.5 w-full bg-slate-100 rounded-full" />
              </div>
            ))}
          </div>
        </div>
        <div className="h-64 bg-white border border-slate-200 rounded-lg p-5 space-y-3">
          <div className="h-4 w-32 bg-slate-200 rounded" />
          <div className="space-y-2 pt-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-slate-100 rounded-md" />
            ))}
          </div>
        </div>
      </div>

      {/* Skeleton Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-56 bg-white border border-slate-200 rounded-lg p-5 space-y-3">
          <div className="h-4 w-28 bg-slate-200 rounded" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-slate-50 rounded" />
            ))}
          </div>
        </div>
        <div className="h-56 bg-white border border-slate-200 rounded-lg p-5 space-y-3">
          <div className="h-4 w-28 bg-slate-200 rounded" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-slate-50 rounded" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
