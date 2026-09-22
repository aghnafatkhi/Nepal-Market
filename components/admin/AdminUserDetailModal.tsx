'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  X,
  ExternalLink,
  UserX,
  UserCheck,
  Calendar,
  Shield,
  Mail,
  Phone,
  Package,
  Copy,
  Check,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { AdminProductItem, AdminUserItem } from '@/lib/supabase/moderation';
import { AdminStatusBadge } from './AdminStatusBadge';

interface AdminUserDetailModalProps {
  user: AdminUserItem | null;
  currentAdminId: string | null;
  userProducts: AdminProductItem[];
  isOpen: boolean;
  onClose: () => void;
  onSuspendUser: (user: AdminUserItem) => void;
  onUnsuspendUser: (user: AdminUserItem) => void;
  onSelectProduct?: (prod: AdminProductItem) => void;
}

const formatRupiah = (val: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(val);
};

export const AdminUserDetailModal: React.FC<AdminUserDetailModalProps> = ({
  user,
  currentAdminId,
  userProducts,
  isOpen,
  onClose,
  onSuspendUser,
  onUnsuspendUser,
  onSelectProduct,
}) => {
  const [isCopiedId, setIsCopiedId] = useState(false);

  useEffect(() => {
    setIsCopiedId(false);
  }, [user]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  const isSelf = Boolean(currentAdminId && user.id === currentAdminId);

  const handleCopyId = () => {
    navigator.clipboard.writeText(user.id);
    setIsCopiedId(true);
    setTimeout(() => setIsCopiedId(false), 2000);
  };

  const formattedJoinDate = new Date(user.created_at).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const activeProducts = userProducts.filter((p) => p.status === 'active');
  const hiddenProducts = userProducts.filter((p) => p.status === 'hidden' || p.status === 'removed');

  return (
    <div
      id="admin-user-detail-modal-portal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="admin-user-detail-modal-content"
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-800 font-bold flex items-center justify-center text-sm overflow-hidden relative shrink-0 border border-slate-300">
              {user.avatar_url ? (
                <Image
                  src={user.avatar_url}
                  alt={user.name}
                  fill
                  sizes="40px"
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                user.name.charAt(0).toUpperCase()
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 truncate">
                  {user.name}
                </h2>
                {isSelf && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                    Akun Anda
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 font-mono truncate">
                @{user.username}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <AdminStatusBadge
              status={user.role === 'admin' ? 'admin_role' : 'user_role'}
              label={user.role === 'admin' ? 'Administrator' : 'Anggota'}
            />
            <AdminStatusBadge
              status={user.is_suspended ? 'suspended' : 'user_active'}
              label={user.is_suspended ? 'Dinonaktifkan' : 'Aktif'}
            />
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
              aria-label="Tutup modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-5 space-y-5 text-xs text-slate-700 divide-y divide-slate-100">
          {/* Section 1: Ringkasan Akun */}
          <div className="space-y-3 pb-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  Tanggal Bergabung
                </span>
                <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  {formattedJoinDate}
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  Peran Akses
                </span>
                <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-blue-600" />
                  {user.role === 'admin' ? 'Administrator Sistem' : 'Pengguna Pasar (Anggota)'}
                </p>
              </div>
            </div>

            {/* Kotak Peringatan jika Akun Ditangguhkan */}
            {user.is_suspended && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-1.5 text-rose-900">
                <div className="flex items-center gap-1.5 font-bold text-rose-700">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Akun Sedang Dinonaktifkan (Suspended)</span>
                </div>
                <p className="text-xs text-rose-800 leading-relaxed">
                  <strong>Alasan Penangguhan:</strong> {user.suspension_reason || 'Tidak ada catatan alasan yang tersimpan.'}
                </p>
              </div>
            )}

            {/* Copyable UUID */}
            <div className="flex items-center justify-between p-2.5 bg-slate-50/70 border border-slate-200/60 rounded-lg">
              <span className="text-[11px] text-slate-500 font-mono">User ID: {user.id}</span>
              <button
                type="button"
                onClick={handleCopyId}
                className="inline-flex items-center gap-1 text-slate-700 hover:text-blue-600 font-mono text-[10px] bg-white px-2 py-1 rounded border border-slate-200 transition-colors cursor-pointer"
              >
                {isCopiedId ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-600">Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-slate-400" />
                    <span>Salin ID</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Section 2: Data Kontak Terproteksi (Privat) */}
          <div className="pt-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                <span>Informasi Kontak Privat (Terproteksi)</span>
              </h3>
              <span className="text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                Hanya Terlihat oleh Admin
              </span>
            </div>

            <div className="p-3.5 bg-amber-50/40 border border-amber-200/70 rounded-xl space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-start gap-2.5 bg-white p-2.5 rounded-lg border border-slate-200">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Email</span>
                    <p className="font-semibold text-slate-900 truncate">
                      {user.email || <span className="text-slate-400 font-normal italic">Tidak dicantumkan</span>}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 bg-white p-2.5 rounded-lg border border-slate-200">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Nomor Telepon</span>
                    <p className="font-semibold text-slate-900 truncate">
                      {user.phone || <span className="text-slate-400 font-normal italic">Belum diatur</span>}
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-slate-500 leading-tight">
                Data kontak ini tidak ditampilkan pada daftar utama demi privasi pengguna dan pencegahan spam.
              </p>
            </div>
          </div>

          {/* Section 3: Ringkasan Produk & Listing Pengguna */}
          <div className="pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-slate-500" />
                <span>Katalog Produk Pengguna ({userProducts.length})</span>
              </h3>
              <div className="flex items-center gap-2 text-[11px] font-mono">
                <span className="text-emerald-700 font-semibold">{activeProducts.length} Aktif</span>
                <span className="text-slate-300">•</span>
                <span className="text-amber-700 font-semibold">{hiddenProducts.length} Tersembunyi</span>
              </div>
            </div>

            {userProducts.length === 0 ? (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center text-slate-400 space-y-1">
                <Package className="w-6 h-6 mx-auto text-slate-300" />
                <p className="text-xs">Pengguna ini belum pernah mengunggah produk di pasar.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {userProducts.map((p) => (
                  <div
                    key={p.id}
                    className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 hover:border-slate-300 transition-colors shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded bg-slate-100 overflow-hidden relative shrink-0 border border-slate-200">
                        {p.images?.[0] ? (
                          <Image
                            src={p.images[0]}
                            alt={p.title}
                            fill
                            sizes="36px"
                            className="object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[8px] text-slate-400">
                            No foto
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 text-xs truncate">
                          {p.title}
                        </p>
                        <p className="text-[11px] font-semibold text-blue-600">
                          {formatRupiah(p.price)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <AdminStatusBadge status={p.status} />
                      {onSelectProduct && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onSelectProduct(p);
                          }}
                          className="px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-[11px] font-medium transition-colors cursor-pointer"
                        >
                          Rincian
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <Link
            href={`/profile/${user.username}`}
            target="_blank"
            className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition-colors inline-flex items-center justify-center gap-1.5 shadow-2xs"
          >
            <span>Buka Profil Publik</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </Link>

          <div className="flex items-center justify-end gap-2">
            {isSelf ? (
              <span className="text-[11px] text-slate-500 italic px-2">
                (Anda tidak dapat menangguhkan akun sendiri)
              </span>
            ) : !user.is_suspended ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSuspendUser(user);
                }}
                className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <UserX className="w-3.5 h-3.5 text-rose-600" />
                <span>Tangguhkan Akun Ini</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onUnsuspendUser(user);
                }}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Cabut Penangguhan Akun</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-lg transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
