'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Camera, 
  User, 
  Package, 
  Bookmark, 
  LogOut, 
  Check, 
  AlertCircle, 
  Loader2, 
  Calendar, 
  ExternalLink,
  Phone,
  Instagram,
  ShieldCheck,
  Shield
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { updateUserProfile, uploadAvatarImage, checkUsernameAvailable, fetchProfileById } from '@/lib/supabase/profile';
import { fetchSellerProducts } from '@/lib/supabase/products';

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, isLoading: authLoading, isConfigured, signOut, refreshProfile } = useAuth();

  // Form states
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [instagram, setInstagram] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // File upload state
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Status & Validation
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [myProductCount, setMyProductCount] = useState<number>(0);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Protected route check
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirectTo=/profile');
    }
  }, [user, authLoading, router]);

  // Sync profile data to form
  useEffect(() => {
    let isMounted = true;
    if (user && isConfigured) {
      fetchProfileById(user.id).then(({ profile: dbProfile }) => {
        if (!isMounted) return;
        const p = dbProfile || profile;
        if (p) {
          setName(p.name || '');
          setUsername(p.username || '');
          setPhone(p.phone || '');
          setInstagram(p.instagram || '');
          setAvatarUrl(p.avatar_url || null);
        }
      });
    } else if (profile) {
      Promise.resolve().then(() => {
        if (!isMounted) return;
        setName(profile.name || '');
        setUsername(profile.username || '');
        setPhone(profile.phone || '');
        setInstagram(profile.instagram || '');
        setAvatarUrl(profile.avatar_url || null);
      });
    }
    return () => {
      isMounted = false;
    };
  }, [user, isConfigured, profile]);

  // Load product count for seller quick stats
  useEffect(() => {
    let isMounted = true;
    if (user) {
      fetchSellerProducts(user.id).then(({ products }) => {
        if (isMounted) {
          setMyProductCount(products.length);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [user]);

  // Handle avatar file selection
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setGeneralError('Pilih file gambar dengan format JPG, PNG, atau WebP.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setGeneralError('Ukuran file foto maksimal 5 MB.');
      return;
    }

    setAvatarFile(file);
    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);
    setGeneralError(null);
  };

  // Format tanggal bergabung
  const formattedJoinedDate = React.useMemo(() => {
    if (!profile?.created_at && !user?.created_at) return 'Baru bergabung';
    const dateStr = profile?.created_at || user?.created_at || '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    } catch {
      return 'Baru bergabung';
    }
  }, [profile, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setGeneralError(null);
    setSuccessMessage(null);
    const newErrors: Record<string, string> = {};

    // Validasi nama
    const cleanName = name.trim();
    if (!cleanName) {
      newErrors.name = 'Nama lengkap wajib diisi.';
    } else if (cleanName.length < 2) {
      newErrors.name = 'Nama minimal 2 karakter.';
    } else if (cleanName.length > 50) {
      newErrors.name = 'Nama maksimal 50 karakter.';
    }

    // Validasi username
    const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');
    if (!cleanUsername) {
      newErrors.username = 'Username akun wajib diisi.';
    } else if (cleanUsername.length < 3) {
      newErrors.username = 'Username minimal 3 karakter.';
    } else if (cleanUsername.length > 25) {
      newErrors.username = 'Username maksimal 25 karakter.';
    } else if (!/^[a-z0-9_]+$/.test(cleanUsername)) {
      newErrors.username = 'Username hanya boleh huruf kecil, angka, dan garis bawah (_).';
    }

    // Validasi nomor WhatsApp (jika diisi)
    const cleanPhone = phone.trim();
    if (cleanPhone) {
      const digitsOnly = cleanPhone.replace(/\D/g, '');
      if (digitsOnly.length < 9 || digitsOnly.length > 15) {
        newErrors.phone = 'Nomor WhatsApp kurang tepat (contoh: 081234567890).';
      }
    }

    // Validasi Instagram (jika diisi)
    const cleanInstagram = instagram.trim().replace(/^@/, '');
    if (cleanInstagram && !/^[a-zA-Z0-9._]+$/.test(cleanInstagram)) {
      newErrors.instagram = 'Username Instagram hanya boleh huruf, angka, titik, atau garis bawah.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Cek ketersediaan username jika berubah
      if (cleanUsername !== profile?.username) {
        const check = await checkUsernameAvailable(cleanUsername, user.id);
        if (!check.available) {
          setErrors({ username: check.message || 'Username sudah dipakai oleh pengguna lain. Silakan pilih nama lain.' });
          setIsSubmitting(false);
          return;
        }
      }

      // 2. Upload avatar baru jika ada file yang dipilih
      let uploadedAvatarUrl = avatarUrl;
      if (avatarFile) {
        const uploadRes = await uploadAvatarImage(user.id, avatarFile);
        if (uploadRes.error) {
          setGeneralError('Gagal mengunggah foto profil. Silakan coba beberapa saat lagi.');
          setIsSubmitting(false);
          return;
        }
        if (uploadRes.url) {
          uploadedAvatarUrl = uploadRes.url;
        }
      }

      // 3. Simpan perubahan profil ke Supabase
      const updateRes = await updateUserProfile(user.id, {
        name: cleanName,
        username: cleanUsername,
        phone: cleanPhone || null,
        instagram: cleanInstagram || null,
        avatar_url: uploadedAvatarUrl,
      });

      if (updateRes.error) {
        setGeneralError(updateRes.error.message || 'Gagal memperbarui profil. Silakan periksa koneksi dan coba lagi.');
        setIsSubmitting(false);
        return;
      }

      // Refresh data profile di AuthContext
      await refreshProfile();
      setErrors({});
      setAvatarFile(null);
      setSuccessMessage('Perubahan profil berhasil disimpan.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: unknown) {
      setGeneralError((err as Error).message || 'Terjadi kendala saat menyimpan. Coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await signOut();
      router.push('/');
    } catch {
      setIsLoggingOut(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
      </div>
    );
  }

  const currentDisplayAvatar = avatarPreview || avatarUrl;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 sm:pb-12">
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 h-14 sm:h-15 flex items-center justify-between">
          <Link
            id="btn-profile-back"
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors -ml-1 min-h-[44px] px-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Beranda</span>
          </Link>
          <h1 className="text-sm sm:text-base font-bold text-slate-900">Profil Saya</h1>
          <button
            id="btn-profile-logout-header"
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="inline-flex items-center gap-1 text-xs sm:text-sm font-medium text-rose-600 hover:text-rose-700 p-2 min-h-[44px]"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-4 sm:pt-6 space-y-4">
        {/* Flash Notifications */}
        {successMessage && (
          <div
            role="status"
            className="p-3 bg-emerald-50 border border-emerald-200 rounded-md flex items-center gap-2 text-xs sm:text-sm font-medium text-emerald-800"
          >
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {generalError && (
          <div
            role="alert"
            className="p-3 bg-rose-50 border border-rose-200 rounded-md flex items-center gap-2 text-xs sm:text-sm font-medium text-rose-800"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{generalError}</span>
          </div>
        )}

        {/* Akses Cepat Ringkas: Iklan Saya & Barang Tersimpan */}
        <div className="grid grid-cols-2 gap-2.5">
          <Link
            id="link-profile-my-products"
            href="/my-products"
            className="p-3 bg-white border border-slate-200 hover:border-blue-500 rounded-md transition-colors flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Package className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500">Iklan Saya</p>
              <p className="text-sm font-bold text-slate-900 truncate">
                {myProductCount} Barang
              </p>
            </div>
          </Link>

          <Link
            id="link-profile-saved"
            href="/saved"
            className="p-3 bg-white border border-slate-200 hover:border-blue-500 rounded-md transition-colors flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <Bookmark className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500">Tersimpan</p>
              <p className="text-sm font-bold text-slate-900 truncate">Koleksi Favorit</p>
            </div>
          </Link>
        </div>

        {/* Akses Admin (jika admin) */}
        {profile?.role === 'admin' && (
          <Link
            id="link-profile-admin-panel"
            href="/admin"
            className="p-3 bg-rose-50 border border-rose-200 rounded-md flex items-center justify-between hover:bg-rose-100/70 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-rose-600" />
              <span className="text-xs sm:text-sm font-bold text-rose-900">Panel Moderasi Pasar (Admin)</span>
            </div>
            <ExternalLink className="w-4 h-4 text-rose-600" />
          </Link>
        )}

        {/* Main Profile Form Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5 space-y-5"
        >
          {/* Avatar Section */}
          <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
            <div className="relative shrink-0">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-100 border border-slate-200 relative flex items-center justify-center">
                {currentDisplayAvatar ? (
                  <Image
                    src={currentDisplayAvatar}
                    alt={name || 'Avatar'}
                    fill
                    sizes="64px"
                    className="object-cover"
                    referrerPolicy="no-referrer"
                    unoptimized={currentDisplayAvatar.startsWith('blob:')}
                  />
                ) : (
                  <User className="w-7 h-7 text-slate-400" />
                )}
              </div>

              <button
                type="button"
                id="btn-pick-avatar"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-xs transition-colors cursor-pointer"
                aria-label="Ubah foto profil"
              >
                <Camera className="w-3 h-3" />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{name || 'Nama Pengguna'}</p>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                @{username || 'username'} &bull; Bergabung {formattedJoinedDate}
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-blue-600 hover:underline font-medium mt-1 inline-block cursor-pointer"
              >
                Ganti Foto Profil
              </button>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-3.5">
            {/* Nama Lengkap */}
            <div>
              <label htmlFor="input-profile-name" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Nama Lengkap *
              </label>
              <input
                id="input-profile-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama kamu"
                className={`w-full px-3 py-2 bg-slate-50 border rounded-md text-sm text-slate-900 focus:bg-white focus:outline-hidden min-h-[40px] transition-colors ${
                  errors.name ? 'border-rose-300' : 'border-slate-200 focus:border-blue-600'
                }`}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-rose-600 font-medium">{errors.name}</p>
              )}
            </div>

            {/* Username Unik */}
            <div>
              <label htmlFor="input-profile-username" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Username *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-sm text-slate-400 font-mono">
                  @
                </span>
                <input
                  id="input-profile-username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="username"
                  className={`w-full pl-7 pr-3 py-2 bg-slate-50 border rounded-md text-sm text-slate-900 focus:bg-white focus:outline-hidden font-mono min-h-[40px] transition-colors ${
                    errors.username ? 'border-rose-300' : 'border-slate-200 focus:border-blue-600'
                  }`}
                />
              </div>
              {errors.username && (
                <p className="mt-1 text-xs text-rose-600 font-medium">{errors.username}</p>
              )}
            </div>

            {/* Nomor WhatsApp */}
            <div>
              <label htmlFor="input-profile-phone" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Nomor WhatsApp
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </span>
                <input
                  id="input-profile-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="081234567890"
                  className={`w-full pl-9 pr-3 py-2 bg-slate-50 border rounded-md text-sm text-slate-900 focus:bg-white focus:outline-hidden min-h-[40px] transition-colors ${
                    errors.phone ? 'border-rose-300' : 'border-slate-200 focus:border-blue-600'
                  }`}
                />
              </div>
              {errors.phone && (
                <p className="mt-1 text-xs text-rose-600 font-medium">{errors.phone}</p>
              )}
            </div>

            {/* Username Instagram */}
            <div>
              <label htmlFor="input-profile-instagram" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Username Instagram (Opsional)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Instagram className="w-4 h-4" />
                </span>
                <input
                  id="input-profile-instagram"
                  type="text"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value.replace(/^@/, ''))}
                  placeholder="username_ig"
                  className={`w-full pl-9 pr-3 py-2 bg-slate-50 border rounded-md text-sm text-slate-900 focus:bg-white focus:outline-hidden min-h-[40px] transition-colors ${
                    errors.instagram ? 'border-rose-300' : 'border-slate-200 focus:border-blue-600'
                  }`}
                />
              </div>
              {errors.instagram && (
                <p className="mt-1 text-xs text-rose-600 font-medium">{errors.instagram}</p>
              )}
            </div>

            {/* Email (Readonly) */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Email Terdaftar
              </label>
              <input
                type="email"
                disabled
                value={user.email || ''}
                className="w-full px-3 py-2 bg-slate-100 text-sm text-slate-500 rounded-md border border-slate-200 cursor-not-allowed min-h-[40px]"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2 border-t border-slate-100">
            <button
              id="btn-submit-profile"
              type="submit"
              disabled={isSubmitting}
              className="w-full min-h-[42px] py-2 px-4 rounded-md bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-400 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>Simpan Perubahan</span>
              )}
            </button>
          </div>
        </form>

        {/* Tombol Logout */}
        <div className="p-3.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-900">Keluar dari Akun</p>
            <p className="text-[11px] text-slate-500">Akhiri sesi di perangkat ini</p>
          </div>
          <button
            id="btn-logout-main"
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="px-3 py-1.5 rounded-md border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-colors min-h-[36px] flex items-center gap-1.5 cursor-pointer"
          >
            {isLoggingOut ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <LogOut className="w-3.5 h-3.5" />
            )}
            <span>Keluar</span>
          </button>
        </div>
      </main>
    </div>
  );
}
