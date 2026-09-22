import { getSupabaseClient } from './client';
import { DbModerationLog, DbProfile, DbReport, DbReportStatus, ModerationAction } from './types';
import { Product } from '@/types/market';
import { mapDbProductToUi } from './products';

// Aturan produk terlarang Nepal Market sesuai instruksi
export const PROHIBITED_ITEMS_GUIDELINES = [
  {
    id: 'age_restricted',
    title: 'Rokok, vape, alkohol, dan produk yang dibatasi usia',
    description: 'Segala bentuk produk tembakau, cairan rokok elektrik (liquid vape), pod, serta minuman keras/beralkohol.',
  },
  {
    id: 'drugs',
    title: 'Obat terlarang dan zat berbahaya',
    description: 'Narkotika, psikotropika, obat keras tanpa resep, zat adiktif, bahan kimia berbahaya, atau obat kedaluwarsa.',
  },
  {
    id: 'weapons',
    title: 'Senjata atau barang yang dibuat untuk melukai',
    description: 'Senjata api, senjata tajam ilegal, pemukul, benda tajam yang ditujukan melukai, atau bahan peledak.',
  },
  {
    id: 'adult',
    title: 'Konten dewasa',
    description: 'Materi pornografi, produk seksual, atau gambar/konten eksplisit yang melanggar kesusilaan.',
  },
  {
    id: 'stolen_fake',
    title: 'Barang curian atau palsu',
    description: 'Barang hasil tindak kejahatan, tiruan/replika mengatasnamakan merk asli, atau pelanggaran hak cipta.',
  },
  {
    id: 'spam_scam',
    title: 'Spam, scam, dan listing palsu',
    description: 'Iklan berulang, penipuan transfer/skema cepat kaya, lowongan fiktif, atau barang fiktif.',
  },
] as const;

// Alasan laporan yang diwajibkan oleh instruksi
export const REPORT_REASONS = [
  'Tidak sesuai',
  'Spam',
  'Dugaan penipuan',
  'Konten tidak pantas',
  'Barang terlarang',
  'Lainnya',
] as const;

export type ReportReasonType = (typeof REPORT_REASONS)[number];

export interface AdminUserItem {
  id: string;
  name: string;
  username: string;
  email?: string | null;
  role: string;
  is_suspended: boolean;
  suspension_reason?: string | null;
  avatar_url: string | null;
  phone?: string | null;
  created_at: string;
  products_count?: number;
  active_products_count?: number;
}

export interface AdminProductItem {
  id: string;
  title: string;
  price: number;
  category: string;
  condition: string;
  description?: string | null;
  location?: string | null;
  status: string;
  created_at: string;
  updated_at?: string | null;
  seller_id: string;
  seller: {
    id: string;
    name: string;
    username: string;
    avatar_url: string | null;
    is_suspended?: boolean;
  } | null;
  images: string[];
}

export interface AdminReportItem {
  id: string;
  reporter_id: string;
  product_id: string;
  reason: string;
  description: string | null;
  status: DbReportStatus;
  created_at: string;
  reporter: {
    id: string;
    name: string;
    username: string;
    avatar_url: string | null;
  } | null;
  product: Product | null;
  seller: {
    id: string;
    name: string;
    username: string;
    avatar_url: string | null;
    is_suspended?: boolean;
    suspension_reason?: string | null;
  } | null;
}

