'use client';

import React from 'react';
import Image from 'next/image';
import { X, Bookmark, Trash2, ArrowRight } from 'lucide-react';
import { Product } from '@/types/market';
import { formatRupiah } from '@/data/products';

interface SavedModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedProducts: Product[];
  onRemoveSaved: (id: string) => void;
  onSelectProduct: (product: Product) => void;
}

export const SavedModal: React.FC<SavedModalProps> = ({
  isOpen,
  onClose,
  savedProducts,
  onRemoveSaved,
  onSelectProduct,
}) => {
  if (!isOpen) return null;

  return (
    <div 
      id="saved-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div 
        id="saved-modal-content"
        className="relative w-full max-w-lg bg-white rounded-2xl overflow-hidden shadow-xl border border-slate-200/90 my-auto text-left flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Bookmark className="w-4 h-4 fill-blue-600" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Barang Disimpan</h2>
              <p className="text-xs text-slate-500">{savedProducts.length} barang tersimpan</p>
            </div>
          </div>
          <button
            id="btn-close-saved-modal"
            type="button"
            aria-label="Tutup daftar tersimpan"
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-slate-100 text-slate-500 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content List */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-grow">
          {savedProducts.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Bookmark className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-800">Belum Ada Barang yang Disimpan</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Tekan ikon simpan pada produk yang ingin kamu pantau atau simpan untuk nanti.
              </p>
            </div>
          ) : (
            savedProducts.map((prod) => (
              <div
                key={prod.id}
                className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 hover:border-blue-300 bg-white transition-colors"
              >
                <div 
                  className="relative w-16 h-16 rounded-lg overflow-hidden bg-slate-100 shrink-0 cursor-pointer"
                  onClick={() => {
                    onSelectProduct(prod);
                    onClose();
                  }}
                >
                  <Image
                    src={prod.imageUrl}
                    alt={prod.title}
                    fill
                    sizes="64px"
                    className={`object-cover ${prod.isSold ? 'grayscale contrast-75 brightness-95' : ''}`}
                    referrerPolicy="no-referrer"
                  />
                  {prod.isSold && (
                    <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center">
                      <span className="text-[9px] font-bold text-white uppercase tracking-wider px-1 py-0.5 bg-slate-900/80 rounded">
                        Terjual
                      </span>
                    </div>
                  )}
                </div>

                <div 
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => {
                    onSelectProduct(prod);
                    onClose();
                  }}
                >
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-xs font-semibold ${prod.isSold ? 'text-slate-400 line-through' : 'text-blue-600'}`}>
                      {formatRupiah(prod.price)}
                    </span>
                    {prod.isSold && (
                      <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1 py-0.5 rounded">
                        Terjual
                      </span>
                    )}
                  </div>
                  <h4 className={`text-xs sm:text-sm font-medium truncate ${prod.isSold ? 'text-slate-400' : 'text-slate-900'}`}>
                    {prod.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    {prod.location} • {prod.condition}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    title="Lihat Detail"
                    onClick={() => {
                      onSelectProduct(prod);
                      onClose();
                    }}
                    className="w-9 h-9 rounded-lg hover:bg-slate-100 text-slate-600 flex items-center justify-center"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    title="Hapus dari simpanan"
                    onClick={() => onRemoveSaved(prod.id)}
                    className="w-9 h-9 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center shrink-0">
          <p className="text-[11px] text-slate-500">
            Daftar simpanan tersimpan aman di browser kamu.
          </p>
        </div>
      </div>
    </div>
  );
};
