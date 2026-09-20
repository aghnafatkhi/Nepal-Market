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
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 sm:pb-16">
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs">
        <div className="max-w-2xl mx-auto px-4 h-14 sm:h-16 flex items-center justify-between">
          <Link
            id="btn-profile-back"
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors -ml-1 min-h-[44px] px-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Beranda</span>
          </Link>
          <h1 className="text-sm sm:text-base font-bold text-slate-900">Pengaturan Profil</h1>
          <button
            id="btn-profile-logout-header"
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-rose-600 hover:text-rose-700 p-2 min-h-[44px]"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-5 sm:pt-7 space-y-6">
        {/* Flash Notifications */}
        {successMessage && (
          <div
            role="status"
            className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs sm:text-sm font-medium text-emerald-800 shadow-xs animate-in fade-in"
          >
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {generalError && (
          <div
            role="alert"
            className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs sm:text-sm font-medium text-rose-800 shadow-xs animate-in fade-in"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{generalError}</span>
          </div>
        )}

        {/* Admin Panel Quick Access (Khusus akun admin) */}
        {profile?.role === 'admin' && (
          <Link
            id="link-profile-admin-panel"
            href="/admin"
            className="p-4 bg-linear-to-r from-rose-50 to-rose-100/60 border border-rose-200 hover:border-rose-400 rounded-2xl shadow-xs transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-rose-200/80 text-rose-800">
                    Administrator
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-900 mt-0.5">
                  Buka Panel Moderasi Pasar
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-rose-700 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
              <span>Akses Panel</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </span>
          </Link>
        )}

        {/* Quick Access Card: Produk Saya & Lihat Profil Publik */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            id="link-profile-my-products"
            href="/my-products"
            className="p-4 bg-white border border-slate-200/90 hover:border-blue-500 rounded-2xl shadow-xs transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">Kelola Iklan</p>
                <p className="text-sm font-bold text-slate-900">
                  Produk Saya ({myProductCount})
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-blue-600 group-hover:translate-x-0.5 transition-transform">
              Buka &rarr;
            </span>
          </Link>

          <Link
            id="link-profile-saved"
            href="/saved"
            className="p-4 bg-white border border-slate-200/90 hover:border-blue-500 rounded-2xl shadow-xs transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Bookmark className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">Barang Tersimpan</p>
                <p className="text-sm font-bold text-slate-900">Koleksi Favorit</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-blue-600 group-hover:translate-x-0.5 transition-transform">
              Buka &rarr;
            </span>
          </Link>
        </div>

        {/* Main Profile Form Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-6"
        >
          {/* Avatar Section */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 pb-6 border-b border-slate-100">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-100 border-2 border-white shadow-md relative flex items-center justify-center">
                {currentDisplayAvatar ? (
                  <Image
                    src={currentDisplayAvatar}
                    alt={name || 'Avatar'}
                    fill
                    sizes="96px"
                    className="object-cover"
                    referrerPolicy="no-referrer"
                    unoptimized={currentDisplayAvatar.startsWith('blob:')}
                  />
                ) : (
                  <User className="w-10 h-10 text-slate-400" />
                )}
              </div>

              {/* Camera Action Button */}
              <button
                type="button"
                id="btn-pick-avatar"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-md transition-colors"
                aria-label="Ubah foto profil"
              >
                <Camera className="w-4 h-4" />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            <div className="text-center sm:text-left flex-1">
              <h2 className="text-base font-bold text-slate-900">Foto Profil</h2>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Gunakan foto yang jelas agar mudah dikenali saat janjian COD.
              </p>
              <div className="mt-2.5 flex items-center justify-center sm:justify-start gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                >
                  Pilih Foto Baru
                </button>
                {avatarPreview && (
                  <button
                    type="button"
                    onClick={() => {
                      setAvatarFile(null);
                      setAvatarPreview(null);
                    }}
                    className="px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 text-xs font-semibold rounded-lg transition-colors"
                  >
                    Batal
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* User Info Metadata: Join Date & Public Profile Link */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Bergabung sejak <strong className="text-slate-800">{formattedJoinedDate}</strong></span>
            </div>

            {profile?.username && (
              <Link
                id="link-view-public-profile"
                href={`/profile/${profile.username}`}
                target="_blank"
                className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700"
              >
                <span>Lihat Profil Publik Saya</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            {/* Nama Lengkap */}
            <div>
              <label htmlFor="input-profile-name" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nama Lengkap <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-profile-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama kamu atau nama panggilan"
                className={`w-full px-3.5 py-2.5 bg-white text-sm text-slate-900 rounded-xl border transition-colors focus:outline-hidden ${
                  errors.name
                    ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                    : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                }`}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-rose-600 font-medium">{errors.name}</p>
              )}
            </div>

            {/* Username Unik */}
            <div>
              <label htmlFor="input-profile-username" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Username <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-sm text-slate-400 font-mono">
                  @
                </span>
                <input
                  id="input-profile-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="username_kamu"
                  className={`w-full pl-8 pr-3.5 py-2.5 bg-white text-sm text-slate-900 rounded-xl border transition-colors focus:outline-hidden font-mono ${
                    errors.username
                      ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                      : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                  }`}
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Akan dipakai untuk tautan profil: nepalmarket.app/profile/{username || 'username'}
              </p>
              {errors.username && (
                <p className="mt-1 text-xs text-rose-600 font-medium">{errors.username}</p>
              )}
            </div>

            {/* Nomor WhatsApp */}
            <div>
              <label htmlFor="input-profile-phone" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nomor WhatsApp (Opsional)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </span>
                <input
                  id="input-profile-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="081234567890"
                  className={`w-full pl-10 pr-3.5 py-2.5 bg-white text-sm text-slate-900 rounded-xl border transition-colors focus:outline-hidden ${
                    errors.phone
                      ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                      : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                  }`}
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Digunakan sebagai kontak saat pembeli ingin janjian COD.
              </p>
              {errors.phone && (
                <p className="mt-1 text-xs text-rose-600 font-medium">{errors.phone}</p>
              )}
            </div>

            {/* Username Instagram */}
            <div>
              <label htmlFor="input-profile-instagram" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Username Instagram (Opsional)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Instagram className="w-4 h-4" />
                </span>
                <input
                  id="input-profile-instagram"
                  type="text"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value.replace(/^@/, ''))}
                  placeholder="username_ig"
                  className={`w-full pl-10 pr-3.5 py-2.5 bg-white text-sm text-slate-900 rounded-xl border transition-colors focus:outline-hidden ${
                    errors.instagram
                      ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                      : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                  }`}
                />
              </div>
              {errors.instagram && (
                <p className="mt-1 text-xs text-rose-600 font-medium">{errors.instagram}</p>
              )}
            </div>

            {/* Email (Hanya Tampil, Tidak Dapat Diubah di Form Profil) */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                Email Terdaftar
              </label>
              <input
                type="email"
                disabled
                value={user.email || ''}
                className="w-full px-3.5 py-2.5 bg-slate-100 text-sm text-slate-500 rounded-xl border border-slate-200 cursor-not-allowed"
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Email bersifat pribadi dan tidak ditampilkan kepada pembeli.
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              id="btn-submit-profile"
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-400 text-white font-semibold text-sm transition-colors shadow-xs flex items-center justify-center gap-2"
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

        {/* Danger Zone: Tombol Logout */}
        <div className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-900">Keluar dari Akun</p>
            <p className="text-xs text-slate-500">Sesi login pada perangkat ini akan diakhiri.</p>
          </div>
          <button
            id="btn-logout-main"
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-colors min-h-[44px] flex items-center gap-1.5"
          >
            {isLoggingOut ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LogOut className="w-4 h-4" />
            )}
            <span>Keluar</span>
          </button>
        </div>
      </main>
    </div>
  );
}
