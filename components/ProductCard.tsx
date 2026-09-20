'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Bookmark, MapPin, Clock } from 'lucide-react';
import { Product } from '@/types/market';
import { formatRupiah } from '@/data/products';

interface ProductCardProps {
  product: Product;
  isSaved: boolean;
  onToggleSave: (productId: string) => void;
  onOpenDetail?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isSaved,
  onToggleSave,
}) => {
  const isSold = Boolean(product.isSold || !product.isAvailable);

  return (
    <article
      id={`product-card-${product.id}`}
      className={`group relative flex flex-col bg-white border rounded-xl overflow-hidden transition-all duration-200 focus-within:ring-2 focus-within:ring-blue-600/30 ${
        isSold 
          ? 'border-slate-200/90 bg-slate-50/60' 
          : 'border-slate-200/90 hover:border-blue-400/80'
      }`}
    >
      {/* Container Foto Produk */}
      <Link 
        href={`/product/${product.id}`}
        className="relative aspect-square w-full bg-slate-100 overflow-hidden block"
        aria-label={`Lihat detail ${product.title} ${isSold ? '(Sudah terjual)' : ''}`}
      >
        <Image
          src={product.imageUrl}
          alt={product.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          className={`object-cover transition-transform duration-200 ${
            isSold ? 'grayscale contrast-75 brightness-95' : 'group-hover:scale-103'
          }`}
          referrerPolicy="no-referrer"
          priority={false}
        />

        {/* Overlay Khusus Produk Terjual */}
        {isSold ? (
          <div className="absolute inset-0 bg-slate-950/35 flex items-center justify-center p-2 z-10 pointer-events-none">
            <span 
              id={`badge-sold-overlay-${product.id}`}
              className="inline-block bg-slate-950/90 backdrop-blur-xs text-white text-[11px] sm:text-xs font-bold px-3 py-1 rounded-lg shadow-sm uppercase tracking-wider"
            >
              Sudah Terjual
            </span>
          </div>
        ) : (
          /* Badge Kondisi di Atas Foto */
          <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
            <span 
              id={`badge-condition-${product.id}`}
              className="inline-block bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-medium px-2 py-0.5 rounded-md shadow-xs"
            >
              {product.condition}
            </span>
          </div>
        )}

        {/* Tombol Simpan (Bookmark) - Touch Target minimal 44x44px */}
        <button
          id={`btn-save-${product.id}`}
          type="button"
          aria-label={isSaved ? `Hapus ${product.title} dari simpanan` : `Simpan ${product.title}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleSave(product.id);
          }}
          className={`absolute top-1.5 right-1.5 z-10 w-11 h-11 flex items-center justify-center rounded-full transition-colors duration-150 shadow-xs active:scale-95 ${
            isSold 
              ? 'bg-white/75 hover:bg-white text-slate-400 hover:text-slate-600' 
              : 'bg-white/90 hover:bg-white text-slate-700 hover:text-blue-600'
          }`}
        >
          <Bookmark 
            className={`w-5 h-5 transition-transform duration-150 ${
              isSaved ? 'fill-blue-600 text-blue-600' : isSold ? 'text-slate-400' : 'text-slate-600'
            }`} 
          />
        </button>
      </Link>

      {/* Rincian Produk */}
      <Link
        href={`/product/${product.id}`}
        className="p-3 sm:p-3.5 flex flex-col flex-grow justify-between block focus:outline-hidden"
      >
        <div>
          {/* Harga Rupiah */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`tracking-tight ${
              isSold 
                ? 'text-sm sm:text-base font-semibold text-slate-400 line-through' 
                : 'text-base sm:text-lg font-bold text-slate-900'
            }`}>
              {formatRupiah(product.price)}
            </span>
            {isSold && (
              <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                Terjual
              </span>
            )}
          </div>

          {/* Nama Produk (maksimal 2 baris) */}
          <h3 className={`mt-1 text-[13px] sm:text-[14px] font-medium leading-snug line-clamp-2 min-h-[2.5rem] transition-colors ${
            isSold ? 'text-slate-500' : 'text-slate-700 group-hover:text-blue-600'
          }`}>
            {product.title}
          </h3>
        </div>

        {/* Lokasi & Waktu Serah Terima */}
        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5 text-[11px] sm:text-xs text-slate-500">
          <div className="flex items-center gap-1 min-w-0 truncate">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
            <span className="truncate">{product.location}</span>
          </div>
          <div className="shrink-0 text-slate-400 whitespace-nowrap text-[10px] sm:text-[11px]">
            {product.postedAt}
          </div>
        </div>
      </Link>
    </article>
  );
};
