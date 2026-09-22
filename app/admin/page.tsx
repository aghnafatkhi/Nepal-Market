'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import {
  AdminReportItem,
  AdminUserItem,
  AdminProductItem,
  fetchAdminDashboardData,
  adminHideProduct,
  adminRemoveProduct,
  adminRestoreProduct,
  adminToggleSellerSuspension,
  adminUpdateReportStatus,
  PROHIBITED_ITEMS_GUIDELINES,
} from '@/lib/supabase/moderation';
import {
  DbModerationLog,
  DbReportStatus,
  DbSponsorBanner,
  DbSponsorBannerStatus,
} from '@/lib/supabase/types';
import {
  fetchAdminSponsorBanners,
  createSponsorBanner,
  updateSponsorBanner,
  toggleSponsorBannerStatus,
  deleteSponsorBanner,
  getSponsorScheduleStatus,
  CreateSponsorBannerInput,
} from '@/lib/supabase/sponsors';
import { SponsorFormModal } from '@/components/admin/SponsorFormModal';
import { SponsorPreviewModal } from '@/components/admin/SponsorPreviewModal';
import { AdminToast, ToastMessage } from '@/components/admin/AdminToast';
import { AdminDashboardOverview } from '@/components/admin/AdminDashboardOverview';
import {
  AdminDashboardRealStats,
  fetchAdminDashboardStats,
} from '@/lib/supabase/adminStats';
import { formatRupiah } from '@/lib/utils';
import {
  AdminSidebar,
  AdminTab,
} from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminStatCard } from '@/components/admin/AdminStatCard';
import { AdminStatusBadge } from '@/components/admin/AdminStatusBadge';
import { AdminTable } from '@/components/admin/AdminTable';
import { AdminEmptyState } from '@/components/admin/AdminEmptyState';
import { AdminLoading } from '@/components/admin/AdminLoading';
import {
  AdminConfirmDialog,
  PendingAdminAction,
} from '@/components/admin/AdminConfirmDialog';
import { AdminProductDetailModal } from '@/components/admin/AdminProductDetailModal';
import { AdminUserDetailModal } from '@/components/admin/AdminUserDetailModal';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { CATEGORIES } from '@/data/products';
import {
  AlertTriangle,
  CheckCircle2,
  Package,
  Users,
  Megaphone,
  History,
  ShieldAlert,
  ArrowLeft,
  Info,
  Search,
  X,
  ExternalLink,
  EyeOff,
  Trash2,
  RotateCcw,
  UserX,
  UserCheck,
  Check,
  Clock,
  AlertOctagon,
  Calendar,
  Globe,
  FileText,
  Filter,
  Plus,
  Pencil,
  Eye,
  Power,
  SlidersHorizontal,
} from 'lucide-react';

type FilterReportStatus = 'all' | 'pending' | 'reviewed' | 'resolved';
type FilterProductStatus = 'all' | 'active' | 'hidden' | 'removed';
type FilterUserStatus = 'all' | 'active' | 'suspended' | 'admin';

