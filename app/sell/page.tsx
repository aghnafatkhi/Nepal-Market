'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, AlertCircle, ShoppingBag } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { CategorySlug, ProductCondition } from '@/types/market';
import { CATEGORIES } from '@/data/products';
import { createProductInDb } from '@/lib/supabase/products';
import { ProductPhotoPicker } from '@/components/ProductPhotoPicker';

const CONDITIONS: { value: ProductCondition; label: string; desc: string }[] = [
  { value: 'Baru', label: 'Baru', desc: 'Belum pernah dipakai' },
  { value: 'Bekas', label: 'Bekas', desc: 'Sudah pernah dipakai' },
];

export default function SellPage() {
  const router = useRouter();
  const { user, profile, isLoading: authLoading, isConfigured } = useAuth();

  // Form states
  const [photos, setPhotos] = useState<File[]>([]);
  const [title, setTitle] = useState('');
  const [displayPrice, setDisplayPrice] = useState('');
  const [rawPrice, setRawPrice] = useState<number>(0);
  const [category, setCategory] = useState<CategorySlug>('fashion');
  const [condition, setCondition] = useState<ProductCondition>('Bekas');
  const [location, setLocation] = useState('Kantin Utama');
  const [description, setDescription] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [instagram, setInstagram] = useState('');

  // Status & Validation
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Generate thumbnail preview dari foto pertama
  const firstPhotoPreview = useMemo(() => {
    if (photos.length > 0) {
      return URL.createObjectURL(photos[0]);
    }
    return null;
  }, [photos]);

  useEffect(() => {
    return () => {
      if (firstPhotoPreview) {
        URL.revokeObjectURL(firstPhotoPreview);
      }
    };
  }, [firstPhotoPreview]);

  // Initialize contact info from logged in user
  useEffect(() => {
    if (!profile) return;
    const timer = setTimeout(() => {
      setWhatsapp((curr) => curr || profile.phone || '');
      setInstagram((curr) => curr || profile.instagram || '');
    }, 0);
    return () => clearTimeout(timer);
  }, [profile]);

  // Protected route check
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirectTo=/sell');
    }
  }, [user, authLoading, router]);

  // Format harga Rupiah otomatis
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputVal = e.target.value.replace(/\D/g, '');
    if (!inputVal) {
      setDisplayPrice('');
      setRawPrice(0);
      return;
    }

    const num = parseInt(inputVal, 10);
    // Batas maksimal harga Rp 1.000.000.000
    if (num > 1000000000) return;

    setRawPrice(num);
    setDisplayPrice(new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num));
    if (errors.price) {
      setErrors((prev) => ({ ...prev, price: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // 1. Foto
    if (photos.length === 0) {
      newErrors.photos = 'Pilih minimal satu foto barang.';
    }

    // 2. Nama Barang
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      newErrors.title = 'Judul barang wajib diisi.';
    } else if (cleanTitle.length < 3) {
      newErrors.title = 'Judul barang minimal 3 karakter.';
    } else if (cleanTitle.length > 80) {
      newErrors.title = 'Judul barang maksimal 80 karakter.';
    }

    // 3. Harga
    if (!rawPrice || rawPrice <= 0) {
      newErrors.price = 'Masukkan harga barang.';
    }

    // 4. Kategori
    if (!category || category === 'semua') {
      newErrors.category = 'Pilih kategori barang.';
    }

    // 5. Kondisi
    if (!condition) {
      newErrors.condition = 'Pilih kondisi fisik barang.';
    }

    // 6. Deskripsi
    const cleanDesc = description.trim();
    if (!cleanDesc) {
      newErrors.description = 'Deskripsi barang wajib diisi.';
    } else if (cleanDesc.length < 15) {
      newErrors.description = 'Deskripsi terlalu singkat. Tuliskan minimal 15 karakter.';
    }

    // 7. Kontak (minimal satu)
    const cleanWa = whatsapp.trim().replace(/\D/g, '');
    const cleanIg = instagram.trim().replace(/^@/, '');

    if (!cleanWa && !cleanIg) {
      newErrors.contact = 'Cantumkan minimal satu kontak: nomor WhatsApp atau akun Instagram.';
    } else {
      if (cleanWa) {
        // Validasi nomor Indonesia: harus mulai 08 atau 628 dengan panjang 9-14 digit
        const waNum = cleanWa.startsWith('0') ? `62${cleanWa.slice(1)}` : cleanWa;
        if (!/^628\d{7,12}$/.test(waNum)) {
          newErrors.whatsapp = 'Format nomor WhatsApp kurang tepat (contoh: 081234567890).';
        }
      }
      if (cleanIg) {
        if (!/^[a-zA-Z0-9._]{1,30}$/.test(cleanIg)) {
          newErrors.instagram = 'Username Instagram hanya boleh menggunakan huruf, angka, titik, atau garis bawah.';
        }
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      setGeneralError('Lengkapi bidang yang masih bertanda merah sebelum melanjutkan.');
      // Scroll ke atas agar pengguna melihat pesan
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return false;
    }

    setGeneralError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent, status: 'active' | 'draft' = 'active') => {
    e.preventDefault();
    if (isSubmitting || !user) return;

    if (!validateForm()) return;

    if (!isConfigured) {
      setGeneralError('Layanan akun belum siap. Silakan coba sesaat lagi.');
      return;
    }

    setIsSubmitting(true);
    setGeneralError(null);

    const cleanWa = whatsapp.trim().replace(/\D/g, '');
    const cleanIg = instagram.trim().replace(/^@/, '');

    const result = await createProductInDb({
      sellerId: user.id,
      title: title.trim(),
      description: description.trim(),
      price: rawPrice,
      category,
      condition,
      location: location.trim() || 'Kantin Utama',
      images: photos,
      contactPhone: cleanWa || undefined,
      contactInstagram: cleanIg || undefined,
      status,
    });

    if (result.error) {
      setGeneralError(result.error.message || 'Gagal menerbitkan iklan. Silakan periksa koneksi dan coba lagi.');
      setIsSubmitting(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (result.product) {
      // Arahkan langsung ke halaman detail produk dengan query pemberitahuan singkat
      router.push(`/product/${result.product.id}?justListed=true`);
    } else {
      router.push('/my-products');
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f7f5]">
        <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7f5] pb-28 sm:pb-16">
      {/* Top Bar Navigation */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors -ml-1 min-h-[44px] px-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali</span>
          </Link>
          <span className="text-sm font-bold text-slate-900 truncate">Pasang Iklan</span>
          <Link
            href="/my-products"
            className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors min-h-[44px] flex items-center px-2"
          >
            Produk Saya
          </Link>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 pt-4 sm:pt-6">
        {/* Header Title Section */}
        <div className="mb-5">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Jual Barang</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Tawarkan barang yang masih layak pakai ke sesama warga di sekitar Nepal.
          </p>
        </div>

        {/* Global Error Banner */}
        {generalError && (
          <div
            role="alert"
            className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-md flex items-start gap-2.5 text-xs sm:text-sm text-rose-800"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{generalError}</div>
          </div>
        )}

        <form onSubmit={(e) => handleSubmit(e, 'active')} className="bg-white rounded-lg border border-slate-200 p-5 sm:p-6 space-y-6">
          {/* 1. FOTO */}
          <div>
            <label className="block text-xs font-semibold text-slate-900 mb-1.5">
              1. Foto Barang <span className="text-rose-600">*</span>
            </label>
            <ProductPhotoPicker
              files={photos}
              onChange={(newFiles) => {
                setPhotos(newFiles);
                if (errors.photos) {
                  setErrors((prev) => ({ ...prev, photos: '' }));
                }
              }}
              error={errors.photos}
            />
          </div>

          <hr className="border-slate-100" />

          {/* 2. NAMA BARANG */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="sell-title" className="block text-xs font-semibold text-slate-900">
                2. Nama Barang <span className="text-rose-600">*</span>
              </label>
              <span className="text-[11px] text-slate-400">
                {title.length}/80
              </span>
            </div>
            <input
              id="sell-title"
              type="text"
              maxLength={80}
              placeholder="Contoh: Jaket Parasut Navy Ukuran L"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
              }}
              className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-md text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden min-h-[42px] transition-colors ${
                errors.title ? 'border-rose-300 focus:border-rose-500 bg-rose-50/20' : 'border-slate-300 focus:border-blue-600'
              }`}
            />
            {errors.title && (
              <p role="alert" className="text-xs font-medium text-rose-600 mt-1">
                {errors.title}
              </p>
            )}
          </div>

          <hr className="border-slate-100" />

          {/* 3. KATEGORI */}
          <div>
            <label htmlFor="sell-category" className="block text-xs font-semibold text-slate-900 mb-1.5">
              3. Kategori <span className="text-rose-600">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CATEGORIES.filter((c) => c.slug !== 'semua').map((cat) => {
                const isSelected = category === cat.slug;
                return (
                  <button
                    key={cat.slug}
                    type="button"
                    onClick={() => {
                      setCategory(cat.slug);
                      if (errors.category) setErrors((prev) => ({ ...prev, category: '' }));
                    }}
                    className={`px-3 py-2 text-xs font-medium rounded-md border text-center transition-colors min-h-[40px] cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 border-blue-600 text-blue-700 font-semibold'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
            {errors.category && (
              <p role="alert" className="text-xs font-medium text-rose-600 mt-1">
                {errors.category}
              </p>
            )}
          </div>

          <hr className="border-slate-100" />

          {/* 4. KONDISI */}
          <div>
            <label className="block text-xs font-semibold text-slate-900 mb-1.5">
              4. Kondisi <span className="text-rose-600">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CONDITIONS.map((cond) => {
                const isSelected = condition === cond.value;
                return (
                  <button
                    key={cond.value}
                    type="button"
                    onClick={() => {
                      setCondition(cond.value);
                      if (errors.condition) setErrors((prev) => ({ ...prev, condition: '' }));
                    }}
                    className={`p-2.5 rounded-md border text-left transition-colors min-h-[58px] cursor-pointer flex flex-col justify-center ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <span className="text-xs font-semibold">{cond.label}</span>
                    <span className="mt-0.5 text-[10px] leading-snug opacity-75">{cond.desc}</span>
                  </button>
                );
              })}
            </div>
            {errors.condition && (
              <p role="alert" className="text-xs font-medium text-rose-600 mt-1">
                {errors.condition}
              </p>
            )}
          </div>

          <hr className="border-slate-100" />

          {/* 5. HARGA */}
          <div>
            <label htmlFor="sell-price" className="block text-xs font-semibold text-slate-900 mb-1.5">
              5. Harga (Rp) <span className="text-rose-600">*</span>
            </label>
            <input
              id="sell-price"
              type="text"
              inputMode="numeric"
              placeholder="Contoh: 75000"
              value={displayPrice}
              onChange={handlePriceChange}
              className={`w-full max-w-sm px-3.5 py-2.5 bg-slate-50 border rounded-md text-sm font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:bg-white focus:outline-hidden min-h-[42px] transition-colors ${
                errors.price ? 'border-rose-300 focus:border-rose-500 bg-rose-50/20' : 'border-slate-300 focus:border-blue-600'
              }`}
            />
            {errors.price && (
              <p role="alert" className="text-xs font-medium text-rose-600 mt-1">
                {errors.price}
              </p>
            )}
          </div>

          <hr className="border-slate-100" />

          {/* 6. DESKRIPSI */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="sell-desc" className="block text-xs font-semibold text-slate-900">
                6. Deskripsi Barang <span className="text-rose-600">*</span>
              </label>
              <span className={`text-[11px] ${description.length < 15 ? 'text-amber-600' : 'text-slate-400'}`}>
                {description.length} karakter (min. 15)
              </span>
            </div>
            <textarea
              id="sell-desc"
              rows={3}
              placeholder="Tuliskan kelengkapan, minus fisik jika ada, atau alasan dijual"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (errors.description) setErrors((prev) => ({ ...prev, description: '' }));
              }}
              className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-md text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden transition-colors ${
                errors.description ? 'border-rose-300 focus:border-rose-500 bg-rose-50/20' : 'border-slate-300 focus:border-blue-600'
              }`}
            />
            {errors.description && (
              <p role="alert" className="text-xs font-medium text-rose-600 mt-1">
                {errors.description}
              </p>
            )}
          </div>

          <hr className="border-slate-100" />

          {/* 7. LOKASI COD */}
          <div>
            <label htmlFor="sell-location" className="block text-xs font-semibold text-slate-900 mb-1.5">
              7. Lokasi COD <span className="text-rose-600">*</span>
            </label>
            <input
              id="sell-location"
              type="text"
              placeholder="Contoh: Kantin Utama atau Depan Gerbang"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full max-w-md px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-md text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-hidden min-h-[42px]"
            />
          </div>

          <hr className="border-slate-100" />

          {/* 8. KONTAK */}
          <div>
            <label className="block text-xs font-semibold text-slate-900 mb-1.5">
              8. Kontak (Minimal 1 Kontak) <span className="text-rose-600">*</span>
            </label>
            {errors.contact && (
              <p role="alert" className="text-xs font-medium text-rose-600 p-2 bg-rose-50 rounded-md border border-rose-200 mb-2">
                {errors.contact}
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-xs text-slate-600 mb-1 block font-medium">WhatsApp</span>
                <input
                  id="sell-wa"
                  type="tel"
                  inputMode="tel"
                  placeholder="081234567890"
                  value={whatsapp}
                  onChange={(e) => {
                    setWhatsapp(e.target.value);
                    if (errors.whatsapp) setErrors((prev) => ({ ...prev, whatsapp: '' }));
                    if (errors.contact) setErrors((prev) => ({ ...prev, contact: '' }));
                  }}
                  className={`w-full px-3 py-2 bg-slate-50 border rounded-md text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden min-h-[40px] ${
                    errors.whatsapp ? 'border-rose-300 bg-rose-50/20' : 'border-slate-300 focus:border-blue-600'
                  }`}
                />
                {errors.whatsapp && (
                  <p role="alert" className="text-xs font-medium text-rose-600 mt-1">
                    {errors.whatsapp}
                  </p>
                )}
              </div>

              <div>
                <span className="text-xs text-slate-600 mb-1 block font-medium">Instagram (Opsional)</span>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">@</span>
                  <input
                    id="sell-ig"
                    type="text"
                    placeholder="username"
                    value={instagram}
                    onChange={(e) => {
                      setInstagram(e.target.value.replace(/^@/, ''));
                      if (errors.instagram) setErrors((prev) => ({ ...prev, instagram: '' }));
                      if (errors.contact) setErrors((prev) => ({ ...prev, contact: '' }));
                    }}
                    className={`w-full pl-7 pr-3 py-2 bg-slate-50 border rounded-md text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden min-h-[40px] ${
                      errors.instagram ? 'border-rose-300 bg-rose-50/20' : 'border-slate-300 focus:border-blue-600'
                    }`}
                  />
                </div>
                {errors.instagram && (
                  <p role="alert" className="text-xs font-medium text-rose-600 mt-1">
                    {errors.instagram}
                  </p>
                )}
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* 9. PREVIEW DAN KIRIM */}
          <div>
            <label className="block text-xs font-semibold text-slate-900 mb-2">
              9. Ringkasan Iklan
            </label>
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-md flex items-center gap-3.5">
              <div className="w-14 h-14 rounded bg-slate-200 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                {firstPhotoPreview ? (
                  <img
                    src={firstPhotoPreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[10px] text-slate-400 text-center px-1">Belum ada foto</span>
                )}
              </div>
              <div className="flex-1 min-w-0 text-xs text-slate-600 space-y-0.5">
                <p className="font-bold text-slate-900 text-sm truncate">
                  {title.trim() || 'Nama Barang'}
                </p>
                <p className="font-bold text-slate-900">
                  {displayPrice || 'Rp 0'}
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  {CATEGORIES.find((c) => c.slug === category)?.label} &bull; {condition} &bull; {location || 'Kantin'}
                </p>
              </div>
            </div>

            {/* Tombol Aksi: Simpan Draft vs Pasang Iklan */}
            <div className="flex items-center justify-end gap-3 pt-5">
              <button
                id="btn-save-draft-sell"
                type="button"
                disabled={isSubmitting}
                onClick={(e) => handleSubmit(e, 'draft')}
                className="px-4 py-2 text-xs font-medium rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-colors min-h-[40px] cursor-pointer disabled:opacity-50"
              >
                Simpan Draft
              </button>
              <button
                id="btn-publish-sell"
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-semibold rounded-md bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white transition-colors min-h-[40px] flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <span>Pasang Iklan</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </main>

      {/* Sticky Bottom Bar di Ponsel */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 p-2.5 pb-[max(10px,env(safe-area-inset-bottom))]">
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={(e) => handleSubmit(e, 'draft')}
            className="w-1/3 min-h-[42px] py-2 px-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs rounded-md transition-colors text-center cursor-pointer disabled:opacity-50"
          >
            Simpan Draft
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={(e) => handleSubmit(e, 'active')}
            className="flex-1 min-h-[42px] py-2 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs rounded-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <span>Pasang Iklan</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
