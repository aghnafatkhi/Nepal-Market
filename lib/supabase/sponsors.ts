import { getSupabaseClient, isSupabaseConfigured } from './client';
import { DbSponsorBanner, DbSponsorBannerStatus } from './types';
import { SPONSOR_BANNERS } from '@/data/banners';

export type SponsorScheduleStatus = 'live' | 'scheduled' | 'ended' | 'inactive' | 'draft';

export interface CreateSponsorBannerInput {
  sponsor_name: string;
  desktop_image_url: string;
  mobile_image_url: string;
  target_url: string;
  alt_text: string;
  status: DbSponsorBannerStatus;
  starts_at: string | null;
  ends_at: string | null;
  sort_order: number;
}

export interface UpdateSponsorBannerInput extends Partial<CreateSponsorBannerInput> {
  id: string;
}

/**
 * 7 Pedoman Larangan Materi Konten Sponsor Nepal Market
 */
export const PROHIBITED_SPONSOR_GUIDELINES = [
  {
    id: 'tobacco_vape',
    title: 'Rokok dan Vape',
    description: 'Dilarang mempromosikan produk tembakau, rokok elektrik, cerutu, pod, liquid vape, dan perlengkapan terkait lainnya.',
  },
  {
    id: 'alcohol',
    title: 'Alkohol',
    description: 'Dilarang mempromosikan segala bentuk minuman beralkohol, bir, wine, miras oplosan, atau minuman keras apa pun.',
  },
  {
    id: 'gambling',
    title: 'Judi dan Taruhan',
    description: 'Dilarang keras mempromosikan situs judi online, slot, kasino, taruhan olahraga, undian ilegal, atau game bertaruh uang.',
  },
  {
    id: 'adult_content',
    title: 'Konten Dewasa',
    description: 'Dilarang menyajikan materi vulgar, pornografi, jasa kencan dewasa, pakaian/alat bertema sensual, atau konten eksplisit 18+.',
  },
  {
    id: 'dangerous_drugs',
    title: 'Obat atau Barang Berbahaya',
    description: 'Dilarang mempromosikan narkotika, obat keras tanpa resep resmi, zat adiktif, senjata tajam/api, dan bahan kimia berbahaya.',
  },
  {
    id: 'scam_get_rich_quick',
    title: 'Penipuan dan Skema Cepat Kaya',
    description: 'Dilarang mempromosikan skema ponzi, investasi bodong, pinjol ilegal, MLM manipulatif, dan iming-iming cepat kaya tanpa usaha.',
  },
  {
    id: 'school_inappropriate',
    title: 'Sponsor Tidak Sesuai Lingkungan Sekolah',
    description: 'Dilarang memuat materi SARA, kekerasan, kebencian, perundungan, atau iklan yang merusak etika dan moral warga sekolah.',
  },
];

/**
 * Validasi jenis MIME file gambar yang diperbolehkan
 */
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Validasi file gambar sebelum proses upload
 */
export function validateSponsorImageFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Format file tidak didukung. Harap gunakan format JPG, PNG, WebP, atau AVIF.',
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: 'Ukuran file melebihi batas maksimal 5 MB.',
    };
  }

  return { valid: true };
}

/**
 * Menghitung status jadwal penayangan suatu banner
 */
export function getSponsorScheduleStatus(
  banner: Pick<DbSponsorBanner, 'status' | 'starts_at' | 'ends_at'>,
  now: Date = new Date()
): SponsorScheduleStatus {
  if (banner.status === 'draft') return 'draft';
  if (banner.status === 'inactive') return 'inactive';

  // Status is 'active'
  const currentTime = now.getTime();
  if (banner.starts_at) {
    const startTime = new Date(banner.starts_at).getTime();
    if (startTime > currentTime) return 'scheduled';
  }

  if (banner.ends_at) {
    const endTime = new Date(banner.ends_at).getTime();
    if (endTime < currentTime) return 'ended';
  }

  return 'live';
}

