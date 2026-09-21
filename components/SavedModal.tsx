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
  // Keyboard Escape listener
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      id="saved-modal-backdrop"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        id="saved-modal-content"
        className="relative w-full max-w-lg bg-white rounded-t-xl sm:rounded-lg overflow-hidden border border-slate-200 text-left flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-blue-50 text-blue-600 flex items-center justify-center">
              <Bookmark className="w-3.5 h-3.5 fill-blue-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Barang Disimpan</h2>
              <p className="text-[11px] text-slate-500">{savedProducts.length} barang tersimpan</p>
            </div>
          </div>
          <button
            id="btn-close-saved-modal"
            type="button"
            aria-label="Tutup daftar tersimpan"
            onClick={onClose}
            className="w-8 h-8 rounded hover:bg-slate-100 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content List */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-2.5 flex-grow">
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
                className="flex items-center gap-3 p-2.5 rounded-md border border-slate-200 hover:border-slate-300 bg-white transition-colors"
              >
                <div 
                  className="relative w-16 h-16 rounded-md overflow-hidden bg-slate-100 shrink-0 cursor-pointer"
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
                    <div className="absolute inset-0 bg-slate-950/50 flex items-center justify-center">
                      <span className="text-[9px] font-medium text-white uppercase tracking-wider px-1 py-0.5 bg-slate-900/90 rounded">
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
                    className="w-10 h-10 min-h-[44px] min-w-[44px] rounded-md hover:bg-slate-100 text-slate-600 flex items-center justify-center cursor-pointer"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    title="Hapus dari simpanan"
                    onClick={() => onRemoveSaved(prod.id)}
                    className="w-10 h-10 min-h-[44px] min-w-[44px] rounded-md hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center shrink-0">
          <p className="text-[11px] text-slate-500">
            Daftar simpanan tersimpan aman di browser kamu.
          </p>
        </div>
      </div>
    </div>
  );
};
