'use client';

import React from 'react';
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
        id="empty-state-container"
        className="w-full py-16 px-4 flex flex-col items-center justify-center text-center bg-white border border-slate-200/80 rounded-2xl max-w-md mx-auto my-6 shadow-2xs"
      >
        <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
          <PackageOpen className="w-7 h-7" />
        </div>
        
        <h3 className="text-base sm:text-lg font-bold text-slate-900">
          Belum Ada Barang di Nepal Market
        </h3>
        
        <p className="mt-1.5 text-xs sm:text-sm text-slate-500 max-w-xs leading-relaxed">
          Database masih kosong. Jadilah orang pertama yang menawarkan barang kepada sesama warga komunitas!
        </p>

        {onOpenSellModal && (
          <button
            id="btn-empty-sell"
            type="button"
            onClick={onOpenSellModal}
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-xs min-h-[44px]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Pasang Iklan Pertama</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div 
      id="empty-state-container"
      className="w-full py-16 px-4 flex flex-col items-center justify-center text-center bg-white border border-slate-200/80 rounded-2xl max-w-md mx-auto my-6"
    >
      <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mb-4">
        <SearchX className="w-7 h-7" />
      </div>
      
      <h3 className="text-base sm:text-lg font-semibold text-slate-900">
        Barang tidak ditemukan
      </h3>
      
      <p className="mt-1.5 text-sm text-slate-500 max-w-xs leading-relaxed">
        {query ? (
          <>Tidak ada hasil untuk kata kunci &ldquo;{query}&rdquo;. Coba kata kunci yang lebih umum.</>
        ) : (
          'Belum ada barang di kategori ini. Kamu bisa jadi orang pertama yang menjualnya!'
        )}
      </p>

      <button
        id="btn-empty-reset"
        type="button"
        onClick={onReset}
        className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors min-h-[44px] min-w-[44px]"
      >
        <RotateCcw className="w-4 h-4" />
        <span>Tampilkan Semua Barang</span>
      </button>
    </div>
  );
};