/**
 * Ekstrak path storage dari Public URL Supabase
 */
export function extractStoragePath(publicUrl: string, bucketName: string = 'sponsor-banners'): string | null {
  try {
    const marker = `/${bucketName}/`;
    const idx = publicUrl.indexOf(marker);
    if (idx !== -1) {
      return decodeURIComponent(publicUrl.substring(idx + marker.length));
    }
    return null;
  } catch {
    return null;
  }
}

// ==============================================================================
// LOCAL MOCK STATE (Fallback jika Supabase belum terhubung di runtime preview)
// ==============================================================================
let mockSponsors: DbSponsorBanner[] = SPONSOR_BANNERS.map((banner, index) => ({
  id: banner.id,
  sponsor_name: banner.sponsorName,
  desktop_image_url: banner.desktopImage,
  mobile_image_url: banner.mobileImage,
  target_url: banner.targetUrl,
  alt_text: banner.alt || banner.sponsorName,
  status: banner.active ? 'active' : 'inactive',
  starts_at: banner.startsAt || null,
  ends_at: banner.endsAt || null,
  sort_order: index * 10,
  created_by: '00000000-0000-0000-0000-000000000001',
  created_at: new Date(Date.now() - (index + 1) * 86400000).toISOString(),
  updated_at: new Date(Date.now() - index * 86400000).toISOString(),
}));

/**
 * Mengambil seluruh daftar sponsor untuk panel admin
 */
export async function fetchAdminSponsorBanners(): Promise<{
  data: DbSponsorBanner[];
  error: Error | null;
}> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    // Kembalikan mock data yang diurutkan
    const sorted = [...mockSponsors].sort((a, b) => {
      if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    return { data: sorted, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('sponsor_banners')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      return { data: [], error: new Error(error.message) };
    }

    return { data: (data as DbSponsorBanner[]) || [], error: null };
  } catch (err: unknown) {
    return { data: [], error: err as Error };
  }
}

/**
 * Mengambil banner aktif yang sedang berada dalam jadwal tayang untuk homepage.
 * Jangan gunakan data mock ketika Supabase sudah dikonfigurasi agar kegagalan
 * produksi tidak tersamarkan sebagai iklan sungguhan.
 */
export async function fetchActivePublicSponsorBanners(): Promise<{
  data: DbSponsorBanner[];
  error: Error | null;
}> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    const activeMockSponsors = mockSponsors
      .filter((banner) => getSponsorScheduleStatus(banner) === 'live')
      .sort((a, b) => a.sort_order - b.sort_order);
    return { data: activeMockSponsors, error: null };
  }

  const now = new Date().toISOString();

  try {
    const { data, error } = await supabase
      .from('sponsor_banners')
      .select('*')
      .eq('status', 'active')
      .or(`starts_at.is.null,starts_at.lte.${now}`)
      .or(`ends_at.is.null,ends_at.gte.${now}`)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) return { data: [], error: new Error(error.message) };
    return { data: (data as DbSponsorBanner[]) || [], error: null };
  } catch (err: unknown) {
    return { data: [], error: err as Error };
  }
}

/**
 * Upload gambar sponsor ke bucket `sponsor-banners` di Supabase Storage
 */
