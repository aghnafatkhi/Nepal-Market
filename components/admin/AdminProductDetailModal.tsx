'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  X,
  ExternalLink,
  EyeOff,
  RotateCcw,
  Trash2,
  Calendar,
  User,
  MapPin,
  Tag,
  Copy,
  Check,
  AlertTriangle,
  Package,
  Layers,
} from 'lucide-react';
import { AdminProductItem } from '@/lib/supabase/moderation';
import { AdminStatusBadge } from './AdminStatusBadge';

interface AdminProductDetailModalProps {
  product: AdminProductItem | null;
  isOpen: boolean;
  onClose: () => void;
  onHideProduct: (prod: AdminProductItem) => void;
  onRestoreProduct: (prod: AdminProductItem) => void;
  onRemoveProduct: (prod: AdminProductItem) => void;
}

const formatRupiah = (val: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(val);
};

export const AdminProductDetailModal: React.FC<AdminProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
  onHideProduct,
  onRestoreProduct,
  onRemoveProduct,
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isCopiedId, setIsCopiedId] = useState(false);

  useEffect(() => {
    setSelectedImageIndex(0);
    setIsCopiedId(false);
  }, [product]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  const images = product.images && product.images.length > 0 ? product.images : [];
  const currentImage = images[selectedImageIndex] || null;

  const handleCopyId = () => {
    navigator.clipboard.writeText(product.id);
    setIsCopiedId(true);
    setTimeout(() => setIsCopiedId(false), 2000);
  };

  const formattedDate = new Date(product.created_at).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      id="admin-product-detail-modal-portal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="admin-product-detail-modal-content"
        className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Package className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-900 truncate">
                Rincian Produk Moderasi
              </h2>
              <p className="text-[11px] text-slate-400 font-mono truncate">
                ID: {product.id}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <AdminStatusBadge status={product.status} />
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
              aria-label="Tutup modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-5 space-y-5 text-xs text-slate-700 divide-y divide-slate-100">
          {/* Bagian Galeri & Informasi Utama */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pb-2">
            {/* Gallery Column */}
            <div className="space-y-2.5">
              <div className="relative aspect-4/3 w-full bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shadow-2xs">
                {currentImage ? (
                  <Image
                    src={currentImage}
                    alt={product.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 400px"
                    className="object-cover"
                    referrerPolicy="no-referrer"
                    priority
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-1">
                    <Package className="w-8 h-8 text-slate-300" />
                    <span className="text-xs">Foto tidak tersedia</span>
                  </div>
                )}
              </div>

              {/* Thumbnails strip */}
              {images.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`relative w-14 h-14 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                        selectedImageIndex === idx
                          ? 'border-blue-600 ring-2 ring-blue-100'
                          : 'border-slate-200 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <Image
                        src={img}
                        alt={`Foto ${idx + 1}`}
                        fill
                        sizes="56px"
                        className="object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Core Info Column */}
            <div className="space-y-3.5 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold text-[11px] capitalize flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    {product.category}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px] flex items-center gap-1">
                    <Layers className="w-3 h-3 text-slate-400" />
                    {product.condition}
                  </span>
                </div>

                <h1 className="text-base font-bold text-slate-900 leading-snug">
                  {product.title}
                </h1>

                <p className="text-xl font-extrabold text-blue-600">
                  {formatRupiah(product.price)}
                </p>
              </div>

              {/* Metadata Badges & Location */}
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Dibuat:
                  </span>
                  <span className="font-medium text-slate-800 text-right">
                    {formattedDate}
                  </span>
                </div>

                {product.location && (
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      Lokasi:
                    </span>
                    <span className="font-medium text-slate-800 text-right">
                      {product.location}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60">
                  <span className="text-slate-500 font-mono">UUID Produk:</span>
                  <button
                    type="button"
                    onClick={handleCopyId}
                    className="inline-flex items-center gap-1 text-slate-700 hover:text-blue-600 font-mono text-[10px] bg-white px-2 py-0.5 rounded border border-slate-200 transition-colors"
                    title="Salin UUID"
                  >
                    {isCopiedId ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-600">Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-slate-400" />
                        <span>Salin ID</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Deskripsi Produk Lengkap */}
          <div className="pt-4 space-y-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Deskripsi Iklan
            </h3>
            <div className="p-3.5 bg-slate-50/60 border border-slate-200 rounded-xl text-xs text-slate-700 leading-relaxed whitespace-pre-wrap max-h-44 overflow-y-auto">
              {product.description || (
                <span className="text-slate-400 italic">
                  Penjual tidak menyertakan deskripsi tambahan untuk produk ini.
                </span>
              )}
            </div>
          </div>

          {/* Kartu Profil Penjual */}
          <div className="pt-4 space-y-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span>Informasi Penjual</span>
            </h3>

            <div className="p-3.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-sm overflow-hidden relative shrink-0 border border-slate-200">
                  {product.seller?.avatar_url ? (
                    <Image
                      src={product.seller.avatar_url}
                      alt={product.seller.name || 'Penjual'}
                      fill
                      sizes="40px"
                      className="object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    (product.seller?.name || 'P').charAt(0).toUpperCase()
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-slate-900 text-xs truncate">
                      {product.seller?.name || 'Anonim'}
                    </p>
                    {product.seller?.is_suspended ? (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        Akun Ditangguhkan
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Akun Aktif
                      </span>
                    )}
                  </div>
                  {product.seller?.username && (
                    <p className="text-[11px] text-slate-400 font-mono truncate">
                      @{product.seller.username}
                    </p>
                  )}
                </div>
              </div>

              {product.seller?.username && (
                <Link
                  href={`/profile/${product.seller.username}`}
                  target="_blank"
                  className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium transition-colors shrink-0 inline-flex items-center gap-1"
                >
                  <span>Profil Penjual</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* External Public Link & Dangerous Remove */}
          <div className="flex items-center gap-2">
            <Link
              href={`/product/${product.id}`}
              target="_blank"
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition-colors inline-flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <span>Halaman Publik</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </Link>

            {/* Opsi Hapus Permanen (Secondary / Terkendali dengan konfirmasi berlapis) */}
            {product.status !== 'removed' && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onRemoveProduct(product);
                }}
                className="px-2.5 py-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 text-xs font-medium rounded-lg border border-transparent hover:border-rose-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                title="Hapus permanen dengan verifikasi ganda"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Permanen...</span>
              </button>
            )}
          </div>

          {/* Primary Moderation Actions */}
          <div className="flex items-center justify-end gap-2">
            {product.status === 'active' ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onHideProduct(product);
                }}
                className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <EyeOff className="w-3.5 h-3.5 text-amber-600" />
                <span>Sembunyikan Produk Ini</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onRestoreProduct(product);
                }}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Aktifkan Kembali Produk</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-lg transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
