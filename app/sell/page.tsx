'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { CategorySlug, ProductCondition } from '@/types/market';
import { CATEGORIES } from '@/data/products';
import { createProductInDb } from '@/lib/supabase/products';

const SAMPLE_PHOTO_PRESETS = [
  {
    label: 'Elektronik / Gadget',
    url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80',
  },
  {
    label: 'Fashion / Pakaian',
    url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&auto=format&fit=crop&q=80',
  },
  {
    label: 'Buku / Catatan',
    url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
  },
  {
    label: 'Aksesori / Barang Sehari-hari',
    url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&auto=format&fit=crop&q=80',
  },
  {
    label: 'Hobi / Olahraga',
    url: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600&auto=format&fit=crop&q=80',
  },
  {
    label: 'Makanan / Camilan',
    url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&auto=format&fit=crop&q=80',
  }
];

export default function SellPage() {
  const router = useRouter();
  const { user, profile, isLoading: authLoading, isConfigured } = useAuth();

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState<CategorySlug>('fashion');
  const [condition, setCondition] = useState<ProductCondition>('Bekas - Mulus');
  const [location, setLocation] = useState('Kantin Utama');
  const [description, setDescription] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState(SAMPLE_PHOTO_PRESETS[1].url);
  const [customPhotoUrl, setCustomPhotoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Protected route check
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirectTo=/sell');
    }
  }, [user, authLoading, router]);

  if (authLoading || (!user && !isSuccess)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !price || !user) return;
    setErrorMessage(null);

    const numPrice = parseInt(price.replace(/\D/g, ''), 10) || 10000;
    const finalImageUrl = customPhotoUrl.trim() || selectedPhoto;

    setIsSubmitting(true);

    if (isConfigured) {
      const result = await createProductInDb({
        sellerId: user.id,
        title: title.trim(),
        description: description.trim() || 'Barang milik pribadi, kondisi terawat. Silakan hubungi langsung untuk janjian ketemuan/COD.',
        price: numPrice,
        category,
        condition,
        location: location.trim() || 'Kantin Utama',
        images: [finalImageUrl],
      });

      if (result.error) {
        setErrorMessage(result.error.message || 'Gagal menyimpan barang ke database.');
        setIsSubmitting(false);
        return;
      }
    }

    setIsSubmitting(false);
    setIsSuccess(true);
    setTimeout(() => {
      router.push('/');
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto">
        {/* Back Link */}
        <div className="mb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Pasang Iklan Barang</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Jual barang yang sudah tidak terpakai ke sesama warga Nepal Market
            </p>
          </div>

          {isSuccess ? (
            <div className="p-10 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <Check className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Iklan Berhasil Diterbitkan!</h2>
              <p className="text-sm text-slate-500">Mengarahkan kembali ke beranda...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-800">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Title */}
              <div>
                <label htmlFor="sell-title" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Nama Barang *
                </label>
                <input
                  id="sell-title"
                  type="text"
                  required
                  placeholder="Contoh: Jaket Hoodie Oversize Abu Mist Size L"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-hidden min-h-[44px]"
                />
              </div>

              {/* Price & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="sell-price" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Harga (Rp) *
                  </label>
                  <input
                    id="sell-price"
                    type="number"
                    required
                    min={1000}
                    step={1000}
                    placeholder="Contoh: 75000"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-hidden min-h-[44px]"
                  />
                </div>

                <div>
                  <label htmlFor="sell-category" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Kategori *
                  </label>
                  <select
                    id="sell-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as CategorySlug)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-hidden min-h-[44px]"
                  >
                    {CATEGORIES.filter((c) => c.slug !== 'semua').map((cat) => (
                      <option key={cat.slug} value={cat.slug}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Condition & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="sell-condition" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Kondisi *
                  </label>
                  <select
                    id="sell-condition"
                    value={condition}
                    onChange={(e) => setCondition(e.target.value as ProductCondition)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-hidden min-h-[44px]"
                  >
                    <option value="Baru">Baru</option>
                    <option value="Bekas - Seperti Baru">Bekas - Seperti Baru</option>
                    <option value="Bekas - Mulus">Bekas - Mulus</option>
                    <option value="Bekas - Layak">Bekas - Layak</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="sell-location" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Titik COD / Ketemuan *
                  </label>
                  <input
                    id="sell-location"
                    type="text"
                    required
                    placeholder="Contoh: Kantin Utama / Gedung B"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-hidden min-h-[44px]"
                  />
                </div>
              </div>

              {/* Image Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Foto Barang
                </label>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {SAMPLE_PHOTO_PRESETS.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSelectedPhoto(item.url);
                        setCustomPhotoUrl('');
                      }}
                      className={`relative aspect-4/3 rounded-lg overflow-hidden border text-[11px] font-medium transition-all ${
                        selectedPhoto === item.url && !customPhotoUrl
                          ? 'border-blue-600 ring-2 ring-blue-600/30'
                          : 'border-slate-200 opacity-75 hover:opacity-100'
                      }`}
                    >
                      <Image src={item.url} alt={item.label} fill sizes="120px" className="object-cover" referrerPolicy="no-referrer" />
                      <span className="absolute inset-x-0 bottom-0 bg-slate-900/75 text-white py-0.5 px-1 text-[10px] truncate block z-10">
                        {item.label}
                      </span>
                    </button>
                  ))}
                </div>
                <input
                  type="url"
                  placeholder="Atau tempel tautan foto kustom (opsional)"
                  value={customPhotoUrl}
                  onChange={(e) => setCustomPhotoUrl(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="sell-desc" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Deskripsi Barang
                </label>
                <textarea
                  id="sell-desc"
                  rows={4}
                  placeholder="Ceritakan detail pemakaian, kondisi fisik, dan alasan dijual..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full min-h-[44px] py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menerbitkan Iklan...</span>
                    </>
                  ) : (
                    <span>Terbitkan Iklan Sekarang</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