export async function uploadSponsorBannerImage(
  file: File,
  prefix: 'desktop' | 'mobile',
  onProgress?: (pct: number) => void
): Promise<{ url: string | null; error: Error | null }> {
  // 1. Validasi file
  const validation = validateSponsorImageFile(file);
  if (!validation.valid) {
    return { url: null, error: new Error(validation.error) };
  }

  onProgress?.(15);

  const supabase = getSupabaseClient();
  if (!supabase) {
    // Mode offline / mock: Buat data URL atau blob URL lokal
    onProgress?.(50);
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        onProgress?.(100);
        resolve({ url: reader.result as string, error: null });
      };
      reader.onerror = () => {
        resolve({ url: null, error: new Error('Gagal membaca file gambar lokal.') });
      };
      reader.readAsDataURL(file);
    });
  }

  try {
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'webp';
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const randomKey = Math.random().toString(36).substring(2, 9);
    const filePath = `banners/${prefix}_${Date.now()}_${randomKey}_${cleanFileName}`;

    onProgress?.(40);

    const { error: uploadError } = await supabase.storage
      .from('sponsor-banners')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      return { url: null, error: uploadError };
    }

    onProgress?.(85);

    const { data: publicData } = supabase.storage
      .from('sponsor-banners')
      .getPublicUrl(filePath);

    onProgress?.(100);
    return { url: publicData.publicUrl, error: null };
  } catch (err: unknown) {
    return { url: null, error: err as Error };
  }
}

/**
 * Menambahkan data sponsor baru
 */
export async function createSponsorBanner(
  input: CreateSponsorBannerInput
): Promise<{ data: DbSponsorBanner | null; error: Error | null }> {
  // Validasi URL HTTPS
  if (!/^https:\/\//i.test(input.target_url.trim())) {
    return { data: null, error: new Error('URL tujuan wajib menggunakan protokol HTTPS (misal: https://...)') };
  }

  // Validasi Jadwal
  if (input.starts_at && input.ends_at) {
    if (new Date(input.ends_at) <= new Date(input.starts_at)) {
      return { data: null, error: new Error('Waktu berakhir harus lebih akhir daripada waktu mulai.') };
    }
  }

  // Validasi Sort Order
  if (input.sort_order < 0) {
    return { data: null, error: new Error('Urutan tampil tidak boleh berupa angka negatif.') };
  }

  const supabase = getSupabaseClient();

  if (!supabase) {
    const newBanner: DbSponsorBanner = {
      id: `sponsor-${Date.now()}`,
      sponsor_name: input.sponsor_name.trim(),
      desktop_image_url: input.desktop_image_url,
      mobile_image_url: input.mobile_image_url,
      target_url: input.target_url.trim(),
      alt_text: input.alt_text.trim(),
      status: input.status,
      starts_at: input.starts_at,
      ends_at: input.ends_at,
      sort_order: input.sort_order,
      created_by: '00000000-0000-0000-0000-000000000001',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockSponsors = [newBanner, ...mockSponsors];
    return { data: newBanner, error: null };
  }

  try {
    const { data: authData } = await supabase.auth.getUser();

    const insertPayload = {
      sponsor_name: input.sponsor_name.trim(),
      desktop_image_url: input.desktop_image_url,
      mobile_image_url: input.mobile_image_url,
      target_url: input.target_url.trim(),
      alt_text: input.alt_text.trim(),
      status: input.status,
      starts_at: input.starts_at || null,
      ends_at: input.ends_at || null,
      sort_order: input.sort_order,
      created_by: authData?.user?.id || null,
    };

    const { data, error } = await supabase
      .from('sponsor_banners')
      .insert(insertPayload)
      .select('*')
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data: data as DbSponsorBanner, error: null };
  } catch (err: unknown) {
    return { data: null, error: err as Error };
  }
}

/**
 * Memperbarui data sponsor yang ada
 */
