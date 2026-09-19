'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { X, AlertTriangle, CheckCircle2, LogIn, Loader2 } from 'lucide-react';
import { Product } from '@/types/market';
import { useAuth } from '@/contexts/AuthContext';
import { submitReportToDb } from '@/lib/supabase/products';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  product,
}) => {
  const { user, isConfigured } = useAuth();
  const [reason, setReason] = useState('Barang tidak sesuai deskripsi');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);

    if (isConfigured) {
      await submitReportToDb(user.id, product.id, reason, note);
    }

    setIsSubmitting(false);
    setIsSubmitted(true);
    setTimeout(() => {
      setTimeout(() => {
        setIsSubmitted(false);
        setNote('');
        onClose();
      }, 1500);
    }, 200);
  };

  const handleClose = () => {
    setIsSubmitted(false);
    onClose();
  };

  return (
    <div
      id="report-modal-portal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
      onClick={handleClose}
    >
      <div
        id="report-modal-content"
        className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200/90 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2 text-rose-600">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="text-base font-bold text-slate-900">Laporkan Barang</h3>
          </div>
          <button
            id="btn-close-report-modal"
            type="button"
            onClick={handleClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {!user ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">Perlu Masuk Akun</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                Untuk mencegah spam dan menjaga akuntabilitas komunitas, kamu perlu masuk akun sebelum membuat laporan.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/login"
                onClick={onClose}
                className="w-full min-h-[42px] py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition-colors inline-flex items-center justify-center gap-2 shadow-xs"
              >
                <LogIn className="w-4 h-4" />
                <span>Masuk Sekarang</span>
              </Link>
            </div>
          </div>
        ) : isSubmitted ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Laporan Terkirim</h4>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
              Terima kasih telah membantu menjaga komunitas Nepal Market tetap aman dan terpercaya.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div>
              <p className="text-xs text-slate-600 mb-3">
                Laporkan barang <strong className="text-slate-800">&quot;{product.title}&quot;</strong> jika terdapat ketidaksesuaian atau indikasi pelanggaran aturan.
              </p>
              
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                Alasan Laporan
              </label>
              <div className="space-y-2 text-xs">
                {[
                  'Barang tidak sesuai deskripsi',
                  'Indikasi barang tiruan atau tidak original',
                  'Barang sudah terjual tetapi masih diiklankan',
                  'Konten atau foto tidak pantas',
                  'Harga atau lokasi tidak wajar',
                ].map((item) => (
                  <label
                    key={item}
                    className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                      reason === item
                        ? 'bg-blue-50 border-blue-600 text-blue-900 font-medium'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reportReason"
                      value={item}
                      checked={reason === item}
                      onChange={(e) => setReason(e.target.value)}
                      className="accent-blue-600"
                    />
                    <span>{item}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                Catatan Tambahan (Opsional)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder="Jelaskan kendala secara singkat..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-hidden resize-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors min-h-[40px]"
              >
                Batal
              </button>
              <button
                id="btn-submit-report"
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg transition-colors min-h-[40px] shadow-xs flex items-center gap-1.5 disabled:opacity-60"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Kirim Laporan</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