// In-memory fallback untuk preview mode (bila Supabase belum terhubung)
const localUsers: AdminUserItem[] = [
  {
    id: 'seller-demo-1',
    name: 'Bayu Saputra',
    username: 'bayusaputra',
    email: 'bayu.saputra@student.nepal.id',
    role: 'user',
    is_suspended: false,
    suspension_reason: null,
    avatar_url: null,
    phone: '081299998888',
    created_at: new Date(Date.now() - 86400 * 1000 * 45).toISOString(),
  },
  {
    id: 'user-demo-reporter',
    name: 'Rian Perdana',
    username: 'rian_p',
    email: 'rian.perdana@student.nepal.id',
    role: 'user',
    is_suspended: false,
    suspension_reason: null,
    avatar_url: null,
    phone: '081377776666',
    created_at: new Date(Date.now() - 86400 * 1000 * 60).toISOString(),
  },
  {
    id: 'user-demo-3',
    name: 'Gita Maharani',
    username: 'gitamaharani',
    email: 'gita.m@student.nepal.id',
    role: 'user',
    is_suspended: false,
    suspension_reason: null,
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    phone: '085711223344',
    created_at: new Date(Date.now() - 86400 * 1000 * 90).toISOString(),
  },
  {
    id: 'admin-1',
    name: 'Tim Moderasi Nepal',
    username: 'admin_nepal',
    email: 'admin@nepalmarket.sch.id',
    role: 'admin',
    is_suspended: false,
    suspension_reason: null,
    avatar_url: null,
    phone: null,
    created_at: new Date(Date.now() - 86400 * 1000 * 120).toISOString(),
  },
];

const localProducts: AdminProductItem[] = [
  {
    id: 'prod-demo-vape',
    title: 'Pod Vape Caliburn Bekas Pakai',
    price: 120000,
    category: 'lainnya',
    condition: 'Bekas - Mulus',
    status: 'active',
    created_at: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
    seller_id: 'seller-demo-1',
    seller: {
      id: 'seller-demo-1',
      name: 'Bayu Saputra',
      username: 'bayusaputra',
      avatar_url: null,
      is_suspended: false,
    },
    images: ['https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=600&q=80'],
  },
  {
    id: 'prod-demo-hoodie',
    title: 'Hoodie Nepal Angkatan 28 Size L',
    price: 85000,
    category: 'fashion',
    condition: 'Bekas - Seperti Baru',
    status: 'active',
    created_at: new Date(Date.now() - 86400 * 1000 * 1).toISOString(),
    seller_id: 'user-demo-3',
    seller: {
      id: 'user-demo-3',
      name: 'Gita Maharani',
      username: 'gitamaharani',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      is_suspended: false,
    },
    images: ['https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80'],
  },
  {
    id: 'prod-demo-kalkulator',
    title: 'Kalkulator Scientific Casio fx-991EX',
    price: 175000,
    category: 'elektronik',
    condition: 'Bekas - Seperti Baru',
    status: 'active',
    created_at: new Date(Date.now() - 86400 * 1000 * 3).toISOString(),
    seller_id: 'seller-demo-1',
    seller: {
      id: 'seller-demo-1',
      name: 'Bayu Saputra',
      username: 'bayusaputra',
      avatar_url: null,
      is_suspended: false,
    },
    images: ['https://images.unsplash.com/photo-1587145820266-a5951ee6f620?w=800&auto=format&fit=crop&q=80'],
  },
  {
    id: 'prod-demo-old',
    title: 'Akun Game Ilegal',
    price: 50000,
    category: 'lainnya',
    condition: 'Bekas - Mulus',
    status: 'hidden',
    created_at: new Date(Date.now() - 86400 * 1000 * 5).toISOString(),
    seller_id: 'seller-demo-1',
    seller: {
      id: 'seller-demo-1',
      name: 'Bayu Saputra',
      username: 'bayusaputra',
      avatar_url: null,
      is_suspended: false,
    },
    images: ['https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&auto=format&fit=crop&q=80'],
  },
];

// In-memory fallback untuk preview mode (bila Supabase belum terhubung)
const localReports: AdminReportItem[] = [
  {
    id: 'rep-demo-1',
    reporter_id: 'user-demo-reporter',
    product_id: 'prod-demo-vape',
    reason: 'Barang terlarang',
    description: 'Produk ini terindikasi pod/liquid vape yang dilarang diperjualbelikan di lingkungan sekolah/pasar.',
    status: 'pending',
    created_at: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
    reporter: {
      id: 'user-demo-reporter',
      name: 'Rian Perdana',
      username: 'rian_p',
      avatar_url: null,
    },
    product: {
      id: 'prod-demo-vape',
      title: 'Pod Vape Caliburn Bekas Pakai',
      description: 'Dijual santai kondisi normal jarang dipakai, coil masih bagus.',
      price: 120000,
      category: 'lainnya',
      condition: 'Bekas - Mulus',
      imageUrl: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=600&q=80',
      images: ['https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=600&q=80'],
      location: 'Parkiran Motor Belakang',
      seller: {
        id: 'seller-demo-1',
        name: 'Bayu Saputra',
        username: 'bayusaputra',
        whatsapp: '081299998888',
        location: 'Parkiran Belakang',
        isVerified: false,
      },
      postedAt: '12 jam lalu',
      isAvailable: true,
      status: 'active',
    },
    seller: {
      id: 'seller-demo-1',
      name: 'Bayu Saputra',
      username: 'bayusaputra',
      avatar_url: null,
      is_suspended: false,
    },
  },
];

