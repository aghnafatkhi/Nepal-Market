'use client';

import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

interface AdminToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const AdminToast: React.FC<AdminToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div
      id="admin-toast-container"
      className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, toast.duration || 4500);

    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg border shadow-lg transition-all transform animate-in slide-in-from-top-2 duration-200 ${
        isSuccess
          ? 'bg-emerald-900/95 text-white border-emerald-700 shadow-emerald-950/20'
          : isError
          ? 'bg-rose-900/95 text-white border-rose-700 shadow-rose-950/20'
          : 'bg-slate-900/95 text-white border-slate-700 shadow-slate-950/20'
      }`}
    >
      <div className="shrink-0 mt-0.5">
        {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-300" />}
        {isError && <AlertCircle className="w-4 h-4 text-rose-300" />}
        {!isSuccess && !isError && <Info className="w-4 h-4 text-sky-300" />}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold leading-tight">{toast.title}</p>
        {toast.message && (
          <p className="text-[11px] opacity-90 mt-0.5 leading-snug break-words">
            {toast.message}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 p-1 rounded hover:bg-white/10 text-white/70 hover:text-white transition-colors"
        aria-label="Tutup notifikasi"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
