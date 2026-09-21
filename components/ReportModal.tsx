'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  LogIn, 
  Loader2, 
  ShieldAlert, 
  ChevronDown, 
  ChevronUp, 
  Info,
  Clock
} from 'lucide-react';
import { Product } from '@/types/market';
import { useAuth } from '@/contexts/AuthContext';
import { 
  REPORT_REASONS, 
  ReportReasonType, 
  PROHIBITED_ITEMS_GUIDELINES, 
  checkUserHasReported, 
  submitProductReport 
} from '@/lib/supabase/moderation';

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
  const { user } = useAuth();
  const [selectedReason, setSelectedReason] = useState<ReportReasonType>('Tidak sesuai');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingPrevious, setIsCheckingPrevious] = useState(false);
  const [hasAlreadyReported, setHasAlreadyReported] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showGuidelines, setShowGuidelines] = useState(false);

  // Cek apakah user sudah pernah melaporkan produk ini sebelumnya
  useEffect(() => {
    let isMounted = true;
    if (isOpen && user && product?.id) {
      const checkAsync = async () => {
        await Promise.resolve();
        if (!isMounted) return;
        setIsCheckingPrevious(true);
        try {
          const { hasReported } = await checkUserHasReported(user.id, product.id);
          if (isMounted) {
            setHasAlreadyReported(hasReported);
            setIsCheckingPrevious(false);
          }
        } catch {
          if (isMounted) setIsCheckingPrevious(false);
        }
      };
      checkAsync();
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, user, product?.id]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (hasAlreadyReported) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const res = await submitProductReport(
      user.id,
      product.id,
      selectedReason,
      description,
      product
    );

    setIsSubmitting(false);

    if (res.alreadyReported) {
      setHasAlreadyReported(true);
      setErrorMessage('Kamu sudah pernah mengirim laporan untuk barang ini sebelumnya.');
      return;
    }

    if (res.error) {
      setErrorMessage(res.error.message || 'Gagal mengirim laporan. Silakan coba lagi.');
      return;
    }

    // Berhasil kirim laporan
    setIsSuccess(true);
    setTimeout(() => {
      // Tutup otomatis setelah beberapa saat
      setTimeout(() => {
        setIsSuccess(false);
        setDescription('');
        onClose();
      }, 2000);
    }, 400);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setIsSuccess(false);
    setErrorMessage(null);
    onClose();
  };

  return (
    <div
      id="report-modal-portal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 overflow-y-auto"
      onClick={handleClose}
    >
      <div
        id="report-modal-content"
        className="w-full sm:max-w-lg bg-white rounded-lg border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-98 duration-150 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2 text-rose-600">
            <div className="w-8 h-8 rounded-md bg-rose-50 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                Laporkan Barang
              </h3>
              <p className="text-[11px] text-slate-500 truncate max-w-[240px] sm:max-w-[320px]">
                {product.title}
              </p>
            </div>
          </div>
          <button
            id="btn-close-report-modal"
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors min-h-[44px] min-w-[44px] cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-5 space-y-4">
          {!user ? (
            // Kasus Belum Login
            <div className="py-6 px-4 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1 max-w-xs mx-auto">
                <h4 className="text-base font-bold text-slate-900">Perlu Masuk Akun</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Untuk mencegah spam dan menjaga akuntabilitas komunitas, kamu harus login sebelum dapat melaporkan produk.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  id="btn-report-login-redirect"
                  href={`/login?redirectTo=${encodeURIComponent(`/product/${product.id}`)}`}
                  onClick={onClose}
                  className="w-full min-h-[44px] py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-md transition-colors inline-flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Masuk Akun Sekarang</span>
                </Link>
              </div>
            </div>
          ) : isSuccess ? (
            // Kasus Berhasil Dikirim (Wajib menampilkan: "Laporan sudah dikirim.")
            <div id="report-success-state" className="py-8 px-4 text-center space-y-3">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-900">
                  Laporan sudah dikirim.
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                  Terima kasih atas partisipasimu. Tim moderasi Nepal Market akan segera meninjau laporan ini.
                </p>
              </div>
            </div>
          ) : isCheckingPrevious ? (
            // Kasus Pengecekan Laporan Ganda
            <div className="py-8 text-center space-y-2 text-slate-500">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" />
              <p className="text-xs">Memeriksa status laporan...</p>
            </div>
          ) : hasAlreadyReported ? (
            // Kasus Laporan Ganda Dicegah
            <div id="report-already-submitted-notice" className="p-4 bg-amber-50 border border-amber-200 rounded-md space-y-3 text-left">
              <div className="flex items-start gap-2.5">
                <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-amber-900">
                    Kamu sudah pernah melaporkan barang ini
                  </h4>
                  <p className="text-[12px] text-amber-700 leading-relaxed">
                    Sistem Nepal Market membatasi satu laporan per pengguna untuk setiap produk demi mencegah duplikasi. Laporanmu sebelumnya telah tersimpan dan sedang diproses oleh moderator.
                  </p>
                </div>
              </div>
              <div className="pt-1 flex justify-end">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-3.5 py-1.5 bg-amber-600 text-white rounded-md text-xs font-medium hover:bg-amber-700 transition-colors min-h-[44px] cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          ) : (
            // Form Laporan Utama
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Pilihan Alasan Laporan */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">
                  Alasan Laporan <span className="text-rose-500">*</span>
                </label>
                <div className="space-y-1.5">
                  {REPORT_REASONS.map((reason) => {
                    const isSelected = selectedReason === reason;
                    return (
                      <label
                        key={reason}
                        className={`flex items-center justify-between p-2.5 rounded-md border text-xs cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-rose-50/60 border-rose-500 text-rose-950 font-medium'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="radio"
                            name="reportReason"
                            value={reason}
                            checked={isSelected}
                            onChange={() => setSelectedReason(reason)}
                            className="accent-rose-600 w-4 h-4"
                          />
                          <span>{reason}</span>
                        </div>
                        {reason === 'Barang terlarang' && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-100 text-rose-700">
                            Aturan Komunitas
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Collapsible: Aturan Produk Terlarang Nepal Market */}
              <div className="border border-slate-200 rounded-md overflow-hidden bg-slate-50">
                <button
                  type="button"
                  onClick={() => setShowGuidelines((prev) => !prev)}
                  className="w-full px-3 py-2 flex items-center justify-between text-left text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer min-h-[44px]"
                >
                  <div className="flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-blue-600" />
                    <span>Lihat Aturan Produk Terlarang Nepal Market</span>
                  </div>
                  {showGuidelines ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {showGuidelines && (
                  <div className="p-3 pt-2 border-t border-slate-200 space-y-2 text-[11px] text-slate-600 bg-white">
                    <p className="font-medium text-slate-800">
                      Nepal Market melarang keras peredaran barang-barang berikut:
                    </p>
                    <ul className="space-y-1.5 list-disc pl-4 text-slate-600">
                      {PROHIBITED_ITEMS_GUIDELINES.map((item) => (
                        <li key={item.id} className="leading-snug">
                          <strong className="text-slate-800">{item.title}</strong>: {item.description}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Keterangan / Catatan Tambahan */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Keterangan Tambahan (Opsional)
                </label>
                <textarea
                  id="report-description-input"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Tambahkan detail kendala atau bukti pendukung agar tim moderasi dapat memproses lebih cepat..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-rose-500 focus:outline-hidden resize-none transition-colors"
                  maxLength={500}
                />
                <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
                  <span>Maksimal 500 karakter</span>
                  <span>{description.length}/500</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors min-h-[44px] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  id="btn-submit-report"
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-medium rounded-md transition-colors min-h-[44px] flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Mengirim...</span>
                    </>
                  ) : (
                    <span>Kirim Laporan</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
