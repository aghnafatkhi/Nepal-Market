'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Bookmark, ImageIcon } from 'lucide-react';
import { Product } from '@/types/market';
import { formatRupiah } from '@/data/products';

interface ProductCardProps {
  product: Product;
  isSaved: boolean;
  onToggleSave: (productId: string) => void;
  onOpenDetail?: (product: Product) => void;
  imagePriority?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isSaved,
  onToggleSave,
  imagePriority = false,
}) => {
  const isSold = Boolean(product.isSold || !product.isAvailable);
  const [imgError, setImgError] = useState(false);

  const hasImage = Boolean(product.imageUrl && product.imageUrl.trim().length > 0 && !imgError);

  return (
    <article
      id={`product-card-${product.id}`}
      className={`group relative flex flex-col bg-white border rounded-2xl overflow-hidden transition-all focus-within:ring-2 focus-within:ring-blue-600 ${
        isSold ? 'border-slate-200 bg-slate-50/40' : 'border-black/[0.07] hover:border-black/15 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(23,23,23,0.08)]'
      }`}
    >
      {/* Container Foto Produk (Aspect 1:1 Konsisten) */}
      <div className="relative aspect-square w-full bg-slate-100 overflow-hidden">
        <Link 
          href={`/product/${product.id}`}
          className="relative w-full h-full block focus:outline-hidden"
          aria-label={`Lihat detail ${product.title} ${isSold ? '(Sudah terjual)' : ''}`}
        >
          {hasImage ? (
            <Image
              src={product.imageUrl}
              alt={product.title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className={`object-cover transition-transform duration-150 ${
                isSold ? 'opacity-70 grayscale-[0.4]' : 'group-hover:scale-[1.02]'
              }`}
              referrerPolicy="no-referrer"
              priority={imagePriority}
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 p-2 text-center">
              <ImageIcon className="w-6 h-6 stroke-1 mb-1" />
              <span className="text-[10px] text-slate-400 font-medium">Foto belum ada</span>
            </div>
          )}

          {/* Badge Sold Out (Jelas tapi tidak menutupi gambar) */}
          {isSold && (
            <div className="absolute top-2 left-2 z-10 pointer-events-none">
              <span 
                id={`badge-sold-${product.id}`}
                className="inline-block bg-slate-900/90 text-white text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-sm uppercase tracking-wide"
              >
                Terjual
              </span>
            </div>
          )}
        </Link>

        {/* Tombol Simpan (Bookmark) - Akses cepat, tidak tertutup link */}
        <button
          id={`btn-save-${product.id}`}
          type="button"
          aria-label={isSaved ? `Hapus ${product.title} dari simpanan` : `Simpan ${product.title}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleSave(product.id);
          }}
          className="absolute top-2 right-2 z-20 w-9 h-9 flex items-center justify-center rounded-full bg-white/95 hover:bg-white text-slate-700 hover:text-blue-600 transition-colors border border-black/5 shadow-sm cursor-pointer active:scale-95"
        >
          <Bookmark 
            className={`w-4 h-4 transition-colors ${
              isSaved ? 'fill-blue-600 text-blue-600' : 'text-slate-500'
            }`} 
          />
        </button>
      </div>

      {/* Rincian Produk: Rapat, Prioritas Harga, Nama, Kondisi, Lokasi, Seller */}
      <Link
        href={`/product/${product.id}`}
        className="p-3 sm:p-3.5 flex flex-col flex-1 justify-between focus:outline-hidden block text-left"
      >
        <div>
          {/* Baris Harga & Kondisi */}
          <div className="flex items-baseline justify-between gap-1.5 flex-wrap">
            <span className={`tracking-tight truncate ${
              isSold 
                ? 'text-sm sm:text-base font-semibold text-slate-400 line-through' 
                : 'text-base sm:text-lg font-semibold text-slate-950'
            }`}>
              {formatRupiah(product.price)}
            </span>
            <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium shrink-0">
              {product.condition}
            </span>
          </div>

          {/* Nama Produk (Maksimal 2 baris) */}
          <h3 className={`mt-1 text-xs sm:text-sm font-medium leading-snug line-clamp-2 transition-colors ${
            isSold ? 'text-slate-500' : 'text-slate-700 group-hover:text-slate-950'
          }`}>
            {product.title}
          </h3>
        </div>

        {/* Lokasi & Seller (Ringkas di bagian bawah) */}
        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 gap-1.5">
          <span className="truncate text-slate-600 font-medium">
            {product.location || 'Lokasi COD'}
          </span>
          <span className="truncate text-slate-400 text-right shrink-0 max-w-[45%]">
            {product.seller?.name || 'Penjual'}
          </span>
        </div>
      </Link>
    </article>
  );
};
