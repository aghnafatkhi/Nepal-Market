import { getSupabaseClient } from './client';
import { getSponsorScheduleStatus } from './sponsors';
import { DbCondition, DbProductStatus, DbReportStatus, ModerationAction } from './types';

export interface CategoryStat {
  category: string;
  label: string;
  count: number;
  percentage: number;
}

export interface ConditionStat {
  condition: string;
  label: string;
  count: number;
  percentage: number;
}

export interface AdminRecentProduct {
  id: string;
  title: string;
  price: number;
  category: string;
  condition: string;
  status: DbProductStatus;
  created_at: string;
  sellerName: string;
}

export interface AdminRecentReport {
  id: string;
  reason: string;
  status: DbReportStatus;
  created_at: string;
  productTitle: string;
  productId: string;
}

export interface AdminActiveSponsorSummary {
  id: string;
  sponsorName: string;
  targetUrl: string;
  endsAt: string | null;
  daysRemaining: number | null;
  isExpiringSoon: boolean;
}

export interface AdminRecentLog {
  id: string;
  action: ModerationAction;
  targetType: string;
  targetTitle: string | null;
  reason: string;
  createdAt: string;
  adminName: string;
}

export interface AdminDashboardRealStats {
  // Counters (exact head count)
  totalUsers: number;
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  pendingReports: number;
  activeSponsors: number;
  expiringSponsors: number;

  // Persentase produk aktif vs total produk
  activeProductPercentage: number;

  // Ringkasan kategori & kondisi
  categoryBreakdown: CategoryStat[];
  conditionBreakdown: ConditionStat[];

  // Data ringkasan terbaru (maksimal 5 item)
  recentProducts: AdminRecentProduct[];
  recentReports: AdminRecentReport[];
  currentActiveSponsors: AdminActiveSponsorSummary[];
  recentModerationLogs: AdminRecentLog[];

  // Metadata sinkronisasi
  lastUpdated: string;
  errors: Record<string, string>;
}

// Label kategori terstandarisasi untuk presentasi
const CATEGORY_LABELS: Record<string, string> = {
  fashion: 'Fashion & Pakaian',
  elektronik: 'Elektronik & Gadget',
  buku: 'Buku & Catatan',
  aksesori: 'Aksesori & Perlengkapan',
  hobi: 'Hobi & Olahraga',
  makanan: 'Makanan & Minuman',
  jasa: 'Jasa & Layanan',
  otomotif: 'Otomotif & Kendaraan',
  lainnya: 'Lainnya',
};

// Label kondisi terstandarisasi
const CONDITION_LABELS: Record<string, string> = {
  new: 'Baru',
  like_new: 'Bekas',
  used: 'Bekas',
};

/**
 * Format tanggal ramah pengguna untuk dashboard
 */
export function formatAdminDateTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }) + ' WIB';
  } catch {
    return isoString;
  }
}

/**
 * Format waktu relatif ringkas (misal: "5m lalu", "2j lalu", "Kemarin")
 */
export function formatRelativeTime(isoString: string): string {
  try {
    const now = Date.now();
    const target = new Date(isoString).getTime();
    const diffSec = Math.floor((now - target) / 1000);

    if (diffSec < 60) return 'Baru saja';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m lalu`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}j lalu`;
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay < 7) return `${diffDay}h lalu`;
    return new Date(isoString).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  } catch {
    return '-';
  }
}

/**
 * Mengambil statistik dashboard admin secara nyata dan efisien dari Supabase.
 * Menggunakan query paralel (Promise.allSettled) agar kegagalan satu query tidak mematikan query lain.
 */