export async function updateSponsorBanner(
  id: string,
  input: Partial<CreateSponsorBannerInput>
): Promise<{ data: DbSponsorBanner | null; error: Error | null }> {
  if (input.target_url && !/^https:\/\//i.test(input.target_url.trim())) {
    return { data: null, error: new Error('URL tujuan wajib menggunakan protokol HTTPS (misal: https://...)') };
  }

  if (input.starts_at && input.ends_at) {
    if (new Date(input.ends_at) <= new Date(input.starts_at)) {
      return { data: null, error: new Error('Waktu berakhir harus lebih akhir daripada waktu mulai.') };
    }
  }

  if (input.sort_order !== undefined && input.sort_order < 0) {
    return { data: null, error: new Error('Urutan tampil tidak boleh bernilai negatif.') };
  }

  const supabase = getSupabaseClient();

  if (!supabase) {
    const index = mockSponsors.findIndex((s) => s.id === id);
    if (index === -1) {
      return { data: null, error: new Error('Sponsor tidak ditemukan.') };
    }
    mockSponsors[index] = {
      ...mockSponsors[index],
      ...input,
      updated_at: new Date().toISOString(),
    };
    return { data: mockSponsors[index], error: null };
  }

  try {
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (input.sponsor_name !== undefined) updatePayload.sponsor_name = input.sponsor_name.trim();
    if (input.desktop_image_url !== undefined) updatePayload.desktop_image_url = input.desktop_image_url;
    if (input.mobile_image_url !== undefined) updatePayload.mobile_image_url = input.mobile_image_url;
    if (input.target_url !== undefined) updatePayload.target_url = input.target_url.trim();
    if (input.alt_text !== undefined) updatePayload.alt_text = input.alt_text.trim();
    if (input.status !== undefined) updatePayload.status = input.status;
    if (input.starts_at !== undefined) updatePayload.starts_at = input.starts_at || null;
    if (input.ends_at !== undefined) updatePayload.ends_at = input.ends_at || null;
    if (input.sort_order !== undefined) updatePayload.sort_order = input.sort_order;

    const { data, error } = await supabase
      .from('sponsor_banners')
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data: data as DbSponsorBanner, error: null };
  } catch (err: unknown) {
    return { data: null, error: err as Error };
  }
}

/**
 * Toggle cepat status sponsor antara 'active' dan 'inactive'
 */
export async function toggleSponsorBannerStatus(
  id: string,
  newStatus: 'active' | 'inactive'
): Promise<{ success: boolean; error: Error | null }> {
  return await updateSponsorBanner(id, { status: newStatus }).then((res) => ({
    success: !!res.data,
    error: res.error,
  }));
}

/**
 * Menghapus sponsor beserta gambar dari Supabase Storage jika gambar tidak dipakai baris lain
 */
export async function deleteSponsorBanner(
  id: string
): Promise<{ success: boolean; error: Error | null }> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    mockSponsors = mockSponsors.filter((s) => s.id !== id);
    return { success: true, error: null };
  }

  try {
    // 1. Ambil data sponsor yang akan dihapus untuk mencatat URL gambarnya
    const { data: bannerToDelete, error: fetchErr } = await supabase
      .from('sponsor_banners')
      .select('desktop_image_url, mobile_image_url')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr) {
      return { success: false, error: fetchErr };
    }

    // 2. Hapus baris dari tabel sponsor_banners
    const { error: deleteErr } = await supabase
      .from('sponsor_banners')
      .delete()
      .eq('id', id);

    if (deleteErr) {
      return { success: false, error: deleteErr };
    }

    // 3. Bersihkan gambar dari Storage jika tidak digunakan banner lain
    if (bannerToDelete) {
      const urlsToCheck = [bannerToDelete.desktop_image_url, bannerToDelete.mobile_image_url];
      const pathsToDelete: string[] = [];

      for (const url of urlsToCheck) {
        if (!url) continue;
        const path = extractStoragePath(url, 'sponsor-banners');
        if (!path) continue;

        // Cek apakah ada record lain yang memakai URL ini
        const { count } = await supabase
          .from('sponsor_banners')
          .select('id', { count: 'exact', head: true })
          .or(`desktop_image_url.eq.${url},mobile_image_url.eq.${url}`);

        if ((count || 0) === 0) {
          pathsToDelete.push(path);
        }
      }

      if (pathsToDelete.length > 0) {
        await supabase.storage.from('sponsor-banners').remove(pathsToDelete);
      }
    }

    return { success: true, error: null };
  } catch (err: unknown) {
    return { success: false, error: err as Error };
  }
}