const localModerationLogs: DbModerationLog[] = [
  {
    id: 'log-demo-1',
    admin_id: 'admin-1',
    action: 'hide_product',
    target_type: 'product',
    target_id: 'prod-demo-old',
    target_title: 'Akun Game Ilegal',
    reason: 'Spam dan potensi penipuan akun virtual',
    created_at: new Date(Date.now() - 86400 * 1000 * 2).toISOString(),
    admin: {
      id: 'admin-1',
      name: 'Tim Moderasi Nepal',
      username: 'admin_nepal',
      email: 'admin@nepalmarket.sch.id',
      avatar_url: null,
      phone: null,
      instagram: null,
      role: 'admin',
      created_at: new Date(Date.now() - 86400 * 1000 * 30).toISOString(),
    },
  },
];

/**
 * Cek apakah user sudah pernah melaporkan produk ini sebelumnya (mencegah laporan ganda)
 */
export async function checkUserHasReported(
  userId: string,
  productId: string
): Promise<{ hasReported: boolean; error: Error | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    const exists = localReports.some(
      (r) => r.reporter_id === userId && r.product_id === productId
    );
    return { hasReported: exists, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('reports')
      .select('id')
      .eq('reporter_id', userId)
      .eq('product_id', productId)
      .maybeSingle();

    if (error) return { hasReported: false, error };
    return { hasReported: Boolean(data), error: null };
  } catch (err) {
    return { hasReported: false, error: err as Error };
  }
}

/**
 * Kirim laporan produk ke Supabase dengan pencegahan laporan ganda
 */
export async function submitProductReport(
  userId: string,
  productId: string,
  reason: string,
  description?: string,
  productSnapshot?: Product
): Promise<{ success: boolean; alreadyReported?: boolean; error: Error | null }> {
  const supabase = getSupabaseClient();

  // 1. Cek laporan ganda
  const check = await checkUserHasReported(userId, productId);
  if (check.hasReported) {
    return { success: false, alreadyReported: true, error: null };
  }

  if (!supabase) {
    // Mode demo lokal
    const newReport: AdminReportItem = {
      id: `rep-${Date.now()}`,
      reporter_id: userId,
      product_id: productId,
      reason,
      description: description || null,
      status: 'pending',
      created_at: new Date().toISOString(),
      reporter: {
        id: userId,
        name: 'Pelapor Komunitas',
        username: 'pelapor_anda',
        avatar_url: null,
      },
      product: productSnapshot || null,
      seller: productSnapshot ? {
        id: productSnapshot.seller.id || 'seller-unknown',
        name: productSnapshot.seller.name,
        username: productSnapshot.seller.username || 'seller',
        avatar_url: productSnapshot.seller.avatar || null,
        is_suspended: false,
      } : null,
    };
    localReports.unshift(newReport);
    return { success: true, error: null };
  }

  try {
    const { error } = await supabase.from('reports').insert({
      reporter_id: userId,
      product_id: productId,
      reason,
      description: description?.trim() || null,
      status: 'pending',
    });

    if (error) {
      // Postgres error 23505 = unique constraint violation
      if (error.code === '23505' || error.message.includes('unique_reporter_product')) {
        return { success: false, alreadyReported: true, error: null };
      }
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err as Error };
  }
}

/**
 * Mengambil ringkasan data admin dashboard
 */
