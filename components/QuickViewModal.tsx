'use client';

import React from 'react';
import Image from 'next/image';
import { X, MapPin, Clock, Bookmark, MessageCircle, ShieldCheck } from 'lucide-react';
import { Product } from '@/types/market';
import { formatRupiah } from '@/data/products';

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
  if (!isOpen || !product) return null;

  const handleContactWhatsApp = () => {
    const phone = product.seller.whatsapp || '6281234567890';
    const message = encodeURIComponent(
      `Halo ${product.seller.name}, saya tertarik dengan barang "${product.title}" (${formatRupiah(product.price)}) yang dipasang di Nepal Market. Apakah masih ada?`
    );
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  return (
    <div 
      id="quick-view-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div 
        id="quick-view-modal-content"
        className="relative w-full max-w-lg bg-white rounded-2xl overflow-hidden shadow-xl border border-slate-200/90 my-auto text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tombol Tutup */}
        <button
          id="btn-close-quickview"
          type="button"
          aria-label="Tutup jendela detail"
          onClick={onClose}
          className="absolute top-3 right-3 z-20 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-slate-700 flex items-center justify-center shadow-xs transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Gambar Produk */}
        <div className="relative w-full aspect-4/3 sm:aspect-16/10 bg-slate-100">
          <Image
            src={product.imageUrl}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 100vw, 600px"
            className="object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute bottom-3 left-3">
            <span className="inline-block bg-slate-900/85 backdrop-blur-xs text-white text-xs font-medium px-2.5 py-1 rounded-md shadow-xs">
              Kondisi: {product.condition}
            </span>
          </div>
        </div>

        {/* Info Produk */}
        <div className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {formatRupiah(product.price)}
              </div>
              <h2 className="mt-1 text-base sm:text-lg font-semibold text-slate-800 leading-snug">
                {product.title}
              </h2>
            </div>

            {/* Bookmark button */}
            <button
              id="btn-quickview-save"
              type="button"
              onClick={() => onToggleSave(product.id)}
              aria-label={isSaved ? 'Hapus dari simpanan' : 'Simpan barang'}
              className="w-11 h-11 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors shrink-0"
            >
              <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-blue-600 text-blue-600' : 'text-slate-600'}`} />
            </button>
          </div>

          {/* Lokasi & Waktu */}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span>Area COD: <strong className="text-slate-700 font-medium">{product.location}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{product.postedAt}</span>
            </div>
          </div>

          {/* Deskripsi */}
          <div className="mt-3.5">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Deskripsi Barang
            </h4>
            <p className="mt-1 text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          </div>

          {/* Info Penjual */}
          <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-semibold flex items-center justify-center text-sm">
                {product.seller.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-slate-900">{product.seller.name}</span>
                  {product.seller.isVerified && (
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  )}
                </div>
                <div className="text-[11px] text-slate-500">Penjual Komunitas • {product.seller.location}</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-5 flex gap-2.5">
            <button
              id="btn-contact-seller"
              type="button"
              onClick={handleContactWhatsApp}
              className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-medium rounded-xl transition-colors shadow-xs"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Hubungi Penjual</span>
            </button>
            <button
              id="btn-close-modal"
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-xl transition-colors"
            >
              Tutup
            </button>
          </div>

          <div className="mt-2.5 text-center">
            <span className="text-[11px] text-slate-400">
              Transaksi & penyerahan barang dilakukan langsung antara kamu dan penjual.
            </span>
          </div>

        </div>
      </div>
    </div>
  );
};
