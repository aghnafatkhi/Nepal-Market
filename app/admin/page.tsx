'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Shield,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  EyeOff,
  Trash2,
  RotateCcw,
  UserX,
  UserCheck,
  Search,
  ExternalLink,
  Clock,
  User,
  Package,
  ArrowLeft,
  RefreshCw,
  Info,
  History,
  FileText,
  Loader2,
  Check,
  AlertOctagon,
  X
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  AdminReportItem,
  PROHIBITED_ITEMS_GUIDELINES,
  fetchAdminDashboardData,
  adminHideProduct,
  adminRemoveProduct,
  adminRestoreProduct,
  adminToggleSellerSuspension,
  adminUpdateReportStatus,
} from '@/lib/supabase/moderation';
import { DbModerationLog, DbReportStatus } from '@/lib/supabase/types';
import { formatRupiah } from '@/lib/utils';

type ActiveTab = 'reports' | 'guidelines' | 'logs';
type FilterReportStatus = 'all' | 'pending' | 'resolved';

interface PendingActionState {
  type: 'hide' | 'remove' | 'restore' | 'suspend_user' | 'unsuspend_user' | 'resolve_report';
  title: string;
  description: string;
  targetId: string;
  targetTitle: string;
  reportId?: string;
  sellerId?: string;
  sellerName?: string;
  confirmButtonText: string;
  isDestructive?: boolean;
}

