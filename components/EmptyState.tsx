'use client';

import React from 'react';
import Link from 'next/link';
import { RotateCcw, PlusCircle } from 'lucide-react';

interface EmptyStateProps {
  onReset: () => void;
  query?: string;
  isInitialEmpty?: boolean;
  onOpenSellModal?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  onReset, 
  query, 
  isInitialEmpty, 
  onOpenSellModal 
}) => {
  if (isInitialEmpty) {
    return (
      <div 
        id="empty-state-catalog-empty"
        className="w-full py-14 sm:py-16 px-4 flex flex-col items-center justify-center text-center max-w-md mx-auto my-4"
      >
        <h3 className="text-base sm:text-lg font-semibold text-neutral-950 tracking-tight">
          Katalog masih kosong
        </h3>
        
        <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-xs leading-relaxed">
          Jadilah yang pertama memasang barang di Nepal Market.
        </p>

        <div className="mt-3.5">
          {onOpenSellModal ? (
            <button
              id="btn-empty-sell"
              type="button"
              onClick={onOpenSellModal}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-950 text-white text-xs sm:text-sm font-semibold hover:bg-blue-700 transition-colors min-h-[44px] cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Pasang Iklan Sekarang</span>
            </button>
          ) : (
            <Link
              id="btn-empty-sell-link"
              href="/sell"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-950 text-white text-xs sm:text-sm font-semibold hover:bg-blue-700 transition-colors min-h-[44px]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Pasang Iklan Sekarang</span>
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div 
      id="empty-state-search-empty"
      className="w-full py-14 sm:py-16 px-4 flex flex-col items-center justify-center text-center max-w-md mx-auto my-4"
    >
      <h3 className="text-base sm:text-lg font-semibold text-neutral-950 tracking-tight">
        Barang tidak ditemukan
      </h3>
      
      <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-xs leading-relaxed">
        {query ? (
          <>Tidak ada barang dengan kata kunci &ldquo;{query}&rdquo;.</>
        ) : (
          'Tidak ada barang yang cocok dengan filter yang dipilih.'
        )}
      </p>

      <button
        id="btn-empty-reset"
        type="button"
        onClick={onReset}
        className="mt-4 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-950 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold transition-colors min-h-[44px] cursor-pointer"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        <span>Reset Filter</span>
      </button>
    </div>
  );
};
