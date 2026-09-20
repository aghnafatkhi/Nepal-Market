'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error secara internal untuk debugging
    console.error('Unhandled Application Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs text-center">
        <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-7 h-7" />
        </div>

        <h2 className="text-xl font-bold text-slate-900 mb-2">
          Terjadi Kendala Teknis
        </h2>

        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          Halaman tidak dapat ditampilkan saat ini. Silakan coba muat ulang atau kembali ke beranda.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            id="btn-error-retry"
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm min-h-[44px] transition-colors shadow-xs"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Coba Muat Ulang</span>
          </button>
          <Link
            id="btn-error-home"
            href="/"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm min-h-[44px] transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
