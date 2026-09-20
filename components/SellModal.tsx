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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

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
            <p className="text-xs text-slate-500">Tawarkan barang layak pakai ke pembeli di sekitarmu</p>
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
                Masuk terlebih dahulu agar calon pembeli dapat menghubungimu secara langsung.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/login?redirectTo=/"
                onClick={onClose}
                className="w-full min-h-[44px] py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-colors inline-flex items-center justify-center gap-2 shadow-xs"
              >
                <LogIn className="w-4 h-4" />
                <span>Masuk untuk Mulai Jual</span>
              </Link>
            </div>
          </div>
        ) : isSuccess ? (
          <div className="p-8 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <Check className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Iklan Berhasil Diterbitkan</h3>
            <p className="text-sm text-slate-500">Barangmu sudah tampil dan dapat dilihat oleh calon pembeli.</p>
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
                Judul Barang *
              </label>
              <input
                id="input-sell-title"
                type="text"
                required
                maxLength={90}
                placeholder="Contoh: Jaket Parasut Navy Ukuran L"
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
                  Lokasi COD *
                </label>
                <input
                  id="input-sell-location"
                  type="text"
                  required
                  placeholder="Contoh: Kantin Utama atau Depan Gerbang"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-hidden min-h-[44px]"
                />
              </div>
            </div>

            <ProductPhotoPicker files={photos} onChange={setPhotos} />

            {/* Deskripsi */}
            <div>
              <label htmlFor="input-sell-description" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Deskripsi Barang
              </label>
              <textarea
                id="input-sell-description"
                rows={3}
                placeholder="Ceritakan kondisi fisik, kelengkapan, atau alasan dijual..."
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
                  Nomor WhatsApp (Aktif)
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
                    <span>Menerbitkan Iklan...</span>
                  </>
                ) : (
                  <span>Terbitkan Iklan</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
