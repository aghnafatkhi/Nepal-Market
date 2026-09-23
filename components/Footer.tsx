'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Handshake } from 'lucide-react';
import { CodGuideModal } from '@/components/CodGuideModal';

interface FooterProps {
  onOpenCodGuide?: () => void;
  className?: string;
}

export function Footer({ onOpenCodGuide, className = '' }: FooterProps) {
  const [internalCodOpen, setInternalCodOpen] = useState(false);
  const currentYear = new Date().getFullYear();

  const handleOpenCodGuide = () => {
    if (onOpenCodGuide) {
      onOpenCodGuide();
    } else {
      setInternalCodOpen(true);
    }
  };

  return (
    <>
      <footer
        id="main-footer"
        role="contentinfo"
        className={`w-full border-t border-slate-200/90 bg-white text-slate-600 text-xs mt-auto pt-8 pb-[max(6.5rem,calc(env(safe-area-inset-bottom)+5.5rem))] sm:pb-8 ${className}`}
      >
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          {/* Tiga Kelompok Informasi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 pb-6 border-b border-slate-100">
            {/* Kelompok 1: Identitas Nepal Market */}
            <div className="space-y-2.5">
              <Link
                id="footer-brand"
                href="/"
                className="inline-flex items-center gap-2 focus:outline-hidden group"
                aria-label="Beranda Nepal Market"
              >
                <div className="w-7 h-7 rounded-[8px] font-semibold text-xs flex items-center justify-center bg-slate-950 text-white group-hover:bg-blue-600 transition-colors">
                  N
                </div>
                <span className="text-sm font-bold tracking-tight text-slate-950">
                  Nepal<span className="text-blue-600"> Market</span>
                </span>
              </Link>
              <p className="text-xs text-slate-600 leading-relaxed max-w-sm">
                Tempat jual beli barang di sekitar Nepal.
              </p>
              <p className="text-[11px] text-slate-400 leading-normal">
                Platform transaksi Cash on Delivery (COD) bagi warga dan komunitas lokal.
              </p>
            </div>

            {/* Kelompok 2: Link Penting */}
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">
                Navigasi
              </h3>
              <nav aria-label="Navigasi Footer">
                <ul className="space-y-2 text-xs">
                  <li>
                    <Link
                      id="footer-link-home"
                      href="/"
                      className="text-slate-600 hover:text-blue-600 transition-colors py-0.5 inline-block"
                    >
                      Beranda
                    </Link>
                  </li>
                  <li>
                    <Link
                      id="footer-link-sell"
                      href="/sell"
                      className="text-slate-600 hover:text-blue-600 transition-colors py-0.5 inline-block"
                    >
                      Jual Barang
                    </Link>
                  </li>
                  <li>
                    <Link
                      id="footer-link-saved"
                      href="/saved"
                      className="text-slate-600 hover:text-blue-600 transition-colors py-0.5 inline-block"
                    >
                      Barang Tersimpan
                    </Link>
                  </li>
                  <li>
                    <Link
                      id="footer-link-profile"
                      href="/profile"
                      className="text-slate-600 hover:text-blue-600 transition-colors py-0.5 inline-block"
                    >
                      Profil
                    </Link>
                  </li>
                </ul>
              </nav>
            </div>

            {/* Kelompok 3: Informasi Singkat */}
            <div className="space-y-2.5 sm:col-span-2 md:col-span-1">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Informasi Singkat
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Utamakan pertemuan langsung (COD) di tempat ramai yang disepakati bersama dan periksa fisik barang sebelum transaksi selesai.
              </p>
              <div>
                <button
                  type="button"
                  id="footer-btn-cod-guide"
                  onClick={handleOpenCodGuide}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors py-1 cursor-pointer focus:outline-hidden focus-visible:underline"
                >
                  <Handshake className="w-3.5 h-3.5 text-blue-600" />
                  <span>Panduan Transaksi COD</span>
                </button>
              </div>
            </div>
          </div>

          {/* Baris Bawah: Copyright */}
          <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-slate-500">
            <p id="footer-copyright">
              © {currentYear} Nepal Market. Seluruh hak cipta dilindungi.
            </p>
            <p className="text-slate-400">
              Pasar Komunitas Lokal
            </p>
          </div>
        </div>
      </footer>

      {/* Render modal panduan jika dikelola internal */}
      {!onOpenCodGuide && (
        <CodGuideModal
          isOpen={internalCodOpen}
          onClose={() => setInternalCodOpen(false)}
        />
      )}
    </>
  );
}
