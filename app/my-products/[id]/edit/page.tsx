'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, AlertCircle, ShoppingBag, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { CategorySlug, ProductCondition } from '@/types/market';
import { CATEGORIES } from '@/data/products';
import { fetchProductById, updateProductInDb, EditPhotoEntry } from '@/lib/supabase/products';
import { ProductPhotoPicker, PhotoPickerItem } from '@/components/ProductPhotoPicker';

const CONDITIONS: { value: ProductCondition; label: string; desc: string }[] = [
  { value: 'Baru', label: 'Baru', desc: 'Belum pernah dipakai' },
  { value: 'Bekas - Seperti Baru', label: 'Seperti baru', desc: 'Hampir tidak ada bekas pemakaian' },
  { value: 'Bekas - Mulus', label: 'Bekas terawat', desc: 'Ada bekas ringan, fungsi normal' },
  { value: 'Bekas - Layak', label: 'Ada kekurangan', desc: 'Ada lecet atau kekurangan yang perlu dijelaskan' },
];

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const productId = resolvedParams.id;

  const router = useRouter();
  const { user, profile, isLoading: authLoading, isConfigured } = useAuth();

  // Data loading states
  const [isFetchingProduct, setIsFetchingProduct] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isUnauthorized, setIsUnauthorized] = useState(false);

  // Form states
  const [photoItems, setPhotoItems] = useState<PhotoPickerItem[]>([]);
  const [title, setTitle] = useState('');
  const [displayPrice, setDisplayPrice] = useState('');
  const [rawPrice, setRawPrice] = useState<number>(0);
  const [category, setCategory] = useState<CategorySlug>('fashion');
  const [condition, setCondition] = useState<ProductCondition>('Bekas - Mulus');
  const [location, setLocation] = useState('Kantin Utama');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'active' | 'sold' | 'draft'>('active');
  const [whatsapp, setWhatsapp] = useState('');
  const [instagram, setInstagram] = useState('');

  // Validation & Submit states
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Protected route check
  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?redirectTo=/my-products/${productId}/edit`);
    }
  }, [user, authLoading, router, productId]);

  // Load existing product
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (!productId || !user) return;
      setIsFetchingProduct(true);
      setFetchError(null);

      const result = await fetchProductById(productId);
      if (!isMounted) return;

      if (result.error || !result.product) {
        setFetchError(result.error?.message || 'Barang tidak ditemukan.');
        setIsFetchingProduct(false);
        return;
      }

      const prod = result.product;

      // Cek apakah pemilik adalah user yang login
      if (prod.seller.id !== user.id) {
        setIsUnauthorized(true);
        setIsFetchingProduct(false);
        return;
      }

      // Isi form dengan data yang ada
      setTitle(prod.title);
      setRawPrice(prod.price);
      setDisplayPrice(new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(prod.price));
      setCategory(prod.category);
      setCondition(prod.condition);
      setLocation(prod.location || 'Kantin Utama');
      setDescription(prod.description);
      const initialStatus: 'active' | 'sold' | 'draft' = 
        prod.status === 'sold' ? 'sold' :
        prod.status === 'draft' ? 'draft' :
        prod.isSold ? 'sold' : 'active';
      setStatus(initialStatus);

      // Kontak
      setWhatsapp(prod.seller.whatsapp || profile?.phone || '');
      setInstagram(prod.seller.instagram || profile?.instagram || '');

      // Susun list foto yang sudah ada
      const existingList: string[] = prod.images && prod.images.length > 0
        ? prod.images
        : prod.imageUrl ? [prod.imageUrl] : [];

      const initialItems: PhotoPickerItem[] = existingList.map((url, idx) => ({
        id: `existing-${idx}-${url}`,
        type: 'existing',
        url,
      }));

      setPhotoItems(initialItems);
      setIsFetchingProduct(false);
    }

    if (user && isConfigured) {
      loadData();
    }

    return () => {
      isMounted = false;
    };
  }, [productId, user, isConfigured, profile]);

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputVal = e.target.value.replace(/\D/g, '');
    if (!inputVal) {
      setDisplayPrice('');
      setRawPrice(0);
      return;
    }

    const num = parseInt(inputVal, 10);
    if (num > 1000000000) return;

    setRawPrice(num);
    setDisplayPrice(new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num));
    if (errors.price) {
      setErrors((prev) => ({ ...prev, price: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (photoItems.length === 0) {
      newErrors.photos = 'Pertahankan atau tambahkan minimal 1 foto barang.';
    }

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      newErrors.title = 'Nama barang wajib diisi.';
    } else if (cleanTitle.length < 3) {
      newErrors.title = 'Nama barang minimal 3 karakter.';
    } else if (cleanTitle.length > 80) {
      newErrors.title = 'Nama barang maksimal 80 karakter.';
    }

    if (!rawPrice || rawPrice <= 0) {
      newErrors.price = 'Harga barang harus lebih dari Rp 0.';
    }

    if (!category || category === 'semua') {
      newErrors.category = 'Pilih salah satu kategori barang.';
    }

    if (!condition) {
      newErrors.condition = 'Pilih kondisi barang saat ini.';
    }

    const cleanDesc = description.trim();
    if (!cleanDesc) {
      newErrors.description = 'Deskripsi barang wajib diisi.';
    } else if (cleanDesc.length < 15) {
      newErrors.description = 'Deskripsi terlalu pendek. Tuliskan minimal 15 karakter.';
    }

    const cleanWa = whatsapp.trim().replace(/\D/g, '');
    const cleanIg = instagram.trim().replace(/^@/, '');

    if (!cleanWa && !cleanIg) {
      newErrors.contact = 'Isi minimal satu kontak: nomor WhatsApp atau username Instagram.';
    } else {
      if (cleanWa) {
        const waNum = cleanWa.startsWith('0') ? `62${cleanWa.slice(1)}` : cleanWa;
        if (!/^628\d{7,12}$/.test(waNum)) {
          newErrors.whatsapp = 'Format nomor WhatsApp belum tepat (contoh: 081234567890).';
        }
      }
      if (cleanIg) {
        if (!/^[a-zA-Z0-9._]{1,30}$/.test(cleanIg)) {
          newErrors.instagram = 'Username Instagram hanya boleh huruf, angka, titik, dan garis bawah.';
        }
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      setGeneralError('Periksa lagi data yang belum lengkap.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return false;
    }

    setGeneralError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !user) return;

    if (!validateForm()) return;

    setIsSubmitting(true);
    setGeneralError(null);

    // Siapkan array foto untuk backend
    const photosPayload: EditPhotoEntry[] = photoItems.map((item) => {
      if (item.type === 'existing') {
        return { type: 'existing', url: item.url };
      } else {
        return { type: 'file', file: item.file as File };
      }
    });

    const cleanWa = whatsapp.trim().replace(/\D/g, '');
    const cleanIg = instagram.trim().replace(/^@/, '');

    const result = await updateProductInDb({
      productId,
      sellerId: user.id,
      title: title.trim(),
      description: description.trim(),
      price: rawPrice,
      category,
      condition,
      location: location.trim() || 'Kantin Utama',
      photos: photosPayload,
      contactPhone: cleanWa || undefined,
      contactInstagram: cleanIg || undefined,
      status,
    });

    if (result.error) {
      setGeneralError(result.error.message || 'Gagal menyimpan perubahan barang.');
      setIsSubmitting(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Arahkan ke halaman detail produk dengan notifikasi sukses
    router.push(`/product/${productId}?justUpdated=true`);
  };

  if (authLoading || isFetchingProduct) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
      </div>
    );
  }

  // Not authorized state
  if (isUnauthorized) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg p-6 sm:p-8 border border-slate-200 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-bold text-slate-900">Tidak Ada Izin</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Kamu tidak memiliki izin untuk mengedit barang ini karena bukan pemilik iklan.
          </p>
          <Link
            href="/my-products"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-medium transition-colors min-h-[44px]"
          >
            <span>Kembali ke Produk Saya</span>
          </Link>
        </div>
      </div>
    );
  }

  // Fetch error state
  if (fetchError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg p-6 sm:p-8 border border-slate-200 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-bold text-slate-900">Barang Tidak Ditemukan</h1>
          <p className="text-xs sm:text-sm text-slate-500">{fetchError}</p>
          <Link
            href="/my-products"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-medium transition-colors min-h-[44px]"
          >
            <span>Kembali ke Produk Saya</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-28 sm:pb-16">
      {/* Top Bar Navigation */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 h-14 sm:h-16 flex items-center justify-between">
          <Link
            href="/my-products"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors -ml-1 min-h-[44px] px-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali</span>
          </Link>
          <span className="text-sm font-bold text-slate-900 truncate">Edit Iklan Barang</span>
          <Link
            href={`/product/${productId}`}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors min-h-[44px] flex items-center px-2"
          >
            Lihat Iklan
          </Link>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 pt-4 sm:pt-6">
        {/* Header Title Section */}
        <div className="mb-5">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Edit Detail Barang
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Perbarui foto, harga, deskripsi, atau status ketersediaan barangmu.
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

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Status Switcher Box */}
          <div className="bg-white rounded-lg p-4 sm:p-5 border border-slate-200">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Status Iklan Barang
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setStatus('active')}
                className={`py-2 px-3 rounded-md border text-xs sm:text-sm font-medium transition-colors min-h-[44px] flex items-center justify-center gap-1.5 cursor-pointer ${
                  status === 'active'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>Aktif</span>
              </button>
              <button
                type="button"
                onClick={() => setStatus('sold')}
                className={`py-2 px-3 rounded-md border text-xs sm:text-sm font-medium transition-colors min-h-[44px] flex items-center justify-center gap-1.5 cursor-pointer ${
                  status === 'sold'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700 font-semibold'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>Terjual</span>
              </button>
              <button
                type="button"
                onClick={() => setStatus('draft')}
                className={`py-2 px-3 rounded-md border text-xs sm:text-sm font-medium transition-colors min-h-[44px] flex items-center justify-center gap-1.5 cursor-pointer ${
                  status === 'draft'
                    ? 'border-amber-600 bg-amber-50 text-amber-700 font-semibold'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>Draft</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              Pilih &quot;Terjual&quot; jika barang sudah laku, atau &quot;Draft&quot; untuk menyembunyikannya sementara dari beranda.
            </p>
          </div>

          {/* 1. KOTAK FOTO */}
          <div className="bg-white rounded-lg p-4 sm:p-5 border border-slate-200">
            <ProductPhotoPicker
              items={photoItems}
              onItemsChange={(newItems) => {
                setPhotoItems(newItems);
                if (errors.photos) {
                  setErrors((prev) => ({ ...prev, photos: '' }));
                }
              }}
              error={errors.photos}
            />
          </div>

          {/* 2. DETAIL INFORMASI BARANG */}
          <div className="bg-white rounded-lg p-4 sm:p-5 border border-slate-200 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-blue-600" />
              <span>Informasi Barang</span>
            </h2>

            {/* Nama Barang */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="edit-title" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Nama Barang *
                </label>
                <span className="text-[11px] text-slate-400">
                  {title.length}/80
                </span>
              </div>
              <input
                id="edit-title"
                type="text"
                maxLength={80}
                placeholder="Contoh: Jaket Denim Uniqlo Size L Original"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
                }}
                className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-md text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden min-h-[44px] transition-colors ${
                  errors.title ? 'border-rose-300 focus:border-rose-500 bg-rose-50/20' : 'border-slate-200 focus:border-blue-600'
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
                <label htmlFor="edit-price" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Harga Barang *
                </label>
                <input
                  id="edit-price"
                  type="text"
                  inputMode="numeric"
                  placeholder="Contoh: Rp 75.000"
                  value={displayPrice}
                  onChange={handlePriceChange}
                  className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-md text-sm font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:bg-white focus:outline-hidden min-h-[44px] transition-colors ${
                    errors.price ? 'border-rose-300 focus:border-rose-500 bg-rose-50/20' : 'border-slate-200 focus:border-blue-600'
                  }`}
                />
                {errors.price && (
                  <p role="alert" className="text-xs font-medium text-rose-600 mt-1">
                    {errors.price}
                  </p>
                )}
              </div>

              {/* Kategori */}
              <div>
                <label htmlFor="edit-category" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Kategori *
                </label>
                <select
                  id="edit-category"
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value as CategorySlug);
                    if (errors.category) setErrors((prev) => ({ ...prev, category: '' }));
                  }}
                  className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-md text-sm text-slate-900 focus:bg-white focus:outline-hidden min-h-[44px] transition-colors ${
                    errors.category ? 'border-rose-300 focus:border-rose-500 bg-rose-50/20' : 'border-slate-200 focus:border-blue-600'
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
                      className={`text-left p-3 rounded-md border transition-colors min-h-[44px] cursor-pointer ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/60'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
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

            {/* Titik COD */}
            <div>
              <label htmlFor="edit-location" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Lokasi / Titik COD *
              </label>
              <input
                id="edit-location"
                type="text"
                placeholder="Contoh: Kantin Utama / Gedung B"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-hidden min-h-[44px]"
              />
            </div>

            {/* Deskripsi */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="edit-desc" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Deskripsi Barang *
                </label>
                <span className={`text-[11px] ${description.length < 15 ? 'text-amber-600' : 'text-slate-400'}`}>
                  {description.length} karakter (min. 15)
                </span>
              </div>
              <textarea
                id="edit-desc"
                rows={4}
                placeholder="Ceritakan detail barang..."
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (errors.description) setErrors((prev) => ({ ...prev, description: '' }));
                }}
                className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-md text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden transition-colors ${
                  errors.description ? 'border-rose-300 focus:border-rose-500 bg-rose-50/20' : 'border-slate-200 focus:border-blue-600'
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
          <div className="bg-white rounded-lg p-4 sm:p-5 border border-slate-200 space-y-3.5">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Kontak Penjual
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Isi minimal satu kontak agar calon pembeli dapat menghubungimu.
              </p>
            </div>

            {errors.contact && (
              <p role="alert" className="text-xs font-medium text-rose-600 p-2.5 bg-rose-50 rounded-md border border-rose-200">
                {errors.contact}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* WhatsApp */}
              <div>
                <label htmlFor="edit-wa" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Nomor WhatsApp
                </label>
                <input
                  id="edit-wa"
                  type="tel"
                  inputMode="tel"
                  placeholder="Contoh: 081234567890"
                  value={whatsapp}
                  onChange={(e) => {
                    setWhatsapp(e.target.value);
                    if (errors.whatsapp) setErrors((prev) => ({ ...prev, whatsapp: '' }));
                    if (errors.contact) setErrors((prev) => ({ ...prev, contact: '' }));
                  }}
                  className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-md text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden min-h-[44px] transition-colors ${
                    errors.whatsapp ? 'border-rose-300 focus:border-rose-500 bg-rose-50/20' : 'border-slate-200 focus:border-blue-600'
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
                <label htmlFor="edit-ig" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Username Instagram (Opsional)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">
                    @
                  </span>
                  <input
                    id="edit-ig"
                    type="text"
                    placeholder="username"
                    value={instagram}
                    onChange={(e) => {
                      setInstagram(e.target.value.replace(/^@/, ''));
                      if (errors.instagram) setErrors((prev) => ({ ...prev, instagram: '' }));
                      if (errors.contact) setErrors((prev) => ({ ...prev, contact: '' }));
                    }}
                    className={`w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border rounded-md text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden min-h-[44px] transition-colors ${
                      errors.instagram ? 'border-rose-300 focus:border-rose-500 bg-rose-50/20' : 'border-slate-200 focus:border-blue-600'
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
            <Link
              href="/my-products"
              className="px-5 py-2.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm transition-colors min-h-[44px] flex items-center justify-center cursor-pointer"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-md bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-sm transition-colors min-h-[44px] flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan Perubahan...</span>
                </>
              ) : (
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Perubahan</span>
                </div>
              )}
            </button>
          </div>
        </form>
      </main>

      {/* Sticky Bottom Action Bar di Layar HP */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 p-3 pb-[max(12px,env(safe-area-inset-bottom))]">
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          <Link
            href="/my-products"
            className="w-1/3 min-h-[44px] py-2.5 px-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs rounded-md transition-colors text-center flex items-center justify-center cursor-pointer"
          >
            Batal
          </Link>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit}
            className="flex-1 min-h-[44px] py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-sm rounded-md transition-colors flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
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
      </div>
    </div>
  );
}
