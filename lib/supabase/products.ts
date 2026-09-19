import { getSupabaseClient } from './client';
import { DbCondition, DbProduct, DbProductStatus } from './types';
import { Product, ProductCondition, CategorySlug } from '@/types/market';

// Map antara UI condition dan DB condition
export function mapUiConditionToDb(condition: ProductCondition): DbCondition {
  if (condition === 'Baru') return 'new';
  if (condition === 'Bekas - Seperti Baru') return 'like_new';
  return 'used';
}

export function mapDbConditionToUi(condition: string): ProductCondition {
  if (condition === 'new') return 'Baru';
  if (condition === 'like_new') return 'Bekas - Seperti Baru';
  if (condition === 'used') return 'Bekas - Mulus';
  return 'Bekas - Mulus';
}

// Format waktu relatif (misal: "5 menit lalu", "2 jam lalu", "Kemarin")
export function formatTimeAgo(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffMin < 2) return 'Baru saja';
    if (diffMin < 60) return `${diffMin} menit lalu`;
    if (diffHour < 24) return `${diffHour} jam lalu`;
    if (diffDay === 1) return 'Kemarin';
    if (diffDay < 7) return `${diffDay} hari lalu`;
    
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  } catch {
    return 'Baru saja';
  }
}

// Konversi DbProduct dari Supabase ke model Product UI
export function mapDbProductToUi(db: DbProduct): Product {
  const images = (db.product_images && db.product_images.length > 0)
    ? db.product_images.sort((a, b) => a.sort_order - b.sort_order).map((img) => img.image_url)
    : ['https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80'];

  const primaryImage = images[0];

  return {
    id: db.id,
    title: db.title,
    price: Number(db.price),
    category: (db.category as CategorySlug) || 'lainnya',
    condition: mapDbConditionToUi(db.condition),
    imageUrl: primaryImage,
    images: images,
    location: db.location || 'Kantin Utama',
    postedAt: formatTimeAgo(db.created_at),
    seller: {
      id: db.seller?.id || db.seller_id,
      name: db.seller?.name || 'Warga Nepal',
      avatar: db.seller?.avatar_url || undefined,
      location: db.location || 'Area Sekitar',
      joinedDate: db.seller?.created_at ? new Date(db.seller.created_at).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) : '2024',
      activeListingsCount: 1,
      whatsapp: db.seller?.phone || undefined,
      instagram: db.seller?.instagram || undefined,
      isVerified: db.seller?.role === 'admin' || false,
    },
    description: db.description || 'Tidak ada deskripsi barang.',
    isAvailable: db.status === 'active',
    isSold: db.status === 'sold',
  };
}

// Ambil semua produk aktif dari Supabase
export async function fetchActiveProducts(): Promise<{ products: Product[]; error: Error | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { products: [], error: new Error('Supabase belum dikonfigurasi') };
  }

  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
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
        seller:profiles!seller_id(id, name, username, avatar_url, phone, instagram, role, created_at),
        product_images(id, product_id, image_url, sort_order)
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetchActiveProducts:', error);
      return { products: [], error };
    }

    const mapped = (data as unknown as DbProduct[]).map(mapDbProductToUi);
    return { products: mapped, error: null };
  } catch (err: unknown) {
    return { products: [], error: err as Error };
  }
}

// Ambil single produk dari Supabase berdasarkan ID
export async function fetchProductById(id: string): Promise<{ product: Product | null; error: Error | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { product: null, error: new Error('Supabase belum dikonfigurasi') };
  }

  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
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
        seller:profiles!seller_id(id, name, username, avatar_url, phone, instagram, role, created_at),
        product_images(id, product_id, image_url, sort_order)
      `)
      .eq('id', id)
      .single();

    if (error) {
      return { product: null, error };
    }

    return { product: mapDbProductToUi(data as unknown as DbProduct), error: null };
  } catch (err: unknown) {
    return { product: null, error: err as Error };
  }
}

// Ambil produk milik seller tertentu
export async function fetchProductsBySellerId(sellerId: string): Promise<{ products: Product[]; error: Error | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { products: [], error: new Error('Supabase belum dikonfigurasi') };

  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
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
        seller:profiles!seller_id(id, name, username, avatar_url, phone, instagram, role, created_at),
        product_images(id, product_id, image_url, sort_order)
      `)
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });

    if (error) return { products: [], error };
    return { products: (data as unknown as DbProduct[]).map(mapDbProductToUi), error: null };
  } catch (err: unknown) {
    return { products: [], error: err as Error };
  }
}

// Buat produk baru ke Supabase
export interface CreateProductInput {
  sellerId: string;
  title: string;
  description: string;
  price: number;
  category: CategorySlug;
  condition: ProductCondition;
  location: string;
  images: File[];
  contactPhone?: string;
}