export default function AdminPage() {
  const router = useRouter();
  const { user, profile, session, isLoading: authLoading } = useAuth();

  // State Verifikasi Server
  const [isServerVerified, setIsServerVerified] = useState<boolean | null>(null);
  const [serverVerifyError, setServerVerifyError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);

  // State Dashboard Data
  const [activeTab, setActiveTab] = useState<ActiveTab>('reports');
  const [statusFilter, setStatusFilter] = useState<FilterReportStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Data
  const [summary, setSummary] = useState({
    totalProducts: 0,
    totalUsers: 0,
    pendingReports: 0,
    activeProducts: 0,
  });
  const [reports, setReports] = useState<AdminReportItem[]>([]);
  const [moderationLogs, setModerationLogs] = useState<DbModerationLog[]>([]);

  // Action & Modal State
  const [pendingAction, setPendingAction] = useState<PendingActionState | null>(null);
  const [adminReason, setAdminReason] = useState('');
  const [isExecutingAction, setIsExecutingAction] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // 1. Verifikasi role admin di server secara ketat
  useEffect(() => {
    let isMounted = true;

    if (authLoading) return;

    if (!user) {
      router.push('/login?redirectTo=/admin');
      return;
    }

    const verifyServerAdmin = async () => {
      await Promise.resolve();
      if (!isMounted) return;

      try {
        const token = session?.access_token;
        const res = await fetch('/api/admin/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        const data = await res.json();

        if (!isMounted) return;

        if (res.ok && data.isAdmin) {
          setIsServerVerified(true);
        } else {
          setIsServerVerified(false);
          setServerVerifyError(data.error || 'Akses ditolak: Hanya akun Administrator yang diizinkan.');
        }
      } catch {
        if (!isMounted) return;
        setIsServerVerified(false);
        setServerVerifyError('Gagal memverifikasi hak akses administrator di server.');
      } finally {
        if (isMounted) setIsVerifying(false);
      }
    };

    verifyServerAdmin();

    return () => {
      isMounted = false;
    };
  }, [user, session, authLoading, router]);

  // Escape listener untuk dialog modal tindakan admin
  useEffect(() => {
    if (!pendingAction) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isExecutingAction) {
        setPendingAction(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pendingAction, isExecutingAction]);

  // 2. Load dashboard data jika admin terverifikasi
  const loadDashboard = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const data = await fetchAdminDashboardData();
      setSummary(data.summary);
      setReports(data.reports);
      setModerationLogs(data.logs);
    } catch (e) {
      console.error('Gagal mengambil data moderasi:', e);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    if (isServerVerified) {
      const runLoad = async () => {
        await Promise.resolve();
        if (!isMounted) return;
        loadDashboard();
      };
      runLoad();
    }
    return () => {
      isMounted = false;
    };
  }, [isServerVerified, loadDashboard]);

  // Flash message helper
  const triggerSuccessFlash = (msg: string) => {
    setActionSuccessMessage(msg);
    setTimeout(() => {
      setActionSuccessMessage(null);
    }, 4000);
  };

  // Eksekusi aksi moderasi admin dengan alasan tindakan
  const handleExecuteAction = async () => {
    if (!pendingAction || !user) return;

    if (!adminReason.trim()) {
      setActionError('Harap tuliskan alasan tindakan admin untuk riwayat audit.');
      return;
    }

    setIsExecutingAction(true);
    setActionError(null);

    const adminId = user.id;
    let res: { success: boolean; error: Error | null } = { success: false, error: null };

    switch (pendingAction.type) {
      case 'hide':
        res = await adminHideProduct(
          adminId,
          pendingAction.targetId,
          pendingAction.targetTitle,
          adminReason.trim()
        );
        if (res.success && pendingAction.reportId) {
          await adminUpdateReportStatus(adminId, pendingAction.reportId, 'reviewed', adminReason.trim());
        }
        break;

      case 'remove':
        res = await adminRemoveProduct(
          adminId,
          pendingAction.targetId,
          pendingAction.targetTitle,
          adminReason.trim()
        );
        if (res.success && pendingAction.reportId) {
          await adminUpdateReportStatus(adminId, pendingAction.reportId, 'resolved', adminReason.trim());
        }
        break;

      case 'restore':
        res = await adminRestoreProduct(
          adminId,
          pendingAction.targetId,
          pendingAction.targetTitle,
          adminReason.trim()
        );
        break;

      case 'suspend_user':
        res = await adminToggleSellerSuspension(
          adminId,
          pendingAction.targetId,
          pendingAction.targetTitle,
          true,
          adminReason.trim()
        );
        break;

      case 'unsuspend_user':
        res = await adminToggleSellerSuspension(
          adminId,
          pendingAction.targetId,
          pendingAction.targetTitle,
          false,
          adminReason.trim()
        );
        break;

      case 'resolve_report':
        res = await adminUpdateReportStatus(
          adminId,
          pendingAction.targetId,
          'resolved',
          adminReason.trim()
        );
        break;
    }

    setIsExecutingAction(false);

    if (res.error) {
      setActionError(res.error.message || 'Terjadi kesalahan saat memproses tindakan.');
      return;
    }

    // Berhasil
    triggerSuccessFlash(`Tindakan berhasil dijalankan: ${pendingAction.title}`);
    setPendingAction(null);
    setAdminReason('');
    loadDashboard();
  };

  // Filter laporan
  const filteredReports = reports.filter((r) => {
    // Filter status
    if (statusFilter === 'pending' && r.status !== 'pending') return false;
    if (statusFilter === 'resolved' && r.status === 'pending') return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchProduct = r.product?.title.toLowerCase().includes(q);
      const matchSeller = r.seller?.name.toLowerCase().includes(q) || r.seller?.username.toLowerCase().includes(q);
      const matchReporter = r.reporter?.name.toLowerCase().includes(q) || r.reporter?.username.toLowerCase().includes(q);
      const matchReason = r.reason.toLowerCase().includes(q);
      if (!matchProduct && !matchSeller && !matchReporter && !matchReason) return false;
    }

    return true;
  });

  // Tampilan loading verifikasi
  if (authLoading || isVerifying) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3 max-w-sm">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
          <h2 className="text-base font-bold text-slate-800">
            Memverifikasi Hak Akses Admin...
          </h2>
          <p className="text-xs text-slate-500">
            Sistem sedang memeriksa status akun dan kebijakan keamanan di server.
          </p>
        </div>
      </div>
    );
  }

  // Tampilan jika BUKAN admin (403 Forbidden Access)
  if (!isServerVerified) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-sm text-center space-y-4">
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-100">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <span className="text-[11px] font-mono uppercase tracking-widest text-rose-600 font-bold">
              403 • Akses Ditolak
            </span>
            <h1 className="text-lg font-extrabold text-slate-900 mt-1">
              Khusus Administrator Nepal Market
            </h1>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              {serverVerifyError || 'Halaman ini dilindungi dan hanya dapat diakses oleh akun dengan peran administrator terverifikasi.'}
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs space-y-1 text-slate-600">
            <p className="font-semibold text-slate-800 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-blue-600" />
              <span>Informasi Akses</span>
            </p>
            <p className="text-[11px]">
              Akun Anda saat ini login sebagai: <strong className="text-slate-900">{profile?.email || profile?.username || user?.email}</strong> dengan role <code className="bg-slate-200 px-1 rounded">{profile?.role || 'user'}</code>.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/"
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-colors inline-flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Beranda</span>
            </Link>
            <Link
              href="/profile"
              className="text-xs text-slate-500 hover:text-slate-800 transition-colors py-1"
            >
              Buka Profil Saya
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // TAMPILAN RESMI PANEL ADMIN
  return (
    <div className="min-h-screen bg-slate-100/70 pb-16 text-slate-900 font-sans">
      {/* Top Admin Navbar */}
      <header className="sticky top-0 z-30 bg-slate-900 text-white border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
              title="Kembali ke Toko Nepal Market"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Nepal Market</span>
            </Link>
            <span className="text-slate-700">/</span>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-rose-600 flex items-center justify-center font-bold text-white shadow-xs">
                <Shield className="w-4 h-4" />
              </div>
              <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-white flex items-center gap-2">
                <span>Panel Moderasi</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-rose-400 border border-slate-700 uppercase font-semibold">
                  Admin
                </span>
              </h1>
            </div>
          </div>

          {/* Admin Info & Actions */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={loadDashboard}
              disabled={isLoadingData}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs text-slate-300 hover:text-white transition-colors flex items-center gap-1.5"
              title="Perbarui Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingData ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Segarkan</span>
            </button>

            <div className="hidden md:flex items-center gap-2 pl-3 border-l border-slate-800 text-xs text-slate-300">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">
                {profile?.name?.charAt(0) || 'A'}
              </div>
              <span className="truncate max-w-[120px]">{profile?.name || 'Administrator'}</span>
            </div>

            <Link
              href="/"
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lihat Marketplace</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Flash Message */}
        {actionSuccessMessage && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-xs font-medium flex items-center justify-between gap-2 shadow-xs animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{actionSuccessMessage}</span>
            </div>
            <button
              onClick={() => setActionSuccessMessage(null)}
              className="text-emerald-700 hover:text-emerald-900"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* METRICS SUMMARY STRIP (Padat & Ringkas, Tidak Memakan Ruang Vertikal) */}
        <section id="admin-summary-grid" className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          <div className="bg-white border border-slate-200 rounded-lg p-3 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Laporan Menunggu</p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl font-bold text-slate-900">{summary.pendingReports}</span>
                {summary.pendingReports > 0 && (
                  <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded">
                    Perlu Ditinjau
                  </span>
                )}
              </div>
            </div>
            <div className="w-8 h-8 rounded-md bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-3 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Iklan Aktif</p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl font-bold text-slate-900">{summary.activeProducts}</span>
                <span className="text-[10px] text-slate-500">Tayang</span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-3 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Barang</p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl font-bold text-slate-900">{summary.totalProducts}</span>
                <span className="text-[10px] text-slate-500">Semua riwayat</span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Package className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-3 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Pengguna</p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl font-bold text-slate-900">{summary.totalUsers}</span>
                <span className="text-[10px] text-slate-500">Akun terdaftar</span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <User className="w-4 h-4" />
            </div>
          </div>
        </section>

        {/* TAB NAVIGATION & TOOLBAR */}
        <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            {/* Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-md self-start">
              <button
                type="button"
                onClick={() => setActiveTab('reports')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer ${
                  activeTab === 'reports'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>Laporan</span>
                {summary.pendingReports > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[10px] font-mono">
                    {summary.pendingReports}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('guidelines')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer ${
                  activeTab === 'guidelines'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>Aturan Terlarang</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('logs')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer ${
                  activeTab === 'logs'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <History className="w-3.5 h-3.5 text-slate-600" />
                <span>Riwayat Audit</span>
              </button>
            </div>

            {/* Filter Status (hanya di tab laporan) */}
            {activeTab === 'reports' && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as FilterReportStatus)}
                  className="bg-slate-50 border border-slate-200 text-xs font-medium rounded-md px-2.5 py-1.5 text-slate-800 focus:outline-hidden focus:border-blue-600 min-h-[36px]"
                >
                  <option value="all">Semua Laporan</option>
                  <option value="pending">Hanya Menunggu (Pending)</option>
                  <option value="resolved">Selesai / Ditinjau</option>
                </select>
              </div>
            )}
          </div>

          {/* Search bar untuk tab laporan */}
          {activeTab === 'reports' && (
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari barang, alasan, nama seller, atau pelapor..."
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-hidden min-h-[38px]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* TAB 1: DAFTAR LAPORAN */}
        {activeTab === 'reports' && (
          <div className="space-y-4">
            {filteredReports.length === 0 ? (
              <div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-900">
                    Tidak ada laporan yang cocok
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {searchQuery
                      ? 'Tidak ditemukan laporan yang sesuai dengan kata kunci pencarian Anda.'
                      : 'Semua produk aman dan tidak ada laporan yang membutuhkan tindakan saat ini.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredReports.map((report) => {
                  const product = report.product;
                  const seller = report.seller;
                  const reporter = report.reporter;
                  const isPending = report.status === 'pending';

                  return (
                    <article
                      key={report.id}
                      className={`bg-white border rounded-lg p-3.5 sm:p-4 transition-colors ${
                        isPending
                          ? 'border-rose-300 shadow-xs'
                          : 'border-slate-200'
                      }`}
                    >
                      {/* Report Meta Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100 text-xs">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded font-semibold text-[10px] inline-flex items-center gap-1 ${
                              isPending
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {isPending ? (
                              <>
                                <AlertTriangle className="w-3 h-3" />
                                <span>Menunggu Tindakan</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Selesai Dimoderasi</span>
                              </>
                            )}
                          </span>

                          <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                            Alasan: {report.reason}
                          </span>

                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(report.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                          </span>
                        </div>

                        {/* Pelapor */}
                        <div className="text-[11px] text-slate-500">
                          Pelapor:{' '}
                          <strong className="text-slate-800">
                            {reporter?.name || 'Pengguna'}
                          </strong>{' '}
                          {reporter?.username && (
                            <span className="text-slate-400 font-mono">@{reporter.username}</span>
                          )}
                        </div>
                      </div>

                      {/* Keterangan Pelapor */}
                      {report.description && (
                        <div className="my-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-md text-xs">
                          <span className="font-semibold text-slate-600 uppercase tracking-wider text-[10px] block mb-0.5">
                            Catatan Pelapor:
                          </span>
                          <p className="text-slate-800 italic leading-relaxed">
                            &quot;{report.description}&quot;
                          </p>
                        </div>
                      )}

                      {/* Detail Produk & Seller Grid */}
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* Kolom 1 & 2: Detail Produk yang Dilaporkan */}
                        <div className="md:col-span-2 flex gap-3 p-3 bg-slate-50 border border-slate-200 rounded-md">
                          {/* Thumbnail */}
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded bg-slate-200 overflow-hidden relative shrink-0">
                            {product?.images?.[0] ? (
                              <Image
                                src={product.images[0]}
                                alt={product.title}
                                fill
                                sizes="80px"
                                className="object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                                No foto
                              </div>
                            )}
                          </div>

                          {/* Info Produk */}
                          <div className="flex-1 min-w-0 space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold uppercase ${
                                  product?.status === 'active'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : product?.status === 'hidden'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                Status: {product?.status || 'Tidak diketahui'}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                ID: {report.product_id.slice(0, 8)}
                              </span>
                            </div>

                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                              {product?.title || 'Produk tidak ditemukan'}
                            </h4>

                            <p className="text-xs font-bold text-blue-600">
                              {product ? formatRupiah(product.price) : '-'}
                            </p>

                            <p className="text-[11px] text-slate-500 line-clamp-1">
                              {product?.description || 'Tidak ada deskripsi.'}
                            </p>

                            {product && (
                              <div className="pt-0.5">
                                <Link
                                  href={`/product/${product.id}`}
                                  target="_blank"
                                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700"
                                >
                                  <span>Buka halaman produk</span>
                                  <ExternalLink className="w-3 h-3" />
                                </Link>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Kolom 3: Identitas Seller Secukupnya */}
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-2 flex flex-col justify-between">
                          <div>
                            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                              Penjual (Seller)
                            </span>
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0 overflow-hidden relative">
                                {seller?.avatar_url ? (
                                  <Image
                                    src={seller.avatar_url}
                                    alt={seller.name}
                                    fill
                                    sizes="28px"
                                    className="object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  seller?.name?.charAt(0) || 'S'
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-slate-900 truncate">
                                  {seller?.name || product?.seller?.name || 'Anonim'}
                                </p>
                                {seller?.username && (
                                  <p className="text-[10px] font-mono text-slate-500 truncate">
                                    @{seller.username}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Status Akun Seller */}
                            <div className="mt-2 pt-1.5 border-t border-slate-200 text-[10px]">
                              {seller?.is_suspended ? (
                                <span className="inline-flex items-center gap-1 text-rose-600 font-semibold">
                                  <UserX className="w-3 h-3" />
                                  <span>Akun Dinonaktifkan</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                                  <UserCheck className="w-3 h-3" />
                                  <span>Akun Aktif</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {seller?.username && (
                            <Link
                              href={`/profile/${seller.username}`}
                              target="_blank"
                              className="text-[11px] text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1"
                            >
                              <span>Lihat profil seller</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          )}
                        </div>
                      </div>

                      {/* MODERATION ACTION BUTTONS */}
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {/* 1. Tombol Sembunyikan Produk */}
                          {product?.status === 'active' && (
                            <button
                              type="button"
                              onClick={() => {
                                setAdminReason(`Disembunyikan karena laporan: ${report.reason}`);
                                setPendingAction({
                                  type: 'hide',
                                  title: 'Sembunyikan Produk',
                                  description: `Iklan "${product.title}" akan diturunkan dari pencarian publik agar dapat ditinjau lebih lanjut.`,
                                  targetId: product.id,
                                  targetTitle: product.title,
                                  reportId: report.id,
                                  confirmButtonText: 'Sembunyikan',
                                  isDestructive: false,
                                });
                              }}
                              className="px-2.5 py-1 rounded-md border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 text-xs font-semibold transition-colors inline-flex items-center gap-1 cursor-pointer min-h-[32px]"
                            >
                              <EyeOff className="w-3.5 h-3.5 text-amber-600" />
                              <span>Sembunyikan</span>
                            </button>
                          )}

                          {/* 2. Tombol Hapus Produk */}
                          {product && product.status !== 'removed' && (
                            <button
                              type="button"
                              onClick={() => {
                                setAdminReason(`Dihapus permanen atas pelanggaran aturan: ${report.reason}`);
                                setPendingAction({
                                  type: 'remove',
                                  title: 'Hapus Produk dari Pasar',
                                  description: `Iklan "${product.title}" akan dihapus permanen dari etalase pasar.`,
                                  targetId: product.id,
                                  targetTitle: product.title,
                                  reportId: report.id,
                                  confirmButtonText: 'Hapus Produk',
                                  isDestructive: true,
                                });
                              }}
                              className="px-2.5 py-1 rounded-md border border-rose-300 bg-rose-50 text-rose-800 hover:bg-rose-100 text-xs font-semibold transition-colors inline-flex items-center gap-1 cursor-pointer min-h-[32px]"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                              <span>Hapus Produk</span>
                            </button>
                          )}

                          {/* 3. Tombol Kembalikan Produk (Restore) */}
                          {product && product.status !== 'active' && (
                            <button
                              type="button"
                              onClick={() => {
                                setAdminReason('Iklan dinyatakan valid dan telah memenuhi panduan pasar');
                                setPendingAction({
                                  type: 'restore',
                                  title: 'Kembalikan Produk ke Pasar',
                                  description: `Iklan "${product.title}" akan diaktifkan kembali sehingga dapat dilihat pembeli.`,
                                  targetId: product.id,
                                  targetTitle: product.title,
                                  reportId: report.id,
                                  confirmButtonText: 'Aktifkan Kembali',
                                  isDestructive: false,
                                });
                              }}
                              className="px-2.5 py-1 rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors inline-flex items-center gap-1 cursor-pointer min-h-[32px]"
                            >
                              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                              <span>Aktifkan Kembali</span>
                            </button>
                          )}

                          {/* 4. Tombol Nonaktifkan Akun Seller jika diperlukan */}
                          {seller && !seller.is_suspended && (
                            <button
                              type="button"
                              onClick={() => {
                                setAdminReason(`Penonaktifan akun atas pelanggaran berat: ${report.reason}`);
                                setPendingAction({
                                  type: 'suspend_user',
                                  title: 'Nonaktifkan Akun Seller',
                                  description: `Akun "${seller.name}" (@${seller.username}) akan dinonaktifkan dari Nepal Market.`,
                                  targetId: seller.id,
                                  targetTitle: seller.name,
                                  confirmButtonText: 'Nonaktifkan Akun',
                                  isDestructive: true,
                                });
                              }}
                              className="px-2.5 py-1 rounded-md border border-slate-300 bg-white text-slate-700 hover:text-rose-700 hover:border-rose-300 text-xs font-medium transition-colors inline-flex items-center gap-1 cursor-pointer min-h-[32px]"
                            >
                              <UserX className="w-3.5 h-3.5 text-rose-600" />
                              <span>Nonaktifkan Seller</span>
                            </button>
                          )}

                          {/* 4B. Pulihkan Akun Seller */}
                          {seller && seller.is_suspended && (
                            <button
                              type="button"
                              onClick={() => {
                                setAdminReason('Sanksi akun dicabut setelah peninjauan komprehensif');
                                setPendingAction({
                                  type: 'unsuspend_user',
                                  title: 'Pulihkan Akun Seller',
                                  description: `Akun "${seller.name}" akan diaktifkan kembali.`,
                                  targetId: seller.id,
                                  targetTitle: seller.name,
                                  confirmButtonText: 'Pulihkan Akun',
                                  isDestructive: false,
                                });
                              }}
                              className="px-2.5 py-1 rounded-md border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-semibold transition-colors inline-flex items-center gap-1 cursor-pointer min-h-[32px]"
                            >
                              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Pulihkan Seller</span>
                            </button>
                          )}
                        </div>

                        {/* 5. Tandai Laporan Selesai */}
                        {isPending && (
                          <button
                            type="button"
                            onClick={() => {
                              setAdminReason('Laporan ditinjau dan dinyatakan selesai tanpa sanksi lanjutan');
                              setPendingAction({
                                type: 'resolve_report',
                                title: 'Tandai Laporan Selesai',
                                description: 'Laporan ini akan ditandai selesai/resolved dan diarsipkan.',
                                targetId: report.id,
                                targetTitle: `Laporan #${report.id.slice(0, 8)}`,
                                confirmButtonText: 'Tandai Selesai',
                                isDestructive: false,
                              });
                            }}
                            className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold transition-colors inline-flex items-center gap-1.5 cursor-pointer min-h-[32px]"
                          >
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Tandai Selesai</span>
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ATURAN PRODUK TERLARANG (Pedoman Pengawasan) */}
        {activeTab === 'guidelines' && (
          <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <div className="flex items-center gap-1.5 text-rose-600 mb-1">
                <AlertOctagon className="w-4 h-4" />
                <h2 className="text-sm font-bold text-slate-900">
                  Pedoman Aturan Produk Terlarang Nepal Market
                </h2>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
                Seluruh barang berikut mutlak dilarang diiklankan ataupun ditransaksikan di lingkungan Nepal Market. Administrator berhak menurunkan barang dan menonaktifkan akun yang melanggar.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {PROHIBITED_ITEMS_GUIDELINES.map((guide, idx) => (
                <div
                  key={guide.id}
                  className="p-3 rounded-md border border-slate-200 bg-slate-50 space-y-1 text-xs"
                >
                  <div className="flex items-center gap-2 text-slate-900 font-bold">
                    <span className="w-4.5 h-4.5 rounded-full bg-rose-100 text-rose-700 font-mono text-[10px] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <h4>{guide.title}</h4>
                  </div>
                  <p className="text-slate-600 pl-6 leading-relaxed text-[11.5px]">
                    {guide.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-900 space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <Info className="w-4 h-4 text-blue-600" />
                <span>Panduan Tindakan Cepat:</span>
              </p>
              <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-blue-800">
                <li>Untuk indikasi awal yang belum terbukti, pilih <strong>Sembunyikan</strong> untuk klarifikasi penjual.</li>
                <li>Untuk barang yang jelas melanggar aturan terlarang, pilih <strong>Hapus Produk</strong>.</li>
                <li>Jika penjual berulang kali melanggar, lakukan <strong>Nonaktifkan Seller</strong>.</li>
              </ul>
            </div>
          </div>
        )}

        {/* TAB 3: RIWAYAT MODERASI SEDERHANA */}
        {activeTab === 'logs' && (
          <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
            <div className="border-b border-slate-100 pb-2.5 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Riwayat Audit Moderasi
                </h3>
                <p className="text-xs text-slate-500">
                  Catatan jejak aksi dan alasan penindakan oleh administrator.
                </p>
              </div>
              <span className="text-xs font-mono text-slate-500">
                {moderationLogs.length} entri
              </span>
            </div>

            {moderationLogs.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400">
                Belum ada riwayat moderasi yang tercatat.
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-md">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="py-2 px-3">Waktu</th>
                      <th className="py-2 px-3">Admin</th>
                      <th className="py-2 px-3">Tindakan</th>
                      <th className="py-2 px-3">Target</th>
                      <th className="py-2 px-3">Alasan Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {moderationLogs.map((log) => {
                      const actionBadge = {
                        hide_product: { text: 'Sembunyikan', color: 'bg-amber-100 text-amber-800' },
                        remove_product: { text: 'Hapus Produk', color: 'bg-rose-100 text-rose-800' },
                        restore_product: { text: 'Kembalikan', color: 'bg-emerald-100 text-emerald-800' },
                        suspend_user: { text: 'Nonaktifkan Akun', color: 'bg-rose-100 text-rose-800' },
                        unsuspend_user: { text: 'Pulihkan Akun', color: 'bg-emerald-100 text-emerald-800' },
                        resolve_report: { text: 'Selesai', color: 'bg-blue-100 text-blue-800' },
                        dismiss_report: { text: 'Ditolak', color: 'bg-slate-100 text-slate-700' },
                      }[log.action] || { text: log.action, color: 'bg-slate-100 text-slate-700' };

                      return (
                        <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap font-mono text-[11px]">
                            {new Date(log.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-slate-800">
                            {log.admin?.name || 'Admin'}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${actionBadge.color}`}>
                              {actionBadge.text}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-800 font-medium max-w-[180px] truncate">
                            {log.target_title || log.target_id.slice(0, 8)}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 max-w-xs leading-relaxed">
                            {log.reason || '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL DIALOG KONFIRMASI TINDAKAN PENTING ADMIN */}
      {pendingAction && (
        <div
          id="admin-action-dialog-portal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => !isExecutingAction && setPendingAction(null)}
        >
          <div
            id="admin-action-dialog-content"
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Dialog */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    pendingAction.isDestructive ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'
                  }`}
                >
                  <AlertOctagon className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  {pendingAction.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => !isExecutingAction && setPendingAction(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body Dialog */}
            <div className="p-5 space-y-3.5 text-xs">
              <p className="text-slate-600 leading-relaxed">
                {pendingAction.description}
              </p>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-0.5">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Target Tindakan:</span>
                <p className="font-bold text-slate-900 text-sm truncate">{pendingAction.targetTitle}</p>
              </div>

              {/* Kotak Konsekuensi yang Jelas */}
              <div
                className={`p-3 rounded-lg border text-xs leading-relaxed ${
                  pendingAction.type === 'remove'
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : pendingAction.type === 'suspend_user'
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : pendingAction.type === 'hide'
                    ? 'bg-amber-50 border-amber-200 text-amber-800'
                    : 'bg-blue-50 border-blue-200 text-blue-800'
                }`}
              >
                <span className="font-bold block mb-0.5 uppercase tracking-wider text-[10px]">
                  Konsekuensi Tindakan:
                </span>
                {pendingAction.type === 'remove' && (
                  <span>Iklan ini akan dihapus permanen dari etalase pasar. Pembeli tidak dapat lagi menemukan atau melihat rincian barang.</span>
                )}
                {pendingAction.type === 'suspend_user' && (
                  <span>Akun penjual akan dinonaktifkan. Penjual tidak dapat memasang iklan baru atau mengedit barang yang ada.</span>
                )}
                {pendingAction.type === 'hide' && (
                  <span>Iklan diturunkan sementara dari pencarian publik untuk peninjauan lebih lanjut, tetapi data barang tetap tersimpan.</span>
                )}
                {pendingAction.type === 'restore' && (
                  <span>Iklan akan kembali aktif dan langsung tayang di katalog pasar Nepal Market.</span>
                )}
                {pendingAction.type === 'unsuspend_user' && (
                  <span>Sanksi dicabut dan penjual kembali dapat menggunakan seluruh fitur pasar secara normal.</span>
                )}
                {pendingAction.type === 'resolve_report' && (
                  <span>Laporan ini akan ditandai selesai/diarsipkan tanpa perubahan pada status barang.</span>
                )}
              </div>

              {actionError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{actionError}</span>
                </div>
              )}

              {/* Kolom Alasan Tindakan Admin (Diwajibkan) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Alasan Tindakan Admin <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={adminReason}
                  onChange={(e) => setAdminReason(e.target.value)}
                  rows={2}
                  placeholder="Tuliskan alasan untuk audit log (contoh: Barang terbukti melanggar aturan)..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-hidden resize-none"
                  autoFocus
                />
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Alasan ini akan tercatat permanen di riwayat audit.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPendingAction(null)}
                  disabled={isExecutingAction}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md min-h-[36px] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleExecuteAction}
                  disabled={isExecutingAction}
                  className={`px-4 py-1.5 text-white text-xs font-semibold rounded-md min-h-[36px] flex items-center gap-1.5 disabled:opacity-60 transition-colors cursor-pointer ${
                    pendingAction.isDestructive
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isExecutingAction && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{pendingAction.confirmButtonText}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
