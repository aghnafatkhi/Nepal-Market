'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, AlertCircle, ShoppingBag, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { CategorySlug, ProductCondition } from '@/types/market';
import { CATEGORIES } from '@/data/products';
import { createProductInDb } from '@/lib/supabase/products';
import { ProductPhotoPicker } from '@/components/ProductPhotoPicker';

const CONDITIONS: { value: ProductCondition; label: string; desc: string }[] = [
  { value: 'Baru', label: 'Baru', desc: 'Belum pernah dipakai / masih segel' },
  { value: 'Bekas - Seperti Baru', label: 'Seperti Baru', desc: 'Kondisi 98%+, nyaris tanpa minus' },
  { value: 'Bekas - Mulus', label: 'Bekas - Mulus', desc: 'Pemakaian normal, fungsi normal' },
  { value: 'Bekas - Layak', label: 'Bekas - Layak', desc: 'Ada lecet / minus wajar, harga hemat' },
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
  const [condition, setCondition] = useState<ProductCondition>('Bekas - Mulus');
  const [location, setLocation] = useState('Kantin Utama');
  const [description, setDescription] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [instagram, setInstagram] = useState('');

  // Status & Validation
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-28 sm:pb-16">
      {/* Top Bar Navigation */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/90">
        <div className="max-w-2xl mx-auto px-4 h-14 sm:h-16 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors -ml-1 min-h-[44px] px-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali</span>
          </Link>
          <span className="text-sm font-bold text-slate-900 truncate">Pasang Iklan</span>
          <Link
            href="/my-products"
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors min-h-[44px] flex items-center px-2"
          >
            Produk Saya
          </Link>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 pt-4 sm:pt-6">
        {/* Header Title Section */}
        <div className="mb-5">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Jual Barang</span>
            <span className="text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-blue-600" />
              COD Langsung
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Tawarkan barang yang masih layak pakai ke sesama warga di sekitar Nepal.
          </p>
        </div>

        {/* Global Error Banner */}
        {generalError && (
          <div
            role="alert"
            className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs sm:text-sm text-rose-800 shadow-xs"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{generalError}</div>
          </div>
        )}

        <form onSubmit={(e) => handleSubmit(e, 'active')} className="space-y-5">
          {/* 1. KOTAK UPLOAD FOTO */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs">
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

          {/* 2. INFORMASI BARANG */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-blue-600" />
              <span>Informasi Barang</span>
            </h2>

            {/* Nama Barang */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="sell-title" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Judul Barang *
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
                className={`w-full px-3.5 py-3 bg-slate-50 border rounded-xl text-base text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden min-h-[46px] transition-colors ${
                  errors.title ? 'border-rose-300 focus:border-rose-500 bg-rose-50/20' : 'border-slate-200 focus:border-blue-500'
                }`}
              />
              {errors.title && (
                <p role="alert" className="text-xs font-medium text-rose-600 mt-1">
                  {errors.title}
                </p>
              )}
            </div>

            {/* Harga & Kategori */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Harga */}
              <div>
                <label htmlFor="sell-price" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Harga Barang *
                </label>
                <div className="relative">
                  <input
                    id="sell-price"
                    type="text"
                    inputMode="numeric"
                    placeholder="Contoh: Rp 75.000"
                    value={displayPrice}
                    onChange={handlePriceChange}
                    className={`w-full px-3.5 py-3 bg-slate-50 border rounded-xl text-base font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:bg-white focus:outline-hidden min-h-[46px] transition-colors ${
                      errors.price ? 'border-rose-300 focus:border-rose-500 bg-rose-50/20' : 'border-slate-200 focus:border-blue-500'
                    }`}
                  />
                </div>
                {errors.price ? (
                  <p role="alert" className="text-xs font-medium text-rose-600 mt-1">
                    {errors.price}
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-400 mt-1">
                    Cukup ketik nominal angka tanpa titik atau koma.
                  </p>
                )}
              </div>

              {/* Kategori */}
              <div>
                <label htmlFor="sell-category" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Kategori *
                </label>
                <select
                  id="sell-category"
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value as CategorySlug);
                    if (errors.category) setErrors((prev) => ({ ...prev, category: '' }));
                  }}
                  className={`w-full px-3.5 py-3 bg-slate-50 border rounded-xl text-base text-slate-900 focus:bg-white focus:outline-hidden min-h-[46px] transition-colors ${
                    errors.category ? 'border-rose-300 focus:border-rose-500 bg-rose-50/20' : 'border-slate-200 focus:border-blue-500'
                  }`}
                >
                  {CATEGORIES.filter((c) => c.slug !== 'semua').map((cat) => (
                    <option key={cat.slug} value={cat.slug}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p role="alert" className="text-xs font-medium text-rose-600 mt-1">
                    {errors.category}
                  </p>
                )}
              </div>
            </div>

            {/* Pilihan Kondisi Barang */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Kondisi Barang *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                      className={`text-left p-3 rounded-xl border transition-all min-h-[52px] ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-600'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100/80 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-semibold ${isSelected ? 'text-blue-700' : 'text-slate-900'}`}>
                          {cond.label}
                        </span>
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                        {cond.desc}
                      </p>
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

            {/* Titik Lokasi COD / Ketemuan */}
            <div>
              <label htmlFor="sell-location" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Lokasi COD *
              </label>
              <input
                id="sell-location"
                type="text"
                placeholder="Contoh: Kantin Utama atau Depan Gerbang"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:outline-hidden min-h-[46px]"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Pilih tempat yang mudah dijangkau dan aman untuk ketemuan.
              </p>
            </div>

            {/* Deskripsi */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="sell-desc" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Deskripsi Barang *
                </label>
                <span className={`text-[11px] ${description.length < 15 ? 'text-amber-600' : 'text-slate-400'}`}>
                  {description.length} karakter (min. 15)
                </span>
              </div>
              <textarea
                id="sell-desc"
                rows={4}
                placeholder="Ceritakan kelengkapan barang, riwayat pemakaian, minus fisik jika ada, dan alasan dijual..."
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (errors.description) setErrors((prev) => ({ ...prev, description: '' }));
                }}
                className={`w-full px-3.5 py-3 bg-slate-50 border rounded-xl text-base text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden transition-colors ${
                  errors.description ? 'border-rose-300 focus:border-rose-500 bg-rose-50/20' : 'border-slate-200 focus:border-blue-500'
                }`}
              />
              {errors.description && (
                <p role="alert" className="text-xs font-medium text-rose-600 mt-1">
                  {errors.description}
                </p>
              )}
            </div>
          </div>

          {/* 3. KONTAK PENJUAL */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-3.5">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Kontak Penjual
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Cantumkan minimal satu kontak agar pembeli bisa langsung janjian COD.
              </p>
            </div>

            {errors.contact && (
              <p role="alert" className="text-xs font-semibold text-rose-600 p-2.5 bg-rose-50 rounded-lg border border-rose-200">
                {errors.contact}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* WhatsApp */}
              <div>
                <label htmlFor="sell-wa" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Nomor WhatsApp
                </label>
                <input
                  id="sell-wa"
                  type="tel"
                  inputMode="tel"
                  placeholder="Contoh: 081234567890"
                  value={whatsapp}
                  onChange={(e) => {
                    setWhatsapp(e.target.value);
                    if (errors.whatsapp) setErrors((prev) => ({ ...prev, whatsapp: '' }));
                    if (errors.contact) setErrors((prev) => ({ ...prev, contact: '' }));
                  }}
                  className={`w-full px-3.5 py-3 bg-slate-50 border rounded-xl text-base text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden min-h-[46px] transition-colors ${
                    errors.whatsapp ? 'border-rose-300 focus:border-rose-500 bg-rose-50/20' : 'border-slate-200 focus:border-blue-500'
                  }`}
                />
                {errors.whatsapp && (
                  <p role="alert" className="text-xs font-medium text-rose-600 mt-1">
                    {errors.whatsapp}
                  </p>
                )}
              </div>

              {/* Instagram */}
              <div>
                <label htmlFor="sell-ig" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Username Instagram (Opsional)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">
                    @
                  </span>
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
                    className={`w-full pl-8 pr-3.5 py-3 bg-slate-50 border rounded-xl text-base text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden min-h-[46px] transition-colors ${
                      errors.instagram ? 'border-rose-300 focus:border-rose-500 bg-rose-50/20' : 'border-slate-200 focus:border-blue-500'
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

          {/* Action Buttons (Desktop Inline) */}
          <div className="hidden sm:flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={(e) => handleSubmit(e, 'draft')}
              className="px-5 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-colors min-h-[48px] disabled:opacity-50"
            >
              Simpan Draf
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-7 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm shadow-xs transition-colors min-h-[48px] flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menerbitkan Iklan...</span>
                </>
              ) : (
                <span>Terbitkan Iklan</span>
              )}
            </button>
          </div>
        </form>
      </main>

      {/* Sticky Bottom Action Bar di Layar HP (Mobile thumb-friendly) */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/90 p-3 pb-[max(12px,env(safe-area-inset-bottom))] shadow-lg">
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={(e) => handleSubmit(e, 'draft')}
            className="w-1/3 min-h-[48px] py-3 px-2 border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl transition-colors text-center disabled:opacity-50"
          >
            Simpan Draf
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={(e) => handleSubmit(e, 'active')}
            className="flex-1 min-h-[48px] py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menerbitkan...</span>
              </>
            ) : (
              <span>Terbitkan Iklan</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
