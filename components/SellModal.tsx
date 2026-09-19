'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, Check, LogIn, Loader2, AlertCircle } from 'lucide-react';
import { CategorySlug, Product, ProductCondition } from '@/types/market';
import { CATEGORIES } from '@/data/products';
import { useAuth } from '@/contexts/AuthContext';
import { createProductInDb } from '@/lib/supabase/products';

interface SellModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProduct: (newProduct: Product) => void;
}

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

export const SellModal: React.FC<SellModalProps> = ({
  isOpen,
  onClose,
  onAddProduct,
}) => {
  const { user, profile, isConfigured } = useAuth();

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState<CategorySlug>('fashion');
  const [condition, setCondition] = useState<ProductCondition>('Bekas - Mulus');
  const [location, setLocation] = useState('Kantin Utama');
  const [description, setDescription] = useState('');
  const defaultSellerName = profile?.name || user?.user_metadata?.full_name || (user?.email ? user.email.split('@')[0] : '');
  const defaultWhatsapp = profile?.phone || '';

  const [customSellerName, setCustomSellerName] = useState<string | null>(null);
  const [customWhatsapp, setCustomWhatsapp] = useState<string | null>(null);

  const sellerName = customSellerName !== null ? customSellerName : defaultSellerName;
  const whatsapp = customWhatsapp !== null ? customWhatsapp : defaultWhatsapp;

  const [selectedPhoto, setSelectedPhoto] = useState(SAMPLE_PHOTO_PRESETS[1].url);
  const [customPhotoUrl, setCustomPhotoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !price) return;
    setErrorMessage(null);

    const numPrice = parseInt(price.replace(/\D/g, ''), 10) || 10000;
    const finalImageUrl = customPhotoUrl.trim() || selectedPhoto;

    setIsSubmitting(true);

    // Jika terhubung ke Supabase dan user login
    if (isConfigured && user) {
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
        setErrorMessage(result.error.message || 'Gagal menyimpan barang ke database Supabase.');
        setIsSubmitting(false);
        return;
      }

      if (result.product) {
        onAddProduct(result.product);
      }
    } else {
      // Fallback local jika belum ada koneksi db
      const newProd: Product = {
        id: `prod-user-${Date.now()}`,
        title: title.trim(),
        price: numPrice,
        category,
        condition,
        imageUrl: finalImageUrl,
        images: [finalImageUrl],
        location: location.trim() || 'Kantin Utama',
        postedAt: 'Baru saja',
        seller: {
          id: user?.id,
          name: sellerName.trim() || profile?.name || 'Saya (Penjual)',
          location: location.trim() || 'Area Sekitar',
          whatsapp: whatsapp.trim() || '6281234567890',
          isVerified: true,
        },
        description: description.trim() || 'Barang milik pribadi, kondisi terawat. Silakan hubungi langsung untuk janjian ketemuan/COD.',
        isAvailable: true,
      };
      onAddProduct(newProd);
    }

    setIsSubmitting(false);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
      setTitle('');
      setPrice('');
      setDescription('');
      setCustomPhotoUrl('');
      setCustomSellerName(null);
      setCustomWhatsapp(null);
    }, 900);
  };

  return (
    <div 
      id="sell-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div 
        id="sell-modal-content"
        className="relative w-full max-w-lg bg-white rounded-2xl overflow-hidden shadow-xl border border-slate-200/90 my-auto text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Pasang Iklan Barang</h2>
            <p className="text-xs text-slate-500">Tawarkan barangmu ke sesama anggota komunitas</p>
          </div>
          <button
            id="btn-close-sell-modal"
            type="button"
            aria-label="Tutup form jual"
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-slate-100 text-slate-500 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cek Login User */}
        {!user ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <LogIn className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Masuk untuk Pasang Iklan</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                Untuk menjaga keamanan komunitas dan memudahkan pembeli menghubungimu, kamu perlu masuk atau mendaftar terlebih dahulu.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/login?redirectTo=/"
                onClick={onClose}
                className="w-full min-h-[44px] py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-colors inline-flex items-center justify-center gap-2 shadow-xs"
              >
                <LogIn className="w-4 h-4" />
                <span>Masuk Sekarang</span>
              </Link>
            </div>
          </div>
        ) : isSuccess ? (
          <div className="p-8 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <Check className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Barang Berhasil Dipasang</h3>
            <p className="text-sm text-slate-500">Iklanmu kini sudah tampil di feed Nepal Market.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-800">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Judul Barang */}
            <div>
              <label htmlFor="input-sell-title" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Nama Barang *
              </label>
              <input
                id="input-sell-title"
                type="text"
                required
                maxLength={90}
                placeholder="Contoh: Hoodie Oversize Abu Mist Size L"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-hidden min-h-[44px]"
              />
            </div>

            {/* Harga & Kategori */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="input-sell-price" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Harga (Rp) *
                </label>
                <input
                  id="input-sell-price"
                  type="number"
                  required
                  min={1000}
                  step={1000}
                  placeholder="Contoh: 75000"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-hidden min-h-[44px]"
                />
              </div>

              <div>
                <label htmlFor="select-sell-category" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Kategori *
                </label>
                <select
                  id="select-sell-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as CategorySlug)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-hidden min-h-[44px]"
                >
                  {CATEGORIES.filter((c) => c.slug !== 'semua').map((cat) => (
                    <option key={cat.slug} value={cat.slug}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Kondisi & Lokasi COD */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="select-sell-condition" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Kondisi *
                </label>
                <select
                  id="select-sell-condition"
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as ProductCondition)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-hidden min-h-[44px]"
                >
                  <option value="Baru">Baru</option>
                  <option value="Bekas - Seperti Baru">Bekas - Seperti Baru</option>
                  <option value="Bekas - Mulus">Bekas - Mulus</option>
                  <option value="Bekas - Layak">Bekas - Layak</option>
                </select>
              </div>

              <div>
                <label htmlFor="input-sell-location" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Area Ketemuan / COD *
                </label>
                <input
                  id="input-sell-location"
                  type="text"
                  required
                  placeholder="Misal: Kantin Utama / Depan Lab"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-hidden min-h-[44px]"
                />
              </div>
            </div>

            {/* Pilihan Foto Produk */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Pilih Foto Sampul (Atau Tempel URL Foto)
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
                id="input-sell-photo-url"
                type="url"
                placeholder="Atau tempel URL foto kustom (opsional)"
                value={customPhotoUrl}
                onChange={(e) => setCustomPhotoUrl(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400"
              />
            </div>

            {/* Deskripsi */}
            <div>
              <label htmlFor="input-sell-description" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Deskripsi Singkat
              </label>
              <textarea
                id="input-sell-description"
                rows={3}
                placeholder="Jelaskan alasan dijual, kelengkapan, atau minus jika ada..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            {/* Kontak WhatsApp & Nama */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div>
                <label htmlFor="input-sell-name" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Nama Penjual
                </label>
                <input
                  id="input-sell-name"
                  type="text"
                  placeholder="Misal: Dimas"
                  value={sellerName}
                  onChange={(e) => setCustomSellerName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900"
                />
              </div>
              <div>
                <label htmlFor="input-sell-wa" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Nomor WhatsApp (Untuk COD)
                </label>
                <input
                  id="input-sell-wa"
                  type="tel"
                  placeholder="Contoh: 08123456789"
                  value={whatsapp}
                  onChange={(e) => setCustomWhatsapp(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="pt-3">
              <button
                id="btn-submit-sell"
                type="submit"
                disabled={isSubmitting}
                className="w-full min-h-[44px] py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menyimpan Barang...</span>
                  </>
                ) : (
                  <span>Pasang Iklan Sekarang</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
