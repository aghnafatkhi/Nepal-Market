import { getSupabaseClient } from './client';
import { DbProfile } from './types';
import { compressImage } from '@/lib/utils/imageCompression';

export interface PublicSellerProfile {
  id: string;
  name: string;
  username: string;
  avatar_url: string | null;
  phone: string | null;
  instagram: string | null;
  role: 'user' | 'admin';
  created_at: string;
}

/**
 * Mengambil profil publik seller berdasarkan username.
 * HANYA mengambil data publik yang relevan, tidak menyertakan email atau data privat.
 */
export async function fetchProfileByUsername(
  rawUsername: string
): Promise<{ profile: PublicSellerProfile | null; error: Error | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { profile: null, error: new Error('Supabase belum terhubung') };
  }

  const cleanUsername = rawUsername.trim().toLowerCase().replace(/^@/, '');

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, username, avatar_url, phone, instagram, role, created_at')
      .ilike('username', cleanUsername)
      .maybeSingle();

    if (error) {
      return { profile: null, error };
    }

    if (!data) {
      return { profile: null, error: null };
    }

    return { profile: data as PublicSellerProfile, error: null };
  } catch (err: unknown) {
    return { profile: null, error: err as Error };
  }
}

/**
 * Mengambil data profil pengguna berdasarkan user ID.
 */
export async function fetchProfileById(
  userId: string
): Promise<{ profile: DbProfile | null; error: Error | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { profile: null, error: new Error('Supabase belum terhubung') };
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, username, avatar_url, phone, instagram, role, created_at')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      return { profile: null, error };
    }

    return { profile: data ? { ...data, email: null } as DbProfile : null, error: null };
  } catch (err: unknown) {
    return { profile: null, error: err as Error };
  }
}

/**
 * Validasi apakah username masih tersedia dan valid formatnya.
 */
export async function checkUsernameAvailable(
  username: string,
  currentUserId?: string
): Promise<{ available: boolean; message?: string }> {
  const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');

  if (!cleanUsername || cleanUsername.length < 3) {
    return { available: false, message: 'Username minimal 3 karakter.' };
  }

  if (cleanUsername.length > 25) {
    return { available: false, message: 'Username maksimal 25 karakter.' };
  }

  if (!/^[a-z0-9_]+$/.test(cleanUsername)) {
    return { available: false, message: 'Hanya boleh huruf kecil, angka, dan underscore (_).' };
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return { available: true };
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username')
      .ilike('username', cleanUsername)
      .maybeSingle();

    if (error) {
      console.warn('Gagal cek username di Supabase:', error.message);
      return { available: true };
    }

    if (data && data.id !== currentUserId) {
      return { available: false, message: 'Username ini sudah digunakan.' };
    }

    return { available: true };
  } catch {
    return { available: true };
  }
}

/**
 * Memperbarui profil pengguna yang sedang login.
 */
export async function updateUserProfile(
  userId: string,
  updates: {
    name: string;
    username: string;
    phone?: string | null;
    instagram?: string | null;
    avatar_url?: string | null;
  }
): Promise<{ profile: DbProfile | null; error: Error | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { profile: null, error: new Error('Supabase belum terhubung') };
  }

  const cleanUsername = updates.username.trim().toLowerCase().replace(/^@/, '');
  const cleanPhone = updates.phone ? updates.phone.trim() : null;
  const cleanInstagram = updates.instagram ? updates.instagram.trim().replace(/^@/, '') : null;

  try {
    const payload: Partial<DbProfile> = {
      name: updates.name.trim(),
      username: cleanUsername,
      phone: cleanPhone,
      instagram: cleanInstagram,
    };

    if (updates.avatar_url !== undefined) {
      payload.avatar_url = updates.avatar_url;
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', userId)
      .select('id, name, username, avatar_url, phone, instagram, role, created_at')
      .single();

    if (error) {
      return { profile: null, error };
    }

    return { profile: data as DbProfile, error: null };
  } catch (err: unknown) {
    return { profile: null, error: err as Error };
  }
}

/**
 * Mengunggah avatar profil pengguna ke Supabase Storage.
 * Melakukan kompresi otomatis client-side untuk responsifitas mobile.
 */
export async function uploadAvatarImage(
  userId: string,
  rawFile: File
): Promise<{ url: string | null; error: Error | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { url: null, error: new Error('Supabase belum terhubung') };
  }

  try {
    // Kompres foto avatar ke dimensi proporsional persegi (maks 600x600 px)
    const compressed = await compressImage(rawFile, 600, 600, 0.85);

    const ext = compressed.type === 'image/png' ? 'png' : compressed.type === 'image/webp' ? 'webp' : 'jpg';
    const filePath = `${userId}/avatar-${Date.now()}.${ext}`;

    const bucketName = 'avatars';
    const uploadResult = await supabase.storage
      .from(bucketName)
      .upload(filePath, compressed, {
        cacheControl: '3600',
        upsert: false,
        contentType: compressed.type,
      });

    if (uploadResult.error) {
      return { url: null, error: uploadResult.error };
    }

    const { data: publicData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return { url: publicData.publicUrl, error: null };
  } catch (err: unknown) {
    return { url: null, error: err as Error };
  }
}