export async function fetchAdminDashboardData(): Promise<{
  summary: {
    totalProducts: number;
    totalUsers: number;
    pendingReports: number;
    activeProducts: number;
  };
  reports: AdminReportItem[];
  logs: DbModerationLog[];
  products: AdminProductItem[];
  users: AdminUserItem[];
  error: Error | null;
}> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return {
      summary: {
        totalProducts: localProducts.length,
        totalUsers: localUsers.length,
        pendingReports: localReports.filter((r) => r.status === 'pending').length,
        activeProducts: localProducts.filter((p) => p.status === 'active').length,
      },
      reports: localReports,
      logs: localModerationLogs,
      products: localProducts,
      users: localUsers,
      error: null,
    };
  }

  try {
    // 1. Fetch counts
    const [productsCountRes, usersCountRes, pendingReportsCountRes, activeProductsCountRes] = await Promise.all([
      supabase.from('products').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('products').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    ]);

    // 2. Fetch reports with reporter, product, and seller
    const { data: rawReports, error: reportsErr } = await supabase
      .from('reports')
      .select(`
        id,
        reporter_id,
        product_id,
        reason,
        description,
        status,
        created_at,
        reporter:profiles!reporter_id(id, name, username, avatar_url),
        product:products!product_id(
          id,
          seller_id,
          title,
          description,
          price,
          category,
          condition,
          location,
          status,
          created_at,
          updated_at,
          seller:profiles!seller_id(id, name, username, avatar_url, phone, instagram, role, is_suspended, suspension_reason, created_at),
          product_images(id, product_id, image_url, sort_order)
        )
      `)
      .order('created_at', { ascending: false });

    if (reportsErr) {
      console.warn('Gagal memuat reports admin dari Supabase:', reportsErr.message);
    }

    // Supabase's generated nested relation shape mapped safely to AdminReportItem
    const formattedReports: AdminReportItem[] = (rawReports as unknown as Array<{
      id: string;
      reporter_id: string;
      product_id: string;
      reason: string;
      description: string | null;
      status: DbReportStatus;
      created_at: string;
      reporter?: {
        id: string;
        name: string;
        username: string;
        avatar_url: string | null;
      } | null;
      product?: Parameters<typeof mapDbProductToUi>[0];
    }> || []).map((r) => {
      const p = r.product;
      const productUi = p ? mapDbProductToUi(p) : null;
      const seller = p?.seller || null;
      return {
        id: r.id,
        reporter_id: r.reporter_id,
        product_id: r.product_id,
        reason: r.reason,
        description: r.description,
        status: r.status,
        created_at: r.created_at,
        reporter: r.reporter || null,
        product: productUi,
        seller: seller ? {
          id: seller.id,
          name: seller.name,
          username: seller.username,
          avatar_url: seller.avatar_url,
          is_suspended: Boolean(seller.is_suspended),
          suspension_reason: seller.suspension_reason || null,
        } : null,
      };
    });

    // 3. Fetch moderation logs
    const { data: rawLogs } = await supabase
      .from('moderation_logs')
      .select(`
        id,
        admin_id,
        action,
        target_type,
        target_id,
        target_title,
        reason,
        created_at,
        admin:profiles!admin_id(id, name, username, avatar_url, role)
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    // 4. Fetch products for management
    const { data: rawProducts } = await supabase
      .from('products')
      .select(`
        id,
        seller_id,
        title,
        price,
        category,
        condition,
        description,
        location,
        status,
        created_at,
        updated_at,
        seller:profiles!seller_id(id, name, username, avatar_url, is_suspended),
        product_images(image_url, sort_order)
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    const formattedProducts: AdminProductItem[] = (rawProducts || []).map((p: any) => ({
      id: p.id,
      title: p.title,
      price: Number(p.price),
      category: p.category,
      condition: p.condition,
      description: p.description || null,
      location: p.location || null,
      status: p.status,
      created_at: p.created_at,
      updated_at: p.updated_at || null,
      seller_id: p.seller_id,
      seller: p.seller ? {
        id: p.seller.id,
        name: p.seller.name,
        username: p.seller.username,
        avatar_url: p.seller.avatar_url,
        is_suspended: p.seller.is_suspended,
      } : null,
      images: (p.product_images || [])
        .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
        .map((img: any) => img.image_url),
    }));

    // 5. Fetch profiles for user management
    const { data: rawUsers } = await supabase
      .from('profiles')
      .select('id, name, username, email, role, is_suspended, suspension_reason, avatar_url, phone, created_at')
      .order('created_at', { ascending: false })
      .limit(100);

    // Hitung jumlah produk per pengguna dari daftar produk yang diambil
    const userProductCounts: Record<string, { total: number; active: number }> = {};
    for (const p of formattedProducts) {
      if (p.seller_id) {
        if (!userProductCounts[p.seller_id]) {
          userProductCounts[p.seller_id] = { total: 0, active: 0 };
        }
        userProductCounts[p.seller_id].total += 1;
        if (p.status === 'active') {
          userProductCounts[p.seller_id].active += 1;
        }
      }
    }

    const formattedUsers: AdminUserItem[] = (rawUsers || []).map((u: any) => {
      const counts = userProductCounts[u.id] || { total: 0, active: 0 };
      return {
        id: u.id,
        name: u.name,
        username: u.username,
        email: u.email,
        role: u.role || 'user',
        is_suspended: Boolean(u.is_suspended),
        suspension_reason: u.suspension_reason,
        avatar_url: u.avatar_url,
        phone: u.phone,
        created_at: u.created_at || new Date().toISOString(),
        products_count: counts.total,
        active_products_count: counts.active,
      };
    });

    return {
      summary: {
        totalProducts: productsCountRes.count ?? formattedProducts.length,
        totalUsers: usersCountRes.count ?? formattedUsers.length,
        pendingReports: pendingReportsCountRes.count ?? formattedReports.filter(r => r.status === 'pending').length,
        activeProducts: activeProductsCountRes.count ?? formattedProducts.filter(p => p.status === 'active').length,
      },
      reports: formattedReports,
      logs: (rawLogs as unknown as DbModerationLog[]) || [],
      products: formattedProducts,
      users: formattedUsers,
      error: null,
    };
  } catch (err) {
    return {
      summary: {
        totalProducts: localProducts.length,
        totalUsers: localUsers.length,
        pendingReports: localReports.filter(r => r.status === 'pending').length,
        activeProducts: localProducts.filter(p => p.status === 'active').length,
      },
      reports: localReports,
      logs: localModerationLogs,
      products: localProducts,
      users: localUsers,
      error: err as Error,
    };
  }
}