export default function AdminDashboardPage() {
  const { user, session, profile, isLoading: authLoading } = useAuth();

  // State Verifikasi Hak Akses
  const [isVerifying, setIsVerifying] = useState<boolean>(true);
  const [isServerVerified, setIsServerVerified] = useState<boolean>(false);
  const [serverVerifyError, setServerVerifyError] = useState<string | null>(null);

  // State Navigasi
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // State Data Dashboard
  const [dashboardStats, setDashboardStats] = useState<AdminDashboardRealStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState<boolean>(true);
  const [isRefreshingStats, setIsRefreshingStats] = useState<boolean>(false);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [summary, setSummary] = useState({
    totalProducts: 0,
    totalUsers: 0,
    pendingReports: 0,
    activeProducts: 0,
  });
  const [reports, setReports] = useState<AdminReportItem[]>([]);
  const [moderationLogs, setModerationLogs] = useState<DbModerationLog[]>([]);
  const [products, setProducts] = useState<AdminProductItem[]>([]);
  const [users, setUsers] = useState<AdminUserItem[]>([]);

  // State Filter & Pencarian
  const [reportStatusFilter, setReportStatusFilter] = useState<FilterReportStatus>('all');
  const [reportSearchQuery, setReportSearchQuery] = useState<string>('');
  const [productStatusFilter, setProductStatusFilter] = useState<FilterProductStatus>('all');
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('all');
  const [productSearchQuery, setProductSearchQuery] = useState<string>('');
  const [userStatusFilter, setUserStatusFilter] = useState<FilterUserStatus>('all');
  const [userSearchQuery, setUserSearchQuery] = useState<string>('');
  const [logActionFilter, setLogActionFilter] = useState<string>('all');
  const [logSearchQuery, setLogSearchQuery] = useState<string>('');

  // State Pagination Produk, Pengguna, Laporan & Log Moderasi
  const [productPage, setProductPage] = useState<number>(1);
  const [productsPerPage, setProductsPerPage] = useState<number>(10);
  const [userPage, setUserPage] = useState<number>(1);
  const [usersPerPage, setUsersPerPage] = useState<number>(10);
  const [reportPage, setReportPage] = useState<number>(1);
  const [reportsPerPage, setReportsPerPage] = useState<number>(10);
  const [logPage, setLogPage] = useState<number>(1);
  const [logsPerPage, setLogsPerPage] = useState<number>(15);

  // State Modal Detail Produk & Pengguna
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<AdminProductItem | null>(null);
  const [isProductDetailOpen, setIsProductDetailOpen] = useState<boolean>(false);
  const [selectedUserForDetail, setSelectedUserForDetail] = useState<AdminUserItem | null>(null);
  const [isUserDetailOpen, setIsUserDetailOpen] = useState<boolean>(false);

  // State Dialog Konfirmasi Tindakan Moderasi
  const [pendingAction, setPendingAction] = useState<PendingAdminAction | null>(null);
  const [adminReason, setAdminReason] = useState<string>('');
  const [isExecutingAction, setIsExecutingAction] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // State Manajemen Sponsor Banners
  const [sponsorBanners, setSponsorBanners] = useState<DbSponsorBanner[]>([]);
  const [isLoadingSponsors, setIsLoadingSponsors] = useState<boolean>(true);
  const [sponsorStatusFilter, setSponsorStatusFilter] = useState<'all' | 'active' | 'inactive' | 'draft'>('all');
  const [sponsorSearchQuery, setSponsorSearchQuery] = useState<string>('');
  const [isSponsorFormOpen, setIsSponsorFormOpen] = useState<boolean>(false);
  const [sponsorToEdit, setSponsorToEdit] = useState<DbSponsorBanner | null>(null);
  const [previewSponsor, setPreviewSponsor] = useState<DbSponsorBanner | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Toast Helper
  const addToast = (type: 'success' | 'error' | 'info', title: string, message?: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Verifikasi Hak Admin di Server
  const verifyAdminAccess = useCallback(async () => {
    setIsVerifying(true);
    setServerVerifyError(null);

    try {
      if (!user) {
        setIsServerVerified(false);
        setServerVerifyError('Sesi login tidak ditemukan. Harap masuk terlebih dahulu.');
        setIsVerifying(false);
        return;
      }

      if (profile && profile.role !== 'admin') {
        setIsServerVerified(false);
        setServerVerifyError('Akses ditolak: Akun Anda tidak memiliki peran administrator.');
        setIsVerifying(false);
        return;
      }

      const token = session?.access_token;
      if (!token) {
        if (profile?.role === 'admin') {
          setIsServerVerified(true);
          setIsVerifying(false);
          return;
        }
        setIsServerVerified(false);
        setServerVerifyError('Token otentikasi tidak valid.');
        setIsVerifying(false);
        return;
      }

      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();

      if (res.ok && data.isAdmin) {
        setIsServerVerified(true);
      } else {
        if (profile?.role === 'admin') {
          setIsServerVerified(true);
        } else {
          setIsServerVerified(false);
          setServerVerifyError(data.error || 'Akses ditolak: Akun bukan administrator.');
        }
      }
    } catch {
      if (profile?.role === 'admin') {
        setIsServerVerified(true);
      } else {
        setIsServerVerified(false);
        setServerVerifyError('Gagal memverifikasi hak akses ke server.');
      }
    } finally {
      setIsVerifying(false);
    }
  }, [user, session, profile]);

  useEffect(() => {
    if (!authLoading) {
      verifyAdminAccess();
    }
  }, [authLoading, verifyAdminAccess]);

  // Memuat Data Dashboard
  const loadDashboard = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const data = await fetchAdminDashboardData();
      setSummary(data.summary);
      setReports(data.reports);
      setModerationLogs(data.logs);
      setProducts(data.products || []);
      setUsers(data.users || []);
    } catch (err) {
      console.error('Gagal mengambil data admin dashboard:', err);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  // Memuat Data Sponsor dari Supabase
  const loadSponsors = useCallback(async () => {
    setIsLoadingSponsors(true);
    try {
      const res = await fetchAdminSponsorBanners();
      if (res.data) {
        setSponsorBanners(res.data);
      }
    } catch (err) {
      console.error('Gagal memuat sponsor banners:', err);
    } finally {
      setIsLoadingSponsors(false);
    }
  }, []);

  // Memuat Statistik Dashboard Real-time dari Supabase
  const loadRealDashboardStats = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshingStats(true);
    } else {
      setIsLoadingStats(true);
    }

    try {
      const statsData = await fetchAdminDashboardStats();
      setDashboardStats(statsData);
      // Sinkronkan ke summary agar badge sidebar dan tab lain selalu sinkron
      setSummary((prev) => ({
        ...prev,
        totalUsers: statsData.totalUsers,
        totalProducts: statsData.totalProducts,
        activeProducts: statsData.activeProducts,
        pendingReports: statsData.pendingReports,
      }));
    } catch (err) {
      console.error('Gagal mengambil statistik admin Supabase:', err);
    } finally {
      setIsLoadingStats(false);
      setIsRefreshingStats(false);
    }
  }, []);

  // Segarkan seluruh data dashboard admin secara paralel
  const handleRefreshDashboard = useCallback(async () => {
    await Promise.allSettled([
      loadRealDashboardStats(true),
      loadDashboard(),
      loadSponsors(),
    ]);
  }, [loadRealDashboardStats, loadDashboard, loadSponsors]);

  useEffect(() => {
    if (isServerVerified) {
      loadRealDashboardStats();
      loadDashboard();
      loadSponsors();
    }
  }, [isServerVerified, loadRealDashboardStats, loadDashboard, loadSponsors]);

  // Eksekusi Tindakan Admin yang telah dikonfirmasi
  const handleExecuteAction = async () => {
    if (!pendingAction) return;
    if (pendingAction.requireReason !== false && !adminReason.trim()) {
      setActionError('Alasan tindakan wajib diisi untuk catatan riwayat audit moderasi.');
      return;
    }

    // Larangan keamanan mutlak: Admin tidak boleh menangguhkan dirinya sendiri
    if (
      pendingAction.type === 'suspend_user' &&
      (pendingAction.targetId === user?.id || pendingAction.targetId === profile?.id)
    ) {
      setActionError('Tindakan ditolak: Administrator tidak diperbolehkan menangguhkan akun sendiri.');
      return;
    }

    setIsExecutingAction(true);
    setActionError(null);

    // Prioritas Keamanan: Eksekusi melalui Server Endpoint dengan token admin
    if (session?.access_token && pendingAction.type !== 'delete_sponsor') {
      try {
        const actionTypeMap: Record<string, string> = {
          hide: 'hide_product',
          restore: 'restore_product',
          remove: 'remove_product',
          suspend_user: 'suspend_user',
          unsuspend_user: 'unsuspend_user',
          resolve_report: 'resolve_report',
          review_report: 'review_report',
        };
        const serverAction = actionTypeMap[pendingAction.type];
        if (serverAction) {
          const res = await fetch('/api/admin/action', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              action: serverAction,
              targetId: pendingAction.targetId,
              targetTitle: pendingAction.targetTitle,
              reason: adminReason.trim(),
              reportId: pendingAction.reportId,
            }),
          });
          const json = await res.json();
          if (res.ok && json.success) {
            setActionSuccessMessage(json.message);
            addToast('success', 'Aksi Moderasi Berhasil', json.message);
            setPendingAction(null);
            setAdminReason('');
            loadDashboard();
            loadRealDashboardStats(true);
            setIsExecutingAction(false);
            return;
          } else if (!res.ok) {
            setActionError(json.error || 'Gagal memproses aksi moderasi di server.');
            setIsExecutingAction(false);
            return;
          }
        }
      } catch (srvErr) {
        console.warn('Fallback ke klien moderasi:', srvErr);
      }
    }

    const adminId = profile?.id || user?.id || 'admin-system';
    let result: { success: boolean; error: Error | null } = { success: false, error: null };

    try {
      switch (pendingAction.type) {
        case 'delete_sponsor': {
          const deleteRes = await deleteSponsorBanner(pendingAction.targetId);
          if (deleteRes.success) {
            setActionSuccessMessage(`Banner sponsor "${pendingAction.targetTitle}" berhasil dihapus.`);
            addToast('success', 'Sponsor Dihapus', `Banner "${pendingAction.targetTitle}" telah dihapus.`);
            await loadSponsors();
            result = { success: true, error: null };
          } else {
            result = { success: false, error: deleteRes.error };
          }
          break;
        }

        case 'hide':
          result = await adminHideProduct(
            adminId,
            pendingAction.targetId,
            pendingAction.targetTitle,
            adminReason.trim()
          );
          if (result.success) {
            setActionSuccessMessage(`Produk "${pendingAction.targetTitle}" berhasil disembunyikan.`);
            if (pendingAction.reportId) {
              await adminUpdateReportStatus(adminId, pendingAction.reportId, 'resolved', adminReason.trim());
            }
          }
          break;

        case 'remove':
          result = await adminRemoveProduct(
            adminId,
            pendingAction.targetId,
            pendingAction.targetTitle,
            adminReason.trim()
          );
          if (result.success) {
            setActionSuccessMessage(`Produk "${pendingAction.targetTitle}" telah dihapus.`);
            if (pendingAction.reportId) {
              await adminUpdateReportStatus(adminId, pendingAction.reportId, 'resolved', adminReason.trim());
            }
          }
          break;

        case 'restore':
          result = await adminRestoreProduct(
            adminId,
            pendingAction.targetId,
            pendingAction.targetTitle,
            adminReason.trim()
          );
          if (result.success) {
            setActionSuccessMessage(`Produk "${pendingAction.targetTitle}" telah diaktifkan kembali.`);
          }
          break;

        case 'suspend_user':
          result = await adminToggleSellerSuspension(
            adminId,
            pendingAction.targetId,
            pendingAction.targetTitle,
            true,
            adminReason.trim()
          );
          if (result.success) {
            setActionSuccessMessage(`Akun "${pendingAction.targetTitle}" telah dinonaktifkan.`);
          }
          break;

        case 'unsuspend_user':
          result = await adminToggleSellerSuspension(
            adminId,
            pendingAction.targetId,
            pendingAction.targetTitle,
            false,
            adminReason.trim()
          );
          if (result.success) {
            setActionSuccessMessage(`Akun "${pendingAction.targetTitle}" telah dipulihkan.`);
          }
          break;

        case 'resolve_report':
          result = await adminUpdateReportStatus(
            adminId,
            pendingAction.targetId,
            'resolved',
            adminReason.trim()
          );
          if (result.success) {
            setActionSuccessMessage('Laporan telah ditandai selesai dan diarsipkan.');
          }
          break;

        case 'review_report':
          result = await adminUpdateReportStatus(
            adminId,
            pendingAction.targetId,
            'reviewed',
            adminReason.trim()
          );
          if (result.success) {
            setActionSuccessMessage('Status laporan telah diperbarui menjadi "Ditinjau".');
          }
          break;
      }

      if (result.error) {
        setActionError(result.error.message || 'Terjadi kesalahan saat memproses tindakan.');
      } else {
        setPendingAction(null);
        setAdminReason('');
        loadDashboard();
        loadRealDashboardStats(true);
      }
    } catch (err: unknown) {
      const error = err as Error;
      setActionError(error.message || 'Gagal memproses aksi moderasi.');
    } finally {
      setIsExecutingAction(false);
    }
  };

  // Simpan Sponsor (Tambah / Edit)
  const handleSaveSponsor = async (payload: CreateSponsorBannerInput, id?: string): Promise<boolean> => {
    try {
      if (id) {
        const res = await updateSponsorBanner(id, payload);
        if (res.error || !res.data) {
          addToast('error', 'Gagal Memperbarui Sponsor', res.error?.message || 'Terjadi kesalahan.');
          return false;
        }
        addToast('success', 'Sponsor Diperbarui', `Banner "${payload.sponsor_name}" berhasil diperbarui.`);
      } else {
        const res = await createSponsorBanner(payload);
        if (res.error || !res.data) {
          addToast('error', 'Gagal Menambah Sponsor', res.error?.message || 'Terjadi kesalahan.');
          return false;
        }
        addToast('success', 'Sponsor Ditambahkan', `Banner "${payload.sponsor_name}" berhasil disimpan.`);
      }
      await loadSponsors();
      return true;
    } catch (err: unknown) {
      addToast('error', 'Kesalahan Sistem', (err as Error).message);
      return false;
    }
  };

  // Toggle Cepat Status Aktif/Nonaktif Sponsor
  const handleToggleSponsorStatus = async (banner: DbSponsorBanner) => {
    const newStatus: DbSponsorBannerStatus = banner.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await toggleSponsorBannerStatus(banner.id, newStatus);
      if (res.success) {
        addToast(
          'success',
          'Status Diperbarui',
          `Banner "${banner.sponsor_name}" sekarang berstatus ${newStatus === 'active' ? 'Aktif' : 'Nonaktif'}.`
        );
        await loadSponsors();
      } else {
        addToast('error', 'Gagal Mengubah Status', res.error?.message || 'Terjadi kesalahan.');
      }
    } catch (err: unknown) {
      addToast('error', 'Gagal Mengubah Status', (err as Error).message);
    }
  };

  // Konfirmasi Hapus Sponsor
  const handleRequestDeleteSponsor = (banner: DbSponsorBanner) => {
    setPendingAction({
      type: 'delete_sponsor',
      title: 'Hapus Banner Sponsor',
      description: `Apakah Anda yakin ingin menghapus banner sponsor "${banner.sponsor_name}"? File gambar di Storage juga akan dibersihkan.`,
      targetId: banner.id,
      targetTitle: banner.sponsor_name,
      confirmButtonText: 'Hapus Sponsor Permanen',
      isDestructive: true,
      requireReason: false,
    });
    setAdminReason('');
    setActionError(null);
  };

  // Filter Data Sponsor
  const filteredSponsorBanners = useMemo(() => {
    return sponsorBanners.filter((b) => {
      const matchesSearch =
        !sponsorSearchQuery ||
        b.sponsor_name.toLowerCase().includes(sponsorSearchQuery.toLowerCase()) ||
        b.alt_text.toLowerCase().includes(sponsorSearchQuery.toLowerCase()) ||
        b.target_url.toLowerCase().includes(sponsorSearchQuery.toLowerCase());

      const matchesStatus =
        sponsorStatusFilter === 'all' || b.status === sponsorStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [sponsorBanners, sponsorSearchQuery, sponsorStatusFilter]);

  const liveSponsorsCount = useMemo(() => {
    return sponsorBanners.filter((b) => getSponsorScheduleStatus(b) === 'live').length;
  }, [sponsorBanners]);

  // Filter Data Laporan
  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      if (reportStatusFilter !== 'all' && report.status !== reportStatusFilter) return false;

      if (reportSearchQuery.trim()) {
        const q = reportSearchQuery.toLowerCase();
        const matchProduct = report.product?.title?.toLowerCase().includes(q);
        const matchSeller = report.seller?.name?.toLowerCase().includes(q) || report.seller?.username?.toLowerCase().includes(q);
        const matchReporter = report.reporter?.name?.toLowerCase().includes(q) || report.reporter?.username?.toLowerCase().includes(q);
        const matchReason = report.reason?.toLowerCase().includes(q) || report.description?.toLowerCase().includes(q);
        if (!matchProduct && !matchSeller && !matchReporter && !matchReason) return false;
      }

      return true;
    });
  }, [reports, reportStatusFilter, reportSearchQuery]);

  // Pagination Slice Laporan
  const paginatedReports = useMemo(() => {
    const start = (reportPage - 1) * reportsPerPage;
    return filteredReports.slice(start, start + reportsPerPage);
  }, [filteredReports, reportPage, reportsPerPage]);

  // Reset Halaman saat Filter Berubah
  useEffect(() => {
    setProductPage(1);
  }, [productStatusFilter, productCategoryFilter, productSearchQuery]);

  useEffect(() => {
    setUserPage(1);
  }, [userStatusFilter, userSearchQuery]);

  useEffect(() => {
    setReportPage(1);
  }, [reportStatusFilter, reportSearchQuery]);

  useEffect(() => {
    setLogPage(1);
  }, [logActionFilter, logSearchQuery]);

  // Filter Data Produk
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      if (productStatusFilter !== 'all' && prod.status !== productStatusFilter) return false;
      if (productCategoryFilter !== 'all' && prod.category.toLowerCase() !== productCategoryFilter.toLowerCase()) return false;
      if (productSearchQuery.trim()) {
        const q = productSearchQuery.toLowerCase();
        const matchTitle = prod.title.toLowerCase().includes(q);
        const matchSeller = prod.seller?.name.toLowerCase().includes(q) || prod.seller?.username.toLowerCase().includes(q);
        const matchCategory = prod.category.toLowerCase().includes(q);
        if (!matchTitle && !matchSeller && !matchCategory) return false;
      }
      return true;
    });
  }, [products, productStatusFilter, productCategoryFilter, productSearchQuery]);

  // Pagination Slice Produk
  const paginatedProducts = useMemo(() => {
    const start = (productPage - 1) * productsPerPage;
    return filteredProducts.slice(start, start + productsPerPage);
  }, [filteredProducts, productPage, productsPerPage]);

  // Mapping Produk per Penjual untuk Riwayat Pengguna
  const userProductsMap = useMemo(() => {
    const map: Record<string, AdminProductItem[]> = {};
    for (const prod of products) {
      if (prod.seller_id) {
        if (!map[prod.seller_id]) map[prod.seller_id] = [];
        map[prod.seller_id].push(prod);
      }
    }
    return map;
  }, [products]);

  // Filter Data Pengguna
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (userStatusFilter === 'suspended' && !u.is_suspended) return false;
      if (userStatusFilter === 'active' && u.is_suspended) return false;
      if (userStatusFilter === 'admin' && u.role !== 'admin') return false;

      if (userSearchQuery.trim()) {
        const q = userSearchQuery.toLowerCase();
        const matchName = u.name.toLowerCase().includes(q);
        const matchUsername = u.username.toLowerCase().includes(q);
        if (!matchName && !matchUsername) return false;
      }
      return true;
    });
  }, [users, userStatusFilter, userSearchQuery]);

  // Pagination Slice Pengguna
  const paginatedUsers = useMemo(() => {
    const start = (userPage - 1) * usersPerPage;
    return filteredUsers.slice(start, start + usersPerPage);
  }, [filteredUsers, userPage, usersPerPage]);

  // Filter Data Log Moderasi
  const filteredLogs = useMemo(() => {
    return moderationLogs.filter((log) => {
      if (logActionFilter !== 'all' && log.action !== logActionFilter) return false;
      if (logSearchQuery.trim()) {
        const q = logSearchQuery.toLowerCase();
        const matchAction = log.action.toLowerCase().includes(q);
        const matchTarget = log.target_title?.toLowerCase().includes(q) || log.target_id.toLowerCase().includes(q);
        const matchReason = log.reason?.toLowerCase().includes(q);
        const matchAdmin = log.admin?.name?.toLowerCase().includes(q);
        if (!matchAction && !matchTarget && !matchReason && !matchAdmin) return false;
      }
      return true;
    });
  }, [moderationLogs, logActionFilter, logSearchQuery]);

  // Pagination Slice Log Moderasi
  const paginatedLogs = useMemo(() => {
    const start = (logPage - 1) * logsPerPage;
    return filteredLogs.slice(start, start + logsPerPage);
  }, [filteredLogs, logPage, logsPerPage]);

  // Hitung jumlah sponsor aktif dari data Supabase
  const activeSponsorsCount = useMemo(() => {
    return sponsorBanners.filter((b) => getSponsorScheduleStatus(b) === 'live').length;
  }, [sponsorBanners]);

  // Tampilan Loading Verifikasi
  if (authLoading || isVerifying) {
    return (
      <AdminLoading
        fullscreen
        message="Memverifikasi Akses Administrator..."
        submessage="Sistem sedang memeriksa status akun dan kebijakan otorisasi."
      />
    );
  }

  // Tampilan Akses Ditolak (403 Forbidden)
  if (!isServerVerified) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-sm text-center space-y-4">
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-100">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <span className="text-[11px] font-mono uppercase tracking-widest text-rose-600 font-bold">
              403 • Akses Ditolak
            </span>
            <h1 className="text-lg font-bold text-slate-900 mt-1">
              Khusus Administrator Nepal Market
            </h1>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              {serverVerifyError || 'Halaman ini dilindungi dan hanya dapat diakses oleh akun dengan peran administrator.'}
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs space-y-1 text-slate-600">
            <p className="font-semibold text-slate-800 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-blue-600" />
              <span>Informasi Sesi Login</span>
            </p>
            <p className="text-[11px]">
              Akun: <strong className="text-slate-900">{profile?.email || profile?.username || user?.email || 'Tamu'}</strong>
            </p>
            <p className="text-[11px]">
              Role saat ini: <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">{profile?.role || 'user'}</code>
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

  // PANEL ADMIN RESMI
  return (
    <div className="min-h-screen bg-slate-100 flex text-slate-900 font-sans">
      {/* 1. Reusable Sidebar */}
      <AdminSidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        pendingReportsCount={summary.pendingReports}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        adminName={profile?.name || 'Administrator'}
        adminEmail={profile?.email || user?.email || undefined}
      />

      {/* 2. Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Reusable Header */}
        <AdminHeader
          activeTab={activeTab}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onRefresh={() => {
            loadDashboard();
            loadSponsors();
          }}
          isLoading={isLoadingData || isLoadingSponsors}
        />

        {/* Dynamic Main Body */}
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6">
          {/* Flash Alert Banner */}
          {actionSuccessMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-medium flex items-center justify-between gap-2 shadow-2xs animate-in fade-in duration-150">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{actionSuccessMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setActionSuccessMessage(null)}
                className="text-emerald-700 hover:text-emerald-900 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 1: DASHBOARD */}
          {/* ========================================================= */}
          {activeTab === 'dashboard' && (
            <AdminDashboardOverview
              stats={dashboardStats}
              isLoading={isLoadingStats}
              isRefreshing={isRefreshingStats}
              onRefresh={handleRefreshDashboard}
              onNavigateTab={setActiveTab}
            />
          )}

          {/* ========================================================= */}
          {/* TAB 2: SPONSOR */}
          {/* ========================================================= */}
          {activeTab === 'sponsor' && (
            <div className="space-y-5">
              {/* Header & Metric Bar */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="space-y-1">
                    <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                        <Megaphone className="w-4 h-4" />
                      </div>
                      <span>Manajemen Banner Sponsor Nepal Market</span>
                    </h2>
                    <p className="text-xs text-slate-500">
                      Kelola slot banner promosi beranda yang terhubung dengan tabel <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px] text-slate-700">sponsor_banners</code> dan bucket <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px] text-slate-700">sponsor-banners</code>.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSponsorToEdit(null);
                      setIsSponsorFormOpen(true);
                    }}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Sponsor</span>
                  </button>
                </div>

                {/* Status Summary Pills */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-slate-500">Total:</span>
                    <span className="font-bold text-slate-900 font-mono">{sponsorBanners.length}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="font-medium">Sedang Tayang:</span>
                    <span className="font-bold font-mono">{liveSponsorsCount}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-50 border border-sky-200 text-sky-800">
                    <span className="font-medium">Draft:</span>
                    <span className="font-bold font-mono">{sponsorBanners.filter((b) => b.status === 'draft').length}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-300 text-slate-700">
                    <span className="font-medium">Nonaktif:</span>
                    <span className="font-bold font-mono">{sponsorBanners.filter((b) => b.status === 'inactive').length}</span>
                  </div>
                </div>
              </div>

              {/* Filter & Toolbar */}
              <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="text-xs font-semibold text-slate-700">Status:</span>
                    <select
                      value={sponsorStatusFilter}
                      onChange={(e) => setSponsorStatusFilter(e.target.value as 'all' | 'active' | 'inactive' | 'draft')}
                      className="bg-slate-50 border border-slate-200 text-xs font-medium rounded-lg px-3 py-1.5 text-slate-800 focus:outline-hidden focus:border-blue-600 min-h-[36px]"
                    >
                      <option value="all">Semua Status</option>
                      <option value="active">Hanya Aktif</option>
                      <option value="draft">Hanya Draft</option>
                      <option value="inactive">Hanya Nonaktif</option>
                    </select>
                  </div>

                  <div className="relative flex-1 sm:max-w-xs">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={sponsorSearchQuery}
                      onChange={(e) => setSponsorSearchQuery(e.target.value)}
                      placeholder="Cari nama, URL, atau alt text..."
                      className="w-full text-xs pl-8 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-600 focus:bg-white min-h-[36px]"
                    />
                    {sponsorSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setSponsorSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        aria-label="Hapus kata kunci pencarian"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Data Display */}
              {isLoadingSponsors ? (
                <div className="bg-white border border-slate-200 rounded-xl p-8">
                  <AdminLoading message="Memuat daftar sponsor dari database..." />
                </div>
              ) : filteredSponsorBanners.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-8">
                  <AdminEmptyState
                    icon={<Megaphone className="w-8 h-8 text-slate-400" />}
                    title="Tidak Ada Banner Sponsor"
                    description={
                      sponsorSearchQuery || sponsorStatusFilter !== 'all'
                        ? 'Tidak ada data banner sponsor yang sesuai dengan kriteria filter saat ini.'
                        : 'Belum ada banner sponsor yang terdaftar. Tambahkan sponsor pertama untuk ditampilkan di carousel beranda.'
                    }
                    actionText="Tambah Sponsor Baru"
                    onAction={() => {
                      setSponsorToEdit(null);
                      setIsSponsorFormOpen(true);
                    }}
                  />
                </div>
              ) : (
                <>
                  {/* DESKTOP TABLE VIEW */}
                  <div className="hidden md:block">
                    <AdminTable<DbSponsorBanner>
                      columns={[
                        {
                          header: 'Urutan',
                          className: 'w-16 text-center',
                          render: (banner) => (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-slate-100 border border-slate-200 font-mono text-xs font-bold text-slate-700">
                              #{banner.sort_order}
                            </span>
                          ),
                        },
                        {
                          header: 'Banner & Sponsor',
                          render: (banner) => (
                            <div className="flex items-center gap-3">
                              <div
                                onClick={() => setPreviewSponsor(banner)}
                                className="relative w-28 aspect-[5/1] bg-slate-100 rounded border border-slate-300 overflow-hidden shrink-0 cursor-pointer group shadow-2xs"
                                title="Klik untuk pratinjau"
                              >
                                <Image
                                  src={banner.desktop_image_url}
                                  alt={banner.alt_text || banner.sponsor_name}
                                  fill
                                  sizes="120px"
                                  className="object-cover group-hover:scale-105 transition-transform"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                  <Eye className="w-3.5 h-3.5" />
                                </div>
                              </div>

                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 text-xs truncate max-w-xs">
                                  {banner.sponsor_name}
                                </p>
                                <p className="text-[11px] text-slate-500 truncate max-w-xs mt-0.5">
                                  Alt: {banner.alt_text}
                                </p>
                              </div>
                            </div>
                          ),
                        },
                        {
                          header: 'URL Tujuan',
                          render: (banner) => (
                            <a
                              href={banner.target_url}
                              target="_blank"
                              rel="noopener noreferrer sponsored"
                              className="text-blue-600 hover:text-blue-700 font-mono text-xs inline-flex items-center gap-1 max-w-[200px] truncate underline"
                              title={banner.target_url}
                            >
                              <span className="truncate">{banner.target_url}</span>
                              <ExternalLink className="w-3 h-3 shrink-0" />
                            </a>
                          ),
                        },
                        {
                          header: 'Status & Tayang',
                          render: (banner) => {
                            const schedule = getSponsorScheduleStatus(banner);
                            return (
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5">
                                  <AdminStatusBadge
                                    status={banner.status}
                                    label={
                                      banner.status === 'active'
                                        ? 'Aktif'
                                        : banner.status === 'draft'
                                        ? 'Draft'
                                        : 'Nonaktif'
                                    }
                                  />
                                  <AdminStatusBadge
                                    status={schedule}
                                    label={
                                      schedule === 'live'
                                        ? 'Sedang Tayang'
                                        : schedule === 'scheduled'
                                        ? 'Terjadwal'
                                        : schedule === 'ended'
                                        ? 'Berakhir'
                                        : schedule === 'draft'
                                        ? 'Draft'
                                        : 'Nonaktif'
                                    }
                                  />
                                </div>
                                <p className="text-[10px] text-slate-400 font-mono">
                                  {banner.starts_at ? new Date(banner.starts_at).toLocaleDateString('id-ID') : 'Mulai langsung'}
                                  {' s/d '}
                                  {banner.ends_at ? new Date(banner.ends_at).toLocaleDateString('id-ID') : 'Selamanya'}
                                </p>
                              </div>
                            );
                          },
                        },
                        {
                          header: 'Aksi',
                          className: 'w-48 text-right',
                          render: (banner) => (
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Toggle Active/Inactive */}
                              <button
                                type="button"
                                onClick={() => handleToggleSponsorStatus(banner)}
                                className={`px-2 py-1 rounded text-[11px] font-medium border transition-colors cursor-pointer inline-flex items-center gap-1 ${
                                  banner.status === 'active'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                }`}
                                title={banner.status === 'active' ? 'Nonaktifkan penayangan' : 'Aktifkan penayangan'}
                              >
                                <Power className="w-3 h-3" />
                                <span>{banner.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}</span>
                              </button>

                              {/* Preview */}
                              <button
                                type="button"
                                onClick={() => setPreviewSponsor(banner)}
                                className="p-1.5 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                                title="Lihat pratinjau desktop & mobile"
                                aria-label="Lihat pratinjau"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {/* Edit */}
                              <button
                                type="button"
                                onClick={() => {
                                  setSponsorToEdit(banner);
                                  setIsSponsorFormOpen(true);
                                }}
                                className="p-1.5 rounded text-blue-600 hover:text-blue-800 hover:bg-blue-50 border border-blue-200 transition-colors cursor-pointer"
                                title="Edit sponsor"
                                aria-label="Edit sponsor"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete */}
                              <button
                                type="button"
                                onClick={() => handleRequestDeleteSponsor(banner)}
                                className="p-1.5 rounded text-rose-600 hover:text-rose-800 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                                title="Hapus sponsor"
                                aria-label="Hapus sponsor"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ),
                        },
                      ]}
                      data={filteredSponsorBanners}
                      keyExtractor={(item) => item.id}
                    />
                  </div>

                  {/* MOBILE CARDS VIEW */}
                  <div className="block md:hidden space-y-3">
                    {filteredSponsorBanners.map((banner) => {
                      const schedule = getSponsorScheduleStatus(banner);

                      return (
                        <div
                          key={banner.id}
                          className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3"
                        >
                          {/* Card Header */}
                          <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-slate-100 font-mono text-[11px] font-bold text-slate-700">
                                #{banner.sort_order}
                              </span>
                              <div>
                                <h3 className="font-bold text-slate-900 text-xs">
                                  {banner.sponsor_name}
                                </h3>
                                <p className="text-[10px] text-slate-400 truncate max-w-[200px]">
                                  {banner.alt_text}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-1">
                              <AdminStatusBadge
                                status={banner.status}
                                label={
                                  banner.status === 'active'
                                    ? 'Aktif'
                                    : banner.status === 'draft'
                                    ? 'Draft'
                                    : 'Nonaktif'
                                }
                              />
                              <AdminStatusBadge
                                status={schedule}
                                label={
                                  schedule === 'live'
                                    ? 'Tayang'
                                    : schedule === 'scheduled'
                                    ? 'Terjadwal'
                                    : schedule === 'ended'
                                    ? 'Berakhir'
                                    : schedule === 'draft'
                                    ? 'Draft'
                                    : 'Nonaktif'
                                }
                              />
                            </div>
                          </div>

                          {/* Desktop & Mobile Previews */}
                          <div className="space-y-2">
                            <div
                              onClick={() => setPreviewSponsor(banner)}
                              className="relative w-full aspect-[5/1] bg-slate-100 rounded-lg border border-slate-300 overflow-hidden cursor-pointer"
                            >
                              <Image
                                src={banner.desktop_image_url}
                                alt={banner.alt_text || banner.sponsor_name}
                                fill
                                sizes="100vw"
                                className="object-cover"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/60 text-white text-[9px] font-medium">
                                Desktop 5:1
                              </div>
                            </div>

                            <div
                              onClick={() => setPreviewSponsor(banner)}
                              className="relative w-full max-w-[220px] aspect-[8/3] bg-slate-100 rounded-lg border border-slate-300 overflow-hidden cursor-pointer"
                            >
                              <Image
                                src={banner.mobile_image_url}
                                alt={banner.alt_text || banner.sponsor_name}
                                fill
                                sizes="220px"
                                className="object-cover"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-[8px] font-medium">
                                Mobile 8:3
                              </div>
                            </div>
                          </div>

                          {/* Target & Schedule Details */}
                          <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs">
                            <div className="flex items-center gap-1.5">
                              <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <a
                                href={banner.target_url}
                                target="_blank"
                                rel="noopener noreferrer sponsored"
                                className="text-blue-600 hover:text-blue-700 font-mono text-[11px] truncate underline"
                              >
                                {banner.target_url}
                              </a>
                            </div>

                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
                              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>
                                {banner.starts_at ? new Date(banner.starts_at).toLocaleDateString('id-ID') : 'Mulai langsung'}
                                {' s/d '}
                                {banner.ends_at ? new Date(banner.ends_at).toLocaleDateString('id-ID') : 'Selamanya'}
                              </span>
                            </div>
                          </div>

                          {/* Action Buttons Bar */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleToggleSponsorStatus(banner)}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors inline-flex items-center gap-1 ${
                                banner.status === 'active'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}
                            >
                              <Power className="w-3.5 h-3.5" />
                              <span>{banner.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}</span>
                            </button>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setPreviewSponsor(banner)}
                                className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                                aria-label="Lihat pratinjau"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSponsorToEdit(banner);
                                  setIsSponsorFormOpen(true);
                                }}
                                className="p-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 transition-colors"
                                aria-label="Edit sponsor"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRequestDeleteSponsor(banner)}
                                className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 transition-colors"
                                aria-label="Hapus sponsor"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: PRODUK */}
          {/* ========================================================= */}
          {activeTab === 'products' && (
            <div className="space-y-4">
              {/* Filter & Toolbar */}
              <div className="bg-white border border-slate-200 rounded-lg p-3.5 space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <Filter className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-semibold text-slate-700">Filter:</span>
                    </div>

                    {/* Filter Status */}
                    <select
                      value={productStatusFilter}
                      onChange={(e) => setProductStatusFilter(e.target.value as FilterProductStatus)}
                      className="bg-slate-50 border border-slate-200 text-xs font-medium rounded-md px-2.5 py-1.5 text-slate-800 focus:outline-hidden focus:border-blue-600 min-h-[36px]"
                    >
                      <option value="all">Semua Status Produk</option>
                      <option value="active">Hanya Aktif</option>
                      <option value="hidden">Tersembunyi (Hidden)</option>
                      <option value="removed">Dihapus (Removed)</option>
                    </select>

                    {/* Filter Kategori */}
                    <select
                      value={productCategoryFilter}
                      onChange={(e) => setProductCategoryFilter(e.target.value)}
                      className="bg-slate-50 border border-slate-200 text-xs font-medium rounded-md px-2.5 py-1.5 text-slate-800 focus:outline-hidden focus:border-blue-600 min-h-[36px]"
                    >
                      <option value="all">Semua Kategori</option>
                      {CATEGORIES.filter((c) => c.slug !== 'semua').map((cat) => (
                        <option key={cat.slug} value={cat.slug}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <span className="text-xs font-mono text-slate-500">
                    Menampilkan {filteredProducts.length} dari {products.length} produk
                  </span>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={productSearchQuery}
                    onChange={(e) => setProductSearchQuery(e.target.value)}
                    placeholder="Cari judul produk, nama penjual, atau kategori..."
                    className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-hidden min-h-[38px]"
                  />
                  {productSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setProductSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Products Table */}
              <AdminTable<AdminProductItem>
                id="admin-products-table"
                columns={[
                  {
                    header: 'Produk',
                    render: (prod) => (
                      <div className="flex items-center gap-3 min-w-[200px]">
                        <div className="w-11 h-11 rounded-md bg-slate-100 overflow-hidden relative shrink-0 border border-slate-200">
                          {prod.images?.[0] ? (
                            <Image
                              src={prod.images[0]}
                              alt={prod.title}
                              fill
                              sizes="44px"
                              className="object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[9px] text-slate-400">
                              No foto
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate max-w-[200px] sm:max-w-xs">{prod.title}</p>
                          <p className="text-[11px] font-semibold text-blue-600 font-mono">{formatRupiah(prod.price)}</p>
                        </div>
                      </div>
                    ),
                  },
                  {
                    header: 'Kategori & Kondisi',
                    render: (prod) => (
                      <div className="text-[11px] space-y-0.5">
                        <span className="capitalize font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[10px]">
                          {prod.category}
                        </span>
                        <p className="text-slate-500 capitalize">{prod.condition}</p>
                      </div>
                    ),
                  },
                  {
                    header: 'Penjual',
                    render: (prod) => (
                      <div className="text-xs">
                        <p className="font-semibold text-slate-800">{prod.seller?.name || 'Anonim'}</p>
                        {prod.seller?.username && (
                          <p className="text-[10px] text-slate-400 font-mono">@{prod.seller.username}</p>
                        )}
                      </div>
                    ),
                  },
                  {
                    header: 'Tanggal Dibuat',
                    render: (prod) => (
                      <div className="text-xs text-slate-600 flex items-center gap-1.5 whitespace-nowrap">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {new Date(prod.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    ),
                  },
                  {
                    header: 'Status',
                    render: (prod) => <AdminStatusBadge status={prod.status} />,
                  },
                  {
                    header: 'Tindakan',
                    render: (prod) => (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Tombol Rincian / Detail Produk */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedProductForDetail(prod);
                            setIsProductDetailOpen(true);
                          }}
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-xs font-medium transition-colors cursor-pointer inline-flex items-center gap-1"
                          title="Lihat detail lengkap produk"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>Rincian</span>
                        </button>

                        {/* Sembunyikan Produk */}
                        {prod.status === 'active' && (
                          <button
                            type="button"
                            onClick={() => {
                              setAdminReason('Diturunkan sementara untuk peninjauan lebih lanjut');
                              setPendingAction({
                                type: 'hide',
                                title: 'Sembunyikan Produk',
                                description: `Iklan "${prod.title}" akan diturunkan dari pencarian publik.`,
                                targetId: prod.id,
                                targetTitle: prod.title,
                                confirmButtonText: 'Sembunyikan',
                                isDestructive: false,
                                requireReason: true,
                              });
                            }}
                            className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded text-xs transition-colors cursor-pointer"
                            title="Sembunyikan Produk"
                          >
                            <EyeOff className="w-3.5 h-3.5 text-amber-600" />
                          </button>
                        )}

                        {/* Aktifkan Kembali Produk */}
                        {prod.status !== 'active' && (
                          <button
                            type="button"
                            onClick={() => {
                              setAdminReason('Produk diverifikasi valid dan diaktifkan kembali');
                              setPendingAction({
                                type: 'restore',
                                title: 'Aktifkan Kembali Produk',
                                description: `Iklan "${prod.title}" akan kembali tayang di pasar.`,
                                targetId: prod.id,
                                targetTitle: prod.title,
                                confirmButtonText: 'Aktifkan Kembali',
                                isDestructive: false,
                                requireReason: true,
                              });
                            }}
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded text-xs transition-colors cursor-pointer"
                            title="Aktifkan Kembali"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                          </button>
                        )}

                        {/* Hapus Produk Permanen (Bukan tindakan utama, dengan konfirmasi berlapis) */}
                        {prod.status !== 'removed' && (
                          <button
                            type="button"
                            onClick={() => {
                              setAdminReason('Dihapus permanen atas pelanggaran aturan pasar');
                              setPendingAction({
                                type: 'remove',
                                title: 'Hapus Produk dari Pasar (Permanen)',
                                description: `PERINGATAN: Tindakan ini akan menghapus iklan "${prod.title}" secara permanen dari katalog dan pasar.`,
                                targetId: prod.id,
                                targetTitle: prod.title,
                                confirmButtonText: 'Hapus Permanen',
                                isDestructive: true,
                                requireReason: true,
                                requireDoubleConfirm: true,
                              });
                            }}
                            className="p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 rounded text-xs transition-colors cursor-pointer"
                            title="Hapus Produk Permanen (Konfirmasi Berlapis)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Tautan Halaman Publik */}
                        <Link
                          href={`/product/${prod.id}`}
                          target="_blank"
                          className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-xs transition-colors"
                          title="Buka Halaman Produk Publik"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    ),
                  },
                ]}
                data={paginatedProducts}
                keyExtractor={(item) => item.id}
                emptyState={
                  <AdminEmptyState
                    icon={<Package className="w-6 h-6 text-slate-400" />}
                    title="Tidak Ditemukan Produk"
                    description="Tidak ada produk yang sesuai dengan filter atau kata kunci pencarian Anda."
                  />
                }
              />

              {/* Pagination Produk */}
              <AdminPagination
                currentPage={productPage}
                totalItems={filteredProducts.length}
                itemsPerPage={productsPerPage}
                onPageChange={setProductPage}
                onItemsPerPageChange={(newSize) => {
                  setProductsPerPage(newSize);
                  setProductPage(1);
                }}
                labelName="produk"
              />
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: PENGGUNA */}
          {/* ========================================================= */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              {/* Filter & Toolbar */}
              <div className="bg-white border border-slate-200 rounded-lg p-3.5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-700">Filter Pengguna:</span>
                    <select
                      value={userStatusFilter}
                      onChange={(e) => setUserStatusFilter(e.target.value as FilterUserStatus)}
                      className="bg-slate-50 border border-slate-200 text-xs font-medium rounded-md px-2.5 py-1.5 text-slate-800 focus:outline-hidden focus:border-blue-600 min-h-[36px]"
                    >
                      <option value="all">Semua Pengguna</option>
                      <option value="active">Hanya Akun Aktif</option>
                      <option value="suspended">Hanya Dinonaktifkan (Suspended)</option>
                      <option value="admin">Hanya Administrator</option>
                    </select>
                  </div>

                  <span className="text-xs font-mono text-slate-500">
                    Menampilkan {filteredUsers.length} dari {users.length} akun
                  </span>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    placeholder="Cari nama atau username pengguna..."
                    className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-hidden min-h-[38px]"
                  />
                  {userSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setUserSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Users Table */}
              <AdminTable<AdminUserItem>
                id="admin-users-table"
                columns={[
                  {
                    header: 'Pengguna',
                    render: (u) => (
                      <div className="flex items-center gap-2.5 min-w-[180px]">
                        <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs overflow-hidden relative shrink-0 border border-slate-200">
                          {u.avatar_url ? (
                            <Image
                              src={u.avatar_url}
                              alt={u.name}
                              fill
                              sizes="36px"
                              className="object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            u.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate">{u.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono truncate">@{u.username}</p>
                        </div>
                      </div>
                    ),
                  },
                  {
                    header: 'Tanggal Bergabung',
                    render: (u) => (
                      <div className="text-xs text-slate-600 flex items-center gap-1.5 whitespace-nowrap">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {u.created_at
                            ? new Date(u.created_at).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
                            : '-'}
                        </span>
                      </div>
                    ),
                  },
                  {
                    header: 'Jumlah Produk',
                    render: (u) => {
                      const totalProds = userProductsMap[u.id]?.length ?? u.products_count ?? 0;
                      const activeProds = userProductsMap[u.id]?.filter((p) => p.status === 'active').length ?? u.active_products_count ?? 0;
                      return (
                        <div className="text-xs space-y-0.5">
                          <span className="font-semibold text-slate-800 font-mono">
                            {totalProds} Produk
                          </span>
                          <p className="text-[10px] text-emerald-600 font-medium">
                            {activeProds} aktif
                          </p>
                        </div>
                      );
                    },
                  },
                  {
                    header: 'Peran',
                    render: (u) => (
                      <AdminStatusBadge
                        status={u.role === 'admin' ? 'admin_role' : 'user_role'}
                        label={u.role === 'admin' ? 'Administrator' : 'Anggota'}
                      />
                    ),
                  },
                  {
                    header: 'Status Akun',
                    render: (u) => (
                      <AdminStatusBadge
                        status={u.is_suspended ? 'suspended' : 'user_active'}
                        label={u.is_suspended ? 'Dinonaktifkan' : 'Aktif'}
                      />
                    ),
                  },
                  {
                    header: 'Tindakan',
                    render: (u) => {
                      const isSelf = u.id === user?.id || u.id === profile?.id;
                      return (
                        <div className="flex items-center gap-1.5">
                          {/* Tombol Rincian / Detail Pengguna */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedUserForDetail(u);
                              setIsUserDetailOpen(true);
                            }}
                            className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-xs font-medium transition-colors cursor-pointer inline-flex items-center gap-1"
                            title="Buka detail profil & produk pengguna"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            <span>Rincian</span>
                          </button>

                          {/* Tombol Tangguhkan / Cabut Penangguhan */}
                          {!u.is_suspended ? (
                            <button
                              type="button"
                              disabled={isSelf}
                              onClick={() => {
                                if (isSelf) return;
                                setAdminReason('Penangguhan akun atas indikasi pelanggaran aturan');
                                setPendingAction({
                                  type: 'suspend_user',
                                  title: 'Tangguhkan Akun Pengguna',
                                  description: `Akun "${u.name}" (@${u.username}) akan ditangguhkan dan tidak dapat bertransaksi.`,
                                  targetId: u.id,
                                  targetTitle: u.name,
                                  confirmButtonText: 'Tangguhkan Akun',
                                  isDestructive: true,
                                  requireReason: true,
                                });
                              }}
                              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors inline-flex items-center gap-1 ${
                                isSelf
                                  ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                                  : 'bg-white hover:bg-rose-50 text-rose-700 border border-slate-200 hover:border-rose-300 cursor-pointer'
                              }`}
                              title={isSelf ? 'Admin tidak dapat menangguhkan akun sendiri' : 'Tangguhkan Akun Pengguna'}
                            >
                              <UserX className="w-3.5 h-3.5" />
                              <span>Tangguhkan</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setAdminReason('Sanksi penangguhan dicabut setelah peninjauan');
                                setPendingAction({
                                  type: 'unsuspend_user',
                                  title: 'Cabut Penangguhan Akun',
                                  description: `Penangguhan akun "${u.name}" akan dicabut dan dipulihkan kembali aktif.`,
                                  targetId: u.id,
                                  targetTitle: u.name,
                                  confirmButtonText: 'Cabut Penangguhan',
                                  isDestructive: false,
                                  requireReason: true,
                                });
                              }}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-1"
                              title="Cabut Penangguhan Akun"
                            >
                              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Pulihkan</span>
                            </button>
                          )}

                          {/* Tautan Profil Publik */}
                          <Link
                            href={`/profile/${u.username}`}
                            target="_blank"
                            className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded text-xs"
                            title="Lihat Profil Publik"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      );
                    },
                  },
                ]}
                data={paginatedUsers}
                keyExtractor={(item) => item.id}
                emptyState={
                  <AdminEmptyState
                    icon={<Users className="w-6 h-6 text-slate-400" />}
                    title="Tidak Ditemukan Pengguna"
                    description="Tidak ada pengguna yang cocok dengan kriteria pencarian."
                  />
                }
              />

              {/* Pagination Pengguna */}
              <AdminPagination
                currentPage={userPage}
                totalItems={filteredUsers.length}
                itemsPerPage={usersPerPage}
                onPageChange={setUserPage}
                onItemsPerPageChange={(newSize) => {
                  setUsersPerPage(newSize);
                  setUserPage(1);
                }}
                labelName="pengguna"
              />
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 5: LAPORAN */}
          {/* ========================================================= */}
          {activeTab === 'reports' && (
            <div className="space-y-4">
              {/* Filter & Toolbar */}
              <div className="bg-white border border-slate-200 rounded-lg p-3.5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-700">Filter Status:</span>
                    <select
                      value={reportStatusFilter}
                      onChange={(e) => setReportStatusFilter(e.target.value as FilterReportStatus)}
                      className="bg-slate-50 border border-slate-200 text-xs font-medium rounded-md px-2.5 py-1.5 text-slate-800 focus:outline-hidden focus:border-blue-600 min-h-[36px]"
                    >
                      <option value="all">Semua Status Laporan</option>
                      <option value="pending">Menunggu Tindakan (Pending)</option>
                      <option value="reviewed">Sedang Ditinjau (Reviewed)</option>
                      <option value="resolved">Selesai Dimoderasi (Resolved)</option>
                    </select>
                  </div>

                  <span className="text-xs font-mono text-slate-500">
                    Menampilkan {filteredReports.length} dari {reports.length} laporan
                  </span>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={reportSearchQuery}
                    onChange={(e) => setReportSearchQuery(e.target.value)}
                    placeholder="Cari barang, alasan, nama seller, atau pelapor..."
                    className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-hidden min-h-[38px]"
                  />
                  {reportSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setReportSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Reports List */}
              {filteredReports.length === 0 ? (
                <AdminEmptyState
                  icon={<CheckCircle2 className="w-6 h-6 text-emerald-600" />}
                  title="Tidak Ada Laporan yang Cocok"
                  description={
                    reportSearchQuery
                      ? 'Tidak ditemukan laporan yang sesuai dengan kata kunci pencarian Anda.'
                      : 'Semua produk aman dan tidak ada laporan yang membutuhkan tindakan saat ini.'
                  }
                />
              ) : (
                <div className="space-y-4">
                  {paginatedReports.map((report) => {
                    const product = report.product;
                    const seller = report.seller;
                    const reporter = report.reporter;
                    const isPending = report.status === 'pending';
                    const isReviewed = report.status === 'reviewed';
                    const isResolved = report.status === 'resolved';

                    return (
                      <article
                        key={report.id}
                        className={`bg-white border rounded-lg p-4 transition-colors ${
                          isPending
                            ? 'border-rose-300 shadow-2xs'
                            : isReviewed
                            ? 'border-sky-300 shadow-2xs'
                            : 'border-slate-200'
                        }`}
                      >
                        {/* Meta Header */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100 text-xs">
                          <div className="flex flex-wrap items-center gap-2">
                            <AdminStatusBadge
                              status={report.status}
                              label={
                                isPending
                                  ? 'Menunggu Tindakan'
                                  : isReviewed
                                  ? 'Sedang Ditinjau'
                                  : 'Selesai Dimoderasi'
                              }
                            />
                            <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                              Alasan: {report.reason}
                            </span>
                            <span className="text-[11px] text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>
                                {new Date(report.created_at).toLocaleString('id-ID', {
                                  dateStyle: 'medium',
                                  timeStyle: 'short',
                                })}
                              </span>
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-500">
                            Pelapor: <strong className="text-slate-800">{reporter?.name || 'Pengguna'}</strong>{' '}
                            {reporter?.username && (
                              <span className="text-slate-400 font-mono">@{reporter.username}</span>
                            )}
                          </div>
                        </div>

                        {/* Catatan Pelapor */}
                        {report.description && (
                          <div className="my-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-md text-xs">
                            <span className="font-semibold text-slate-600 uppercase tracking-wider text-[10px] block mb-0.5">
                              Catatan Aduan Pelapor:
                            </span>
                            <p className="text-slate-800 italic leading-relaxed">
                              &quot;{report.description}&quot;
                            </p>
                          </div>
                        )}

                        {/* Detail Produk & Seller Grid */}
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                          {/* Info Produk */}
                          <div className="md:col-span-2 flex gap-3 p-3 bg-slate-50 border border-slate-200 rounded-md">
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

                            <div className="flex-1 min-w-0 space-y-0.5">
                              <div className="flex items-center gap-2">
                                <AdminStatusBadge status={product?.status || 'active'} />
                                <span className="text-[10px] text-slate-400 font-mono">
                                  ID: {report.product_id.slice(0, 8)}
                                </span>
                              </div>

                              <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                                {product?.title || 'Produk tidak ditemukan'}
                              </h3>

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

                          {/* Identitas Penjual */}
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

                        {/* Moderation Buttons */}
                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {/* Tombol Tinjau Laporan (Jika Status masih pending) */}
                            {isPending && (
                              <button
                                type="button"
                                onClick={() => {
                                  setAdminReason('Laporan masuk ke tahap peninjauan dan evaluasi bukti oleh admin');
                                  setPendingAction({
                                    type: 'review_report',
                                    title: 'Tinjau Laporan',
                                    description: `Status laporan aduan #${report.id.slice(0, 8)} akan diubah menjadi "Ditinjau" untuk menandakan investigasi sedang berjalan.`,
                                    targetId: report.id,
                                    targetTitle: `Laporan #${report.id.slice(0, 8)} (${report.reason})`,
                                    confirmButtonText: 'Tandai Ditinjau',
                                    isDestructive: false,
                                    requireReason: true,
                                  });
                                }}
                                className="px-2.5 py-1 rounded-md border border-sky-300 bg-sky-50 text-sky-800 hover:bg-sky-100 text-xs font-semibold transition-colors inline-flex items-center gap-1 cursor-pointer min-h-[32px]"
                              >
                                <Eye className="w-3.5 h-3.5 text-sky-600" />
                                <span>Tinjau Laporan</span>
                              </button>
                            )}

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
                                    requireReason: true,
                                  });
                                }}
                                className="px-2.5 py-1 rounded-md border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 text-xs font-semibold transition-colors inline-flex items-center gap-1 cursor-pointer min-h-[32px]"
                              >
                                <EyeOff className="w-3.5 h-3.5 text-amber-600" />
                                <span>Sembunyikan</span>
                              </button>
                            )}

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
                                    requireReason: true,
                                    requireDoubleConfirm: true,
                                  });
                                }}
                                className="px-2.5 py-1 rounded-md border border-rose-300 bg-rose-50 text-rose-800 hover:bg-rose-100 text-xs font-semibold transition-colors inline-flex items-center gap-1 cursor-pointer min-h-[32px]"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                <span>Hapus Produk</span>
                              </button>
                            )}

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
                                    requireReason: true,
                                  });
                                }}
                                className="px-2.5 py-1 rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors inline-flex items-center gap-1 cursor-pointer min-h-[32px]"
                              >
                                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                                <span>Aktifkan Kembali</span>
                              </button>
                            )}

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
                                    requireReason: true,
                                  });
                                }}
                                className="px-2.5 py-1 rounded-md border border-slate-300 bg-white text-slate-700 hover:text-rose-700 hover:border-rose-300 text-xs font-medium transition-colors inline-flex items-center gap-1 cursor-pointer min-h-[32px]"
                              >
                                <UserX className="w-3.5 h-3.5 text-rose-600" />
                                <span>Tangguhkan Seller</span>
                              </button>
                            )}

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
                                    requireReason: true,
                                  });
                                }}
                                className="px-2.5 py-1 rounded-md border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-semibold transition-colors inline-flex items-center gap-1 cursor-pointer min-h-[32px]"
                              >
                                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Pulihkan Seller</span>
                              </button>
                            )}
                          </div>

                          {/* Action Selesaikan / Status Selesai */}
                          {!isResolved ? (
                            <button
                              type="button"
                              onClick={() => {
                                setAdminReason('Laporan telah ditindaklanjuti dan selesai diarsipkan');
                                setPendingAction({
                                  type: 'resolve_report',
                                  title: 'Tandai Laporan Selesai',
                                  description: 'Laporan ini akan ditandai selesai/resolved dan diarsipkan.',
                                  targetId: report.id,
                                  targetTitle: `Laporan #${report.id.slice(0, 8)}`,
                                  confirmButtonText: 'Tandai Selesai',
                                  isDestructive: false,
                                  requireReason: true,
                                });
                              }}
                              className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold transition-colors inline-flex items-center gap-1.5 cursor-pointer min-h-[32px]"
                            >
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Tandai Selesai</span>
                            </button>
                          ) : (
                            <div className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md text-xs font-medium inline-flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Laporan Selesai Dimoderasi</span>
                            </div>
                          )}
                        </div>
                      </article>
                    );
                  })}

                  {/* Pagination Laporan */}
                  <AdminPagination
                    currentPage={reportPage}
                    totalItems={filteredReports.length}
                    itemsPerPage={reportsPerPage}
                    onPageChange={setReportPage}
                    onItemsPerPageChange={(newSize) => {
                      setReportsPerPage(newSize);
                      setReportPage(1);
                    }}
                    labelName="laporan"
                  />
                </div>
              )}

              {/* Pedoman Aturan Produk Terlarang (Expandable Section) */}
              <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
                <div className="border-b border-slate-100 pb-2">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 text-rose-600">
                    <FileText className="w-4 h-4" />
                    <span>Pedoman Aturan Terlarang Nepal Market</span>
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {PROHIBITED_ITEMS_GUIDELINES.map((guide, idx) => (
                    <div
                      key={guide.id}
                      className="p-2.5 rounded border border-slate-200 bg-slate-50 space-y-0.5 text-xs"
                    >
                      <div className="flex items-center gap-1.5 text-slate-900 font-bold">
                        <span className="w-4 h-4 rounded-full bg-rose-100 text-rose-700 font-mono text-[10px] flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <h4>{guide.title}</h4>
                      </div>
                      <p className="text-slate-600 pl-5 text-[11px] leading-relaxed">
                        {guide.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 6: LOG MODERASI */}
          {/* ========================================================= */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              {/* Toolbar */}
              <div className="bg-white border border-slate-200 rounded-lg p-3.5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <History className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-700">Filter Aksi Moderasi:</span>
                    <select
                      value={logActionFilter}
                      onChange={(e) => setLogActionFilter(e.target.value)}
                      className="bg-slate-50 border border-slate-200 text-xs font-medium rounded-md px-2.5 py-1.5 text-slate-800 focus:outline-hidden focus:border-blue-600 min-h-[36px]"
                    >
                      <option value="all">Semua Jenis Aksi</option>
                      <option value="hide_product">Sembunyikan Produk</option>
                      <option value="remove_product">Hapus Produk</option>
                      <option value="restore_product">Pulihkan Produk</option>
                      <option value="suspend_user">Tangguhkan Pengguna</option>
                      <option value="unsuspend_user">Pulihkan Pengguna</option>
                      <option value="resolve_report">Selesaikan Laporan</option>
                      <option value="review_report">Tinjau Laporan</option>
                      <option value="create_sponsor">Tambah Sponsor</option>
                      <option value="update_sponsor">Edit Sponsor</option>
                      <option value="delete_sponsor">Hapus Sponsor</option>
                    </select>
                  </div>
                  <span className="text-xs font-mono text-slate-500">
                    Total {filteredLogs.length} entri audit
                  </span>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={logSearchQuery}
                    onChange={(e) => setLogSearchQuery(e.target.value)}
                    placeholder="Cari admin, target produk/user, jenis tindakan, atau alasan..."
                    className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-hidden min-h-[38px]"
                  />
                  {logSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setLogSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Logs Table (Read-Only: No edit or delete permitted from admin UI) */}
              <AdminTable<DbModerationLog>
                id="admin-logs-table"
                columns={[
                  {
                    header: 'Waktu',
                    render: (log) => (
                      <span className="font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString('id-ID', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </span>
                    ),
                  },
                  {
                    header: 'Admin',
                    render: (log) => (
                      <span className="font-semibold text-slate-800">
                        {log.admin?.name || 'Admin'}
                      </span>
                    ),
                  },
                  {
                    header: 'Tindakan',
                    render: (log) => <AdminStatusBadge status={log.action} />,
                  },
                  {
                    header: 'Target',
                    render: (log) => (
                      <span className="font-medium text-slate-800 max-w-[180px] truncate block">
                        {log.target_title || log.target_id.slice(0, 8)}
                      </span>
                    ),
                  },
                  {
                    header: 'Alasan Tindakan',
                    render: (log) => (
                      <span className="text-slate-600 leading-relaxed max-w-sm block">
                        {log.reason || '-'}
                      </span>
                    ),
                  },
                ]}
                data={paginatedLogs}
                keyExtractor={(item) => item.id}
                emptyState={
                  <AdminEmptyState
                    icon={<History className="w-6 h-6 text-slate-400" />}
                    title="Tidak Ada Riwayat Audit"
                    description="Belum ada catatan log tindakan moderasi yang sesuai."
                  />
                }
              />

              {/* Pagination Log Moderasi */}
              <AdminPagination
                currentPage={logPage}
                totalItems={filteredLogs.length}
                itemsPerPage={logsPerPage}
                onPageChange={setLogPage}
                onItemsPerPageChange={(newSize) => {
                  setLogsPerPage(newSize);
                  setLogPage(1);
                }}
                labelName="entri audit"
              />
            </div>
          )}
        </main>
      </div>

      {/* 3. Reusable Confirm Action Modal Dialog */}
      <AdminConfirmDialog
        action={pendingAction}
        adminReason={adminReason}
        onReasonChange={setAdminReason}
        isExecuting={isExecutingAction}
        actionError={actionError}
        onConfirm={handleExecuteAction}
        onClose={() => setPendingAction(null)}
      />

      {/* 4. Sponsor Form Modal (Tambah & Edit) */}
      <SponsorFormModal
        isOpen={isSponsorFormOpen}
        sponsorToEdit={sponsorToEdit}
        onClose={() => {
          setIsSponsorFormOpen(false);
          setSponsorToEdit(null);
        }}
        onSave={handleSaveSponsor}
      />

      {/* 5. Sponsor Preview Modal (Desktop & Mobile) */}
      <SponsorPreviewModal
        banner={previewSponsor}
        onClose={() => setPreviewSponsor(null)}
      />

      {/* 6. Admin Product Detail Modal */}
      <AdminProductDetailModal
        isOpen={isProductDetailOpen}
        product={selectedProductForDetail}
        onClose={() => {
          setIsProductDetailOpen(false);
          setSelectedProductForDetail(null);
        }}
        onHideProduct={(prod) => {
          setAdminReason('Diturunkan sementara untuk peninjauan lebih lanjut');
          setPendingAction({
            type: 'hide',
            title: 'Sembunyikan Produk',
            description: `Iklan "${prod.title}" akan diturunkan dari pencarian publik.`,
            targetId: prod.id,
            targetTitle: prod.title,
            confirmButtonText: 'Sembunyikan',
            isDestructive: false,
            requireReason: true,
          });
        }}
        onRestoreProduct={(prod) => {
          setAdminReason('Produk diverifikasi valid dan diaktifkan kembali');
          setPendingAction({
            type: 'restore',
            title: 'Aktifkan Kembali Produk',
            description: `Iklan "${prod.title}" akan kembali tayang di pasar.`,
            targetId: prod.id,
            targetTitle: prod.title,
            confirmButtonText: 'Aktifkan Kembali',
            isDestructive: false,
            requireReason: true,
          });
        }}
        onRemoveProduct={(prod) => {
          setAdminReason('Dihapus permanen atas pelanggaran aturan pasar');
          setPendingAction({
            type: 'remove',
            title: 'Hapus Produk dari Pasar (Permanen)',
            description: `PERINGATAN: Tindakan ini akan menghapus iklan "${prod.title}" secara permanen dari katalog dan pasar.`,
            targetId: prod.id,
            targetTitle: prod.title,
            confirmButtonText: 'Hapus Permanen',
            isDestructive: true,
            requireReason: true,
            requireDoubleConfirm: true,
          });
        }}
      />

      {/* 7. Admin User Detail Modal */}
      <AdminUserDetailModal
        isOpen={isUserDetailOpen}
        user={selectedUserForDetail}
        currentAdminId={profile?.id || user?.id || null}
        userProducts={selectedUserForDetail ? (userProductsMap[selectedUserForDetail.id] || []) : []}
        onClose={() => {
          setIsUserDetailOpen(false);
          setSelectedUserForDetail(null);
        }}
        onSuspendUser={(u) => {
          setAdminReason('Penangguhan akun atas indikasi pelanggaran aturan');
          setPendingAction({
            type: 'suspend_user',
            title: 'Tangguhkan Akun Pengguna',
            description: `Akun "${u.name}" (@${u.username}) akan ditangguhkan dan tidak dapat bertransaksi.`,
            targetId: u.id,
            targetTitle: u.name,
            confirmButtonText: 'Tangguhkan Akun',
            isDestructive: true,
            requireReason: true,
          });
        }}
        onUnsuspendUser={(u) => {
          setAdminReason('Sanksi penangguhan dicabut setelah peninjauan');
          setPendingAction({
            type: 'unsuspend_user',
            title: 'Cabut Penangguhan Akun',
            description: `Penangguhan akun "${u.name}" akan dicabut dan dipulihkan kembali aktif.`,
            targetId: u.id,
            targetTitle: u.name,
            confirmButtonText: 'Cabut Penangguhan',
            isDestructive: false,
            requireReason: true,
          });
        }}
        onSelectProduct={(prod) => {
          setIsUserDetailOpen(false);
          setSelectedProductForDetail(prod);
          setIsProductDetailOpen(true);
        }}
      />

      {/* 8. Admin Feedback Toast Notifications */}
      <AdminToast
        toasts={toasts}
        onDismiss={dismissToast}
      />
    </div>
  );
}
