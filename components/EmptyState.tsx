'use client';

import React from 'react';
import Link from 'next/link';
import { SearchX, RotateCcw, PlusCircle, PackageOpen } from 'lucide-react';

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
        className="w-full py-12 sm:py-16 px-4 sm:px-6 flex flex-col items-center justify-center text-center bg-white border border-slate-200/90 rounded-2xl max-w-md mx-auto my-6 shadow-xs"
      >
        <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3.5">
          <PackageOpen className="w-7 h-7" />
        </div>
        
        <h3 className="text-base sm:text-lg font-bold text-slate-900">
          Belum Ada Barang yang Dijual
        </h3>
        
        <p className="mt-2 text-xs sm:text-sm text-slate-500 max-w-xs leading-relaxed">
          Saat ini belum ada barang yang sedang dijual di Nepal Market. Punya barang yang masih layak pakai? Pasang iklan sekarang dan tawarkan ke sesama warga sekitar.
        </p>

        <div className="mt-5 flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto">
          {onOpenSellModal ? (
            <button
              id="btn-empty-sell"
              type="button"
              onClick={onOpenSellModal}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-xs min-h-[44px]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Pasang Iklan Sekarang</span>
            </button>
          ) : (
            <Link
              id="btn-empty-sell-link"
              href="/sell"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-xs min-h-[44px]"
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
      className="w-full py-12 sm:py-16 px-4 sm:px-6 flex flex-col items-center justify-center text-center bg-white border border-slate-200/90 rounded-2xl max-w-md mx-auto my-6 shadow-xs"
    >
      <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mb-3.5">
        <SearchX className="w-7 h-7" />
      </div>
      
      <h3 className="text-base sm:text-lg font-bold text-slate-900">
        Barang Tidak Ditemukan
      </h3>
      
      <p className="mt-2 text-xs sm:text-sm text-slate-500 max-w-xs leading-relaxed">
        {query ? (
          <>Tidak ada barang yang cocok dengan kata kunci &ldquo;{query}&rdquo;. Coba periksa ejaan atau gunakan kata yang lebih umum.</>
        ) : (
          'Tidak ada barang yang cocok dengan filter yang dipilih. Coba ganti filter atau tampilkan semua barang.'
        )}
      </p>

      <button
        id="btn-empty-reset"
        type="button"
        onClick={onReset}
        className="mt-5 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:bg-blue-800 transition-colors min-h-[44px] shadow-xs"
      >
        <RotateCcw className="w-4 h-4" />
        <span>Reset Filter & Tampilkan Semua</span>
      </button>
    </div>
  );
};
