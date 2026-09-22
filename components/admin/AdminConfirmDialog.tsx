'use client';

import React, { useEffect } from 'react';
import { AlertOctagon, Loader2, X, AlertTriangle } from 'lucide-react';

export interface PendingAdminAction {
  type: 'hide' | 'remove' | 'restore' | 'suspend_user' | 'unsuspend_user' | 'resolve_report' | 'review_report' | 'delete_sponsor';
  title: string;
  description: string;
  targetId: string;
  targetTitle: string;
  reportId?: string;
  sellerId?: string;
  sellerName?: string;
  confirmButtonText: string;
  isDestructive?: boolean;
  requireReason?: boolean;
  requireDoubleConfirm?: boolean;
}

interface AdminConfirmDialogProps {
  action: PendingAdminAction | null;
  adminReason: string;
  onReasonChange: (val: string) => void;
  isExecuting: boolean;
  actionError: string | null;
  onConfirm: () => void;
  onClose: () => void;
}

export const AdminConfirmDialog: React.FC<AdminConfirmDialogProps> = ({
  action,
  adminReason,
  onReasonChange,
  isExecuting,
  actionError,
  onConfirm,
  onClose,
}) => {
  const [doubleConfirmText, setDoubleConfirmText] = React.useState('');
  const [acknowledgedRisk, setAcknowledgedRisk] = React.useState(false);

  // Reset input saat action berubah
  React.useEffect(() => {
    setDoubleConfirmText('');
    setAcknowledgedRisk(false);
  }, [action]);

  const isLayeredConfirmRequired = action?.type === 'remove' || action?.requireDoubleConfirm === true;
  const isLayeredValid = !isLayeredConfirmRequired || (acknowledgedRisk && doubleConfirmText.trim().toUpperCase() === 'HAPUS');

  useEffect(() => {
    if (!action) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isExecuting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [action, isExecuting, onClose]);

  if (!action) return null;

  return (
    <div
      id="admin-action-dialog-portal"
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 p-0 sm:items-center sm:p-4"
      onClick={() => !isExecuting && onClose()}
    >
      <div
        id="admin-action-dialog-content"
        className="w-full max-w-md max-h-[94dvh] overflow-y-auto rounded-t-2xl border border-slate-200 bg-white shadow-xl sm:rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Dialog */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-4 py-3 sm:px-5 sm:py-4">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                action.isDestructive ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'
              }`}
            >
              <AlertOctagon className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              {action.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => !isExecuting && onClose()}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Dialog */}
        <div className="p-4 sm:p-5 space-y-3.5 text-xs">
          <p className="text-slate-600 leading-relaxed">
            {action.description}
          </p>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-0.5">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Target Tindakan:</span>
            <p className="font-bold text-slate-900 text-sm truncate">{action.targetTitle}</p>
          </div>

          {/* Kotak Konsekuensi yang Jelas */}
          <div
            className={`p-3 rounded-lg border text-xs leading-relaxed ${
              action.type === 'remove'
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : action.type === 'suspend_user'
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : action.type === 'hide'
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}
          >
            <span className="font-bold block mb-0.5 uppercase tracking-wider text-[10px]">
              Konsekuensi Tindakan:
            </span>
            {action.type === 'delete_sponsor' && (
              <span>Banner sponsor ini beserta file gambarnya di Supabase Storage akan dihapus secara permanen dari basis data dan rotasi iklan beranda.</span>
            )}
            {action.type === 'remove' && (
              <span>Iklan ini akan dihapus permanen dari etalase pasar. Pembeli tidak dapat lagi menemukan atau melihat rincian barang.</span>
            )}
            {action.type === 'suspend_user' && (
              <span>Akun pengguna akan dinonaktifkan. Pengguna tidak dapat memasang iklan baru atau mengedit barang yang ada.</span>
            )}
            {action.type === 'hide' && (
              <span>Iklan diturunkan sementara dari pencarian publik untuk peninjauan lebih lanjut, tetapi data barang tetap tersimpan.</span>
            )}
            {action.type === 'restore' && (
              <span>Iklan akan kembali aktif dan langsung tayang di katalog pasar Nepal Market.</span>
            )}
            {action.type === 'unsuspend_user' && (
              <span>Sanksi dicabut dan pengguna kembali dapat menggunakan seluruh fitur pasar secara normal.</span>
            )}
            {action.type === 'resolve_report' && (
              <span>Laporan ini akan ditandai selesai/diarsipkan tanpa sanksi tambahan.</span>
            )}
            {action.type === 'review_report' && (
              <span>Status laporan akan diperbarui menjadi &quot;Ditinjau&quot; agar tim moderator mengetahui bahwa investigasi sedang berjalan.</span>
            )}
          </div>

          {actionError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{actionError}</span>
            </div>
          )}

          {/* Kolom Alasan Tindakan Admin */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Alasan Tindakan Admin {action.requireReason !== false && <span className="text-rose-500">*</span>}
            </label>
            <textarea
              value={adminReason}
              onChange={(e) => onReasonChange(e.target.value)}
              rows={2}
              placeholder={
                action.requireReason === false
                  ? "Tuliskan catatan opsional..."
                  : "Tuliskan alasan untuk audit log (contoh: Barang terbukti melanggar aturan)..."
              }
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-hidden resize-none"
              autoFocus={!isLayeredConfirmRequired}
            />
            <p className="text-[10px] text-slate-400 mt-0.5">
              {action.requireReason === false
                ? "Catatan ini bersifat opsional."
                : "Alasan ini wajib diisi dan akan dicatat pada riwayat log moderasi."}
            </p>
          </div>

          {/* Konfirmasi Berlapis untuk Tindakan Penghapusan Permanen */}
          {isLayeredConfirmRequired && (
            <div className="p-3 bg-rose-50/80 border border-rose-200 rounded-lg space-y-2.5 text-xs text-rose-950">
              <div className="flex items-center gap-1.5 text-rose-700 font-bold text-xs">
                <AlertOctagon className="w-4 h-4 shrink-0" />
                <span>Konfirmasi Keamanan Berlapis</span>
              </div>
              <p className="text-[11px] text-rose-800 leading-relaxed">
                Penghapusan permanen tidak dapat dibatalkan. Pastikan Anda telah mempertimbangkan opsi menyembunyikan produk terlebih dahulu.
              </p>

              {/* Checkbox Pernyataan */}
              <label className="flex items-start gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={acknowledgedRisk}
                  onChange={(e) => setAcknowledgedRisk(e.target.checked)}
                  className="mt-0.5 rounded border-rose-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                />
                <span className="text-[11px] text-rose-900 font-medium leading-tight">
                  Saya memahami risiko dan mengonfirmasi penghapusan permanen ini.
                </span>
              </label>

              {/* Ketik HAPUS */}
              <div className="space-y-1 pt-1">
                <label className="block text-[11px] text-rose-800 font-semibold">
                  Ketik <strong className="text-rose-950 font-mono">HAPUS</strong> untuk melanjutkan:
                </label>
                <input
                  type="text"
                  value={doubleConfirmText}
                  onChange={(e) => setDoubleConfirmText(e.target.value)}
                  placeholder="Ketik kata HAPUS di sini..."
                  className="w-full px-2.5 py-1.5 bg-white border border-rose-300 rounded text-xs text-rose-950 placeholder:text-rose-300 focus:outline-hidden focus:border-rose-600 font-mono tracking-wider uppercase"
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="sticky bottom-0 -mx-4 -mb-4 flex items-center gap-2 border-t border-slate-200 bg-white p-4 sm:static sm:mx-0 sm:mb-0 sm:justify-end sm:p-0 sm:pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isExecuting}
              className="h-11 flex-1 px-3 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md sm:h-9 sm:flex-none"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isExecuting || !isLayeredValid || (action.requireReason !== false && !adminReason.trim())}
              className={`h-11 flex-1 justify-center px-4 text-white text-xs font-semibold rounded-md flex items-center gap-1.5 disabled:opacity-50 sm:h-9 sm:flex-none ${
                action.isDestructive
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isExecuting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{action.confirmButtonText}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
