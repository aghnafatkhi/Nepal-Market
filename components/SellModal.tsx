'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, Check, LogIn, Loader2, AlertCircle } from 'lucide-react';
import { CategorySlug, Product, ProductCondition } from '@/types/market';
import { CATEGORIES } from '@/data/products';
import { useAuth } from '@/contexts/AuthContext';
import { createProductInDb } from '@/lib/supabase/products';
import { ProductPhotoPicker } from '@/components/ProductPhotoPicker';

interface SellModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProduct: (newProduct: Product) => void;
}



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

  const [photos, setPhotos] = useState<File[]>([]);
  const [firstPhotoPreview, setFirstPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Keyboard Escape listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Thumbnail preview
  useEffect(() => {
    if (photos.length > 0) {
      const url = URL.createObjectURL(photos[0]);
      setFirstPhotoPreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setFirstPhotoPreview(null);
    }
  }, [photos]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !price || !user) return;
    setErrorMessage(null);

    const numPrice = parseInt(price.replace(/\D/g, ''), 10) || 10000;
    if (!isConfigured || photos.length === 0) {
      setErrorMessage(!isConfigured ? 'Layanan akun belum siap. Coba lagi nanti.' : 'Pilih minimal satu foto barang.');
      return;
    }

    setIsSubmitting(true);

    // Jika terhubung ke Supabase dan user login
    if (isConfigured && user) {
      const result = await createProductInDb({
        sellerId: user.id,
        title: title.trim(),
        description: description.trim() || 'Barang pribadi masih layak pakai. Silakan hubungi untuk janjian COD.',
        price: numPrice,
        category,
        condition,
        location: location.trim() || 'Kantin Utama',
        images: photos,
        contactPhone: whatsapp || undefined,
      });

      if (result.error) {
        setErrorMessage(result.error.message || 'Gagal memasang iklan. Silakan periksa koneksi dan coba lagi.');
        setIsSubmitting(false);
        return;
      }

      if (result.product) {
        onAddProduct(result.product);
      }
    }

    setIsSubmitting(false);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
      setTitle('');
      setPrice('');
      setDescription('');
      setPhotos([]);
      setCustomSellerName(null);
      setCustomWhatsapp(null);
    }, 900);
  };

  return (
    <div 
      id="sell-modal-backdrop"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        id="sell-modal-content"
        className="relative w-full max-w-lg bg-white rounded-t-xl sm:rounded-lg overflow-hidden border border-slate-200 text-left max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 shrink-0">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Pasang Iklan</h2>
            <p className="text-xs text-slate-500">Tawarkan barang layak pakai ke pembeli sekitar</p>
          </div>
          <button
            id="btn-close-sell-modal"
            type="button"
            aria-label="Tutup form jual"
            onClick={onClose}
            className="w-8 h-8 rounded hover:bg-slate-100 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cek Login User */}
        {!user ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <LogIn className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Masuk untuk Pasang Iklan</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                Masuk terlebih dahulu agar pembeli dapat menghubungimu langsung.
              </p>
            </div>
            <div className="pt-1">
              <Link
                href="/login?redirectTo=/"
                onClick={onClose}
                className="w-full min-h-[40px] py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-md transition-colors inline-flex items-center justify-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Masuk Sekarang</span>
              </Link>
            </div>
          </div>
        ) : isSuccess ? (
          <div className="p-8 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <Check className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Iklan Berhasil Diterbitkan</h3>
            <p className="text-xs text-slate-500">Barangmu sudah tampil di pasar.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
            {errorMessage && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-md flex items-start gap-2 text-xs text-rose-800">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* 1. FOTO */}
            <div>
              <label className="block text-xs font-semibold text-slate-900 mb-1">
                1. Foto Barang *
              </label>
              <ProductPhotoPicker files={photos} onChange={setPhotos} />
            </div>

            {/* 2. NAMA BARANG */}
            <div>
              <label htmlFor="input-sell-title" className="block text-xs font-semibold text-slate-900 mb-1">
                2. Nama Barang *
              </label>
              <input
                id="input-sell-title"
                type="text"
                required
                maxLength={90}
                placeholder="Contoh: Jaket Parasut Navy Ukuran L"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-hidden min-h-[40px]"
              />
            </div>

            {/* 3. KATEGORI */}
            <div>
              <label htmlFor="select-sell-category" className="block text-xs font-semibold text-slate-900 mb-1">
                3. Kategori *
              </label>
              <select
                id="select-sell-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as CategorySlug)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-hidden min-h-[40px]"
              >
                {CATEGORIES.filter((c) => c.slug !== 'semua').map((cat) => (
                  <option key={cat.slug} value={cat.slug}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. KONDISI */}
            <div>
              <label htmlFor="select-sell-condition" className="block text-xs font-semibold text-slate-900 mb-1">
                4. Kondisi *
              </label>
              <select
                id="select-sell-condition"
                value={condition}
                onChange={(e) => setCondition(e.target.value as ProductCondition)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-hidden min-h-[40px]"
              >
                <option value="Baru">Baru</option>
                <option value="Bekas - Seperti Baru">Bekas - Seperti Baru</option>
                <option value="Bekas - Mulus">Bekas - Mulus</option>
                <option value="Bekas - Layak">Bekas - Layak</option>
              </select>
            </div>

            {/* 5. HARGA */}
            <div>
              <label htmlFor="input-sell-price" className="block text-xs font-semibold text-slate-900 mb-1">
                5. Harga (Rp) *
              </label>
              <input
                id="input-sell-price"
                type="number"
                required
                min={1000}
                step={1000}
                placeholder="75000"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-hidden min-h-[40px]"
              />
            </div>

            {/* 6. DESKRIPSI */}
            <div>
              <label htmlFor="input-sell-description" className="block text-xs font-semibold text-slate-900 mb-1">
                6. Deskripsi Barang
              </label>
              <textarea
                id="input-sell-description"
                rows={2}
                placeholder="Ceritakan kelengkapan, minus fisik jika ada, atau alasan dijual..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            {/* 7. LOKASI COD */}
            <div>
              <label htmlFor="input-sell-location" className="block text-xs font-semibold text-slate-900 mb-1">
                7. Lokasi COD *
              </label>
              <input
                id="input-sell-location"
                type="text"
                required
                placeholder="Contoh: Kantin Utama atau Depan Gerbang"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-hidden min-h-[40px]"
              />
            </div>

            {/* 8. KONTAK */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="input-sell-name" className="block text-xs font-semibold text-slate-900 mb-1">
                  Nama Kontak
                </label>
                <input
                  id="input-sell-name"
                  type="text"
                  placeholder="Nama penjual"
                  value={sellerName}
                  onChange={(e) => setCustomSellerName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-900 min-h-[40px]"
                />
              </div>
              <div>
                <label htmlFor="input-sell-wa" className="block text-xs font-semibold text-slate-900 mb-1">
                  WhatsApp
                </label>
                <input
                  id="input-sell-wa"
                  type="tel"
                  placeholder="08123456789"
                  value={whatsapp}
                  onChange={(e) => setCustomWhatsapp(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-900 min-h-[40px]"
                />
              </div>
            </div>

            {/* 9. PREVIEW & SUBMIT */}
            <div className="pt-2 border-t border-slate-100">
              <div className="mb-3 p-2.5 bg-slate-50 border border-slate-200 rounded-md flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-slate-200 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                  {firstPhotoPreview ? (
                    <img src={firstPhotoPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[9px] text-slate-400">Foto</span>
                  )}
                </div>
                <div className="flex-1 min-w-0 text-xs text-slate-600">
                  <p className="font-bold text-slate-900 truncate">{title.trim() || 'Nama Barang'}</p>
                  <p className="text-[11px] text-slate-500 truncate">Rp {Number(price || 0).toLocaleString('id-ID')} &bull; {location}</p>
                </div>
              </div>

              <button
                id="btn-submit-sell"
                type="submit"
                disabled={isSubmitting}
                className="w-full min-h-[42px] py-2 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs rounded-md transition-colors flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
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
          </form>
        )}
      </div>
    </div>
  );
};
