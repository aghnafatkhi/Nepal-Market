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
  return (
    <article
      id={`product-card-${product.id}`}
      className={`group relative flex flex-col bg-white border rounded-xl overflow-hidden transition-all duration-200 focus-within:ring-2 focus-within:ring-blue-600/30 ${
        product.isSold 
          ? 'border-slate-200 opacity-80' 
          : 'border-slate-200/90 hover:border-blue-400/80'
      }`}
    >
      {/* Container Foto Produk */}
      <Link 
        href={`/product/${product.id}`}
        className="relative aspect-square w-full bg-slate-100 overflow-hidden block"
        aria-label={`Lihat detail ${product.title}`}
      >
        <Image
          src={product.imageUrl}
          alt={product.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          className="object-cover group-hover:scale-103 transition-transform duration-200"
          referrerPolicy="no-referrer"
          priority={false}
        />

        {/* Badge Kondisi atau Status Terjual di Atas Foto */}
        <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
          {product.isSold ? (
            <span 
              id={`badge-sold-${product.id}`}
              className="inline-block bg-slate-900/90 backdrop-blur-xs text-white text-[11px] font-semibold px-2 py-0.5 rounded-md shadow-xs tracking-tight"
            >
              Sudah terjual
            </span>
          ) : (
            <span 
              id={`badge-condition-${product.id}`}
              className="inline-block bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-medium px-2 py-0.5 rounded-md shadow-xs"
            >
              {product.condition}
            </span>
          )}
        </div>

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
          className="absolute top-1.5 right-1.5 z-10 w-11 h-11 flex items-center justify-center rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-blue-600 transition-colors duration-150 shadow-xs active:scale-95"
        >
          <Bookmark 
            className={`w-5 h-5 transition-transform duration-150 ${
              isSaved ? 'fill-blue-600 text-blue-600' : 'text-slate-600'
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
          <div className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            {formatRupiah(product.price)}
          </div>

          {/* Nama Produk (maksimal 2 baris) */}
          <h3 className="mt-1 text-[13px] sm:text-[14px] font-medium text-slate-700 leading-snug line-clamp-2 min-h-[2.5rem] group-hover:text-blue-600 transition-colors">
            {product.title}
          </h3>
        </div>

        {/* Lokasi & Waktu Serah Terima */}
        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] sm:text-xs text-slate-500">
          <div className="flex items-center gap-1 truncate max-w-[65%]">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
            <span className="truncate">{product.location}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0 text-slate-400">
            <Clock className="w-3 h-3" />
            <span>{product.postedAt}</span>
          </div>
        </div>
      </Link>
    </article>
  );
};
