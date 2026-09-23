'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  X, 
  MapPin, 
  Bookmark, 
  MessageCircle, 
  Instagram, 
  AlertCircle, 
  ExternalLink,
  ImageIcon
} from 'lucide-react';
import { Product } from '@/types/market';
import { formatConditionLabel, formatRupiah } from '@/data/products';

interface QuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  isSaved: boolean;
  onClose: () => void;
  onToggleSave: (id: string) => void;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({
  product,
  isOpen,
  isSaved,
  onClose,
  onToggleSave,
}) => {
  const [imgError, setImgError] = useState(false);

  if (!isOpen || !product) return null;

  const isSold = Boolean(product.isSold || !product.isAvailable);
  const seller = product.seller;
  const rawPhone = (seller?.whatsapp || '').trim();
  const cleanPhone = rawPhone.replace(/\D/g, '').replace(/^0/, '62');
  const hasWhatsApp = Boolean(cleanPhone && cleanPhone.length >= 8);

  const rawIg = (seller?.instagram || '').trim().replace(/^@/, '');
  const hasInstagram = Boolean(rawIg);
  const instagramUrl = hasInstagram ? `https://instagram.com/${rawIg}` : null;

  const handleContactWhatsApp = () => {
    if (!hasWhatsApp) return;
    const defaultWaMessage = `Halo ${seller?.name || 'Penjual'}, saya tertarik dengan barang "${product.title}" (${formatRupiah(product.price)}) di Nepal Market. Apakah masih ada?`;
    window.open(
      `https://wa.me/${cleanPhone}?text=${encodeURIComponent(defaultWaMessage)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const handleContactInstagram = () => {
    if (!instagramUrl) return;
    window.open(instagramUrl, '_blank', 'noopener,noreferrer');
  };

  const hasImage = Boolean(product.imageUrl && product.imageUrl.trim().length > 0 && !imgError);

  return (
    <div 
      id="quick-view-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        id="quick-view-modal-content"
        className="relative w-full max-w-lg bg-white rounded-lg overflow-hidden border border-slate-200 my-auto text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tombol Tutup */}
        <button
          id="btn-close-quickview"
          type="button"
          aria-label="Tutup jendela ringkas"
          onClick={onClose}
          className="absolute top-2.5 right-2.5 z-20 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-700 flex items-center justify-center border border-slate-200 transition-colors cursor-pointer min-h-[36px] min-w-[36px]"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Gambar Produk (Aspect 1:1 Konsisten) */}
        <div className="relative w-full aspect-square bg-slate-100">
          {hasImage ? (
            <Image
              src={product.imageUrl}
              alt={product.title}
              fill
              sizes="(max-width: 640px) 100vw, 600px"
              className={`object-cover ${isSold ? 'opacity-70 grayscale-[0.4]' : ''}`}
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 p-4 text-center">
              <ImageIcon className="w-10 h-10 stroke-1 mb-1 text-slate-300" />
              <span className="text-xs text-slate-400">Foto barang tidak tersedia</span>
            </div>
          )}

          {/* Badge Status */}
          <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5">
            <span className="inline-block bg-slate-900/85 text-white text-xs font-medium px-2 py-0.5 rounded-sm">
              {formatConditionLabel(product.condition)}
            </span>
            {isSold && (
              <span className="inline-block bg-slate-900 text-white text-xs font-semibold px-2 py-0.5 rounded-sm uppercase tracking-wide">
                Terjual
              </span>
            )}
          </div>
        </div>

        {/* Info Inti Produk */}
        <div className="p-4 sm:p-5 space-y-3">
          {/* Header Info: Harga, Judul, Bookmark */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className={`tracking-tight ${
                  isSold 
                    ? 'text-lg sm:text-xl font-semibold text-slate-400 line-through' 
                    : 'text-xl sm:text-2xl font-bold text-slate-900'
                }`}>
                  {formatRupiah(product.price)}
                </span>
                {isSold && (
                  <span className="text-xs font-medium text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded-sm">
                    Sudah Terjual
                  </span>
                )}
              </div>
              <h2 className="mt-1 text-sm sm:text-base font-semibold text-slate-900 leading-snug break-words">
                {product.title}
              </h2>
            </div>

            <button
              id="btn-quickview-save"
              type="button"
              onClick={() => onToggleSave(product.id)}
              aria-label={isSaved ? 'Hapus dari simpanan' : 'Simpan barang'}
              className="w-9 h-9 rounded-md border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-600 transition-colors shrink-0 cursor-pointer min-h-[38px] min-w-[38px]"
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-blue-600 text-blue-600' : ''}`} />
            </button>
          </div>

          {/* Lokasi COD & Penjual (Pemisah garis biasa tanpa nesting kartu) */}
          <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="truncate">Lokasi COD: <strong className="text-slate-900 font-semibold">{product.location || 'Sesuai kesepakatan'}</strong></span>
            </div>
            <div className="truncate text-slate-500">
              Penjual: <strong className="text-slate-800 font-medium">{seller?.name || 'Warga'}</strong>
            </div>
          </div>

          {/* Deskripsi Barang */}
          {product.description && (
            <div className="pt-2.5 border-t border-slate-100 text-xs sm:text-sm text-slate-600 leading-relaxed max-h-32 overflow-y-auto whitespace-pre-line">
              {product.description}
            </div>
          )}

          {/* Langkah Selanjutnya untuk Pembeli & Penjual */}
          <div className="pt-2.5 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
            <div className="font-semibold text-slate-700">Langkah Transaksi COD:</div>
            <p>1. Hubungi penjual untuk menyepakati harga dan titik temu.</p>
            <p>2. Periksa langsung kondisi barang di tempat sebelum melakukan pembayaran.</p>
          </div>

          {/* Kontak Seller Buttons */}
          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row gap-2">
            {isSold ? (
              <button
                type="button"
                disabled
                className="w-full py-2 px-3 bg-slate-100 text-slate-400 text-xs sm:text-sm font-medium rounded-md cursor-not-allowed border border-slate-200 text-center min-h-[40px]"
              >
                Barang Sudah Terjual
              </button>
            ) : hasWhatsApp ? (
              <>
                <button
                  id="btn-quickview-whatsapp"
                  type="button"
                  onClick={handleContactWhatsApp}
                  className="flex-1 min-h-[40px] inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-medium rounded-md transition-colors cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Hubungi via WhatsApp</span>
                </button>
                {hasInstagram && (
                  <button
                    id="btn-quickview-instagram"
                    type="button"
                    onClick={handleContactInstagram}
                    className="sm:w-auto px-3 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-medium rounded-md transition-colors inline-flex items-center justify-center gap-1.5 min-h-[40px] cursor-pointer"
                  >
                    <Instagram className="w-4 h-4" />
                    <span>Instagram</span>
                  </button>
                )}
              </>
            ) : hasInstagram ? (
              <button
                id="btn-quickview-instagram"
                type="button"
                onClick={handleContactInstagram}
                className="flex-1 min-h-[40px] inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-medium rounded-md transition-colors cursor-pointer"
              >
                <Instagram className="w-4 h-4" />
                <span>Hubungi via Instagram (@{rawIg})</span>
              </button>
            ) : (
              <div className="flex-1 p-2 bg-amber-50 border border-amber-200 rounded-md text-[11px] text-amber-800 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Penjual belum mencantumkan nomor WhatsApp atau akun Instagram.</span>
              </div>
            )}

            <Link
              href={`/product/${product.id}`}
              onClick={onClose}
              className="px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-medium rounded-md transition-colors inline-flex items-center justify-center gap-1 text-center min-h-[40px]"
            >
              <span>Halaman Lengkap</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
