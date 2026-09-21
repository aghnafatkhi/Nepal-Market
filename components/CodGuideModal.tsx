'use client';

import React, { useEffect, useRef } from 'react';
import { X, Handshake, MapPin, Search, Tag, ShieldAlert, Check } from 'lucide-react';

interface CodGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CodGuideModal: React.FC<CodGuideModalProps> = ({ isOpen, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const lastActiveElementRef = useRef<HTMLElement | null>(null);

  // Focus trap & Escape key handler
  useEffect(() => {
    if (!isOpen) return;

    // Simpan elemen yang aktif sebelum modal dibuka
    lastActiveElementRef.current = document.activeElement as HTMLElement | null;

    // Cegah background scrolling
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Beri fokus ke tombol tutup saat modal terbuka
    const timer = setTimeout(() => {
      closeBtnRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
      // Kembalikan fokus ke elemen pemicu sebelumnya
      if (lastActiveElementRef.current && typeof lastActiveElementRef.current.focus === 'function') {
        lastActiveElementRef.current.focus();
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      id="cod-guide-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        id="cod-guide-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cod-guide-modal-title"
        className="relative w-full max-w-lg bg-white rounded-lg border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-98 duration-150"
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Handshake className="w-4 h-4" />
            </div>
            <div>
              <h2
                id="cod-guide-modal-title"
                className="text-base font-bold text-slate-900 leading-tight"
              >
                Panduan Transaksi COD
              </h2>
              <p className="text-xs text-slate-500">
                Tips aman saat bertransaksi langsung (Cash on Delivery)
              </p>
            </div>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            id="btn-close-cod-guide"
            onClick={onClose}
            aria-label="Tutup panduan COD"
            className="rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Isi Panduan - List rapi tanpa kartu di dalam kartu */}
        <div className="p-5 overflow-y-auto divide-y divide-slate-100 text-slate-700 text-sm">
          {/* Poin 1 */}
          <div className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
            <div className="w-7 h-7 rounded-md bg-slate-100 text-slate-700 font-semibold text-xs flex items-center justify-center shrink-0 mt-0.5">
              1
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">
                Sepakati Lokasi yang Ramai & Mudah Dijangkau
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5 leading-relaxed">
                Pilih tempat pertemuan terbuka yang banyak dilalui orang, seperti kantin, selasar gedung, atau lobi utama. Hindari janjian di tempat sepi atau lokasi yang tidak familiar.
              </p>
            </div>
          </div>

          {/* Poin 2 */}
          <div className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
            <div className="w-7 h-7 rounded-md bg-slate-100 text-slate-700 font-semibold text-xs flex items-center justify-center shrink-0 mt-0.5">
              2
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">
                Periksa Kondisi Barang Sebelum Membayar
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5 leading-relaxed">
                Cek fisik, fungsi, kebersihan, dan kelengkapan barang secara langsung di depan penjual. Pastikan barang sesuai dengan foto dan keterangan di iklan sebelum memberikan uang.
              </p>
            </div>
          </div>

          {/* Poin 3 */}
          <div className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
            <div className="w-7 h-7 rounded-md bg-slate-100 text-slate-700 font-semibold text-xs flex items-center justify-center shrink-0 mt-0.5">
              3
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">
                Pastikan Harga Sudah Disepakati
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5 leading-relaxed">
                Sepakati harga final dan metode pembayaran (uang pas tunai atau transfer instan) melalui chat sebelum bertemu untuk menghindari tawar-menawar yang tidak nyaman di lokasi.
              </p>
            </div>
          </div>

          {/* Poin 4 */}
          <div className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
            <div className="w-7 h-7 rounded-md bg-slate-100 text-slate-700 font-semibold text-xs flex items-center justify-center shrink-0 mt-0.5">
              4
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">
                Jangan Bagikan Data Pribadi yang Tidak Diperlukan
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5 leading-relaxed">
                Gunakan kontak secukupnya untuk janjian temu. Jangan pernah membagikan data sensitif seperti alamat rumah lengkap, kode OTP, PIN, atau kata sandi akun apa pun.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Modal */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
          <button
            type="button"
            id="btn-understand-cod-guide"
            onClick={onClose}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors cursor-pointer min-h-[44px] focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            <Check className="w-4 h-4" />
            <span>Saya Mengerti</span>
          </button>
        </div>
      </div>
    </div>
  );
};