export async function createProductInDb(input: CreateProductInput): Promise<{ product: Product | null; error: Error | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { product: null, error: new Error('Supabase belum dikonfigurasi di .env.local') };
  }

  try {
    if (input.images.length < 1 || input.images.length > 5 ||
        input.images.some((file) => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024)) {
      return { product: null, error: new Error('Pilih 1–5 foto JPG, PNG, atau WebP (maksimal 5 MB per foto).') };
    }
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user || authData.user.id !== input.sellerId) {
      return { product: null, error: new Error('Masuk kembali sebelum menjual barang.') };
    }
    const { data: sellerProfile, error: sellerError } = await supabase.from('profiles')
      .select('phone, instagram').eq('id', input.sellerId).single();
    if (sellerError) return { product: null, error: sellerError };
    const phone = input.contactPhone?.trim().replace(/\D/g, '').replace(/^0/, '62') || sellerProfile?.phone;
    if (!phone && !sellerProfile?.instagram) {
      return { product: null, error: new Error('Isi nomor WhatsApp agar pembeli bisa menghubungimu.') };
    }
    if (phone && !/^62\d{8,13}$/.test(phone)) {
      return { product: null, error: new Error('Masukkan nomor WhatsApp yang valid, misalnya 081234567890.') };
    }
    if (phone && phone !== sellerProfile?.phone) {
      const { error: contactError } = await supabase.from('profiles').update({ phone }).eq('id', input.sellerId);
      if (contactError) return { product: null, error: contactError };
    }
    // 1. Insert ke tabel products
    const { data: productData, error: productError } = await supabase
      .from('products')
      .insert({
        seller_id: input.sellerId,
        title: input.title.trim(),
        description: input.description.trim(),
        price: input.price,
        category: input.category,
        condition: mapUiConditionToDb(input.condition),
        location: input.location.trim() || 'Kantin Utama',
        status: 'draft',
      })
      .select()
      .single();

    if (productError || !productData) {
      return { product: null, error: productError };
    }

    // Foto diunggah ke folder milik seller dan produk ini.
    const uploadedPaths: string[] = [];
    const imageRows: { product_id: string; image_url: string; sort_order: number }[] = [];
    for (const [index, file] of input.images.entries()) {
      const extension = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
      const path = `${input.sellerId}/${productData.id}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from('product-images').upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) {
        await supabase.storage.from('product-images').remove(uploadedPaths);
        await supabase.from('products').delete().eq('id', productData.id);
        return { product: null, error: uploadError };
      }
      uploadedPaths.push(path);
      imageRows.push({ product_id: productData.id, image_url: supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl, sort_order: index });
    }
    const { error: imagesError } = await supabase.from('product_images').insert(imageRows);
    if (imagesError) {
      await supabase.storage.from('product-images').remove(uploadedPaths);
      await supabase.from('products').delete().eq('id', productData.id);
      return { product: null, error: imagesError };
    }
    const { error: publishError } = await supabase.from('products').update({ status: 'active' }).eq('id', productData.id);
    if (publishError) {
      await supabase.storage.from('product-images').remove(uploadedPaths);
      await supabase.from('products').delete().eq('id', productData.id);
      return { product: null, error: publishError };
    }

    // 3. Ambil produk lengkap dengan join
    return await fetchProductById(productData.id);
  } catch (err: unknown) {
    return { product: null, error: err as Error };
  }
}

// Perbarui status produk (misal: ubah jadi sold atau hapus)
export async function updateProductStatusInDb(productId: string, status: DbProductStatus): Promise<{ success: boolean; error: Error | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { success: false, error: new Error('Supabase belum dikonfigurasi') };

  try {
    const { error } = await supabase
      .from('products')
      .update({ status })
      .eq('id', productId);

    if (error) return { success: false, error };
    return { success: true, error: null };
  } catch (err: unknown) {
    return { success: false, error: err as Error };
  }
}

// Hapus produk
export async function deleteProductFromDb(productId: string): Promise<{ success: boolean; error: Error | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { success: false, error: new Error('Supabase belum dikonfigurasi') };

  try {
    const { data: authData } = await supabase.auth.getUser();
    const sellerId = authData.user?.id;
    if (!sellerId) return { success: false, error: new Error('Masuk kembali sebelum menghapus barang.') };
    const { data: ownedProduct } = await supabase.from('products').select('id')
      .eq('id', productId).eq('seller_id', sellerId).maybeSingle();
    if (!ownedProduct) return { success: false, error: new Error('Barang ini bukan milikmu.') };
    const { data: imageRows, error: imageError } = await supabase.from('product_images')
      .select('image_url').eq('product_id', productId);
    if (imageError) return { success: false, error: imageError };
    const marker = '/storage/v1/object/public/product-images/';
    const paths = (imageRows ?? []).flatMap(({ image_url }) => {
      const path = image_url.split(marker)[1]?.split('?')[0];
      return path?.startsWith(`${sellerId}/${productId}/`) ? [decodeURIComponent(path)] : [];
    });
    if (paths.length) {
      const { error: storageError } = await supabase.storage.from('product-images').remove(paths);
      if (storageError) return { success: false, error: storageError };
    }
    const { data: deleted, error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)
      .eq('seller_id', sellerId)
      .select('id');

    if (error || !deleted?.length) return { success: false, error: error ?? new Error('Barang tidak berhasil dihapus.') };
    return { success: true, error: null };
  } catch (err: unknown) {
    return { success: false, error: err as Error };
  }
}

// FAVORITES HELPERS
export async function fetchUserFavoriteIds(userId: string): Promise<string[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('favorites')
      .select('product_id')
      .eq('user_id', userId);

    if (error || !data) return [];
    return data.map((item) => item.product_id);
  } catch {
    return [];
  }
}

export async function toggleFavoriteInDb(userId: string, productId: string, isCurrentlySaved: boolean): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    if (isCurrentlySaved) {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('product_id', productId);
      return !error;
    } else {
      const { error } = await supabase
        .from('favorites')
        .insert({
          user_id: userId,
          product_id: productId,
        });
      return !error;
    }
  } catch {
    return false;
  }
}

// REPORTS HELPER
export async function submitReportToDb(
  reporterId: string,
  productId: string,
  reason: string,
  description?: string
): Promise<{ success: boolean; error: Error | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { success: false, error: new Error('Supabase belum dikonfigurasi') };

  try {
    const { error } = await supabase
      .from('reports')
      .insert({
        reporter_id: reporterId,
        product_id: productId,
        reason,
        description: description || null,
        status: 'pending',
      });

    if (error) return { success: false, error };
    return { success: true, error: null };
  } catch (err: unknown) {
    return { success: false, error: err as Error };
  }
}