/**
 * Mencatat log aksi moderasi admin
 */
async function recordModerationLog(
  adminId: string,
  action: ModerationAction,
  targetType: 'product' | 'profile' | 'report',
  targetId: string,
  targetTitle: string | null,
  reason: string
) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    localModerationLogs.unshift({
      id: `log-${Date.now()}`,
      admin_id: adminId,
      action,
      target_type: targetType,
      target_id: targetId,
      target_title: targetTitle,
      reason,
      created_at: new Date().toISOString(),
    });
    return;
  }

  try {
    await supabase.from('moderation_logs').insert({
      admin_id: adminId,
      action,
      target_type: targetType,
      target_id: targetId,
      target_title: targetTitle,
      reason,
    });
  } catch (e) {
    console.warn('Gagal mencatat log moderasi:', e);
  }
}

/**
 * Sembunyikan produk (status: 'hidden')
 */
export async function adminHideProduct(
  adminId: string,
  productId: string,
  productTitle: string,
  reason: string
): Promise<{ success: boolean; error: Error | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    const r = localReports.find((item) => item.product?.id === productId);
    if (r && r.product) r.product.status = 'hidden';
    const lp = localProducts.find((item) => item.id === productId);
    if (lp) lp.status = 'hidden';
    await recordModerationLog(adminId, 'hide_product', 'product', productId, productTitle, reason);
    return { success: true, error: null };
  }

  try {
    const { error } = await supabase
      .from('products')
      .update({ status: 'hidden', updated_at: new Date().toISOString() })
      .eq('id', productId);

    if (error) return { success: false, error };

    await recordModerationLog(adminId, 'hide_product', 'product', productId, productTitle, reason);
    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err as Error };
  }
}

/**
 * Hapus produk oleh admin (status: 'removed')
 */