export async function fetchAdminDashboardStats(): Promise<AdminDashboardRealStats> {
  const supabase = getSupabaseClient();
  const errors: Record<string, string> = {};

  // Default initial stats
  const result: AdminDashboardRealStats = {
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
    errors,
  };

  if (!supabase) {
    errors['client'] = 'Supabase client belum terkonfigurasi';
    return result;
  }

  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // 1. Definisikan semua query secara modular dan efisien
  // 1A. Total Users (head: true)
  const queryTotalUsers = supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true });

  // 1B. Total Products (head: true)
  const queryTotalProducts = supabase
    .from('products')
    .select('id', { count: 'exact', head: true });

  // 1C. Active Products (head: true)
  const queryActiveProducts = supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active');

  // 1D. Inactive Products (head: true - hidden, draft, sold, removed)
  const queryInactiveProducts = supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .neq('status', 'active');

  // 1E. Pending Reports (head: true)
  const queryPendingReports = supabase
    .from('reports')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending');

  // 1F. Sponsor Banners (Hanya kolom status, tanggal, dan nama)
  const querySponsors = supabase
    .from('sponsor_banners')
    .select('id, sponsor_name, status, starts_at, ends_at, target_url, sort_order')
    .order('sort_order', { ascending: true });

  // 1G. Ringkasan Kategori & Kondisi (Hanya kolom category, condition, status)
  const queryBreakdowns = supabase
    .from('products')
    .select('category, condition, status');

  // 1H. 5 Produk Terbaru (Hanya nama/username publik seller, TANPA email atau nomor telepon)
  const queryRecentProducts = supabase
    .from('products')
    .select(`
      id,
      title,
      price,
      category,
      condition,
      status,
      created_at,
      seller:profiles!seller_id(name, username)
    `)
    .order('created_at', { ascending: false })
    .limit(5);

  // 1I. 5 Laporan Terbaru (TANPA data kontak pelapor/terlapor)
  const queryRecentReports = supabase
    .from('reports')
    .select(`
      id,
      reason,
      status,
      created_at,
      product:products!product_id(id, title)
    `)
    .order('created_at', { ascending: false })
    .limit(5);

  // 1J. 5 Log Moderasi Terbaru (Hanya nama admin, TANPA data pribadi)
  const queryRecentLogs = supabase
    .from('moderation_logs')
    .select(`
      id,
      action,
      target_type,
      target_title,
      reason,
      created_at,
      admin:profiles!admin_id(name, username)
    `)
    .order('created_at', { ascending: false })
    .limit(5);

  // 2. Jalankan seluruh query secara paralel dengan Promise.allSettled
  const [
    resUsers,
    resTotalProducts,
    resActiveProducts,
    resInactiveProducts,
    resPendingReports,
    resSponsors,
    resBreakdowns,
    resRecentProducts,
    resRecentReports,
    resRecentLogs,
  ] = await Promise.allSettled([
    queryTotalUsers,
    queryTotalProducts,
    queryActiveProducts,
    queryInactiveProducts,
    queryPendingReports,
    querySponsors,
    queryBreakdowns,
    queryRecentProducts,
    queryRecentReports,
    queryRecentLogs,
  ]);

  // 3. Evaluasi hasil query masing-masing secara terisolasi

  // 3A. Total Users
  if (resUsers.status === 'fulfilled' && !resUsers.value.error) {
    result.totalUsers = resUsers.value.count ?? 0;
  } else {
    const err = resUsers.status === 'rejected' ? resUsers.reason : resUsers.value.error;
    errors['totalUsers'] = err?.message || 'Gagal memuat total pengguna';
  }

  // 3B. Total Products
  if (resTotalProducts.status === 'fulfilled' && !resTotalProducts.value.error) {
    result.totalProducts = resTotalProducts.value.count ?? 0;
  } else {
    const err = resTotalProducts.status === 'rejected' ? resTotalProducts.reason : resTotalProducts.value.error;
    errors['totalProducts'] = err?.message || 'Gagal memuat total produk';
  }

  // 3C. Active Products
  if (resActiveProducts.status === 'fulfilled' && !resActiveProducts.value.error) {
    result.activeProducts = resActiveProducts.value.count ?? 0;
  } else {
    const err = resActiveProducts.status === 'rejected' ? resActiveProducts.reason : resActiveProducts.value.error;
    errors['activeProducts'] = err?.message || 'Gagal memuat produk aktif';
  }

  // 3D. Inactive Products
  if (resInactiveProducts.status === 'fulfilled' && !resInactiveProducts.value.error) {
    result.inactiveProducts = resInactiveProducts.value.count ?? 0;
  } else {
    // Jika query neq gagal, hitung dari selisih jika ada
    if (result.totalProducts > 0 && result.activeProducts >= 0) {
      result.inactiveProducts = Math.max(0, result.totalProducts - result.activeProducts);
    } else {
      const err = resInactiveProducts.status === 'rejected' ? resInactiveProducts.reason : resInactiveProducts.value.error;
      errors['inactiveProducts'] = err?.message || 'Gagal memuat produk tidak aktif';
    }
  }

  // Hitung persentase produk aktif
  if (result.totalProducts > 0) {
    result.activeProductPercentage = Math.round((result.activeProducts / result.totalProducts) * 100);
  } else {
    result.activeProductPercentage = 0;
  }

  // 3E. Pending Reports
  if (resPendingReports.status === 'fulfilled' && !resPendingReports.value.error) {
    result.pendingReports = resPendingReports.value.count ?? 0;
  } else {
    const err = resPendingReports.status === 'rejected' ? resPendingReports.reason : resPendingReports.value.error;
    errors['pendingReports'] = err?.message || 'Gagal memuat laporan menunggu';
  }

  // 3F. Sponsors & Expiring calculation
  if (resSponsors.status === 'fulfilled' && !resSponsors.value.error) {
    const rawSponsors = (resSponsors.value.data as Array<{
      id: string;
      sponsor_name: string;
      status: string;
      starts_at: string | null;
      ends_at: string | null;
      target_url: string;
      sort_order: number;
    }>) || [];

    let activeCount = 0;
    let expiringCount = 0;
    const activeList: AdminActiveSponsorSummary[] = [];

    for (const b of rawSponsors) {
      const sched = getSponsorScheduleStatus({
        status: b.status as any,
        starts_at: b.starts_at,
        ends_at: b.ends_at,
      }, now);

      if (sched === 'live') {
        activeCount++;

        let daysRemaining: number | null = null;
        let isExpiringSoon = false;

        if (b.ends_at) {
          const endDate = new Date(b.ends_at);
          const diffTime = endDate.getTime() - now.getTime();
          daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

          if (endDate <= sevenDaysFromNow) {
            isExpiringSoon = true;
            expiringCount++;
          }
        }

        activeList.push({
          id: b.id,
          sponsorName: b.sponsor_name,
          targetUrl: b.target_url || '#',
          endsAt: b.ends_at,
          daysRemaining,
          isExpiringSoon,
        });
      }
    }

    result.activeSponsors = activeCount;
    result.expiringSponsors = expiringCount;
    result.currentActiveSponsors = activeList;
  } else {
    const err = resSponsors.status === 'rejected' ? resSponsors.reason : resSponsors.value.error;
    errors['sponsors'] = err?.message || 'Gagal memuat data sponsor';
  }

  // 3G. Category & Condition Breakdowns
  if (resBreakdowns.status === 'fulfilled' && !resBreakdowns.value.error) {
    const items = (resBreakdowns.value.data as Array<{
      category: string;
      condition: string;
      status: string;
    }>) || [];

    const categoryMap: Record<string, number> = {};
    const conditionMap: Record<string, number> = {};

    for (const item of items) {
      const cat = (item.category || 'lainnya').toLowerCase().trim();
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;

      const cond = (item.condition || 'used').toLowerCase().trim();
      conditionMap[cond] = (conditionMap[cond] || 0) + 1;
    }

    const totalItems = items.length;

    // Build category breakdown sorted descending
    result.categoryBreakdown = Object.entries(categoryMap)
      .map(([cat, count]) => ({
        category: cat,
        label: CATEGORY_LABELS[cat] || cat.charAt(0).toUpperCase() + cat.slice(1),
        count,
        percentage: totalItems > 0 ? Math.round((count / totalItems) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // Build condition breakdown
    result.conditionBreakdown = Object.entries(conditionMap)
      .map(([cond, count]) => ({
        condition: cond,
        label: CONDITION_LABELS[cond] || cond,
        count,
        percentage: totalItems > 0 ? Math.round((count / totalItems) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  } else {
    const err = resBreakdowns.status === 'rejected' ? resBreakdowns.reason : resBreakdowns.value.error;
    errors['breakdowns'] = err?.message || 'Gagal memuat ringkasan kategori & kondisi';
  }

  // 3H. Recent Products
  if (resRecentProducts.status === 'fulfilled' && !resRecentProducts.value.error) {
    const rawProd = (resRecentProducts.value.data as any[]) || [];
    result.recentProducts = rawProd.map((p) => {
      const seller = Array.isArray(p.seller) ? p.seller[0] : p.seller;
      return {
        id: p.id,
        title: p.title || 'Tanpa Judul',
        price: Number(p.price) || 0,
        category: p.category || 'lainnya',
        condition: p.condition || 'used',
        status: p.status || 'active',
        created_at: p.created_at,
        sellerName: seller?.name || seller?.username || 'Penjual Nepal',
      };
    });
  } else {
    const err = resRecentProducts.status === 'rejected' ? resRecentProducts.reason : resRecentProducts.value.error;
    errors['recentProducts'] = err?.message || 'Gagal memuat produk terbaru';
  }

  // 3I. Recent Reports
  if (resRecentReports.status === 'fulfilled' && !resRecentReports.value.error) {
    const rawRep = (resRecentReports.value.data as any[]) || [];
    result.recentReports = rawRep.map((r) => {
      const prod = Array.isArray(r.product) ? r.product[0] : r.product;
      return {
        id: r.id,
        reason: r.reason || 'Lainnya',
        status: r.status || 'pending',
        created_at: r.created_at,
        productTitle: prod?.title || 'Produk Tidak Ditemukan',
        productId: prod?.id || '',
      };
    });
  } else {
    const err = resRecentReports.status === 'rejected' ? resRecentReports.reason : resRecentReports.value.error;
    errors['recentReports'] = err?.message || 'Gagal memuat laporan terbaru';
  }

  // 3J. Recent Logs
  if (resRecentLogs.status === 'fulfilled' && !resRecentLogs.value.error) {
    const rawLogs = (resRecentLogs.value.data as any[]) || [];
    result.recentModerationLogs = rawLogs.map((l) => {
      const admin = Array.isArray(l.admin) ? l.admin[0] : l.admin;
      return {
        id: l.id,
        action: l.action,
        targetType: l.target_type,
        targetTitle: l.target_title,
        reason: l.reason || '-',
        createdAt: l.created_at,
        adminName: admin?.name || admin?.username || 'Admin',
      };
    });
  } else {
    const err = resRecentLogs.status === 'rejected' ? resRecentLogs.reason : resRecentLogs.value.error;
    errors['recentLogs'] = err?.message || 'Gagal memuat log moderasi';
  }

  result.lastUpdated = new Date().toISOString();
  return result;
}
