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
        className="w-full py-8 sm:py-10 px-4 flex flex-col items-center justify-center text-center bg-white border border-slate-200 rounded-lg max-w-md mx-auto my-4"
      >
        <h3 className="text-sm sm:text-base font-semibold text-slate-900">
          Belum Ada Barang yang Dijual
        </h3>
        
        <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-xs leading-relaxed">
          Belum ada iklan barang di katalog. Punya barang layak pakai? Pasang iklan sekarang.
        </p>

        <div className="mt-3.5">
          {onOpenSellModal ? (
            <button
              id="btn-empty-sell"
              type="button"
              onClick={onOpenSellModal}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-md bg-blue-600 text-white text-xs sm:text-sm font-medium hover:bg-blue-700 active:bg-blue-800 transition-colors min-h-[40px] cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Pasang Iklan Sekarang</span>
            </button>
          ) : (
            <Link
              id="btn-empty-sell-link"
              href="/sell"
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-md bg-blue-600 text-white text-xs sm:text-sm font-medium hover:bg-blue-700 active:bg-blue-800 transition-colors min-h-[40px]"
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
      className="w-full py-8 sm:py-10 px-4 flex flex-col items-center justify-center text-center bg-white border border-slate-200 rounded-lg max-w-md mx-auto my-4"
    >
      <h3 className="text-sm sm:text-base font-semibold text-slate-900">
        Barang Tidak Ditemukan
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
        className="mt-3.5 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-medium transition-colors min-h-[40px] cursor-pointer"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        <span>Reset Filter</span>
      </button>
    </div>
  );
};