export async function adminRemoveProduct(
  adminId: string,
  productId: string,
  productTitle: string,
  reason: string
): Promise<{ success: boolean; error: Error | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    const r = localReports.find((item) => item.product?.id === productId);
    if (r && r.product) r.product.status = 'removed';
    const lp = localProducts.find((item) => item.id === productId);
    if (lp) lp.status = 'removed';
    await recordModerationLog(adminId, 'remove_product', 'product', productId, productTitle, reason);
    return { success: true, error: null };
  }

  try {
    const { error } = await supabase
      .from('products')
      .update({ status: 'removed', updated_at: new Date().toISOString() })
      .eq('id', productId);

    if (error) return { success: false, error };

    await recordModerationLog(adminId, 'remove_product', 'product', productId, productTitle, reason);
    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err as Error };
  }
}

/**
 * Kembalikan produk menjadi aktif (status: 'active')
 */
export async function adminRestoreProduct(
  adminId: string,
  productId: string,
  productTitle: string,
  reason: string
): Promise<{ success: boolean; error: Error | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    const r = localReports.find((item) => item.product?.id === productId);
    if (r && r.product) r.product.status = 'active';
    const lp = localProducts.find((item) => item.id === productId);
    if (lp) lp.status = 'active';
    await recordModerationLog(adminId, 'restore_product', 'product', productId, productTitle, reason);
    return { success: true, error: null };
  }

  try {
    const { error } = await supabase
      .from('products')
      .update({ status: 'active', updated_at: new Date().toISOString() })
      .eq('id', productId);

    if (error) return { success: false, error };

    await recordModerationLog(adminId, 'restore_product', 'product', productId, productTitle, reason);
    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err as Error };
  }
}

/**
 * Nonaktifkan (suspend) atau pulihkan akun seller jika diperlukan
 */
export async function adminToggleSellerSuspension(
  adminId: string,
  sellerId: string,
  sellerName: string,
  suspend: boolean,
  reason: string
): Promise<{ success: boolean; error: Error | null }> {
  const action: ModerationAction = suspend ? 'suspend_user' : 'unsuspend_user';
  const supabase = getSupabaseClient();

  if (!supabase) {
    for (const r of localReports) {
      if (r.seller?.id === sellerId) {
        r.seller.is_suspended = suspend;
        r.seller.suspension_reason = suspend ? reason : null;
      }
    }
    const lu = localUsers.find((u) => u.id === sellerId);
    if (lu) {
      lu.is_suspended = suspend;
      lu.suspension_reason = suspend ? reason : null;
    }
    await recordModerationLog(adminId, action, 'profile', sellerId, sellerName, reason);
    return { success: true, error: null };
  }

  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        is_suspended: suspend,
        suspension_reason: suspend ? reason : null,
      })
      .eq('id', sellerId);

    if (error) return { success: false, error };

    await recordModerationLog(adminId, action, 'profile', sellerId, sellerName, reason);
    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err as Error };
  }
}

/**
 * Update status laporan (misal: 'reviewed', 'resolved', 'pending')
 */
export async function adminUpdateReportStatus(
  adminId: string,
  reportId: string,
  newStatus: DbReportStatus,
  actionNotes?: string
): Promise<{ success: boolean; error: Error | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    const r = localReports.find((item) => item.id === reportId);
    if (r) r.status = newStatus;
    if (actionNotes) {
      const actionType = newStatus === 'resolved' ? 'resolve_report' : newStatus === 'reviewed' ? 'review_report' : 'dismiss_report';
      await recordModerationLog(
        adminId,
        actionType,
        'report',
        reportId,
        `Laporan #${reportId.slice(0, 8)}`,
        actionNotes
      );
    }
    return { success: true, error: null };
  }

  try {
    const { error } = await supabase
      .from('reports')
      .update({ status: newStatus })
      .eq('id', reportId);

    if (error) return { success: false, error };

    if (actionNotes) {
      const actionType = newStatus === 'resolved' ? 'resolve_report' : newStatus === 'reviewed' ? 'review_report' : 'dismiss_report';
      await recordModerationLog(
        adminId,
        actionType,
        'report',
        reportId,
        `Laporan #${reportId.slice(0, 8)}`,
        actionNotes
      );
    }

    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err as Error };
  }
}
