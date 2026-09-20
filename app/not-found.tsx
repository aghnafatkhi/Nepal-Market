import React from 'react';
import Link from 'next/link';
import { ShoppingBag, ArrowLeft, Search, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between text-slate-800">
      {/* Header */}
      <header className="bg-white border-b border-slate-200/80">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-15 sm:h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-lg shadow-xs">
              N
            </div>
            <span className="font-bold text-slate-900 tracking-tight text-lg">Nepal Market</span>
          </Link>
          <Link
            href="/"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 min-h-[44px] px-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>
      </header>

      {/* 404 Content */}
      <main className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full text-center bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-8 h-8" />
          </div>
          
          <span className="inline-block px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider mb-2">
            404 - Tidak Ditemukan
          </span>
          
          <h1 className="text-2xl font-black text-slate-900 mb-2">
            Halaman Tidak Ditemukan
          </h1>
          
          <p className="text-sm text-slate-600 mb-6 leading-relaxed">
            Halaman atau barang yang kamu cari mungkin sudah laku, dihapus, atau alamat tautannya kurang tepat.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              id="btn-404-home"
              href="/"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm min-h-[44px] transition-colors shadow-xs"
            >
              <Home className="w-4 h-4" />
              <span>Ke Beranda</span>
            </Link>
            <Link
              id="btn-404-search"
              href="/search"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm min-h-[44px] transition-colors"
            >
              <Search className="w-4 h-4" />
              <span>Cari Barang Lain</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-4 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} Nepal Market • Pasar Komunitas Lokal</p>
      </footer>
    </div>
  );
}
